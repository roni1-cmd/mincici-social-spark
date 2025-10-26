import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ref, onValue, get } from "firebase/database";
import { database } from "@/lib/firebase";
import { useNavigate } from "react-router-dom";

interface User {
  uid: string;
  username: string;
  displayName: string;
  photoURL: string;
}

interface FollowersDialogProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "followers" | "following";
}

const FollowersDialog = ({ userId, isOpen, onClose, defaultTab = "followers" }: FollowersDialogProps) => {
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen || !userId) return;

    const fetchUsers = async (userIds: string[]) => {
      const users: User[] = [];
      for (const uid of userIds) {
        const userRef = ref(database, `users/${uid}`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          users.push({
            uid,
            ...snapshot.val(),
          });
        }
      }
      return users;
    };

    const followersRef = ref(database, `followers/${userId}`);
    const followingRef = ref(database, `following/${userId}`);

    const unsubFollowers = onValue(followersRef, async (snapshot) => {
      if (snapshot.exists()) {
        const followerIds = Object.keys(snapshot.val());
        const users = await fetchUsers(followerIds);
        setFollowers(users);
      } else {
        setFollowers([]);
      }
    });

    const unsubFollowing = onValue(followingRef, async (snapshot) => {
      if (snapshot.exists()) {
        const followingIds = Object.keys(snapshot.val());
        const users = await fetchUsers(followingIds);
        setFollowing(users);
      } else {
        setFollowing([]);
      }
    });

    return () => {
      unsubFollowers();
      unsubFollowing();
    };
  }, [userId, isOpen]);

  const handleUserClick = (uid: string) => {
    navigate(`/profile/${uid}`);
    onClose();
  };

  const UserList = ({ users }: { users: User[] }) => (
    <div className="space-y-3 max-h-[400px] overflow-y-auto">
      {users.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No users to show</p>
      ) : (
        users.map((user) => (
          <div
            key={user.uid}
            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors"
            onClick={() => handleUserClick(user.uid)}
          >
            <Avatar className="h-10 w-10">
              {user.photoURL ? (
                <AvatarImage src={user.photoURL} alt={user.username} />
              ) : (
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {user.username?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <p className="font-semibold text-sm">{user.displayName}</p>
              <p className="text-muted-foreground text-xs">@{user.username}</p>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Connections</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="followers">Followers</TabsTrigger>
            <TabsTrigger value="following">Following</TabsTrigger>
          </TabsList>
          
          <TabsContent value="followers" className="mt-4">
            <UserList users={followers} />
          </TabsContent>
          
          <TabsContent value="following" className="mt-4">
            <UserList users={following} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default FollowersDialog;
