'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { SportConfig } from '@/lib/sports/config';

export default function SportLayout({
  config,
  children,
}: {
  config: SportConfig;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const base = `/${config.slug}`;

  const isActive = (slug: string) => {
    const href = slug === '' ? base : `${base}/${slug}`;
    return slug === ''
      ? pathname === base || pathname === base + '/'
      : pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <div>
      {/* Sport accent banner */}
      <div
        className="sticky top-0 z-30"
        style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)' }}
      >
        {/* Sport identity strip */}
        <div
          className="flex items-center gap-3 px-4 sm:px-6 py-2"
          style={{ borderBottom: `2px solid ${config.color}` }}
        >
          <span className="text-lg leading-none">{config.emoji}</span>
          <div>
            <p className="text-sm font-bold leading-tight" style={{ color: config.color }}>
              {config.name}
            </p>
            <p className="text-[10px] leading-tight hidden sm:block" style={{ color: 'var(--text-muted)' }}>
              {config.fullName}
            </p>
          </div>
          <div className="ml-auto hidden sm:block">
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-medium"
              style={{ background: `${config.color}18`, color: config.color }}
            >
              EdgeAI Analytics
            </span>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex overflow-x-auto no-scrollbar px-2 gap-0.5">
          {config.subPages.map((page) => {
            const active = isActive(page.slug);
            const href = page.slug === '' ? base : `${base}/${page.slug}`;
            return (
              <Link
                key={page.slug}
                href={href}
                className="flex-shrink-0 px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap"
                style={{
                  color: active ? config.color : 'var(--text-muted)',
                  borderBottom: active ? `2px solid ${config.color}` : '2px solid transparent',
                }}
              >
                {page.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Page content */}
      <div>{children}</div>
    </div>
  );
}
