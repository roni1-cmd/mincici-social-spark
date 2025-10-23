import { useState, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Camera, Loader2 } from "lucide-react";
import { ref, set } from "firebase/database";
import { database } from "@/lib/firebase";

const Settings = () => {
  const { user, userProfile, updateUserProfile, checkUsernameAvailable } = useAuth();
  const [username, setUsername] = useState(userProfile?.username || "");
  const [displayName, setDisplayName] = useState(userProfile?.displayName || "");
  const [bio, setBio] = useState(userProfile?.bio || "");
  const [photoURL, setPhotoURL] = useState(userProfile?.photoURL || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [privateAccount, setPrivateAccount] = useState(false);
  const [showActivity, setShowActivity] = useState(true);

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
      setPhotoURL(data.secure_url);
      await updateUserProfile({ photoURL: data.secure_url });
      toast({
        title: "Profile picture updated!",
        description: "Your profile picture has been changed.",
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

  const handleSaveProfile = async () => {
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

    setSaving(true);
    try {
      // Check if username changed
      if (username !== userProfile?.username) {
        const available = await checkUsernameAvailable(username);
        if (!available) {
          toast({
            title: "Username taken",
            description: "This username is already in use. Please try another.",
            variant: "destructive",
          });
          setSaving(false);
          return;
        }

        // Remove old username reservation
        if (userProfile?.username) {
          const oldUsernameRef = ref(database, `usernames/${userProfile.username.toLowerCase()}`);
          await set(oldUsernameRef, null);
        }

        // Reserve new username
        const usernameRef = ref(database, `usernames/${username.toLowerCase()}`);
        await set(usernameRef, user!.uid);
      }

      await updateUserProfile({ 
        username, 
        displayName: displayName || username,
        bio 
      });

      toast({
        title: "Profile updated!",
        description: "Your changes have been saved.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      
      <main className="flex-1 lg:ml-0 mt-14 lg:mt-0">
        <div className="max-w-2xl mx-auto">
          <div className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border p-4">
            <h2 className="text-xl font-bold">Settings</h2>
          </div>

          <div className="p-4">
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="privacy">Privacy</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-4">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Profile Information</h3>
                  
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="relative">
                      <Avatar className="h-24 w-24">
                        {photoURL ? (
                          <AvatarImage src={photoURL} alt={username} />
                        ) : (
                          <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                            {username.charAt(0).toUpperCase() || "U"}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <Button
                        size="icon"
                        variant="secondary"
                        className="absolute bottom-0 right-0 rounded-full h-8 w-8"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        {uploading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Camera className="h-4 w-4" />
                        )}
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Click the camera icon to change your profile picture
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase())}
                        placeholder="username"
                      />
                      <p className="text-xs text-muted-foreground">
                        Your unique identifier on mincici
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input
                        id="displayName"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Your Name"
                      />
                      <p className="text-xs text-muted-foreground">
                        This is how your name will appear on your profile
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Tell us about yourself..."
                        className="min-h-24"
                      />
                      <p className="text-xs text-muted-foreground">
                        Brief description for your profile (max 160 characters)
                      </p>
                    </div>

                    <Button onClick={handleSaveProfile} disabled={saving}>
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="account" className="space-y-4">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Account Settings</h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input value={user?.email || ""} disabled />
                      <p className="text-xs text-muted-foreground">
                        Your email address cannot be changed
                      </p>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label>Account Created</Label>
                      <Input 
                        value={userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : ""} 
                        disabled 
                      />
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label className="text-destructive">Danger Zone</Label>
                      <p className="text-sm text-muted-foreground mb-2">
                        Once you delete your account, there is no going back.
                      </p>
                      <Button variant="destructive">
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="privacy" className="space-y-4">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Privacy Settings</h3>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Private Account</Label>
                        <p className="text-sm text-muted-foreground">
                          Only approved followers can see your posts
                        </p>
                      </div>
                      <Switch
                        checked={privateAccount}
                        onCheckedChange={setPrivateAccount}
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Show Activity Status</Label>
                        <p className="text-sm text-muted-foreground">
                          Let others see when you're online
                        </p>
                      </div>
                      <Switch
                        checked={showActivity}
                        onCheckedChange={setShowActivity}
                      />
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label>Blocked Users</Label>
                      <p className="text-sm text-muted-foreground">
                        You haven't blocked anyone yet
                      </p>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="notifications" className="space-y-4">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive email updates about your activity
                        </p>
                      </div>
                      <Switch
                        checked={emailNotifications}
                        onCheckedChange={setEmailNotifications}
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Push Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Get push notifications for new activity
                        </p>
                      </div>
                      <Switch
                        checked={pushNotifications}
                        onCheckedChange={setPushNotifications}
                      />
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <Label>Notification Types</Label>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Likes</span>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Comments</span>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">New Followers</span>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Messages</span>
                          <Switch defaultChecked />
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
