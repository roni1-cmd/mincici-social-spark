import { createContext, useContext, useEffect, useState } from "react";
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { auth, database } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { ref, get, set } from "firebase/database";

interface UserProfile {
  username: string;
  displayName: string;
  bio: string;
  photoURL: string;
  createdAt: number;
  isPrivate?: boolean;
  showActivity?: boolean;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  checkUsernameAvailable: (username: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Fetch user profile
        const profileRef = ref(database, `users/${user.uid}`);
        const snapshot = await get(profileRef);
        if (snapshot.exists()) {
          setUserProfile(snapshot.val());
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const checkUsernameAvailable = async (username: string): Promise<boolean> => {
    const usernamesRef = ref(database, `usernames/${username.toLowerCase()}`);
    const snapshot = await get(usernamesRef);
    return !snapshot.exists();
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    
    const profileRef = ref(database, `users/${user.uid}`);
    const currentProfile = userProfile || {
      username: "",
      displayName: "",
      bio: "",
      photoURL: "",
      createdAt: Date.now()
    };
    
    const updatedProfile = { ...currentProfile, ...updates };
    await set(profileRef, updatedProfile);
    setUserProfile(updatedProfile);
  };

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Welcome back!",
        description: "You've successfully signed in.",
      });
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      // Create initial profile
      const profileRef = ref(database, `users/${result.user.uid}`);
      const initialProfile: UserProfile = {
        username: "",
        displayName: email.split("@")[0],
        bio: "",
        photoURL: "",
        createdAt: Date.now()
      };
      await set(profileRef, initialProfile);
      setUserProfile(initialProfile);
      
      toast({
        title: "Account created!",
        description: "Welcome to mincici.",
      });
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Check if profile exists
      const profileRef = ref(database, `users/${result.user.uid}`);
      const snapshot = await get(profileRef);
      
      if (!snapshot.exists()) {
        // Create profile for new Google users
        const initialProfile: UserProfile = {
          username: "",
          displayName: result.user.displayName || result.user.email?.split("@")[0] || "User",
          bio: "",
          photoURL: result.user.photoURL || "",
          createdAt: Date.now()
        };
        await set(profileRef, initialProfile);
        setUserProfile(initialProfile);
      }
      
      toast({
        title: "Welcome!",
        description: "You've successfully signed in with Google.",
      });
    } catch (error: any) {
      toast({
        title: "Google sign in failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      toast({
        title: "Signed out",
        description: "See you soon!",
      });
    } catch (error: any) {
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      userProfile, 
      loading, 
      signIn, 
      signUp, 
      signInWithGoogle, 
      signOut,
      updateUserProfile,
      checkUsernameAvailable
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
