import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ref, onValue, update } from "firebase/database";
import { database } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, UserPlus, Users } from "lucide-react";

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
  postContent?: string;
  commentContent?: string;
}

const Notifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { notificationId } = useParams();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

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

        if (notificationId) {
          const selected = notifArray.find((n) => n.id === notificationId);
          if (selected) {
            setSelectedNotification(selected);
            markAsRead(selected.id);
          }
        }
      } else {
        setNotifications([]);
      }
    });

    return () => unsubscribe();
  }, [user, notificationId]);

  const markAsRead = async (notificationId: string) => {
    if (!user) return;
    const notifRef = ref(database, `notifications/${user.uid}/${notificationId}`);
    await update(notifRef, { read: true });
  };

  const handleNotificationClick = (notification: Notification) => {
    setSelectedNotification(notification);
    markAsRead(notification.id);
    navigate(`/notifications/${notification.id}`);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 7) {
      return date.toLocaleDateString();
    }
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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart className="h-5 w-5 text-red-500 fill-red-500" />;
      case "comment":
        return <MessageCircle className="h-5 w-5 text-primary" />;
      case "follow":
        return <UserPlus className="h-5 w-5 text-primary" />;
      case "relationship":
        return <Users className="h-5 w-5 text-pink-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      
      <main className="flex-1 lg:ml-0 mt-14 lg:mt-0">
        <div className="max-w-4xl mx-auto">
          <div className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border p-4">
            <h2 className="text-xl font-bold">Notifications</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
            {/* Notifications List */}
            <div className="space-y-2">
              {notifications.length === 0 ? (
                <Card className="p-8">
                  <p className="text-center text-muted-foreground">No notifications yet</p>
                </Card>
              ) : (
                notifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                      selectedNotification?.id === notification.id ? "border-primary" : ""
                    } ${!notification.read ? "bg-muted/50" : ""}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          {notification.fromPhotoURL ? (
                            <AvatarImage src={notification.fromPhotoURL} alt={notification.fromUsername} />
                          ) : (
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {notification.fromUsername?.charAt(0).toUpperCase() || "U"}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 bg-card rounded-full p-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-semibold">{notification.fromDisplayName}</span>{" "}
                          <span className="text-muted-foreground">{getNotificationText(notification)}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{formatTime(notification.timestamp)}</p>
                        {!notification.read && (
                          <Badge variant="default" className="mt-2 text-xs">New</Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>

            {/* Detailed View */}
            <div className="hidden lg:block sticky top-20 h-fit">
              {selectedNotification ? (
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="h-16 w-16">
                      {selectedNotification.fromPhotoURL ? (
                        <AvatarImage src={selectedNotification.fromPhotoURL} alt={selectedNotification.fromUsername} />
                      ) : (
                        <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                          {selectedNotification.fromUsername?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <h3 className="font-bold text-lg">{selectedNotification.fromDisplayName}</h3>
                      <p className="text-sm text-muted-foreground">@{selectedNotification.fromUsername}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      {getNotificationIcon(selectedNotification.type)}
                      <span className="font-semibold">{getNotificationText(selectedNotification)}</span>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {formatTime(selectedNotification.timestamp)}
                    </p>

                    {selectedNotification.postContent && (
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium mb-1">Post:</p>
                        <p className="text-sm">{selectedNotification.postContent}</p>
                      </div>
                    )}

                    {selectedNotification.commentContent && (
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium mb-1">Comment:</p>
                        <p className="text-sm">{selectedNotification.commentContent}</p>
                      </div>
                    )}

                    <div className="pt-4 border-t space-y-2">
                      {selectedNotification.type === "follow" || selectedNotification.type === "relationship" ? (
                        <button
                          className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                          onClick={() => navigate(`/profile/${selectedNotification.fromUserId}`)}
                        >
                          View Profile
                        </button>
                      ) : selectedNotification.postId ? (
                        <button
                          className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                          onClick={() => navigate("/")}
                        >
                          View Post
                        </button>
                      ) : null}
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="p-8">
                  <p className="text-center text-muted-foreground">
                    Select a notification to view details
                  </p>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Notifications;
