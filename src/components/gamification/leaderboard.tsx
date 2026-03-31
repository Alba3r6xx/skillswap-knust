"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Profile } from "@/lib/types";
import { getXPTier } from "@/lib/gamification";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const RANK_STYLES = [
  { rankColor: "bg-gold-500 text-white",   bg: "bg-gold-50 dark:bg-gold-500/10 border-gold-200 dark:border-gold-500/30" },
  { rankColor: "bg-slate-400 text-white",  bg: "bg-slate-50 dark:bg-slate-500/10 border-slate-200 dark:border-slate-500/30" },
  { rankColor: "bg-amber-600 text-white",  bg: "bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/30" },
];

interface LeaderboardProps {
  currentUserId?: string;
  limit?: number;
  className?: string;
}

export function Leaderboard({ currentUserId, limit = 5, className }: LeaderboardProps) {
  const [leaders, setLeaders] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, name, faculty, avatar_url, xp, rating, total_ratings, skills_to_teach, skills_to_learn, availability, preferred_mode, contact, bio, last_seen, created_at")
        .order("xp", { ascending: false })
        .limit(limit);
      if (data) setLeaders(data as Profile[]);
      setLoading(false);
    };
    fetch();
  }, [limit]);

  return (
    <div className={cn("rounded-xl bg-card shadow-[0_1px_4px_0_oklch(0_0_0/0.08)]", className)}>
      <div className="flex items-center gap-2 px-4 py-3 border-b">
        <Trophy className="h-4 w-4 text-gold-500" />
        <h3 className="font-semibold text-sm">Top Traders This Week</h3>
      </div>
      <div className="divide-y">
        {loading
          ? Array.from({ length: limit }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="h-7 w-7 rounded-full" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))
          : leaders.map((user, i) => {
              const tier = getXPTier(user.xp || 0);
              const initials = user.name.split(" ").filter(Boolean).map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";
              const isCurrentUser = user.id === currentUserId;

              return (
                <Link
                  key={user.id}
                  href={isCurrentUser ? "/profile" : `/profile/${user.id}`}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors",
                    isCurrentUser && "bg-gold-50/50 dark:bg-gold-500/5"
                  )}
                >
                  {/* Rank */}
                  <div className={cn(
                    "h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                    i < 3 ? RANK_STYLES[i].rankColor : "bg-muted text-muted-foreground"
                  )}>
                    {i + 1}
                  </div>

                  {/* Avatar */}
                  <Avatar className="h-7 w-7 shrink-0">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.name} className="h-full w-full object-cover rounded-full" />
                    ) : (
                      <AvatarFallback className="text-xs bg-gold-100 text-navy-800">{initials}</AvatarFallback>
                    )}
                  </Avatar>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-medium truncate", isCurrentUser && "text-gold-600")}>
                      {isCurrentUser ? "You" : user.name.split(" ")[0]}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{user.faculty || "KNUST"}</p>
                  </div>

                  {/* XP + tier */}
                  <div className="text-right shrink-0">
                    <p className="text-xs font-semibold text-gold-600">{(user.xp || 0).toLocaleString()} XP</p>
                    <p className={cn("text-xs", tier.color)}>{tier.name}</p>
                  </div>
                </Link>
              );
            })}
      </div>
    </div>
  );
}
