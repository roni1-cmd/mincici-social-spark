import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ref, push, onValue, query, orderByChild, update, remove, get } from "firebase/database";
import { database } from "@/lib/firebase";
import { Send, MoreVertical, Pencil, Trash2, Reply } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Comment {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  photoURL: string;
  content: string;
  timestamp: string;
  replyTo?: string;
  replyToUsername?: string;
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
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; username: string } | null>(null);
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
      const commentData: any = {
        userId: user?.uid,
        username: userProfile?.username || user?.email?.split("@")[0],
        displayName: userProfile?.displayName || user?.email?.split("@")[0],
        photoURL: userProfile?.photoURL || "",
        content,
        timestamp: new Date().toISOString(),
      };

      if (replyTo) {
        commentData.replyTo = replyTo.id;
        commentData.replyToUsername = replyTo.username;
      }

      await push(commentsRef, commentData);

      // Update comment count on the post
      const postRef = ref(database, `posts/${postId}`);
      await update(postRef, {
        commentsCount: comments.length + 1,
      });
      
      const postSnapshot = await get(postRef);
      if (postSnapshot.exists() && postSnapshot.val().userId !== user?.uid) {
        const notificationRef = push(ref(database, `notifications/${postSnapshot.val().userId}`));
        await update(notificationRef, {
          type: "comment",
          fromUserId: user?.uid,
          fromUsername: userProfile?.username || "",
          fromDisplayName: userProfile?.displayName || "",
          fromPhotoURL: userProfile?.photoURL || "",
          postId: postId,
          timestamp: Date.now(),
          read: false,
        });
      }

      setContent("");
      setReplyTo(null);
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

  const handleEdit = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      const commentRef = ref(database, `comments/${postId}/${commentId}`);
      await update(commentRef, {
        content: editContent,
        edited: true,
      });

      setEditingCommentId(null);
      setEditContent("");
      toast({
        title: "Comment updated!",
        description: "Your comment has been updated.",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update comment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      const commentRef = ref(database, `comments/${postId}/${commentId}`);
      await remove(commentRef);

      // Update comment count on the post
      const postRef = ref(database, `posts/${postId}`);
      await update(postRef, {
        commentsCount: Math.max(0, comments.length - 1),
      });

      toast({
        title: "Comment deleted!",
        description: "Your comment has been removed.",
      });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Failed to delete comment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const startEdit = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
  };

  const startReply = (comment: Comment) => {
    setReplyTo({ id: comment.id, username: comment.username });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-full max-h-[95vh] h-[95vh] w-[95vw] flex flex-col rounded-2xl">
        <DialogHeader>
          <DialogTitle>Comments</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-4 my-4">
          {comments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No comments yet</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex space-x-3">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  {comment.photoURL ? (
                    <AvatarImage src={comment.photoURL} alt={comment.username} />
                  ) : (
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {comment.username?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-sm">{comment.displayName}</span>
                      <span className="text-muted-foreground text-xs">@{comment.username}</span>
                    </div>
                    {comment.userId === user?.uid && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => startEdit(comment)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(comment.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  {comment.replyToUsername && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Replying to @{comment.replyToUsername}
                    </p>
                  )}
                  {editingCommentId === comment.id ? (
                    <div className="mt-2 space-y-2">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="min-h-20"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleEdit(comment.id)}>
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingCommentId(null);
                            setEditContent("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm mt-1 break-words">{comment.content}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 mt-1 text-xs text-muted-foreground hover:text-primary"
                        onClick={() => startReply(comment)}
                      >
                        <Reply className="h-3 w-3 mr-1" />
                        Reply
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t pt-4 space-y-2">
          {replyTo && (
            <div className="flex items-center justify-between bg-muted px-3 py-2 rounded-md">
              <span className="text-sm text-muted-foreground">
                Replying to @{replyTo.username}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyTo(null)}
                className="h-auto p-0"
              >
                Cancel
              </Button>
            </div>
          )}
          <div className="flex space-x-2">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={replyTo ? "Write a reply..." : "Write a comment..."}
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommentDialog;
