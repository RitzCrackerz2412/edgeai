'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { SPORT_CONFIGS } from '@/lib/sports/config';
import { PLAYER_DETAILS } from '@/lib/playerData';

export default function SportLeaderboard({ sportId }: { sportId: string }) {
  const config = SPORT_CONFIGS[sportId as keyof typeof SPORT_CONFIGS];
  const players = useMemo(
    () => Object.values(PLAYER_DETAILS).filter(p => p.sport === config.sport),
    [config.sport],
  );

  // Collect all unique stat labels across players
  const statLabels = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of players) {
      for (const s of p.seasonStats) {
        counts.set(s.label, (counts.get(s.label) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(e => e[0])
      .slice(0, 10);
  }, [players]);

  const [activeStat, setActiveStat] = useState<string>(statLabels[0] ?? '');

  const sorted = useMemo(() => {
    return [...players]
      .map(p => {
        const s = activeStat ? p.seasonStats.find(s => s.label === activeStat) : undefined;
        const raw = s ? parseFloat(String(s.value).replace(/[^0-9.-]/g, '')) : -Infinity;
        return { player: p, raw, display: (s?.value ?? '—') as string | number };
      })
      .filter(r => isFinite(r.raw))
      .sort((a, b) => b.raw - a.raw)
      .slice(0, 25);
  }, [players, activeStat]);

  if (players.length === 0) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-12 text-center">
        <span className="text-5xl">{config.emoji}</span>
        <h2 className="text-lg font-bold mt-4" style={{ color: 'var(--text-primary)' }}>
          {config.name} Leaderboard
        </h2>
        <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
          Player stats for {config.fullName} will appear here once rosters are loaded.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{config.name} Leaderboard</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {players.length} players · Season statistics rankings
        </p>
      </div>

      {/* Stat tabs */}
      <div className="flex flex-wrap gap-1.5">
        {statLabels.map(s => (
          <button key={s} onClick={() => setActiveStat(s)}
            className="px-2.5 py-1 rounded-full text-xs cursor-pointer transition-colors"
            style={{
              background: activeStat === s ? config.color : 'var(--bg-card)',
              color: activeStat === s ? '#fff' : 'var(--text-muted)',
              border: `1px solid ${activeStat === s ? config.color : 'var(--border-default)'}`,
            }}>
            {s}
          </button>
        ))}
      </div>

      {/* Leaderboard table */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-default)' }}>
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3"
          style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-default)' }}>
          <span className="w-8 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>#</span>
          <span className="flex-1 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Player</span>
          <span className="w-24 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Team</span>
          <span className="w-24 text-right text-xs font-semibold uppercase tracking-widest" style={{ color: config.color }}>
            {activeStat || 'Stat'}
          </span>
        </div>

        {/* Rows */}
        {sorted.map((r, i) => {
          const pct = sorted[0].raw > 0 ? (r.raw / sorted[0].raw) * 100 : 0;
          return (
            <div key={r.player.id}
              className="flex items-center gap-3 px-4 py-3 transition-colors"
              style={{ borderBottom: '1px solid var(--border-subtle)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <div className="w-8 text-sm font-bold"
                style={{ color: i < 3 ? config.color : 'var(--text-muted)' }}>
                {i + 1}
              </div>
              <div className="flex-1 flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                  style={{ background: `${r.player.teamColor}22`, color: r.player.teamColor }}>
                  {r.player.number !== '—' ? r.player.number : r.player.position.slice(0, 1)}
                </div>
                <div className="min-w-0">
                  <Link href={`/player/${r.player.id}`}
                    className="text-sm font-semibold truncate block hover:opacity-80"
                    style={{ color: 'var(--text-primary)' }}>
                    {r.player.name}
                  </Link>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{r.player.position}</p>
                </div>
              </div>
              <div className="w-24">
                <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{r.player.teamName}</p>
              </div>
              <div className="w-24 text-right">
                <p className="text-sm font-bold font-mono" style={{ color: config.color }}>{r.display}</p>
                <div className="mt-1 h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg-base)' }}>
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: config.color }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
