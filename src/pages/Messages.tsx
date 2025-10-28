import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Search, ArrowLeft } from "lucide-react";
import { ref, onValue, push, update, get, query, orderByChild, equalTo } from "firebase/database";
import { database } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: number;
  read: boolean;
}
interface Conversation {
  userId: string;
  username: string;
  displayName: string;
  photoURL: string;
  lastMessage: string;
  lastMessageTime: number;
  unreadCount: number;
}
const Messages = () => {
  const { user, userProfile } = useAuth();
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [followers, setFollowers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!user) return;
    const followingRef = ref(database, `following/${user.uid}`);
    onValue(followingRef, async (snapshot) => {
      if (snapshot.exists()) {
        const followingIds = Object.keys(snapshot.val());
        const followersRef = ref(database, `followers/${user.uid}`);
        const followersSnapshot = await get(followersRef);
       
        if (followersSnapshot.exists()) {
          const followerIds = Object.keys(followersSnapshot.val());
          const mutualIds = followingIds.filter((id) => followerIds.includes(id));
         
          const followersData = await Promise.all(
            mutualIds.map(async (id) => {
              const userRef = ref(database, `users/${id}`);
              const userSnapshot = await get(userRef);
              return { uid: id, ...userSnapshot.val() };
            })
          );
         
          setFollowers(followersData);
        }
      }
    });
  }, [user]);
  useEffect(() => {
    if (!user) return;
    const messagesRef = ref(database, "messages");
    onValue(messagesRef, async (snapshot) => {
      if (!snapshot.exists()) {
        setConversations([]);
        return;
      }
      const allMessages = snapshot.val();
      const conversationMap = new Map<string, Conversation>();
      Object.entries(allMessages).forEach(([msgId, msg]: [string, any]) => {
        if (msg.senderId === user.uid || msg.receiverId === user.uid) {
          const otherUserId = msg.senderId === user.uid ? msg.receiverId : msg.senderId;
         
          if (!conversationMap.has(otherUserId) || msg.timestamp > conversationMap.get(otherUserId)!.lastMessageTime) {
            conversationMap.set(otherUserId, {
              userId: otherUserId,
              username: "",
              displayName: "",
              photoURL: "",
              lastMessage: msg.content,
              lastMessageTime: msg.timestamp,
              unreadCount: msg.receiverId === user.uid && !msg.read ? 1 : 0,
            });
          }
        }
      });
      const conversationsData = await Promise.all(
        Array.from(conversationMap.values()).map(async (conv) => {
          const userRef = ref(database, `users/${conv.userId}`);
          const userSnapshot = await get(userRef);
          if (userSnapshot.exists()) {
            const userData = userSnapshot.val();
            return {
              ...conv,
              username: userData.username,
              displayName: userData.displayName,
              photoURL: userData.photoURL,
            };
          }
          return conv;
        })
      );
      conversationsData.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
      setConversations(conversationsData);
    });
  }, [user]);
  useEffect(() => {
    if (!user || !conversationId) return;
    const userRef = ref(database, `users/${conversationId}`);
    get(userRef).then((snapshot) => {
      if (snapshot.exists()) {
        setSelectedUser({ uid: conversationId, ...snapshot.val() });
      }
    });
    const messagesRef = ref(database, "messages");
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      if (!snapshot.exists()) {
        setMessages([]);
        return;
      }
      const allMessages = snapshot.val();
      const conversationMessages = Object.entries(allMessages)
        .filter(([_, msg]: [string, any]) => {
          return (
            (msg.senderId === user.uid && msg.receiverId === conversationId) ||
            (msg.senderId === conversationId && msg.receiverId === user.uid)
          );
        })
        .map(([id, msg]: [string, any]) => ({ id, ...msg }));
      conversationMessages.sort((a, b) => a.timestamp - b.timestamp);
      setMessages(conversationMessages);
      conversationMessages.forEach((msg) => {
        if (msg.receiverId === user.uid && !msg.read) {
          const msgRef = ref(database, `messages/${msg.id}`);
          update(msgRef, { read: true });
        }
      });
    });
    return () => unsubscribe();
  }, [user, conversationId]);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  const handleSendMessage = async () => {
    if (!user || !conversationId || !newMessage.trim()) return;
    try {
      const messageRef = push(ref(database, "messages"));
      await update(messageRef, {
        senderId: user.uid,
        receiverId: conversationId,
        content: newMessage.trim(),
        timestamp: Date.now(),
        read: false,
      });
      setNewMessage("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };
  const handleStartConversation = (userId: string) => {
    navigate(`/messages/${userId}`);
  };
  const filteredFollowers = followers.filter((f) =>
    f.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
     
      <main className="flex-1 lg:ml-0 mt-14 lg:mt-0">
        <div className="h-screen flex flex-col max-w-6xl mx-auto">
          <div className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border p-4">
            <h2 className="text-xl font-bold">Messages</h2>
          </div>
          <div className="flex-1 flex overflow-hidden">
            {/* Conversations List */}
            <div className="w-full md:w-80 border-r border-border flex flex-col">
              <div className="p-4 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search followers..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
             
              <div className="flex-1 overflow-y-auto">
                {searchQuery ? (
                  <div className="space-y-1 p-2">
                    {filteredFollowers.map((follower) => (
                      <div
                        key={follower.uid}
                        className="flex items-center gap-3 p-3 hover:bg-muted rounded-lg cursor-pointer transition-colors"
                        onClick={() => handleStartConversation(follower.uid)}
                      >
                        <Avatar className="h-12 w-12">
                          {follower.photoURL ? (
                            <AvatarImage src={follower.photoURL} alt={follower.username} />
                          ) : (
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {follower.username?.charAt(0).toUpperCase() || "U"}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{follower.displayName}</p>
                          <p className="text-sm text-muted-foreground truncate">@{follower.username}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <p>No conversations yet</p>
                    <p className="text-sm mt-2">Search for followers to start chatting</p>
                  </div>
                ) : (
                  <div className="space-y-1 p-2">
                    {conversations.map((conv) => (
                      <div
                        key={conv.userId}
                        className={`flex items-center gap-3 p-3 hover:bg-muted rounded-lg cursor-pointer transition-colors ${
                          conversationId === conv.userId ? "bg-muted" : ""
                        }`}
                        onClick={() => navigate(`/messages/${conv.userId}`)}
                      >
                        <Avatar className="h-12 w-12">
                          {conv.photoURL ? (
                            <AvatarImage src={conv.photoURL} alt={conv.username} />
                          ) : (
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {conv.username?.charAt(0).toUpperCase() || "U"}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{conv.displayName}</p>
                          <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                        </div>
                        {conv.unreadCount > 0 && (
                          <div className="bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center text-xs">
                            {conv.unreadCount}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {/* Messages Area */}
            <div className={`${conversationId ? "flex" : "hidden md:flex"} flex-1 flex-col ${conversationId ? "absolute inset-0 bg-card z-20 md:relative md:z-auto" : ""}`}>
              {conversationId && selectedUser ? (
                <>
                  <div className="border-b border-border p-4 flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="md:hidden"
                      onClick={() => navigate("/messages")}
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <Avatar className="h-10 w-10">
                      {selectedUser.photoURL ? (
                        <AvatarImage src={selectedUser.photoURL} alt={selectedUser.username} />
                      ) : (
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {selectedUser.username?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <p className="font-semibold">{selectedUser.displayName}</p>
                      <p className="text-sm text-muted-foreground">@{selectedUser.username}</p>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.senderId === user?.uid ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                            msg.senderId === user?.uid
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="break-words">{msg.content}</p>
                          <p className={`text-xs mt-1 ${msg.senderId === user?.uid ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                  <div className="border-t border-border p-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                      />
                      <Button onClick={handleSendMessage} size="icon">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <p>Select a conversation to start messaging</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
export default Messages;
 
