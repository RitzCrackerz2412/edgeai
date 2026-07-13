import type { InsiderSummary } from '@/lib/finance/types';

function fmtBig(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

export function InsiderActivityPanel({ insider }: { insider: InsiderSummary }) {
  const netPositive = insider.netTransactions >= 0;

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center gap-3 p-3 rounded-xl" style={{
        background: netPositive ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)',
        border: `1px solid ${netPositive ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
      }}>
        <div
          className="text-2xl font-black font-mono"
          style={{ color: netPositive ? 'var(--success)' : 'var(--danger)' }}
        >
          {netPositive ? '▲' : '▼'}
        </div>
        <div>
          <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Net {netPositive ? 'Buying' : 'Selling'}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {Math.abs(insider.netTransactions)} net transaction{Math.abs(insider.netTransactions) !== 1 ? 's' : ''} ·{' '}
            {fmtBig(Math.abs(insider.netBuyValue))} net value
          </div>
        </div>
      </div>

      {/* Transaction list */}
      {insider.transactions.length > 0 ? (
        <div className="space-y-1.5">
          {insider.transactions.slice(0, 8).map((t, i) => (
            <div key={i} className="flex items-center gap-2.5 py-2 px-2.5 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: t.type === 'buy' ? 'var(--success)' : 'var(--danger)' }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{t.name}</div>
                <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{t.title}</div>
              </div>
              <div className="text-right shrink-0">
                <div
                  className="text-xs font-semibold"
                  style={{ color: t.type === 'buy' ? 'var(--success)' : 'var(--danger)' }}
                >
                  {t.type === 'buy' ? '+' : '-'}{t.shares.toLocaleString()} shares
                </div>
                <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  {fmtBig(t.value)} · {new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>
          No insider transaction data available
        </div>
      )}
    </div>
  );
}
