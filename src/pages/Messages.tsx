import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Search, ArrowLeft, MessageCircle } from "lucide-react";
import {
  ref,
  onValue,
  push,
  update,
  get,
} from "firebase/database";
import { database } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Virtuoso } from "react-virtuoso";

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

  /* --------------------------------------------------------------
     1. Load mutual followers (people you can message)
  -------------------------------------------------------------- */
  useEffect(() => {
    if (!user) return;
    const followingRef = ref(database, `following/${user.uid}`);
    const unsubscribe = onValue(followingRef, async (snap) => {
      if (!snap.exists()) {
        setFollowers([]);
        return;
      }
      const followingIds = Object.keys(snap.val());
      const followersSnap = await get(ref(database, `followers/${user.uid}`));
      if (!followersSnap.exists()) return;

      const followerIds = Object.keys(followersSnap.val());
      const mutualIds = followingIds.filter((id) => followerIds.includes(id));

      const data = await Promise.all(
        mutualIds.map(async (id) => {
          const uSnap = await get(ref(database, `users/${id}`));
          return { uid: id, ...uSnap.val() };
        })
      );
      setFollowers(data);
    });
    return () => unsubscribe();
  }, [user]);

  /* --------------------------------------------------------------
     2. Build conversation list (latest message preview + unread)
  -------------------------------------------------------------- */
  useEffect(() => {
    if (!user) return;
    const msgRef = ref(database, "messages");
    const unsubscribe = onValue(msgRef, async (snap) => {
      if (!snap.exists()) {
        setConversations([]);
        return;
      }
      const raw = snap.val();
      const map = new Map<string, Conversation>();

      Object.entries(raw).forEach(([id, m]: [string, any]) => {
        if (m.senderId !== user.uid && m.receiverId !== user.uid) return;
        const other = m.senderId === user.uid ? m.receiverId : m.senderId;

        const existing = map.get(other);
        const unread = m.receiverId === user.uid && !m.read ? 1 : 0;

        if (!existing || m.timestamp > existing.lastMessageTime) {
          map.set(other, {
            userId: other,
            username: "",
            displayName: "",
            photoURL: "",
            lastMessage: m.content,
            lastMessageTime: m.timestamp,
            unreadCount: existing ? existing.unreadCount + unread : unread,
          });
        } else if (unread) {
          existing.unreadCount += unread;
        }
      });

      const convs = await Promise.all(
        Array.from(map.values()).map(async (c) => {
          const uSnap = await get(ref(database, `users/${c.userId}`));
          if (!uSnap.exists()) return c;
          const u = uSnap.val();
          return { ...c, username: u.username, displayName: u.displayName, photoURL: u.photoURL };
        })
      );

      convs.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
      setConversations(convs);
    });
    return () => unsubscribe();
  }, [user]);

  /* --------------------------------------------------------------
     3. Load selected conversation + real-time messages
  -------------------------------------------------------------- */
  useEffect(() => {
    if (!user || !conversationId) return;

    // selected user meta
    get(ref(database, `users/${conversationId}`)).then((s) => {
      if (s.exists()) setSelectedUser({ uid: conversationId, ...s.val() });
    });

    const msgRef = ref(database, "messages");
    const unsub = onValue(msgRef, (snap) => {
      if (!snap.exists()) {
        setMessages([]);
        return;
      }
      const raw = snap.val();
      const list: Message[] = [];

      Object.entries(raw).forEach(([id, m]: [string, any]) => {
        if (
          (m.senderId === user.uid && m.receiverId === conversationId) ||
          (m.senderId === conversationId && m.receiverId === user.uid)
        ) {
          list.push({ id, ...m });
          // mark as read
          if (m.receiverId === user.uid && !m.read) {
            update(ref(database, `messages/${id}`), { read: true });
          }
        }
      });

      list.sort((a, b) => a.timestamp - b.timestamp);
      setMessages(list);
    });

    return () => unsub();
  }, [user, conversationId]);

  /* --------------------------------------------------------------
     4. Auto-scroll to bottom
  -------------------------------------------------------------- */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* --------------------------------------------------------------
     5. Send message
  -------------------------------------------------------------- */
  const send = async () => {
    if (!user || !conversationId || !newMessage.trim()) return;
    try {
      const r = push(ref(database, "messages"));
      await update(r, {
        senderId: user.uid,
        receiverId: conversationId,
        content: newMessage.trim(),
        timestamp: Date.now(),
        read: false,
      });
      setNewMessage("");
    } catch {
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
    }
  };

  const startChat = (uid: string) => navigate(`/messages/${uid}`);

  const filtered = followers.filter(
    (f) =>
      f.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /* --------------------------------------------------------------
     UI
  -------------------------------------------------------------- */
  return (
    <div className="flex h-screen w-full bg-background">
      <Sidebar />

      {/* ---------- MAIN CONTAINER ---------- */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full">

        {/* ---------- LEFT PANEL (Conversations) ---------- */}
        <section className="w-full md:w-96 border-r border-border flex flex-col bg-card">
          {/* Header */}
          <header className="p-4 border-b border-border flex items-center justify-between">
            <h1 className="text-xl font-semibold">Messages</h1>
          </header>

          {/* Search */}
          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search followers..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Conversation List (virtualized) */}
          <div className="flex-1 overflow-hidden">
            {searchQuery ? (
              <Virtuoso
                data={filtered}
                itemContent={(_, f) => (
                  <div
                    key={f.uid}
                    onClick={() => startChat(f.uid)}
                    className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={f.photoURL} />
                      <AvatarFallback>{f.username?.[0]?.toUpperCase() ?? "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{f.displayName}</p>
                      <p className="text-sm text-muted-foreground truncate">@{f.username}</p>
                    </div>
                  </div>
                )}
              />
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <MessageCircle className="h-12 w-12 mb-3 opacity-30" />
                <p>No conversations yet</p>
                <p className="text-sm mt-1">Search followers to start chatting</p>
              </div>
            ) : (
              <Virtuoso
                data={conversations}
                itemContent={(_, c) => (
                  <div
                    key={c.userId}
                    onClick={() => navigate(`/messages/${c.userId}`)}
                    className={`flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors ${
                      conversationId === c.userId ? "bg-muted/70" : ""
                    }`}
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={c.photoURL} />
                      <AvatarFallback>{c.username?.[0]?.toUpperCase() ?? "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{c.displayName}</p>
                      <p className="text-sm text-muted-foreground truncate">{c.lastMessage}</p>
                    </div>
                    {c.unreadCount > 0 && (
                      <div className="bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center text-xs font-medium">
                        {c.unreadCount}
                      </div>
                    )}
                  </div>
                )}
              />
            )}
          </div>
        </section>

        {/* ---------- RIGHT PANEL (Chat) ---------- */}
        <section className="flex-1 flex flex-col bg-background relative">
          {conversationId && selectedUser ? (
            <>
              {/* Chat Header */}
              <header className="flex items-center gap-3 p-4 border-b border-border bg-card">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => navigate("/messages")}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedUser.photoURL} />
                  <AvatarFallback>{selectedUser.username?.[0]?.toUpperCase() ?? "U"}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{selectedUser.displayName}</p>
                  <p className="text-sm text-muted-foreground">@{selectedUser.username}</p>
                </div>
              </header>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.senderId === user?.uid ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm ${
                        m.senderId === user?.uid
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="break-words">{m.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          m.senderId === user?.uid ? "text-primary-foreground/70" : "text-muted-foreground"
                        }`}
                      >
                        {new Date(m.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-border bg-card">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
                  />
                  <Button onClick={send} size="icon" disabled={!newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Messages;
