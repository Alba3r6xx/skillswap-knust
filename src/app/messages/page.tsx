"use client";

import { Suspense, useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getConversations, getMessagesBetween, sendMessage, markMessagesAsRead, getProfileById, deleteMessage, togglePinMessage, editMessage, forwardMessage, addReaction, removeReaction, getReactionsForMessages, searchMessages, updateLastSeen, getTimeSinceLastSeen, createGroup, getGroupsForUser, getGroupMessages, sendGroupMessage, getGroupMembers, leaveGroup, deleteGroupMessage, editGroupMessage } from "@/lib/data";
import { Message, Profile, Reaction, Group, GroupMember, GroupMessage } from "@/lib/types";
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
  Search,
  Forward,
  Pencil,
  Users,
  UserPlus,
  LogOut,
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
    return <CheckCheck className="h-3.5 w-3.5 text-sky-500 inline-block ml-1 shrink-0" />;
  }
  if (msg.delivered) {
    return <CheckCheck className="h-3.5 w-3.5 text-navy-300 dark:text-navy-500 inline-block ml-1 shrink-0" />;
  }
  return <Check className="h-3 w-3 text-gold-300 inline-block ml-1 shrink-0" />;
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
            : "bg-primary hover:brightness-105 shadow-sm"
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
    <Suspense fallback={<div className="h-[100dvh] flex items-center justify-center"><div className="animate-pulse text-primary">Loading...</div></div>}>
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
  const inputRef = useRef<HTMLTextAreaElement>(null);
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
  const contextMenuJustOpened = useRef(false);
  const isTouchDevice = useRef(false);
  const [reactions, setReactions] = useState<Record<string, Reaction[]>>({});
  const [editingMsg, setEditingMsg] = useState<Message | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [forwardMsg, setForwardMsg] = useState<Message | null>(null);
  const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

  // ── Groups state ────────────────────────────────────────────
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [groupMsgs, setGroupMsgs] = useState<GroupMessage[]>([]);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [groupMemberProfiles, setGroupMemberProfiles] = useState<Record<string, Profile>>({});
  const [groupLastMsgs, setGroupLastMsgs] = useState<Record<string, GroupMessage>>({});
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [newGroupMemberIds, setNewGroupMemberIds] = useState<string[]>([]);
  const [creatingGroup, setCreatingGroup] = useState(false);

  // ── Swipe-to-reply + swipe-back state ───────────────────────
  const [swipingMsgId, setSwipingMsgId] = useState<string | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const swipeTouchStartX = useRef(0);
  const swipeTouchStartY = useRef(0);
  const chatBackSwipeRef = useRef(0);

  useEffect(() => {
    isTouchDevice.current = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }, []);

  // Signal to bottom-nav (via body attribute) that a fullscreen chat is open
  useEffect(() => {
    const open = !!(selectedPeerId || selectedGroupId);
    document.body.setAttribute("data-chat-open", open ? "true" : "");
    return () => { document.body.removeAttribute("data-chat-open"); };
  }, [selectedPeerId, selectedGroupId]);

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
            prev.map((m) => (m.id === updated.id ? { ...m, read: updated.read, delivered: updated.delivered, deleted_at: updated.deleted_at, content: updated.content, pinned: updated.pinned, edited_at: updated.edited_at } : m))
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

  // Fetch reactions when messages change
  useEffect(() => {
    if (messages.length === 0) { setReactions({}); return; }
    const ids = messages.map(m => m.id);
    getReactionsForMessages(ids).then(rxns => {
      const map: Record<string, Reaction[]> = {};
      rxns.forEach(r => {
        if (!map[r.message_id]) map[r.message_id] = [];
        map[r.message_id].push(r);
      });
      setReactions(map);
    });
  }, [messages]);

  // Update last_seen periodically
  useEffect(() => {
    if (!user) return;
    updateLastSeen(user.id);
    const interval = setInterval(() => updateLastSeen(user.id), 60000);
    return () => clearInterval(interval);
  }, [user]);

  // ── Group effects ────────────────────────────────────────────
  const fetchGroups = useCallback(async () => {
    if (!user) return;
    const gs = await getGroupsForUser(user.id);
    setGroups(gs);
    const lastMsgsMap: Record<string, GroupMessage> = {};
    await Promise.all(
      gs.map(async (g) => {
        const msgs = await getGroupMessages(g.id);
        if (msgs.length > 0) lastMsgsMap[g.id] = msgs[msgs.length - 1];
      })
    );
    setGroupLastMsgs(lastMsgsMap);
  }, [user]);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  useEffect(() => {
    if (!user || !selectedGroupId) return;
    const loadGroup = async () => {
      const [msgs, members] = await Promise.all([
        getGroupMessages(selectedGroupId),
        getGroupMembers(selectedGroupId),
      ]);
      setGroupMsgs(msgs);
      setGroupMembers(members);
      const profileMap: Record<string, Profile> = {};
      members.forEach((m) => { if (m.profile) profileMap[m.user_id] = m.profile as unknown as Profile; });
      setGroupMemberProfiles(profileMap);
    };
    loadGroup();

    const channel = supabase
      .channel(`group-${selectedGroupId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "group_messages", filter: `group_id=eq.${selectedGroupId}` },
        (payload) => {
          const newMsg = payload.new as GroupMessage;
          setGroupMsgs((prev) => [...prev, newMsg]);
          fetchGroups();
        }
      )
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "group_messages" },
        (payload) => {
          const updated = payload.new as GroupMessage;
          setGroupMsgs((prev) => prev.map((m) => m.id === updated.id ? { ...m, ...updated } : m));
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedGroupId, user, fetchGroups]);

  const handleSendGroupMessage = async () => {
    if (!newMessage.trim() || !user || !selectedGroupId || sending) return;
    setSending(true);
    const payload: Parameters<typeof sendGroupMessage>[0] = {
      group_id: selectedGroupId,
      sender_id: user.id,
      content: newMessage.trim(),
      type: "text",
    };
    if (replyTo) {
      payload.reply_to = replyTo.id;
      payload.reply_preview = getReplyPreviewText(replyTo.type, replyTo.content);
      payload.reply_sender_id = replyTo.sender_id;
    }
    const { data } = await sendGroupMessage(payload);
    if (data) { setGroupMsgs((prev) => [...prev, data]); fetchGroups(); }
    setNewMessage("");
    if (inputRef.current) { inputRef.current.value = ""; inputRef.current.style.height = "auto"; }
    setReplyTo(null);
    setSending(false);
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || !user || newGroupMemberIds.length === 0) {
      toast.error("Add a group name and at least one member");
      return;
    }
    setCreatingGroup(true);
    const group = await createGroup(newGroupName.trim(), newGroupDesc.trim(), newGroupMemberIds, user.id);
    setCreatingGroup(false);
    if (group) {
      toast.success("Study group created!");
      setShowCreateGroup(false);
      setNewGroupName(""); setNewGroupDesc(""); setNewGroupMemberIds([]);
      await fetchGroups();
      setSelectedGroupId(group.id);
      setSelectedPeerId(null);
    } else {
      toast.error("Failed to create group");
    }
  };

  // Helper for reply previews (used by both DM and group)
  const getReplyPreviewText = (type: string, content: string) => {
    if (type === "audio") return "🎤 Voice note";
    if (type === "image") return "📷 Photo";
    if (type === "document") return "📄 Document";
    return content.length > 60 ? content.slice(0, 60) + "..." : content;
  };

  const getReplyPreview = (msg: Message) => {
    if (msg.type === "audio") return "🎤 Voice note";
    if (msg.type === "image") return "📷 Photo";
    if (msg.type === "document") return "📄 Document";
    return msg.content.length > 60 ? msg.content.slice(0, 60) + "..." : msg.content;
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !user || !selectedPeerId || sending) return;
    // Edit mode
    if (editingMsg) {
      setSending(true);
      const { error } = await editMessage(editingMsg.id, newMessage.trim());
      if (error) { toast.error("Failed to edit"); }
      else { setMessages(prev => prev.map(m => m.id === editingMsg.id ? { ...m, content: newMessage.trim(), edited_at: new Date().toISOString() } : m)); }
      setEditingMsg(null);
      setNewMessage("");
      if (inputRef.current) { inputRef.current.value = ""; inputRef.current.style.height = "auto"; }
      setSending(false);
      return;
    }
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
      if (inputRef.current) { inputRef.current.value = ""; inputRef.current.style.height = "auto"; }
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
    window.getSelection()?.removeAllRanges();
    contextMenuJustOpened.current = true;
    setContextMenu({ msg, x, y });
    setTimeout(() => { contextMenuJustOpened.current = false; }, 400);
  };

  const handleReply = (msg: Message) => {
    setReplyTo(msg);
    setContextMenu(null);
    inputRef.current?.focus();
  };

  const handleDelete = async (msg: Message) => {
    setContextMenu(null);
    // Optimistic local update first
    setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, deleted_at: new Date().toISOString(), content: "" } : m));
    const { error } = await deleteMessage(msg.id);
    if (error) {
      toast.error("Failed to delete");
      // Revert on failure
      setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, deleted_at: null, content: msg.content } : m));
      return;
    }
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

  // Emoji reactions handler
  const handleReaction = async (msgId: string, emoji: string) => {
    if (!user) return;
    setContextMenu(null);
    const existing = reactions[msgId]?.find(r => r.user_id === user.id && r.emoji === emoji);
    if (existing) {
      setReactions(prev => ({ ...prev, [msgId]: (prev[msgId] || []).filter(r => r.id !== existing.id) }));
      await removeReaction(msgId, user.id, emoji);
    } else {
      const temp: Reaction = { id: "temp-" + Date.now(), message_id: msgId, user_id: user.id, emoji, created_at: new Date().toISOString() };
      setReactions(prev => ({ ...prev, [msgId]: [...(prev[msgId] || []), temp] }));
      const { data } = await addReaction(msgId, user.id, emoji);
      if (data) {
        setReactions(prev => ({ ...prev, [msgId]: (prev[msgId] || []).map(r => r.id === temp.id ? data : r) }));
      }
    }
  };

  // Edit message
  const handleEdit = (msg: Message) => {
    setContextMenu(null);
    setEditingMsg(msg);
    setNewMessage(msg.content);
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.value = msg.content;
        inputRef.current.style.height = "auto";
        inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 96) + "px";
        inputRef.current.focus();
      }
    }, 50);
  };

  // Forward message
  const handleForwardSelect = (msg: Message) => {
    setContextMenu(null);
    setForwardMsg(msg);
  };

  const handleForwardTo = async (peerId: string) => {
    if (!forwardMsg || !user) return;
    await forwardMessage(forwardMsg, user.id, peerId);
    toast.success("Message forwarded");
    setForwardMsg(null);
    fetchConversations();
  };

  // Search messages
  const handleSearchMessages = async (query: string) => {
    setSearchQuery(query);
    if (!user || !selectedPeerId || query.length < 2) { setSearchResults([]); return; }
    const results = await searchMessages(user.id, selectedPeerId, query);
    setSearchResults(results);
  };

  // Format message text with WhatsApp-style formatting
  const formatMessageText = (text: string): React.ReactNode => {
    const regex = /(\*[^*]+\*)|(_[^_]+_)|(~[^~]+~)|(`[^`]+`)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let key = 0;
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
      const m = match[0];
      if (m.startsWith("*") && m.endsWith("*")) parts.push(<strong key={key++}>{m.slice(1, -1)}</strong>);
      else if (m.startsWith("_") && m.endsWith("_")) parts.push(<em key={key++}>{m.slice(1, -1)}</em>);
      else if (m.startsWith("~") && m.endsWith("~")) parts.push(<s key={key++}>{m.slice(1, -1)}</s>);
      else if (m.startsWith("`") && m.endsWith("`")) parts.push(<code key={key++} className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 text-[13px] font-mono">{m.slice(1, -1)}</code>);
      lastIndex = match.index + m.length;
    }
    if (lastIndex < text.length) parts.push(text.slice(lastIndex));
    return parts.length > 0 ? <>{parts}</> : text;
  };

  // Date separator helper
  const getDateLabel = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
  };

  // Pinned messages
  const pinnedMessages = messages.filter((m) => m.pinned && !m.deleted_at);

  if (isLoading || !user) {
    return (
      <div className="bg-background p-6">
        <Skeleton className="h-96 w-full max-w-4xl mx-auto" />
      </div>
    );
  }

  const selectedPeer = selectedPeerId ? peerProfiles[selectedPeerId] : null;

  return (
    <div className="bg-background flex flex-col overflow-hidden h-dvh md:mt-0 md:pt-0" style={{ marginTop: 'calc(-3rem - var(--sat, 0px))', paddingTop: 'calc(3rem + var(--sat, 0px))' }}>
      {/* Header - only show on conversation list view or desktop */}
      <div className={`${(selectedPeerId || selectedGroupId) ? "hidden md:block" : "block"} bg-navy-900 px-4 pt-4 pb-4 md:pt-6 md:pb-5`}>
        <div className="max-w-4xl mx-auto w-full">
          <h1 className="text-3xl font-bold tracking-tight text-white">Messages</h1>
          <p className="text-sm text-navy-300 mt-1">Stay in touch with your skill partners</p>
        </div>
      </div>

      <div className={`flex-1 flex flex-col md:flex-row md:max-w-4xl md:mx-auto w-full min-h-0 ${(selectedPeerId || selectedGroupId) ? "md:px-4 md:pb-4" : "px-4 pb-4"}`}>
        <div className="flex-1 flex md:rounded-xl md:border md:overflow-hidden min-h-0">
          {/* Conversation List */}
          <div className={`${(selectedPeerId || selectedGroupId) ? "hidden md:flex" : "flex"} flex-col w-full md:w-80 md:border-r min-h-0`}>
            <div className="p-3 border-b bg-background flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Conversations</p>
              <button
                className="h-7 w-7 rounded-full bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center transition-colors"
                title="New study group"
                onClick={() => setShowCreateGroup(true)}
              >
                <UserPlus className="h-3.5 w-3.5" />
              </button>
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
                    <Button size="sm" className="mt-2">
                      Find Peers
                    </Button>
                  </Link>
                </div>
              ) : (
                <>
                  {initialPeer && !conversations.some((c) => c.peerId === initialPeer) && peerProfiles[initialPeer] && (
                    <button
                      className={`flex items-center gap-3 w-full p-3 border-b hover:bg-navy-50 dark:hover:bg-muted transition-colors text-left ${
                        selectedPeerId === initialPeer ? "bg-gold-50 dark:bg-gold-500/10" : ""
                      }`}
                      onClick={() => setSelectedPeerId(initialPeer)}
                    >
                      <Avatar className="h-10 w-10 shrink-0">
                        {peerProfiles[initialPeer].avatar_url ? (
                          <img src={peerProfiles[initialPeer].avatar_url} alt="" className="h-full w-full object-cover rounded-full" />
                        ) : (
                          <AvatarFallback className="bg-gold-100 text-navy-800 text-sm font-semibold">
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
                        className={`flex items-center gap-3 w-full p-3 border-b hover:bg-navy-50 dark:hover:bg-muted transition-colors text-left ${
                          isActive ? "bg-gold-50 dark:bg-gold-500/10" : ""
                        }`}
                        onClick={() => { setSelectedPeerId(conv.peerId); setSelectedGroupId(null); }}
                      >
                        <Avatar className="h-10 w-10 shrink-0">
                          {peer.avatar_url ? (
                            <img src={peer.avatar_url} alt={peer.name} className="h-full w-full object-cover rounded-full" />
                          ) : (
                            <AvatarFallback className="bg-gold-100 text-navy-800 text-sm font-semibold">
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
                                  ? <CheckCheck className="h-3 w-3 text-sky-500 mr-1 shrink-0" />
                                  : conv.lastMessage.delivered
                                    ? <CheckCheck className="h-3 w-3 text-navy-400 mr-1 shrink-0" />
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
                              <Badge className="bg-primary text-white text-[10px] h-5 w-5 flex items-center justify-center rounded-full p-0 shrink-0">
                                {conv.unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}

                  {/* ── Study Groups ── */}
                  {groups.length > 0 && (
                    <div className="px-3 pt-3 pb-1">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                        <Users className="h-3 w-3" /> Study Groups
                      </p>
                    </div>
                  )}
                  {groups.map((group) => {
                    const lastMsg = groupLastMsgs[group.id];
                    const isActive = selectedGroupId === group.id;
                    const groupInitials = group.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
                    return (
                      <button
                        key={group.id}
                        className={`flex items-center gap-3 w-full p-3 border-b hover:bg-navy-50 dark:hover:bg-muted transition-colors text-left ${
                          isActive ? "bg-gold-50 dark:bg-gold-500/10" : ""
                        }`}
                        onClick={() => { setSelectedGroupId(group.id); setSelectedPeerId(null); }}
                      >
                        <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-sky-500 to-navy-700 flex items-center justify-center text-white text-sm font-bold">
                          {groupInitials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium truncate flex items-center gap-1">
                              {group.name}
                            </p>
                            {lastMsg && (
                              <span className="text-[10px] text-muted-foreground shrink-0">
                                {new Date(lastMsg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {lastMsg ? (
                              lastMsg.deleted_at ? "Message deleted" :
                              lastMsg.type === "audio" ? "🎤 Voice note" :
                              lastMsg.type === "image" ? "📷 Photo" :
                              lastMsg.type === "document" ? "📄 Document" :
                              lastMsg.content
                            ) : (
                              <span className="italic">No messages yet</span>
                            )}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div
            className={`${(selectedPeerId || selectedGroupId) ? "flex" : "hidden md:flex"} flex-col flex-1 bg-background min-h-0 overflow-hidden`}
            onTouchStart={(e) => { chatBackSwipeRef.current = e.touches[0].clientX; }}
            onTouchEnd={(e) => {
              const dx = e.changedTouches[0].clientX - chatBackSwipeRef.current;
              if (dx > 70 && chatBackSwipeRef.current < 40) {
                setSelectedPeerId(null);
                setSelectedGroupId(null);
                if (navigator.vibrate) navigator.vibrate(20);
              }
            }}
          >
            {!selectedPeerId && !selectedGroupId ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Select a conversation to start chatting</p>
                </div>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="flex items-center gap-2 px-3 py-2 border-b shrink-0 md:pt-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden shrink-0 h-8 w-8"
                    onClick={() => { setSelectedPeerId(null); setSelectedGroupId(null); }}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>

                  {/* DM header */}
                  {selectedPeer && selectedPeerId && (
                    <Link href={`/profile/${selectedPeerId}`} className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="relative shrink-0">
                        <Avatar className="h-9 w-9">
                          {selectedPeer.avatar_url ? (
                            <img src={selectedPeer.avatar_url} alt={selectedPeer.name} className="h-full w-full object-cover rounded-full" />
                          ) : (
                            <AvatarFallback className="bg-gold-100 text-navy-800 text-sm">
                              {selectedPeer.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        {getTimeSinceLastSeen(selectedPeer.last_seen) === "Online now" && (
                          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{selectedPeer.name}</p>
                        {peerTyping ? (
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 animate-pulse">typing...</p>
                        ) : (
                          <p className="text-xs text-muted-foreground truncate">{getTimeSinceLastSeen(selectedPeer.last_seen)}</p>
                        )}
                      </div>
                    </Link>
                  )}

                  {/* Group header */}
                  {selectedGroupId && (() => {
                    const grp = groups.find(g => g.id === selectedGroupId);
                    if (!grp) return null;
                    const gInitials = grp.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
                    return (
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-sky-500 to-navy-700 flex items-center justify-center text-white text-sm font-bold">
                          {gInitials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{grp.name}</p>
                          <p className="text-xs text-muted-foreground">{groupMembers.length} members</p>
                        </div>
                        <button
                          className="ml-auto h-7 w-7 rounded-full hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center justify-center text-red-500 shrink-0"
                          title="Leave group"
                          onClick={async () => {
                            if (!user) return;
                            await leaveGroup(grp.id, user.id);
                            toast.success("Left group");
                            setSelectedGroupId(null);
                            fetchGroups();
                          }}
                        >
                          <LogOut className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })()}

                  {selectedPeerId && (
                    <button
                      className="h-8 w-8 rounded-full hover:bg-navy-50 dark:hover:bg-navy-900/40 flex items-center justify-center shrink-0"
                      onClick={() => { setSearchOpen(!searchOpen); setSearchQuery(""); setSearchResults([]); }}
                    >
                      <Search className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                </div>

                {/* Search bar */}
                {searchOpen && (
                  <div className="px-3 py-2 border-b shrink-0 bg-background">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search messages..."
                        value={searchQuery}
                        onChange={(e) => handleSearchMessages(e.target.value)}
                        className="w-full h-8 pl-9 pr-8 rounded-lg bg-navy-50 dark:bg-zinc-800 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                        autoFocus
                      />
                      <button className="absolute right-2 top-1/2 -translate-y-1/2" onClick={() => { setSearchOpen(false); setSearchQuery(""); setSearchResults([]); }}>
                        <X className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </div>
                    {searchResults.length > 0 && (
                      <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                        {searchResults.map((r) => (
                          <button
                            key={r.id}
                            className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-navy-50 dark:hover:bg-zinc-800 text-xs"
                            onClick={() => {
                              const el = document.getElementById(`msg-${r.id}`);
                              el?.scrollIntoView({ behavior: "smooth", block: "center" });
                              setSearchOpen(false);
                            }}
                          >
                            <span className="text-muted-foreground">{new Date(r.created_at).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
                            {" — "}
                            <span className="truncate">{r.content.length > 60 ? r.content.slice(0, 60) + "..." : r.content}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Pinned messages banner */}
                {pinnedMessages.length > 0 && (
                  <button
                    type="button"
                    className="flex items-center gap-2 w-full px-3 py-1.5 border-b bg-gold-50/80 dark:bg-gold-500/5 shrink-0 text-left hover:bg-gold-100/60 dark:hover:bg-gold-500/10 transition-colors"
                    onClick={() => {
                      const el = document.getElementById(`msg-${pinnedMessages[pinnedMessages.length - 1].id}`);
                      el?.scrollIntoView({ behavior: "smooth", block: "center" });
                    }}
                  >
                    <Pin className="h-3 w-3 text-gold-600 shrink-0" />
                    <span className="text-xs font-medium text-gold-700 dark:text-gold-400 shrink-0">Pinned</span>
                    <span className="text-xs truncate text-muted-foreground flex-1 min-w-0">
                      {pinnedMessages[pinnedMessages.length - 1].type === "audio" ? "🎤 Voice note"
                        : pinnedMessages[pinnedMessages.length - 1].type === "image" ? "📷 Photo"
                        : pinnedMessages[pinnedMessages.length - 1].type === "document" ? "📄 Document"
                        : pinnedMessages[pinnedMessages.length - 1].content.length > 40
                          ? pinnedMessages[pinnedMessages.length - 1].content.slice(0, 40) + "..."
                          : pinnedMessages[pinnedMessages.length - 1].content}
                    </span>
                    {pinnedMessages.length > 1 && (
                      <span className="text-[10px] text-muted-foreground shrink-0">+{pinnedMessages.length - 1}</span>
                    )}
                  </button>
                )}

                {/* ── Group Messages ── */}
                {selectedGroupId && (
                  <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 min-h-0 bg-navy-50/30 dark:bg-zinc-950/50" onClick={() => setContextMenu(null)}>
                    {groupMsgs.length === 0 && (
                      <div className="text-center py-20">
                        <div className="h-14 w-14 mx-auto mb-3 rounded-full bg-sky-100 dark:bg-sky-500/10 flex items-center justify-center">
                          <Users className="h-6 w-6 text-sky-500" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">No messages yet</p>
                        <p className="text-xs text-muted-foreground/50 mt-1">Start the group conversation</p>
                      </div>
                    )}
                    {groupMsgs.map((msg, idx) => {
                      const isMine = msg.sender_id === user.id;
                      const prevMsg = idx > 0 ? groupMsgs[idx - 1] : null;
                      const sameSender = prevMsg?.sender_id === msg.sender_id;
                      const isDeleted = !!msg.deleted_at;
                      const showTail = !sameSender;
                      const senderProfile = groupMemberProfiles[msg.sender_id];
                      const senderName = isMine ? "You" : (senderProfile?.name?.split(" ")[0] || "Member");
                      const showSenderName = !isMine && !sameSender;
                      const msgDate = new Date(msg.created_at);
                      const prevMsgDate = prevMsg ? new Date(prevMsg.created_at) : null;
                      const showDateSep = !prevMsgDate || msgDate.toDateString() !== prevMsgDate.toDateString();

                      return (
                        <div key={msg.id}>
                          {showDateSep && (
                            <div className="flex items-center justify-center my-3">
                              <span className="text-[11px] text-muted-foreground bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm px-3 py-0.5 rounded-full shadow-sm">
                                {getDateLabel(msgDate)}
                              </span>
                            </div>
                          )}
                          <div
                            id={`gmsg-${msg.id}`}
                            className={`flex ${isMine ? "justify-end" : "justify-start"} ${showTail ? "mt-2.5" : "mt-[3px]"}`}
                            onTouchStart={(e) => {
                              swipeTouchStartX.current = e.touches[0].clientX;
                              swipeTouchStartY.current = e.touches[0].clientY;
                            }}
                            onTouchMove={(e) => {
                              if (isDeleted) return;
                              const dx = e.touches[0].clientX - swipeTouchStartX.current;
                              const dy = Math.abs(e.touches[0].clientY - swipeTouchStartY.current);
                              if (dy > 15) { setSwipingMsgId(null); setSwipeOffset(0); return; }
                              if (dx > 5) { setSwipingMsgId(`g-${msg.id}`); setSwipeOffset(Math.min(dx, 70)); }
                            }}
                            onTouchEnd={() => {
                              if (swipeOffset > 45 && swipingMsgId === `g-${msg.id}`) {
                                setReplyTo({ ...msg, receiver_id: "", read: false, delivered: false } as unknown as Message);
                                if (navigator.vibrate) navigator.vibrate(50);
                              }
                              setSwipingMsgId(null); setSwipeOffset(0);
                            }}
                          >
                            {!isMine && showTail && (
                              <div className="mr-1.5 shrink-0 self-end mb-1">
                                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-sky-400 to-navy-600 flex items-center justify-center text-white text-[11px] font-bold">
                                  {senderProfile?.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0,2) || "?"}
                                </div>
                              </div>
                            )}
                            {!isMine && !showTail && <div className="mr-1.5 w-7 shrink-0" />}
                            <div
                              className="max-w-[80%] sm:max-w-[65%] relative"
                              style={{
                                transform: swipingMsgId === `g-${msg.id}` ? `translateX(${swipeOffset}px)` : undefined,
                                transition: swipingMsgId === `g-${msg.id}` ? "none" : "transform 0.2s ease-out",
                              }}
                            >
                              {showSenderName && (
                                <p className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 mb-0.5 ml-1">{senderName}</p>
                              )}
                              <div className={`px-3 py-1.5 text-[14.5px] shadow-sm ${
                                isMine
                                  ? `bg-gradient-to-br from-gold-500 to-gold-600 text-white ${showTail ? "rounded-2xl rounded-tr-sm" : "rounded-2xl"}`
                                  : `bg-card dark:bg-zinc-800 ${showTail ? "rounded-2xl rounded-tl-sm" : "rounded-2xl"}`
                              }`}>
                                {isDeleted ? (
                                  <p className={`italic text-[13px] ${isMine ? "text-white/50" : "text-muted-foreground"}`}>This message was deleted</p>
                                ) : (
                                  <>
                                    {msg.reply_preview && (
                                      <div className={`mb-0.5 px-1.5 py-0.5 rounded border-l-2 ${isMine ? "bg-white/10 border-white/30 text-white/70" : "bg-navy-50 dark:bg-zinc-700/40 border-gold-400 text-muted-foreground"}`}>
                                        <p className="text-[11px] truncate">{msg.reply_preview}</p>
                                      </div>
                                    )}
                                    <p>{msg.content}</p>
                                    <p className={`text-[10px] mt-0.5 text-right ${isMine ? "text-white/60" : "text-muted-foreground"}`}>
                                      {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                      {msg.edited_at && " · edited"}
                                    </p>
                                  </>
                                )}
                              </div>
                              {swipingMsgId === `g-${msg.id}` && swipeOffset > 10 && (
                                <div className={`absolute top-1/2 -translate-y-1/2 ${isMine ? "-left-8" : "-right-8"} text-primary opacity-80`} style={{ opacity: Math.min(1, swipeOffset / 50) }}>
                                  <Reply className="h-4 w-4" />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}

                {/* ── DM Messages ── */}
                {selectedPeerId && (
                <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 min-h-0 bg-navy-50/30 dark:bg-zinc-950/50" onClick={() => setContextMenu(null)}>
                  {messages.length === 0 && (
                    <div className="text-center py-20">
                      <div className="h-14 w-14 mx-auto mb-3 rounded-full bg-gold-100 dark:bg-gold-500/10 flex items-center justify-center">
                        <MessageSquare className="h-6 w-6 text-primary" />
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
                    const msgReactions = reactions[msg.id] || [];
                    const isForwarded = !!msg.forwarded_from;
                    const isEdited = !!msg.edited_at;

                    // Date separator
                    const msgDate = new Date(msg.created_at);
                    const prevMsgDate = prevMsg ? new Date(prevMsg.created_at) : null;
                    const showDateSep = !prevMsgDate || msgDate.toDateString() !== prevMsgDate.toDateString();

                    return (
                      <div key={msg.id}>
                        {showDateSep && (
                          <div className="flex items-center justify-center my-3">
                            <span className="text-[11px] text-muted-foreground bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm px-3 py-0.5 rounded-full shadow-sm">
                              {getDateLabel(msgDate)}
                            </span>
                          </div>
                        )}
                        <div
                          id={`msg-${msg.id}`}
                          className={`msg-bubble flex ${isMine ? "justify-end" : "justify-start"} ${showTail ? "mt-2.5" : "mt-[3px]"}`}
                          onContextMenu={(e) => { e.preventDefault(); openContextMenu(msg, e.clientX, e.clientY); }}
                          onTouchStart={(e) => {
                            const t = e.touches[0];
                            swipeTouchStartX.current = t.clientX;
                            swipeTouchStartY.current = t.clientY;
                            longPressTimer.current = setTimeout(() => {
                              openContextMenu(msg, t.clientX, t.clientY);
                              if (navigator.vibrate) navigator.vibrate(30);
                            }, 400);
                          }}
                          onTouchMove={(e) => {
                            const mx = Math.abs(e.touches[0].clientX - swipeTouchStartX.current);
                            const my = Math.abs(e.touches[0].clientY - swipeTouchStartY.current);
                            if ((mx > 10 || my > 10) && longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
                            if (isDeleted) return;
                            const dx = e.touches[0].clientX - swipeTouchStartX.current;
                            const dy = Math.abs(e.touches[0].clientY - swipeTouchStartY.current);
                            if (dy > 15) { setSwipingMsgId(null); setSwipeOffset(0); return; }
                            if (dx > 5) { setSwipingMsgId(msg.id); setSwipeOffset(Math.min(dx, 70)); }
                          }}
                          onTouchEnd={() => {
                            if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
                            if (swipeOffset > 45 && swipingMsgId === msg.id) {
                              handleReply(msg);
                              if (navigator.vibrate) navigator.vibrate(50);
                            }
                            setSwipingMsgId(null); setSwipeOffset(0);
                          }}
                        >
                          <div
                            className="max-w-[85%] sm:max-w-[65%] relative"
                            style={{
                              transform: swipingMsgId === msg.id ? `translateX(${swipeOffset}px)` : undefined,
                              transition: swipingMsgId === msg.id ? "none" : "transform 0.2s ease-out",
                            }}
                          >
                            {swipingMsgId === msg.id && swipeOffset > 10 && (
                              <div
                                className={`absolute top-1/2 -translate-y-1/2 ${isMine ? "-left-8" : "-right-8"} text-primary`}
                                style={{ opacity: Math.min(1, swipeOffset / 50) }}
                              >
                                <Reply className="h-4 w-4" />
                              </div>
                            )}
                            <div
                              className={`relative text-[14.5px] ${
                                isDeleted ? "px-3 py-1.5"
                                  : isImage ? "p-1 w-[260px] max-w-full"
                                  : isAudio ? "px-2.5 py-2 w-[280px] max-w-full"
                                  : isDoc ? "px-3 py-2 w-[260px] max-w-full"
                                  : "px-3 py-1.5"
                              } ${
                                isMine
                                  ? `${isDeleted ? "bg-gold-200/50 dark:bg-gold-900/20" : "bg-gradient-to-br from-gold-500 to-gold-600 dark:from-gold-600 dark:to-gold-700"} text-white shadow-sm ${
                                      showTail ? "rounded-2xl rounded-tr-sm" : "rounded-2xl"
                                    }`
                                  : `${isDeleted ? "bg-navy-50 dark:bg-zinc-800/50" : "bg-card dark:bg-zinc-800"} shadow-sm ${
                                      showTail ? "rounded-2xl rounded-tl-sm" : "rounded-2xl"
                                    }`
                              }`}
                            >
                              {/* Forwarded indicator */}
                              {isForwarded && !isDeleted && (
                                <p className={`text-[10px] italic mb-0.5 flex items-center gap-1 ${isMine ? "text-white/50" : "text-muted-foreground"}`}>
                                  <Forward className="h-2.5 w-2.5" /> Forwarded
                                </p>
                              )}

                              {/* Reply reference */}
                              {hasReply && !isDeleted && (
                                <button
                                  className={`w-full text-left mb-0.5 px-1.5 py-0.5 rounded border-l-2 ${
                                    isMine
                                      ? "bg-white/10 border-white/30 text-white/70"
                                      : "bg-navy-50 dark:bg-zinc-700/40 border-gold-400 text-muted-foreground"
                                  }`}
                                  onClick={() => {
                                    const el = document.getElementById(`msg-${msg.reply_to}`);
                                    el?.scrollIntoView({ behavior: "smooth", block: "center" });
                                  }}
                                >
                                  <p className={`font-semibold text-[10px] leading-tight ${isMine ? "text-white/90" : "text-gold-600 dark:text-gold-400"}`}>
                                    {msg.reply_sender_id === user.id ? "You" : selectedPeer?.name?.split(" ")[0] || ""}
                                  </p>
                                  <p className="truncate text-[11px] leading-tight">{msg.reply_preview}</p>
                                </button>
                              )}

                              {isDeleted ? (
                                <p className={`italic text-[13px] ${isMine ? "text-white/50" : "text-muted-foreground"}`}>
                                  This message was deleted
                                </p>
                              ) : isImage ? (
                                <button type="button" onClick={() => setLightboxSrc(msg.content)} className="block w-full">
                                  <img src={msg.content} alt="Shared image" className="rounded-xl w-full max-h-[300px] object-cover cursor-pointer" loading="lazy" />
                                </button>
                              ) : isAudio ? (
                                <VoiceMessage src={msg.content} isMine={isMine} />
                              ) : isDoc ? (() => {
                                const doc = parseDocContent(msg.content);
                                const ext = doc.name.split(".").pop()?.toUpperCase() || "FILE";
                                return (
                                  <a href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 group">
                                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${isMine ? "bg-white/20" : "bg-gold-100 dark:bg-gold-500/20"}`}>
                                      <FileText className={`h-5 w-5 ${isMine ? "text-white" : "text-gold-600 dark:text-gold-400"}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className={`text-sm font-medium truncate ${isMine ? "text-white" : ""}`}>{doc.name}</p>
                                      <p className={`text-[11px] ${isMine ? "text-white/60" : "text-muted-foreground"}`}>{ext} · {formatFileSize(doc.size)}</p>
                                    </div>
                                    <Download className={`h-4 w-4 shrink-0 opacity-60 group-hover:opacity-100 ${isMine ? "text-white" : "text-muted-foreground"}`} />
                                  </a>
                                );
                              })() : (
                                <p className="break-words whitespace-pre-wrap">{formatMessageText(msg.content)}</p>
                              )}
                              <div className={`flex items-center justify-end gap-0.5 -mb-0.5 ${
                                isImage ? "mt-0.5 px-1" : isAudio || isDoc ? "mt-0" : "mt-0.5"
                              } ${
                                isMine ? "text-white/60" : "text-navy-400 dark:text-zinc-500"
                              }`}>
                                {msg.pinned && !isDeleted && <Pin className="h-2 w-2 shrink-0" />}
                                {isEdited && !isDeleted && <span className="text-[9px] leading-none mr-0.5">edited</span>}
                                <span className="text-[10px] leading-none">
                                  {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </span>
                                {!isDeleted && <ReadReceipt msg={msg} isMine={isMine} />}
                              </div>
                            </div>

                            {/* Reactions */}
                            {msgReactions.length > 0 && (
                              <div className={`flex flex-wrap gap-1 mt-0.5 ${isMine ? "justify-end" : "justify-start"}`}>
                                {Object.entries(msgReactions.reduce<Record<string, { emoji: string; count: number; byMe: boolean }>>((acc, r) => {
                                  if (!acc[r.emoji]) acc[r.emoji] = { emoji: r.emoji, count: 0, byMe: false };
                                  acc[r.emoji].count++;
                                  if (r.user_id === user.id) acc[r.emoji].byMe = true;
                                  return acc;
                                }, {})).map(([emoji, { count, byMe }]) => (
                                  <button
                                    key={emoji}
                                    className={`inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full border transition-colors ${
                                      byMe ? "bg-gold-100 dark:bg-gold-500/20 border-gold-300 dark:border-gold-500/40" : "bg-card dark:bg-zinc-800 border-border dark:border-zinc-700"
                                    }`}
                                    onClick={() => handleReaction(msg.id, emoji)}
                                  >
                                    <span>{emoji}</span>
                                    {count > 1 && <span className="text-[10px] text-muted-foreground">{count}</span>}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
                )}

                {/* Edit mode bar */}
                {editingMsg && (
                  <div className="px-3 pt-2 pb-0 border-t shrink-0 bg-background">
                    <div className="flex items-center gap-2 bg-sky-50 dark:bg-sky-500/5 rounded-xl px-3 py-2 border-l-2 border-sky-500">
                      <Pencil className="h-4 w-4 text-sky-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-sky-600 dark:text-sky-400">Editing message</p>
                        <p className="text-xs text-muted-foreground truncate">{editingMsg.content}</p>
                      </div>
                      <button className="h-6 w-6 rounded-full hover:bg-navy-100 dark:hover:bg-zinc-700 flex items-center justify-center shrink-0" onClick={() => { setEditingMsg(null); setNewMessage(""); if (inputRef.current) { inputRef.current.value = ""; inputRef.current.style.height = "auto"; } }}>
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Reply preview */}
                {replyTo && !editingMsg && (
                  <div className="px-3 pt-2 pb-0 border-t shrink-0 bg-background">
                    <div className="flex items-center gap-2 bg-gold-50 dark:bg-gold-500/5 rounded-xl px-3 py-2 border-l-2 border-primary">
                      <Reply className="h-4 w-4 text-primary shrink-0 scale-x-[-1]" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-gold-600 dark:text-gold-400">
                          {replyTo.sender_id === user.id ? "You" : selectedPeer?.name?.split(" ")[0] || ""}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{getReplyPreview(replyTo)}</p>
                      </div>
                      <button className="h-6 w-6 rounded-full hover:bg-navy-100 dark:hover:bg-zinc-700 flex items-center justify-center shrink-0" onClick={() => setReplyTo(null)}>
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
                      <div className="flex items-center gap-3 bg-navy-50 dark:bg-zinc-800 rounded-xl px-3 py-2.5 max-w-xs">
                        <div className="h-10 w-10 rounded-lg bg-gold-100 dark:bg-gold-500/20 flex items-center justify-center shrink-0">
                          <FileText className="h-5 w-5 text-gold-600 dark:text-gold-400" />
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
                <div className={`px-3 py-2 ${!imagePreview && !docFile ? "border-t" : ""} shrink-0 bg-background`} style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
                  {/* Hidden file inputs */}
                  <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
                  <input ref={docInputRef} type="file" accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.csv" className="hidden" onChange={handleDocPick} />

                  {imagePreview ? (
                    /* Image selected — send */
                    <div className="flex items-center gap-2">
                      <div className="flex-1 relative">
                        <div className="min-h-[2.75rem] rounded-[22px] bg-navy-50 dark:bg-zinc-800 px-4 py-2.5 text-base text-muted-foreground dark:text-zinc-500">
                          Send photo...
                        </div>
                      </div>
                      <button type="button" disabled={sending} className="h-10 w-10 rounded-full bg-primary hover:brightness-105 text-white shrink-0 flex items-center justify-center active:scale-95 disabled:opacity-50" onClick={sendImage}>
                        {sending ? <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="h-4 w-4" />}
                      </button>
                    </div>
                  ) : docFile ? (
                    /* Document selected — send */
                    <div className="flex items-center gap-2">
                      <div className="flex-1 relative">
                        <div className="min-h-[2.75rem] rounded-[22px] bg-navy-50 dark:bg-zinc-800 px-4 py-2.5 text-base text-muted-foreground dark:text-zinc-500">
                          Send document...
                        </div>
                      </div>
                      <button type="button" disabled={sending} className="h-10 w-10 rounded-full bg-primary hover:brightness-105 text-white shrink-0 flex items-center justify-center active:scale-95 disabled:opacity-50" onClick={sendDoc}>
                        {sending ? <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="h-4 w-4" />}
                      </button>
                    </div>
                  ) : audioPreview ? (
                    /* Voice note preview */
                    <div className="flex items-center gap-2 bg-gold-50 dark:bg-gold-900/20 rounded-full px-2 py-1.5">
                      <button className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-red-500 hover:bg-red-100 dark:hover:bg-red-500/10" onClick={discardVoiceNote}>
                        <X className="h-4 w-4" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <audio controls src={audioPreview} className="w-full h-8" style={{ filter: "sepia(20%) saturate(70%) grayscale(1) contrast(99%) invert(12%)" }} />
                      </div>
                      <button disabled={sending} className="h-9 w-9 rounded-full bg-primary hover:brightness-105 text-white shrink-0 flex items-center justify-center active:scale-95 disabled:opacity-50" onClick={sendVoiceNote}>
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
                      {selectedPeerId && (
                        <>
                          <button type="button" className="h-9 w-9 rounded-full text-muted-foreground hover:bg-navy-50 dark:hover:bg-zinc-800 shrink-0 flex items-center justify-center active:scale-95" onClick={() => imageInputRef.current?.click()}>
                            <ImagePlus className="h-5 w-5" />
                          </button>
                          <button type="button" className="h-9 w-9 rounded-full text-muted-foreground hover:bg-navy-50 dark:hover:bg-zinc-800 shrink-0 flex items-center justify-center active:scale-95" onClick={() => docInputRef.current?.click()}>
                            <Paperclip className="h-5 w-5" />
                          </button>
                        </>
                      )}
                      <div className="flex-1">
                        <textarea
                          ref={inputRef}
                          inputMode="text"
                          autoComplete="off"
                          autoCorrect="on"
                          autoCapitalize="sentences"
                          enterKeyHint="enter"
                          aria-label="Message"
                          placeholder={selectedGroupId ? "Message group..." : "Message"}
                          value={newMessage}
                          rows={1}
                          onChange={(e) => {
                            setNewMessage(e.target.value);
                            e.target.style.height = "auto";
                            e.target.style.height = Math.min(e.target.scrollHeight, 96) + "px";
                            if (selectedPeerId) broadcastTyping();
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey && !isTouchDevice.current) {
                              e.preventDefault();
                              if (selectedGroupId) handleSendGroupMessage();
                              else handleSend();
                            }
                          }}
                          className="w-full min-h-[2.75rem] max-h-24 rounded-[22px] bg-navy-50 dark:bg-zinc-800 px-4 py-2.5 text-base outline-none overflow-y-auto resize-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
                        />
                      </div>
                      {newMessage.trim() ? (
                        <button
                          type="button"
                          disabled={sending}
                          className="h-10 w-10 rounded-full bg-primary hover:brightness-105 text-white shrink-0 flex items-center justify-center active:scale-95 disabled:opacity-50"
                          onClick={() => selectedGroupId ? handleSendGroupMessage() : handleSend()}
                        >
                          {sending ? <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="h-4 w-4" />}
                        </button>
                      ) : selectedPeerId ? (
                        <button type="button" className="h-10 w-10 rounded-full bg-primary hover:brightness-105 text-white shrink-0 flex items-center justify-center active:scale-95" onClick={startRecording}>
                          <Mic className="h-4 w-4" />
                        </button>
                      ) : null}
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
          className="fixed inset-0 z-[90] bg-black/20 backdrop-blur-[2px]"
          onClick={() => { if (!contextMenuJustOpened.current) setContextMenu(null); }}
          onContextMenu={(e) => { e.preventDefault(); setContextMenu(null); }}
        >
          <div
            className="absolute bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl border dark:border-zinc-700 min-w-[180px] z-[91] animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
            style={{
              left: `clamp(8px, ${contextMenu.x}px, calc(100vw - 196px))`,
              top: `clamp(8px, ${contextMenu.y}px, calc(100vh - 320px))`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Quick react bar */}
            <div className="flex items-center justify-center gap-0.5 px-2 py-2 border-b dark:border-zinc-700">
              {QUICK_REACTIONS.map(emoji => (
                <button
                  key={emoji}
                  className="h-9 w-9 rounded-full hover:bg-navy-50 dark:hover:bg-zinc-700 flex items-center justify-center text-xl active:scale-125 transition-transform"
                  onClick={() => handleReaction(contextMenu.msg.id, emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <div className="py-1">
              <button className="flex items-center gap-3 w-full px-3.5 py-2.5 text-[13px] hover:bg-navy-50 dark:hover:bg-zinc-700 text-left active:bg-navy-100 dark:active:bg-zinc-600" onClick={() => handleReply(contextMenu.msg)}>
                <Reply className="h-4 w-4 text-muted-foreground" /> Reply
              </button>
              <button className="flex items-center gap-3 w-full px-3.5 py-2.5 text-[13px] hover:bg-navy-50 dark:hover:bg-zinc-700 text-left active:bg-navy-100 dark:active:bg-zinc-600" onClick={() => handleForwardSelect(contextMenu.msg)}>
                <Forward className="h-4 w-4 text-muted-foreground" /> Forward
              </button>
              {contextMenu.msg.type === "text" && (
                <button className="flex items-center gap-3 w-full px-3.5 py-2.5 text-[13px] hover:bg-navy-50 dark:hover:bg-zinc-700 text-left active:bg-navy-100 dark:active:bg-zinc-600" onClick={() => handleCopy(contextMenu.msg)}>
                  <Copy className="h-4 w-4 text-muted-foreground" /> Copy
                </button>
              )}
              {contextMenu.msg.sender_id === user?.id && contextMenu.msg.type === "text" && !contextMenu.msg.deleted_at && (
                <button className="flex items-center gap-3 w-full px-3.5 py-2.5 text-[13px] hover:bg-navy-50 dark:hover:bg-zinc-700 text-left active:bg-navy-100 dark:active:bg-zinc-600" onClick={() => handleEdit(contextMenu.msg)}>
                  <Pencil className="h-4 w-4 text-muted-foreground" /> Edit
                </button>
              )}
              <button className="flex items-center gap-3 w-full px-3.5 py-2.5 text-[13px] hover:bg-navy-50 dark:hover:bg-zinc-700 text-left active:bg-navy-100 dark:active:bg-zinc-600" onClick={() => handlePin(contextMenu.msg)}>
                {contextMenu.msg.pinned ? <PinOff className="h-4 w-4 text-muted-foreground" /> : <Pin className="h-4 w-4 text-muted-foreground" />}
                {contextMenu.msg.pinned ? "Unpin" : "Pin"}
              </button>
              {contextMenu.msg.sender_id === user?.id && (
                <button className="flex items-center gap-3 w-full px-3.5 py-2.5 text-[13px] hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 text-left active:bg-red-100 dark:active:bg-red-500/20" onClick={() => handleDelete(contextMenu.msg)}>
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Forward dialog */}
      {forwardMsg && (
        <div
          className="fixed inset-0 z-[95] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center"
          onClick={() => setForwardMsg(null)}
        >
          <div
            className="bg-white dark:bg-zinc-900 w-full sm:w-96 sm:rounded-2xl rounded-t-2xl max-h-[70vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b flex items-center justify-between shrink-0">
              <h3 className="font-semibold text-sm">Forward to...</h3>
              <button className="h-7 w-7 rounded-full hover:bg-navy-50 dark:hover:bg-zinc-800 flex items-center justify-center" onClick={() => setForwardMsg(null)}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.filter(c => c.peerId !== selectedPeerId).map((conv) => {
                const peer = peerProfiles[conv.peerId];
                if (!peer) return null;
                const initials = peer.name.split(" ").map((n) => n[0]).join("").toUpperCase();
                return (
                  <button
                    key={conv.peerId}
                    className="flex items-center gap-3 w-full p-3 hover:bg-navy-50 dark:hover:bg-zinc-800 transition-colors text-left active:bg-navy-100 dark:active:bg-zinc-700"
                    onClick={() => handleForwardTo(conv.peerId)}
                  >
                    <Avatar className="h-10 w-10 shrink-0">
                      {peer.avatar_url ? (
                        <img src={peer.avatar_url} alt={peer.name} className="h-full w-full object-cover rounded-full" />
                      ) : (
                        <AvatarFallback className="bg-gold-100 text-navy-800 text-sm font-semibold">{initials}</AvatarFallback>
                      )}
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{peer.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{peer.faculty}</p>
                    </div>
                  </button>
                );
              })}
              {conversations.filter(c => c.peerId !== selectedPeerId).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">No other conversations</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Study Group dialog */}
      {showCreateGroup && (
        <div
          className="fixed inset-0 z-[95] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center"
          onClick={() => setShowCreateGroup(false)}
        >
          <div
            className="bg-white dark:bg-zinc-900 w-full sm:w-[420px] sm:rounded-2xl rounded-t-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-4 py-3.5 border-b flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-sky-500 to-navy-700 flex items-center justify-center">
                  <Users className="h-4 w-4 text-white" />
                </div>
                <h3 className="font-semibold text-sm">New Study Group</h3>
              </div>
              <button className="h-7 w-7 rounded-full hover:bg-navy-50 dark:hover:bg-zinc-800 flex items-center justify-center" onClick={() => setShowCreateGroup(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Group name */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Group name *</label>
                <input
                  type="text"
                  placeholder="e.g. KNUST Calculus Study Group"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  maxLength={60}
                  className="w-full h-10 px-3 rounded-xl bg-navy-50 dark:bg-zinc-800 text-sm outline-none focus:ring-2 focus:ring-primary/30 border border-transparent focus:border-primary/30"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Description</label>
                <textarea
                  placeholder="What will you study together?"
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  rows={2}
                  maxLength={200}
                  className="w-full px-3 py-2.5 rounded-xl bg-navy-50 dark:bg-zinc-800 text-sm outline-none focus:ring-2 focus:ring-primary/30 border border-transparent focus:border-primary/30 resize-none"
                />
              </div>

              {/* Members */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
                  Add members ({newGroupMemberIds.length} selected)
                </label>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {Object.values(peerProfiles).map((peer) => {
                    const checked = newGroupMemberIds.includes(peer.id);
                    const initials = peer.name.split(" ").map((n) => n[0]).join("").toUpperCase();
                    return (
                      <button
                        key={peer.id}
                        className={`flex items-center gap-3 w-full p-2.5 rounded-xl transition-colors text-left ${
                          checked ? "bg-gold-50 dark:bg-gold-500/10 border border-gold-200 dark:border-gold-500/30" : "hover:bg-navy-50 dark:hover:bg-zinc-800"
                        }`}
                        onClick={() => {
                          setNewGroupMemberIds((prev) =>
                            prev.includes(peer.id) ? prev.filter((id) => id !== peer.id) : [...prev, peer.id]
                          );
                        }}
                      >
                        <Avatar className="h-8 w-8 shrink-0">
                          {peer.avatar_url ? (
                            <img src={peer.avatar_url} alt={peer.name} className="h-full w-full object-cover rounded-full" />
                          ) : (
                            <AvatarFallback className="bg-gold-100 text-navy-800 text-xs font-semibold">{initials}</AvatarFallback>
                          )}
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{peer.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{peer.faculty}</p>
                        </div>
                        <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                          checked ? "bg-primary border-primary" : "border-muted-foreground/30"
                        }`}>
                          {checked && <span className="text-white text-[10px] font-bold">✓</span>}
                        </div>
                      </button>
                    );
                  })}
                  {Object.keys(peerProfiles).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Start some conversations first to add members
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t shrink-0">
              <Button
                className="w-full"
                disabled={!newGroupName.trim() || newGroupMemberIds.length === 0 || creatingGroup}
                onClick={handleCreateGroup}
              >
                {creatingGroup ? (
                  <span className="flex items-center gap-2"><span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating...</span>
                ) : (
                  <span className="flex items-center gap-2"><Users className="h-4 w-4" /> Create group</span>
                )}
              </Button>
            </div>
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
