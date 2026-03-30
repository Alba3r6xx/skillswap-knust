"use client";

import { cn } from "@/lib/utils";
import { Flame } from "lucide-react";

interface StreakCardProps {
  streak: number;
  compact?: boolean;
  className?: string;
}

export function StreakCard({ streak, compact = false, className }: StreakCardProps) {
  const label =
    streak === 0 ? "No streak yet" :
    streak === 1 ? "1 week streak" :
    `${streak} week streak`;

  const flameColor =
    streak === 0 ? "text-gray-300" :
    streak < 3 ? "text-orange-400" :
    streak < 6 ? "text-orange-500" :
    "text-red-500";

  if (compact) {
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        <Flame className={cn("h-4 w-4", flameColor)} />
        <span className="text-sm font-semibold">{streak}</span>
        <span className="text-xs text-muted-foreground">wk streak</span>
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl border bg-card p-4 flex items-center gap-4", className)}>
      <div className={cn(
        "h-12 w-12 rounded-xl flex items-center justify-center text-2xl",
        streak === 0 ? "bg-gray-100 dark:bg-muted" :
        streak < 3 ? "bg-orange-100 dark:bg-orange-500/20" :
        "bg-red-100 dark:bg-red-500/20"
      )}>
        <Flame className={cn("h-6 w-6", flameColor)} />
      </div>
      <div>
        <p className="font-bold text-lg leading-none">{streak}</p>
        <p className="text-xs text-muted-foreground mt-0.5">Week swap streak</p>
        {streak >= 3 && (
          <p className="text-xs font-medium text-orange-500 mt-0.5">Going strong</p>
        )}
        {streak === 0 && (
          <p className="text-xs text-muted-foreground">Complete a session this week</p>
        )}
      </div>
    </div>
  );
}
