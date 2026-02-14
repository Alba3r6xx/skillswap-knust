"use client";

import { Suspense, useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getConversations, getMessagesBetween, sendMessage, markMessagesAsRead, getProfileById } from "@/lib/data";
import { Message, Profile } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Send,
  ArrowLeft,
  MessageSquare,
  Check,
  CheckCheck,
  Mic,
  Square,
} from "lucide-react";
import { toast } from "sonner";

interface Conversation {
  peerId: string;
  lastMessage: Message;
  messages: Message[];
  unreadCount: number;
}

function ReadReceipt({ msg, isMine }: { msg: Message; isMine: boolean }) {
  if (!isMine) return null;
  if (msg.read) {
    return <CheckCheck className="h-3.5 w-3.5 text-blue-400 inline-block ml-1 shrink-0" />;
  }
  if (msg.delivered) {
    return <CheckCheck className="h-3.5 w-3.5 text-gray-300 inline-block ml-1 shrink-0" />;
  }
  return <Check className="h-3 w-3 text-amber-200 inline-block ml-1 shrink-0" />;
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="h-[100dvh] flex items-center justify-center"><div className="animate-pulse text-amber-500">Loading...</div></div>}>
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
  const inputRef = useRef<HTMLInputElement>(null);
  const [peerTyping, setPeerTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [isLoading, user, router]);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!user) return;
    const convos = await getConversations(user.id);
    setConversations(convos);

    const profiles: Record<string, Profile> = { ...peerProfiles };
    const profilesToFetch: string[] = [];
    for (const c of convos) {
      if (!profiles[c.peerId]) profilesToFetch.push(c.peerId);
    }
    if (initialPeer && !profiles[initialPeer]) profilesToFetch.push(initialPeer);

    const fetched = await Promise.all(profilesToFetch.map((id) => getProfileById(id)));
    fetched.forEach((p) => { if (p) profiles[p.id] = p; });

    setPeerProfiles(profiles);
    setLoading(false);
  }, [user, initialPeer]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Typing indicator channel
  useEffect(() => {
    if (!user || !selectedPeerId) return;
    const pairId = [user.id, selectedPeerId].sort().join("_");
    const typingChannel = supabase.channel(`typing-${pairId}`);
    typingChannelRef.current = typingChannel;

    typingChannel
      .on("broadcast", { event: "typing" }, (payload) => {
        if (payload.payload?.userId === selectedPeerId) {
          setPeerTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setPeerTyping(false), 2500);
        }
      })
      .subscribe();

    return () => {
      setPeerTyping(false);
      supabase.removeChannel(typingChannel);
      typingChannelRef.current = null;
    };
  }, [selectedPeerId, user]);

  const broadcastTyping = useCallback(() => {
    if (!user || !typingChannelRef.current) return;
    typingChannelRef.current.send({
      type: "broadcast",
      event: "typing",
      payload: { userId: user.id },
    });
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

    // Subscribe to realtime messages — INSERT (new messages) + UPDATE (read receipts)
    const channel = supabase
      .channel(`chat-${selectedPeerId}`)
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
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const updated = payload.new as Message;
          setMessages((prev) =>
            prev.map((m) => (m.id === updated.id ? { ...m, read: updated.read, delivered: updated.delivered } : m))
          );
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
    // Keep focus on input after sending (important for mobile)
    inputRef.current?.focus();
  };

  const startRecording = async () => {
    if (!user || !selectedPeerId) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/mp4",
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        setRecordingDuration(0);

        const blob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
        if (blob.size < 1000) return; // too short

        setSending(true);
        const ext = mediaRecorder.mimeType.includes("webm") ? "webm" : "m4a";
        const fileName = `${user.id}/${Date.now()}.${ext}`;

        const { error: uploadErr } = await supabase.storage
          .from("audio-messages")
          .upload(fileName, blob, { contentType: mediaRecorder.mimeType });

        if (uploadErr) {
          toast.error("Failed to upload voice note");
          setSending(false);
          return;
        }

        const { data: urlData } = supabase.storage
          .from("audio-messages")
          .getPublicUrl(fileName);

        const { data: msgData } = await sendMessage({
          sender_id: user.id,
          receiver_id: selectedPeerId,
          content: urlData.publicUrl,
          type: "audio",
        });

        if (msgData) {
          setMessages((prev) => [...prev, msgData]);
          fetchConversations();
        }
        setSending(false);
      };

      mediaRecorder.start();
      setRecording(true);
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((d) => d + 1);
      }, 1000);
    } catch {
      toast.error("Microphone access denied");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  if (isLoading || !user) {
    return (
      <div className="bg-gray-50 dark:bg-background p-6">
        <Skeleton className="h-96 w-full max-w-4xl mx-auto" />
      </div>
    );
  }

  const selectedPeer = selectedPeerId ? peerProfiles[selectedPeerId] : null;

  return (
    <div className="h-[calc(100dvh-3.5rem)] md:h-[calc(100dvh)] bg-gray-50 dark:bg-background flex flex-col">
      {/* Header - only show on conversation list view or desktop */}
      <div className={`${selectedPeerId ? "hidden md:block" : "block"} px-4 pt-4 pb-2 md:pt-6 md:pb-4 max-w-4xl mx-auto w-full`}>
        <h1 className="text-2xl font-bold">Messages</h1>
      </div>

      <div className="flex-1 flex flex-col md:flex-row max-w-4xl mx-auto w-full px-4 pb-4 min-h-0">
        <div className="flex-1 flex md:rounded-xl md:border md:overflow-hidden min-h-0">
          {/* Conversation List */}
          <div className={`${selectedPeerId ? "hidden md:flex" : "flex"} flex-col w-full md:w-80 md:border-r min-h-0`}>
            <div className="p-3 border-b bg-background">
              <p className="text-sm font-medium text-muted-foreground">Conversations</p>
            </div>
            <div className="flex-1 overflow-y-auto bg-background">
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
                  {initialPeer && !conversations.some((c) => c.peerId === initialPeer) && peerProfiles[initialPeer] && (
                    <button
                      className={`flex items-center gap-3 w-full p-3 border-b hover:bg-gray-50 dark:hover:bg-muted transition-colors text-left ${
                        selectedPeerId === initialPeer ? "bg-amber-50 dark:bg-amber-500/10" : ""
                      }`}
                      onClick={() => setSelectedPeerId(initialPeer)}
                    >
                      <Avatar className="h-10 w-10 shrink-0">
                        {peerProfiles[initialPeer].avatar_url ? (
                          <img src={peerProfiles[initialPeer].avatar_url} alt="" className="h-full w-full object-cover rounded-full" />
                        ) : (
                          <AvatarFallback className="bg-amber-100 text-amber-700 text-sm font-semibold">
                            {peerProfiles[initialPeer].name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                          </AvatarFallback>
                        )}
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
                    const isMineLastMsg = conv.lastMessage.sender_id === user.id;
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
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-xs text-muted-foreground truncate flex items-center">
                              {isMineLastMsg && (
                                conv.lastMessage.read
                                  ? <CheckCheck className="h-3 w-3 text-blue-500 mr-1 shrink-0" />
                                  : conv.lastMessage.delivered
                                    ? <CheckCheck className="h-3 w-3 text-gray-400 mr-1 shrink-0" />
                                    : <Check className="h-3 w-3 text-muted-foreground mr-1 shrink-0" />
                              )}
                              {conv.lastMessage.content}
                            </p>
                            {conv.unreadCount > 0 && (
                              <Badge className="bg-amber-500 text-white text-[10px] h-5 w-5 flex items-center justify-center rounded-full p-0 shrink-0">
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
          <div className={`${selectedPeerId ? "flex" : "hidden md:flex"} flex-col flex-1 bg-background min-h-0`}>
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
                <div className="flex items-center gap-3 p-3 border-b shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden shrink-0"
                    onClick={() => setSelectedPeerId(null)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  {selectedPeer && (
                    <Link href={`/profile/${selectedPeerId}`} className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-9 w-9 shrink-0">
                        {selectedPeer.avatar_url ? (
                          <img src={selectedPeer.avatar_url} alt={selectedPeer.name} className="h-full w-full object-cover rounded-full" />
                        ) : (
                          <AvatarFallback className="bg-amber-100 text-amber-700 text-sm">
                            {selectedPeer.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{selectedPeer.name}</p>
                        {peerTyping ? (
                          <p className="text-xs text-green-600 dark:text-green-400 animate-pulse">typing...</p>
                        ) : (
                          <p className="text-xs text-muted-foreground truncate">{selectedPeer.faculty}</p>
                        )}
                      </div>
                    </Link>
                  )}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0">
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
                          className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-3 py-2 text-sm ${
                            isMine
                              ? "bg-amber-500 text-white rounded-br-sm"
                              : "bg-muted rounded-bl-sm"
                          }`}
                        >
                          {msg.type === "audio" ? (
                            <audio controls preload="metadata" className="max-w-[220px] h-8">
                              <source src={msg.content} type="audio/webm" />
                              <source src={msg.content} type="audio/mp4" />
                            </audio>
                          ) : (
                            <p className="break-words">{msg.content}</p>
                          )}
                          <div className={`flex items-center justify-end gap-0.5 mt-0.5 ${isMine ? "text-amber-100" : "text-muted-foreground"}`}>
                            <span className="text-[10px]">
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            <ReadReceipt msg={msg} isMine={isMine} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-3 border-t shrink-0 bg-background">
                  {recording ? (
                    <div className="flex items-center gap-3">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-sm font-medium text-red-500">
                        {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, "0")}
                      </span>
                      <span className="text-xs text-muted-foreground flex-1">Recording...</span>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="shrink-0"
                        onClick={stopRecording}
                      >
                        <Square className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <form
                      onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                      className="flex gap-2"
                    >
                      <Input
                        ref={inputRef}
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => { setNewMessage(e.target.value); broadcastTyping(); }}
                        className="flex-1"
                        autoComplete="off"
                      />
                      {newMessage.trim() ? (
                        <Button
                          type="submit"
                          size="icon"
                          disabled={sending}
                          className="bg-amber-500 hover:bg-amber-600 text-white shrink-0"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="icon"
                          className="bg-amber-500 hover:bg-amber-600 text-white shrink-0"
                          onClick={startRecording}
                        >
                          <Mic className="h-4 w-4" />
                        </Button>
                      )}
                    </form>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
