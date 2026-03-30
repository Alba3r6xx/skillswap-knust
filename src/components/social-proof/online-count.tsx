"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface OnlineCountProps {
  className?: string;
  variant?: "badge" | "inline";
}

export function OnlineCount({ className, variant = "badge" }: OnlineCountProps) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { count: c } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gte("last_seen", fiveMinutesAgo);
      setCount(c ?? 0);
    };

    fetch();
    const interval = setInterval(fetch, 60_000);
    return () => clearInterval(interval);
  }, []);

  if (count === null) return null;

  const display = count < 2 ? null : count;
  if (!display) return null;

  if (variant === "inline") {
    return (
      <span className={cn("inline-flex items-center gap-1.5 text-sm text-muted-foreground", className)}>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
        <strong className="text-foreground">{display}</strong> students online now
      </span>
    );
  }

  return (
    <div className={cn(
      "inline-flex items-center gap-2 rounded-full bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 px-3 py-1.5",
      className
    )}>
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
      </span>
      <span className="text-xs font-semibold text-green-700 dark:text-green-400">
        {display} students online now
      </span>
    </div>
  );
}
