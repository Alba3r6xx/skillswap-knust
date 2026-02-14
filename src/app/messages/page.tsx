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
  X,
  Play,
  Pause,
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

function VoiceMessage({ src, isMine }: { src: string; isMine: boolean }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); } else { a.play(); }
    setPlaying(!playing);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // Generate deterministic waveform from URL hash
  const bars = Array.from({ length: 28 }, (_, i) => {
    const hash = (src.charCodeAt((i * 7) % src.length) * 31 + i * 13) % 100;
    return 6 + (hash / 100) * 22;
  });

  return (
    <div className="flex items-center gap-2.5 min-w-[200px]">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={() => { if (audioRef.current) setDuration(audioRef.current.duration); }}
        onTimeUpdate={() => {
          if (audioRef.current && duration > 0) setProgress((audioRef.current.currentTime / duration) * 100);
        }}
        onEnded={() => { setPlaying(false); setProgress(0); }}
      />
      <button
        onClick={toggle}
        className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${
          isMine ? "bg-white/20 hover:bg-white/30" : "bg-amber-500 hover:bg-amber-600"
        }`}
      >
        {playing
          ? <Pause className={`h-4 w-4 ${isMine ? "text-white" : "text-white"}`} />
          : <Play className={`h-4 w-4 ml-0.5 ${isMine ? "text-white" : "text-white"}`} />
        }
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-end gap-[1.5px] h-6">
          {bars.map((h, i) => {
            const filled = progress > (i / bars.length) * 100;
            return (
              <span
                key={i}
                className={`w-[2.5px] rounded-full transition-colors duration-150 ${
                  filled
                    ? isMine ? "bg-white" : "bg-amber-500"
                    : isMine ? "bg-white/30" : "bg-gray-300 dark:bg-gray-600"
                }`}
                style={{ height: `${h}px` }}
              />
            );
          })}
        </div>
        <span className={`text-[10px] mt-0.5 block ${isMine ? "text-amber-100" : "text-muted-foreground"}`}>
          {playing ? formatTime((audioRef.current?.currentTime || 0)) : formatTime(duration || 0)}
        </span>
      </div>
    </div>
  );
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
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioMime, setAudioMime] = useState("");
  const [waveformBars, setWaveformBars] = useState<number[]>(new Array(24).fill(4));
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);

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
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/mp4";
      const mediaRecorder = new MediaRecorder(stream, { mimeType: mime });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      setAudioMime(mime);

      // Web Audio API for real waveform
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      const updateBars = () => {
        if (!analyserRef.current) return;
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);
        const bars = Array.from({ length: 24 }, (_, i) => {
          const val = data[Math.floor((i / 24) * data.length)] || 0;
          return Math.max(3, (val / 255) * 28);
        });
        setWaveformBars(bars);
        animFrameRef.current = requestAnimationFrame(updateBars);
      };
      updateBars();

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        cancelAnimationFrame(animFrameRef.current);
        audioCtx.close().catch(() => {});
        analyserRef.current = null;
        audioContextRef.current = null;
        setWaveformBars(new Array(24).fill(4));

        const blob = new Blob(audioChunksRef.current, { type: mime });
        if (blob.size < 500) {
          setRecordingDuration(0);
          return;
        }
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioPreview(url);
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
    cancelAnimationFrame(animFrameRef.current);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const discardVoiceNote = () => {
    if (audioPreview) URL.revokeObjectURL(audioPreview);
    setAudioPreview(null);
    setAudioBlob(null);
    setRecordingDuration(0);
  };

  const sendVoiceNote = async () => {
    if (!audioBlob || !user || !selectedPeerId || sending) return;
    setSending(true);
    const ext = audioMime.includes("webm") ? "webm" : "m4a";
    const fileName = `${user.id}/${Date.now()}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("audio-messages")
      .upload(fileName, audioBlob, { contentType: audioMime });

    if (uploadErr) {
      console.error("Upload error:", uploadErr);
      toast.error("Failed to upload voice note: " + uploadErr.message);
      setSending(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("audio-messages")
      .getPublicUrl(fileName);

    const { data: msgData, error: msgErr } = await sendMessage({
      sender_id: user.id,
      receiver_id: selectedPeerId,
      content: urlData.publicUrl,
      type: "audio",
    });

    if (msgErr) {
      console.error("Send voice error:", msgErr);
      toast.error("Failed to send voice note");
    } else if (msgData) {
      setMessages((prev) => [...prev, msgData]);
      fetchConversations();
    }
    discardVoiceNote();
    setSending(false);
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
                              {conv.lastMessage.type === "audio" ? (
                                <span className="flex items-center gap-1"><Mic className="h-3 w-3" /> Voice note</span>
                              ) : conv.lastMessage.content}
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
                <div className="flex-1 overflow-y-auto px-3 py-4 min-h-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMC41IiBmaWxsPSIjZTVlN2ViIiBvcGFjaXR5PSIwLjMiLz48L3N2Zz4=')] dark:bg-none">
                  {messages.length === 0 && (
                    <div className="text-center py-16">
                      <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                        <MessageSquare className="h-7 w-7 text-amber-400" />
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">No messages yet</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">Say hello to start the conversation</p>
                    </div>
                  )}
                  <div className="space-y-1">
                    {messages.map((msg, idx) => {
                      const isMine = msg.sender_id === user.id;
                      const prevMsg = idx > 0 ? messages[idx - 1] : null;
                      const sameSender = prevMsg?.sender_id === msg.sender_id;
                      const isAudio = msg.type === "audio";

                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isMine ? "justify-end" : "justify-start"} ${!sameSender ? "mt-3" : ""}`}
                        >
                          <div
                            className={`relative max-w-[80%] sm:max-w-[70%] text-sm shadow-sm ${
                              isAudio ? "px-3 py-2.5" : "px-3.5 py-2"
                            } ${
                              isMine
                                ? `bg-gradient-to-br from-amber-500 to-amber-600 text-white ${!sameSender ? "rounded-2xl rounded-br-md" : "rounded-2xl rounded-br-md"}`
                                : `bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 ${!sameSender ? "rounded-2xl rounded-bl-md" : "rounded-2xl rounded-bl-md"}`
                            }`}
                          >
                            {isAudio ? (
                              <VoiceMessage src={msg.content} isMine={isMine} />
                            ) : (
                              <p className="break-words leading-relaxed">{msg.content}</p>
                            )}
                            <div className={`flex items-center justify-end gap-0.5 ${isAudio ? "" : "mt-1"} ${isMine ? "text-amber-100/80" : "text-muted-foreground/60"}`}>
                              <span className="text-[10px]">
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                              <ReadReceipt msg={msg} isMine={isMine} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-3 border-t shrink-0 bg-background">
                  {audioPreview ? (
                    /* Voice note preview — listen before sending */
                    <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-500/10 rounded-xl p-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 shrink-0 text-red-500 hover:text-red-600 hover:bg-red-100 rounded-full"
                        onClick={discardVoiceNote}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <div className="flex-1 min-w-0">
                        <audio controls src={audioPreview} className="w-full h-8" style={{ filter: "sepia(20%) saturate(70%) grayscale(1) contrast(99%) invert(12%)" }} />
                      </div>
                      <Button
                        size="icon"
                        disabled={sending}
                        className="h-9 w-9 rounded-full bg-amber-500 hover:bg-amber-600 text-white shrink-0"
                        onClick={sendVoiceNote}
                      >
                        {sending ? <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                    </div>
                  ) : recording ? (
                    /* Recording in progress */
                    <div className="flex items-center gap-3">
                      <span className="h-3 w-3 rounded-full bg-red-500 animate-pulse shrink-0" />
                      <span className="text-sm font-medium text-red-500 tabular-nums">
                        {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, "0")}
                      </span>
                      <div className="flex-1 flex items-center justify-center gap-[2px] h-8">
                        {waveformBars.map((h, i) => (
                          <span
                            key={i}
                            className="w-[3px] bg-red-500 rounded-full transition-all duration-75"
                            style={{ height: `${h}px` }}
                          />
                        ))}
                      </div>
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
                    /* Normal text input */
                    <form
                      onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                      className="flex gap-2"
                    >
                      <input
                        ref={inputRef}
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => { setNewMessage(e.target.value); broadcastTyping(); }}
                        className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        autoComplete="off"
                        autoCorrect="on"
                        autoCapitalize="sentences"
                        spellCheck={true}
                        enterKeyHint="send"
                        data-form-type="other"
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
