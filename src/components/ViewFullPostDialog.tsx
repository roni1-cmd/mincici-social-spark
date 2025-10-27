import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface ViewFullPostDialogProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface Comment {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  photoURL: string;
  content: string;
  timestamp: number;
}

const ViewFullPostDialog = ({ postId, isOpen, onClose }: ViewFullPostDialogProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => {
    if (!isOpen || !postId) return;

    const postRef = ref(database, `posts/${postId}`);
    const unsubscribe = onValue(postRef, (snapshot) => {
      if (snapshot.exists()) {
        setPost(snapshot.val());
      }
    });

    const commentsRef = ref(database, `comments/${postId}`);
    const unsubscribeComments = onValue(commentsRef, (snapshot) => {
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

    return () => {
      unsubscribe();
      unsubscribeComments();
    };
  }, [isOpen, postId, user]);

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

  if (!post) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl p-4 sm:p-6">
        {/* Fixed Header: Avatar + Name (always side-by-side, left-aligned) */}
        <DialogHeader className="pb-0">
          <div className="flex items-center gap-3 w-full">
            <Avatar
              className="h-12 w-12 flex-shrink-0 cursor-pointer"
              onClick={() => navigate(`/profile/${post.userId}`)}
            >
              {post.photoURL ? (
                <AvatarImage src={post.photoURL} alt={post.username} />
              ) : (
                <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                  {post.username?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              )}
            </Avatar>

            <div className="flex-1 min-w-0 text-left">
              <p
                className="font-semibold text-sm sm:text-base cursor-pointer hover:underline truncate leading-tight"
                onClick={() => navigate(`/profile/${post.userId}`)}
                title={post.displayName || post.username}
              >
                {post.displayName || post.username}
              </p>
              <p
                className="text-xs sm:text-sm text-muted-foreground truncate leading-tight"
                title={`@${post.username}`}
              >
                @{post.username}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Post Content */}
        <div className="mt-4 space-y-4">
          <p className="text-base sm:text-lg whitespace-pre-wrap break-words">{post.content}</p>

          {post.imageUrl && (
            <img
              src={post.imageUrl}
              alt="Post content"
              className="w-full rounded-lg max-h-96 object-cover border border-border"
            />
          )}

          {/* Comments Section */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-base mb-3">
              Comments {comments.length > 0 && <span className="text-muted-foreground font-normal">({comments.length})</span>}
            </h3>

            <div className="space-y-4">
              {comments.length === 0 ? (
                <p className="text-center text-muted-foreground py-6 text-sm">No comments yet</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar
                      className="h-8 w-8 flex-shrink-0 cursor-pointer"
                      onClick={() => navigate(`/profile/${comment.userId}`)}
                    >
                      {comment.photoURL ? (
                        <AvatarImage src={comment.photoURL} alt={comment.username} />
                      ) : (
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {comment.username?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      )}
                    </Avatar>

                    <div className="flex-1 min-w-0 bg-muted rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p
                          className="font-semibold text-sm cursor-pointer hover:underline truncate max-w-[140px] sm:max-w-[200px]"
                          onClick={() => navigate(`/profile/${comment.userId}`)}
                          title={comment.displayName}
                        >
                          {comment.displayName}
                        </p>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {formatTime(comment.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm break-words">{comment.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewFullPostDialog;
