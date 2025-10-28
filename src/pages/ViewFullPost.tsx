import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ref, onValue, update, push, get } from "firebase/database";
import { database } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, ArrowLeft, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Post {
  userId: string;
  username: string;
  displayName: string;
  photoURL: string;
  content: string;
  imageUrl?: string;
  timestamp: number;
  likes: number;
  likedBy: string[];
  commentsCount: number;
  taggedUsers?: Array<{ id: string; username: string; displayName: string }>;
}

interface Comment {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  photoURL: string;
  content: string;
  timestamp: number;
  replyTo?: string;
  replyToUsername?: string;
}

const ViewFullPost = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!postId) return;

    const postRef = ref(database, `posts/${postId}`);
    const unsubscribe = onValue(postRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setPost(data);
        setIsLiked(data.likedBy?.includes(user?.uid || "") || false);
        setLikeCount(data.likes || 0);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [postId, user]);

  useEffect(() => {
    if (!postId) return;

    const commentsRef = ref(database, `comments/${postId}`);
    const unsubscribe = onValue(commentsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const commentsArray = Object.entries(data).map(([id, comment]: [string, any]) => ({
          id,
          ...comment,
        }));
        commentsArray.sort((a, b) => a.timestamp - b.timestamp);
        setComments(commentsArray);
      } else {
        setComments([]);
      }
    });

    return () => unsubscribe();
  }, [postId]);


  const handleLike = async () => {
    if (!user || !postId || !post) return;

    const newIsLiked = !isLiked;
    const newLikedBy = newIsLiked
      ? [...(post.likedBy || []), user.uid]
      : (post.likedBy || []).filter((id) => id !== user.uid);

    setIsLiked(newIsLiked);
    setLikeCount(newLikedBy.length);

    try {
      const postRef = ref(database, `posts/${postId}`);
      await update(postRef, {
        likes: newLikedBy.length,
        likedBy: newLikedBy,
      });

      if (newIsLiked && post.userId !== user.uid) {
        const notificationRef = push(ref(database, `notifications/${post.userId}`));
        await update(notificationRef, {
          type: "like",
          fromUserId: user.uid,
          fromUsername: userProfile?.username || "",
          fromDisplayName: userProfile?.displayName || "",
          fromPhotoURL: userProfile?.photoURL || "",
          postId: postId,
          timestamp: Date.now(),
          read: false,
        });
      }
    } catch (error) {
      setIsLiked(!newIsLiked);
      setLikeCount(post.likes);
    }
  };

  const handleComment = async () => {
    if (!user || !postId || !newComment.trim()) return;

    try {
      const commentsRef = ref(database, `comments/${postId}`);
      const newCommentRef = push(commentsRef);
      
      await update(newCommentRef, {
        userId: user.uid,
        username: userProfile?.username || "",
        displayName: userProfile?.displayName || "",
        photoURL: userProfile?.photoURL || "",
        content: newComment.trim(),
        timestamp: Date.now(),
      });

      const postRef = ref(database, `posts/${postId}`);
      await update(postRef, {
        commentsCount: (post?.commentsCount || 0) + 1,
      });

      if (post && post.userId !== user.uid) {
        const notificationRef = push(ref(database, `notifications/${post.userId}`));
        await update(notificationRef, {
          type: "comment",
          fromUserId: user.uid,
          fromUsername: userProfile?.username || "",
          fromDisplayName: userProfile?.displayName || "",
          fromPhotoURL: userProfile?.photoURL || "",
          postId: postId,
          commentContent: newComment.trim(),
          timestamp: Date.now(),
          read: false,
        });
      }

      setNewComment("");
      toast({
        title: "Comment posted",
        description: "Your comment has been added.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to post comment.",
        variant: "destructive",
      });
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return "Just now";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen w-full">
        <Sidebar />
        <main className="flex-1 lg:ml-0 mt-14 lg:mt-0">
          <div className="max-w-3xl mx-auto p-4 space-y-4">
            <div className="h-64 bg-muted animate-pulse rounded-lg" />
            <div className="h-32 bg-muted animate-pulse rounded-lg" />
          </div>
        </main>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex min-h-screen w-full">
        <Sidebar />
        <main className="flex-1 lg:ml-0 mt-14 lg:mt-0">
          <div className="max-w-3xl mx-auto p-4">
            <p className="text-center text-muted-foreground">Post not found</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      
      <main className="flex-1 lg:ml-0 mt-14 lg:mt-0">
        <div className="max-w-3xl mx-auto">
          <div className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border p-4 flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-xl font-bold">Post</h2>
          </div>

          <div className="p-4 space-y-6">
            {/* Post Content */}
            <Card className="p-6">
              <div className="flex items-start gap-3">
                <Avatar 
                  className="h-12 w-12 cursor-pointer" 
                  onClick={() => navigate(`/profile/${post.userId}`)}
                >
                  {post.photoURL ? (
                    <AvatarImage src={post.photoURL} alt={post.username} />
                  ) : (
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {post.username?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  )}
                </Avatar>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="font-semibold cursor-pointer hover:underline"
                      onClick={() => navigate(`/profile/${post.userId}`)}
                    >
                      {post.displayName || post.username}
                    </span>
                    <span className="text-muted-foreground">@{post.username}</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">{formatTime(post.timestamp)}</span>
                  </div>

                  <p className="mt-2 text-lg whitespace-pre-wrap">{post.content}</p>

                  {post.taggedUsers && post.taggedUsers.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <span className="text-sm text-muted-foreground">is with</span>
                      {post.taggedUsers.map((taggedUser, index) => (
                        <span key={taggedUser.id} className="flex items-center gap-1">
                          <Badge
                            variant="secondary"
                            className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                            onClick={() => navigate(`/profile/${taggedUser.id}`)}
                          >
                            {taggedUser.displayName}
                          </Badge>
                          {index < post.taggedUsers.length - 1 && (
                            <span className="text-sm text-muted-foreground">,</span>
                          )}
                        </span>
                      ))}
                    </div>
                  )}

                  {post.imageUrl && (
                    <img
                      src={post.imageUrl}
                      alt="Post content"
                      className="w-full rounded-lg mt-3 max-h-96 object-cover"
                    />
                  )}

                  <div className="flex items-center gap-6 mt-4 pt-4 border-t">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={`gap-2 ${isLiked ? "text-red-500" : ""}`}
                      onClick={handleLike}
                    >
                      <Heart className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`} />
                      <span>{likeCount}</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <MessageCircle className="h-5 w-5" />
                      <span>{comments.length}</span>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Comments Section */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold px-2">
                Comments {comments.length > 0 && `(${comments.length})`}
              </h3>

              {/* Add Comment */}
              <Card className="p-4">
                <div className="flex gap-3">
                  <Avatar className="h-10 w-10">
                    {userProfile?.photoURL ? (
                      <AvatarImage src={userProfile.photoURL} alt={userProfile.username} />
                    ) : (
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {userProfile?.username?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1 flex gap-2">
                    <Input
                      placeholder="Write a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleComment()}
                    />
                    <Button onClick={handleComment} size="icon">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Comments List */}
              {comments.length === 0 ? (
                <Card className="p-8">
                  <p className="text-center text-muted-foreground">No comments yet. Be the first to comment!</p>
                </Card>
              ) : (
                comments.map((comment) => (
                  <Card key={comment.id} className="p-4">
                    <div className="flex gap-3">
                      <Avatar 
                        className="h-10 w-10 cursor-pointer" 
                        onClick={() => navigate(`/profile/${comment.userId}`)}
                      >
                        {comment.photoURL ? (
                          <AvatarImage src={comment.photoURL} alt={comment.username} />
                        ) : (
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {comment.username?.charAt(0).toUpperCase() || "U"}
                          </AvatarFallback>
                        )}
                      </Avatar>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="font-semibold cursor-pointer hover:underline"
                            onClick={() => navigate(`/profile/${comment.userId}`)}
                          >
                            {comment.displayName}
                          </span>
                          <span className="text-sm text-muted-foreground">@{comment.username}</span>
                          <span className="text-sm text-muted-foreground">·</span>
                          <span className="text-sm text-muted-foreground">{formatTime(comment.timestamp)}</span>
                        </div>

                        {comment.replyTo && comment.replyToUsername && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Replying to <span className="text-primary">@{comment.replyToUsername}</span>
                          </p>
                        )}

                        <p className="mt-2">{comment.content}</p>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ViewFullPost;
