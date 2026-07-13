import type { AnalystRatings, AnalystAction } from '@/lib/finance/types';

function RatingBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] w-20 text-right" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-default)' }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[10px] w-6 font-mono" style={{ color: 'var(--text-secondary)' }}>{count}</span>
    </div>
  );
}

const ACTION_COLOR: Record<AnalystAction['action'], string> = {
  upgrade:   '#22c55e',
  downgrade: '#ef4444',
  init:      '#0ea5e9',
  reiterate: '#94a3b8',
};
const ACTION_LABEL: Record<AnalystAction['action'], string> = {
  upgrade:   'Upgrade',
  downgrade: 'Downgrade',
  init:      'Initiated',
  reiterate: 'Reiterated',
};

export function AnalystConsensusPanel({ ratings, actions }: { ratings: AnalystRatings; actions: AnalystAction[] }) {
  const total = ratings.strongBuy + ratings.buy + ratings.hold + ratings.sell + ratings.strongSell;

  const consensusColor =
    ratings.consensus === 'Strong Buy' ? '#22c55e' :
    ratings.consensus === 'Buy' ? '#4ade80' :
    ratings.consensus === 'Hold' ? '#94a3b8' :
    ratings.consensus === 'Sell' ? '#f87171' : '#ef4444';

  return (
    <div className="space-y-5">
      {/* Consensus */}
      <div className="flex items-center gap-4">
        <div
          className="rounded-xl p-4 flex flex-col items-center justify-center shrink-0"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', minWidth: 100 }}
        >
          <div className="text-xl font-bold" style={{ color: consensusColor }}>{ratings.consensus}</div>
          <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{total} analysts</div>
        </div>
        <div className="flex-1 space-y-1.5">
          <RatingBar label="Strong Buy"  count={ratings.strongBuy}   total={total} color="#22c55e" />
          <RatingBar label="Buy"         count={ratings.buy}         total={total} color="#4ade80" />
          <RatingBar label="Hold"        count={ratings.hold}        total={total} color="#94a3b8" />
          <RatingBar label="Sell"        count={ratings.sell}        total={total} color="#f87171" />
          <RatingBar label="Strong Sell" count={ratings.strongSell}  total={total} color="#ef4444" />
        </div>
      </div>

      {/* Price targets */}
      {ratings.avgPriceTarget && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Low Target',  val: ratings.lowPriceTarget },
            { label: 'Avg Target',  val: ratings.avgPriceTarget },
            { label: 'High Target', val: ratings.highPriceTarget },
          ].map(({ label, val }) => (
            <div key={label} className="rounded-lg p-2.5 text-center" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
              <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{label}</div>
              <div className="text-sm font-bold font-mono" style={{ color: 'var(--text-primary)' }}>
                {val ? `$${val.toFixed(2)}` : '—'}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent actions */}
      {actions.length > 0 && (
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
            Recent Analyst Actions
          </div>
          <div className="space-y-1.5">
            {actions.slice(0, 6).map((a, i) => (
              <div key={i} className="flex items-center gap-2 py-1.5 px-2 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                  style={{ background: `${ACTION_COLOR[a.action]}18`, color: ACTION_COLOR[a.action] }}
                >
                  {ACTION_LABEL[a.action]}
                </span>
                <span className="text-xs font-medium flex-1" style={{ color: 'var(--text-secondary)' }}>{a.firm}</span>
                {a.fromGrade && (
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{a.fromGrade} →</span>
                )}
                <span className="text-[10px] font-semibold" style={{ color: ACTION_COLOR[a.action] }}>{a.toGrade}</span>
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  {new Date(a.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {total === 0 && (
        <div className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>No analyst coverage available</div>
      )}
    </div>
  );
}
