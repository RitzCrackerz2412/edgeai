import { Game } from '@/lib/types';
import { formatOdds } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';

interface BettingIntelligenceProps {
  game: Game;
}

export function BettingIntelligence({ game }: BettingIntelligenceProps) {
  const { odds, homeTeam, awayTeam, prediction } = game;
  const lineMove = odds.current.spread - odds.opening.spread;
  const evPositive = odds.expectedValue > 0;

  return (
    <div className="space-y-4">
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        Market analysis for informational purposes only. EdgeAI does not encourage or facilitate gambling.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
          <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Moneyline
          </h4>
          <div className="space-y-2">
            <OddsRow label={homeTeam.name} open={odds.opening.home} current={odds.current.home} />
            <OddsRow label={awayTeam.name} open={odds.opening.away} current={odds.current.away} />
          </div>
        </div>

        <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
          <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Spread
          </h4>
          <div className="space-y-2">
            <OddsRow label={`${homeTeam.abbreviation} spread`} open={odds.opening.spread} current={odds.current.spread} isSpread />
            <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
              <span>Line movement</span>
              <span style={{ color: lineMove < 0 ? 'var(--red)' : 'var(--green)' }}>
                {lineMove > 0 ? '+' : ''}{lineMove.toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
        <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Public vs Sharp Money
        </h4>
        <div className="space-y-3">
          <PublicBettingBar
            homePct={odds.publicBettingPct.home}
            awayPct={odds.publicBettingPct.away}
            homeColor={homeTeam.color}
            awayColor={awayTeam.color}
            homeLabel={homeTeam.abbreviation}
            awayLabel={awayTeam.abbreviation}
          />
          <div className="flex items-center justify-between text-xs">
            <span style={{ color: 'var(--text-muted)' }}>Sharp money</span>
            <Badge variant={odds.sharpMoney === 'Home' ? 'accent' : odds.sharpMoney === 'Away' ? 'cyan' : 'default'}>
              {odds.sharpMoney}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span style={{ color: 'var(--text-muted)' }}>Model vs market</span>
            <span style={{ color: evPositive ? 'var(--green)' : 'var(--red)' }}>
              {evPositive ? '+' : ''}{odds.expectedValue.toFixed(1)}% EV
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span style={{ color: 'var(--text-muted)' }}>Model pick</span>
            <span style={{ color: 'var(--text-primary)' }}>
              {prediction.winner} ({prediction.winProbability.toFixed(1)}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function OddsRow({ label, open, current, isSpread }: {
  label: string; open: number; current: number; isSpread?: boolean;
}) {
  const moved = current !== open;
  const favorableMove = isSpread ? current < open : current < open;
  return (
    <div className="flex items-center justify-between text-sm">
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-xs line-through" style={{ color: 'var(--text-muted)' }}>
          {isSpread ? (open > 0 ? '+' : '') + open : formatOdds(open)}
        </span>
        <span
          className="font-semibold"
          style={{ color: moved ? (favorableMove ? 'var(--green)' : 'var(--red)') : 'var(--text-primary)' }}
        >
          {isSpread ? (current > 0 ? '+' : '') + current : formatOdds(current)}
        </span>
      </div>
    </div>
  );
}

function PublicBettingBar({ homePct, awayPct, homeColor, awayColor, homeLabel, awayLabel }: {
  homePct: number; awayPct: number; homeColor: string; awayColor: string;
  homeLabel: string; awayLabel: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex h-5 rounded-full overflow-hidden">
        <div
          className="flex items-center justify-start pl-2 text-xs font-bold text-white"
          style={{ width: `${homePct}%`, background: homeColor }}
        >
          {homePct > 20 && homeLabel}
        </div>
        <div
          className="flex items-center justify-end pr-2 text-xs font-bold text-white"
          style={{ width: `${awayPct}%`, background: awayColor }}
        >
          {awayPct > 20 && awayLabel}
        </div>
      </div>
      <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
        <span>{homePct}% public</span>
        <span>{awayPct}% public</span>
      </div>
    </div>
  );
}
