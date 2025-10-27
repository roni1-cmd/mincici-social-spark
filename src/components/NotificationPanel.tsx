import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { ref, onValue, update } from "firebase/database";
import { database } from "@/lib/firebase";
import { useNavigate } from "react-router-dom";

interface Notification {
  id: string;
  type: "like" | "comment" | "follow" | "relationship";
  fromUserId: string;
  fromUsername: string;
  fromDisplayName: string;
  fromPhotoURL: string;
  postId?: string;
  timestamp: number;
  read: boolean;
}

const NotificationPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const notificationsRef = ref(database, `notifications/${user.uid}`);
    const unsubscribe = onValue(notificationsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const notifArray = Object.entries(data).map(([id, notif]: [string, any]) => ({
          id,
          ...notif,
        }));
        notifArray.sort((a, b) => b.timestamp - a.timestamp);
        setNotifications(notifArray);
        setUnreadCount(notifArray.filter((n) => !n.read).length);
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    });

    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    if (!user) return;
    const notifRef = ref(database, `notifications/${user.uid}/${notificationId}`);
    await update(notifRef, { read: true });
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    navigate(`/notifications/${notification.id}`);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return "Just now";
  };

  const getNotificationText = (notification: Notification) => {
    switch (notification.type) {
      case "like":
        return "liked your post";
      case "comment":
        return "commented on your post";
      case "follow":
        return "started following you";
      case "relationship":
        return "set you as their relationship partner";
      default:
        return "";
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="relative flex items-center space-x-4 text-foreground hover:text-primary transition-colors w-full text-left">
          <Bell className="h-6 w-6 flex-shrink-0" />
          <span className="text-lg">Notifications</span>
          {unreadCount > 0 && (
            <span className="absolute left-5 -top-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Notifications</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-4 overflow-y-auto max-h-[calc(100vh-100px)]">
          {notifications.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No notifications yet</p>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  notification.read ? "bg-background" : "bg-muted"
                } hover:bg-muted/70`}
                onClick={() => handleNotificationClick(notification)}
              >
                <Avatar className="h-10 w-10">
                  {notification.fromPhotoURL ? (
                    <AvatarImage src={notification.fromPhotoURL} alt={notification.fromUsername} />
                  ) : (
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {notification.fromUsername?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">
                    <span className="font-semibold truncate">{notification.fromDisplayName}</span>{" "}
                    <span className="truncate">{getNotificationText(notification)}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{formatTime(notification.timestamp)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NotificationPanel;
