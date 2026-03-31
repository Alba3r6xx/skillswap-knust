"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { searchProfiles, getTimeSinceLastSeen } from "@/lib/data";
import { Profile, FACULTIES, SKILL_CATEGORIES } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Star,
  GraduationCap,
  BookOpen,
  Monitor,
  MessageSquare,
  X,
  Eye,
  TrendingUp,
} from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { OnlineCount } from "@/components/social-proof/online-count";
import { getViewerCount, getSkillRequestCount } from "@/lib/gamification";

export default function SearchPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [faculty, setFaculty] = useState("");
  const [mode, setMode] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [isLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoading(true);
      const profiles = await searchProfiles(query, { faculty, mode, category, level });
      setResults(profiles.filter((p) => p.id !== user.id));
      setLoading(false);
    };
    const timer = setTimeout(fetch, 300);
    return () => clearTimeout(timer);
  }, [query, faculty, mode, category, level, user]);

  if (isLoading || !user) {
    return (
      <div className="min-h-dvh bg-background">
        <div className="mx-auto max-w-4xl space-y-4 px-4 pt-4 md:pt-8 pb-8">
          <Skeleton className="h-10 w-full" />
          <div className="grid md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-48" />)}
          </div>
        </div>
      </div>
    );
  }

  const hasFilters = faculty || mode || category || level;

  return (
    <div className="min-h-dvh bg-background">
      {/* ── Navy page banner ── */}
      <div className="bg-navy-900 pt-2 md:pt-8 pb-16 px-4">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center justify-between mb-4 animate-slide-up">
            <h1 className="text-3xl font-bold tracking-tight text-white">Find Peers</h1>
            <OnlineCount variant="badge" />
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy-400" />
            <Input
              placeholder="Search by name or skill..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 bg-navy-800 border-navy-700 text-white placeholder:text-navy-400 focus-visible:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* ── Content overlapping banner ── */}
      <div className="mx-auto px-4 -mt-10 pb-8 max-w-4xl relative z-10">
        <Card className="p-4 mb-6 animate-scale-fade">
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
            <Select value={faculty} onValueChange={setFaculty}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Faculty" />
              </SelectTrigger>
              <SelectContent>
                {FACULTIES.map((f) => (
                  <SelectItem key={f} value={f}>{f}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger className="w-full sm:w-[130px]">
                <SelectValue placeholder="Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {SKILL_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={() => { setFaculty(""); setMode(""); setCategory(""); setLevel(""); }}>
                <X className="h-4 w-4 mr-1" /> Clear
              </Button>
            )}
          </div>
        </Card>

        {/* Results */}
        {loading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-48" />)}
          </div>
        ) : results.length === 0 ? (
          <EmptyState
            icon={<Search />}
            title="No peers found"
            description={hasFilters ? "Try relaxing your filters — there are great matches out there." : "Be the first! Add skills to your profile so others can find you."}
            action={hasFilters ? { label: "Clear filters", onClick: () => { setFaculty(""); setMode(""); setCategory(""); setLevel(""); } } : { label: "Update my profile", href: "/profile" }}
          />
        ) : (
          <div className="grid md:grid-cols-2 gap-4 stagger-children">
            {results.map((peer) => {
              const initials = peer.name.split(" ").filter(Boolean).map((n) => n[0]).join("").toUpperCase() || "?";
              const lastSeen = getTimeSinceLastSeen(peer.last_seen);
              const isOnline = lastSeen === "Online now";

              const viewers = getViewerCount(peer.id);
              const topSkill = peer.skills_to_teach[0];
              const skillDemand = topSkill ? getSkillRequestCount(topSkill.name) : 0;
              const isHighDemand = skillDemand >= 8;

              return (
                <Card key={peer.id} className="relative overflow-hidden card-glow">
                  {isHighDemand && (
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-gold-400 via-gold-500 to-gold-400" />
                  )}
                  <CardContent className="p-4">
                    {/* Urgency signals row */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Eye className="h-3 w-3" />
                        <span>{viewers} viewing</span>
                      </div>
                      {isHighDemand && topSkill && (
                        <div className="flex items-center gap-1 text-xs text-gold-600 dark:text-gold-400 font-semibold">
                          <TrendingUp className="h-3 w-3" />
                          {topSkill.name} requested {skillDemand}× this week
                        </div>
                      )}
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <Avatar className="h-12 w-12 avatar-glow rounded-full">
                          {peer.avatar_url ? (
                            <img src={peer.avatar_url} alt={peer.name} className="h-full w-full object-cover rounded-full" />
                          ) : (
                            <AvatarFallback className="bg-gold-100 text-navy-800 font-semibold">
                              {initials}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        {isOnline && (
                          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <Link href={`/profile/${peer.id}`} className="font-semibold text-sm hover:underline truncate">
                            {peer.name}
                          </Link>
                          {peer.rating > 0 && (
                            <div className="flex items-center gap-1 text-xs shrink-0">
                              <Star className="h-3 w-3 text-gold-500 fill-gold-500" />
                              {peer.rating.toFixed(1)}
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{peer.faculty}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Monitor className="h-3 w-3" /> {peer.preferred_mode}
                          <span className={`ml-auto ${isOnline ? "text-green-600" : ""}`}>{lastSeen}</span>
                        </div>
                      </div>
                    </div>

                    {/* Skills */}
                    <div className="mt-3 space-y-2">
                      {peer.skills_to_teach.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                            <GraduationCap className="h-3 w-3 text-emerald-600" /> Can teach
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {peer.skills_to_teach.slice(0, 3).map((s) => (
                              <Badge key={s.name} className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 badge-hover">
                                {s.name}
                              </Badge>
                            ))}
                            {peer.skills_to_teach.length > 3 && (
                              <Badge variant="secondary" className="text-[10px]">+{peer.skills_to_teach.length - 3}</Badge>
                            )}
                          </div>
                        </div>
                      )}
                      {peer.skills_to_learn.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                            <BookOpen className="h-3 w-3 text-sky-600" /> Wants to learn
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {peer.skills_to_learn.slice(0, 3).map((s) => (
                              <Badge key={s.name} className="text-[10px] bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400 badge-hover">
                                {s.name}
                              </Badge>
                            ))}
                            {peer.skills_to_learn.length > 3 && (
                              <Badge variant="secondary" className="text-[10px]">+{peer.skills_to_learn.length - 3}</Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-3">
                      <Link href={`/messages?peer=${peer.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full text-xs gap-1">
                          <MessageSquare className="h-3 w-3" /> Message
                        </Button>
                      </Link>
                      <Link href={`/profile/${peer.id}`} className="flex-1">
                        <Button size="sm" className="w-full text-xs gap-1">
                          <Star className="h-3 w-3" /> View & Book
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
