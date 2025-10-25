import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ref, onValue, get, update } from "firebase/database";
import { database } from "@/lib/firebase";
import { Heart } from "lucide-react";

interface MutualFollower {
  uid: string;
  username: string;
  displayName: string;
  photoURL: string;
}

interface RelationshipDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const RelationshipDialog = ({ isOpen, onClose }: RelationshipDialogProps) => {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [mutualFollowers, setMutualFollowers] = useState<MutualFollower[]>([]);
  const [currentPartner, setCurrentPartner] = useState<MutualFollower | null>(null);

  useEffect(() => {
    if (!isOpen || !user) return;

    // Fetch mutual followers
    const followersRef = ref(database, `followers/${user.uid}`);
    const followingRef = ref(database, `following/${user.uid}`);

    const fetchMutualFollowers = async () => {
      const [followersSnapshot, followingSnapshot] = await Promise.all([
        get(followersRef),
        get(followingRef),
      ]);

      if (followersSnapshot.exists() && followingSnapshot.exists()) {
        const followerIds = Object.keys(followersSnapshot.val());
        const followingIds = Object.keys(followingSnapshot.val());
        const mutualIds = followerIds.filter((id) => followingIds.includes(id));

        const mutualUsers: MutualFollower[] = [];
        for (const uid of mutualIds) {
          const userRef = ref(database, `users/${uid}`);
          const snapshot = await get(userRef);
          if (snapshot.exists()) {
            mutualUsers.push({
              uid,
              ...snapshot.val(),
            });
          }
        }
        setMutualFollowers(mutualUsers);
      }
    };

    fetchMutualFollowers();

    // Fetch current relationship status
    if (userProfile?.relationshipWith) {
      const partnerRef = ref(database, `users/${userProfile.relationshipWith}`);
      get(partnerRef).then((snapshot) => {
        if (snapshot.exists()) {
          setCurrentPartner({
            uid: userProfile.relationshipWith,
            ...snapshot.val(),
          });
        }
      });
    }
  }, [isOpen, user, userProfile]);

  const handleSetRelationship = async (partnerId: string) => {
    if (!user) return;

    try {
      await update(ref(database, `users/${user.uid}`), {
        relationshipWith: partnerId,
      });

      toast({
        title: "Relationship status updated!",
        description: "Your relationship status has been set.",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update relationship status.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveRelationship = async () => {
    if (!user) return;

    try {
      await update(ref(database, `users/${user.uid}`), {
        relationshipWith: null,
      });

      setCurrentPartner(null);
      toast({
        title: "Relationship status cleared",
        description: "Your relationship status has been removed.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear relationship status.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Relationship Status</DialogTitle>
        </DialogHeader>

        {currentPartner ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  {currentPartner.photoURL ? (
                    <AvatarImage src={currentPartner.photoURL} alt={currentPartner.username} />
                  ) : (
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {currentPartner.username?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">{currentPartner.displayName}</p>
                  <p className="text-muted-foreground text-xs">@{currentPartner.username}</p>
                </div>
              </div>
              <Heart className="h-5 w-5 text-red-500 fill-red-500" />
            </div>
            <Button variant="destructive" onClick={handleRemoveRelationship} className="w-full">
              Clear Relationship Status
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select a mutual follower to set your relationship status:
            </p>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {mutualFollowers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No mutual followers available
                </p>
              ) : (
                mutualFollowers.map((person) => (
                  <div
                    key={person.uid}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        {person.photoURL ? (
                          <AvatarImage src={person.photoURL} alt={person.username} />
                        ) : (
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {person.username?.charAt(0).toUpperCase() || "U"}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <p className="font-semibold text-sm">{person.displayName}</p>
                        <p className="text-muted-foreground text-xs">@{person.username}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleSetRelationship(person.uid)}
                    >
                      Select
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RelationshipDialog;
