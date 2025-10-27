import { useState } from "react";
import { Image, Send, FileText, Video, Mic, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ref, push, serverTimestamp } from "firebase/database";
import { database } from "@/lib/firebase";
import TagInput from "@/components/TagInput";

const CreatePost = () => {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [taggedUsers, setTaggedUsers] = useState<string[]>([]);
  const { user, userProfile } = useAuth();
  const { toast } = useToast();

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
        {
          method: "POST",
          body: formData,
        }
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

      // Reset and close
      setContent("");
      setImageUrl("");
      setTaggedUsers([]);
      setOpen(false);
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

  const closeModal = () => {
    if (!posting && !uploading) {
      setOpen(false);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <Button
        onClick={() => setOpen(true)}
        className="w-full rounded-full font-medium"
        size="lg"
      >
        <Send className="h-4 w-4 mr-2" />
        Create Post
      </Button>

      {/* Modal */}
      <Dialog open={open} onOpenChange={closeModal}>
        <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl">
          {/* Backdrop blur is automatic in shadcn Dialog */}
          <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <DialogHeader className="p-5 pb-3 border-b border-border/50">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-xl font-semibold">Create Post</DialogTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closeModal}
                  disabled={posting || uploading}
                  className="h-8 w-8 rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogHeader>

            <div className="p-5 space-y-4">
              <Textarea
                placeholder="What's happening?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-32 resize-none border-0 focus-visible:ring-0 text-base bg-transparent"
                disabled={posting}
              />

              {imageUrl && (
                <div className="relative rounded-lg overflow-hidden border border-border/50">
                  <img
                    src={imageUrl}
                    alt="Upload preview"
                    className="w-full max-h-80 object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 h-8"
                    onClick={() => setImageUrl("")}
                    disabled={posting}
                  >
                    Remove
                  </Button>
                </div>
              )}

              <TagInput selectedTags={taggedUsers} onTagsChange={setTaggedUsers} disabled={posting} />

              <div className="flex items-center justify-between pt-3 border-t border-border/50">
                <div className="flex items-center space-x-1">
                  <label htmlFor="modal-image-upload">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-primary hover:bg-primary/10 h-9 w-9"
                      disabled={uploading || posting}
                      asChild
                    >
                      <span>
                        <Image className="h-5 w-5" />
                      </span>
                    </Button>
                  </label>
                  <input
                    id="modal-image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={posting}
                  />

                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-primary hover:bg-primary/10 h-9 w-9"
                    disabled
                    title="Coming soon"
                  >
                    <Video className="h-5 w-5" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-primary hover:bg-primary/10 h-9 w-9"
                    disabled
                    title="Coming soon"
                  >
                    <FileText className="h-5 w-5" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-primary hover:bg-primary/10 h-9 w-9"
                    disabled
                    title="Coming soon"
                  >
                    <Mic className="h-5 w-5" />
                  </Button>
                </div>

                <Button
                  onClick={handlePost}
                  disabled={posting || uploading || (!content.trim() && !imageUrl)}
                  className="rounded-full px-6"
                >
                  {posting ? "Posting..." : "Post"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CreatePost;
