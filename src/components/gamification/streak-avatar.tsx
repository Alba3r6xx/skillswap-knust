"use client";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Flame } from "lucide-react";

interface StreakAvatarProps {
  streak: number;
  avatarUrl?: string | null;
  name: string;
  size?: "sm" | "md";
  isOnline?: boolean;
  className?: string;
}

/**
 * Snap-style avatar with a gradient streak ring.
 * Ring color intensifies with streak length:
 *   0  → no ring
 *   1–2 → gold ring
 *   3–5 → orange ring
 *   6+  → red/fire ring + flame badge
 *
 * Online dot: bottom-right when no streak, top-left when streak is active
 * (avoids overlap with the fire badge).
 */
export function StreakAvatar({ streak, avatarUrl, name, size = "md", isOnline, className }: StreakAvatarProps) {
  const initials = name.split(" ").filter(Boolean).map((n) => n[0]).join("").toUpperCase() || "?";
  const dim = size === "sm" ? "h-9 w-9" : "h-10 w-10";
  const ringPad = size === "sm" ? "p-[2px]" : "p-[2.5px]";
  const dotSize = size === "sm" ? "h-2 w-2" : "h-2.5 w-2.5";

  const ringColor =
    streak === 0 ? "" :
    streak <= 2 ? "bg-gradient-to-br from-gold-400 to-gold-500" :
    streak <= 5 ? "bg-gradient-to-br from-orange-400 to-orange-500" :
    "bg-gradient-to-br from-orange-500 via-red-500 to-red-600";

  const onlineDot = isOnline ? (
    <span className={cn(
      "absolute rounded-full bg-green-500 border-2 border-background",
      dotSize,
      streak > 0 ? "-top-0.5 -left-0.5" : "bottom-0 right-0"
    )} />
  ) : null;

  if (streak === 0) {
    return (
      <div className={cn("relative shrink-0", className)}>
        <Avatar className={cn(dim)}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="h-full w-full object-cover rounded-full" />
          ) : (
            <AvatarFallback className="bg-gold-100 text-navy-800 text-sm font-semibold">
              {initials}
            </AvatarFallback>
          )}
        </Avatar>
        {onlineDot}
      </div>
    );
  }

  return (
    <div className={cn("relative shrink-0", className)}>
      <div className={cn("rounded-full", ringColor, ringPad)}>
        <Avatar className={cn(dim, "ring-2 ring-background")}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="h-full w-full object-cover rounded-full" />
          ) : (
            <AvatarFallback className="bg-gold-100 text-navy-800 text-sm font-semibold">
              {initials}
            </AvatarFallback>
          )}
        </Avatar>
      </div>
      {/* Streak badge — bottom-right flame + count */}
      <div className={cn(
        "absolute -bottom-1 -right-1 flex items-center gap-0.5 rounded-full px-1 py-0.5 text-[9px] font-bold text-white shadow-sm",
        streak <= 2 ? "bg-gold-500" :
        streak <= 5 ? "bg-orange-500" :
        "bg-red-500"
      )}>
        <Flame className="h-2.5 w-2.5" />
        {streak}
      </div>
      {onlineDot}
    </div>
  );
}
