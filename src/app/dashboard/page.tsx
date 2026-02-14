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
  Users,
  Star,
  TrendingUp,
  MessageSquare,
  ArrowRight,
} from "lucide-react";

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

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-background p-6">
        <div className="container mx-auto max-w-5xl space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  const upcoming = sessions.filter((s) => s.status === "accepted");
  const completed = sessions.filter((s) => s.status === "completed");
  const pending = sessions.filter((s) => s.status === "pending");
  const badges = computeBadges(sessions, user.id);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <h1 className="text-2xl font-bold mb-6">
          Welcome back, {user.name.split(" ")[0]}! 👋
        </h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{user.skills_to_teach.length}</p>
                  <p className="text-xs text-muted-foreground">Teaching</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{user.skills_to_learn.length}</p>
                  <p className="text-xs text-muted-foreground">Learning</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{completed.length}</p>
                  <p className="text-xs text-muted-foreground">Sessions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center">
                  <Star className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{user.rating > 0 ? user.rating.toFixed(1) : "—"}</p>
                  <p className="text-xs text-muted-foreground">Rating</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
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
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No upcoming sessions.{" "}
                    <Link href="/search" className="text-amber-600 hover:underline">Find a peer</Link>
                  </p>
                ) : (
                  <div className="space-y-3">
                    {upcoming.slice(0, 3).map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-white dark:bg-muted/50"
                      >
                        <div>
                          <p className="text-sm font-medium">{session.skill}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(session.date).toLocaleDateString()} at {session.time}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {session.mode}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pending Requests */}
            {pending.length > 0 && (
              <Card className="border-amber-200 dark:border-amber-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-amber-600" />
                    Pending Requests ({pending.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Link href="/sessions">
                    <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white">
                      Review Requests
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

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
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Add skills to your profile to see matches.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {topMatches.map((peer) => {
                      const initials = peer.name.split(" ").map((n) => n[0]).join("").toUpperCase();
                      return (
                        <Link
                          key={peer.id}
                          href={`/profile/${peer.id}`}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                        >
                          <Avatar className="h-9 w-9">
                            {peer.avatar_url ? (
                              <img src={peer.avatar_url} alt={peer.name} className="h-full w-full object-cover rounded-full" />
                            ) : (
                              <AvatarFallback className="bg-amber-100 text-amber-700 text-xs">
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
                              <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
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
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Completion */}
            {(user.skills_to_teach.length === 0 || user.skills_to_learn.length === 0 || !user.bio) && (
              <Card className="border-amber-200 bg-amber-50 dark:bg-amber-500/10 dark:border-amber-500/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-amber-600" />
                    Complete Your Profile
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    A complete profile helps you find better matches.
                  </p>
                  <div className="space-y-1.5 text-sm">
                    {!user.bio && <p className="text-amber-700 dark:text-amber-400">• Add a bio</p>}
                    {user.skills_to_teach.length === 0 && <p className="text-amber-700 dark:text-amber-400">• Add skills you can teach</p>}
                    {user.skills_to_learn.length === 0 && <p className="text-amber-700 dark:text-amber-400">• Add skills you want to learn</p>}
                  </div>
                  <Link href="/profile">
                    <Button size="sm" className="mt-3 bg-amber-500 hover:bg-amber-600 text-white">
                      Edit Profile
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Unread Messages */}
            {unreadCount > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{unreadCount} unread message{unreadCount > 1 ? "s" : ""}</p>
                    </div>
                    <Link href="/messages">
                      <Button size="sm" variant="outline">View</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Badges */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Badges ({badges.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {badges.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Complete sessions to earn badges!</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {badges.map((b) => (
                      <div key={b.id} className="flex items-center gap-1.5 px-2 py-1 rounded-lg border bg-white dark:bg-muted/50" title={b.description}>
                        <span className="text-base">{b.icon}</span>
                        <span className="text-xs font-medium">{b.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/search" className="block">
                  <Button variant="outline" className="w-full justify-start gap-2 text-sm">
                    <Users className="h-4 w-4" /> Find Peers
                  </Button>
                </Link>
                <Link href="/messages" className="block">
                  <Button variant="outline" className="w-full justify-start gap-2 text-sm">
                    <MessageSquare className="h-4 w-4" /> Messages
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
