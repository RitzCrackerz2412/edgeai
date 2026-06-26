'use client';

import { useState, useMemo } from 'react';
import type { Team } from '@/lib/types';

interface Props { teams: Team[] }

function eloWinProb(eloA: number, eloB: number) {
  return 1 / (1 + Math.pow(10, (eloB - eloA) / 400));
}

function confidence(delta: number) {
  // Map elo delta 0–400 → confidence 50–95
  return Math.min(95, Math.round(50 + (Math.abs(delta) / 400) * 45));
}

const SPORT_ORDER = ['NFL','NBA','MLB','NHL','Soccer','F1','UFC','Tennis','NCAA Football','NCAA Basketball'];

export function MatchupClient({ teams }: Props) {
  const [queryA, setQueryA] = useState('');
  const [queryB, setQueryB] = useState('');
  const [teamA, setTeamA] = useState<Team | null>(null);
  const [teamB, setTeamB] = useState<Team | null>(null);
  const [openA, setOpenA] = useState(false);
  const [openB, setOpenB] = useState(false);

  const sportsGroups = useMemo(() => {
    const map: Record<string, Team[]> = {};
    for (const t of teams) {
      if (!map[t.sport]) map[t.sport] = [];
      map[t.sport].push(t);
    }
    return SPORT_ORDER.filter(s => map[s]).map(s => ({ sport: s, teams: map[s] }));
  }, [teams]);

  const filteredA = useMemo(() => {
    if (!queryA.trim()) return [];
    const q = queryA.toLowerCase();
    return teams.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.abbreviation.toLowerCase().includes(q) ||
      t.league.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [teams, queryA]);

  const filteredB = useMemo(() => {
    if (!queryB.trim()) return [];
    const q = queryB.toLowerCase();
    return teams.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.abbreviation.toLowerCase().includes(q) ||
      t.league.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [teams, queryB]);

  const prediction = useMemo(() => {
    if (!teamA || !teamB) return null;
    const winProbA = eloWinProb(teamA.eloRating, teamB.eloRating);
    const winProbB = 1 - winProbA;
    const conf = confidence(teamA.eloRating - teamB.eloRating);
    const winner = winProbA >= 0.5 ? teamA : teamB;
    const loser  = winProbA >= 0.5 ? teamB : teamA;

    const factors: { label: string; favors: 'A' | 'B' | 'even'; detail: string }[] = [];
    if (Math.abs(teamA.eloRating - teamB.eloRating) > 30)
      factors.push({ label: 'ELO Rating', favors: teamA.eloRating > teamB.eloRating ? 'A' : 'B', detail: `${teamA.abbreviation} ${teamA.eloRating} vs ${teamB.abbreviation} ${teamB.eloRating}` });
    if (Math.abs(teamA.powerRanking - teamB.powerRanking) > 3)
      factors.push({ label: 'Power Ranking', favors: teamA.powerRanking < teamB.powerRanking ? 'A' : 'B', detail: `#${teamA.powerRanking} vs #${teamB.powerRanking}` });
    const offAdv = teamA.offensiveRating - teamB.offensiveRating;
    if (Math.abs(offAdv) > 2)
      factors.push({ label: 'Offensive Edge', favors: offAdv > 0 ? 'A' : 'B', detail: `${teamA.offensiveRating.toFixed(1)} vs ${teamB.offensiveRating.toFixed(1)}` });
    const defAdv = teamB.defensiveRating - teamA.defensiveRating;
    if (Math.abs(defAdv) > 2)
      factors.push({ label: 'Defensive Edge', favors: defAdv > 0 ? 'A' : 'B', detail: `${teamA.defensiveRating.toFixed(1)} vs ${teamB.defensiveRating.toFixed(1)}` });
    if (Math.abs(teamA.momentum - teamB.momentum) > 0.1)
      factors.push({ label: 'Momentum', favors: teamA.momentum > teamB.momentum ? 'A' : 'B', detail: `${(teamA.momentum * 100).toFixed(0)}% vs ${(teamB.momentum * 100).toFixed(0)}%` });
    if (Math.abs(teamA.winPct - teamB.winPct) > 0.05)
      factors.push({ label: 'Win Rate', favors: teamA.winPct > teamB.winPct ? 'A' : 'B', detail: `${(teamA.winPct * 100).toFixed(1)}% vs ${(teamB.winPct * 100).toFixed(1)}%` });

    return { winProbA, winProbB, conf, winner, loser, factors };
  }, [teamA, teamB]);

  return (
    <div className="space-y-8">

      {/* Team selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TeamPicker
          label="Team A"
          selected={teamA}
          query={queryA}
          open={openA}
          results={filteredA}
          sportsGroups={sportsGroups}
          onQueryChange={q => { setQueryA(q); setOpenA(true); }}
          onSelect={t => { setTeamA(t); setQueryA(t.name); setOpenA(false); }}
          onClear={() => { setTeamA(null); setQueryA(''); }}
          onFocus={() => setOpenA(true)}
          onBlur={() => setTimeout(() => setOpenA(false), 150)}
        />
        <TeamPicker
          label="Team B"
          selected={teamB}
          query={queryB}
          open={openB}
          results={filteredB}
          sportsGroups={sportsGroups}
          onQueryChange={q => { setQueryB(q); setOpenB(true); }}
          onSelect={t => { setTeamB(t); setQueryB(t.name); setOpenB(false); }}
          onClear={() => { setTeamB(null); setQueryB(''); }}
          onFocus={() => setOpenB(true)}
          onBlur={() => setTimeout(() => setOpenB(false), 150)}
        />
      </div>

      {/* Prediction */}
      {teamA && teamB && prediction && (
        <div className="space-y-6 anim-fade-in">

          {/* Win probability bar */}
          <div
            className="rounded-2xl p-5 space-y-4"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                Prediction
              </p>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: 'var(--accent-dim)', color: 'var(--accent-light)' }}
              >
                {prediction.conf}% confidence
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="text-right min-w-0 flex-1">
                <p className="text-lg font-bold truncate" style={{ color: teamA.color }}>{teamA.abbreviation}</p>
                <p className="text-2xl font-black">{(prediction.winProbA * 100).toFixed(1)}%</p>
              </div>
              <div
                className="text-xs font-bold px-3 py-1.5 rounded-lg shrink-0"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
              >
                vs
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-lg font-bold truncate" style={{ color: teamB.color }}>{teamB.abbreviation}</p>
                <p className="text-2xl font-black">{(prediction.winProbB * 100).toFixed(1)}%</p>
              </div>
            </div>

            {/* Bar */}
            <div className="h-3 rounded-full overflow-hidden flex" style={{ background: 'var(--bg-elevated)' }}>
              <div
                className="h-full transition-all duration-500"
                style={{ width: `${prediction.winProbA * 100}%`, background: teamA.color }}
              />
              <div
                className="h-full transition-all duration-500"
                style={{ width: `${prediction.winProbB * 100}%`, background: teamB.color }}
              />
            </div>

            <p className="text-sm text-center font-semibold" style={{ color: 'var(--text-primary)' }}>
              <span style={{ color: prediction.winner === teamA ? teamA.color : teamB.color }}>
                {prediction.winner.name}
              </span>{' '}
              projected to win
            </p>
          </div>

          {/* Stat comparison */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'ELO Rating',     a: teamA.eloRating,                   b: teamB.eloRating,                   fmt: (v: number) => v.toFixed(0), higherIsBetter: true },
              { label: 'Power Ranking',  a: teamA.powerRanking,                b: teamB.powerRanking,                fmt: (v: number) => `#${v}`,      higherIsBetter: false },
              { label: 'Win %',          a: teamA.winPct * 100,                b: teamB.winPct * 100,                fmt: (v: number) => `${v.toFixed(1)}%`, higherIsBetter: true },
              { label: 'Offense',        a: teamA.offensiveRating,             b: teamB.offensiveRating,             fmt: (v: number) => v.toFixed(1), higherIsBetter: true },
              { label: 'Defense',        a: teamA.defensiveRating,             b: teamB.defensiveRating,             fmt: (v: number) => v.toFixed(1), higherIsBetter: false },
              { label: 'Momentum',       a: teamA.momentum * 100,              b: teamB.momentum * 100,              fmt: (v: number) => `${v.toFixed(0)}%`, higherIsBetter: true },
            ].map(stat => (
              <StatComparison key={stat.label} stat={stat} teamA={teamA} teamB={teamB} />
            ))}
          </div>

          {/* Records */}
          <div className="grid grid-cols-2 gap-4">
            <RecordCard team={teamA} />
            <RecordCard team={teamB} />
          </div>

          {/* Factors */}
          {prediction.factors.length > 0 && (
            <div
              className="rounded-2xl p-5 space-y-3"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}
            >
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Key Factors</p>
              <div className="space-y-2">
                {prediction.factors.map(f => (
                  <div key={f.label} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: f.favors === 'A' ? teamA.color : f.favors === 'B' ? teamB.color : 'var(--text-muted)' }}
                      />
                      <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{f.label}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{f.detail}</span>
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{
                          background: f.favors === 'A' ? `${teamA.color}20` : f.favors === 'B' ? `${teamB.color}20` : 'var(--bg-elevated)',
                          color: f.favors === 'A' ? teamA.color : f.favors === 'B' ? teamB.color : 'var(--text-muted)',
                        }}
                      >
                        {f.favors === 'A' ? teamA.abbreviation : f.favors === 'B' ? teamB.abbreviation : 'EVEN'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {(!teamA || !teamB) && (
        <div
          className="rounded-2xl p-8 text-center space-y-2"
          style={{ background: 'var(--bg-elevated)', border: '1px dashed var(--border-subtle)' }}
        >
          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
            {!teamA && !teamB ? 'Select two teams above to generate a prediction' :
             !teamA ? 'Select Team A to continue' : 'Select Team B to continue'}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            500+ teams across all major leagues and sports
          </p>
        </div>
      )}
    </div>
  );
}

function TeamPicker({
  label, selected, query, open, results, sportsGroups,
  onQueryChange, onSelect, onClear, onFocus, onBlur,
}: {
  label: string;
  selected: Team | null;
  query: string;
  open: boolean;
  results: Team[];
  sportsGroups: { sport: string; teams: Team[] }[];
  onQueryChange: (q: string) => void;
  onSelect: (t: Team) => void;
  onClear: () => void;
  onFocus: () => void;
  onBlur: () => void;
}) {
  return (
    <div className="relative">
      <label className="block text-xs font-semibold mb-1.5 uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          value={query}
          placeholder="Search team or player…"
          onChange={e => onQueryChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          className="w-full text-sm rounded-xl px-3 py-2.5 pr-8 outline-none"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            color: 'var(--text-primary)',
          }}
        />
        {selected && (
          <button
            onMouseDown={e => { e.preventDefault(); onClear(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Clear"
          >
            ✕
          </button>
        )}
      </div>

      {/* Selected badge */}
      {selected && (
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: selected.color }} />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {selected.league} · {selected.record}
          </span>
        </div>
      )}

      {/* Dropdown */}
      {open && (
        <div
          className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden shadow-xl z-50 max-h-64 overflow-y-auto"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
        >
          {results.length > 0 ? (
            results.map(t => (
              <DropdownRow key={t.id} team={t} onSelect={onSelect} />
            ))
          ) : query.trim().length > 0 ? (
            <p className="px-3 py-2.5 text-xs" style={{ color: 'var(--text-muted)' }}>No results</p>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {sportsGroups.map(({ sport, teams }) => (
                <div key={sport}>
                  <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest sticky top-0"
                    style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                    {sport}
                  </p>
                  {teams.slice(0, 5).map(t => (
                    <DropdownRow key={t.id} team={t} onSelect={onSelect} />
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DropdownRow({ team, onSelect }: { team: Team; onSelect: (t: Team) => void }) {
  return (
    <button
      onMouseDown={e => { e.preventDefault(); onSelect(team); }}
      className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors cursor-pointer hover:opacity-75"
      style={{ borderBottom: '1px solid var(--border-subtle)' }}
    >
      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: team.color }} />
      <div className="min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{team.name}</p>
        <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
          {team.league} · {team.record}
        </p>
      </div>
      <span className="text-[10px] ml-auto shrink-0" style={{ color: 'var(--text-muted)' }}>
        #{team.powerRanking}
      </span>
    </button>
  );
}

function StatComparison({
  stat, teamA, teamB,
}: {
  stat: { label: string; a: number; b: number; fmt: (v: number) => string; higherIsBetter: boolean };
  teamA: Team;
  teamB: Team;
}) {
  const aWins = stat.higherIsBetter ? stat.a > stat.b : stat.a < stat.b;
  const bWins = stat.higherIsBetter ? stat.b > stat.a : stat.b < stat.a;

  return (
    <div
      className="rounded-xl p-3 space-y-1.5"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
        {stat.label}
      </p>
      <div className="flex items-center justify-between">
        <span
          className="text-sm font-bold"
          style={{ color: aWins ? teamA.color : 'var(--text-muted)' }}
        >
          {stat.fmt(stat.a)}
        </span>
        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>vs</span>
        <span
          className="text-sm font-bold"
          style={{ color: bWins ? teamB.color : 'var(--text-muted)' }}
        >
          {stat.fmt(stat.b)}
        </span>
      </div>
    </div>
  );
}

function RecordCard({ team }: { team: Team }) {
  return (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{ background: 'var(--bg-elevated)', border: `1px solid ${team.color}30` }}
    >
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-full" style={{ background: team.color }} />
        <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{team.name}</p>
      </div>
      <div className="grid grid-cols-3 gap-1 text-center">
        {[
          { label: 'Overall', value: team.record },
          { label: 'Home',    value: team.homeRecord },
          { label: 'Away',    value: team.awayRecord },
        ].map(r => (
          <div key={r.label}>
            <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{r.value}</p>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{r.label}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1">
        {team.last5.map((r, i) => (
          <span
            key={i}
            className="w-4 h-4 rounded-sm text-[9px] font-bold flex items-center justify-center"
            style={{
              background: r === 'W' ? '#22C55E' : r === 'D' ? '#F59E0B' : '#EF4444',
              color: '#fff',
            }}
          >{r}</span>
        ))}
      </div>
    </div>
  );
}
