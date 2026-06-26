'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '/',          label: 'Games' },
  { href: '/accuracy',  label: 'Accuracy' },
  { href: '/search',    label: 'Search' },
  { href: '/admin',     label: 'Admin' },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header
      className="fixed top-0 inset-x-0 z-50 h-16 flex items-center px-6"
      style={{
        background: 'rgba(8,8,16,0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <Link href="/" className="flex items-center gap-2 mr-8">
        <span
          className="text-xl font-bold tracking-tight"
          style={{ color: 'var(--accent-bright)' }}
        >
          Edge
        </span>
        <span
          className="text-xl font-bold tracking-tight px-1.5 py-0.5 rounded text-sm"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          AI
        </span>
      </Link>

      <nav className="flex items-center gap-1 flex-1">
        {NAV_LINKS.map(({ href, label }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                active
                  ? 'text-white'
                  : 'hover:text-white'
              )}
              style={{
                color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: active ? 'var(--accent-dim)' : 'transparent',
              }}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-3">
        <button
          className="text-sm px-4 py-1.5 rounded-md font-medium transition-colors"
          style={{
            background: 'var(--accent)',
            color: '#fff',
          }}
        >
          Sign In
        </button>
      </div>
    </header>
  );
}
