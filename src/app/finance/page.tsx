import { Suspense } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown, Activity, Scan, BarChart2, Newspaper } from 'lucide-react';
import { getMarketOverview } from '@/lib/finance/providers/yahoo';
import { SectorHeatmap } from '@/components/finance/SectorHeatmap';
import { MarketMoverTable } from '@/components/finance/MarketMoverTable';
import { FinanceSearchBar } from '@/components/finance/FinanceSearchBar';

export const revalidate = 60;

const FINANCE_COLOR = '#10b981';

// ── Featured stocks to watch (curated watchlist) ──────────────────────────────
const WATCHLIST = [
  { ticker: 'AAPL',  name: 'Apple' },
  { ticker: 'NVDA',  name: 'NVIDIA' },
  { ticker: 'MSFT',  name: 'Microsoft' },
  { ticker: 'GOOGL', name: 'Alphabet' },
  { ticker: 'AMZN',  name: 'Amazon' },
  { ticker: 'META',  name: 'Meta' },
  { ticker: 'TSLA',  name: 'Tesla' },
  { ticker: 'JPM',   name: 'JPMorgan' },
];

// ── Quick access nav ──────────────────────────────────────────────────────────
const QUICK_NAV = [
  { href: '/finance/markets',   label: 'Markets',   Icon: Activity,    desc: 'Indices & overview' },
  { href: '/finance/scanner',   label: 'Scanner',   Icon: Scan,        desc: 'Find opportunities' },
  { href: '/finance/news',      label: 'News',      Icon: Newspaper,   desc: 'Latest market news' },
  { href: '/finance/portfolio', label: 'Portfolio', Icon: BarChart2,   desc: 'Track your holdings' },
];

// ── Index strip ───────────────────────────────────────────────────────────────
async function IndexStrip() {
  const overview = await getMarketOverview();
  const major = overview.indices.filter(i => ['^GSPC', '^DJI', '^IXIC', '^RUT', '^VIX'].includes(i.symbol));

  return (
    <div
      className="flex gap-4 overflow-x-auto no-scrollbar py-3 px-4 rounded-xl"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
    >
      <div className="flex items-center gap-1.5 shrink-0 pr-4" style={{ borderRight: '1px solid var(--border-subtle)' }}>
        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: overview.marketState === 'REGULAR' ? 'var(--success)' : 'var(--danger)' }} />
        <span className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>
          {overview.marketState === 'REGULAR' ? 'Markets Open' : 'Markets Closed'}
        </span>
      </div>
      {major.map(idx => {
        const pos = idx.changePct >= 0;
        return (
          <div key={idx.symbol} className="flex items-center gap-2 shrink-0">
            <div>
              <div className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>{idx.name}</div>
              <div className="text-sm font-bold font-mono" style={{ color: 'var(--text-primary)' }}>
                {idx.symbol === '^VIX' ? idx.price.toFixed(2) : idx.price.toLocaleString('en-US', { maximumFractionDigits: 2 })}
              </div>
            </div>
            <span className="text-xs font-semibold font-mono" style={{ color: pos ? 'var(--success)' : 'var(--danger)' }}>
              {pos ? '+' : ''}{idx.changePct.toFixed(2)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Movers section ────────────────────────────────────────────────────────────
async function MoversSection() {
  const overview = await getMarketOverview();
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      <div className="rounded-2xl p-4 space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
        <div className="flex items-center gap-2">
          <TrendingUp size={13} style={{ color: 'var(--success)' }} />
          <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Top Gainers</span>
        </div>
        <MarketMoverTable movers={overview.gainers} title="" />
      </div>
      <div className="rounded-2xl p-4 space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
        <div className="flex items-center gap-2">
          <TrendingDown size={13} style={{ color: 'var(--danger)' }} />
          <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Top Losers</span>
        </div>
        <MarketMoverTable movers={overview.losers} title="" />
      </div>
      <div className="rounded-2xl p-4 space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
        <div className="flex items-center gap-2">
          <Activity size={13} style={{ color: 'var(--info)' }} />
          <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Most Active</span>
        </div>
        <MarketMoverTable movers={overview.actives} title="" />
      </div>
    </div>
  );
}

// ── Sector heatmap ────────────────────────────────────────────────────────────
async function SectorSection() {
  const overview = await getMarketOverview();
  return <SectorHeatmap sectors={overview.sectors} />;
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function FinancePage() {
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
            Market Intelligence
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Real-time data · AI research · Quantitative analysis
          </p>
        </div>
        <div className="w-full sm:w-80">
          <FinanceSearchBar />
        </div>
      </div>

      {/* Market status strip */}
      <Suspense fallback={
        <div className="h-12 rounded-xl animate-pulse" style={{ background: 'var(--bg-card)' }} />
      }>
        <IndexStrip />
      </Suspense>

      {/* Quick nav */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {QUICK_NAV.map(({ href, label, Icon, desc }) => (
          <Link
            key={href}
            href={href}
            className="rounded-xl p-4 flex flex-col gap-2 transition-all hover:opacity-80"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', textDecoration: 'none' }}
          >
            <Icon size={16} style={{ color: FINANCE_COLOR }} />
            <div>
              <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{label}</div>
              <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{desc}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Watchlist quick links */}
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
          Featured Stocks
        </div>
        <div className="flex flex-wrap gap-2">
          {WATCHLIST.map(({ ticker, name }) => (
            <Link
              key={ticker}
              href={`/finance/${ticker}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', textDecoration: 'none' }}
            >
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{ticker}</span>
              <span style={{ color: 'var(--text-muted)' }}>·</span>
              <span>{name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Sector heatmap */}
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
          Sector Performance Today
        </div>
        <Suspense fallback={
          <div className="grid grid-cols-4 gap-1.5">
            {Array.from({ length: 11 }).map((_, i) => (
              <div key={i} className="h-14 rounded-lg animate-pulse" style={{ background: 'var(--bg-elevated)' }} />
            ))}
          </div>
        }>
          <SectorSection />
        </Suspense>
      </div>

      {/* Market movers */}
      <Suspense fallback={
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[0, 1, 2].map(i => (
            <div key={i} className="rounded-2xl p-4 space-y-2" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
              {Array.from({ length: 6 }).map((_, j) => (
                <div key={j} className="h-9 rounded-lg animate-pulse" style={{ background: 'var(--bg-elevated)' }} />
              ))}
            </div>
          ))}
        </div>
      }>
        <MoversSection />
      </Suspense>

      {/* Footer note */}
      <div className="text-[10px] text-center pb-4" style={{ color: 'var(--text-muted)' }}>
        Data via Yahoo Finance · Updated in real-time · Not financial advice
      </div>
    </div>
  );
}
