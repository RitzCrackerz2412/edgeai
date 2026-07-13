import type { Metadata } from 'next';
import { getMarketOverview } from '@/lib/finance/providers/yahoo';
import { SectorHeatmap } from '@/components/finance/SectorHeatmap';
import { MarketMoverTable } from '@/components/finance/MarketMoverTable';
import { FinanceSearchBar } from '@/components/finance/FinanceSearchBar';

export const metadata: Metadata = { title: 'Markets' };
export const revalidate = 60;

const FINANCE_COLOR = '#10b981';

function IndexCard({ symbol, name, price, change, changePct }: { symbol: string; name: string; price: number; change: number; changePct: number }) {
  const pos = changePct >= 0;
  const isVix = symbol === '^VIX';
  return (
    <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
      <div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>{name}</div>
      <div className="text-2xl font-black font-mono" style={{ color: 'var(--text-primary)' }}>
        {isVix ? price.toFixed(2) : price.toLocaleString('en-US', { maximumFractionDigits: 2 })}
      </div>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-sm font-semibold font-mono" style={{ color: pos ? 'var(--success)' : 'var(--danger)' }}>
          {pos ? '+' : ''}{change.toFixed(2)}
        </span>
        <span className="text-xs font-semibold font-mono" style={{ color: pos ? 'var(--success)' : 'var(--danger)' }}>
          ({pos ? '+' : ''}{changePct.toFixed(2)}%)
        </span>
      </div>
    </div>
  );
}

export default async function MarketsPage() {
  const overview = await getMarketOverview();

  return (
    <div className="space-y-6 max-w-screen-2xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ background: FINANCE_COLOR }} />
            <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: FINANCE_COLOR }}>
              Financial Intelligence
            </span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
            Market Overview
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {overview.marketState === 'REGULAR' ? '● Markets Open' : '○ Markets Closed'}
            {' · '}Updated {new Date(overview.updatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
          </p>
        </div>
        <div className="w-full sm:w-80">
          <FinanceSearchBar />
        </div>
      </div>

      {/* Major indices */}
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Major Indices</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {overview.indices.map(idx => <IndexCard key={idx.symbol} {...idx} />)}
        </div>
      </div>

      {/* Sector heatmap */}
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Sector Performance</div>
        <SectorHeatmap sectors={overview.sectors} />
      </div>

      {/* Market movers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
          <MarketMoverTable movers={overview.gainers} title="Top Gainers" />
        </div>
        <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
          <MarketMoverTable movers={overview.losers} title="Top Losers" />
        </div>
        <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
          <MarketMoverTable movers={overview.actives} title="Most Active" />
        </div>
      </div>
    </div>
  );
}
