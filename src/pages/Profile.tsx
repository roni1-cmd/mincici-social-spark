import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";

const Profile = () => {
  const { user } = useAuth();
  const userInitial = user?.email?.charAt(0).toUpperCase() || "U";

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      
      <main className="flex-1 lg:ml-0 mt-14 lg:mt-0">
        <div className="max-w-2xl mx-auto">
          <div className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border p-4">
            <h2 className="text-xl font-bold">Profile</h2>
          </div>

          <div className="p-4">
            <Card className="p-6">
              <div className="flex items-start space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {userInitial}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <h3 className="text-xl font-bold">{user?.email?.split("@")[0]}</h3>
                  <p className="text-muted-foreground">@{user?.email?.split("@")[0]}</p>
                  <p className="text-sm text-muted-foreground mt-2">{user?.email}</p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">0</div>
                  <div className="text-sm text-muted-foreground">Posts</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">0</div>
                  <div className="text-sm text-muted-foreground">Followers</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">0</div>
                  <div className="text-sm text-muted-foreground">Following</div>
                </div>
              </div>
            </Card>

            <div className="mt-6">
              <h3 className="font-bold text-lg mb-4">Your Posts</h3>
              <div className="text-center py-12 text-muted-foreground">
                <p>No posts yet</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
