"use client";

import { useSidebar } from "@/lib/sidebar-context";
import { useAuth } from "@/lib/auth-context";
import { usePathname } from "next/navigation";

const PUBLIC_PATHS = ["/", "/login", "/register", "/onboarding"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  const { user } = useAuth();
  const pathname = usePathname();

  const isPublic = PUBLIC_PATHS.includes(pathname);

  if (isPublic || !user) {
    return <main className="page-enter" key={pathname}>{children}</main>;
  }

  return (
    <main
      key={pathname}
      className={`page-enter transition-[margin] duration-300
        pb-[calc(3.5rem+var(--sab,0px))] md:pb-0
        ${collapsed ? "md:ml-[68px]" : "md:ml-60"}`}
    >
      {children}
    </main>
  );
}
