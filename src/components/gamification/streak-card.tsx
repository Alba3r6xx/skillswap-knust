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

  // Show up to 7 flame dots for visual streak indicator
  const dots = Math.min(streak, 7);

  return (
    <div className={cn("rounded-xl bg-card p-4 shadow-[0_1px_4px_0_oklch(0_0_0/0.08)]", className)}>
      <div className="flex items-center gap-3">
        <div className={cn(
          "h-12 w-12 rounded-full flex items-center justify-center shrink-0",
          streak === 0 ? "bg-gray-100 dark:bg-muted" :
          streak < 3 ? "bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-500/20 dark:to-orange-600/20" :
          streak < 6 ? "bg-gradient-to-br from-orange-200 to-red-200 dark:from-orange-500/25 dark:to-red-500/25" :
          "bg-gradient-to-br from-red-200 to-red-300 dark:from-red-500/30 dark:to-red-600/30"
        )}>
          <Flame className={cn("h-6 w-6", flameColor)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-bold text-sm">{streak === 0 ? "No streak" : `${streak}w streak`}</p>
            {streak >= 3 && <span className="text-[10px] font-semibold text-orange-500 bg-orange-50 dark:bg-orange-500/10 px-1.5 py-0.5 rounded-full">On fire</span>}
          </div>
          {streak === 0 ? (
            <p className="text-xs text-muted-foreground mt-0.5">Finish a swap to start</p>
          ) : (
            <div className="flex items-center gap-1 mt-1.5">
              {Array.from({ length: dots }).map((_, i) => (
                <div key={i} className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i < dots ? "bg-gradient-to-r from-orange-400 to-red-400" : "bg-border",
                  i === dots - 1 ? "w-3" : "w-1.5"
                )} />
              ))}
              {streak > 7 && <span className="text-[9px] text-muted-foreground ml-0.5">+{streak - 7}</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
