"use client";

import { Suspense, useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getConversations, getMessagesBetween, sendMessage, markMessagesAsRead, getProfileById, deleteMessage, togglePinMessage } from "@/lib/data";
import { Message, Profile } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// Input replaced with native <input> for iOS keyboard compatibility
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
  ImagePlus,
  Paperclip,
  FileText,
  Download,
  Reply,
  Trash2,
  Pin,
  PinOff,
  Copy,
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
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const [playing, setPlaying] = useState(false);
  const [dur, setDur] = useState(0);
  const [displayTime, setDisplayTime] = useState(0);
  const progressRef = useRef(0);

  const fmt = (s: number) => {
    if (!s || !isFinite(s) || isNaN(s)) return "0:00";
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
  };

  // Deterministic bar heights from URL hash
  const barsData = useRef(
    Array.from({ length: 36 }, (_, i) => {
      const s = src.length > 10 ? src : src + "pad123456789";
      const c1 = s.charCodeAt((i * 3) % s.length);
      const c2 = s.charCodeAt((i * 7 + 5) % s.length);
      const c3 = s.charCodeAt((i * 11 + 3) % s.length);
      const v = ((c1 * 31 + c2 * 17 + c3 * 13 + i * 7) % 100) / 100;
      return 0.15 + v * 0.85;
    })
  ).current;

  // Canvas-based waveform rendering — silky smooth at 60fps
  const drawWaveform = useCallback((pct: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const barCount = barsData.length;
    const gap = 2;
    const barW = Math.max(2, (w - gap * (barCount - 1)) / barCount);
    const maxH = h - 4;
    const filledColor = isMine ? "rgba(255,255,255,1)" : "#f59e0b";
    const unfilledColor = isMine ? "rgba(255,255,255,0.25)" : "rgba(161,161,170,0.5)";

    for (let i = 0; i < barCount; i++) {
      const x = i * (barW + gap);
      const barH = Math.max(3, barsData[i] * maxH);
      const barPct = (i / barCount) * 100;
      ctx.fillStyle = pct > barPct ? filledColor : unfilledColor;
      ctx.beginPath();
      ctx.roundRect(x, h / 2 - barH / 2, barW, barH, barW / 2);
      ctx.fill();
    }

    // Seek dot
    const dotX = (pct / 100) * w;
    const dotR = 5;
    ctx.fillStyle = isMine ? "#ffffff" : "#f59e0b";
    ctx.shadowColor = "rgba(0,0,0,0.3)";
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.arc(Math.max(dotR, Math.min(w - dotR, dotX)), h / 2, dotR, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }, [isMine, barsData]);

  // Animation loop — runs at 60fps while playing
  useEffect(() => {
    const tick = () => {
      const a = audioRef.current;
      if (a && !a.paused && dur > 0 && isFinite(dur)) {
        const pct = (a.currentTime / dur) * 100;
        progressRef.current = pct;
        setDisplayTime(a.currentTime);
        drawWaveform(pct);
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    if (playing) {
      rafRef.current = requestAnimationFrame(tick);
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, dur, drawWaveform]);

  // Draw initial state
  useEffect(() => {
    drawWaveform(progressRef.current);
  }, [drawWaveform]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); } else { a.play().catch(() => {}); }
  };

  const handleSeek = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const a = audioRef.current;
    const canvas = canvasRef.current;
    if (!a || !canvas || !dur || !isFinite(dur)) return;
    const rect = canvas.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    a.currentTime = pct * dur;
    progressRef.current = pct * 100;
    setDisplayTime(a.currentTime);
    drawWaveform(pct * 100);
  };

  return (
    <div className="flex items-center gap-3 w-full">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={() => {
          const a = audioRef.current;
          if (a && isFinite(a.duration) && a.duration > 0) setDur(a.duration);
        }}
        onDurationChange={() => {
          const a = audioRef.current;
          if (a && isFinite(a.duration) && a.duration > 0) setDur(a.duration);
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          progressRef.current = 0;
          setDisplayTime(0);
          drawWaveform(0);
        }}
      />
      <button
        onClick={toggle}
        className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 active:scale-95 ${
          isMine
            ? "bg-white/20 hover:bg-white/30"
            : "bg-amber-500 hover:bg-amber-600 shadow-sm"
        }`}
      >
        {playing
          ? <Pause className="h-4 w-4 text-white" fill="white" />
          : <Play className="h-4 w-4 ml-0.5 text-white" fill="white" />
        }
      </button>
      <div className="flex-1 min-w-0">
        <canvas
          ref={canvasRef}
          className="w-full h-7 cursor-pointer"
          onClick={handleSeek}
        />
        <span className={`text-[10px] tabular-nums block mt-0.5 ${isMine ? "text-white/70" : "text-muted-foreground"}`}>
          {playing ? fmt(displayTime) : fmt(dur)}
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
  const inputRef = useRef<HTMLDivElement>(null);
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
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [contextMenu, setContextMenu] = useState<{ msg: Message; x: number; y: number } | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTouchDevice = useRef(false);

  useEffect(() => {
    isTouchDevice.current = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }, []);

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
            prev.map((m) => (m.id === updated.id ? { ...m, read: updated.read, delivered: updated.delivered, deleted_at: updated.deleted_at, content: updated.content, pinned: updated.pinned } : m))
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

  const getReplyPreview = (msg: Message) => {
    if (msg.type === "audio") return "🎤 Voice note";
    if (msg.type === "image") return "📷 Photo";
    if (msg.type === "document") return "📄 Document";
    return msg.content.length > 60 ? msg.content.slice(0, 60) + "..." : msg.content;
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !user || !selectedPeerId || sending) return;
    setSending(true);
    const payload: Parameters<typeof sendMessage>[0] = {
      sender_id: user.id,
      receiver_id: selectedPeerId,
      content: newMessage.trim(),
    };
    if (replyTo) {
      payload.reply_to = replyTo.id;
      payload.reply_preview = getReplyPreview(replyTo);
      payload.reply_sender_id = replyTo.sender_id;
    }
    const { data } = await sendMessage(payload);
    if (data) {
      setMessages((prev) => [...prev, data]);
      setNewMessage("");
      if (inputRef.current) inputRef.current.textContent = "";
      setReplyTo(null);
      fetchConversations();
    }
    setSending(false);
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

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    if (e.target) e.target.value = "";
  };

  const discardImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setImageFile(null);
  };

  const sendImage = async () => {
    if (!imageFile || !user || !selectedPeerId || sending) return;
    setSending(true);
    const ext = imageFile.name.split(".").pop() || "jpg";
    const fileName = `${user.id}/${Date.now()}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("audio-messages")
      .upload(fileName, imageFile, { contentType: imageFile.type });

    if (uploadErr) {
      toast.error("Failed to upload image: " + uploadErr.message);
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
      type: "image",
    });

    if (msgErr) {
      toast.error("Failed to send image");
    } else if (msgData) {
      setMessages((prev) => [...prev, msgData]);
      fetchConversations();
    }
    discardImage();
    setSending(false);
  };

  const handleDocPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10MB");
      return;
    }
    setDocFile(file);
    if (e.target) e.target.value = "";
  };

  const discardDoc = () => {
    setDocFile(null);
  };

  const sendDoc = async () => {
    if (!docFile || !user || !selectedPeerId || sending) return;
    setSending(true);
    const ext = docFile.name.split(".").pop() || "bin";
    const fileName = `${user.id}/${Date.now()}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("audio-messages")
      .upload(fileName, docFile, { contentType: docFile.type });

    if (uploadErr) {
      toast.error("Failed to upload file: " + uploadErr.message);
      setSending(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("audio-messages")
      .getPublicUrl(fileName);

    // Store as url|||originalName|||sizeBytes so we can display nicely
    const content = `${urlData.publicUrl}|||${docFile.name}|||${docFile.size}`;

    const { data: msgData, error: msgErr } = await sendMessage({
      sender_id: user.id,
      receiver_id: selectedPeerId,
      content,
      type: "document",
    });

    if (msgErr) {
      toast.error("Failed to send document");
    } else if (msgData) {
      setMessages((prev) => [...prev, msgData]);
      fetchConversations();
    }
    discardDoc();
    setSending(false);
  };

  // Helper to parse document content
  const parseDocContent = (content: string) => {
    const parts = content.split("|||");
    return {
      url: parts[0],
      name: parts[1] || "Document",
      size: parts[2] ? Number(parts[2]) : 0,
    };
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Context menu handlers
  const openContextMenu = (msg: Message, x: number, y: number) => {
    if (msg.deleted_at) return;
    setContextMenu({ msg, x, y });
  };

  const handleReply = (msg: Message) => {
    setReplyTo(msg);
    setContextMenu(null);
    inputRef.current?.focus();
  };

  const handleDelete = async (msg: Message) => {
    setContextMenu(null);
    const { error } = await deleteMessage(msg.id);
    if (error) { toast.error("Failed to delete"); return; }
    setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, deleted_at: new Date().toISOString(), content: "" } : m));
    fetchConversations();
  };

  const handlePin = async (msg: Message) => {
    setContextMenu(null);
    const newPinned = !msg.pinned;
    const { error } = await togglePinMessage(msg.id, newPinned);
    if (error) { toast.error("Failed to pin"); return; }
    setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, pinned: newPinned } : m));
    toast.success(newPinned ? "Message pinned" : "Message unpinned");
  };

  const handleCopy = (msg: Message) => {
    setContextMenu(null);
    const text = msg.type === "document" ? parseDocContent(msg.content).name : msg.content;
    navigator.clipboard.writeText(text).then(() => toast.success("Copied")).catch(() => {});
  };

  // Pinned messages
  const pinnedMessages = messages.filter((m) => m.pinned && !m.deleted_at);

  if (isLoading || !user) {
    return (
      <div className="bg-gray-50 dark:bg-background p-6">
        <Skeleton className="h-96 w-full max-w-4xl mx-auto" />
      </div>
    );
  }

  const selectedPeer = selectedPeerId ? peerProfiles[selectedPeerId] : null;

  return (
    <div className="h-[calc(100dvh-3.5rem)] md:h-[calc(100dvh)] bg-gray-50 dark:bg-background flex flex-col overflow-hidden">
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
                              ) : conv.lastMessage.type === "image" ? (
                                <span className="flex items-center gap-1"><ImagePlus className="h-3 w-3" /> Photo</span>
                              ) : conv.lastMessage.type === "document" ? (
                                <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> Document</span>
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

                {/* Pinned messages banner */}
                {pinnedMessages.length > 0 && (
                  <div className="px-3 py-2 border-b bg-amber-50/80 dark:bg-amber-500/5 shrink-0">
                    <div className="flex items-center gap-2 text-xs">
                      <Pin className="h-3 w-3 text-amber-600 shrink-0" />
                      <span className="font-medium text-amber-700 dark:text-amber-400 shrink-0">Pinned</span>
                      <span className="truncate text-muted-foreground">
                        {pinnedMessages[pinnedMessages.length - 1].type === "audio" ? "🎤 Voice note"
                          : pinnedMessages[pinnedMessages.length - 1].type === "image" ? "📷 Photo"
                          : pinnedMessages[pinnedMessages.length - 1].type === "document" ? "📄 Document"
                          : pinnedMessages[pinnedMessages.length - 1].content}
                      </span>
                      {pinnedMessages.length > 1 && (
                        <span className="text-muted-foreground shrink-0">+{pinnedMessages.length - 1}</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 min-h-0 bg-amber-50/30 dark:bg-zinc-950/50" onClick={() => setContextMenu(null)}>
                  {messages.length === 0 && (
                    <div className="text-center py-20">
                      <div className="h-14 w-14 mx-auto mb-3 rounded-full bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center">
                        <MessageSquare className="h-6 w-6 text-amber-500" />
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">No messages yet</p>
                      <p className="text-xs text-muted-foreground/50 mt-1">Say hello to start the conversation</p>
                    </div>
                  )}
                  {messages.map((msg, idx) => {
                    const isMine = msg.sender_id === user.id;
                    const prevMsg = idx > 0 ? messages[idx - 1] : null;
                    const sameSender = prevMsg?.sender_id === msg.sender_id;
                    const isDeleted = !!msg.deleted_at;
                    const isAudio = !isDeleted && msg.type === "audio";
                    const isImage = !isDeleted && msg.type === "image";
                    const isDoc = !isDeleted && msg.type === "document";
                    const showTail = !sameSender;
                    const hasReply = !!msg.reply_to && !!msg.reply_preview;

                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMine ? "justify-end" : "justify-start"} ${showTail ? "mt-2.5" : "mt-[3px]"}`}
                        onContextMenu={(e) => { e.preventDefault(); openContextMenu(msg, e.clientX, e.clientY); }}
                        onTouchStart={(e) => {
                          const t = e.touches[0];
                          longPressTimer.current = setTimeout(() => openContextMenu(msg, t.clientX, t.clientY), 500);
                        }}
                        onTouchEnd={() => { if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; } }}
                        onTouchMove={() => { if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; } }}
                      >
                        <div
                          className={`relative max-w-[85%] sm:max-w-[65%] text-[14.5px] ${
                            isDeleted ? "px-3 py-1.5"
                              : isImage ? "p-1 w-[260px] max-w-full"
                              : isAudio ? "px-2.5 py-2 w-[280px] max-w-full"
                              : isDoc ? "px-3 py-2 w-[260px] max-w-full"
                              : "px-3 py-1.5"
                          } ${
                            isMine
                              ? `${isDeleted ? "bg-amber-200/50 dark:bg-amber-900/20" : "bg-amber-500 dark:bg-amber-600"} text-white shadow-sm ${
                                  showTail ? "rounded-xl rounded-tr-sm" : "rounded-xl"
                                }`
                              : `${isDeleted ? "bg-gray-100 dark:bg-zinc-800/50" : "bg-white dark:bg-zinc-800"} shadow-sm ${
                                  showTail ? "rounded-xl rounded-tl-sm" : "rounded-xl"
                                }`
                          }`}
                        >
                          {/* Pinned indicator */}
                          {msg.pinned && !isDeleted && (
                            <div className={`flex items-center gap-1 mb-1 ${isMine ? "text-white/50" : "text-amber-500/60"}`}>
                              <Pin className="h-2.5 w-2.5" />
                              <span className="text-[10px]">Pinned</span>
                            </div>
                          )}

                          {/* Reply reference */}
                          {hasReply && !isDeleted && (
                            <div className={`mb-1 px-2 py-1 rounded-lg text-[12px] border-l-2 ${
                              isMine
                                ? "bg-white/15 border-white/40 text-white/80"
                                : "bg-gray-100 dark:bg-zinc-700/50 border-amber-400 text-muted-foreground"
                            }`}>
                              <p className="font-medium text-[11px] mb-0.5">
                                {msg.reply_sender_id === user.id ? "You" : selectedPeer?.name?.split(" ")[0] || ""}
                              </p>
                              <p className="truncate">{msg.reply_preview}</p>
                            </div>
                          )}

                          {isDeleted ? (
                            <p className={`italic text-[13px] ${isMine ? "text-white/50" : "text-muted-foreground"}`}>
                              This message was deleted
                            </p>
                          ) : isImage ? (
                            <button type="button" onClick={() => setLightboxSrc(msg.content)} className="block w-full">
                              <img
                                src={msg.content}
                                alt="Shared image"
                                className="rounded-lg w-full max-h-[300px] object-cover cursor-pointer"
                                loading="lazy"
                              />
                            </button>
                          ) : isAudio ? (
                            <VoiceMessage src={msg.content} isMine={isMine} />
                          ) : isDoc ? (() => {
                            const doc = parseDocContent(msg.content);
                            const ext = doc.name.split(".").pop()?.toUpperCase() || "FILE";
                            return (
                              <a href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 group">
                                <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${isMine ? "bg-white/20" : "bg-amber-100 dark:bg-amber-500/20"}`}>
                                  <FileText className={`h-5 w-5 ${isMine ? "text-white" : "text-amber-600 dark:text-amber-400"}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-medium truncate ${isMine ? "text-white" : ""}`}>{doc.name}</p>
                                  <p className={`text-[11px] ${isMine ? "text-white/60" : "text-muted-foreground"}`}>{ext} · {formatFileSize(doc.size)}</p>
                                </div>
                                <Download className={`h-4 w-4 shrink-0 opacity-60 group-hover:opacity-100 ${isMine ? "text-white" : "text-muted-foreground"}`} />
                              </a>
                            );
                          })() : (
                            <p className="break-words whitespace-pre-wrap">{msg.content}</p>
                          )}
                          <div className={`flex items-center justify-end gap-0.5 -mb-0.5 ${
                            isImage ? "mt-0.5 px-1" : isAudio || isDoc ? "mt-0" : "mt-0.5"
                          } ${
                            isMine ? "text-white/60" : "text-gray-400 dark:text-zinc-500"
                          }`}>
                            <span className="text-[10px] leading-none">
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            {!isDeleted && <ReadReceipt msg={msg} isMine={isMine} />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply preview */}
                {replyTo && (
                  <div className="px-3 pt-2 pb-0 border-t shrink-0 bg-background">
                    <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-500/5 rounded-xl px-3 py-2 border-l-2 border-amber-500">
                      <Reply className="h-4 w-4 text-amber-500 shrink-0 scale-x-[-1]" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                          {replyTo.sender_id === user.id ? "You" : selectedPeer?.name?.split(" ")[0] || ""}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{getReplyPreview(replyTo)}</p>
                      </div>
                      <button className="h-6 w-6 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-700 flex items-center justify-center shrink-0" onClick={() => setReplyTo(null)}>
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Attachment preview (image or document) */}
                {(imagePreview || docFile) && (
                  <div className="px-3 pt-2 pb-0 border-t shrink-0 bg-background">
                    {imagePreview ? (
                      <div className="relative inline-block">
                        <img src={imagePreview} alt="Preview" className="h-32 rounded-xl object-cover" />
                        <button
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md"
                          onClick={discardImage}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : docFile ? (
                      <div className="flex items-center gap-3 bg-gray-100 dark:bg-zinc-800 rounded-xl px-3 py-2.5 max-w-xs">
                        <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center shrink-0">
                          <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{docFile.name}</p>
                          <p className="text-[11px] text-muted-foreground">{formatFileSize(docFile.size)}</p>
                        </div>
                        <button
                          className="h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center shrink-0"
                          onClick={discardDoc}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Input */}
                <div className={`px-3 py-2 ${!imagePreview && !docFile ? "border-t" : ""} shrink-0 bg-background`} style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
                  {/* Hidden file inputs */}
                  <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
                  <input ref={docInputRef} type="file" accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.csv" className="hidden" onChange={handleDocPick} />

                  {imagePreview ? (
                    /* Image selected — send */
                    <div className="flex items-center gap-2">
                      <div className="flex-1 relative">
                        <div className="min-h-[2.75rem] rounded-[22px] bg-gray-100 dark:bg-zinc-800 px-4 py-2.5 text-base text-gray-400 dark:text-zinc-500">
                          Send photo...
                        </div>
                      </div>
                      <button type="button" disabled={sending} className="h-10 w-10 rounded-full bg-amber-500 hover:bg-amber-600 text-white shrink-0 flex items-center justify-center active:scale-95 disabled:opacity-50" onClick={sendImage}>
                        {sending ? <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="h-4 w-4" />}
                      </button>
                    </div>
                  ) : docFile ? (
                    /* Document selected — send */
                    <div className="flex items-center gap-2">
                      <div className="flex-1 relative">
                        <div className="min-h-[2.75rem] rounded-[22px] bg-gray-100 dark:bg-zinc-800 px-4 py-2.5 text-base text-gray-400 dark:text-zinc-500">
                          Send document...
                        </div>
                      </div>
                      <button type="button" disabled={sending} className="h-10 w-10 rounded-full bg-amber-500 hover:bg-amber-600 text-white shrink-0 flex items-center justify-center active:scale-95 disabled:opacity-50" onClick={sendDoc}>
                        {sending ? <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="h-4 w-4" />}
                      </button>
                    </div>
                  ) : audioPreview ? (
                    /* Voice note preview */
                    <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 rounded-full px-2 py-1.5">
                      <button className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-red-500 hover:bg-red-100 dark:hover:bg-red-500/10" onClick={discardVoiceNote}>
                        <X className="h-4 w-4" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <audio controls src={audioPreview} className="w-full h-8" style={{ filter: "sepia(20%) saturate(70%) grayscale(1) contrast(99%) invert(12%)" }} />
                      </div>
                      <button disabled={sending} className="h-9 w-9 rounded-full bg-amber-500 hover:bg-amber-600 text-white shrink-0 flex items-center justify-center active:scale-95 disabled:opacity-50" onClick={sendVoiceNote}>
                        {sending ? <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="h-4 w-4" />}
                      </button>
                    </div>
                  ) : recording ? (
                    /* Recording in progress */
                    <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/10 rounded-full px-3 py-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                      <span className="text-sm font-mono font-medium text-red-500 tabular-nums">
                        {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, "0")}
                      </span>
                      <div className="flex-1 flex items-center justify-center gap-[2px] h-7">
                        {waveformBars.map((h, i) => (
                          <span key={i} className="w-[2.5px] bg-red-400 dark:bg-red-500 rounded-full transition-all duration-75" style={{ height: `${h}px` }} />
                        ))}
                      </div>
                      <button className="h-9 w-9 rounded-full bg-red-500 hover:bg-red-600 text-white shrink-0 flex items-center justify-center active:scale-95" onClick={stopRecording}>
                        <Square className="h-3.5 w-3.5" fill="white" />
                      </button>
                    </div>
                  ) : (
                    /* Normal text input */
                    <div className="flex items-center gap-1.5">
                      <button type="button" className="h-9 w-9 rounded-full text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 shrink-0 flex items-center justify-center active:scale-95" onClick={() => imageInputRef.current?.click()}>
                        <ImagePlus className="h-5 w-5" />
                      </button>
                      <button type="button" className="h-9 w-9 rounded-full text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 shrink-0 flex items-center justify-center active:scale-95" onClick={() => docInputRef.current?.click()}>
                        <Paperclip className="h-5 w-5" />
                      </button>
                      <div className="flex-1 relative">
                        {!newMessage && (
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500 pointer-events-none text-base select-none">
                            Message
                          </div>
                        )}
                        <div
                          ref={inputRef}
                          contentEditable
                          role="textbox"
                          aria-label="Message"
                          onInput={() => {
                            const text = inputRef.current?.textContent || "";
                            setNewMessage(text);
                            broadcastTyping();
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey && !isTouchDevice.current) {
                              e.preventDefault();
                              handleSend();
                            }
                          }}
                          onPaste={(e) => {
                            e.preventDefault();
                            const text = e.clipboardData.getData("text/plain");
                            document.execCommand("insertText", false, text);
                          }}
                          className="min-h-[2.75rem] max-h-24 rounded-[22px] bg-gray-100 dark:bg-zinc-800 px-4 py-2.5 text-base outline-none overflow-y-auto break-words whitespace-pre-wrap focus:ring-2 focus:ring-amber-500/30"
                          style={{ WebkitUserSelect: "text", userSelect: "text" }}
                        />
                      </div>
                      {newMessage.trim() ? (
                        <button type="button" disabled={sending} className="h-10 w-10 rounded-full bg-amber-500 hover:bg-amber-600 text-white shrink-0 flex items-center justify-center active:scale-95 disabled:opacity-50" onClick={handleSend}>
                          <Send className="h-4 w-4" />
                        </button>
                      ) : (
                        <button type="button" className="h-10 w-10 rounded-full bg-amber-500 hover:bg-amber-600 text-white shrink-0 flex items-center justify-center active:scale-95" onClick={startRecording}>
                          <Mic className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed inset-0 z-[90]"
          onClick={() => setContextMenu(null)}
          onContextMenu={(e) => { e.preventDefault(); setContextMenu(null); }}
        >
          <div
            className="absolute bg-white dark:bg-zinc-800 rounded-xl shadow-xl border dark:border-zinc-700 py-1.5 min-w-[160px] z-[91]"
            style={{
              left: Math.min(contextMenu.x, window.innerWidth - 180),
              top: Math.min(contextMenu.y, window.innerHeight - 220),
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-zinc-700 text-left" onClick={() => handleReply(contextMenu.msg)}>
              <Reply className="h-4 w-4 text-muted-foreground" /> Reply
            </button>
            {contextMenu.msg.type === "text" && (
              <button className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-zinc-700 text-left" onClick={() => handleCopy(contextMenu.msg)}>
                <Copy className="h-4 w-4 text-muted-foreground" /> Copy
              </button>
            )}
            <button className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-zinc-700 text-left" onClick={() => handlePin(contextMenu.msg)}>
              {contextMenu.msg.pinned ? <PinOff className="h-4 w-4 text-muted-foreground" /> : <Pin className="h-4 w-4 text-muted-foreground" />}
              {contextMenu.msg.pinned ? "Unpin" : "Pin"}
            </button>
            {contextMenu.msg.sender_id === user?.id && (
              <button className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 text-left" onClick={() => handleDelete(contextMenu.msg)}>
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            )}
          </div>
        </div>
      )}

      {/* Lightbox — in-app image viewer */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxSrc(null)}
        >
          <button
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center z-10"
            onClick={() => setLightboxSrc(null)}
            style={{ top: 'max(1rem, env(safe-area-inset-top))' }}
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={lightboxSrc}
            alt="Full size"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <a
            href={lightboxSrc}
            download
            className="absolute bottom-6 right-6 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
            style={{ bottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
          >
            <Download className="h-5 w-5" />
          </a>
        </div>
      )}
    </div>
  );
}
