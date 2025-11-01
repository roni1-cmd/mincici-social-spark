import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ref, onValue, get } from "firebase/database";
import { database } from "@/lib/firebase";
import { useNavigate } from "react-router-dom";
import { getLastActiveTime } from "@/utils/timeFormat";

interface Follower {
  uid: string;
  username: string;
  displayName: string;
  photoURL: string;
  lastActive?: number;
}

const ActiveFollowers = () => {
  const { user } = useAuth();
  const [activeFollowers, setActiveFollowers] = useState<Follower[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const followingRef = ref(database, `following/${user.uid}`);
    const unsubscribe = onValue(followingRef, async (snapshot) => {
      if (!snapshot.exists()) {
        setActiveFollowers([]);
        return;
      }

      const followingIds = Object.keys(snapshot.val());
      const followersData: Follower[] = [];

      await Promise.all(
        followingIds.map(async (uid) => {
          const userRef = ref(database, `users/${uid}`);
          const userSnapshot = await get(userRef);
          if (userSnapshot.exists()) {
            const userData = userSnapshot.val();
            followersData.push({
              uid,
              username: userData.username || "",
              displayName: userData.displayName || "",
              photoURL: userData.photoURL || "",
              lastActive: userData.lastActive || 0,
            });
          }
        })
      );

      // Sort by most recently active
      followersData.sort((a, b) => (b.lastActive || 0) - (a.lastActive || 0));
      setActiveFollowers(followersData.slice(0, 5));
    });

    return () => unsubscribe();
  }, [user]);

  if (activeFollowers.length === 0) {
    return (
      <div className="bg-muted/50 rounded-lg p-4">
        <h3 className="font-bold mb-3">Active Followers</h3>
        <p className="text-sm text-muted-foreground">No active followers</p>
      </div>
    );
  }

  return (
    <div className="bg-muted/50 rounded-lg p-4">
      <h3 className="font-bold mb-3">Active Followers</h3>
      <div className="space-y-3">
        {activeFollowers.map((follower) => (
          <div
            key={follower.uid}
            className="flex items-center gap-3 cursor-pointer hover:bg-muted/80 p-2 rounded-lg transition-colors"
            onClick={() => navigate(`/profile/${follower.uid}`)}
          >
            <div className="relative">
              <Avatar className="h-10 w-10">
                {follower.photoURL ? (
                  <AvatarImage src={follower.photoURL} alt={follower.username} />
                ) : (
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {follower.username?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                )}
              </Avatar>
              {follower.lastActive && Date.now() - follower.lastActive < 5 * 60 * 1000 && (
                <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-card" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{follower.displayName}</p>
              <p className="text-xs text-muted-foreground truncate">
                {getLastActiveTime(follower.lastActive)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActiveFollowers;
