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
      <div className="min-h-screen bg-gray-50 dark:bg-background p-6">
        <div className="container mx-auto max-w-4xl space-y-4">
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

    return (
      <Card key={peer.id} className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="relative">
              <Avatar className="h-11 w-11">
                {peer.avatar_url ? (
                  <img src={peer.avatar_url} alt={peer.name} className="h-full w-full object-cover rounded-full" />
                ) : (
                  <AvatarFallback className="bg-amber-100 text-amber-700 font-semibold text-sm">
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
                    <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
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
                  <GraduationCap className="h-3 w-3 text-green-600" /> Can teach you
                </p>
                <div className="flex flex-wrap gap-1">
                  {peer.skills_to_teach
                    .filter((t) => user.skills_to_learn.some((l) => l.name.toLowerCase() === t.name.toLowerCase()))
                    .map((s) => (
                      <Badge key={s.name} className="text-[10px] bg-green-50 text-green-700 dark:bg-green-500/20 dark:text-green-400">
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
                  <BookOpen className="h-3 w-3 text-blue-600" /> Wants to learn from you
                </p>
                <div className="flex flex-wrap gap-1">
                  {peer.skills_to_learn
                    .filter((l) => user.skills_to_teach.some((t) => t.name.toLowerCase() === l.name.toLowerCase()))
                    .map((s) => (
                      <Badge key={s.name} className="text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">
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
              <Button size="sm" className="w-full text-xs gap-1 bg-amber-500 hover:bg-amber-600 text-white">
                <Calendar className="h-3 w-3" /> View Profile
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      <div className="container mx-auto px-4 pt-4 pb-6 max-w-4xl">
        <h1 className="text-2xl font-bold mb-6">Your Matches</h1>

        {matches.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg font-medium mb-2">No matches yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Add skills to your profile to get matched with peers.
            </p>
            <Link href="/profile">
              <Button className="bg-amber-500 hover:bg-amber-600 text-white">Edit Profile</Button>
            </Link>
          </div>
        ) : (
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All ({matches.length})</TabsTrigger>
              <TabsTrigger value="mutual">Mutual ({mutual.length})</TabsTrigger>
              <TabsTrigger value="teach">Can Teach You ({canTeach.length})</TabsTrigger>
              <TabsTrigger value="learn">Can Learn ({canLearn.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              <div className="grid md:grid-cols-2 gap-4">{matches.map(renderMatchCard)}</div>
            </TabsContent>
            <TabsContent value="mutual">
              <div className="grid md:grid-cols-2 gap-4">{mutual.map(renderMatchCard)}</div>
            </TabsContent>
            <TabsContent value="teach">
              <div className="grid md:grid-cols-2 gap-4">{canTeach.map(renderMatchCard)}</div>
            </TabsContent>
            <TabsContent value="learn">
              <div className="grid md:grid-cols-2 gap-4">{canLearn.map(renderMatchCard)}</div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
