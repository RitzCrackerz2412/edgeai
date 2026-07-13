import Link from 'next/link';
import type { MarketMover } from '@/lib/finance/types';

function fmtBig(v: number | null): string {
  if (v == null) return '—';
  if (v >= 1e12) return `$${(v / 1e12).toFixed(1)}T`;
  if (v >= 1e9)  return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6)  return `$${(v / 1e6).toFixed(1)}M`;
  return `$${v.toFixed(0)}`;
}

export function MarketMoverTable({ movers, title }: { movers: MarketMover[]; title: string }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>{title}</div>
      <div className="space-y-1">
        {movers.slice(0, 8).map(m => {
          const pos = m.changePct >= 0;
          return (
            <Link
              key={m.ticker}
              href={`/finance/${m.ticker}`}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all hover:opacity-80"
              style={{ background: 'var(--bg-elevated)', textDecoration: 'none' }}
            >
              <div className="w-10 shrink-0">
                <div className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{m.ticker}</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>{m.name}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs font-semibold font-mono" style={{ color: 'var(--text-primary)' }}>${m.price.toFixed(2)}</div>
                <div className="text-[10px] font-semibold font-mono" style={{ color: pos ? 'var(--success)' : 'var(--danger)' }}>
                  {pos ? '+' : ''}{m.changePct.toFixed(2)}%
                </div>
              </div>
              <div className="text-[10px] w-14 text-right shrink-0" style={{ color: 'var(--text-muted)' }}>
                {fmtBig(m.marketCap)}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
