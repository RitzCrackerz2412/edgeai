'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Shield, User, BarChart2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/',         label: 'Games',    icon: LayoutGrid, exact: true },
  { href: '/team',     label: 'Teams',    icon: Shield },
  { href: '/player',   label: 'Players',  icon: User },
  { href: '/accuracy', label: 'Accuracy', icon: BarChart2 },
  { href: '/search',   label: 'Search',   icon: Search },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 lg:hidden z-40 flex items-center"
      style={{
        height: 56,
        background: 'rgba(7,7,14,0.95)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid var(--border-subtle)',
      }}
    >
      {NAV.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2"
            style={{ color: active ? 'var(--accent-light)' : 'var(--text-tertiary)' }}
          >
            <Icon size={18} />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
