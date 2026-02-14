import { supabase } from "@/lib/supabase";
import { Profile, Session, Message, Notification, Badge } from "@/lib/types";

// ─── Profiles ───────────────────────────────────────────────

export async function getProfileById(id: string): Promise<Profile | null> {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();
  return data as Profile | null;
}

export async function getAllProfiles(): Promise<Profile[]> {
  const { data } = await supabase.from("profiles").select("*");
  return (data as Profile[]) || [];
}

export async function updateProfile(id: string, updates: Partial<Profile>) {
  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", id);
  return { error };
}

export async function searchProfiles(query: string, filters?: {
  faculty?: string;
  mode?: string;
  category?: string;
  level?: string;
}): Promise<Profile[]> {
  let q = supabase.from("profiles").select("*");

  if (filters?.faculty) q = q.eq("faculty", filters.faculty);
  if (filters?.mode && filters.mode !== "both") q = q.or(`preferred_mode.eq.${filters.mode},preferred_mode.eq.both`);

  const { data } = await q;
  let profiles = (data as Profile[]) || [];

  if (query) {
    const lower = query.toLowerCase();
    profiles = profiles.filter(
      (p) =>
        p.name.toLowerCase().includes(lower) ||
        p.skills_to_teach.some((s) => s.name.toLowerCase().includes(lower)) ||
        p.skills_to_learn.some((s) => s.name.toLowerCase().includes(lower))
    );
  }

  if (filters?.category) {
    profiles = profiles.filter((p) =>
      p.skills_to_teach.some((s) => s.category === filters.category) ||
      p.skills_to_learn.some((s) => s.category === filters.category)
    );
  }

  if (filters?.level) {
    profiles = profiles.filter((p) =>
      p.skills_to_teach.some((s) => s.level === filters.level) ||
      p.skills_to_learn.some((s) => s.level === filters.level)
    );
  }

  return profiles;
}

export function getMatchScore(currentUser: Profile, peer: Profile): number {
  let score = 0;
  currentUser.skills_to_learn.forEach((learn) => {
    if (peer.skills_to_teach.some((t) => t.name.toLowerCase() === learn.name.toLowerCase())) {
      score += 10;
    }
  });
  currentUser.skills_to_teach.forEach((teach) => {
    if (peer.skills_to_learn.some((l) => l.name.toLowerCase() === teach.name.toLowerCase())) {
      score += 10;
    }
  });
  if (peer.faculty === currentUser.faculty) score += 3;
  if (peer.preferred_mode === currentUser.preferred_mode || peer.preferred_mode === "both") score += 2;
  score += Math.min(peer.rating * 2, 10);
  return score;
}

export function getTimeSinceLastSeen(lastSeen: string | undefined): string {
  if (!lastSeen) return "Unknown";
  const diff = Date.now() - new Date(lastSeen).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 5) return "Online now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ─── Sessions ───────────────────────────────────────────────

export async function getSessionsByUser(userId: string): Promise<Session[]> {
  const { data } = await supabase
    .from("sessions")
    .select("*")
    .or(`teacher_id.eq.${userId},learner_id.eq.${userId}`)
    .order("created_at", { ascending: false });
  return (data as Session[]) || [];
}

export async function createSession(session: Omit<Session, "id" | "created_at">) {
  const { data, error } = await supabase
    .from("sessions")
    .insert(session)
    .select()
    .single();
  return { data: data as Session | null, error };
}

export async function updateSession(id: string, updates: Partial<Session>) {
  const { error } = await supabase
    .from("sessions")
    .update(updates)
    .eq("id", id);
  return { error };
}

// ─── Messages ───────────────────────────────────────────────

export async function getConversations(userId: string) {
  const [{ data: sent }, { data: received }] = await Promise.all([
    supabase
      .from("messages")
      .select("*")
      .eq("sender_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("messages")
      .select("*")
      .eq("receiver_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  const all = [...(sent || []), ...(received || [])] as Message[];
  const convMap = new Map<string, Message[]>();

  all.forEach((msg) => {
    const peerId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
    if (!convMap.has(peerId)) convMap.set(peerId, []);
    convMap.get(peerId)!.push(msg);
  });

  const conversations = Array.from(convMap.entries()).map(([peerId, msgs]) => {
    msgs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const unread = msgs.filter((m) => m.receiver_id === userId && !m.read).length;
    return { peerId, lastMessage: msgs[0], messages: msgs, unreadCount: unread };
  });

  conversations.sort(
    (a, b) => new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime()
  );

  return conversations;
}

export async function getMessagesBetween(userId: string, peerId: string): Promise<Message[]> {
  const { data } = await supabase
    .from("messages")
    .select("*")
    .or(
      `and(sender_id.eq.${userId},receiver_id.eq.${peerId}),and(sender_id.eq.${peerId},receiver_id.eq.${userId})`
    )
    .order("created_at", { ascending: true });
  return (data as Message[]) || [];
}

export async function sendMessage(msg: { sender_id: string; receiver_id: string; content: string; type?: string }) {
  const { data, error } = await supabase
    .from("messages")
    .insert({ ...msg, type: msg.type || "text" })
    .select()
    .single();
  return { data: data as Message | null, error };
}

export async function markMessagesAsRead(userId: string, senderId: string) {
  await supabase
    .from("messages")
    .update({ read: true })
    .eq("receiver_id", userId)
    .eq("sender_id", senderId)
    .eq("read", false);
}

// ─── Notifications ──────────────────────────────────────────

export async function getNotifications(userId: string): Promise<Notification[]> {
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);
  return (data as Notification[]) || [];
}

export async function createNotification(notif: Omit<Notification, "id" | "created_at" | "read">) {
  await supabase.from("notifications").insert(notif);
}

export async function markNotificationsRead(userId: string) {
  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);
}

// ─── Badges ─────────────────────────────────────────────────

export function computeBadges(sessions: Session[], userId: string): Badge[] {
  const badges: Badge[] = [];
  const completed = sessions.filter((s) => s.status === "completed");
  const taught = completed.filter((s) => s.teacher_id === userId);
  const learned = completed.filter((s) => s.learner_id === userId);

  if (completed.length >= 1) badges.push({ id: "first", name: "First Session", description: "Completed your first session", icon: "🎯" });
  if (completed.length >= 5) badges.push({ id: "five", name: "High Five", description: "Completed 5 sessions", icon: "🖐️" });
  if (completed.length >= 10) badges.push({ id: "ten", name: "Dedicated", description: "Completed 10 sessions", icon: "🏆" });
  if (taught.length >= 3) badges.push({ id: "teacher", name: "Great Teacher", description: "Taught 3+ sessions", icon: "📚" });
  if (learned.length >= 3) badges.push({ id: "learner", name: "Quick Learner", description: "Learned 3+ sessions", icon: "🧠" });

  return badges;
}
