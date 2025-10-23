import { Heart, MessageCircle, Share2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface PostCardProps {
  userEmail: string;
  username?: string;
  displayName?: string;
  photoURL?: string;
  content: string;
  imageUrl?: string;
  timestamp: string;
  likes: number;
}

const PostCard = ({ userEmail, username, displayName, photoURL, content, imageUrl, timestamp, likes }: PostCardProps) => {
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

  const userInitial = (username || displayName || userEmail)?.charAt(0).toUpperCase() || "U";
  const name = displayName || username || userEmail?.split("@")[0] || "User";
  const handle = username || userEmail?.split("@")[0] || "user";

  return (
    <Card className="p-4 mb-4 hover:bg-muted/50 transition-colors">
      <div className="flex items-start space-x-3">
        <Avatar className="h-10 w-10">
          {photoURL ? (
            <AvatarImage src={photoURL} alt={name} />
          ) : (
            <AvatarFallback className="bg-primary text-primary-foreground">
              {userInitial}
            </AvatarFallback>
          )}
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-sm">{name}</span>
            <span className="text-muted-foreground text-sm">@{handle}</span>
            <span className="text-muted-foreground text-sm">·</span>
            <span className="text-muted-foreground text-sm">{formatTime(timestamp)}</span>
          </div>

          <p className="text-foreground mt-1 whitespace-pre-wrap">{content}</p>

          {imageUrl && (
            <img
              src={imageUrl}
              alt="Post content"
              className="w-full rounded-lg mt-3 max-h-96 object-cover"
            />
          )}

          <div className="flex items-center space-x-6 text-muted-foreground mt-3">
            <Button variant="ghost" size="sm" className="space-x-2 hover:text-red-500 p-0 h-auto">
              <Heart className="h-4 w-4" />
              <span className="text-xs">{likes}</span>
            </Button>
            <Button variant="ghost" size="sm" className="space-x-2 hover:text-primary p-0 h-auto">
              <MessageCircle className="h-4 w-4" />
              <span className="text-xs">0</span>
            </Button>
            <Button variant="ghost" size="sm" className="hover:text-primary p-0 h-auto">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PostCard;
