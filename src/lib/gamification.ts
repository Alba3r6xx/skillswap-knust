import { Session, Profile } from "@/lib/types";

// ─── XP TIER SYSTEM ─────────────────────────────────────────

export const XP_TIERS = [
  { name: "Newcomer",  min: 0,    max: 99,   color: "text-slate-600",  bg: "bg-slate-100",  icon: "🌱" },
  { name: "Learner",   min: 100,  max: 299,  color: "text-sky-600",    bg: "bg-sky-100",    icon: "📘" },
  { name: "Scholar",   min: 300,  max: 599,  color: "text-blue-600",   bg: "bg-blue-100",   icon: "🎓" },
  { name: "Expert",    min: 600,  max: 999,  color: "text-violet-600", bg: "bg-violet-100", icon: "⚡" },
  { name: "Master",    min: 1000, max: 1999, color: "text-gold-600",  bg: "bg-gold-100",  icon: "🏆" },
  { name: "Champion",  min: 2000, max: Infinity, color: "text-yellow-600", bg: "bg-yellow-100", icon: "👑" },
] as const;

export type XPTier = typeof XP_TIERS[number];

export function getXPTier(xp: number): XPTier {
  return (XP_TIERS.find((t) => xp >= t.min && xp <= t.max) || XP_TIERS[0]) as XPTier;
}

export function getXPProgress(xp: number): number {
  const tier = getXPTier(xp);
  const tierIndex = XP_TIERS.findIndex((t) => t.name === tier.name);
  const nextTier = XP_TIERS[tierIndex + 1];
  if (!nextTier) return 100;
  const range = nextTier.min - tier.min;
  const progress = xp - tier.min;
  return Math.min(100, Math.round((progress / range) * 100));
}

export function getNextXPMilestone(xp: number): number | null {
  const tier = getXPTier(xp);
  const tierIndex = XP_TIERS.findIndex((t) => t.name === tier.name);
  const nextTier = XP_TIERS[tierIndex + 1];
  return nextTier ? nextTier.min : null;
}

export const XP_REWARDS: Record<string, number> = {
  session_completed: 50,
  session_taught: 75,
  profile_completed: 100,
  first_session: 200,
  streak_bonus: 25,
  message_sent: 5,
  review_given: 30,
};

// ─── SWAP STREAK ────────────────────────────────────────────

function getISOWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo}`;
}

export function computeSwapStreak(sessions: Session[], userId: string): number {
  const completed = sessions.filter(
    (s) => s.status === "completed" && (s.teacher_id === userId || s.learner_id === userId)
  );
  if (completed.length === 0) return 0;

  const weeks = new Set<string>();
  completed.forEach((s) => weeks.add(getISOWeek(new Date(s.created_at))));

  let streak = 0;
  const now = new Date();
  let checkDate = new Date(now);

  while (true) {
    const weekKey = getISOWeek(checkDate);
    if (weeks.has(weekKey)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 7);
    } else {
      break;
    }
    if (streak > 52) break;
  }

  return streak;
}

// ─── PROFILE COMPLETION ──────────────────────────────────────

export interface CompletionItem {
  label: string;
  done: boolean;
  xp: number;
  href: string;
}

export function getProfileCompletion(profile: Profile): { score: number; items: CompletionItem[] } {
  const items: CompletionItem[] = [
    { label: "Add your name", done: !!profile.name && profile.name.length > 1, xp: 10, href: "/profile" },
    { label: "Upload a profile photo", done: !!profile.avatar_url, xp: 15, href: "/profile" },
    { label: "Write a bio", done: !!profile.bio && profile.bio.length > 20, xp: 15, href: "/profile" },
    { label: "Select your faculty", done: !!profile.faculty, xp: 10, href: "/profile" },
    { label: "Add skills to teach", done: profile.skills_to_teach.length > 0, xp: 20, href: "/profile" },
    { label: "Add skills to learn", done: profile.skills_to_learn.length > 0, xp: 20, href: "/profile" },
    { label: "Set your availability", done: profile.availability.length > 0, xp: 10, href: "/profile" },
  ];

  const totalXP = items.reduce((sum, i) => sum + i.xp, 0);
  const earnedXP = items.filter((i) => i.done).reduce((sum, i) => sum + i.xp, 0);
  const score = Math.round((earnedXP / totalXP) * 100);

  return { score, items };
}

// ─── ACHIEVEMENT BADGES ──────────────────────────────────────

export type BadgeRarity = "common" | "rare" | "epic" | "legendary";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: BadgeRarity;
}

export const RARITY_STYLES: Record<BadgeRarity, { border: string; bg: string; label: string }> = {
  common:    { border: "border-slate-200",  bg: "bg-slate-50",   label: "Common" },
  rare:      { border: "border-sky-300",    bg: "bg-sky-50",     label: "Rare" },
  epic:      { border: "border-violet-300", bg: "bg-violet-50",  label: "Epic" },
  legendary: { border: "border-gold-400",  bg: "bg-gold-50",   label: "Legendary" },
};

export function computeAchievements(
  sessions: Session[],
  profile: Profile,
  userId: string
): Achievement[] {
  const badges: Achievement[] = [];
  const completed = sessions.filter((s) => s.status === "completed");
  const taught = completed.filter((s) => s.teacher_id === userId);
  const learned = completed.filter((s) => s.learner_id === userId);
  const streak = computeSwapStreak(sessions, userId);
  const { score: completion } = getProfileCompletion(profile);

  if (completed.length >= 1)
    badges.push({ id: "first_swap", name: "First Swap", description: "Complete your first session", icon: "🎯", rarity: "common" });
  if (completion >= 100)
    badges.push({ id: "verified_pro", name: "Verified Pro", description: "100% profile complete", icon: "✅", rarity: "rare" });
  if (completed.length >= 5)
    badges.push({ id: "high_five", name: "High Five", description: "Complete 5 sessions", icon: "🖐️", rarity: "common" });
  if (completed.length >= 10)
    badges.push({ id: "dedicated", name: "Dedicated", description: "Complete 10 sessions", icon: "🏆", rarity: "rare" });
  if (completed.length >= 25)
    badges.push({ id: "legend", name: "Legend", description: "Complete 25 sessions", icon: "👑", rarity: "epic" });
  if (taught.length >= 3)
    badges.push({ id: "great_teacher", name: "Great Teacher", description: "Teach 3+ sessions", icon: "📚", rarity: "common" });
  if (taught.length >= 10)
    badges.push({ id: "top_tutor", name: "Top Tutor", description: "Teach 10+ sessions", icon: "🎓", rarity: "rare" });
  if (learned.length >= 3)
    badges.push({ id: "quick_learner", name: "Quick Learner", description: "Learn from 3+ sessions", icon: "🧠", rarity: "common" });
  if (streak >= 2)
    badges.push({ id: "on_a_roll", name: "On a Roll", description: "2-week swap streak", icon: "🔄", rarity: "common" });
  if (streak >= 4)
    badges.push({ id: "on_fire", name: "On Fire", description: "4-week swap streak", icon: "🔥", rarity: "rare" });
  if (streak >= 8)
    badges.push({ id: "unstoppable", name: "Unstoppable", description: "8-week swap streak", icon: "⚡", rarity: "epic" });
  if (profile.rating >= 4.5 && profile.total_ratings >= 5)
    badges.push({ id: "top_rated", name: "Top Rated", description: "4.5+ stars with 5+ ratings", icon: "⭐", rarity: "epic" });
  if (profile.rating === 5 && profile.total_ratings >= 10)
    badges.push({ id: "perfect_score", name: "Perfect Score", description: "Perfect 5.0 rating × 10 reviews", icon: "💎", rarity: "legendary" });

  return badges;
}

// ─── URGENCY / SOCIAL PROOF HELPERS ──────────────────────────

/** Deterministic "viewers now" count seeded from profile ID — consistent per user */
export function getViewerCount(profileId: string): number {
  const seed = profileId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return (seed % 7) + 2; // 2–8
}

/** Weekly slot capacity (max 6/week) minus accepted sessions this week */
export function getAvailableSlots(
  sessions: Session[],
  teacherId: string
): number {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const bookedThisWeek = sessions.filter((s) => {
    const d = new Date(s.date);
    return s.teacher_id === teacherId && 
           (s.status === "pending" || s.status === "accepted") &&
           d >= startOfWeek;
  }).length;

  return Math.max(0, 6 - bookedThisWeek);
}

/** Fake "skill requested N times this week" — seeded from skill name */
export function getSkillRequestCount(skillName: string): number {
  const seed = skillName.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return (seed % 12) + 3; // 3–14
}
