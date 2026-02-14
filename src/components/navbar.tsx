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
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
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
  Menu,
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
  const { collapsed, setCollapsed, mobileOpen, setMobileOpen } = useSidebar();
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
            ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        } ${collapsed ? "justify-center" : ""}`}
        onClick={() => setMobileOpen(false)}
      >
        <item.icon className="h-5 w-5 shrink-0" />
        {!collapsed && <span>{item.label}</span>}
        {badge > 0 && (
          <Badge className="bg-amber-500 text-white text-[10px] h-5 min-w-[20px] flex items-center justify-center rounded-full p-0 ml-auto">
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
      {/* Desktop Sidebar */}
      <aside
        role="navigation"
        aria-label="Main navigation"
        className={`hidden md:flex fixed left-0 top-0 bottom-0 border-r bg-background z-40 flex-col transition-[width] duration-300 ${
          collapsed ? "w-[68px]" : "w-60"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className={`flex items-center ${collapsed ? "flex-col gap-2 p-4" : "justify-between p-5 pb-6"}`}>
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-white shrink-0">
                <Repeat2 className="h-5 w-5" />
              </div>
              {!collapsed && (
                <span className="text-lg font-bold whitespace-nowrap">
                  Skill<span className="text-amber-500">Swap</span>
                </span>
              )}
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </Button>
          </div>

          <nav className="flex-1 px-3 space-y-1">
            {NAV_ITEMS.map(renderNavItem)}
          </nav>

          <div className="px-3 pb-4 space-y-2">
            <Separator />
            {/* Notification Bell */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size={collapsed ? "icon" : "default"} className={`w-full relative ${collapsed ? "" : "justify-start gap-3"}`}>
                  <Bell className="h-5 w-5 shrink-0" />
                  {!collapsed && <span className="text-sm">Notifications</span>}
                  {unreadNotifs > 0 && (
                    <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
                      {unreadNotifs}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent side="right" className="w-80 p-0">
                <div className="p-3 border-b font-semibold text-sm">Notifications</div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground text-center">No notifications</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3 border-b text-sm ${!n.read ? "bg-amber-50/50 dark:bg-amber-500/5" : ""}`}
                      >
                        <p className="font-medium text-xs">{n.title}</p>
                        <p className="text-xs text-muted-foreground">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* Theme Toggle */}
            {mounted && (
              <Button
                variant="ghost"
                size={collapsed ? "icon" : "default"}
                className={`w-full ${collapsed ? "" : "justify-start gap-3"}`}
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? <Sun className="h-5 w-5 shrink-0" /> : <Moon className="h-5 w-5 shrink-0" />}
                {!collapsed && <span className="text-sm">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>}
              </Button>
            )}

            {/* User + Logout */}
            <div className={`flex items-center gap-3 p-2 rounded-lg ${collapsed ? "justify-center" : ""}`}>
              <Avatar className="h-8 w-8 shrink-0">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.name} className="h-full w-full object-cover rounded-full" />
                ) : (
                  <AvatarFallback className="bg-amber-100 text-amber-700 text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                )}
              </Avatar>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size={collapsed ? "icon" : "default"}
              className={`w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 ${
                collapsed ? "" : "justify-start gap-3"
              }`}
              onClick={signOut}
            >
              <LogOut className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="text-sm">Log Out</span>}
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 border-b bg-background z-40 flex items-center justify-between px-3" style={{ height: 'calc(3.25rem + env(safe-area-inset-top))', paddingTop: 'env(safe-area-inset-top)' }}>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-2.5 p-5 border-b">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-white">
                  <Repeat2 className="h-5 w-5" />
                </div>
                <span className="text-lg font-bold">
                  Skill<span className="text-amber-500">Swap</span>
                </span>
              </div>
              <nav className="flex-1 px-3 py-4 space-y-1">
                {NAV_ITEMS.map(renderNavItem)}
              </nav>
              <div className="px-3 pb-4">
                <Separator className="mb-3" />
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-red-500"
                  onClick={signOut}
                >
                  <LogOut className="h-5 w-5" />
                  <span className="text-sm">Log Out</span>
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
        <Link href="/dashboard" className="flex items-center gap-1.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-white">
            <Repeat2 className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm font-bold">
            Skill<span className="text-amber-500">Swap</span>
          </span>
        </Link>
        <div className="flex items-center gap-1.5">
          {mounted && (
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          )}
          <Link href="/profile">
            <Avatar className="h-8 w-8">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.name} className="h-full w-full object-cover rounded-full" />
              ) : (
                <AvatarFallback className="bg-amber-100 text-amber-700 text-xs">{initials}</AvatarFallback>
              )}
            </Avatar>
          </Link>
        </div>
      </header>
      {/* Mobile spacer */}
      <div className="md:hidden" style={{ height: 'calc(3.25rem + env(safe-area-inset-top))' }} />
    </TooltipProvider>
  );
}
