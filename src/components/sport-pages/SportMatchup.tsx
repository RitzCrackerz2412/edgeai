'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { SPORT_CONFIGS, formatStat } from '@/lib/sports/config';
import type { SportConfig } from '@/lib/sports/config';
import { getTeamsBySport } from '@/lib/data/teams';
import type { Team } from '@/lib/types';

function TeamSearch({
  teams, value, onChange, exclude, label, color,
}: {
  teams: Team[]; value: string; onChange: (id: string) => void;
  exclude: string; label: string; color: string;
}) {
  const selected = teams.find(t => t.id === value) ?? null;
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const results = useMemo(() => {
    const filtered = teams.filter(t => t.id !== exclude);
    if (!q.trim()) return filtered.slice(0, 10);
    const lq = q.toLowerCase();
    return filtered.filter(t => t.name.toLowerCase().includes(lq) || (t.abbreviation ?? '').toLowerCase().includes(lq)).slice(0, 10);
  }, [q, teams, exclude]);

  return (
    <div ref={ref} className="relative">
      {selected ? (
        <div className="flex items-center gap-3 p-3 rounded-xl"
          style={{ background: 'var(--bg-elevated)', border: `2px solid ${selected.color}50` }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: `${selected.color}22`, color: selected.color }}>
            {selected.abbreviation?.slice(0, 3) ?? selected.name.slice(0, 3)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold truncate" style={{ color: 'var(--text-primary)' }}>{selected.name}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{selected.record} · #{selected.powerRanking}</p>
          </div>
          <button onClick={() => { onChange(''); setQ(''); }}
            className="w-6 h-6 rounded-full text-xs cursor-pointer flex items-center justify-center"
            style={{ background: 'var(--bg-base)', color: 'var(--text-muted)' }}>✕</button>
        </div>
      ) : (
        <input
          type="text" placeholder={`Search ${label}…`} value={q}
          onChange={e => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
          style={{ background: 'var(--bg-elevated)', border: `1px solid var(--border-default)`, color: 'var(--text-primary)' }}
        />
      )}
      {open && !selected && (
        <div className="absolute z-50 top-full mt-1 w-full rounded-xl shadow-xl overflow-y-auto"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', maxHeight: 280 }}>
          {results.map(t => (
            <button key={t.id} onMouseDown={() => { onChange(t.id); setOpen(false); setQ(''); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:opacity-75"
              style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold"
                style={{ background: `${t.color}22`, color: t.color }}>
                {t.abbreviation?.slice(0, 3) ?? t.name.slice(0, 3)}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{t.name}</p>
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{t.record} · {t.league}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function WinProbBar({ homeProb, drawProb, homeColor, awayColor, homeName, awayName }: {
  homeProb: number; drawProb?: number; homeColor: string; awayColor: string;
  homeName: string; awayName: string;
}) {
  const hp = Math.round(homeProb * 100);
  const dp = drawProb ? Math.round(drawProb * 100) : 0;
  const ap = 100 - hp - dp;
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs font-semibold">
        <span style={{ color: homeColor }}>{homeName}: {hp}%</span>
        {dp > 0 && <span style={{ color: 'var(--text-muted)' }}>Draw: {dp}%</span>}
        <span style={{ color: awayColor }}>{awayName}: {ap}%</span>
      </div>
      <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
        <div className="transition-all duration-700" style={{ width: `${hp}%`, background: homeColor }} />
        {dp > 0 && <div style={{ width: `${dp}%`, background: 'var(--text-muted)' }} />}
        <div className="transition-all duration-700" style={{ width: `${ap}%`, background: awayColor }} />
      </div>
    </div>
  );
}

export default function SportMatchup({ sportId }: { sportId: string }) {
  const config = SPORT_CONFIGS[sportId as keyof typeof SPORT_CONFIGS];
  const teams = useMemo(() => getTeamsBySport(config.sport), [config.sport]);
  const [homeId, setHomeId] = useState('');
  const [awayId, setAwayId] = useState('');

  const home = teams.find(t => t.id === homeId) ?? null;
  const away = teams.find(t => t.id === awayId) ?? null;

  const result = useMemo(() => {
    if (!home || !away) return null;
    return config.predict(home, away);
  }, [home, away, config]);

  const statCompare = useMemo(() => {
    if (!home || !away) return [];
    return config.teamStats.map(s => ({
      stat: s,
      homeVal: s.derive(home),
      awayVal: s.derive(away),
    }));
  }, [home, away, config]);

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {config.name} {config.competitorLabel} Matchup Predictor
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Sport-specific AI prediction with {config.matchupFactors.length} analytical factors
        </p>
      </div>

      {/* Selectors */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest mb-2"
            style={{ color: 'var(--text-muted)' }}>
            {config.isIndividual ? 'Fighter / Player A' : 'Home Team'}
          </label>
          <TeamSearch teams={teams} value={homeId} onChange={setHomeId}
            exclude={awayId} label={config.competitorLabel} color={config.color} />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest mb-2"
            style={{ color: 'var(--text-muted)' }}>
            {config.isIndividual ? 'Fighter / Player B' : 'Away Team'}
          </label>
          <TeamSearch teams={teams} value={awayId} onChange={setAwayId}
            exclude={homeId} label={config.competitorLabel} color={config.color} />
        </div>
      </div>

      {/* Empty state */}
      {!result && (
        <div className="rounded-2xl p-10 text-center"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
          <span className="text-5xl">{config.emoji}</span>
          <p className="text-lg font-semibold mt-4" style={{ color: 'var(--text-primary)' }}>
            Select two {config.competitorLabel.toLowerCase()}s to compare
          </p>
          <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
            EdgeAI uses {config.matchupFactors.length} sport-specific factors for {config.name} predictions
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {config.matchupFactors.map(f => (
              <span key={f.label} className="text-xs px-2.5 py-1 rounded-full"
                style={{ background: `${config.color}15`, color: config.color }}>
                {f.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {result && home && away && (
        <>
          {/* Win probability */}
          <div className="rounded-xl p-5 space-y-4"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Win Probability</h2>
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: `${config.color}15`, color: config.color }}>
                {result.confidence}% confidence
              </span>
            </div>
            <WinProbBar
              homeProb={result.homeWinProb} drawProb={result.drawProb}
              homeColor={home.color} awayColor={away.color}
              homeName={home.name} awayName={away.name}
            />
            {result.projectedScore && (
              <div className="flex justify-between text-center">
                <div>
                  <p className="text-2xl font-bold font-mono" style={{ color: home.color }}>{result.projectedScore.home}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{home.abbreviation ?? home.name}</p>
                </div>
                <div>
                  <p className="text-lg font-bold" style={{ color: 'var(--text-muted)' }}>vs</p>
                </div>
                <div>
                  <p className="text-2xl font-bold font-mono" style={{ color: away.color }}>{result.projectedScore.away}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{away.abbreviation ?? away.name}</p>
                </div>
              </div>
            )}
          </div>

          {/* Key factors */}
          <div className="rounded-xl p-5"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>
              Key Factors ({config.name}-Specific)
            </h2>
            <div className="space-y-2">
              {result.keyFactors.map(f => (
                <div key={f.label} className="flex items-center gap-3 py-2"
                  style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: f.side === 'home' ? home.color : f.side === 'away' ? away.color : 'var(--text-muted)' }}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{f.label}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{f.detail}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{
                      background: f.side === 'home' ? `${home.color}18` : f.side === 'away' ? `${away.color}18` : 'var(--bg-elevated)',
                      color: f.side === 'home' ? home.color : f.side === 'away' ? away.color : 'var(--text-muted)',
                    }}>
                    {f.side === 'home' ? home.abbreviation ?? home.name : f.side === 'away' ? away.abbreviation ?? away.name : 'Even'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Head-to-head stats */}
          <div className="rounded-xl p-5"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
            <div className="flex items-center mb-4">
              <p className="flex-1 text-right text-sm font-bold" style={{ color: home.color }}>{home.name}</p>
              <p className="w-32 text-center text-xs font-semibold uppercase tracking-widest"
                style={{ color: 'var(--text-muted)' }}>Stat</p>
              <p className="flex-1 text-sm font-bold" style={{ color: away.color }}>{away.name}</p>
            </div>
            <div className="space-y-0">
              {statCompare.map(({ stat, homeVal, awayVal }) => {
                const hNum = typeof homeVal === 'number' ? homeVal : parseFloat(homeVal);
                const aNum = typeof awayVal === 'number' ? awayVal : parseFloat(awayVal);
                const hWins = !isNaN(hNum) && !isNaN(aNum) && (stat.higherBetter ? hNum > aNum : hNum < aNum);
                const aWins = !isNaN(hNum) && !isNaN(aNum) && (stat.higherBetter ? aNum > hNum : aNum < hNum);
                return (
                  <div key={stat.key} className="flex items-center py-2.5"
                    style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <div className="flex-1 text-right pr-4">
                      <span className="text-sm font-mono font-bold"
                        style={{ color: hWins ? home.color : 'var(--text-secondary)', fontWeight: hWins ? 700 : 400 }}>
                        {formatStat(homeVal, stat.format)}
                      </span>
                    </div>
                    <div className="w-32 text-center">
                      <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{stat.description}</p>
                    </div>
                    <div className="flex-1 pl-4">
                      <span className="text-sm font-mono"
                        style={{ color: aWins ? away.color : 'var(--text-secondary)', fontWeight: aWins ? 700 : 400 }}>
                        {formatStat(awayVal, stat.format)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI analysis */}
          <div className="rounded-xl p-5 space-y-2"
            style={{ background: `${config.color}08`, border: `1px solid ${config.color}25` }}>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: config.color }}>
              EdgeAI {config.name} Analysis
            </p>
            <p className="text-sm leading-7" style={{ color: 'var(--text-secondary)' }}>
              {result.aiAnalysis}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
