import { Game } from '@/lib/types';

export function HeadToHead({ game }: { game: Game }) {
  const { headToHead, homeTeam, awayTeam } = game;
  const total = headToHead.allTime.home + headToHead.allTime.away;
  const homePct = total > 0 ? (headToHead.allTime.home / total) * 100 : 50;
  const awayPct = total > 0 ? (headToHead.allTime.away / total) * 100 : 50;

  return (
    <div className="space-y-4">
      {/* All-time record */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm font-semibold">
          <span style={{ color: homeTeam.color }}>{headToHead.allTime.home}</span>
          <span style={{ color: 'var(--text-muted)' }}>
            {total > 0 ? `All-time H2H (${total} games)` : 'No H2H history'}
          </span>
          <span style={{ color: awayTeam.color }}>{headToHead.allTime.away}</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden flex">
          <div style={{ width: `${homePct}%`, background: homeTeam.color }} />
          <div style={{ width: `${awayPct}%`, background: awayTeam.color }} />
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <QuickStat label="Last 5 meetings" value={`${headToHead.last5.home}-${headToHead.last5.away}`} />
        <QuickStat label="Avg score" value={`${headToHead.avgScore.home.toFixed(1)}–${headToHead.avgScore.away.toFixed(1)}`} />
        <QuickStat label="Last meeting" value={headToHead.lastMeeting} small />
      </div>
    </div>
  );
}

function QuickStat({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="rounded-xl p-3 text-center" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
      <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className={`font-semibold ${small ? 'text-xs' : 'text-sm'}`} style={{ color: 'var(--text-primary)' }}>
        {value}
      </p>
    </div>
  );
}
