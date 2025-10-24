import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ref, push, onValue, query, orderByChild } from "firebase/database";
import { database } from "@/lib/firebase";
import { Send } from "lucide-react";

interface Comment {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  photoURL: string;
  content: string;
  timestamp: string;
}

interface CommentDialogProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
}

const CommentDialog = ({ postId, isOpen, onClose }: CommentDialogProps) => {
  const [content, setContent] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [posting, setPosting] = useState(false);
  const { user, userProfile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen) return;

    const commentsRef = ref(database, `comments/${postId}`);
    const commentsQuery = query(commentsRef, orderByChild("timestamp"));

    const unsubscribe = onValue(commentsQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const commentsArray = Object.entries(data).map(([id, comment]: [string, any]) => ({
          id,
          ...comment,
        }));
        setComments(commentsArray.reverse());
      } else {
        setComments([]);
      }
    });

    return () => unsubscribe();
  }, [postId, isOpen]);

  const handlePost = async () => {
    if (!content.trim()) return;

    setPosting(true);
    try {
      const commentsRef = ref(database, `comments/${postId}`);
      await push(commentsRef, {
        userId: user?.uid,
        username: userProfile?.username || user?.email?.split("@")[0],
        displayName: userProfile?.displayName || user?.email?.split("@")[0],
        photoURL: userProfile?.photoURL || "",
        content,
        timestamp: new Date().toISOString(),
      });

      setContent("");
      toast({
        title: "Comment posted!",
        description: "Your comment has been added.",
      });
    } catch (error) {
      toast({
        title: "Comment failed",
        description: "Failed to post comment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPosting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Comments</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-4 my-4">
          {comments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No comments yet</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex space-x-3">
                <Avatar className="h-8 w-8">
                  {comment.photoURL ? (
                    <AvatarImage src={comment.photoURL} alt={comment.username} />
                  ) : (
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {comment.username?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-sm">{comment.displayName}</span>
                    <span className="text-muted-foreground text-xs">@{comment.username}</span>
                  </div>
                  <p className="text-sm mt-1">{comment.content}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex space-x-2 border-t pt-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write a comment..."
            className="min-h-20"
          />
          <Button
            onClick={handlePost}
            disabled={posting || !content.trim()}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommentDialog;
