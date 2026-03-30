"use client";

import { getXPTier, getXPProgress, getNextXPMilestone } from "@/lib/gamification";
import { cn } from "@/lib/utils";

interface XPBarProps {
  xp: number;
  compact?: boolean;
  className?: string;
}

export function XPBar({ xp, compact = false, className }: XPBarProps) {
  const tier = getXPTier(xp);
  const progress = getXPProgress(xp);
  const next = getNextXPMilestone(xp);

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", tier.bg)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <span className={cn("text-xs font-semibold", tier.color)}>{tier.name}</span>
            <span className="text-xs text-muted-foreground">{xp} XP</span>
          </div>
          <div className="h-1 rounded-full bg-border overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl border bg-card p-4", className)}>
      <div className="flex items-center gap-3 mb-3">
        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", tier.bg)}>
          <span className="text-xl leading-none">{tier.icon}</span>
        </div>
        <div>
          <p className={cn("font-semibold text-sm", tier.color)}>{tier.name}</p>
          <p className="text-xs text-muted-foreground">{xp.toLocaleString()} XP total</p>
        </div>
        {next && (
          <div className="ml-auto text-right">
            <p className="text-xs text-muted-foreground">{next - xp} XP to next</p>
            <p className="text-xs font-medium text-gold-600">{getXPTier(next).name}</p>
          </div>
        )}
      </div>
      <div className="h-2 rounded-full bg-border overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-gold-400 to-gold-500 transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground mt-1.5">{progress}% to {next ? getXPTier(next).name : "max level"}</p>
    </div>
  );
}
