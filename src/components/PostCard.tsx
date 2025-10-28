import { useState } from "react";
import { Heart, MessageCircle, Share2, MoreHorizontal, Edit, Trash2, ThumbsUp, Laugh, Angry, Frown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ref, update, remove, push, get } from "firebase/database";
import { database } from "@/lib/firebase";
import ImageLightbox from "./ImageLightbox";
import EditPostDialog from "./EditPostDialog";
import CommentDialog from "./CommentDialog";
import ViewFullPostDialog from "./ViewFullPostDialog";
import { Badge } from "@/components/ui/badge";
import { useEffect } from "react";

interface PostCardProps {
  postId: string;
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
  taggedUsers?: Array<{ id: string; username: string; displayName: string }>;
}

const PostCard = ({ postId, userId, userEmail, username, displayName, photoURL, content, imageUrl, timestamp, likes, likedBy = [], commentsCount = 0, taggedUsers = [] }: PostCardProps) => {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(likedBy.includes(user?.uid || ""));
  const [likeCount, setLikeCount] = useState(likes);
  const [showFullContent, setShowFullContent] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [viewFullPostOpen, setViewFullPostOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const isOwnPost = user?.uid === userId;
  const formatTime = (timestamp: string) => {
    if (!timestamp) return "Just now";
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    return "Just now";
  };

  const handleLike = async () => {
    if (!user) return;

    const newIsLiked = !isLiked;
    const newLikedBy = newIsLiked
      ? [...likedBy, user.uid]
      : likedBy.filter((id) => id !== user.uid);

    setIsLiked(newIsLiked);
    setLikeCount(newLikedBy.length);
    
    if (newIsLiked) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 600);
    }

    try {
      const postRef = ref(database, `posts/${postId}`);
      await update(postRef, {
        likes: newLikedBy.length,
        likedBy: newLikedBy,
      });
      
      if (newIsLiked && userId !== user.uid) {
        const notificationRef = push(ref(database, `notifications/${userId}`));
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
      setLikeCount(likes);
      toast({
        title: "Error",
        description: "Failed to like post. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    try {
      const postRef = ref(database, `posts/${postId}`);
      await remove(postRef);
      toast({
        title: "Post deleted",
        description: "Your post has been deleted.",
      });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Failed to delete post. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: `Post by ${name}`,
        text: content,
        url: window.location.href,
      });
    } catch (error) {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "Post link has been copied to clipboard.",
      });
    }
  };

  const userInitial = (username || displayName || userEmail)?.charAt(0).toUpperCase() || "U";
  const name = displayName || username || userEmail?.split("@")[0] || "User";
  const handle = username || userEmail?.split("@")[0] || "user";
  
  const shouldTruncate = content.length > 280;
  const displayContent = shouldTruncate && !showFullContent 
    ? content.substring(0, 280) + "..." 
    : content;

  return (
    <>
      <Card className="p-4 mb-4 hover:bg-muted/50 transition-colors">
        <div className="flex items-start space-x-3">
          <Avatar 
            className="h-10 w-10 cursor-pointer hover:opacity-80 transition-opacity" 
            onClick={() => navigate(`/profile/${userId}`)}
          >
            {photoURL ? (
              <AvatarImage src={photoURL} alt={name} />
            ) : (
              <AvatarFallback className="bg-primary text-primary-foreground">
                {userInitial}
              </AvatarFallback>
            )}
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-wrap">
                <span
                  className="font-semibold text-sm cursor-pointer hover:underline truncate max-w-[120px] sm:max-w-[150px]"
                  onClick={() => navigate(`/profile/${userId}`)}
                  title={name}
                >
                  {name}
                </span>
                <span
                  className="text-muted-foreground text-sm cursor-pointer hover:underline truncate max-w-[100px] sm:max-w-[120px]"
                  onClick={() => navigate(`/profile/${userId}`)}
                  title={`@${handle}`}
                >
                  @{handle}
                </span>
                <span className="text-muted-foreground text-sm flex-shrink-0">·</span>
                <span className="text-muted-foreground text-sm flex-shrink-0">{formatTime(timestamp)}</span>
              </div>
              
              {isOwnPost && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setDeleteDialogOpen(true)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            <p className="text-foreground mt-1 whitespace-pre-wrap">{displayContent}</p>
            {shouldTruncate && (
              <Button
                variant="link"
                className="p-0 h-auto text-primary text-sm"
                onClick={() => setShowFullContent(!showFullContent)}
              >
                {showFullContent ? "Show Less" : "See Full"}
              </Button>
            )}

            {taggedUsers && taggedUsers.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-2 text-sm">
                <span className="text-muted-foreground">is with</span>
                {taggedUsers.map((taggedUser, index) => (
                  <span key={taggedUser.id} className="flex items-center gap-1">
                    <Badge
                      variant="secondary"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/profile/${taggedUser.id}`);
                      }}
                    >
                      {taggedUser.displayName}
                    </Badge>
                    {index < taggedUsers.length - 1 && <span className="text-muted-foreground">,</span>}
                  </span>
                ))}
              </div>
            )}

            {imageUrl && (
              <img
                src={imageUrl}
                alt="Post content"
                className="w-full rounded-lg mt-3 max-h-96 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setLightboxOpen(true)}
              />
            )}

            <div className="flex items-center justify-between mt-3 border-t pt-3">
              <div className="flex items-center space-x-6 text-muted-foreground">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`space-x-2 p-0 h-auto ${
                    isLiked ? "text-red-500" : "hover:text-red-500"
                  } ${isAnimating ? "animate-scale-in" : ""}`}
                  onClick={handleLike}
                >
                  <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
                  <span className="text-xs">{likeCount}</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="space-x-2 hover:text-primary p-0 h-auto"
                  onClick={() => setCommentDialogOpen(true)}
                >
                  <MessageCircle className="h-4 w-4" />
                  <span className="text-xs">{commentsCount}</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="hover:text-primary p-0 h-auto"
                  onClick={handleShare}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="link"
                size="sm"
                className="text-xs text-primary"
                onClick={() => navigate(`/post/${postId}`)}
              >
                View full post
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <ImageLightbox
        imageUrl={imageUrl || ""}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />

      <EditPostDialog
        postId={postId}
        currentContent={content}
        isOpen={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
      />

      <CommentDialog
        postId={postId}
        isOpen={commentDialogOpen}
        onClose={() => setCommentDialogOpen(false)}
      />

      <ViewFullPostDialog
        postId={postId}
        isOpen={viewFullPostOpen}
        onClose={() => setViewFullPostOpen(false)}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PostCard;
