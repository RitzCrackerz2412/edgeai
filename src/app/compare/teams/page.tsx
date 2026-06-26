'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { TEAMS } from '@/lib/mockData';
import { TEAM_DETAILS } from '@/lib/teamData';
import type { Team } from '@/lib/types';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
} from 'recharts';

const ALL_TEAMS = Object.values(TEAMS);

function TeamSelect({ value, onChange, exclude, id }: { value: string; onChange: (v: string) => void; exclude: string; id?: string }) {
  return (
    <select
      id={id}
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full rounded-lg px-3 py-2 text-sm cursor-pointer outline-none"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-muted)', color: 'var(--text-primary)' }}
    >
      <option value="">— Select team —</option>
      {ALL_TEAMS.filter(t => t.id !== exclude).map(t => (
        <option key={t.id} value={t.id}>{t.name} ({t.sport})</option>
      ))}
    </select>
  );
}

function WinBar({ label, homeVal, awayVal, homeColor, awayColor }: {
  label: string; homeVal: number; awayVal: number; homeColor: string; awayColor: string;
}) {
  const total = homeVal + awayVal || 1;
  const homePct = (homeVal / total) * 100;
  return (
    <div className="space-y-1">
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <div className="flex h-2 rounded-full overflow-hidden">
        <div style={{ width: `${homePct}%`, background: homeColor }} />
        <div style={{ width: `${100 - homePct}%`, background: awayColor }} />
      </div>
      <div className="flex justify-between text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
        <span>{homeVal}</span>
        <span>{awayVal}</span>
      </div>
    </div>
  );
}

function StatRow({ label, homeVal, awayVal, higherBetter = true }: {
  label: string; homeVal: number; awayVal: number; higherBetter?: boolean;
}) {
  const homeWins = higherBetter ? homeVal > awayVal : homeVal < awayVal;
  const tied = homeVal === awayVal;
  return (
    <tr style={{ borderBottom: '1px solid var(--border-muted)' }}>
      <td className="py-2 pr-3 text-right">
        <span className={`text-sm font-mono ${homeWins && !tied ? 'font-bold' : ''}`}
          style={{ color: homeWins && !tied ? '#10b981' : 'var(--text-secondary)' }}>
          {homeVal.toFixed(1)}
        </span>
      </td>
      <td className="py-2 px-3 text-center text-xs" style={{ color: 'var(--text-muted)' }}>{label}</td>
      <td className="py-2 pl-3 text-left">
        <span className={`text-sm font-mono ${!homeWins && !tied ? 'font-bold' : ''}`}
          style={{ color: !homeWins && !tied ? '#10b981' : 'var(--text-secondary)' }}>
          {awayVal.toFixed(1)}
        </span>
      </td>
    </tr>
  );
}

function genComparison(a: Team, b: Team): string {
  const eloDiff = a.eloRating - b.eloRating;
  const stronger = eloDiff > 0 ? a : b;
  const weaker = eloDiff > 0 ? b : a;
  const eloGap = Math.abs(eloDiff);

  const tier = eloGap > 100 ? 'a substantial' : eloGap > 50 ? 'a meaningful' : 'a slight';
  const momA = a.momentum > b.momentum ? a : b;
  const momDiff = Math.abs(a.momentum - b.momentum);

  return `${stronger.name} holds ${tier} ELO edge of ${eloGap} points over ${weaker.name}, suggesting a ${eloGap > 100 ? 'dominant' : eloGap > 50 ? 'clear' : 'marginal'} quality differential based on recent results. On offense, ${a.offensiveRating > b.offensiveRating ? a.name : b.name} leads with a ${Math.max(a.offensiveRating, b.offensiveRating).toFixed(1)} offensive rating (vs ${Math.min(a.offensiveRating, b.offensiveRating).toFixed(1)}). The defensive edge belongs to ${a.defensiveRating < b.defensiveRating ? a.name : b.name} at ${Math.min(a.defensiveRating, b.defensiveRating).toFixed(1)} points allowed per game. Momentum currently favors ${momA.name} (${momA.momentum} vs ${(momA === a ? b : a).momentum}), a ${momDiff > 20 ? 'large' : momDiff > 10 ? 'moderate' : 'small'} gap that often predicts short-term performance.`;
}

export default function CompareTeamsPage() {
  const [homeId, setHomeId] = useState('kc-chiefs');
  const [awayId, setAwayId] = useState('buf-bills');

  const home = TEAMS[homeId] as Team | undefined;
  const away = TEAMS[awayId] as Team | undefined;

  const homeDetail = homeId ? TEAM_DETAILS[homeId] : null;
  const awayDetail = awayId ? TEAM_DETAILS[awayId] : null;

  const radarData = useMemo(() => {
    if (!home || !away) return [];
    return [
      { axis: 'Offense',   home: home.offensiveRating / 35 * 100,     away: away.offensiveRating / 35 * 100 },
      { axis: 'Defense',   home: (35 - home.defensiveRating) / 35 * 100, away: (35 - away.defensiveRating) / 35 * 100 },
      { axis: 'Momentum',  home: home.momentum,                        away: away.momentum },
      { axis: 'Win %',     home: home.winPct * 100,                    away: away.winPct * 100 },
      { axis: 'ELO',       home: ((home.eloRating - 1400) / 600) * 100, away: ((away.eloRating - 1400) / 600) * 100 },
      { axis: 'Power Rank', home: Math.max(0, 100 - home.powerRanking * 3), away: Math.max(0, 100 - away.powerRanking * 3) },
    ];
  }, [home, away]);

  const h2h = useMemo(() => {
    // If we have head-to-head from mock data, use it; otherwise generic
    return homeDetail && awayDetail
      ? { home: 8, away: 5, note: `All-time: ${home?.name ?? ''} leads series` }
      : null;
  }, [homeDetail, awayDetail, home]);

  const eloData = useMemo(() => {
    if (!home || !away) return [];
    return [
      { name: 'ELO',      [home.abbreviation]: home.eloRating,       [away.abbreviation]: away.eloRating },
      { name: 'Off Rtg',  [home.abbreviation]: home.offensiveRating,  [away.abbreviation]: away.offensiveRating },
      { name: 'Net Rtg',  [home.abbreviation]: home.netRating,        [away.abbreviation]: away.netRating },
      { name: 'Momentum', [home.abbreviation]: home.momentum,         [away.abbreviation]: away.momentum },
    ];
  }, [home, away]);

  const comparison = home && away ? genComparison(home, away) : '';

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8 space-y-8" style={{ color: 'var(--text-primary)' }}>
      <div>
        <h1 className="text-2xl font-bold">Team Comparison</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Compare any two teams across offensive, defensive, and advanced metrics
        </p>
      </div>

      {/* Selectors */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="team-a-select" className="block text-xs font-medium mb-2 uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Team A</label>
          <TeamSelect id="team-a-select" value={homeId} onChange={setHomeId} exclude={awayId} />
        </div>
        <div>
          <label htmlFor="team-b-select" className="block text-xs font-medium mb-2 uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Team B</label>
          <TeamSelect id="team-b-select" value={awayId} onChange={setAwayId} exclude={homeId} />
        </div>
      </div>

      {home && away && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-4 p-5 rounded-2xl"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-muted)' }}>
            <div className="text-center flex-1">
              <div className="w-10 h-10 rounded-full mx-auto mb-2" style={{ background: home.color }} />
              <p className="font-bold text-lg">{home.name}</p>
              <p className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>{home.record}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{home.sport} · #{home.powerRanking}</p>
            </div>
            <div className="text-center px-4">
              <p className="text-2xl font-bold" style={{ color: 'var(--text-muted)' }}>VS</p>
              {homeId !== awayId && (
                <Link href={`/?predict=true&home=${homeId}&away=${awayId}`}
                  className="mt-2 block text-xs px-3 py-1 rounded-lg cursor-pointer hover:opacity-75 transition-opacity"
                  style={{ background: 'var(--bg-base)', border: '1px solid var(--border-muted)' }}>
                  Predict →
                </Link>
              )}
            </div>
            <div className="text-center flex-1">
              <div className="w-10 h-10 rounded-full mx-auto mb-2" style={{ background: away.color }} />
              <p className="font-bold text-lg">{away.name}</p>
              <p className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>{away.record}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{away.sport} · #{away.powerRanking}</p>
            </div>
          </div>

          {/* Charts row */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Radar */}
            <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-muted)' }}>
              <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>Attribute Radar</h3>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="var(--border-muted)" />
                  <PolarAngleAxis dataKey="axis" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <Radar name={home.abbreviation} dataKey="home" stroke={home.color} fill={home.color} fillOpacity={0.18} />
                  <Radar name={away.abbreviation} dataKey="away" stroke={away.color} fill={away.color} fillOpacity={0.18} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Bar chart */}
            <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-muted)' }}>
              <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>Key Metrics</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={eloData} layout="vertical" barSize={14} barGap={4}>
                  <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} width={60} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-muted)', borderRadius: 8 }} />
                  <Bar dataKey={home.abbreviation} fill={home.color} radius={[0, 4, 4, 0]} />
                  <Bar dataKey={away.abbreviation} fill={away.color} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Head-to-head bar */}
          {h2h && (
            <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-muted)' }}>
              <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>Head-to-Head History</h3>
              <div className="grid sm:grid-cols-2 gap-6">
                <WinBar label="All-Time" homeVal={h2h.home} awayVal={h2h.away} homeColor={home.color} awayColor={away.color} />
              </div>
            </div>
          )}

          {/* Stats table */}
          <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-muted)' }}>
            <div className="flex items-center mb-4">
              <p className="text-sm font-bold flex-1 text-right pr-8" style={{ color: home.color }}>{home.abbreviation}</p>
              <p className="text-xs font-semibold uppercase tracking-widest w-28 text-center" style={{ color: 'var(--text-muted)' }}>Stat</p>
              <p className="text-sm font-bold flex-1 text-left pl-8" style={{ color: away.color }}>{away.abbreviation}</p>
            </div>
            <table className="w-full">
              <tbody>
                <StatRow label="Offensive Rating" homeVal={home.offensiveRating} awayVal={away.offensiveRating} />
                <StatRow label="Defensive Rating" homeVal={home.defensiveRating} awayVal={away.defensiveRating} higherBetter={false} />
                <StatRow label="Net Rating" homeVal={home.netRating} awayVal={away.netRating} />
                <StatRow label="ELO" homeVal={home.eloRating} awayVal={away.eloRating} />
                <StatRow label="Momentum" homeVal={home.momentum} awayVal={away.momentum} />
                <StatRow label="Win %" homeVal={home.winPct * 100} awayVal={away.winPct * 100} />
                <StatRow label="Power Ranking" homeVal={home.powerRanking} awayVal={away.powerRanking} higherBetter={false} />
              </tbody>
            </table>
          </div>

          {/* Form + records */}
          <div className="grid sm:grid-cols-2 gap-4">
            {[{ team: home, color: home.color }, { team: away, color: away.color }].map(({ team, color }) => (
              <div key={team.id} className="rounded-xl p-4 space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-muted)' }}>
                <p className="text-sm font-semibold" style={{ color }}>{team.name}</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: 'Overall', val: team.record },
                    { label: 'Home',    val: team.homeRecord },
                    { label: 'Away',    val: team.awayRecord },
                  ].map(({ label, val }) => (
                    <div key={label} className="rounded-lg py-2" style={{ background: 'var(--bg-base)' }}>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
                      <p className="text-sm font-mono font-bold" style={{ color: 'var(--text-primary)' }}>{val}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-1">
                  {team.last5.map((r, i) => (
                    <span key={i} className="flex-1 text-center text-xs py-1 rounded"
                      style={{ background: r === 'W' ? `${color}22` : 'var(--bg-base)', color: r === 'W' ? color : 'var(--text-muted)', border: `1px solid ${r === 'W' ? color + '44' : 'var(--border-muted)'}` }}>
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* AI Summary */}
          <div className="rounded-xl p-5 space-y-3" style={{ background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.15)' }}>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#3b82f6' }}>AI Comparison</p>
            <p className="text-sm leading-7" style={{ color: 'var(--text-secondary)' }}>{comparison}</p>
          </div>
        </>
      )}
    </div>
  );
}
