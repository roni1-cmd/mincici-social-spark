import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ref, update } from "firebase/database";
import { database } from "@/lib/firebase";

interface EditPostDialogProps {
  postId: string;
  currentContent: string;
  isOpen: boolean;
  onClose: () => void;
}

const EditPostDialog = ({ postId, currentContent, isOpen, onClose }: EditPostDialogProps) => {
  const [content, setContent] = useState(currentContent);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!content.trim()) {
      toast({
        title: "Empty post",
        description: "Post content cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const postRef = ref(database, `posts/${postId}`);
      await update(postRef, { content });
      
      toast({
        title: "Post updated!",
        description: "Your post has been updated.",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Post</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-32"
            placeholder="What's happening?"
          />
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditPostDialog;
