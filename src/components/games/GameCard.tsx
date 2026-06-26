import Link from 'next/link';
import { Game } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { confidenceColor, formatDate, formatOdds, sportIcon } from '@/lib/utils';

interface GameCardProps {
  game: Game;
}

export function GameCard({ game }: GameCardProps) {
  const { prediction, homeTeam, awayTeam, odds } = game;
  const winnerIsHome = prediction.winner === homeTeam.name;
  const homeWinPct = winnerIsHome ? prediction.winProbability : 100 - prediction.winProbability;
  const awayWinPct = 100 - homeWinPct;

  return (
    <Link href={`/game/${game.id}`}>
      <div
        className="group rounded-2xl p-5 flex flex-col gap-4 transition-all cursor-pointer"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-bright)';
          (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-card-hover)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)';
          (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-card)';
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">{sportIcon(game.sport)}</span>
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              {game.league}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {formatDate(game.date)} · {game.time}
            </span>
            {game.weather && (
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {game.weather.temp}°F
              </span>
            )}
          </div>
        </div>

        {/* Teams */}
        <div className="flex items-center justify-between gap-4">
          <TeamSide
            name={homeTeam.name}
            abbr={homeTeam.abbreviation}
            record={homeTeam.record}
            winPct={homeWinPct}
            isWinner={winnerIsHome}
            color={homeTeam.color}
          />
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>VS</span>
            <div className="flex gap-1">
              <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                {prediction.predictedScore.away}
              </span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>-</span>
              <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                {prediction.predictedScore.home}
              </span>
            </div>
          </div>
          <TeamSide
            name={awayTeam.name}
            abbr={awayTeam.abbreviation}
            record={awayTeam.record}
            winPct={awayWinPct}
            isWinner={!winnerIsHome}
            color={awayTeam.color}
            right
          />
        </div>

        {/* Win probability bar */}
        <div className="space-y-1">
          <div className="h-1.5 rounded-full overflow-hidden flex" style={{ background: 'var(--border)' }}>
            <div
              className="h-full transition-all duration-500"
              style={{ width: `${homeWinPct}%`, background: homeTeam.color }}
            />
            <div
              className="h-full"
              style={{ width: `${awayWinPct}%`, background: awayTeam.color }}
            />
          </div>
          <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>{homeWinPct.toFixed(1)}%</span>
            <span>Win probability</span>
            <span>{awayWinPct.toFixed(1)}%</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            <Badge variant={prediction.confidence >= 80 ? 'green' : prediction.confidence >= 65 ? 'yellow' : 'default'}>
              {prediction.confidence}% confidence
            </Badge>
            <Badge variant="accent">
              {prediction.winner.split(' ').slice(-1)[0]} ML
            </Badge>
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Spread {formatOdds(odds.current.spread)} · {formatOdds(odds.current.home)}
          </div>
        </div>
      </div>
    </Link>
  );
}

function TeamSide({
  name, abbr, record, winPct, isWinner, color, right,
}: {
  name: string; abbr: string; record: string;
  winPct: number; isWinner: boolean; color: string; right?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-0.5 flex-1 ${right ? 'items-end text-right' : 'items-start'}`}>
      <div className="flex items-center gap-2" style={{ flexDirection: right ? 'row-reverse' : 'row' }}>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
          style={{ background: color }}
        >
          {abbr.slice(0, 3)}
        </div>
        {isWinner && (
          <span className="text-xs" style={{ color: 'var(--green)' }}>▲</span>
        )}
      </div>
      <span className="text-sm font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
        {name.split(' ').slice(-1)[0]}
      </span>
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{record}</span>
      <span className={`text-sm font-bold ${isWinner ? '' : ''}`} style={{ color: isWinner ? color : 'var(--text-secondary)' }}>
        {winPct.toFixed(0)}%
      </span>
    </div>
  );
}
