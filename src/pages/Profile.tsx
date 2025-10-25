import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Lock, Globe, UserPlus, UserMinus, Heart } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import PostCard from "@/components/PostCard";
import { FeedSkeleton } from "@/components/LoadingSkeleton";
import CreatePost from "@/components/CreatePost";
import { ref, onValue, query, orderByChild, equalTo, get, update, push } from "firebase/database";
import { database } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import FollowersDialog from "@/components/FollowersDialog";
import { supabase, RELATIONSHIP_STATUS_LABELS, RelationshipStatusType } from "@/lib/supabase";

interface Post {
  id: string;
  userId: string;
  userEmail: string;
  username?: string;
  displayName?: string;
  photoURL?: string;
  content: string;
  imageUrl?: string;
  timestamp: string;
  likes: number;
  likedBy?: string[];
  commentsCount?: number;
}

const Profile = () => {
  const { userId } = useParams();
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followersDialogOpen, setFollowersDialogOpen] = useState(false);
  const [followersDialogTab, setFollowersDialogTab] = useState<"followers" | "following">("followers");
  const [relationshipStatus, setRelationshipStatus] = useState<any>(null);
  const [relationshipPartner, setRelationshipPartner] = useState<any>(null);
  
  const isOwnProfile = !userId || userId === user?.uid;
  const displayProfile = isOwnProfile ? userProfile : profileData;
  
  const userInitial = displayProfile?.username?.charAt(0).toUpperCase() || displayProfile?.email?.charAt(0).toUpperCase() || "U";

  const isPrivate = displayProfile?.isPrivate || false;
  const showActivityStatus = displayProfile?.showActivity !== false;
  const isOnline = showActivityStatus;

  useEffect(() => {
    if (!userId || userId === user?.uid) return;

    const fetchProfileData = async () => {
      const profileRef = ref(database, `users/${userId}`);
      const snapshot = await get(profileRef);
      if (snapshot.exists()) {
        setProfileData(snapshot.val());
      }
    };

    fetchProfileData();
  }, [userId, user]);

  useEffect(() => {
    const targetUserId = userId || user?.uid;
    if (!targetUserId) return;

    const postsRef = ref(database, "posts");
    const userPostsQuery = query(postsRef, orderByChild("userId"), equalTo(targetUserId));

    const unsubscribe = onValue(userPostsQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const postsArray = Object.entries(data).map(([id, post]: [string, any]) => ({
          id,
          ...post,
        }));
        postsArray.sort((a, b) => {
          const timeA = new Date(a.timestamp).getTime();
          const timeB = new Date(b.timestamp).getTime();
          return timeB - timeA;
        });
        setPosts(postsArray);
      } else {
        setPosts([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, userId]);

  useEffect(() => {
    if (!user || isOwnProfile) return;
    
    const targetUserId = userId || user.uid;
    const followRef = ref(database, `followers/${targetUserId}/${user.uid}`);
    
    const unsubscribe = onValue(followRef, (snapshot) => {
      setIsFollowing(snapshot.exists());
    });
    
    return () => unsubscribe();
  }, [user, userId, isOwnProfile]);

  useEffect(() => {
    const targetUserId = userId || user?.uid;
    if (!targetUserId) return;

    const followersRef = ref(database, `followers/${targetUserId}`);
    const followingRef = ref(database, `following/${targetUserId}`);

    const unsubFollowers = onValue(followersRef, (snapshot) => {
      setFollowersCount(snapshot.exists() ? Object.keys(snapshot.val()).length : 0);
    });

    const unsubFollowing = onValue(followingRef, (snapshot) => {
      setFollowingCount(snapshot.exists() ? Object.keys(snapshot.val()).length : 0);
    });

    return () => {
      unsubFollowers();
      unsubFollowing();
    };
  }, [user, userId]);

  useEffect(() => {
    const targetUserId = userId || user?.uid;
    if (!targetUserId) return;

    const fetchRelationshipStatus = async () => {
      const { data: statusData } = await supabase
        .from('relationship_statuses')
        .select('*')
        .eq('user_id', targetUserId)
        .maybeSingle();

      if (statusData && statusData.partner_accepted) {
        setRelationshipStatus(statusData);

        if (statusData.partner_id) {
          const partnerRef = ref(database, `users/${statusData.partner_id}`);
          const partnerSnapshot = await get(partnerRef);
          if (partnerSnapshot.exists()) {
            setRelationshipPartner({
              uid: statusData.partner_id,
              ...partnerSnapshot.val(),
            });
          }
        } else {
          setRelationshipPartner(null);
        }
      } else {
        setRelationshipStatus(null);
        setRelationshipPartner(null);
      }
    };

    fetchRelationshipStatus();

    const subscription = supabase
      .channel('relationship_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'relationship_statuses',
          filter: `user_id=eq.${targetUserId}`
        },
        () => {
          fetchRelationshipStatus();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, userId]);

  const handleFollow = async () => {
    if (!user || !userId) return;

    try {
      if (isFollowing) {
        await update(ref(database), {
          [`followers/${userId}/${user.uid}`]: null,
          [`following/${user.uid}/${userId}`]: null,
        });
        toast({
          title: "Unfollowed",
          description: "You are no longer following this user.",
        });
      } else {
        await update(ref(database), {
          [`followers/${userId}/${user.uid}`]: true,
          [`following/${user.uid}/${userId}`]: true,
        });
        toast({
          title: "Following",
          description: "You are now following this user.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update follow status.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      
      <main className="flex-1 lg:ml-0 mt-14 lg:mt-0">
        <div className="max-w-2xl mx-auto">
          <div className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border p-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">Profile</h2>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate("/settings")}
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>

          <div className="p-4">
            <Card className="p-6">
              <div className="flex items-start space-x-4">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    {displayProfile?.photoURL ? (
                      <AvatarImage src={displayProfile.photoURL} alt={displayProfile.username} />
                    ) : (
                      <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                        {userInitial}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  {showActivityStatus && isOnline && (
                    <div className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-card" />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold">{displayProfile?.displayName || displayProfile?.email?.split("@")[0] || "User"}</h3>
                      {isPrivate ? (
                        <Badge variant="secondary" className="gap-1">
                          <Lock className="h-3 w-3" />
                          Private
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <Globe className="h-3 w-3" />
                          Public
                        </Badge>
                      )}
                    </div>
                    {!isOwnProfile && (
                      <Button
                        variant={isFollowing ? "outline" : "default"}
                        size="sm"
                        onClick={handleFollow}
                        className="gap-2"
                      >
                        {isFollowing ? (
                          <>
                            <UserMinus className="h-4 w-4" />
                            Unfollow
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4" />
                            Follow
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  <p className="text-muted-foreground">@{displayProfile?.username || displayProfile?.email?.split("@")[0] || "user"}</p>
                  {displayProfile?.bio && (
                    <p className="text-sm mt-2">{displayProfile.bio}</p>
                  )}
                  {isOwnProfile && <p className="text-sm text-muted-foreground mt-2">{user?.email}</p>}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-around text-center">
                <div>
                  <div className="text-xl font-bold">{posts.length}</div>
                  <div className="text-xs text-muted-foreground">Posts</div>
                </div>
                <div
                  className="cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors"
                  onClick={() => {
                    if (!isPrivate || isOwnProfile) {
                      setFollowersDialogTab("followers");
                      setFollowersDialogOpen(true);
                    }
                  }}
                >
                  <div className="text-xl font-bold">{!isPrivate || isOwnProfile ? followersCount : "•"}</div>
                  <div className="text-xs text-muted-foreground">Followers</div>
                </div>
                <div
                  className="cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors"
                  onClick={() => {
                    if (!isPrivate || isOwnProfile) {
                      setFollowersDialogTab("following");
                      setFollowersDialogOpen(true);
                    }
                  }}
                >
                  <div className="text-xl font-bold">{!isPrivate || isOwnProfile ? followingCount : "•"}</div>
                  <div className="text-xs text-muted-foreground">Following</div>
                </div>
              </div>

              {relationshipStatus && (
                <div className="mt-4 p-3 rounded-lg bg-muted">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-red-500 fill-red-500" />
                      <span className="text-sm">{RELATIONSHIP_STATUS_LABELS[relationshipStatus.status_type as RelationshipStatusType]}</span>
                    </div>
                    {relationshipPartner && (
                      <div
                        className="flex items-center gap-2 cursor-pointer hover:opacity-80"
                        onClick={() => navigate(`/profile/${relationshipPartner.uid}`)}
                      >
                        <Avatar className="h-6 w-6">
                          {relationshipPartner.photoURL ? (
                            <AvatarImage src={relationshipPartner.photoURL} alt={relationshipPartner.username} />
                          ) : (
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                              {relationshipPartner.username?.charAt(0).toUpperCase() || "U"}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <span className="text-sm font-semibold">{relationshipPartner.displayName}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>

            {isOwnProfile && (
              <div className="mt-6">
                <CreatePost />
              </div>
            )}

            <div className="mt-6">
              <h3 className="font-bold text-lg mb-4">{isOwnProfile ? "Your Posts" : "Posts"}</h3>
              {loading ? (
                <FeedSkeleton />
              ) : posts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No posts yet</p>
                </div>
              ) : (
                posts.map((post) => (
                  <PostCard
                    key={post.id}
                    postId={post.id}
                    userId={post.userId}
                    userEmail={post.userEmail}
                    username={post.username}
                    displayName={post.displayName}
                    photoURL={post.photoURL}
                    content={post.content}
                    imageUrl={post.imageUrl}
                    timestamp={post.timestamp}
                    likes={post.likes}
                    likedBy={post.likedBy}
                    commentsCount={post.commentsCount}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      <FollowersDialog
        userId={userId || user?.uid || ""}
        isOpen={followersDialogOpen}
        onClose={() => setFollowersDialogOpen(false)}
        defaultTab={followersDialogTab}
      />
    </div>
  );
};

export default Profile;
