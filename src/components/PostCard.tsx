import { Heart, MessageCircle, Share2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface PostCardProps {
  userEmail: string;
  content: string;
  imageUrl?: string;
  timestamp: string;
  likes: number;
}

const PostCard = ({ userEmail, content, imageUrl, timestamp, likes }: PostCardProps) => {
  const userInitial = userEmail.charAt(0).toUpperCase();
  const timeAgo = new Date(timestamp).toLocaleString();

  return (
    <Card className="p-4 mb-4 hover:bg-muted/50 transition-colors">
      <div className="flex space-x-3">
        <Avatar>
          <AvatarFallback className="bg-primary text-primary-foreground">
            {userInitial}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-medium text-foreground">{userEmail.split("@")[0]}</span>
            <span className="text-sm text-muted-foreground">@{userEmail.split("@")[0]}</span>
            <span className="text-sm text-muted-foreground">·</span>
            <span className="text-sm text-muted-foreground">{timeAgo}</span>
          </div>

          <p className="text-foreground mb-3 whitespace-pre-wrap">{content}</p>

          {imageUrl && (
            <img
              src={imageUrl}
              alt="Post content"
              className="w-full rounded-lg mb-3 max-h-96 object-cover"
            />
          )}

          <div className="flex items-center space-x-6 text-muted-foreground">
            <Button variant="ghost" size="sm" className="space-x-2 hover:text-red-500">
              <Heart className="h-4 w-4" />
              <span>{likes}</span>
            </Button>
            <Button variant="ghost" size="sm" className="space-x-2 hover:text-primary">
              <MessageCircle className="h-4 w-4" />
              <span>0</span>
            </Button>
            <Button variant="ghost" size="sm" className="hover:text-primary">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PostCard;
