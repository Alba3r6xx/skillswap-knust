"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getAllProfiles, getMatchScore, getTimeSinceLastSeen } from "@/lib/data";
import { Profile } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Star,
  GraduationCap,
  BookOpen,
  MessageSquare,
  Calendar,
} from "lucide-react";
import { EmptyState } from "@/components/empty-state";

interface ScoredMatch {
  profile: Profile;
  score: number;
  type: "mutual" | "can_teach" | "can_learn";
}

export default function MatchesPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [matches, setMatches] = useState<ScoredMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [isLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    const fetchMatches = async () => {
      const profiles = await getAllProfiles();
      const others = profiles.filter((p) => p.id !== user.id);

      const scored: ScoredMatch[] = others
        .map((p) => {
          const score = getMatchScore(user, p);
          const canTeachMe = user.skills_to_learn.some((l) =>
            p.skills_to_teach.some((t) => t.name.toLowerCase() === l.name.toLowerCase())
          );
          const canLearnFromMe = user.skills_to_teach.some((t) =>
            p.skills_to_learn.some((l) => l.name.toLowerCase() === t.name.toLowerCase())
          );
          const type: "mutual" | "can_teach" | "can_learn" =
            canTeachMe && canLearnFromMe ? "mutual" : canTeachMe ? "can_teach" : "can_learn";
          return { profile: p, score, type };
        })
        .filter((m) => m.score > 0)
        .sort((a, b) => b.score - a.score);

      setMatches(scored);
      setLoading(false);
    };
    fetchMatches();
  }, [user]);

  if (isLoading || !user) {
    return (
      <div className="min-h-dvh bg-background p-4 md:p-6">
        <div className="mx-auto max-w-4xl space-y-4">
          <Skeleton className="h-10 w-48" />
          <div className="grid md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-40" />)}
          </div>
        </div>
      </div>
    );
  }

  const mutual = matches.filter((m) => m.type === "mutual");
  const canTeach = matches.filter((m) => m.type === "can_teach");
  const canLearn = matches.filter((m) => m.type === "can_learn");

  const renderMatchCard = (match: ScoredMatch) => {
    const { profile: peer } = match;
    const initials = peer.name.split(" ").map((n) => n[0]).join("").toUpperCase();
    const lastSeen = getTimeSinceLastSeen(peer.last_seen);
    const isOnline = lastSeen === "Online now";

    const isMutual = match.type === "mutual";

    return (
      <Card key={peer.id} className={isMutual ? "border-gold-300 dark:border-gold-500/50 ring-1 ring-gold-200 dark:ring-gold-500/30" : ""}>
        {isMutual && (
          <div className="px-4 pt-3 pb-0 flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5 text-gold-500 fill-gold-500" />
            <span className="text-xs font-semibold text-gold-700 dark:text-gold-400">Perfect Match — you can both teach each other!</span>
          </div>
        )}
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="relative">
              <Avatar className="h-11 w-11">
                {peer.avatar_url ? (
                  <img src={peer.avatar_url} alt={peer.name} className="h-full w-full object-cover rounded-full" />
                ) : (
                  <AvatarFallback className="bg-gold-100 text-navy-800 font-semibold text-sm">
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
                <Link href={`/profile/${peer.id}`} className="font-semibold text-sm hover:underline">
                  {peer.name}
                </Link>
                <Badge variant="secondary" className="text-[10px]">
                  {match.score}pt match
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{peer.faculty}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                {peer.rating > 0 && (
                  <span className="flex items-center gap-0.5">
                    <Star className="h-3 w-3 text-gold-500 fill-gold-500" />
                    {peer.rating.toFixed(1)}
                  </span>
                )}
                <span className={isOnline ? "text-green-600" : ""}>{lastSeen}</span>
              </div>
            </div>
          </div>

          {/* Matching Skills */}
          <div className="mt-3 space-y-2">
            {peer.skills_to_teach.filter((t) =>
              user.skills_to_learn.some((l) => l.name.toLowerCase() === t.name.toLowerCase())
            ).length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                  <GraduationCap className="h-3 w-3 text-emerald-600" /> Can teach you
                </p>
                <div className="flex flex-wrap gap-1">
                  {peer.skills_to_teach
                    .filter((t) => user.skills_to_learn.some((l) => l.name.toLowerCase() === t.name.toLowerCase()))
                    .map((s) => (
                      <Badge key={s.name} className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                        {s.name}
                      </Badge>
                    ))}
                </div>
              </div>
            )}
            {peer.skills_to_learn.filter((l) =>
              user.skills_to_teach.some((t) => t.name.toLowerCase() === l.name.toLowerCase())
            ).length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                  <BookOpen className="h-3 w-3 text-sky-600" /> Wants to learn from you
                </p>
                <div className="flex flex-wrap gap-1">
                  {peer.skills_to_learn
                    .filter((l) => user.skills_to_teach.some((t) => t.name.toLowerCase() === l.name.toLowerCase()))
                    .map((s) => (
                      <Badge key={s.name} className="text-[10px] bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400">
                        {s.name}
                      </Badge>
                    ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-3">
            <Link href={`/messages?peer=${peer.id}`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full text-xs gap-1">
                <MessageSquare className="h-3 w-3" /> Message
              </Button>
            </Link>
            <Link href={`/profile/${peer.id}`} className="flex-1">
              <Button size="sm" className="w-full text-xs gap-1">
                <Calendar className="h-3 w-3" /> View Profile
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto px-4 pt-5 pb-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Your Matches</h1>
          {mutual.length > 0 && (
            <span className="text-xs bg-gold-100 text-navy-800 dark:bg-gold-500/20 dark:text-gold-300 px-3 py-1.5 rounded-full font-semibold">
              {mutual.length} perfect match{mutual.length > 1 ? "es" : ""}
            </span>
          )}
        </div>

        {matches.length === 0 ? (
          <EmptyState
            icon="🤝"
            title="No matches yet"
            description="Add skills you can teach and want to learn — we'll find your perfect skill-swap partners."
            action={{ label: "Add my skills", href: "/profile" }}
            secondaryAction={{ label: "Browse all peers", href: "/search" }}
          />
        ) : (
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All ({matches.length})</TabsTrigger>
              <TabsTrigger value="mutual">🔥 Mutual ({mutual.length})</TabsTrigger>
              <TabsTrigger value="teach">Can Teach You ({canTeach.length})</TabsTrigger>
              <TabsTrigger value="learn">Can Learn ({canLearn.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              <div className="grid md:grid-cols-2 gap-4">{matches.map(renderMatchCard)}</div>
            </TabsContent>
            <TabsContent value="mutual">
              {mutual.length === 0 ? (
                <EmptyState
                  icon="🔥"
                  title="No mutual matches yet"
                  description="Add more skills — mutual matches happen when you and a peer can both teach each other."
                  action={{ label: "Add more skills", href: "/profile" }}
                />
              ) : (
                <div className="grid md:grid-cols-2 gap-4">{mutual.map(renderMatchCard)}</div>
              )}
            </TabsContent>
            <TabsContent value="teach">
              {canTeach.length === 0 ? (
                <EmptyState
                  icon="🎓"
                  title="No teachers found yet"
                  description="Add more skills you want to learn and we'll find peers who can teach you."
                  action={{ label: "Update learning goals", href: "/profile" }}
                />
              ) : (
                <div className="grid md:grid-cols-2 gap-4">{canTeach.map(renderMatchCard)}</div>
              )}
            </TabsContent>
            <TabsContent value="learn">
              {canLearn.length === 0 ? (
                <EmptyState
                  icon="📘"
                  title="No learners found yet"
                  description="Add more skills you can teach — other students are actively searching for them."
                  action={{ label: "Add teaching skills", href: "/profile" }}
                />
              ) : (
                <div className="grid md:grid-cols-2 gap-4">{canLearn.map(renderMatchCard)}</div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
