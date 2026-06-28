import Link from 'next/link';
import { Game } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { confidenceColor, formatOdds, sportIcon } from '@/lib/utils';

interface GameCardProps {
  game: Game;
}

function isFinalStatus(s: Game['status']) {
  return s === 'Final' || s === 'Final/OT' || s === 'Final/SO';
}
function isLiveStatus(s: Game['status']) {
  return s === 'Live' || s === 'Halftime' || s === 'Pregame';
}

export function GameCard({ game }: GameCardProps) {
  const { prediction, homeTeam, awayTeam, odds, status } = game;

  const showActualScore = (isFinalStatus(status) || isLiveStatus(status))
    && game.homeScore !== undefined && game.awayScore !== undefined;

  const winnerIsHome = prediction.winner === homeTeam.name;
  const homeWinPct   = winnerIsHome ? prediction.winProbability : 100 - prediction.winProbability;
  const awayWinPct   = 100 - homeWinPct;

  // Actual winner (for final games)
  const homeActualWins = showActualScore && game.homeScore! > game.awayScore!;
  const awayActualWins = showActualScore && game.awayScore! > game.homeScore!;

  const predictionCorrect = isFinalStatus(status) && showActualScore
    ? (homeActualWins ? homeTeam.name : awayTeam.name) === prediction.winner
    : null;

  // Time display — prefer raw ISO scheduledAt
  const displayTime = game.scheduledAt
    ? new Date(game.scheduledAt).toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'America/New_York',
      }) + ' ET'
    : game.time;

  const displayDate = new Date(game.date + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  });

  return (
    <Link href={`/game/${game.id}`}>
      <div
        className="group rounded-2xl p-5 flex flex-col gap-4 transition-all cursor-pointer"
        style={{
          background: 'var(--bg-card)',
          border: isLiveStatus(status)
            ? '1px solid rgba(239,68,68,0.35)'
            : '1px solid var(--border)',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-bright)';
          (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-card-hover)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = isLiveStatus(status)
            ? 'rgba(239,68,68,0.35)' : 'var(--border)';
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
            {/* Status badge */}
            {isLiveStatus(status) && (
              <span className="text-[10px] px-1.5 py-0.5 rounded font-bold animate-pulse"
                style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                ● LIVE
                {game.period && <span className="ml-1 not-italic">P{game.period}</span>}
              </span>
            )}
            {isFinalStatus(status) && (
              <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                style={{ background: 'rgba(16,185,129,0.08)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.2)' }}>
                {status}
              </span>
            )}
            {status === 'Postponed' && (
              <span className="text-[10px] px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(245,158,11,0.08)', color: '#fcd34d' }}>
                POSTPONED
              </span>
            )}
            {!isLiveStatus(status) && !isFinalStatus(status) && status !== 'Postponed' && (
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {displayDate} · {displayTime}
              </span>
            )}
            {game.weather && !showActualScore && (
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {game.weather.temp}°F
              </span>
            )}
          </div>
        </div>

        {/* Teams + Score */}
        <div className="flex items-center justify-between gap-4">
          <TeamSide
            name={homeTeam.name}
            abbr={homeTeam.abbreviation}
            record={homeTeam.record}
            winPct={homeWinPct}
            isWinner={showActualScore ? homeActualWins : winnerIsHome}
            color={homeTeam.color}
          />
          <div className="flex flex-col items-center gap-1">
            {showActualScore ? (
              <span className="text-2xl font-black font-mono tabular-nums" style={{ color: 'var(--text-primary)' }}>
                <span style={{ color: homeActualWins ? homeTeam.color : 'var(--text-secondary)' }}>{game.homeScore}</span>
                <span className="mx-1.5" style={{ color: 'var(--text-muted)' }}>–</span>
                <span style={{ color: awayActualWins ? awayTeam.color : 'var(--text-secondary)' }}>{game.awayScore}</span>
              </span>
            ) : (
              <>
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
              </>
            )}
            {isLiveStatus(status) && game.clock && (
              <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>{game.clock}</span>
            )}
          </div>
          <TeamSide
            name={awayTeam.name}
            abbr={awayTeam.abbreviation}
            record={awayTeam.record}
            winPct={awayWinPct}
            isWinner={showActualScore ? awayActualWins : !winnerIsHome}
            color={awayTeam.color}
            right
          />
        </div>

        {/* Win probability bar */}
        <div className="space-y-1">
          <div className="h-1.5 rounded-full overflow-hidden flex" style={{ background: 'var(--border)' }}>
            <div className="h-full transition-all duration-500"
              style={{ width: `${homeWinPct}%`, background: homeTeam.color }} />
            <div className="h-full"
              style={{ width: `${awayWinPct}%`, background: awayTeam.color }} />
          </div>
          <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>{homeWinPct.toFixed(1)}%</span>
            <span>Win probability</span>
            <span>{awayWinPct.toFixed(1)}%</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex gap-2 flex-wrap">
            {predictionCorrect === true && (
              <Badge variant="green">✓ Prediction Correct</Badge>
            )}
            {predictionCorrect === false && (
              <Badge variant="default">✗ Prediction Incorrect</Badge>
            )}
            {predictionCorrect === null && (
              <>
                <Badge variant={prediction.confidence >= 80 ? 'green' : prediction.confidence >= 65 ? 'yellow' : 'default'}>
                  {prediction.confidence}% confidence
                </Badge>
                <Badge variant="accent">
                  {prediction.winner.split(' ').slice(-1)[0]} ML
                </Badge>
              </>
            )}
          </div>
          {!showActualScore && (
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Spread {formatOdds(odds.current.spread)} · {formatOdds(odds.current.home)}
            </div>
          )}
          {isFinalStatus(status) && showActualScore && (
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Predicted {prediction.predictedScore.home}–{prediction.predictedScore.away}
            </div>
          )}
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
          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
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
      <span className="text-sm font-bold" style={{ color: isWinner ? color : 'var(--text-secondary)' }}>
        {winPct.toFixed(0)}%
      </span>
    </div>
  );
}
