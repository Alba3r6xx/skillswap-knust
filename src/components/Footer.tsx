import Link from 'next/link';
import Logo from './Logo';

const quickLinks = [
  { href: '/', label: 'Home' },
  { href: '/explore', label: 'Explore Skills' },
  { href: '/about', label: 'About' },
  { href: '/guide', label: 'FAQ' },
];

const legalLinks = [
  { href: '/terms', label: 'Terms of Service' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/contact', label: 'Contact Us' },
];

const socialLinks = [
  { href: '#', label: 'Facebook' },
  { href: '#', label: 'LinkedIn' },
  { href: '#', label: 'Instagram' },
];

export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-navy-800 to-navy-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white">
                  <path d="M17 8C17 10.76 14.76 13 12 13C9.24 13 7 10.76 7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M7 16C7 13.24 9.24 11 12 11C14.76 11 17 13.24 17 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <span className="text-xl font-bold text-white">SkillSwap</span>
            </div>
            <p className="text-sm text-white/60 leading-relaxed max-w-xs">
              Exchange skills. Grow together. Building a collaborative learning community at KNUST.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-white/60 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Legal</h3>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-white/60 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Connect</h3>
            <ul className="space-y-3">
              {socialLinks.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-white/60 hover:text-white transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <p className="text-center text-sm text-white/40">
            © 2026 SkillSwap. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
