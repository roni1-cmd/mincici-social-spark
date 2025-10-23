import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ref, set } from "firebase/database";
import { database } from "@/lib/firebase";

const UsernameSetup = () => {
  const { user, userProfile, updateUserProfile, checkUsernameAvailable } = useAuth();
  const [username, setUsername] = useState("");
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const showDialog = user && userProfile && !userProfile.username;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      toast({
        title: "Username required",
        description: "Please enter a username.",
        variant: "destructive",
      });
      return;
    }

    if (username.length < 3) {
      toast({
        title: "Username too short",
        description: "Username must be at least 3 characters.",
        variant: "destructive",
      });
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      toast({
        title: "Invalid username",
        description: "Username can only contain letters, numbers, and underscores.",
        variant: "destructive",
      });
      return;
    }

    setChecking(true);
    const available = await checkUsernameAvailable(username);
    setChecking(false);

    if (!available) {
      toast({
        title: "Username taken",
        description: "This username is already in use. Please try another.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Reserve username
      const usernameRef = ref(database, `usernames/${username.toLowerCase()}`);
      await set(usernameRef, user!.uid);

      // Update profile
      await updateUserProfile({ username });

      toast({
        title: "Welcome!",
        description: "Your username has been set.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to set username. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={showDialog}>
      <DialogContent className="sm:max-w-md" hideClose>
        <DialogHeader>
          <DialogTitle>Choose your username</DialogTitle>
          <DialogDescription>
            This will be how others see you on mincici. You can change it later in settings.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="username"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              disabled={checking || saving}
            />
          </div>
          <Button type="submit" className="w-full" disabled={checking || saving}>
            {checking ? "Checking..." : saving ? "Saving..." : "Continue"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UsernameSetup;
