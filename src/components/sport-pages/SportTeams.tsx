'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { SPORT_CONFIGS, formatStat } from '@/lib/sports/config';
import type { SportConfig } from '@/lib/sports/config';
import { getTeamsBySport } from '@/lib/data/teams';
import type { Team } from '@/lib/types';

function FormBadge({ result }: { result: 'W' | 'L' | 'D' }) {
  const colors = { W: '#22c55e', L: '#ef4444', D: '#f59e0b' };
  return (
    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
      style={{ background: `${colors[result]}22`, color: colors[result] }}>
      {result}
    </span>
  );
}

function TeamCard({ team, config, rank }: { team: Team; config: SportConfig; rank: number }) {
  const statVals = config.teamStats.slice(0, 4).map(s => ({
    stat: s, val: s.derive(team),
  }));

  return (
    <div className="rounded-xl p-4 space-y-3 hover:opacity-90 transition-opacity"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center text-[10px] font-bold w-5"
          style={{ color: rank <= 3 ? config.color : 'var(--text-muted)' }}>
          {rank}
        </div>
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{ background: `${team.color}22`, color: team.color }}>
          {team.abbreviation?.slice(0, 3) ?? team.name.slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <Link href={`/team/${team.id}`}>
            <p className="text-sm font-bold truncate hover:opacity-80" style={{ color: 'var(--text-primary)' }}>
              {team.name}
            </p>
          </Link>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{team.league}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold font-mono" style={{ color: 'var(--text-primary)' }}>{team.record}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{(team.winPct * 100).toFixed(1)}%</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2">
        {statVals.map(({ stat, val }) => (
          <div key={stat.key} className="rounded-lg p-2" style={{ background: 'var(--bg-elevated)' }}>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
            <p className="text-sm font-bold font-mono" style={{ color: 'var(--text-primary)' }}>
              {formatStat(val, stat.format)}
            </p>
          </div>
        ))}
      </div>

      {/* Form */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Form</span>
        {team.last5.map((r, i) => <FormBadge key={i} result={r} />)}
        <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded"
          style={{ background: `${config.color}15`, color: config.color }}>
          #{team.powerRanking}
        </span>
      </div>
    </div>
  );
}

export default function SportTeams({ sportId }: { sportId: string }) {
  const config = SPORT_CONFIGS[sportId as keyof typeof SPORT_CONFIGS];
  const allTeams = useMemo(() => getTeamsBySport(config.sport), [config.sport]);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('eloRating');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const leagues = useMemo(() => ['All', ...new Set(allTeams.map(t => t.league))], [allTeams]);
  const [leagueFilter, setLeagueFilter] = useState('All');

  const filtered = useMemo(() => {
    let t = [...allTeams];
    if (search) t = t.filter(tm => tm.name.toLowerCase().includes(search.toLowerCase()));
    if (leagueFilter !== 'All') t = t.filter(tm => tm.league === leagueFilter);
    t.sort((a, b) => {
      const getVal = (tm: Team): number => {
        if (sortKey === 'eloRating') return tm.eloRating;
        if (sortKey === 'winPct') return tm.winPct;
        if (sortKey === 'powerRanking') return tm.powerRanking;
        const stat = config.teamStats.find(s => s.key === sortKey);
        if (stat) {
          const v = stat.derive(tm);
          return typeof v === 'number' ? v : 0;
        }
        return 0;
      };
      const av = getVal(a), bv = getVal(b);
      return sortDir === 'desc' ? bv - av : av - bv;
    });
    return t;
  }, [allTeams, search, sortKey, sortDir, leagueFilter, config.teamStats]);

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {config.name} {config.competitorLabel}s
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {allTeams.length} {config.competitorLabel.toLowerCase()}s · EdgeAI Power Rankings
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text" placeholder={`Search ${config.competitorLabel.toLowerCase()}s…`}
          value={search} onChange={e => setSearch(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-sm outline-none"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', minWidth: 200 }}
        />
        <div className="flex gap-1.5 flex-wrap">
          {leagues.slice(0, 8).map(l => (
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
        <div className="flex gap-1.5">
          {[{ key: 'eloRating', label: 'ELO' }, { key: 'winPct', label: 'Win%' }, { key: config.teamStats[0]?.key ?? '', label: config.teamStats[0]?.label ?? '' }].filter(s => s.key).map(s => (
            <button key={s.key} onClick={() => toggleSort(s.key)}
              className="px-2.5 py-1 rounded-lg text-xs cursor-pointer"
              style={{
                background: sortKey === s.key ? `${config.color}15` : 'var(--bg-card)',
                color: sortKey === s.key ? config.color : 'var(--text-muted)',
                border: `1px solid ${sortKey === s.key ? config.color : 'var(--border-default)'}`,
              }}>
              {s.label} {sortKey === s.key ? (sortDir === 'desc' ? '↓' : '↑') : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Teams grid */}
      {filtered.length === 0 ? (
        <p className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>No {config.competitorLabel.toLowerCase()}s found</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t, i) => (
            <TeamCard key={t.id} team={t} config={config} rank={i + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
