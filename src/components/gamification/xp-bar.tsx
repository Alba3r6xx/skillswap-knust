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

  const circumference = 2 * Math.PI * 18;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={cn("rounded-xl bg-card p-4 shadow-[0_1px_4px_0_oklch(0_0_0/0.08)]", className)}>
      <div className="flex items-center gap-3">
        <div className="relative h-12 w-12 shrink-0">
          <svg className="h-12 w-12 -rotate-90" viewBox="0 0 44 44">
            <circle cx="22" cy="22" r="18" fill="none" stroke="currentColor" strokeWidth="3" className="text-border" />
            <circle cx="22" cy="22" r="18" fill="none" strokeWidth="3" strokeLinecap="round"
              className="text-gold-500 transition-all duration-700"
              style={{ strokeDasharray: circumference, strokeDashoffset }} />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-base leading-none">{tier.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={cn("font-bold text-sm", tier.color)}>{tier.name}</p>
            <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{xp} XP</span>
          </div>
          {next ? (
            <p className="text-xs text-muted-foreground mt-0.5">{next - xp} XP to {getXPTier(next).name}</p>
          ) : (
            <p className="text-xs text-muted-foreground mt-0.5">Max level reached</p>
          )}
        </div>
      </div>
    </div>
  );
}
