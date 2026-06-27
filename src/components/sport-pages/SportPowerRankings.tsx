'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import type { SportConfig } from '@/lib/sports/config';
import { formatStat } from '@/lib/sports/config';
import { getTeamsBySport } from '@/lib/data/teams';

export default function SportPowerRankings({ config }: { config: SportConfig }) {
  const teams = useMemo(() => getTeamsBySport(config.sport), [config.sport]);
  const ranked = useMemo(
    () => [...teams].sort((a, b) => b.eloRating - a.eloRating),
    [teams],
  );

  const topStat = config.teamStats[0];
  const secondStat = config.teamStats[1];

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{config.name} Power Rankings</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          EdgeAI ELO-based rankings · {ranked.length} {config.competitorLabel.toLowerCase()}s
        </p>
      </div>

      {/* Top 3 podium */}
      {ranked.length >= 3 && (
        <div className="grid grid-cols-3 gap-3">
          {[ranked[1], ranked[0], ranked[2]].map((t, i) => {
            const place = i === 0 ? 2 : i === 1 ? 1 : 3;
            const medals = ['🥈', '🥇', '🥉'];
            const heights = ['h-28', 'h-36', 'h-24'];
            return (
              <Link href={`/team/${t.id}`} key={t.id}>
                <div
                  className={`${heights[i]} rounded-xl flex flex-col items-center justify-center gap-2 hover:opacity-90 transition-opacity`}
                  style={{
                    background: place === 1 ? `${config.color}18` : 'var(--bg-card)',
                    border: `1px solid ${place === 1 ? config.color + '40' : 'var(--border-default)'}`,
                  }}>
                  <span className="text-2xl">{medals[i]}</span>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: `${t.color}22`, color: t.color }}>
                    {t.abbreviation?.slice(0, 3) ?? t.name.slice(0, 2)}
                  </div>
                  <div className="text-center px-1">
                    <p className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>{t.name}</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{t.eloRating} ELO</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Full rankings list */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-default)' }}>
        <div className="px-4 py-3 flex items-center gap-3"
          style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-default)' }}>
          <span className="w-8 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Rank</span>
          <span className="flex-1 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{config.competitorLabel}</span>
          <span className="w-20 text-center text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>ELO</span>
          {topStat && <span className="w-20 text-center text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{topStat.label}</span>}
          {secondStat && <span className="w-20 text-center text-xs font-semibold uppercase tracking-widest hidden sm:block" style={{ color: 'var(--text-muted)' }}>{secondStat.label}</span>}
          <span className="w-16 text-center text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Record</span>
          <span className="w-20 text-center text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Form</span>
        </div>
        {ranked.map((t, i) => {
          const delta = ranked.length - t.powerRanking;
          const moved = delta !== 0;
          return (
            <div key={t.id}
              className="px-4 py-3 flex items-center gap-3 transition-colors"
              style={{ borderBottom: '1px solid var(--border-subtle)', background: i % 2 === 0 ? 'transparent' : 'var(--bg-elevated)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${config.color}08`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? 'transparent' : 'var(--bg-elevated)'; }}
            >
              <div className="w-8 flex items-center gap-1">
                <span className="text-sm font-bold w-5 text-center"
                  style={{ color: i < 3 ? config.color : 'var(--text-secondary)' }}>{i + 1}</span>
                {moved && (
                  <span className="text-[9px]" style={{ color: delta > 0 ? '#22c55e' : '#ef4444' }}>
                    {delta > 0 ? '▲' : '▼'}
                  </span>
                )}
              </div>
              <Link href={`/team/${t.id}`} className="flex-1 flex items-center gap-2.5 hover:opacity-80 min-w-0">
                <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold"
                  style={{ background: `${t.color}22`, color: t.color }}>
                  {t.abbreviation?.slice(0, 3) ?? t.name.slice(0, 2)}
                </div>
                <span className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{t.name}</span>
              </Link>
              <div className="w-20 text-center">
                <span className="text-sm font-mono font-bold" style={{ color: 'var(--text-primary)' }}>{t.eloRating}</span>
              </div>
              {topStat && (
                <div className="w-20 text-center">
                  <span className="text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>
                    {formatStat(topStat.derive(t), topStat.format)}
                  </span>
                </div>
              )}
              {secondStat && (
                <div className="w-20 text-center hidden sm:block">
                  <span className="text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>
                    {formatStat(secondStat.derive(t), secondStat.format)}
                  </span>
                </div>
              )}
              <div className="w-16 text-center">
                <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{t.record}</span>
              </div>
              <div className="w-20 flex items-center justify-center gap-0.5">
                {t.last5.map((r, j) => {
                  const c = r === 'W' ? '#22c55e' : r === 'L' ? '#ef4444' : '#f59e0b';
                  return <span key={j} className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold"
                    style={{ background: `${c}22`, color: c }}>{r}</span>;
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* AI commentary */}
      <div className="rounded-xl p-4 space-y-1"
        style={{ background: `${config.color}08`, border: `1px solid ${config.color}25` }}>
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: config.color }}>
          EdgeAI Power Rankings Analysis
        </p>
        <p className="text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
          Rankings are computed using a custom ELO model trained on head-to-head results, strength of schedule,
          margin of victory, and {config.name}-specific performance metrics including {config.teamStats.slice(0, 3).map(s => s.label).join(', ')}.
          {ranked[0] ? ` ${ranked[0].name} leads the field with an ELO of ${ranked[0].eloRating}, reflecting their ${ranked[0].record} record and consistent form.` : ''}
        </p>
      </div>
    </div>
  );
}
