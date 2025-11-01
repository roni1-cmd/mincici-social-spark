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
  const [relationshipPartner, setRelationshipPartner] = useState<any>(null);

  const isOwnProfile = !userId || userId === user?.uid;
  const displayProfile = isOwnProfile ? userProfile : profileData;

  const userInitial =
    displayProfile?.username?.charAt(0).toUpperCase() ||
    displayProfile?.email?.charAt(0).toUpperCase() ||
    "U";

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

    const profileRef = ref(database, `users/${targetUserId}`);
    const unsubProfile = onValue(profileRef, async (snapshot) => {
      if (snapshot.exists()) {
        const profile = snapshot.val();
        if (profile.relationshipWith) {
          const partnerRef = ref(database, `users/${profile.relationshipWith}`);
          const partnerSnapshot = await get(partnerRef);
          if (partnerSnapshot.exists()) {
            setRelationshipPartner({
              uid: profile.relationshipWith,
              ...partnerSnapshot.val(),
            });
          }
        } else {
          setRelationshipPartner(null);
        }
      }
    });

    return () => unsubProfile();
  }, [user, userId]);

  const handleFollow = async () => {
    if (!user || !userId) return;

    try {
      if (isFollowing) {
        const postsSnapshot = await get(query(ref(database, "posts"), orderByChild("userId"), equalTo(userId)));
        const commentsSnapshot = await get(ref(database, "comments"));
        const notificationsSnapshot = await get(ref(database, `notifications/${user.uid}`));

        const updates: any = {
          [`followers/${userId}/${user.uid}`]: null,
          [`following/${user.uid}/${userId}`]: null,
        };

        const currentUserRef = ref(database, `users/${user.uid}`);
        const currentUserSnapshot = await get(currentUserRef);
        if (currentUserSnapshot.exists()) {
          const currentUserData = currentUserSnapshot.val();
          if (currentUserData.relationshipWith === userId) {
            updates[`users/${user.uid}/relationshipWith`] = null;
            updates[`users/${user.uid}/relationshipStatus`] = null;
          }
        }

        const otherUserRef = ref(database, `users/${userId}`);
        const otherUserSnapshot = await get(otherUserRef);
        if (otherUserSnapshot.exists()) {
          const otherUserData = otherUserSnapshot.val();
          if (otherUserData.relationshipWith === user.uid) {
            updates[`users/${userId}/relationshipWith`] = null;
            updates[`users/${userId}/relationshipStatus`] = null;
          }
        }

        if (postsSnapshot.exists()) {
          Object.entries(postsSnapshot.val()).forEach(([postId, post]: [string, any]) => {
            const likedBy = post.likedBy || [];
            const reactions = post.reactions || {};
            if (likedBy.includes(user.uid)) {
              const newLikedBy = likedBy.filter((id: string) => id !== user.uid);
              updates[`posts/${postId}/likedBy`] = newLikedBy.length > 0 ? newLikedBy : null;
              updates[`posts/${postId}/likes`] = newLikedBy.length;
            }
            if (reactions[user.uid]) {
              delete reactions[user.uid];
              updates[`posts/${postId}/reactions`] = Object.keys(reactions).length > 0 ? reactions : null;
            }
          });
        }

        if (commentsSnapshot.exists()) {
          Object.entries(commentsSnapshot.val()).forEach(([postId, comments]: [string, any]) => {
            Object.entries(comments).forEach(([commentId, comment]: [string, any]) => {
              if (comment.userId === user.uid) {
                updates[`comments/${postId}/${commentId}`] = null;
              }
            });
          });
        }

        if (notificationsSnapshot.exists()) {
          Object.entries(notificationsSnapshot.val()).forEach(([notifId, notif]: [string, any]) => {
            if (notif.fromUserId === userId) {
              updates[`notifications/${user.uid}/${notifId}`] = null;
            }
          });
        }

        await update(ref(database), updates);

        toast({
          title: "Unfollowed",
          description: "You are no longer following this user.",
        });
      } else {
        await update(ref(database), {
          [`followers/${userId}/${user.uid}`]: true,
          [`following/${user.uid}/${userId}`]: true,
        });

        const notificationRef = push(ref(database, `notifications/${userId}`));
        await update(notificationRef, {
          type: "follow",
          fromUserId: user.uid,
          fromUsername: userProfile?.username || "",
          fromDisplayName: userProfile?.displayName || "",
          fromPhotoURL: userProfile?.photoURL || "",
          timestamp: Date.now(),
          read: false,
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
            <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
              <Settings className="h-5 w-5" />
            </Button>
          </div>

          <div className="p-4 space-y-4">
            {/* Cover Photo */}
            <div className="relative h-48 bg-gradient-to-r from-primary/20 to-primary/10 rounded-t-lg" />
            
            {/* Profile Info Card */}
            <Card className="relative -mt-20 p-6">
              {/* Avatar and Follow Button */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-4">
                <div className="relative -mt-16 sm:-mt-16">
                  <Avatar className="h-32 w-32 border-4 border-card">
                    {displayProfile?.photoURL ? (
                      <AvatarImage src={displayProfile.photoURL} alt={displayProfile.username} />
                    ) : (
                      <AvatarFallback className="bg-primary text-primary-foreground text-4xl">
                        {userInitial}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  {showActivityStatus && isOnline && (
                    <div className="absolute bottom-2 right-2 h-6 w-6 rounded-full bg-green-500 border-4 border-card" />
                  )}
                </div>

                <div className="flex-1 flex flex-col sm:flex-row items-center sm:items-start sm:justify-between gap-4 w-full sm:mt-4">
                  <div className="text-center sm:text-left">
                    <h2 className="text-2xl font-bold">
                      {displayProfile?.displayName || displayProfile?.email?.split("@")[0] || "User"}
                    </h2>
                    <p className="text-muted-foreground">
                      @{displayProfile?.username || displayProfile?.email?.split("@")[0] || "user"}
                    </p>
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
              </div>

              {/* Bio */}
              {displayProfile?.bio && (
                <p className="text-sm mb-4">{displayProfile.bio}</p>
              )}

              {/* Stats */}
              <div className="flex items-center gap-6 mb-4">
                <div>
                  <span className="font-bold">{posts.length}</span>
                  <span className="text-muted-foreground text-sm ml-1">Posts</span>
                </div>
                <div
                  className="cursor-pointer hover:underline"
                  onClick={() => {
                    if (!isPrivate || isOwnProfile) {
                      setFollowersDialogTab("followers");
                      setFollowersDialogOpen(true);
                    }
                  }}
                >
                  <span className="font-bold">{!isPrivate || isOwnProfile ? followersCount : "•"}</span>
                  <span className="text-muted-foreground text-sm ml-1">Followers</span>
                </div>
                <div
                  className="cursor-pointer hover:underline"
                  onClick={() => {
                    if (!isPrivate || isOwnProfile) {
                      setFollowersDialogTab("following");
                      setFollowersDialogOpen(true);
                    }
                  }}
                >
                  <span className="font-bold">{!isPrivate || isOwnProfile ? followingCount : "•"}</span>
                  <span className="text-muted-foreground text-sm ml-1">Following</span>
                </div>
              </div>

              {/* Privacy Badge */}
              <div className="flex gap-2 mb-4">
                {isPrivate ? (
                  <Badge variant="secondary" className="gap-1">
                    <Lock className="h-3 w-3" />
                    Private Account
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <Globe className="h-3 w-3" />
                    Public Account
                  </Badge>
                )}
              </div>

              {/* Relationship Status */}
              {relationshipPartner && (
                <div className="p-3 rounded-lg bg-muted/50 flex items-center gap-2 mb-4">
                  <Heart className="h-4 w-4 text-red-500 fill-red-500" />
                  <span className="text-sm">
                    {displayProfile?.relationshipStatus === "engaged"
                      ? "Engaged to"
                      : displayProfile?.relationshipStatus === "married"
                      ? "Married to"
                      : displayProfile?.relationshipStatus === "civil_partnership"
                      ? "In a civil partnership with"
                      : "In a relationship with"}
                  </span>
                  <div
                    className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
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
                </div>
              )}

              {displayProfile?.relationshipStatus === "single" && (
                <div className="p-3 rounded-lg bg-muted/50 flex items-center gap-2 mb-4">
                  <Heart className="h-4 w-4" />
                  <span className="text-sm">Single</span>
                </div>
              )}

              {displayProfile?.relationshipStatus === "widowed" && (
                <div className="p-3 rounded-lg bg-muted/50 flex items-center gap-2 mb-4">
                  <Heart className="h-4 w-4" />
                  <span className="text-sm">Widowed</span>
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
