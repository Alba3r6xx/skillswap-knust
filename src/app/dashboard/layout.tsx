'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const DASH_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/explore', label: 'Explore Skills' },
  { href: '/dashboard/swaps', label: 'Swaps' },
  { href: '/dashboard/messages', label: 'Messages' },
  { href: '/dashboard/profile', label: 'Profile' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dashboard navbar */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-navy-800 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white">
                  <path d="M17 8C17 10.76 14.76 13 12 13C9.24 13 7 10.76 7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M7 16C7 13.24 9.24 11 12 11C14.76 11 17 13.24 17 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <span className="text-lg font-bold text-navy-800">SkillSwap</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {DASH_LINKS.map((link) => {
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      active
                        ? 'bg-sky-100 text-navy-800'
                        : 'text-gray-500 hover:text-navy-800 hover:bg-gray-50'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-sky-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                KA
              </div>
            </div>
          </div>
        </div>

        {/* Mobile bottom nav */}
        <div className="md:hidden border-t border-gray-200">
          <div className="flex overflow-x-auto scrollbar-hide">
            {DASH_LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex-1 min-w-fit px-4 py-3 text-center text-xs font-medium whitespace-nowrap transition-colors ${
                    active
                      ? 'text-navy-800 border-b-2 border-navy-800'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}
