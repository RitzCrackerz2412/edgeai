import Link from 'next/link';
import { getUpcomingGames } from '@/lib/api';
import type { Game } from '@/lib/types';
import { sportIcon, isoDateInTZ } from '@/lib/utils';

export const revalidate = 60; // refresh every 60 s

// ── Date bucketing ────────────────────────────────────────────────────────────

type Bucket = 'live' | 'today' | 'tomorrow' | 'week' | 'later' | 'finished';

function classify(game: Game): Bucket {
  if (game.status === 'Live' || game.status === 'Halftime' || game.status === 'Pregame') return 'live';
  if (game.status === 'Final' || game.status === 'Final/OT' || game.status === 'Final/SO') return 'finished';
  if (game.status === 'Postponed' || game.status === 'Cancelled') return 'finished';

  const now = new Date();
  const d0 = isoDateInTZ(now, 'America/New_York');
  const d1 = isoDateInTZ(new Date(now.getTime() + 86_400_000), 'America/New_York');
  const d7 = isoDateInTZ(new Date(now.getTime() + 7 * 86_400_000), 'America/New_York');

  const gameDate = game.date.slice(0, 10);
  if (gameDate === d0) return 'today';
  if (gameDate === d1) return 'tomorrow';
  if (gameDate <= d7)  return 'week';
  return 'later';
}

// ── Status helpers ────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, { label: string; style: React.CSSProperties }> = {
  Live:      { label: '● LIVE',     style: { background: 'rgba(239,68,68,0.12)',  color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' } },
  Halftime:  { label: 'HALFTIME',   style: { background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' } },
  Pregame:   { label: 'PREGAME',    style: { background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' } },
  Final:     { label: 'FINAL',      style: { background: 'rgba(16,185,129,0.08)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.2)' } },
  'Final/OT':{ label: 'FINAL/OT',   style: { background: 'rgba(16,185,129,0.08)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.2)' } },
  'Final/SO':{ label: 'FINAL/SO',   style: { background: 'rgba(16,185,129,0.08)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.2)' } },
  Postponed: { label: 'POSTPONED',  style: { background: 'rgba(245,158,11,0.08)', color: '#fcd34d', border: '1px solid rgba(245,158,11,0.2)' } },
  Cancelled: { label: 'CANCELLED',  style: { background: 'rgba(107,114,128,0.1)', color: '#9ca3af', border: '1px solid rgba(107,114,128,0.2)' } },
};

function isFinal(status: Game['status']) {
  return status === 'Final' || status === 'Final/OT' || status === 'Final/SO';
}

function isLive(status: Game['status']) {
  return status === 'Live' || status === 'Halftime';
}

// ── Prediction outcome ────────────────────────────────────────────────────────

function getPredictionOutcome(game: Game): { correct: boolean; label: string } | null {
  if (!isFinal(game.status)) return null;
  if (game.homeScore === undefined || game.awayScore === undefined) return null;
  const actualWinner = game.homeScore >= game.awayScore ? game.homeTeam.name : game.awayTeam.name;
  const correct = actualWinner === game.prediction.winner;
  return {
    correct,
    label: correct
      ? `✓ ${game.prediction.winner.split(' ').slice(-1)[0]} won as predicted`
      : `✗ Predicted ${game.prediction.winner.split(' ').slice(-1)[0]}, ${actualWinner.split(' ').slice(-1)[0]} won`,
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function GamesPage() {
  const games = await getUpcomingGames({ includeRecent: true });

  const buckets: Record<Bucket, Game[]> = { live: [], today: [], tomorrow: [], week: [], later: [], finished: [] };
  for (const g of games) buckets[classify(g)].push(g);

  // Sort each bucket by scheduledAt or date
  const sortGames = (arr: Game[]) =>
    [...arr].sort((a, b) =>
      (a.scheduledAt ?? a.date).localeCompare(b.scheduledAt ?? b.date));

  const liveCount = buckets.live.length;

  const ALL_SECTIONS: { key: Bucket; label: string; desc?: string }[] = [
    { key: 'live',     label: 'Live Now',         desc: liveCount > 0 ? `${liveCount} game${liveCount !== 1 ? 's' : ''} in progress` : undefined },
    { key: 'today',    label: 'Today' },
    { key: 'tomorrow', label: 'Tomorrow' },
    { key: 'week',     label: 'This Week' },
    { key: 'later',    label: 'Upcoming' },
    { key: 'finished', label: 'Recently Finished' },
  ];
  const sections = ALL_SECTIONS.filter(s => buckets[s.key].length > 0);

  return (
    <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8 space-y-10" style={{ color: 'var(--text-primary)' }}>
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Games</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Live scores · Upcoming fixtures · Predictions across all leagues · All times ET
          {liveCount > 0 && (
            <span className="ml-2 inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              {liveCount} live
            </span>
          )}
        </p>
      </header>

      {sections.map(({ key, label, desc }) => (
        <section key={key} className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold">{label}</h2>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
              {buckets[key].length}
            </span>
            {desc && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{desc}</span>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortGames(buckets[key]).map(g => <GameCard key={g.id} game={g} />)}
          </div>
        </section>
      ))}

      {games.length === 0 && (
        <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
          <p className="text-4xl mb-4">🏆</p>
          <p className="font-medium">No games available right now.</p>
          <p className="text-sm mt-1">Live data syncs every 60 seconds.</p>
        </div>
      )}

      {/* By sport */}
      {games.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-xl font-semibold">All Games by Sport</h2>
          {groupBySport(games).map(({ sport, games: sg }) => (
            <div key={sport} className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                <span>{sportIcon(sport)}</span>
                <span className="uppercase tracking-widest text-[10px]">{sport}</span>
                <span className="ml-1 text-[10px]">({sg.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {sortGames(sg).map(g => <GameCard key={g.id} game={g} compact />)}
              </div>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}

function groupBySport(games: Game[]) {
  const map: Record<string, Game[]> = {};
  for (const g of games) {
    if (!map[g.sport]) map[g.sport] = [];
    map[g.sport].push(g);
  }
  return Object.entries(map).map(([sport, games]) => ({ sport, games }));
}

// ── GameCard ──────────────────────────────────────────────────────────────────

function GameCard({ game, compact = false }: { game: Game; compact?: boolean }) {
  const badge = STATUS_BADGE[game.status];
  const outcome = getPredictionOutcome(game);
  const showScore = (isFinal(game.status) || isLive(game.status)) &&
    game.homeScore !== undefined && game.awayScore !== undefined;

  // Combine date + time into a single "Jun 28 · 7:30 PM ET" string
  const displayDateTime = game.scheduledAt
    ? (() => {
        const d = new Date(game.scheduledAt);
        const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' });
        const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'America/New_York' });
        return `${date} · ${time} ET`;
      })()
    : (() => {
        const date = new Date(game.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return game.time ? `${date} · ${game.time}` : date;
      })();

  const homeLeads = showScore && (game.homeScore! > game.awayScore!);
  const awayLeads = showScore && (game.awayScore! > game.homeScore!);

  const inner = (
    <div
      className="rounded-xl p-4 space-y-3 h-full transition-all"
      style={{
        background: 'var(--bg-elevated)',
        border: isLive(game.status)
          ? '1px solid rgba(239,68,68,0.3)'
          : game.status === 'Postponed' || game.status === 'Cancelled'
            ? '1px solid var(--border-subtle)'
            : '1px solid var(--border-subtle)',
        opacity: game.status === 'Cancelled' ? 0.6 : 1,
      }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold truncate" style={{ color: 'var(--text-muted)' }}>
          {game.league}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {badge ? (
            <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={badge.style}>
              {badge.label}
            </span>
          ) : (
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{displayDateTime}</span>
          )}
        </div>
      </div>

      {/* Live clock */}
      {isLive(game.status) && game.period && (
        <div className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
          {game.clock ? `${game.clock} — ` : ''}P{game.period}
        </div>
      )}

      {/* Teams */}
      <div className="space-y-1.5">
        <TeamRow
          name={game.homeTeam.name}
          abbr={game.homeTeam.abbreviation}
          color={game.homeTeam.color}
          score={showScore ? game.homeScore : undefined}
          isWinner={isFinal(game.status) ? homeLeads : !compact && game.prediction.winner === game.homeTeam.name}
          isLeading={isLive(game.status) && homeLeads}
        />
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
          <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
            {showScore ? '–' : 'vs'}
          </span>
          <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
        </div>
        <TeamRow
          name={game.awayTeam.name}
          abbr={game.awayTeam.abbreviation}
          color={game.awayTeam.color}
          score={showScore ? game.awayScore : undefined}
          isWinner={isFinal(game.status) ? awayLeads : !compact && game.prediction.winner === game.awayTeam.name}
          isLeading={isLive(game.status) && awayLeads}
        />
      </div>

      {/* Venue (non-compact only) */}
      {!compact && game.venue && (
        <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
          📍 {game.venue}
        </p>
      )}

      {/* Confidence bar for upcoming games */}
      {!compact && !showScore && game.prediction.confidence && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              AI: {game.prediction.winner.split(' ').slice(-1)[0]}
            </span>
            <span className="text-[10px] font-semibold" style={{ color: 'var(--text-primary)' }}>
              {game.prediction.confidence}%
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-surface)' }}>
            <div className="h-full rounded-full transition-all"
              style={{ width: `${game.prediction.confidence}%`, background: 'var(--accent)' }} />
          </div>
        </div>
      )}

      {/* Prediction outcome for final games */}
      {outcome && (
        <div
          className="text-[10px] px-2 py-1.5 rounded-lg font-medium"
          style={{
            background: outcome.correct ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
            color: outcome.correct ? '#10b981' : '#ef4444',
            border: `1px solid ${outcome.correct ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
          }}
        >
          {outcome.label}
        </div>
      )}

      {/* Odds (non-compact, upcoming only) */}
      {!compact && !showScore && game.odds.current.home !== -110 && (
        <div className="flex items-center justify-between text-[10px]" style={{ color: 'var(--text-muted)' }}>
          <span>ML {game.odds.current.home > 0 ? '+' : ''}{game.odds.current.home}</span>
          <span>Spread {game.odds.current.spread > 0 ? '+' : ''}{game.odds.current.spread}</span>
        </div>
      )}
    </div>
  );

  const href = `/game/${game.id}`;
  return (
    <Link href={href} className="block h-full hover:opacity-90 transition-opacity">
      {inner}
    </Link>
  );
}

function TeamRow({
  name, abbr, color, score, isWinner, isLeading,
}: {
  name: string; abbr: string; color: string;
  score?: number; isWinner?: boolean; isLeading?: boolean;
}) {
  const bold = isWinner || isLeading;
  return (
    <div className="flex items-center gap-2">
      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
      <span
        className="text-sm flex-1 truncate"
        style={{ color: bold ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: bold ? 600 : 400 }}
      >
        {name}
      </span>
      {score !== undefined && (
        <span
          className="text-sm font-mono font-bold ml-auto shrink-0"
          style={{ color: bold ? color : 'var(--text-secondary)' }}
        >
          {score}
        </span>
      )}
      {bold && score === undefined && (
        <span className="text-[10px] ml-auto font-bold" style={{ color: 'var(--accent-light)' }}>★</span>
      )}
    </div>
  );
}
