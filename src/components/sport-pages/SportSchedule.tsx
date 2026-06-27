'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { SPORT_CONFIGS } from '@/lib/sports/config';
import type { SportConfig } from '@/lib/sports/config';
import { getTeamsBySport } from '@/lib/data/teams';

type MatchRow = {
  id: string;
  home: ReturnType<typeof getTeamsBySport>[number];
  away: ReturnType<typeof getTeamsBySport>[number];
  date: string;
  time: string;
  status: 'upcoming' | 'live' | 'final';
  homeScore?: number;
  awayScore?: number;
};

function generateSchedule(teams: ReturnType<typeof getTeamsBySport>, config: SportConfig): MatchRow[] {
  const rows: MatchRow[] = [];
  const shuffled = [...teams].sort((a, b) => b.eloRating - a.eloRating);
  const today = new Date(2026, 5, 27); // fixed base date
  let row = 0;
  for (let d = -3; d <= 14; d++) {
    const date = new Date(today);
    date.setDate(today.getDate() + d);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });
    const count = d < 0 ? 2 : d === 0 ? 3 : 2;
    for (let g = 0; g < count && row + 1 < shuffled.length; g++, row += 2) {
      const home = shuffled[row % shuffled.length];
      const away = shuffled[(row + 1) % shuffled.length];
      const status: MatchRow['status'] = d < 0 ? 'final' : d === 0 && g === 0 ? 'live' : 'upcoming';
      rows.push({
        id: `${home.id}-${away.id}-${d}-${g}`,
        home, away, date: dateStr,
        time: ['7:00 PM', '7:30 PM', '8:00 PM', '9:00 PM'][g % 4],
        status,
        homeScore: status !== 'upcoming' ? Math.floor(Math.random() * 40 + 80) : undefined,
        awayScore: status !== 'upcoming' ? Math.floor(Math.random() * 40 + 80) : undefined,
      });
    }
  }
  return rows;
}

export default function SportSchedule({ sportId }: { sportId: string }) {
  const config = SPORT_CONFIGS[sportId as keyof typeof SPORT_CONFIGS];
  const teams = useMemo(() => getTeamsBySport(config.sport), [config.sport]);
  const schedule = useMemo(() => generateSchedule(teams, config), [teams, config]);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'final'>('all');

  const grouped = useMemo(() => {
    const m = new Map<string, MatchRow[]>();
    for (const r of schedule) {
      if (filter !== 'all' && r.status !== filter) continue;
      if (!m.has(r.date)) m.set(r.date, []);
      m.get(r.date)!.push(r);
    }
    return m;
  }, [schedule, filter]);

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{config.name} Schedule</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Upcoming & recent games · {schedule.length} total
        </p>
      </div>

      <div className="flex gap-1.5">
        {(['all', 'upcoming', 'final'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3 py-1 rounded-full text-xs cursor-pointer capitalize"
            style={{
              background: filter === f ? config.color : 'var(--bg-card)',
              color: filter === f ? '#fff' : 'var(--text-muted)',
              border: `1px solid ${filter === f ? config.color : 'var(--border-default)'}`,
            }}>
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {Array.from(grouped.entries()).map(([date, games]) => (
          <div key={date}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: 'var(--text-muted)' }}>{date}</span>
              <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
            </div>
            <div className="space-y-2">
              {games.map(g => (
                <div key={g.id}
                  className="rounded-xl p-3 flex items-center gap-3"
                  style={{ background: 'var(--bg-card)', border: `1px solid ${g.status === 'live' ? config.color + '40' : 'var(--border-default)'}` }}>
                  {/* Status */}
                  <div className="w-12 text-center flex-shrink-0">
                    {g.status === 'live' ? (
                      <span className="text-xs font-bold px-1.5 py-0.5 rounded"
                        style={{ background: '#ef444420', color: '#ef4444' }}>LIVE</span>
                    ) : g.status === 'final' ? (
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Final</span>
                    ) : (
                      <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{g.time}</span>
                    )}
                  </div>

                  {/* Home */}
                  <div className="flex-1 flex items-center justify-end gap-2">
                    <span className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{g.home.name}</span>
                    <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-bold"
                      style={{ background: `${g.home.color}22`, color: g.home.color }}>
                      {g.home.abbreviation?.slice(0, 3) ?? g.home.name.slice(0, 2)}
                    </div>
                  </div>

                  {/* Score / VS */}
                  <div className="w-20 text-center flex-shrink-0">
                    {g.homeScore !== undefined ? (
                      <span className="text-sm font-bold font-mono" style={{ color: 'var(--text-primary)' }}>
                        {g.homeScore} – {g.awayScore}
                      </span>
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>vs</span>
                    )}
                  </div>

                  {/* Away */}
                  <div className="flex-1 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-bold"
                      style={{ background: `${g.away.color}22`, color: g.away.color }}>
                      {g.away.abbreviation?.slice(0, 3) ?? g.away.name.slice(0, 2)}
                    </div>
                    <span className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{g.away.name}</span>
                  </div>

                  {/* Matchup link */}
                  <Link href={`/${config.slug}/matchup`}
                    className="text-xs px-2 py-1 rounded-lg flex-shrink-0 transition-opacity hover:opacity-80"
                    style={{ background: `${config.color}15`, color: config.color }}>
                    Predict
                  </Link>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
