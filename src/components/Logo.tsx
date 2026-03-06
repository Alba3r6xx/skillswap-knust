import Link from 'next/link';

export default function Logo({ className = '' }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`}>
      <div className="w-9 h-9 rounded-full bg-navy-800 flex items-center justify-center">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor" opacity="0" />
          <path d="M17 8C17 10.76 14.76 13 12 13C9.24 13 7 10.76 7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M7 16C7 13.24 9.24 11 12 11C14.76 11 17 13.24 17 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <span className="text-xl font-bold text-navy-800">
        Skill<span className="text-navy-800">Swap</span>
      </span>
    </Link>
  );
}
