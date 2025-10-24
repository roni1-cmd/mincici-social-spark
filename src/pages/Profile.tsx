import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Lock, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PostCard from "@/components/PostCard";
import { FeedSkeleton } from "@/components/LoadingSkeleton";
import { ref, onValue, query, orderByChild, equalTo } from "firebase/database";
import { database } from "@/lib/firebase";

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
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const userInitial = userProfile?.username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U";

  // Get privacy settings from userProfile (you'll need to add these to the Settings page state management)
  const isPrivate = userProfile?.isPrivate || false;
  const showActivityStatus = userProfile?.showActivity !== false;
  const isOnline = showActivityStatus; // In a real app, you'd track this with presence

  useEffect(() => {
    if (!user) return;

    const postsRef = ref(database, "posts");
    const userPostsQuery = query(postsRef, orderByChild("userId"), equalTo(user.uid));

    const unsubscribe = onValue(userPostsQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const postsArray = Object.entries(data).map(([id, post]: [string, any]) => ({
          id,
          ...post,
        }));
        // Sort by timestamp descending
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
  }, [user]);

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
                    {userProfile?.photoURL ? (
                      <AvatarImage src={userProfile.photoURL} alt={userProfile.username} />
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
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold">{userProfile?.displayName || user?.email?.split("@")[0]}</h3>
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
                  <p className="text-muted-foreground">@{userProfile?.username || user?.email?.split("@")[0]}</p>
                  {userProfile?.bio && (
                    <p className="text-sm mt-2">{userProfile.bio}</p>
                  )}
                  <p className="text-sm text-muted-foreground mt-2">{user?.email}</p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">{posts.length}</div>
                  <div className="text-sm text-muted-foreground">Posts</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">0</div>
                  <div className="text-sm text-muted-foreground">Followers</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">0</div>
                  <div className="text-sm text-muted-foreground">Following</div>
                </div>
              </div>
            </Card>

            <div className="mt-6">
              <h3 className="font-bold text-lg mb-4">Your Posts</h3>
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
    </div>
  );
};

export default Profile;
