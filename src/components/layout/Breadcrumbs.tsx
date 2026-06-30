'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

const SEGMENT_LABELS: Record<string, string> = {
  game:           'Games',
  games:          'Games',
  team:           'Teams',
  player:         'Players',
  accuracy:       'Accuracy',
  search:         'Search',
  admin:          'Admin',
  history:        'History',
  matchup:        'Matchup',
  compare:        'Compare',
  teams:          'Teams',
  players:        'Players',
  standings:      'Standings',
  schedule:       'Schedule',
  leaderboard:    'Leaderboard',
  predictions:    'Predictions',
  settings:       'Settings',
  monitor:        'Monitor',
  model:          'Model',
  league:         'League',
  tournament:     'Tournament',
  live:           'Live',
  analyst:        'Analyst',
  'power-rankings': 'Power Rankings',
  // sport home pages
  nfl:    'NFL',   nba:    'NBA',   mlb:    'MLB',   nhl:    'NHL',
  soccer: 'Soccer', ncaaf: 'NCAAF', ncaab: 'NCAAB', ufc: 'UFC',
  boxing: 'Boxing', tennis: 'Tennis', f1: 'Formula 1',
  cricket: 'Cricket', esports: 'Esports',
};

export function Breadcrumbs() {
  const pathname = usePathname();
  if (pathname === '/') return null;

  const segments = pathname.split('/').filter(Boolean);

  const crumbs = segments.map((seg, i) => {
    const href = '/' + segments.slice(0, i + 1).join('/');
    // Format: known labels → readable label; UUID/slug → truncate
    const isId = /^[a-z0-9-]{8,}$/.test(seg) && !SEGMENT_LABELS[seg];
    const label = SEGMENT_LABELS[seg] ?? (isId ? `#${seg.slice(0, 8)}` : seg);
    return { href, label, isLast: i === segments.length - 1 };
  });

  return (
    <nav className="flex items-center gap-1 text-xs mb-6" aria-label="Breadcrumb">
      <Link
        href="/"
        className="flex items-center gap-1 transition-colors"
        style={{ color: 'var(--text-tertiary)' }}
      >
        <Home size={12} />
      </Link>
      {crumbs.map(({ href, label, isLast }) => (
        <span key={href} className="flex items-center gap-1">
          <ChevronRight size={11} style={{ color: 'var(--text-disabled)' }} />
          {isLast ? (
            <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
          ) : (
            <Link href={href} className="transition-colors" style={{ color: 'var(--text-tertiary)' }}>
              {label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
