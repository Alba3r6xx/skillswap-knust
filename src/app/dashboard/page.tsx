"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getSessionsByUser, getAllProfiles, getMatchScore, getConversations } from "@/lib/data";
import { Profile, Session } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  GraduationCap,
  BookOpen,
  Calendar,
  Star,
  Bell,
  Award,
  Search,
  MessageSquare,
  Flame,
  Zap,
  Users,
  Target,
  ChevronRight,
  BarChart3,
  Clock,
  Sparkles,
} from "lucide-react";
import { XPBar } from "@/components/gamification/xp-bar";
import { StreakCard } from "@/components/gamification/streak-card";
import { ActivityStream } from "@/components/social-proof/activity-stream";
import { EmptyState } from "@/components/empty-state";
import { computeSwapStreak, getProfileCompletion, computeAchievements, RARITY_STYLES } from "@/lib/gamification";
import { AnimatedCounter } from "@/components/animated-counter";

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [topMatches, setTopMatches] = useState<Profile[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
      return;
    }
    if (!user) return;

    const fetchData = async () => {
      const [sessData, profiles, convos] = await Promise.all([
        getSessionsByUser(user.id),
        getAllProfiles(),
        getConversations(user.id),
      ]);
      setSessions(sessData);

      const others = profiles.filter((p) => p.id !== user.id);
      const scored = others
        .map((p) => ({ profile: p, score: getMatchScore(user, p) }))
        .filter((m) => m.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
      setTopMatches(scored.map((m) => m.profile));

      const total = convos.reduce((acc, c) => acc + c.unreadCount, 0);
      setUnreadCount(total);
      setLoading(false);
    };
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isLoading, router]);

  const streak = user ? computeSwapStreak(sessions, user.id) : 0;
  const { score: profileScore } = user ? getProfileCompletion(user) : { score: 0 };
  const achievements = user ? computeAchievements(sessions, user, user.id) : [];

  const weeklyActivity = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const counts = Array(7).fill(0);
    sessions.forEach((s) => {
      const d = new Date(s.date);
      if (d >= weekStart && d <= now) {
        counts[d.getDay()]++;
      }
    });

    return days.map((day, i) => ({
      day,
      count: counts[i],
      isToday: i === now.getDay(),
    }));
  }, [sessions]);

  const sessionsThisWeek = weeklyActivity.reduce((total, day) => total + day.count, 0);
  const chartWidth = 320;
  const chartHeight = 100;
  const chartPaddingX = 24;
  const chartPaddingY = 12;
  const chartMaxValue = Math.max(...weeklyActivity.map((day) => day.count), 1);
  const chartPoints = weeklyActivity.map((day, index) => ({
    ...day,
    x: chartPaddingX + (index / 6) * (chartWidth - chartPaddingX * 2),
    y: chartPaddingY + (1 - day.count / chartMaxValue) * (chartHeight - chartPaddingY * 2),
  }));
  const chartLinePath = chartPoints.reduce((path, point, index, points) => {
    if (index === 0) return `M${point.x},${point.y}`;
    const prev = points[index - 1];
    const controlX = (prev.x + point.x) / 2;
    return `${path} C${controlX},${prev.y} ${controlX},${point.y} ${point.x},${point.y}`;
  }, "");
  const chartAreaPath = chartPoints.length > 0
    ? `${chartLinePath} L${chartPoints[chartPoints.length - 1].x},${chartHeight} L${chartPoints[0].x},${chartHeight} Z`
    : "";

  if (isLoading || !user) {
    return (
      <div className="min-h-dvh bg-background">
        <div className="mx-auto max-w-5xl space-y-5 px-4 pt-4 md:pt-8 pb-8">
          <div className="space-y-1.5">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            <Skeleton className="md:col-span-2 h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const upcoming = sessions.filter((s) => s.status === "accepted");
  const completed = sessions.filter((s) => s.status === "completed");
  const pending = sessions.filter((s) => s.status === "pending");

  const totalSessions = sessions.length;
  const completionRate = totalSessions > 0 ? Math.round((completed.length / totalSessions) * 100) : 0;

  return (
    <div className="min-h-dvh bg-background">
      <ActivityStream currentUserId={user.id} />

      {/* ── Navy page banner ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 pt-2 md:pt-8 pb-20 px-4">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} aria-hidden />
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl opacity-[0.07]" style={{ background: "oklch(0.769 0.188 70)" }} aria-hidden />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full blur-3xl opacity-[0.05]" style={{ background: "oklch(0.68 0.104 232)" }} aria-hidden />

        <div className="relative mx-auto max-w-5xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-slide-up">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">
                Hey, {user.name.split(" ")[0]}
              </h1>
              <p className="text-sm text-navy-300 mt-1">Here&apos;s what&apos;s happening this week</p>
            </div>
            {pending.length > 0 && (
              <Link href="/sessions">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary text-white px-4 py-2.5 text-sm font-semibold
                  shadow-[0_4px_16px_oklch(0.769_0.188_70/0.35)] hover:brightness-110 hover:shadow-[0_6px_24px_oklch(0.769_0.188_70/0.45)] transition-all duration-200 active:scale-[0.97]">
                  <Bell className="h-4 w-4" />
                  {pending.length} request{pending.length > 1 ? "s" : ""} waiting
                </div>
              </Link>
            )}
          </div>
        </div>

        {/* Wave bottom edge */}
        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 40" fill="none" preserveAspectRatio="none" aria-hidden>
          <path d="M0 40h1440V20c-240 13-480 20-720 15S240 13 0 20v20z" className="fill-background" />
        </svg>
      </div>

      {/* ── Content overlapping banner ── */}
      <div className="mx-auto px-4 -mt-10 pb-8 max-w-5xl relative z-10">

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 stagger-children">
          {[
            {
              label: "Teaching",
              value: user.skills_to_teach.length,
              icon: GraduationCap,
              gradient: "from-emerald-500 to-emerald-600",
              lightBg: "bg-emerald-50 dark:bg-emerald-500/10",
              iconColor: "text-emerald-600 dark:text-emerald-400",
              accent: "text-emerald-600 dark:text-emerald-400",
            },
            {
              label: "Learning",
              value: user.skills_to_learn.length,
              icon: BookOpen,
              gradient: "from-sky-500 to-sky-600",
              lightBg: "bg-sky-50 dark:bg-sky-500/10",
              iconColor: "text-sky-600 dark:text-sky-400",
              accent: "text-sky-600 dark:text-sky-400",
            },
            {
              label: "Swaps Done",
              value: completed.length,
              icon: Zap,
              gradient: "from-gold-500 to-gold-600",
              lightBg: "bg-gold-50 dark:bg-gold-500/10",
              iconColor: "text-gold-600 dark:text-gold-400",
              accent: "text-gold-600 dark:text-gold-400",
            },
            {
              label: "Rating",
              value: user.rating,
              icon: Star,
              gradient: "from-purple-500 to-purple-600",
              lightBg: "bg-purple-50 dark:bg-purple-500/10",
              iconColor: "text-purple-600 dark:text-purple-400",
              accent: "text-purple-600 dark:text-purple-400",
              isRating: true,
            },
          ].map(({ label, value, icon: Icon, lightBg, iconColor, isRating }) => (
            <Card key={label} className="stat-card group">
              <CardContent className="p-4">
                <div className="mb-3">
                  <div className={`h-9 w-9 rounded-xl ${lightBg} flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110`}>
                    <Icon className={`h-4.5 w-4.5 ${iconColor}`} />
                  </div>
                </div>
                <p className="text-3xl font-bold font-display tracking-tight leading-none mb-0.5">
                  {isRating ? (
                    value > 0 ? <><AnimatedCounter value={value} decimals={1} /><Star className="inline h-4 w-4 text-gold-500 fill-gold-500 ml-1 -mt-1" /></> : "—"
                  ) : (
                    <AnimatedCounter value={value} />
                  )}
                </p>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6 stagger-children">
          {/* ── Main Content ── */}
          <div className="md:col-span-2 space-y-6">

            {/* XP + Streak row */}
            <div className="grid grid-cols-2 gap-4">
              <XPBar xp={user.xp || 0} />
              <StreakCard streak={streak} />
            </div>

            {/* ── Weekly Activity — Fluid Area Graph ── */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    <CardTitle className="text-base">This Week</CardTitle>
                  </div>
                  <span className="text-xs text-muted-foreground">{sessionsThisWeek} sessions</span>
                </div>
              </CardHeader>
              <CardContent>
                {sessionsThisWeek === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-10 text-center">
                    <BarChart3 className="mx-auto h-8 w-8 text-muted-foreground/60" />
                    <p className="mt-3 text-sm font-medium">No session activity yet this week</p>
                    <p className="mt-1 text-xs text-muted-foreground">Book or complete a session to start filling this chart.</p>
                  </div>
                ) : (
                  <div className="relative text-muted-foreground">
                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight + 20}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
                      <defs>
                        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="oklch(0.769 0.188 70)" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="oklch(0.769 0.188 70)" stopOpacity="0.02" />
                        </linearGradient>
                        <linearGradient id="lineStroke" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="oklch(0.68 0.104 232)" />
                          <stop offset="50%" stopColor="oklch(0.769 0.188 70)" />
                          <stop offset="100%" stopColor="oklch(0.68 0.104 232)" />
                        </linearGradient>
                      </defs>

                      {/* Horizontal grid lines */}
                      {[0.25, 0.5, 0.75].map(frac => (
                        <line key={frac} x1={chartPaddingX} x2={chartWidth - chartPaddingX} y1={chartPaddingY + frac * (chartHeight - chartPaddingY * 2)} y2={chartPaddingY + frac * (chartHeight - chartPaddingY * 2)}
                          stroke="currentColor" strokeOpacity="0.06" strokeDasharray="4 4" />
                      ))}

                      {/* Area fill */}
                      <path d={chartAreaPath} fill="url(#areaFill)" className="area-draw" />

                      {/* Line */}
                      <path d={chartLinePath} fill="none" stroke="url(#lineStroke)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="line-draw" />

                      {/* Data points + labels */}
                      {chartPoints.map((point) => (
                        <g key={point.day}>
                          {/* Dot */}
                          <circle cx={point.x} cy={point.y} r={point.isToday ? 5 : 3.5}
                            fill={point.isToday ? "oklch(0.769 0.188 70)" : point.count > 0 ? "oklch(0.68 0.104 232)" : "currentColor"}
                            fillOpacity={point.count > 0 ? 1 : 0.15}
                            stroke="var(--color-background, white)" strokeWidth="2"
                          />
                          {/* Today pulse ring */}
                          {point.isToday && (
                            <circle cx={point.x} cy={point.y} r="8" fill="none" stroke="oklch(0.769 0.188 70)" strokeWidth="1.5" opacity="0.4">
                              <animate attributeName="r" values="5;10;5" dur="2s" repeatCount="indefinite" />
                              <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite" />
                            </circle>
                          )}
                          {/* Count label above dot */}
                          {point.count > 0 && (
                            <text x={point.x} y={point.y - 10} textAnchor="middle" fill="currentColor" fontSize="9" fontWeight="700">{point.count}</text>
                          )}
                          {/* Day label below */}
                          <text x={point.x} y={chartHeight + 14} textAnchor="middle" fontSize="9"
                            fontWeight={point.isToday ? "700" : "500"}
                            fill={point.isToday ? "oklch(0.769 0.188 70)" : "currentColor"}
                            fillOpacity={point.isToday ? 1 : 0.5}
                          >{point.day}</text>
                        </g>
                      ))}
                    </svg>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ── Upcoming Sessions ── */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-sky-500" />
                    <CardTitle className="text-base">Upcoming Sessions</CardTitle>
                  </div>
                  <Link href="/sessions">
                    <Button variant="ghost" size="sm" className="text-xs gap-1 h-7">
                      View all <ChevronRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {upcoming.length === 0 ? (
                  <EmptyState
                    icon={<Calendar />}
                    title="No upcoming sessions"
                    description="Nothing booked yet. Find someone and get a swap going."
                    action={{ label: "Find a peer", href: "/search" }}
                    secondaryAction={{ label: "View matches", href: "/matches" }}
                  />
                ) : (
                  <div className="space-y-1">
                    {upcoming.slice(0, 3).map((session, idx) => (
                      <div
                        key={session.id}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/60 transition-colors duration-200 group"
                      >
                        {/* Timeline dot */}
                        <div className="flex flex-col items-center gap-1 shrink-0">
                          <div className="h-2.5 w-2.5 rounded-full bg-sky-500 ring-4 ring-sky-100 dark:ring-sky-500/20" />
                          {idx < Math.min(upcoming.length, 3) - 1 && (
                            <div className="w-px h-6 bg-border" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold group-hover:text-primary transition-colors">{session.skill}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(session.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })} · {session.time}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-[10px] capitalize shrink-0">
                          {session.mode}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ── Top Matches ── */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-emerald-500" />
                    <CardTitle className="text-base">Top Matches</CardTitle>
                  </div>
                  <Link href="/matches">
                    <Button variant="ghost" size="sm" className="text-xs gap-1 h-7">
                      View all <ChevronRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {topMatches.length === 0 ? (
                  <EmptyState
                    icon={<Search />}
                    title="No matches yet"
                    description="Add your skills and we'll find your people."
                    action={{ label: "Complete your profile", href: "/profile" }}
                  />
                ) : (
                  <div className="space-y-1">
                    {topMatches.map((peer, idx) => {
                      const initials = peer.name.split(" ").filter(Boolean).map((n) => n[0]).join("").toUpperCase() || "?";
                      const matchScore = getMatchScore(user, peer);
                      return (
                        <Link
                          key={peer.id}
                          href={`/profile/${peer.id}`}
                          className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/60 transition-all duration-200 group"
                        >
                          <div className="relative">
                            <Avatar className="h-10 w-10 avatar-glow rounded-full">
                              {peer.avatar_url ? (
                                <img src={peer.avatar_url} alt={peer.name} className="h-full w-full object-cover rounded-full" />
                              ) : (
                                <AvatarFallback className="bg-gold-100 text-navy-800 text-xs font-semibold">
                                  {initials}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            {/* Rank badge */}
                            <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-background">
                              {idx + 1}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{peer.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{peer.faculty}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {peer.rating > 0 && (
                              <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
                                <Star className="h-3 w-3 text-gold-500 fill-gold-500" />
                                {peer.rating.toFixed(1)}
                              </div>
                            )}
                            <div className="h-7 px-2 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold flex items-center gap-0.5">
                              {matchScore}pt
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-6">

            {/* Completion Ring + Stats */}
            <Card className="overflow-hidden">
              <div className="relative bg-gradient-to-br from-navy-900 to-navy-800 p-5">
                <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "20px 20px" }} aria-hidden />
                <div className="relative flex items-center gap-4">
                  {/* SVG Ring */}
                  <div className="relative shrink-0">
                    <svg width="72" height="72" viewBox="0 0 72 72" className="-rotate-90">
                      <circle cx="36" cy="36" r="30" fill="none" stroke="oklch(0.25 0.04 250)" strokeWidth="5" />
                      <circle
                        cx="36" cy="36" r="30" fill="none"
                        stroke="oklch(0.769 0.188 70)"
                        strokeWidth="5"
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 30}
                        strokeDashoffset={2 * Math.PI * 30 * (1 - completionRate / 100)}
                        className="ring-progress"
                        style={{
                          "--ring-circumference": `${2 * Math.PI * 30}`,
                          "--ring-offset": `${2 * Math.PI * 30 * (1 - completionRate / 100)}`,
                        } as React.CSSProperties}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-bold text-white">{completionRate}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Completion Rate</p>
                    <p className="text-xs text-navy-300 mt-0.5">{completed.length} of {totalSessions} sessions done</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] text-navy-400 flex items-center gap-1">
                        <Flame className="h-3 w-3 text-orange-400" /> {streak}d streak
                      </span>
                      <span className="text-[10px] text-navy-400 flex items-center gap-1">
                        <Zap className="h-3 w-3 text-gold-400" /> {user.xp || 0} XP
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Unread Messages */}
            {unreadCount > 0 && (
              <Link href="/messages" className="block">
                <Card className="card-glow border-sky-200 dark:border-sky-500/30 bg-gradient-to-r from-sky-50 to-background dark:from-sky-500/5 dark:to-background">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-sky-500 flex items-center justify-center shrink-0 shadow-[0_4px_12px_oklch(0.68_0.104_232/0.3)]">
                        <MessageSquare className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold">{unreadCount} unread message{unreadCount > 1 ? "s" : ""}</p>
                        <p className="text-xs text-muted-foreground">Tap to catch up</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )}

            {/* Achievements */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-gold-500" />
                    <CardTitle className="text-base">Achievements</CardTitle>
                  </div>
                  <span className="text-[11px] font-bold text-gold-600 dark:text-gold-400 bg-gold-50 dark:bg-gold-500/10 px-2 py-0.5 rounded-full">{achievements.length} earned</span>
                </div>
              </CardHeader>
              <CardContent>
                {achievements.length === 0 ? (
                  <EmptyState
                    icon={<Award />}
                    title="No badges yet"
                    description="Complete a session to unlock your first badge."
                    action={{ label: "Find a peer", href: "/search" }}
                    className="py-8"
                  />
                ) : (
                  <div className="space-y-2">
                    {achievements.slice(0, 6).map((b) => (
                      <div
                        key={b.id}
                        title={b.description}
                        className={`relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-medium achievement-shimmer ${
                          RARITY_STYLES[b.rarity].bg
                        } ${
                          RARITY_STYLES[b.rarity].border
                        }`}
                      >
                        <span className="text-lg">{b.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate">{b.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{b.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions — Icon Grid */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { icon: Search, label: "Find Peers", href: "/search", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
                    { icon: MessageSquare, label: "Messages", href: "/messages", color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-50 dark:bg-sky-500/10", badge: unreadCount || undefined },
                    { icon: Users, label: "Matches", href: "/matches", color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-500/10" },
                    { icon: Award, label: "Profile", href: "/profile", color: "text-gold-600 dark:text-gold-400", bg: "bg-gold-50 dark:bg-gold-500/10", badge: profileScore < 100 ? `${profileScore}%` : undefined },
                  ].map(({ icon: Icon, label, href, color, bg, badge }) => (
                    <Link key={label} href={href}>
                      <div className="flex flex-col items-center gap-2 p-3 rounded-xl border border-transparent hover:border-border hover:bg-muted/50 transition-all duration-200 group cursor-pointer">
                        <div className={`h-10 w-10 rounded-xl ${bg} flex items-center justify-center transition-transform duration-200 group-hover:scale-110 relative`}>
                          <Icon className={`h-5 w-5 ${color}`} />
                          {badge && (
                            <span className="absolute -top-1 -right-1 text-[9px] font-bold bg-red-500 text-white rounded-full h-4 min-w-[16px] flex items-center justify-center px-1">
                              {badge}
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">{label}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
