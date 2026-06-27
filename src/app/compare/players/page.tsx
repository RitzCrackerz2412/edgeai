'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { PLAYER_DETAILS } from '@/lib/playerData';
import type { PlayerDetail } from '@/lib/playerData';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, Tooltip,
} from 'recharts';

const ALL_PLAYERS = Object.values(PLAYER_DETAILS);
const PLAYER_SPORTS = ['All', ...Array.from(new Set(ALL_PLAYERS.map(p => p.sport))).sort()];

function PlayerSelect({ value, onChange, exclude, sportFilter, id }: {
  value: string; onChange: (v: string) => void; exclude: string; sportFilter: string; id?: string;
}) {
  const visible = sportFilter === 'All'
    ? ALL_PLAYERS.filter(p => p.id !== exclude)
    : ALL_PLAYERS.filter(p => p.sport === sportFilter && p.id !== exclude);

  const grouped = visible.reduce<Record<string, PlayerDetail[]>>((acc, p) => {
    acc[p.sport] = [...(acc[p.sport] ?? []), p];
    return acc;
  }, {});

  return (
    <select
      id={id}
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full rounded-lg px-3 py-2 text-sm cursor-pointer outline-none"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-muted)', color: 'var(--text-primary)' }}
    >
      <option value="">— Select player —</option>
      {Object.entries(grouped).map(([sport, players]) => (
        <optgroup key={sport} label={sport}>
          {players.map(p => (
            <option key={p.id} value={p.id}>{p.name} · {p.position} · {p.teamName}</option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

function StatCompareRow({ label, aVal, bVal, aColor, bColor, higherBetter = true }: {
  label: string; aVal: number | string; bVal: number | string;
  aColor: string; bColor: string; higherBetter?: boolean;
}) {
  const aNum = typeof aVal === 'number' ? aVal : parseFloat(String(aVal));
  const bNum = typeof bVal === 'number' ? bVal : parseFloat(String(bVal));
  const aWins = !isNaN(aNum) && !isNaN(bNum) && (higherBetter ? aNum > bNum : aNum < bNum);
  const bWins = !isNaN(aNum) && !isNaN(bNum) && (higherBetter ? bNum > aNum : bNum < aNum);

  return (
    <tr style={{ borderBottom: '1px solid var(--border-muted)' }}>
      <td className="py-2 pr-4 text-right">
        <span className="text-sm font-mono" style={{ color: aWins ? aColor : 'var(--text-secondary)', fontWeight: aWins ? 700 : 400 }}>
          {typeof aVal === 'number' ? aVal.toFixed(1) : aVal}
        </span>
      </td>
      <td className="py-2 px-4 text-center text-xs" style={{ color: 'var(--text-muted)' }}>{label}</td>
      <td className="py-2 pl-4 text-left">
        <span className="text-sm font-mono" style={{ color: bWins ? bColor : 'var(--text-secondary)', fontWeight: bWins ? 700 : 400 }}>
          {typeof bVal === 'number' ? bVal.toFixed(1) : bVal}
        </span>
      </td>
    </tr>
  );
}

function genPlayerComparison(a: PlayerDetail, b: PlayerDetail): string {
  if (a.sport !== b.sport) {
    return `${a.name} (${a.sport}) and ${b.name} (${b.sport}) play different sports, making direct statistical comparison challenging. Both represent elite performers at their respective positions. ${a.name} brings ${a.experience} years of experience from ${a.college}, while ${b.name} has ${b.experience} years from ${b.college}.`;
  }

  const aTop = a.advancedStats.sort((x, y) => y.percentile - x.percentile)[0];
  const bTop = b.advancedStats.sort((x, y) => y.percentile - x.percentile)[0];
  const aConf = a.aiProjection.confidence;
  const bConf = b.aiProjection.confidence;

  return `Both ${a.name} and ${b.name} are elite ${a.sport} players at the ${a.position} and ${b.position} positions respectively. ${a.name}'s standout advanced metric is ${aTop?.label ?? 'overall impact'} (${aTop?.percentile ?? 0}th percentile), while ${b.name} leads in ${bTop?.label ?? 'consistency'} (${bTop?.percentile ?? 0}th percentile). EdgeAI projects ${a.name} to perform at ${aConf}% model confidence in the next game, versus ${bConf}% for ${b.name}. Age differential of ${Math.abs(a.age - b.age)} years favors ${a.age < b.age ? a.name : b.name} in terms of career longevity outlook.`;
}

export default function ComparePlayersPage() {
  const [sportFilter, setSportFilter] = useState('All');
  const [aId, setAId] = useState('pm-15');  // Mahomes
  const [bId, setBId] = useState(ALL_PLAYERS.find(p => p.id !== 'pm-15')?.id ?? '');

  const playerA = aId ? PLAYER_DETAILS[aId] : null;
  const playerB = bId ? PLAYER_DETAILS[bId] : null;

  const radarData = useMemo(() => {
    if (!playerA || !playerB) return [];
    // Merge radar keys
    const keysA = new Set(playerA.radarData.map(r => r.metric));
    const keysB = new Set(playerB.radarData.map(r => r.metric));
    const shared = [...keysA].filter(k => keysB.has(k));
    if (shared.length < 3) {
      // Fall back to first 5 from A padded with B
      const aMetrics = playerA.radarData.slice(0, 5);
      return aMetrics.map(r => ({
        axis: r.metric,
        [playerA.name]: r.value,
        [playerB.name]: playerB.radarData.find(x => x.metric === r.metric)?.value ?? 50,
      }));
    }
    return shared.map(k => ({
      axis: k,
      [playerA.name]: playerA.radarData.find(r => r.metric === k)!.value,
      [playerB.name]: playerB.radarData.find(r => r.metric === k)!.value,
    }));
  }, [playerA, playerB]);

  const seasonBarData = useMemo(() => {
    if (!playerA || !playerB) return [];
    // Compare first 4 season stats that both share
    const aKeys = playerA.seasonStats.map(s => s.label);
    const bKeys = playerB.seasonStats.map(s => s.label);
    const shared = aKeys.filter(k => bKeys.includes(k)).slice(0, 5);
    return shared.map(k => ({
      name: k,
      [playerA.name.split(' ')[1]]: parseFloat(String(playerA.seasonStats.find(s => s.label === k)!.value)) || 0,
      [playerB.name.split(' ')[1]]: parseFloat(String(playerB.seasonStats.find(s => s.label === k)!.value)) || 0,
    }));
  }, [playerA, playerB]);

  const comparison = playerA && playerB ? genPlayerComparison(playerA, playerB) : '';

  const colorA = playerA?.teamColor ?? '#3b82f6';
  const colorB = playerB?.teamColor ?? '#10b981';

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8 space-y-8" style={{ color: 'var(--text-primary)' }}>
      <div>
        <h1 className="text-2xl font-bold">Player Comparison</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Head-to-head analytics — career, season, advanced metrics
        </p>
      </div>

      {/* Sport filter tabs */}
      <div className="flex flex-wrap gap-2">
        {PLAYER_SPORTS.map(s => (
          <button key={s} onClick={() => { setSportFilter(s); setAId(''); setBId(''); }}
            className="px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer"
            style={{
              background: sportFilter === s ? 'var(--accent)' : 'var(--bg-card)',
              color: sportFilter === s ? '#fff' : 'var(--text-secondary)',
              border: '1px solid var(--border-muted)',
            }}>
            {s}
          </button>
        ))}
      </div>

      {/* Selectors */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="player-a-select" className="block text-xs font-medium mb-2 uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Player A</label>
          <PlayerSelect id="player-a-select" value={aId} onChange={setAId} exclude={bId} sportFilter={sportFilter} />
        </div>
        <div>
          <label htmlFor="player-b-select" className="block text-xs font-medium mb-2 uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Player B</label>
          <PlayerSelect id="player-b-select" value={bId} onChange={setBId} exclude={aId} sportFilter={sportFilter} />
        </div>
      </div>

      {playerA && playerB && (
        <>
          {/* Header */}
          <div className="grid sm:grid-cols-2 gap-4">
            {[{ p: playerA, color: colorA }, { p: playerB, color: colorB }].map(({ p, color }) => (
              <Link key={p.id} href={`/player/${p.id}`}
                className="rounded-2xl p-5 flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity"
                style={{ background: 'var(--bg-card)', border: `2px solid ${color}44` }}>
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0"
                  style={{ background: `${color}22`, color }}>
                  {p.number}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-lg truncate" style={{ color: 'var(--text-primary)' }}>{p.name}</p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{p.position} · {p.teamName}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Age {p.age} · {p.experience} yr exp · {p.status}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid md:grid-cols-2 gap-6">
            {radarData.length >= 3 && (
              <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-muted)' }}>
                <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>Attribute Radar</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="var(--border-muted)" />
                    <PolarAngleAxis dataKey="axis" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                    <Radar name={playerA.name} dataKey={playerA.name} stroke={colorA} fill={colorA} fillOpacity={0.18} />
                    <Radar name={playerB.name} dataKey={playerB.name} stroke={colorB} fill={colorB} fillOpacity={0.18} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}

            {seasonBarData.length > 0 && (
              <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-muted)' }}>
                <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>Season Stats</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={seasonBarData} layout="vertical" barSize={12} barGap={3}>
                    <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} width={65} />
                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-muted)', borderRadius: 8 }} />
                    <Bar dataKey={playerA.name.split(' ')[1]} fill={colorA} radius={[0, 4, 4, 0]} />
                    <Bar dataKey={playerB.name.split(' ')[1]} fill={colorB} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Career stats comparison */}
          {(() => {
            const aKeys = playerA.careerStats.map(s => s.label);
            const bKeys = playerB.careerStats.map(s => s.label);
            const shared = aKeys.filter(k => bKeys.includes(k));
            if (shared.length === 0) return null;
            return (
              <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-muted)' }}>
                <div className="flex items-center mb-4">
                  <p className="flex-1 text-right text-sm font-bold pr-8" style={{ color: colorA }}>{playerA.name.split(' ').pop()}</p>
                  <p className="w-32 text-center text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Career Stat</p>
                  <p className="flex-1 text-left text-sm font-bold pl-8" style={{ color: colorB }}>{playerB.name.split(' ').pop()}</p>
                </div>
                <table className="w-full">
                  <tbody>
                    {shared.slice(0, 6).map(k => (
                      <StatCompareRow
                        key={k} label={k}
                        aVal={playerA.careerStats.find(s => s.label === k)!.value}
                        bVal={playerB.careerStats.find(s => s.label === k)!.value}
                        aColor={colorA} bColor={colorB}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}

          {/* Advanced stats */}
          <div className="grid sm:grid-cols-2 gap-4">
            {[{ p: playerA, color: colorA }, { p: playerB, color: colorB }].map(({ p, color }) => (
              <div key={p.id} className="rounded-xl p-5 space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-muted)' }}>
                <p className="text-sm font-semibold" style={{ color }}>{p.name} — Advanced</p>
                <div className="space-y-2">
                  {p.advancedStats.slice(0, 5).map(s => (
                    <div key={s.label} className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
                        <div className="mt-0.5 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-base)' }}>
                          <div style={{ width: `${s.percentile}%`, background: color, height: '100%' }} />
                        </div>
                      </div>
                      <span className="text-xs font-mono w-10 text-right" style={{ color: 'var(--text-secondary)' }}>
                        {s.percentile}th
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* AI Comparison */}
          <div className="rounded-xl p-5 space-y-3"
            style={{ background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.15)' }}>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#3b82f6' }}>AI Comparison</p>
            <p className="text-sm leading-7" style={{ color: 'var(--text-secondary)' }}>{comparison}</p>
          </div>

          {/* Next game projections */}
          <div className="grid sm:grid-cols-2 gap-4">
            {[{ p: playerA, color: colorA }, { p: playerB, color: colorB }].map(({ p, color }) => (
              <div key={p.id} className="rounded-xl p-5 space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-muted)' }}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold" style={{ color }}>{`${p.name.split(' ')[0]}'s Next Game`}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${color}18`, color }}>
                    {p.aiProjection.confidence}% confidence
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {p.aiProjection.projectedStats.slice(0, 4).map(s => (
                    <div key={s.label} className="rounded-lg px-3 py-2" style={{ background: 'var(--bg-base)' }}>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
                      <p className="text-sm font-bold font-mono" style={{ color }}>{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
