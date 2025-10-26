import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share2, ThumbsUp, Laugh, Angry, Frown } from "lucide-react";
import { useState, useEffect } from "react";
import { ref, onValue, update } from "firebase/database";
import { database } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

interface ReactionCounts {
  heart: number;
  thumbsUp: number;
  laugh: number;
  sad: number;
  angry: number;
}

const ViewFullPostDialog = ({ postId, isOpen, onClose }: ViewFullPostDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [reactionCounts, setReactionCounts] = useState<ReactionCounts>({
    heart: 0,
    thumbsUp: 0,
    laugh: 0,
    sad: 0,
    angry: 0,
  });

  useEffect(() => {
    if (!isOpen || !postId) return;

    const postRef = ref(database, `posts/${postId}`);
    const unsubscribe = onValue(postRef, (snapshot) => {
      if (snapshot.exists()) {
        const postData = snapshot.val();
        setPost(postData);
        
        const reactions = postData.reactions || {};
        const counts = {
          heart: 0,
          thumbsUp: 0,
          laugh: 0,
          sad: 0,
          angry: 0,
        };
        
        Object.values(reactions).forEach((reaction: any) => {
          if (reaction in counts) {
            counts[reaction as keyof ReactionCounts]++;
          }
        });
        
        setReactionCounts(counts);
        setUserReaction(reactions[user?.uid || ""] || null);
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

  const handleReaction = async (reactionType: string) => {
    if (!user) return;

    const postRef = ref(database, `posts/${postId}`);
    const newReactions = { ...(post.reactions || {}) };

    if (userReaction === reactionType) {
      delete newReactions[user.uid];
      setUserReaction(null);
    } else {
      newReactions[user.uid] = reactionType;
      setUserReaction(reactionType);
    }

    await update(postRef, { reactions: newReactions });
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

  const reactionIcons = {
    heart: Heart,
    thumbsUp: ThumbsUp,
    laugh: Laugh,
    sad: Frown,
    angry: Angry,
  };

  const totalReactions = Object.values(reactionCounts).reduce((sum, count) => sum + count, 0);

  if (!post) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 cursor-pointer" onClick={() => navigate(`/profile/${post.userId}`)}>
              {post.photoURL ? (
                <AvatarImage src={post.photoURL} alt={post.username} />
              ) : (
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {post.username?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <p className="font-semibold cursor-pointer hover:underline" onClick={() => navigate(`/profile/${post.userId}`)}>
                {post.displayName || post.username}
              </p>
              <p className="text-sm text-muted-foreground">@{post.username}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-lg whitespace-pre-wrap">{post.content}</p>
          
          {post.imageUrl && (
            <img
              src={post.imageUrl}
              alt="Post content"
              className="w-full rounded-lg max-h-96 object-cover"
            />
          )}

          <div className="flex items-center gap-4 pt-2 border-t">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  {userReaction ? (
                    <>
                      {(() => {
                        const Icon = reactionIcons[userReaction as keyof typeof reactionIcons];
                        return <Icon className="h-4 w-4 fill-current text-primary" />;
                      })()}
                      <span className="text-xs">{totalReactions}</span>
                    </>
                  ) : (
                    <>
                      <Heart className="h-4 w-4" />
                      <span className="text-xs">{totalReactions}</span>
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {Object.entries(reactionIcons).map(([key, Icon]) => (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => handleReaction(key)}
                    className="gap-2"
                  >
                    <Icon className={`h-4 w-4 ${userReaction === key ? "fill-current text-primary" : ""}`} />
                    <span>{reactionCounts[key as keyof ReactionCounts]}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <div className="flex items-center gap-2 text-muted-foreground">
              <MessageCircle className="h-4 w-4" />
              <span className="text-xs">{comments.length}</span>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-4">Comments</h3>
            <div className="space-y-4">
              {comments.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No comments yet</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="h-8 w-8 cursor-pointer" onClick={() => navigate(`/profile/${comment.userId}`)}>
                      {comment.photoURL ? (
                        <AvatarImage src={comment.photoURL} alt={comment.username} />
                      ) : (
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {comment.username?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1 bg-muted rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-sm cursor-pointer hover:underline" onClick={() => navigate(`/profile/${comment.userId}`)}>
                          {comment.displayName}
                        </p>
                        <span className="text-xs text-muted-foreground">{formatTime(comment.timestamp)}</span>
                      </div>
                      <p className="text-sm">{comment.content}</p>
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
