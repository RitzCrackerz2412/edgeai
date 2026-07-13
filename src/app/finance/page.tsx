import Link from 'next/link';
import { Activity, Scan, BarChart2, Newspaper } from 'lucide-react';
import { getMarketOverview } from '@/lib/finance/providers/yahoo';
import { FinanceSearchBar } from '@/components/finance/FinanceSearchBar';
import { LiveIndexStrip, LiveMovers, LiveSector } from '@/components/finance/LiveIndexStrip';

export const revalidate = 60;

const FINANCE_COLOR = '#10b981';

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

const QUICK_NAV = [
  { href: '/finance/markets',   label: 'Markets',   Icon: Activity,    desc: 'Indices & overview' },
  { href: '/finance/scanner',   label: 'Scanner',   Icon: Scan,        desc: 'Find opportunities' },
  { href: '/finance/news',      label: 'News',      Icon: Newspaper,   desc: 'Latest market news' },
  { href: '/finance/portfolio', label: 'Portfolio', Icon: BarChart2,   desc: 'Track your holdings' },
];

export default async function FinancePage() {
  // Server-side initial fetch — hydrates the live client components instantly
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

      {/* Live index strip — refreshes every 60s */}
      <LiveIndexStrip
        initialIndices={overview.indices}
        initialMarketState={overview.marketState}
      />

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

      {/* Live sector heatmap — refreshes every 60s */}
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
          Sector Performance Today
        </div>
        <LiveSector initialSectors={overview.sectors} />
      </div>

      {/* Live market movers — refreshes every 60s */}
      <LiveMovers
        initialGainers={overview.gainers}
        initialLosers={overview.losers}
        initialActives={overview.actives}
      />

      {/* Footer note */}
      <div className="text-[10px] text-center pb-4" style={{ color: 'var(--text-muted)' }}>
        Data via Yahoo Finance · Auto-refreshes every 60s · Not financial advice
      </div>
    </div>
  );
}
