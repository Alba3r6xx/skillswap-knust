"use client";

import { useSidebar } from "@/lib/sidebar-context";
import { useAuth } from "@/lib/auth-context";
import { usePathname } from "next/navigation";

const PUBLIC_PATHS = ["/", "/login", "/register"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  const { user } = useAuth();
  const pathname = usePathname();

  const isPublic = PUBLIC_PATHS.includes(pathname);

  if (isPublic || !user) {
    return <main className="page-transition">{children}</main>;
  }

  return (
    <main
      className={`page-transition transition-[margin] duration-300
        pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0
        ${collapsed ? "md:ml-[68px]" : "md:ml-60"}`}
    >
      {children}
    </main>
  );
}
