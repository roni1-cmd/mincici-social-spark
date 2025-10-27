import { useEffect, useState } from "react";
import { ref, onValue, query, orderByChild } from "firebase/database";
import { database } from "@/lib/firebase";
import Sidebar from "@/components/Sidebar";
import CreatePost from "@/components/CreatePost";
import PostCard from "@/components/PostCard";
import { FeedSkeleton } from "@/components/LoadingSkeleton";

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

const Home = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const postsRef = ref(database, "posts");
    const postsQuery = query(postsRef, orderByChild("timestamp"));

    const unsubscribe = onValue(postsQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const postsArray = Object.entries(data).map(([id, post]: [string, any]) => ({
          id,
          ...post,
        }));
        setPosts(postsArray.reverse());
      } else {
        setPosts([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar — NO BORDER, same background as page */}
      <div className="fixed inset-y-0 left-0 z-20 w-64 bg-background lg:static lg:inset-auto">
        <Sidebar />
      </div>

      {/* Main Feed — Full width, no borders, same background */}
      <main className="flex-1 lg:ml-64 mt-14 lg:mt-0 bg-background">
        <div className="max-w-2xl mx-auto">
          {/* Sticky Header — No border, softer blur */}
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm p-4">
            <h2 className="text-xl font-bold">Home</h2>
          </div>

          <div className="p-4">
            <CreatePost />

            {loading ? (
              <FeedSkeleton />
            ) : posts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg">No posts yet</p>
                <p className="text-sm">Be the first to share something!</p>
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
      </main>

      {/* Trending Sidebar (XL+) — No borders, soft background */}
      <aside className="hidden xl:block w-80 p-4 bg-background">
        <div className="sticky top-4">
          <div className="bg-muted/40 rounded-lg p-4">
            <h3 className="font-bold mb-3">Trending</h3>
            <p className="text-sm text-muted-foreground">Nothing trending yet</p>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default Home;
