"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  LayoutDashboard,
  Search,
  Users,
  Calendar,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "framer-motion";

const BOTTOM_NAV_ITEMS = [
  { href: "/dashboard",  label: "Home",     icon: LayoutDashboard },
  { href: "/search",     label: "Find",     icon: Search },
  { href: "/matches",    label: "Matches",  icon: Users },
  { href: "/sessions",   label: "Sessions", icon: Calendar },
  { href: "/messages",   label: "Messages", icon: MessageSquare },
];

const PUBLIC_PATHS = ["/", "/login", "/register", "/onboarding"];

export default function BottomNav() {
  const { user } = useAuth();
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingSessions, setPendingSessions] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchBadges = async () => {
      try {
        const [msgRes, sessRes] = await Promise.all([
          supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("receiver_id", user.id)
            .eq("read", false),
          supabase
            .from("sessions")
            .select("*", { count: "exact", head: true })
            .eq("teacher_id", user.id)
            .eq("status", "pending"),
        ]);
        setUnreadMessages(msgRes.count || 0);
        setPendingSessions(sessRes.count || 0);
      } catch {
        // ignore
      }
    };

    fetchBadges();
    const interval = setInterval(fetchBadges, 30_000);
    return () => clearInterval(interval);
  }, [user]);

  if (!user || PUBLIC_PATHS.includes(pathname)) return null;

  const getBadge = (href: string) => {
    if (href === "/messages") return unreadMessages;
    if (href === "/sessions") return pendingSessions;
    return 0;
  };

  return (
    <nav
      role="navigation"
      aria-label="Mobile navigation"
      className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 z-50",
        "bg-navy-900 backdrop-blur-lg border-t border-navy-800",
        "safe-area-pb"
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-stretch h-14">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const badge = getBadge(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5",
                "relative min-h-[56px] select-none",
                "transition-colors duration-100",
                isActive
                  ? "text-primary"
                  : "text-navy-400"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {/* Active indicator pill */}
              {isActive && !shouldReduceMotion && (
                <motion.div
                  layoutId="bottom-nav-active"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 500, damping: 36 }}
                />
              )}
              {isActive && shouldReduceMotion && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />
              )}

              {/* Icon with badge */}
              <div className="relative">
                <item.icon
                  className={cn(
                    "transition-transform duration-100",
                    isActive ? "scale-110" : "scale-100",
                    "h-5 w-5"
                  )}
                  strokeWidth={isActive ? 2.5 : 1.75}
                />
                {badge > 0 && (
                  <span
                    className={cn(
                      "absolute -top-1 -right-1.5",
                      "min-w-[16px] h-4 px-0.5 rounded-full",
                      "bg-primary text-primary-foreground",
                      "text-[10px] font-bold leading-none",
                      "flex items-center justify-center"
                    )}
                    aria-label={`${badge} unread`}
                  >
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  "text-[10px] font-medium leading-none transition-all duration-100",
                  isActive ? "opacity-100 font-semibold" : "opacity-70"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
