"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useSidebar } from "@/lib/sidebar-context";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import {
  LayoutDashboard,
  Search,
  Users,
  Calendar,
  MessageSquare,
  UserCircle,
  LogOut,
  Moon,
  Sun,
  PanelLeftClose,
  PanelLeft,
  Repeat2,
  Bell,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/search", label: "Find Peers", icon: Search },
  { href: "/matches", label: "Matches", icon: Users },
  { href: "/sessions", label: "Sessions", icon: Calendar },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/profile", label: "Profile", icon: UserCircle },
];

const PUBLIC_PATHS = ["/", "/login", "/register"];

export default function Navbar() {
  const { user, signOut } = useAuth();
  const { collapsed, setCollapsed } = useSidebar();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingSessions, setPendingSessions] = useState(0);
  const [notifications, setNotifications] = useState<{ id: string; title: string; message: string; read: boolean; created_at: string }[]>([]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!user) return;

    const fetchCounts = async () => {
      try {
        const [msgRes, sessRes, notifRes] = await Promise.all([
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
          supabase
            .from("notifications")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(10),
        ]);
        setUnreadMessages(msgRes.count || 0);
        setPendingSessions(sessRes.count || 0);
        setNotifications(notifRes.data || []);
      } catch {
        // Silently ignore polling errors
      }
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, [user]);

  if (PUBLIC_PATHS.includes(pathname) || !user) return null;

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const unreadNotifs = notifications.filter((n) => !n.read).length;

  const renderNavItem = (item: (typeof NAV_ITEMS)[0]) => {
    const isActive = pathname === item.href;
    const badge =
      item.href === "/messages" && unreadMessages > 0
        ? unreadMessages
        : item.href === "/sessions" && pendingSessions > 0
        ? pendingSessions
        : 0;

    const btn = (
      <Link
        href={item.href}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative ${
          isActive
            ? "bg-navy-800 text-white"
            : "text-navy-300 hover:bg-navy-800 hover:text-white"
        } ${collapsed ? "justify-center" : ""}`}
      >
        <item.icon className="h-5 w-5 shrink-0" />
        {!collapsed && <span>{item.label}</span>}
        {badge > 0 && (
          <Badge className="bg-primary text-white text-[10px] h-5 min-w-[20px] flex items-center justify-center rounded-full p-0 ml-auto">
            {badge}
          </Badge>
        )}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip key={item.href}>
          <TooltipTrigger asChild>{btn}</TooltipTrigger>
          <TooltipContent side="right">
            <p>{item.label}</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return <div key={item.href}>{btn}</div>;
  };

  return (
    <TooltipProvider delayDuration={0}>
      {/* ── Desktop Sidebar — KNUST Navy ── */}
      <aside
        role="navigation"
        aria-label="Main navigation"
        className={`hidden md:flex fixed left-0 top-0 bottom-0 z-40 flex-col
          bg-navy-900 text-navy-50 border-r border-navy-800
          transition-[width] duration-300 ease-out
          ${collapsed ? "w-[68px]" : "w-60"}`}
      >
        <div className="flex flex-col h-full">
          {/* Logo row */}
          <div className={`flex items-center ${collapsed ? "flex-col gap-2 p-4 pt-5" : "justify-between p-5 pb-6"}`}>
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shrink-0 shadow-[0_2px_8px_oklch(0.769_0.188_70/0.4)] group-hover:brightness-110 transition-all">
                <Repeat2 className="h-5 w-5" />
              </div>
              {!collapsed && (
                <span className="text-base font-bold tracking-tight whitespace-nowrap text-white">
                  Skill<span className="text-primary">Swap</span>
                </span>
              )}
            </Link>
            <Button
              variant="ghost"
              size="icon-sm"
              className="shrink-0 text-navy-300 hover:text-white hover:bg-navy-800"
              onClick={() => setCollapsed(!collapsed)}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </Button>
          </div>

          {/* Nav items */}
          <nav className="flex-1 px-2 space-y-0.5" aria-label="App navigation">
            {NAV_ITEMS.map(renderNavItem)}
          </nav>

          {/* Bottom controls */}
          <div className="px-2 pb-4 space-y-1">
            <div className="h-px bg-navy-800 mx-1 mb-2" />

            {/* Notifications */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                    text-navy-300 hover:bg-navy-800 hover:text-white transition-colors relative
                    ${collapsed ? "justify-center" : ""}`}
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>Notifications</span>}
                  {unreadNotifs > 0 && (
                    <span className="absolute top-1.5 right-2 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                      {unreadNotifs}
                    </span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent side="right" align="end" className="w-80 p-0">
                <div className="p-3 border-b font-semibold text-sm">Notifications</div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground text-center">No notifications yet</p>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className={`p-3 border-b text-sm last:border-0 ${!n.read ? "bg-gold-50 dark:bg-gold-500/5" : ""}`}>
                        <p className="font-semibold text-xs">{n.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* Theme toggle */}
            {mounted && (
              <button
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                  text-navy-300 hover:bg-navy-800 hover:text-white transition-colors
                  ${collapsed ? "justify-center" : ""}`}
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun className="h-5 w-5 shrink-0" /> : <Moon className="h-5 w-5 shrink-0" />}
                {!collapsed && <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>}
              </button>
            )}

            {/* User row */}
            <div className={`flex items-center gap-2.5 px-2 py-2 rounded-lg ${collapsed ? "justify-center" : ""}`}>
              <Link href="/profile" className="shrink-0">
                <Avatar className="h-8 w-8 ring-2 ring-navy-700 hover:ring-primary transition-all">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.name} className="h-full w-full object-cover rounded-full" />
                  ) : (
                    <AvatarFallback className="bg-navy-700 text-primary text-xs font-bold">{initials}</AvatarFallback>
                  )}
                </Avatar>
              </Link>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                  <p className="text-[11px] text-navy-400 truncate">{user.email}</p>
                </div>
              )}
            </div>

            {/* Logout */}
            <button
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors
                ${collapsed ? "justify-center" : ""}`}
              onClick={signOut}
            >
              <LogOut className="h-5 w-5 shrink-0" />
              {!collapsed && <span>Log out</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* ── Mobile Top Header — slim, no hamburger ── */}
      <header
        className="md:hidden fixed top-0 left-0 right-0 border-b bg-background/95 backdrop-blur-sm z-40
          flex items-center justify-between px-4"
        style={{
          height: "calc(3rem + env(safe-area-inset-top))",
          paddingTop: "env(safe-area-inset-top)",
        }}
      >
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-white">
            <Repeat2 className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm font-bold tracking-tight">
            Skill<span className="text-primary">Swap</span>
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {/* Notification bell */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="relative h-11 w-11 flex items-center justify-center rounded-full
                  hover:bg-muted transition-colors"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadNotifs > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                    {unreadNotifs > 9 ? "9+" : unreadNotifs}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="p-3 border-b font-semibold text-sm">Notifications</div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground text-center">No notifications yet</p>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className={`p-3 border-b text-sm last:border-0 ${!n.read ? "bg-gold-50 dark:bg-gold-500/5" : ""}`}>
                      <p className="font-semibold text-xs">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Theme toggle */}
          {mounted && (
            <button
              className="h-11 w-11 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          )}

          {/* Profile avatar */}
          <Link href="/profile" className="ml-0.5">
            <Avatar className="h-8 w-8">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.name} className="h-full w-full object-cover rounded-full" />
              ) : (
                <AvatarFallback className="bg-gold-100 text-navy-900 text-xs font-bold">{initials}</AvatarFallback>
              )}
            </Avatar>
          </Link>
        </div>
      </header>

      {/* Mobile header spacer */}
      <div className="md:hidden" style={{ height: "calc(3rem + env(safe-area-inset-top))" }} />
    </TooltipProvider>
  );
}
