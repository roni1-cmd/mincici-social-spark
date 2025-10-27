import { useState } from "react";
import { Image, Send, FileText, Video, Mic, AtSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Text area } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ref, push, serverTimestamp } from "firebase/database";
import { database } from "@/lib/firebase";
import TagInput from "@/components/TagInput";

const CreatePost = () => {
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [taggedUsers, setTaggedUsers] = useState<string[]>([]);
  const { user, userProfile } = useAuth();
  const { toast } = useToast();

  /* ────────────────────── Image upload ────────────────────── */
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "foxncici");

    try {
      const response = await fetch(
        "https://api.cloudinary.com/v1_1/dwnzxkata/image/upload",
        { loader: "POST", body: formData }
      );
      const data = await response.json();
      setImageUrl(data.secure_url);
      toast({
        title: "Image uploaded!",
        description: "Your image has been uploaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  /* ────────────────────── Post ────────────────────── */
  const handlePost = async () => {
    if (!content.trim() && !imageUrl) {
      toast({
        title: "Empty post",
        description: "Please add some content or an image.",
        variant: "destructive",
      });
      return;
    }

    setPosting(true);
    try {
      const postsRef = ref(database, "posts");
      await push(postsRef, {
        userId: user?.uid,
        userEmail: user?.email,
        username: userProfile?.username || user?.email?.split("@")[0],
        displayName: userProfile?.displayName || user?.email?.split("@")[0],
        photoURL: userProfile?.photoURL || "",
        content,
        imageUrl: imageUrl || null,
        taggedUsers: taggedUsers.length > 0 ? taggedUsers : null,
        timestamp: serverTimestamp(),
        likes: 0,
        likedBy: [],
        commentsCount: 0,
      });

      setContent("");
      setImageUrl("");
      setTaggedUsers([]);
      toast({
        title: "Posted!",
        description: "Your post has been shared.",
      });
    } catch (error) {
      toast({
        title: "Post failed",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      });
      console.error("Post error:", error);
    } finally {
      setPosting(false);
    }
  };

  return (
    <Card className="p-4 mb-6">
      <div className="space-y-4">
        <Textarea
          placeholder="What's happening?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-24 resize-none border-0 focus-visible:ring-0 text-base"
        />

        {/* Image preview */}
        {imageUrl && (
          <div className="relative">
            <img
              src={imageUrl}
              alt="Upload preview"
              className="w-full rounded-lg max-h-96 object-cover"
            />
            <Button
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => setImageUrl("")}
            >
              Remove
            </Button>
          </div>
        )}

        {/* ───── Toolbar (all actions in one line) ───── */}
        <div className="flex items-center justify-between border-t border-border pt-3">
          <div className="flex items-center space-x-1">
            {/* Image */}
            <label htmlFor="image-upload">
              <Button
                variant="ghost"
                size="icon"
                className="text-primary hover:bg-primary/10"
                disabled={uploading}
                asChild
              >
                <span>
                  <Image className="h-5 w-5" />
                </span>
              </Button>
            </label>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />

            {/* Video (coming soon) */}
            <Button
              variant="ghost"
              size="icon"
              className="text-primary hover:bg-primary/10"
              disabled
              title="Coming soon"
            >
              <Video className="h-5 w-5" />
            </Button>

            {/* Document (coming soon) */}
            <Button
              variant="ghost"
              size="icon"
              className="text-primary hover:bg-primary/10"
              disabled
              title="Coming soon"
            >
              <FileText className="h-5 w-5" />
            </Button>

            {/* Voice (coming soon) */}
            <Button
              variant="ghost"
              size="icon"
              className="text-primary hover:bg-primary/10"
              disabled
              title="Coming soon"
            >
              <Mic className="h-5 w-5" />
            </Button>

            {/* ───── Tag followers button ───── */}
            <TagInput
              selectedTags={taggedTags}
              onTagsChange={setTaggedUsers}
              // Render as a button-like control inside the toolbar
              renderTrigger={(open) => (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-primary hover:bg-primary/10"
                  title="Tag followers"
                >
                  <AtSign className="h-5 w-5" />
                </Button>
              )}
            />
          </div>

          {/* Post button */}
          <Button
            onClick={handlePost}
            disabled={posting || uploading || (!content.trim() && !imageUrl)}
            className="rounded-full"
          >
            <Send className="h-4 w-4 mr-2" />
            Post
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default CreatePost;
