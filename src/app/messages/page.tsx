"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getConversations, getMessagesBetween, sendMessage, markMessagesAsRead, getProfileById } from "@/lib/data";
import { Message, Profile } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Send,
  ArrowLeft,
  MessageSquare,
} from "lucide-react";

interface Conversation {
  peerId: string;
  lastMessage: Message;
  messages: Message[];
  unreadCount: number;
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-pulse text-amber-500">Loading...</div></div>}>
      <MessagesContent />
    </Suspense>
  );
}

function MessagesContent() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPeer = searchParams.get("peer");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedPeerId, setSelectedPeerId] = useState<string | null>(initialPeer);
  const [peerProfiles, setPeerProfiles] = useState<Record<string, Profile>>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [isLoading, user, router]);

  // Fetch conversations
  const fetchConversations = async () => {
    if (!user) return;
    const convos = await getConversations(user.id);
    setConversations(convos);

    // Fetch peer profiles
    const profiles: Record<string, Profile> = { ...peerProfiles };
    for (const c of convos) {
      if (!profiles[c.peerId]) {
        const p = await getProfileById(c.peerId);
        if (p) profiles[c.peerId] = p;
      }
    }

    // Also fetch initial peer if from URL
    if (initialPeer && !profiles[initialPeer]) {
      const p = await getProfileById(initialPeer);
      if (p) profiles[initialPeer] = p;
    }

    setPeerProfiles(profiles);
    setLoading(false);
  };

  useEffect(() => {
    fetchConversations();
  }, [user]);

  // Fetch messages for selected peer
  useEffect(() => {
    if (!user || !selectedPeerId) return;

    const fetchMessages = async () => {
      const msgs = await getMessagesBetween(user.id, selectedPeerId);
      setMessages(msgs);
      await markMessagesAsRead(user.id, selectedPeerId);
    };
    fetchMessages();

    // Subscribe to realtime messages
    const channel = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          if (newMsg.sender_id === selectedPeerId) {
            setMessages((prev) => [...prev, newMsg]);
            markMessagesAsRead(user.id, selectedPeerId);
          }
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedPeerId, user]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user || !selectedPeerId || sending) return;
    setSending(true);
    const { data } = await sendMessage({
      sender_id: user.id,
      receiver_id: selectedPeerId,
      content: newMessage.trim(),
    });
    if (data) {
      setMessages((prev) => [...prev, data]);
      setNewMessage("");
      fetchConversations();
    }
    setSending(false);
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-background p-6">
        <Skeleton className="h-96 w-full max-w-4xl mx-auto" />
      </div>
    );
  }

  const selectedPeer = selectedPeerId ? peerProfiles[selectedPeerId] : null;

  return (
    <div className="min-h-screen md:min-h-screen bg-gray-50 dark:bg-background">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <h1 className="text-2xl font-bold mb-4 md:mb-6">Messages</h1>

        <Card className="overflow-hidden">
          <div className="flex h-[calc(100vh-200px)] min-h-[500px]">
            {/* Conversation List */}
            <div className={`${selectedPeerId ? "hidden md:flex" : "flex"} flex-col w-full md:w-80 border-r`}>
              <div className="p-3 border-b">
                <p className="text-sm font-medium text-muted-foreground">Conversations</p>
              </div>
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14" />)}
                  </div>
                ) : conversations.length === 0 && !initialPeer ? (
                  <div className="p-6 text-center">
                    <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No messages yet</p>
                    <Link href="/search">
                      <Button size="sm" className="mt-2 bg-amber-500 hover:bg-amber-600 text-white">
                        Find Peers
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <>
                    {/* Show initial peer even if no conversation yet */}
                    {initialPeer && !conversations.some((c) => c.peerId === initialPeer) && peerProfiles[initialPeer] && (
                      <button
                        className={`flex items-center gap-3 w-full p-3 border-b hover:bg-gray-50 dark:hover:bg-muted transition-colors text-left ${
                          selectedPeerId === initialPeer ? "bg-amber-50 dark:bg-amber-500/10" : ""
                        }`}
                        onClick={() => setSelectedPeerId(initialPeer)}
                      >
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarFallback className="bg-amber-100 text-amber-700 text-sm font-semibold">
                            {peerProfiles[initialPeer].name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{peerProfiles[initialPeer].name}</p>
                          <p className="text-xs text-muted-foreground">Start a conversation</p>
                        </div>
                      </button>
                    )}
                    {conversations.map((conv) => {
                      const peer = peerProfiles[conv.peerId];
                      if (!peer) return null;
                      const initials = peer.name.split(" ").map((n) => n[0]).join("").toUpperCase();
                      const isActive = selectedPeerId === conv.peerId;
                      return (
                        <button
                          key={conv.peerId}
                          className={`flex items-center gap-3 w-full p-3 border-b hover:bg-gray-50 dark:hover:bg-muted transition-colors text-left ${
                            isActive ? "bg-amber-50 dark:bg-amber-500/10" : ""
                          }`}
                          onClick={() => setSelectedPeerId(conv.peerId)}
                        >
                          <Avatar className="h-10 w-10 shrink-0">
                            {peer.avatar_url ? (
                              <img src={peer.avatar_url} alt={peer.name} className="h-full w-full object-cover rounded-full" />
                            ) : (
                              <AvatarFallback className="bg-amber-100 text-amber-700 text-sm font-semibold">
                                {initials}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium truncate">{peer.name}</p>
                              <span className="text-[10px] text-muted-foreground shrink-0">
                                {new Date(conv.lastMessage.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-muted-foreground truncate">
                                {conv.lastMessage.sender_id === user.id ? "You: " : ""}
                                {conv.lastMessage.content}
                              </p>
                              {conv.unreadCount > 0 && (
                                <Badge className="bg-amber-500 text-white text-[10px] h-5 w-5 flex items-center justify-center rounded-full p-0 shrink-0 ml-1">
                                  {conv.unreadCount}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </>
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className={`${selectedPeerId ? "flex" : "hidden md:flex"} flex-col flex-1`}>
              {!selectedPeerId ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">Select a conversation to start chatting</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Chat Header */}
                  <div className="flex items-center gap-3 p-3 border-b">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="md:hidden shrink-0"
                      onClick={() => setSelectedPeerId(null)}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    {selectedPeer && (
                      <Link href={`/profile/${selectedPeerId}`} className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          {selectedPeer.avatar_url ? (
                            <img src={selectedPeer.avatar_url} alt={selectedPeer.name} className="h-full w-full object-cover rounded-full" />
                          ) : (
                            <AvatarFallback className="bg-amber-100 text-amber-700 text-sm">
                              {selectedPeer.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold">{selectedPeer.name}</p>
                          <p className="text-xs text-muted-foreground">{selectedPeer.faculty}</p>
                        </div>
                      </Link>
                    )}
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-sm text-muted-foreground">No messages yet. Say hello! 👋</p>
                      </div>
                    )}
                    {messages.map((msg) => {
                      const isMine = msg.sender_id === user.id;
                      return (
                        <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                              isMine
                                ? "bg-amber-500 text-white rounded-br-md"
                                : "bg-muted rounded-bl-md"
                            }`}
                          >
                            <p>{msg.content}</p>
                            <p className={`text-[10px] mt-1 ${isMine ? "text-amber-100" : "text-muted-foreground"}`}>
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="p-3 border-t">
                    <form
                      onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                      className="flex gap-2"
                    >
                      <Input
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="submit"
                        size="icon"
                        disabled={!newMessage.trim() || sending}
                        className="bg-amber-500 hover:bg-amber-600 text-white shrink-0"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
