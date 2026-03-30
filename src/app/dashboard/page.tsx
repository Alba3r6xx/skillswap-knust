"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getSessionsByUser, getAllProfiles, getMatchScore, computeBadges, getConversations } from "@/lib/data";
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
  TrendingUp,
  ArrowRight,
  Bell,
  Award,
  Search,
  MessageSquare,
} from "lucide-react";
import { XPBar } from "@/components/gamification/xp-bar";
import { StreakCard } from "@/components/gamification/streak-card";
import { Leaderboard } from "@/components/gamification/leaderboard";
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
  const [loading, setLoading] = useState(true);

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
  }, [user, isLoading, router]);

  const streak = user && sessions.length >= 0 ? computeSwapStreak(sessions, user.id) : 0;
  const { score: profileScore, items: profileItems } = user ? getProfileCompletion(user) : { score: 0, items: [] };
  const achievements = user ? computeAchievements(sessions, user, user.id) : [];

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
  const incompleteItems = profileItems.filter((i) => !i.done);

  return (
    <div className="min-h-dvh bg-background">
      <ActivityStream currentUserId={user.id} />

      {/* ── Navy page banner ── */}
      <div className="bg-navy-900 pt-4 md:pt-8 pb-14 px-4">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 content-fade-in">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">
                Hey, {user.name.split(" ")[0]}
              </h1>
              <p className="text-sm text-navy-300 mt-1">Your learning at a glance</p>
            </div>
            {pending.length > 0 && (
              <Link href="/sessions">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary text-white px-4 py-2.5 text-sm font-semibold
                  shadow-[0_2px_8px_oklch(0.769_0.188_70/0.3)] hover:brightness-105 transition-all active:scale-[0.97]">
                  <Bell className="h-4 w-4" />
                  {pending.length} request{pending.length > 1 ? "s" : ""} waiting — review now
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── Content overlapping banner ── */}
      <div className="mx-auto px-4 -mt-8 pb-8 max-w-5xl relative z-10">

        {/* Profile completion nudge */}
        {profileScore < 100 && (
          <div className="mb-6 rounded-xl border border-gold-200 bg-gold-50 dark:bg-gold-500/10 dark:border-gold-500/30 p-4 content-fade-in">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-gold-600 dark:text-gold-400" />
                  <p className="text-sm font-semibold text-navy-800 dark:text-gold-300">
                    You're {profileScore}% there — a fuller profile gets you better matches
                  </p>
                </div>
                <div className="h-1.5 rounded-full bg-gold-200 dark:bg-gold-500/30 mb-2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
                    style={{ width: `${profileScore}%` }}
                  />
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {incompleteItems.slice(0, 3).map((item) => (
                    <span key={item.label} className="text-xs text-gold-700 dark:text-gold-400 flex items-center gap-1">
                      <span className="h-1 w-1 rounded-full bg-gold-400" />
                      {item.label} <span className="text-gold-600 font-semibold">+{item.xp} XP</span>
                    </span>
                  ))}
                </div>
              </div>
              <Link href="/profile">
                <Button size="sm" className="shrink-0">
                  Finish up
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Stats Grid — Apple Health widget style */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-7 w-7 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0">
                  <GraduationCap className="h-4 w-4 text-white" />
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Teaching</span>
              </div>
              <p className="text-3xl font-bold font-display tracking-tight leading-none">
                <AnimatedCounter value={user.skills_to_teach.length} />
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-7 w-7 rounded-lg bg-sky-500 flex items-center justify-center shrink-0">
                  <BookOpen className="h-4 w-4 text-white" />
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Learning</span>
              </div>
              <p className="text-3xl font-bold font-display tracking-tight leading-none">
                <AnimatedCounter value={user.skills_to_learn.length} />
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
                  <Calendar className="h-4 w-4 text-white" />
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Swaps done</span>
              </div>
              <p className="text-3xl font-bold font-display tracking-tight leading-none">
                <AnimatedCounter value={completed.length} />
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-7 w-7 rounded-lg bg-navy-700 dark:bg-navy-600 flex items-center justify-center shrink-0">
                  <Star className="h-4 w-4 text-white" />
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Rating</span>
              </div>
              <p className="text-3xl font-bold font-display tracking-tight leading-none">
                {user.rating > 0 ? (
                  <AnimatedCounter value={user.rating} decimals={1} />
                ) : "—"}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">

            {/* XP + Streak row */}
            <div className="grid grid-cols-2 gap-4">
              <XPBar xp={user.xp || 0} />
              <StreakCard streak={streak} />
            </div>

            {/* Upcoming Sessions */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Upcoming Sessions</CardTitle>
                  <Link href="/sessions">
                    <Button variant="ghost" size="sm" className="text-xs gap-1">
                      View all <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {upcoming.length === 0 ? (
                  <EmptyState
                    icon={<Calendar />}
                    title="No upcoming sessions"
                    description="Nothing locked in yet. Find someone and get a swap going."
                    action={{ label: "Find a peer", href: "/search" }}
                    secondaryAction={{ label: "View matches", href: "/matches" }}
                  />
                ) : (
                  <div className="space-y-3">
                    {upcoming.slice(0, 3).map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div>
                          <p className="text-sm font-medium">{session.skill}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(session.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })} at {session.time}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-xs capitalize">
                          {session.mode}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Matches */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Top Matches</CardTitle>
                  <Link href="/matches">
                    <Button variant="ghost" size="sm" className="text-xs gap-1">
                      View all <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {topMatches.length === 0 ? (
                  <EmptyState
                    icon={<Search />}
                    title="No matches yet"
                    description="Add what you teach and want to learn — we'll find your people."
                    action={{ label: "Complete your profile", href: "/profile" }}
                  />
                ) : (
                  <div className="space-y-2">
                    {topMatches.map((peer) => {
                      const initials = peer.name.split(" ").map((n) => n[0]).join("").toUpperCase();
                      return (
                        <Link
                          key={peer.id}
                          href={`/profile/${peer.id}`}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-navy-50 dark:hover:bg-navy-900/20 transition-colors"
                        >
                          <Avatar className="h-9 w-9">
                            {peer.avatar_url ? (
                              <img src={peer.avatar_url} alt={peer.name} className="h-full w-full object-cover rounded-full" />
                            ) : (
                              <AvatarFallback className="bg-gold-100 text-navy-800 text-xs font-semibold">
                                {initials}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{peer.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{peer.faculty}</p>
                          </div>
                          {peer.rating > 0 && (
                            <div className="flex items-center gap-1 text-xs">
                              <Star className="h-3 w-3 text-gold-500 fill-gold-500" />
                              {peer.rating.toFixed(1)}
                            </div>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Leaderboard */}
            <Leaderboard currentUserId={user.id} limit={5} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">

            {/* Unread Messages */}
            {unreadCount > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-sky-500 flex items-center justify-center shrink-0">
                      <MessageSquare className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{unreadCount} unread</p>
                      <p className="text-xs text-muted-foreground">Don&apos;t leave them on read</p>
                    </div>
                    <Link href="/messages">
                      <Button size="sm" variant="navy">Reply</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Achievements */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Achievements</CardTitle>
                  <span className="text-xs text-muted-foreground">{achievements.length} earned</span>
                </div>
              </CardHeader>
              <CardContent>
                {achievements.length === 0 ? (
                  <EmptyState
                    icon={<Award />}
                    title="No badges yet"
                    description="Finish a session and your first badge drops right here."
                    action={{ label: "Find a peer", href: "/search" }}
                    className="py-8"
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {achievements.slice(0, 8).map((b) => (
                      <div
                        key={b.id}
                        title={b.description}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium ${
                          RARITY_STYLES[b.rarity].bg
                        } ${
                          RARITY_STYLES[b.rarity].border
                        }`}
                      >
                        <span>{b.icon}</span> {b.name}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Shortcuts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/search" className="block">
                  <Button variant="outline" className="w-full justify-start gap-2 text-sm rounded-lg">
                    Find Peers
                  </Button>
                </Link>
                <Link href="/messages" className="block">
                  <Button variant="outline" className="w-full justify-start gap-2 text-sm rounded-lg">
                    Messages
                    {unreadCount > 0 && (
                      <span className="ml-auto text-xs bg-sky-500 text-white rounded-full px-1.5 py-0.5 font-semibold">{unreadCount}</span>
                    )}
                  </Button>
                </Link>
                <Link href="/profile" className="block">
                  <Button variant="outline" className="w-full justify-start gap-2 text-sm rounded-lg">
                    Edit Profile
                    {profileScore < 100 && (
                      <span className="ml-auto text-xs text-gold-600 font-semibold">{profileScore}%</span>
                    )}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
