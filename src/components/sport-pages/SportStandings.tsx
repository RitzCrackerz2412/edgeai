'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { SPORT_CONFIGS, formatStat } from '@/lib/sports/config';
import { getTeamsBySport } from '@/lib/data/teams';

export default function SportStandings({ sportId }: { sportId: string }) {
  const config = SPORT_CONFIGS[sportId as keyof typeof SPORT_CONFIGS];
  const all = useMemo(() => getTeamsBySport(config.sport), [config.sport]);
  const leagues = useMemo(() => ['All', ...new Set(all.map(t => t.league))], [all]);
  const [leagueFilter, setLeagueFilter] = useState('All');

  const sorted = useMemo(() => {
    let t = [...all];
    if (leagueFilter !== 'All') t = t.filter(tm => tm.league === leagueFilter);
    return t.sort((a, b) => b.winPct - a.winPct);
  }, [all, leagueFilter]);

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{config.name} Standings</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {all.length} {config.competitorLabel.toLowerCase()}s · Sorted by win percentage
        </p>
      </div>

      {/* League filter */}
      <div className="flex flex-wrap gap-1.5">
        {leagues.slice(0, 12).map(l => (
          <button key={l} onClick={() => setLeagueFilter(l)}
            className="px-2.5 py-1 rounded-full text-xs cursor-pointer transition-colors"
            style={{
              background: leagueFilter === l ? config.color : 'var(--bg-card)',
              color: leagueFilter === l ? '#fff' : 'var(--text-muted)',
              border: `1px solid ${leagueFilter === l ? config.color : 'var(--border-default)'}`,
            }}>
            {l}
          </button>
        ))}
      </div>

      {/* Standings table */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-default)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-default)' }}>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest w-8"
                  style={{ color: 'var(--text-muted)' }}>#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest"
                  style={{ color: 'var(--text-muted)' }}>{config.competitorLabel}</th>
                {config.standingsCols.map(col => (
                  <th key={col.key} className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-widest"
                    style={{ color: 'var(--text-muted)' }} title={col.label}>
                    {col.short}
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-widest"
                  style={{ color: 'var(--text-muted)' }}>Form</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((t, i) => {
                const isTop = i < Math.ceil(sorted.length * 0.3);
                const statVals = config.teamStats;
                return (
                  <tr key={t.id}
                    className="transition-colors"
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      background: i === 0 ? `${config.color}08` : 'transparent',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = i === 0 ? `${config.color}08` : 'transparent'; }}
                  >
                    <td className="px-4 py-3 text-xs font-bold w-8"
                      style={{ color: isTop ? config.color : 'var(--text-muted)' }}>
                      {i + 1}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/team/${t.id}`} className="flex items-center gap-2.5 hover:opacity-80">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                          style={{ background: `${t.color}22`, color: t.color }}>
                          {t.abbreviation?.slice(0, 3) ?? t.name.slice(0, 2)}
                        </div>
                        <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{t.name}</span>
                      </Link>
                    </td>
                    {config.standingsCols.map(col => {
                      let val: string | number = '';
                      if (col.key === 'record') val = t.record;
                      else if (col.key === 'winPct') val = (t.winPct * 100).toFixed(1) + '%';
                      else {
                        const sd = statVals.find(s => s.key === col.key);
                        if (sd) val = formatStat(sd.derive(t), sd.format);
                        else val = '—';
                      }
                      return (
                        <td key={col.key} className="px-3 py-3 text-center text-sm font-mono"
                          style={{ color: 'var(--text-secondary)' }}>
                          {val}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-0.5">
                        {t.last5.map((r, j) => {
                          const c = r === 'W' ? '#22c55e' : r === 'L' ? '#ef4444' : '#f59e0b';
                          return <span key={j} className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
                            style={{ background: `${c}22`, color: c }}>{r}</span>;
                        })}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
