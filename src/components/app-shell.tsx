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
    return <main>{children}</main>;
  }

  return (
    <main
      className={`transition-[margin] duration-300 ${
        collapsed ? "md:ml-[68px]" : "md:ml-60"
      }`}
    >
      {children}
    </main>
  );
}
