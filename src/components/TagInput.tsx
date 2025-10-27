import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ref, get } from "firebase/database";
import { database } from "@/lib/firebase";
import { Badge } from "@/components/ui/badge";
import { X, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TagInputProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

interface Follower {
  uid: string;
  username: string;
  displayName: string;
  photoURL: string;
}

const TagInput = ({ selectedTags, onTagsChange }: TagInputProps) => {
  const { user } = useAuth();
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!user) return;

    const fetchFollowers = async () => {
      const followingRef = ref(database, `following/${user.uid}`);
      const followingSnapshot = await get(followingRef);

      if (followingSnapshot.exists()) {
        const followingIds = Object.keys(followingSnapshot.val());
        const followersRef = ref(database, `followers/${user.uid}`);
        const followersSnapshot = await get(followersRef);

        if (followersSnapshot.exists()) {
          const followerIds = Object.keys(followersSnapshot.val());
          const mutualIds = followingIds.filter((id) => followerIds.includes(id));

          const followersData = await Promise.all(
            mutualIds.map(async (id) => {
              const userRef = ref(database, `users/${id}`);
              const userSnapshot = await get(userRef);
              return { uid: id, ...userSnapshot.val() };
            })
          );

          setFollowers(followersData);
        }
      }
    };

    fetchFollowers();
  }, [user]);

  const handleSelectTag = (userId: string, username: string) => {
    if (!selectedTags.includes(userId)) {
      onTagsChange([...selectedTags, userId]);
    }
    setOpen(false);
  };

  const handleRemoveTag = (userId: string) => {
    onTagsChange(selectedTags.filter((id) => id !== userId));
  };

  const getTaggedUser = (userId: string) => {
    return followers.find((f) => f.uid === userId);
  };

  const filteredFollowers = followers.filter(
    (f) =>
      !selectedTags.includes(f.uid) &&
      (f.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.username?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {selectedTags.map((userId) => {
          const user = getTaggedUser(userId);
          if (!user) return null;
          return (
            <Badge key={userId} variant="secondary" className="gap-1">
              @{user.username}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() => handleRemoveTag(userId)}
              />
            </Badge>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Tag followers
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tag followers</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Search followers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {filteredFollowers.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No followers found</p>
              ) : (
                filteredFollowers.map((follower) => (
                  <div
                    key={follower.uid}
                    className="flex items-center gap-3 p-2 hover:bg-muted rounded-lg cursor-pointer transition-colors"
                    onClick={() => handleSelectTag(follower.uid, follower.username)}
                  >
                    <Avatar className="h-10 w-10">
                      {follower.photoURL ? (
                        <AvatarImage src={follower.photoURL} alt={follower.username} />
                      ) : (
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {follower.username?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{follower.displayName}</p>
                      <p className="text-sm text-muted-foreground truncate">@{follower.username}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TagInput;
