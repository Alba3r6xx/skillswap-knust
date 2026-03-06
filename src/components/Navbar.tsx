'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from './Logo';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/explore', label: 'Explore Skills' },
  { href: '/guide', label: 'User Guide' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Logo />

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
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

          {/* Desktop auth buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/signup"
              className="px-5 py-2 rounded-full bg-navy-800 text-white text-sm font-semibold hover:bg-navy-700 transition-colors"
            >
              Sign Up
            </Link>
            <Link
              href="/login"
              className="px-5 py-2 rounded-full border border-navy-800 text-navy-800 text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              Log In
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {open ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-gray-200 bg-white mobile-menu-enter">
          <nav className="px-4 py-4 flex flex-col gap-1">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-sky-100 text-navy-800'
                      : 'text-gray-500 hover:text-navy-800 hover:bg-gray-50'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-gray-200">
              <Link
                href="/signup"
                onClick={() => setOpen(false)}
                className="px-4 py-3 rounded-lg bg-navy-800 text-white text-sm font-semibold text-center hover:bg-navy-700 transition-colors"
              >
                Sign Up
              </Link>
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="px-4 py-3 rounded-lg border border-navy-800 text-navy-800 text-sm font-semibold text-center hover:bg-gray-50 transition-colors"
              >
                Log In
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
