import Link from 'next/link';
import type { Game } from '@/lib/types';
import { formatOdds, sportIcon } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Calendar, MapPin, Wind } from 'lucide-react';

export function HeroGames({ games }: { games: Game[] }) {
  const featured = games.slice(0, 2);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {featured.map(game => <FeaturedGameCard key={game.id} game={game} />)}
    </div>
  );
}

function FeaturedGameCard({ game }: { game: Game }) {
  const { homeTeam, awayTeam, prediction } = game;
  const winnerIsHome = prediction.winner === homeTeam.name;
  const homeWinPct = winnerIsHome ? prediction.winProbability : 100 - prediction.winProbability;

  return (
    <Link
      href={`/game/${game.id}`}
      className="card-link group"
      style={{ padding: 0 }}
    >
      {/* Team color gradient header */}
      <div
        className="h-2 rounded-t-xl"
        style={{ background: `linear-gradient(90deg, ${homeTeam.color}, ${awayTeam.color})` }}
      />

      <div className="p-5 space-y-4">
        {/* League + meta */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm">{sportIcon(game.sport)}</span>
          <Badge variant="accent">{game.league}</Badge>
          <div className="ml-auto flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
            <Calendar size={11} />
            {game.date} · {game.time}
          </div>
        </div>

        {/* Teams */}
        <div className="flex items-center gap-4">
          <TeamChip team={homeTeam} label="Home" isWinner={winnerIsHome} />
          <div className="flex flex-col items-center flex-1">
            <div className="flex items-baseline gap-1.5 text-3xl font-black text-mono">
              <span style={{ color: homeTeam.color }}>{prediction.predictedScore.home}</span>
              <span className="text-lg" style={{ color: 'var(--text-muted)' }}>–</span>
              <span style={{ color: awayTeam.color }}>{prediction.predictedScore.away}</span>
            </div>
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Predicted score</span>
          </div>
          <TeamChip team={awayTeam} label="Away" isWinner={!winnerIsHome} right />
        </div>

        {/* Win probability bar */}
        <div>
          <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
            <span>{homeWinPct.toFixed(1)}%</span>
            <span>{(100 - homeWinPct).toFixed(1)}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: `${awayTeam.color}40` }}>
            <div className="h-full rounded-full" style={{ width: `${homeWinPct}%`, background: homeTeam.color }} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
            <MapPin size={11} />
            <span className="truncate max-w-[140px]">{game.venue.split(',')[0]}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {game.weather && (
              <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                <Wind size={11} />
                {game.weather.temp}°F
              </div>
            )}
            <div
              className="text-xs font-semibold px-2 py-0.5 rounded"
              style={{
                background: prediction.confidence >= 80 ? 'var(--success-dim)' : 'var(--accent-dim)',
                color: prediction.confidence >= 80 ? 'var(--success)' : 'var(--accent-light)',
              }}
            >
              {prediction.confidence}% conf.
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function TeamChip({
  team, label, isWinner, right,
}: {
  team: { name: string; abbreviation: string; record: string; color: string };
  label: string;
  isWinner: boolean;
  right?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${right ? 'items-end text-right' : 'items-start'}`}>
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white"
        style={{
          background: team.color,
          boxShadow: isWinner ? `0 0 12px ${team.color}60` : 'none',
        }}
      >
        {team.abbreviation.slice(0, 3)}
      </div>
      <div>
        <div className="text-sm font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
          {team.abbreviation}
        </div>
        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{team.record}</div>
      </div>
      {isWinner && (
        <div className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: 'var(--success-dim)', color: 'var(--success)' }}>
          PICK
        </div>
      )}
    </div>
  );
}
