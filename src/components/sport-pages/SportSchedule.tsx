'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SPORT_CONFIGS } from '@/lib/sports/config';
import type { Game } from '@/lib/types';

// ── Status helpers ────────────────────────────────────────────────────────────

function isFinal(s: Game['status']) {
  return s === 'Final' || s === 'Final/OT' || s === 'Final/SO';
}
function isLive(s: Game['status']) {
  return s === 'Live' || s === 'Halftime';
}

// ── Date display ──────────────────────────────────────────────────────────────

function safeDate(game: Game): Date {
  return game.scheduledAt ? new Date(game.scheduledAt) : new Date(game.date + 'T00:00:00');
}

function groupKey(game: Game, now: Date): string {
  const d = safeDate(game);
  if (isLive(game.status)) return '__live__';
  if (isFinal(game.status) || game.status === 'Postponed' || game.status === 'Cancelled') {
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/New_York' });
  }
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const gameDay = new Date(d);
  gameDay.setHours(0, 0, 0, 0);
  const diff = Math.round((gameDay.getTime() - today.getTime()) / 86_400_000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/New_York' });
}

// ── Row component ─────────────────────────────────────────────────────────────

function MatchRow({ game, color, slug }: { game: Game; color: string; slug: string }) {
  const showScore = (isFinal(game.status) || isLive(game.status))
    && game.homeScore !== undefined && game.awayScore !== undefined;

  const timeStr = game.scheduledAt
    ? new Date(game.scheduledAt).toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'America/New_York',
      })
    : game.time.replace(' ET', '');

  const homeLeads = showScore && game.homeScore! > game.awayScore!;
  const awayLeads = showScore && game.awayScore! > game.homeScore!;

  return (
    <div
      className="rounded-xl p-3 flex items-center gap-3"
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${isLive(game.status) ? color + '40' : 'var(--border-default)'}`,
      }}
    >
      {/* Status / Time */}
      <div className="w-14 text-center flex-shrink-0">
        {isLive(game.status) ? (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded animate-pulse"
            style={{ background: '#ef444420', color: '#ef4444' }}>
            LIVE{game.period ? ` P${game.period}` : ''}
          </span>
        ) : isFinal(game.status) ? (
          <span className="text-xs font-semibold" style={{ color: '#6ee7b7' }}>{game.status}</span>
        ) : game.status === 'Postponed' ? (
          <span className="text-[10px]" style={{ color: '#fcd34d' }}>PPD</span>
        ) : game.status === 'Cancelled' ? (
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>CANC</span>
        ) : (
          <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{timeStr}</span>
        )}
      </div>

      {/* Home team */}
      <div className="flex-1 flex items-center justify-end gap-2">
        <span
          className="text-sm font-semibold truncate"
          style={{ color: homeLeads ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: homeLeads ? 700 : 500 }}
        >
          {game.homeTeam.name}
        </span>
        <div
          className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-bold"
          style={{ background: `${game.homeTeam.color}22`, color: game.homeTeam.color }}
        >
          {game.homeTeam.abbreviation.slice(0, 3)}
        </div>
      </div>

      {/* Score / VS */}
      <div className="w-20 text-center flex-shrink-0">
        {showScore ? (
          <span className="text-sm font-bold font-mono" style={{ color: 'var(--text-primary)' }}>
            {game.homeScore} – {game.awayScore}
          </span>
        ) : (
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>vs</span>
        )}
      </div>

      {/* Away team */}
      <div className="flex-1 flex items-center gap-2">
        <div
          className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-bold"
          style={{ background: `${game.awayTeam.color}22`, color: game.awayTeam.color }}
        >
          {game.awayTeam.abbreviation.slice(0, 3)}
        </div>
        <span
          className="text-sm font-semibold truncate"
          style={{ color: awayLeads ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: awayLeads ? 700 : 500 }}
        >
          {game.awayTeam.name}
        </span>
      </div>

      {/* Predict link */}
      <Link
        href={`/${slug}/matchup`}
        className="text-xs px-2 py-1 rounded-lg flex-shrink-0 transition-opacity hover:opacity-80"
        style={{ background: `${color}15`, color }}
      >
        Predict
      </Link>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

// Sports covered by the ESPN provider (can use real data)
const ESPN_SPORTS = ['nfl', 'nba', 'mlb', 'nhl', 'soccer', 'ncaaf', 'ncaab'];

export default function SportSchedule({ sportId }: { sportId: string }) {
  const config = SPORT_CONFIGS[sportId as keyof typeof SPORT_CONFIGS];
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'live' | 'final'>('all');
  const now = new Date();

  const hasLiveData = ESPN_SPORTS.includes(sportId);

  useEffect(() => {
    if (!hasLiveData) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    fetch(`/api/games?sport=${encodeURIComponent(config.sport)}&days=7`)
      .then(r => r.json())
      .then(data => {
        if (data.ok) setGames(data.games ?? []);
        else setError(data.error ?? 'Failed to load schedule');
      })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false));
  }, [config.sport, hasLiveData]);

  // Group by display date
  const grouped = new Map<string, Game[]>();
  const order: string[] = [];

  const filtered = games.filter(g => {
    if (filter === 'upcoming') return !isFinal(g.status) && !isLive(g.status) && g.status !== 'Cancelled';
    if (filter === 'live')     return isLive(g.status);
    if (filter === 'final')    return isFinal(g.status);
    return g.status !== 'Cancelled';
  });

  // Live games first
  const liveGames = filtered.filter(g => isLive(g.status));
  const rest = filtered.filter(g => !isLive(g.status)).sort(
    (a, b) => (a.scheduledAt ?? a.date).localeCompare(b.scheduledAt ?? b.date),
  );

  if (liveGames.length > 0) {
    grouped.set('__live__', liveGames);
    order.push('__live__');
  }
  for (const g of rest) {
    const key = groupKey(g, now);
    if (!grouped.has(key)) { grouped.set(key, []); order.push(key); }
    grouped.get(key)!.push(g);
  }

  const liveCount = games.filter(g => isLive(g.status)).length;

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {config.name} Schedule
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {hasLiveData
            ? `Live ESPN data · ${games.length} games`
            : 'Schedule data coming soon for this sport'}
          {liveCount > 0 && (
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
              {liveCount} live
            </span>
          )}
        </p>
      </div>

      {hasLiveData && (
        <div className="flex gap-1.5">
          {(['all', 'live', 'upcoming', 'final'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1 rounded-full text-xs cursor-pointer capitalize transition-all"
              style={{
                background: filter === f ? config.color : 'var(--bg-card)',
                color: filter === f ? '#fff' : 'var(--text-muted)',
                border: `1px solid ${filter === f ? config.color : 'var(--border-default)'}`,
              }}>
              {f}
            </button>
          ))}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 rounded-xl animate-pulse"
              style={{ background: 'var(--bg-card)' }} />
          ))}
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="rounded-xl p-4 text-sm" style={{ background: 'rgba(239,68,68,0.06)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
          Unable to load schedule: {error}
        </div>
      )}

      {/* No data for non-ESPN sports */}
      {!loading && !hasLiveData && (
        <div className="rounded-xl p-8 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Live schedule data is not yet available for {config.name}.
          </p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && hasLiveData && filtered.length === 0 && (
        <div className="rounded-xl p-8 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            No {filter !== 'all' ? filter : ''} games found in the current 7-day window.
          </p>
        </div>
      )}

      {/* Games list */}
      {!loading && !error && order.length > 0 && (
        <div className="space-y-6">
          {order.map(key => (
            <div key={key}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold uppercase tracking-widest"
                  style={{ color: key === '__live__' ? '#ef4444' : 'var(--text-muted)' }}>
                  {key === '__live__' ? '● Live Now' : key}
                </span>
                <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  {grouped.get(key)!.length}
                </span>
              </div>
              <div className="space-y-2">
                {grouped.get(key)!.map(g => (
                  <MatchRow key={g.id} game={g} color={config.color} slug={config.slug} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
