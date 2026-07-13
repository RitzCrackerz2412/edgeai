'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { PLAYER_DETAILS } from '@/lib/playerData';
import type { PlayerDetail } from '@/lib/playerData';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, Tooltip,
} from 'recharts';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PlayerSummary {
  id: string;
  name: string;
  position: string;
  jersey: string;
  teamId: string;
  teamName: string;
  teamColor: string;
  sport: string;
  league: string;
  status: string;
}

// ── Static fallback data ───────────────────────────────────────────────────────

const STATIC_PLAYERS = Object.values(PLAYER_DETAILS);
const ALL_SPORTS = ['All', 'NFL', 'NBA', 'MLB', 'NHL', 'Soccer', 'NCAA Football', 'NCAA Basketball', 'UFC', 'Boxing', 'Tennis', 'Formula 1', 'Cricket', 'Esports'];
const ESPN_SPORTS = new Set(['NFL', 'NBA', 'MLB', 'NHL']);

// Sports that use full ESPN rosters
const SPORT_DESCRIPTIONS: Record<string, string> = {
  NFL: '~1,800 active players',
  NBA: '~450 active players',
  MLB: '~750 active players',
  NHL: '~700 active players',
  Soccer: 'Select athletes',
  'NCAA Football': 'Select athletes',
  'NCAA Basketball': 'Select athletes',
  UFC: 'Select athletes',
  Boxing: 'Select athletes',
  Tennis: 'Select athletes',
  'Formula 1': 'Select athletes',
  Cricket: 'Select athletes',
  Esports: 'Select athletes',
};

// ── Spinner ───────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <span className="inline-block w-4 h-4 border-2 rounded-full animate-spin"
      style={{ borderColor: 'var(--accent) var(--accent) transparent transparent' }} />
  );
}

// ── Player search with autocomplete ───────────────────────────────────────────

function PlayerSearch({ value, onChange, exclude, players, loading, label }: {
  value: string;
  onChange: (v: string) => void;
  exclude: string;
  players: PlayerSummary[];
  loading: boolean;
  label: string;
}) {
  const selected = players.find(p => p.id === value) ?? null;
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return players.filter(p => p.id !== exclude).slice(0, 12);
    return players
      .filter(p => p.id !== exclude && (
        p.name.toLowerCase().includes(q) ||
        p.teamName.toLowerCase().includes(q) ||
        p.position.toLowerCase().includes(q) ||
        p.sport.toLowerCase().includes(q)
      ))
      .slice(0, 12);
  }, [query, players, exclude]);

  function select(id: string) {
    onChange(id);
    setOpen(false);
    setQuery('');
  }

  function clear() {
    onChange('');
    setQuery('');
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  return (
    <div ref={wrapRef} className="relative">
      {selected ? (
        <div className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm"
          style={{ background: 'var(--bg-card)', border: `1.5px solid ${selected.teamColor}55`, color: 'var(--text-primary)' }}>
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
            style={{ background: `${selected.teamColor}25`, color: selected.teamColor }}>
            {selected.jersey !== '—' ? selected.jersey.slice(0, 2) : selected.position.slice(0, 1)}
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-semibold">{selected.name}</span>
            <span className="ml-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
              {selected.position} · {selected.teamName}
            </span>
          </div>
          <button onClick={clear} aria-label="Clear selection"
            className="ml-1 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs cursor-pointer transition-colors"
            style={{ color: 'var(--text-muted)', background: 'var(--bg-base)' }}>
            ✕
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            placeholder={loading ? `Loading ${label}…` : `Search ${label}…`}
            value={query}
            disabled={loading}
            onChange={e => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
          />
          {loading && (
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2">
              <Spinner />
            </span>
          )}
        </div>
      )}

      {open && !selected && !loading && (
        <div className="absolute z-50 mt-1 w-full rounded-xl shadow-xl overflow-hidden"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', maxHeight: '320px', overflowY: 'auto' }}>
          {results.length === 0 ? (
            <div className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>No players found</div>
          ) : results.map(p => (
            <button key={p.id} onMouseDown={() => select(p.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left cursor-pointer transition-colors hover:opacity-80"
              style={{ borderBottom: '1px solid var(--border-default)' }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                style={{ background: `${p.teamColor}22`, color: p.teamColor }}>
                {p.jersey !== '—' ? p.jersey.slice(0, 2) : p.position.slice(0, 1)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{p.name}</p>
                <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
                  {p.position} · {p.teamName}
                </p>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0"
                style={{ background: 'var(--bg-base)', color: 'var(--text-muted)' }}>
                {p.sport}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Stat compare row ───────────────────────────────────────────────────────────

function StatCompareRow({ label, aVal, bVal, aColor, bColor, higherBetter = true }: {
  label: string; aVal: number | string; bVal: number | string;
  aColor: string; bColor: string; higherBetter?: boolean;
}) {
  const aNum = typeof aVal === 'number' ? aVal : parseFloat(String(aVal));
  const bNum = typeof bVal === 'number' ? bVal : parseFloat(String(bVal));
  const aWins = !isNaN(aNum) && !isNaN(bNum) && (higherBetter ? aNum > bNum : aNum < bNum);
  const bWins = !isNaN(aNum) && !isNaN(bNum) && (higherBetter ? bNum > aNum : bNum < aNum);

  return (
    <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
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
    return `${a.name} (${a.sport}) and ${b.name} (${b.sport}) play different sports — direct statistical comparison is challenging. ${a.name} brings ${a.experience} years of experience${a.college !== '—' ? ` from ${a.college}` : ''}, while ${b.name} has ${b.experience} years${b.college !== '—' ? ` from ${b.college}` : ''}.`;
  }
  const aTop = [...a.advancedStats].sort((x, y) => y.percentile - x.percentile)[0];
  const bTop = [...b.advancedStats].sort((x, y) => y.percentile - x.percentile)[0];
  return `Both ${a.name} and ${b.name} are elite ${a.sport} players at the ${a.position} and ${b.position} positions. ${a.name}'s standout attribute is ${aTop?.label ?? 'overall impact'} (${aTop?.percentile ?? 0}th percentile), while ${b.name} leads in ${bTop?.label ?? 'consistency'} (${bTop?.percentile ?? 0}th percentile). EdgeAI projects ${a.name} at ${a.aiProjection.confidence}% model confidence vs. ${b.aiProjection.confidence}% for ${b.name}. Age differential of ${Math.abs(a.age - b.age)} years favors ${a.age < b.age ? a.name : b.name} in career longevity.`;
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ComparePlayersPage() {
  const [sportFilter, setSportFilter] = useState('All');
  const [aId, setAId] = useState('');
  const [bId, setBId] = useState('');

  // Dynamic roster for current sport
  const [roster, setRoster] = useState<PlayerSummary[]>([]);
  const [rosterLoading, setRosterLoading] = useState(false);

  // Player detail for comparison (fetched or static)
  const [playerA, setPlayerA] = useState<PlayerDetail | null>(null);
  const [playerB, setPlayerB] = useState<PlayerDetail | null>(null);
  const [detailLoadingA, setDetailLoadingA] = useState(false);
  const [detailLoadingB, setDetailLoadingB] = useState(false);

  // ── Load roster when sport changes ──────────────────────────────────────────
  const fetchRoster = useCallback(async (sport: string) => {
    if (sport === 'All') {
      // Show all static players grouped by sport
      setRoster(STATIC_PLAYERS.map(p => ({
        id: p.id, name: p.name, position: p.position, jersey: p.number,
        teamId: p.teamId, teamName: p.teamName, teamColor: p.teamColor,
        sport: p.sport, league: p.sport, status: p.status,
      })));
      return;
    }

    setRosterLoading(true);
    try {
      const res = await fetch(`/api/players?sport=${encodeURIComponent(sport)}`);
      const data = await res.json();
      if (data.players?.length > 0) {
        setRoster(data.players);
      } else {
        // Fallback to static for this sport
        setRoster(STATIC_PLAYERS
          .filter(p => p.sport === sport)
          .map(p => ({
            id: p.id, name: p.name, position: p.position, jersey: p.number,
            teamId: p.teamId, teamName: p.teamName, teamColor: p.teamColor,
            sport: p.sport, league: p.sport, status: p.status,
          })));
      }
    } catch {
      setRoster(STATIC_PLAYERS
        .filter(p => p.sport === sport)
        .map(p => ({
          id: p.id, name: p.name, position: p.position, jersey: p.number,
          teamId: p.teamId, teamName: p.teamName, teamColor: p.teamColor,
          sport: p.sport, league: p.sport, status: p.status,
        })));
    } finally {
      setRosterLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard data-fetch pattern
    fetchRoster(sportFilter);
  }, [sportFilter, fetchRoster]);

  // ── Fetch player detail ──────────────────────────────────────────────────────
  const fetchDetail = useCallback(async (
    id: string,
    sport: string,
    rosterRef: PlayerSummary[],
    setPlayer: (p: PlayerDetail | null) => void,
    setLoading: (b: boolean) => void,
  ) => {
    if (!id) { setPlayer(null); return; }

    // Static player
    if (PLAYER_DETAILS[id]) {
      setPlayer(PLAYER_DETAILS[id]);
      return;
    }

    // ESPN player
    if (id.startsWith('espn-') && ESPN_SPORTS.has(sport)) {
      const espnId = id.replace('espn-', '');
      const rosterEntry = rosterRef.find(p => p.id === id);
      const teamName = rosterEntry?.teamName ?? '';
      const teamColor = rosterEntry?.teamColor ?? '';
      setLoading(true);
      try {
        const params = new URLSearchParams({ id: espnId, sport });
        if (teamName) params.set('teamName', teamName);
        if (teamColor) params.set('teamColor', teamColor);
        const res = await fetch(`/api/espn/athlete?${params}`);
        const data = await res.json();
        if (data.player) setPlayer(data.player);
        else setPlayer(null);
      } catch {
        setPlayer(null);
      } finally {
        setLoading(false);
      }
      return;
    }

    setPlayer(null);
  }, []);

  // Derive sport for detail fetch from current roster
  const sportForId = useCallback((id: string): string => {
    if (sportFilter !== 'All') return sportFilter;
    const p = roster.find(r => r.id === id);
    return p?.sport ?? '';
  }, [sportFilter, roster]);

  useEffect(() => {
    fetchDetail(aId, sportForId(aId), roster, setPlayerA, setDetailLoadingA);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aId]);

  useEffect(() => {
    fetchDetail(bId, sportForId(bId), roster, setPlayerB, setDetailLoadingB);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bId]);

  // ── Derived data ─────────────────────────────────────────────────────────────
  const radarData = useMemo(() => {
    if (!playerA || !playerB) return [];
    const keysA = new Set(playerA.radarData.map(r => r.metric));
    const keysB = new Set(playerB.radarData.map(r => r.metric));
    const shared = [...keysA].filter(k => keysB.has(k));
    if (shared.length < 3) {
      return playerA.radarData.slice(0, 6).map(r => ({
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
    const aKeys = playerA.seasonStats.map(s => s.label);
    const bKeys = playerB.seasonStats.map(s => s.label);
    const shared = aKeys.filter(k => bKeys.includes(k)).slice(0, 6);
    return shared.map(k => ({
      name: k,
      [playerA.name.split(' ').pop()!]: parseFloat(String(playerA.seasonStats.find(s => s.label === k)!.value)) || 0,
      [playerB.name.split(' ').pop()!]: parseFloat(String(playerB.seasonStats.find(s => s.label === k)!.value)) || 0,
    }));
  }, [playerA, playerB]);

  const comparison = playerA && playerB ? genPlayerComparison(playerA, playerB) : '';
  const colorA = playerA?.teamColor ?? '#3b82f6';
  const colorB = playerB?.teamColor ?? '#10b981';

  const rosterCount = roster.length;

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8 space-y-8" style={{ color: 'var(--text-primary)' }}>
      <div>
        <h1 className="text-2xl font-bold">Player Comparison</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Head-to-head analytics — full rosters, live stats, career &amp; season metrics
        </p>
      </div>

      {/* Sport filter tabs */}
      <div className="flex flex-wrap gap-2">
        {ALL_SPORTS.map(s => (
          <button key={s} onClick={() => { setSportFilter(s); setAId(''); setBId(''); }}
            className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
            style={{
              background: sportFilter === s ? 'var(--accent)' : 'var(--bg-card)',
              color: sportFilter === s ? '#fff' : 'var(--text-secondary)',
              border: `1px solid ${sportFilter === s ? 'var(--accent)' : 'var(--border-default)'}`,
            }}>
            {s}
            {s !== 'All' && ESPN_SPORTS.has(s) && (
              <span className="text-[10px] opacity-70">Full</span>
            )}
          </button>
        ))}
      </div>

      {/* Selectors */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="flex items-center gap-2 text-xs font-medium mb-2 uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            Player A
            {detailLoadingA && <Spinner />}
          </label>
          <PlayerSearch
            value={aId}
            onChange={setAId}
            exclude={bId}
            players={roster}
            loading={rosterLoading}
            label="player A"
          />
        </div>
        <div>
          <label className="flex items-center gap-2 text-xs font-medium mb-2 uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            Player B
            {detailLoadingB && <Spinner />}
          </label>
          <PlayerSearch
            value={bId}
            onChange={setBId}
            exclude={aId}
            players={roster}
            loading={rosterLoading}
            label="player B"
          />
        </div>
      </div>

      {/* Roster info bar */}
      {sportFilter !== 'All' && (
        <div className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-xs"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-muted)' }}>
          {rosterLoading ? (
            <><Spinner /><span>Loading {sportFilter} roster…</span></>
          ) : (
            <>
              <span className="font-semibold" style={{ color: 'var(--accent)' }}>{rosterCount.toLocaleString()}</span>
              <span>{sportFilter} players loaded</span>
              {ESPN_SPORTS.has(sportFilter) && (
                <span className="ml-auto px-2 py-0.5 rounded-full text-[10px]"
                  style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--accent)' }}>
                  Live ESPN Roster
                </span>
              )}
            </>
          )}
        </div>
      )}

      {/* Empty state */}
      {!playerA && !playerB && !detailLoadingA && !detailLoadingB && (
        <div className="rounded-2xl p-10 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
          <p className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Select two players to compare
          </p>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
            Full rosters from ESPN for NFL, NBA, MLB, NHL · Select athletes for all other sports
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
            {['NFL', 'NBA', 'MLB', 'NHL'].map(s => (
              <button key={s} onClick={() => setSportFilter(s)}
                className="rounded-xl px-4 py-3 text-left cursor-pointer transition-colors"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{s}</p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--accent)' }}>{SPORT_DESCRIPTIONS[s]}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading detail state */}
      {(detailLoadingA || detailLoadingB) && (
        <div className="rounded-xl p-8 flex items-center justify-center gap-3"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
          <Spinner />
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Fetching player stats from ESPN…
          </span>
        </div>
      )}

      {playerA && playerB && (
        <>
          {/* Header cards */}
          <div className="grid sm:grid-cols-2 gap-4">
            {[{ p: playerA, color: colorA }, { p: playerB, color: colorB }].map(({ p, color }) => (
              <div key={p.id}
                className="rounded-2xl p-5 flex items-center gap-4"
                style={{ background: 'var(--bg-card)', border: `2px solid ${color}44` }}>
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0"
                  style={{ background: `${color}22`, color }}>
                  {p.number !== '—' ? p.number : p.position}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-lg truncate" style={{ color: 'var(--text-primary)' }}>{p.name}</p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{p.position} · {p.teamName}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Age {p.age} · {p.experience} yr exp
                    {p.college && p.college !== '—' ? ` · ${p.college}` : ''}
                    {' · '}<span style={{ color: p.status === 'Active' ? '#22c55e' : '#f59e0b' }}>{p.status}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid md:grid-cols-2 gap-6">
            {radarData.length >= 3 && (
              <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
                <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>Attribute Radar</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="var(--border-default)" />
                    <PolarAngleAxis dataKey="axis" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                    <Radar name={playerA.name} dataKey={playerA.name} stroke={colorA} fill={colorA} fillOpacity={0.18} />
                    <Radar name={playerB.name} dataKey={playerB.name} stroke={colorB} fill={colorB} fillOpacity={0.18} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}

            {seasonBarData.length > 0 && (
              <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
                <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>Season Stats</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={seasonBarData} layout="vertical" barSize={12} barGap={3}>
                    <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} width={80} />
                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 8 }} />
                    <Bar dataKey={playerA.name.split(' ').pop()!} fill={colorA} radius={[0, 4, 4, 0]} />
                    <Bar dataKey={playerB.name.split(' ').pop()!} fill={colorB} radius={[0, 4, 4, 0]} />
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
              <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
                <div className="flex items-center mb-4">
                  <p className="flex-1 text-right text-sm font-bold pr-8" style={{ color: colorA }}>{playerA.name.split(' ').pop()}</p>
                  <p className="w-36 text-center text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Career Stat</p>
                  <p className="flex-1 text-left text-sm font-bold pl-8" style={{ color: colorB }}>{playerB.name.split(' ').pop()}</p>
                </div>
                <table className="w-full">
                  <tbody>
                    {shared.map(k => (
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

          {/* Season stats comparison — full row */}
          {(() => {
            const aKeys = playerA.seasonStats.map(s => s.label);
            const bKeys = playerB.seasonStats.map(s => s.label);
            const shared = aKeys.filter(k => bKeys.includes(k));
            if (shared.length === 0) return null;
            return (
              <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
                <div className="flex items-center mb-4">
                  <p className="flex-1 text-right text-sm font-bold pr-8" style={{ color: colorA }}>{playerA.name.split(' ').pop()}</p>
                  <p className="w-36 text-center text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>2024 Season</p>
                  <p className="flex-1 text-left text-sm font-bold pl-8" style={{ color: colorB }}>{playerB.name.split(' ').pop()}</p>
                </div>
                <table className="w-full">
                  <tbody>
                    {shared.map(k => (
                      <StatCompareRow
                        key={k} label={k}
                        aVal={playerA.seasonStats.find(s => s.label === k)!.value}
                        bVal={playerB.seasonStats.find(s => s.label === k)!.value}
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
              <div key={p.id} className="rounded-xl p-5 space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
                <p className="text-sm font-semibold" style={{ color }}>{p.name} — Advanced</p>
                <div className="space-y-2">
                  {p.advancedStats.map(s => (
                    <div key={s.label} className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
                        <div className="mt-0.5 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-base)' }}>
                          <div style={{ width: `${Math.min(100, s.percentile)}%`, background: color, height: '100%' }} />
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
              <div key={p.id} className="rounded-xl p-5 space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold" style={{ color }}>{`${p.name.split(' ')[0]}'s Projection`}</p>
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
                {p.aiProjection.factors.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {p.aiProjection.factors.slice(0, 3).map(f => (
                      <span key={f} className="text-[10px] px-2 py-0.5 rounded-full"
                        style={{ background: `${color}12`, color }}>
                        {f}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
