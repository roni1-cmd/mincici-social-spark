import { Home, Search, Bell, Mail, User, LogOut, Menu, Settings } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

const Sidebar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Search, label: "Explore", path: "/explore" },
    { icon: Bell, label: "Notifications", path: "/notifications" },
    { icon: Mail, label: "Messages", path: "/messages" },
    { icon: User, label: "Profile", path: "/profile" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-primary">mincici</h1>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center space-x-4 px-4 py-3 rounded-full transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-foreground hover:bg-muted"
              }`
            }
          >
            <item.icon className="h-6 w-6" />
            <span className="text-lg">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {user && (
        <div className="p-4 border-t border-border">
          <Button
            variant="ghost"
            className="w-full justify-start space-x-4"
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5" />
            <span>Sign Out</span>
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Sidebar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-primary">mincici</h1>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 border-r border-border bg-card flex-col sticky top-0 h-screen">
        <SidebarContent />
      </aside>
    </>
  );
};

export default Sidebar;
