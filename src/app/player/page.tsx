'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Activity, Search } from 'lucide-react';
import type { Sport } from '@/lib/types';

type PlayerStatus = 'Active' | 'Questionable' | 'Doubtful' | 'Out';

interface PlayerSummary {
  id: string;
  name: string;
  position: string;
  jersey: string;
  teamId: string;
  teamName: string;
  teamColor: string;
  sport: Sport;
  league: string;
  status: PlayerStatus;
}

function statusVariant(s: PlayerStatus) {
  if (s === 'Active')       return 'green'  as const;
  if (s === 'Questionable') return 'yellow' as const;
  if (s === 'Doubtful')     return 'yellow' as const;
  return 'red' as const;
}

const SPORT_ORDER: Sport[] = ['NFL', 'NBA', 'MLB', 'NHL', 'Soccer'];

export default function PlayersPage() {
  const [players, setPlayers]   = useState<PlayerSummary[]>([]);
  const [loading, setLoading]   = useState(true);
  const [sport,   setSport]     = useState<Sport | 'All'>('All');
  const [query,   setQuery]     = useState('');

  useEffect(() => {
    fetch('/api/players')
      .then(r => r.json())
      .then((d: { players: PlayerSummary[] }) => { setPlayers(d.players); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const sports = useMemo(() => {
    const seen = new Set<Sport>();
    for (const p of players) seen.add(p.sport);
    return SPORT_ORDER.filter(s => seen.has(s));
  }, [players]);

  const filtered = useMemo(() => {
    let list = players;
    if (sport !== 'All') list = list.filter(p => p.sport === sport);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.teamName.toLowerCase().includes(q) ||
        p.position.toLowerCase().includes(q) ||
        p.league.toLowerCase().includes(q)
      );
    }
    return list;
  }, [players, sport, query]);

  const countBySport = useMemo(() => {
    const m: Partial<Record<Sport | 'All', number>> = { All: players.length };
    for (const p of players) m[p.sport] = (m[p.sport] ?? 0) + 1;
    return m;
  }, [players]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-h1" style={{ color: 'var(--text-primary)' }}>Players</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
          {loading ? 'Loading live rosters…' : `${players.length.toLocaleString()} players across ${sports.length} sports`}
        </p>
      </div>

      {/* Search + sport filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name, team, position…"
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg outline-none"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-muted)', color: 'var(--text-primary)' }}
          />
        </div>
      </div>

      {/* Sport tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {(['All', ...sports] as (Sport | 'All')[]).map(s => (
          <button
            key={s}
            onClick={() => setSport(s)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            style={{
              background: sport === s ? 'var(--accent)' : 'var(--bg-elevated)',
              color:      sport === s ? '#fff' : 'var(--text-secondary)',
              border:     '1px solid ' + (sport === s ? 'var(--accent)' : 'var(--border-subtle)'),
            }}
          >
            {s} <span style={{ opacity: 0.7 }}>({countBySport[s] ?? 0})</span>
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="rounded-2xl p-4 animate-pulse" style={{ background: 'var(--bg-elevated)', height: 112 }} />
          ))}
        </div>
      )}

      {/* No results */}
      {!loading && filtered.length === 0 && (
        <p className="text-sm text-center py-12" style={{ color: 'var(--text-muted)' }}>
          No players found{query ? ` for "${query}"` : ''}.
        </p>
      )}

      {/* Player grid */}
      {!loading && filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map(player => (
            <Link key={player.id} href={`/player/${player.id}`} className="card-link">
              {/* Header row */}
              <div className="flex items-start gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
                  style={{ background: player.teamColor }}
                >
                  {player.jersey}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{player.name}</div>
                  <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                    {player.position} · {player.teamName}
                  </div>
                </div>
                <Badge variant={statusVariant(player.status)}>{player.status}</Badge>
              </div>

              {/* Sport + league chips */}
              <div className="flex items-center gap-2">
                <div
                  className="text-xs font-semibold px-2 py-0.5 rounded"
                  style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
                >
                  {player.sport}
                </div>
                {player.league !== player.sport && (
                  <div
                    className="text-xs px-2 py-0.5 rounded"
                    style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}
                  >
                    {player.league}
                  </div>
                )}
              </div>

              <div
                className="mt-3 pt-3 flex items-center gap-1.5"
                style={{ borderTop: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}
              >
                <Activity size={12} />
                <span className="text-xs">View profile</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <p className="mt-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
        {!loading && `Showing ${filtered.length.toLocaleString()} of ${players.length.toLocaleString()} players`}
      </p>
    </div>
  );
}
