import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  getQuote, getProfile, getFinancials,
  getAnalystData, getInsiderActivity, getEarnings,
  getNews,
} from '@/lib/finance/providers/yahoo';
import { generateResearch } from '@/lib/finance/analysis/research';
import { getHistory } from '@/lib/finance/providers/yahoo';
import { PriceChart } from '@/components/finance/PriceChart';
import { ResearchScoreCard } from '@/components/finance/ResearchScoreCard';
import { FinanceMetricGrid } from '@/components/finance/FinanceMetricGrid';
import { AnalystConsensusPanel } from '@/components/finance/AnalystConsensusPanel';
import { InsiderActivityPanel } from '@/components/finance/InsiderActivityPanel';
import { EarningsChart } from '@/components/finance/EarningsChart';
import { NewsCard } from '@/components/finance/NewsCard';
import { FinanceSearchBar } from '@/components/finance/FinanceSearchBar';
import { TrendingUp, TrendingDown, Building2, Globe, Users } from 'lucide-react';

export const revalidate = 120;

interface Props { params: Promise<{ ticker: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ticker } = await params;
  const quote = await getQuote(ticker.toUpperCase()).catch(() => null);
  return {
    title: quote ? `${quote.ticker} — ${quote.name}` : ticker.toUpperCase(),
    description: quote ? `AI research report for ${quote.name} (${quote.ticker}). Current price $${quote.price.toFixed(2)}.` : '',
  };
}

function formatBig(v: number | null): string {
  if (v == null) return '—';
  const abs = Math.abs(v);
  if (abs >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  if (abs >= 1e9)  return `$${(v / 1e9).toFixed(2)}B`;
  if (abs >= 1e6)  return `$${(v / 1e6).toFixed(2)}M`;
  return `$${v.toFixed(2)}`;
}

const FINANCE_COLOR = '#10b981';

// ── Tab panel helper ──────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
      <div className="px-5 py-3.5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ── Narrative section ─────────────────────────────────────────────────────────
function NarrativeSection({ title, text, signal }: { title: string; text: string; signal?: 'positive' | 'negative' | 'neutral' }) {
  const color = signal === 'positive' ? '#22c55e' : signal === 'negative' ? '#ef4444' : 'var(--text-muted)';
  return (
    <div className="space-y-1.5">
      <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color }}>
        {title}
      </div>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{text}</p>
    </div>
  );
}

export default async function StockPage({ params }: Props) {
  const { ticker } = await params;
  const sym = ticker.toUpperCase();

  // Parallel fetch all data
  const [quoteRes, profileRes, financialsRes, historyRes] = await Promise.allSettled([
    getQuote(sym),
    getProfile(sym),
    getFinancials(sym),
    getHistory(sym, '1y'),
  ]);

  const quote     = quoteRes.status     === 'fulfilled' ? quoteRes.value     : null;
  const profile   = profileRes.status   === 'fulfilled' ? profileRes.value   : null;
  const metrics   = financialsRes.status === 'fulfilled' ? financialsRes.value : null;
  const history   = historyRes.status   === 'fulfilled' ? historyRes.value   : [];

  if (!quote) notFound();

  const [analystRes, insiderRes, earningsRes, newsRes] = await Promise.allSettled([
    getAnalystData(sym, quote.price),
    getInsiderActivity(sym),
    getEarnings(sym),
    getNews(sym, 15),
  ]);

  const { ratings: analyst, recentActions } = analystRes.status === 'fulfilled'
    ? analystRes.value
    : { ratings: { strongBuy: 0, buy: 0, hold: 0, sell: 0, strongSell: 0, consensus: 'Hold' as const, avgPriceTarget: null, highPriceTarget: null, lowPriceTarget: null, numberOfAnalysts: 0, priceTargetUpside: null }, recentActions: [] };
  const insider = insiderRes.status === 'fulfilled'
    ? insiderRes.value
    : { netBuyShares: 0, netBuyValue: 0, netTransactions: 0, transactions: [] };
  const earnings = earningsRes.status === 'fulfilled' ? earningsRes.value : [];
  const news     = newsRes.status === 'fulfilled' ? newsRes.value : [];

  // Generate research report
  const report = generateResearch({
    ticker: sym, name: quote.name,
    price: quote.price, week52High: quote.week52High, week52Low: quote.week52Low,
    volume: quote.volume, avgVolume: quote.avgVolume,
    metrics: metrics ?? {
      marketCap: quote.marketCap, enterpriseValue: null, pe: quote.pe, forwardPE: quote.forwardPE,
      peg: null, priceToBook: null, priceToSales: null, evToRevenue: null, evToEbitda: null,
      revenueGrowth: null, grossMargin: null, operatingMargin: null, profitMargin: null,
      returnOnEquity: null, returnOnAssets: null, totalRevenue: null, revenuePerShare: null,
      grossProfit: null, ebitda: null, netIncome: null, eps: quote.eps, epsGrowth: null,
      totalCash: null, totalDebt: null, debtToEquity: null, currentRatio: null, quickRatio: null,
      freeCashFlow: null, operatingCashFlow: null, beta: quote.beta, sharesOutstanding: null,
      sharesFloat: null, shortRatio: null, shortPct: null, dividendYield: quote.dividendYield, payoutRatio: null,
    },
    analyst, insider, history,
  });

  const pos    = quote.changePct >= 0;
  const mktCap = formatBig(quote.marketCap);

  return (
    <div className="space-y-6 max-w-screen-2xl">

      {/* Search bar */}
      <div className="max-w-md">
        <FinanceSearchBar placeholder="Search another ticker…" />
      </div>

      {/* Hero header */}
      <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          {/* Left: name + price */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                style={{ background: `${FINANCE_COLOR}20`, color: FINANCE_COLOR }}
              >
                {sym.slice(0, 3)}
              </div>
              <div>
                <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                  {quote.name}
                </h1>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {sym} · {quote.exchange} · {quote.currency}
                </div>
              </div>
            </div>

            <div className="flex items-end gap-3 mt-2">
              <span className="text-4xl font-black font-mono" style={{ color: 'var(--text-primary)' }}>
                ${quote.price.toFixed(2)}
              </span>
              <div className="flex items-center gap-1.5 mb-1">
                {pos ? <TrendingUp size={14} style={{ color: 'var(--success)' }} /> : <TrendingDown size={14} style={{ color: 'var(--danger)' }} />}
                <span className="text-base font-semibold font-mono" style={{ color: pos ? 'var(--success)' : 'var(--danger)' }}>
                  {pos ? '+' : ''}{quote.change.toFixed(2)} ({pos ? '+' : ''}{quote.changePct.toFixed(2)}%)
                </span>
              </div>
            </div>

            {/* Pre/post market */}
            {quote.preMarketPrice && (
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Pre-market: ${quote.preMarketPrice.toFixed(2)}{' '}
                <span style={{ color: (quote.preMarketChange ?? 0) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                  {(quote.preMarketChange ?? 0) >= 0 ? '+' : ''}{quote.preMarketChange?.toFixed(2)}%
                </span>
              </div>
            )}
            {quote.postMarketPrice && (
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                After-hours: ${quote.postMarketPrice.toFixed(2)}{' '}
                <span style={{ color: (quote.postMarketChange ?? 0) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                  {(quote.postMarketChange ?? 0) >= 0 ? '+' : ''}{quote.postMarketChange?.toFixed(2)}%
                </span>
              </div>
            )}
          </div>

          {/* Right: key stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:text-right">
            {[
              { label: 'Market Cap', value: mktCap },
              { label: 'Volume',     value: `${(quote.volume / 1e6).toFixed(1)}M` },
              { label: '52W Range',  value: `$${quote.week52Low.toFixed(0)} – $${quote.week52High.toFixed(0)}` },
              { label: 'P/E (TTM)',  value: quote.pe ? `${quote.pe.toFixed(1)}x` : '—' },
              { label: 'Beta',       value: quote.beta ? quote.beta.toFixed(2) : '—' },
              { label: 'Sector',     value: profile?.sector ?? quote.sector ?? '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</div>
                <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Market state badge */}
        <div className="flex items-center gap-2 mt-4 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: quote.marketState === 'REGULAR' ? 'var(--success)' : 'var(--warning)' }}
          />
          <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
            {quote.marketState === 'REGULAR' ? 'Market Open' : quote.marketState === 'PRE' ? 'Pre-Market' : quote.marketState === 'POST' ? 'After Hours' : 'Market Closed'}
            {' · '}Updated {new Date(quote.updatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
          </span>
          {profile?.website && (
            <a
              href={profile.website}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto flex items-center gap-1 text-[10px]"
              style={{ color: 'var(--text-muted)', textDecoration: 'none' }}
            >
              <Globe size={10} />
              {profile.website.replace(/^https?:\/\//, '')}
            </a>
          )}
        </div>
      </div>

      {/* Main layout: left (chart + details) / right (research card) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Left column ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Price Chart */}
          <Section title="Price History">
            <PriceChart ticker={sym} currentPrice={quote.price} positive={pos} />
          </Section>

          {/* Executive Summary */}
          <Section title="AI Research Summary">
            <div className="space-y-4">
              <NarrativeSection
                title="Executive Summary"
                text={report.executiveSummary}
                signal={report.compositeScore >= 60 ? 'positive' : report.compositeScore <= 40 ? 'negative' : 'neutral'}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <NarrativeSection title="Financial Health"   text={report.financialHealthNote} />
                <NarrativeSection title="Valuation"          text={report.valuationNote} />
                <NarrativeSection title="Technical Picture"  text={report.technicalNote} />
                <NarrativeSection title="Key Risks"          text={report.riskNote} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <div className="rounded-lg p-3" style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.15)' }}>
                  <div className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#4ade80' }}>Bull Case</div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{report.bullCase}</p>
                </div>
                <div className="rounded-lg p-3" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
                  <div className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#f87171' }}>Bear Case</div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{report.bearCase}</p>
                </div>
              </div>
              <div className="text-[10px] pt-2" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)' }}>
                <strong>Catalysts to Watch:</strong> {report.catalystNote}
              </div>
            </div>
          </Section>

          {/* Financial metrics */}
          {metrics && (
            <Section title="Financial Metrics">
              <FinanceMetricGrid metrics={metrics} quote={quote} />
            </Section>
          )}

          {/* Earnings history */}
          <Section title="Earnings History — EPS Actual vs Estimate">
            <EarningsChart quarters={earnings} />
          </Section>

          {/* Analyst consensus */}
          <Section title="Analyst Consensus">
            <AnalystConsensusPanel ratings={analyst} actions={recentActions} />
          </Section>

          {/* Insider activity */}
          <Section title="Insider Activity">
            <InsiderActivityPanel insider={insider} />
          </Section>

          {/* Company profile */}
          {profile && (
            <Section title="Company Profile">
              <div className="space-y-4">
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {profile.description.slice(0, 600)}{profile.description.length > 600 ? '…' : ''}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { Icon: Building2, label: 'Sector',    value: profile.sector },
                    { Icon: Building2, label: 'Industry',  value: profile.industry },
                    { Icon: Globe,     label: 'Country',   value: profile.country },
                    { Icon: Users,     label: 'Employees', value: profile.employees ? profile.employees.toLocaleString() : '—' },
                    { Icon: Globe,     label: 'HQ',        value: [profile.city, profile.state].filter(Boolean).join(', ') || '—' },
                    { Icon: Globe,     label: 'Exchange',  value: profile.exchange },
                  ].map(({ Icon, label, value }) => (
                    <div key={label} className="flex items-start gap-2 p-2.5 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                      <Icon size={12} style={{ color: FINANCE_COLOR, marginTop: 1, flexShrink: 0 }} />
                      <div>
                        <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{label}</div>
                        <div className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Section>
          )}
        </div>

        {/* ── Right column ── */}
        <div className="space-y-5">
          <ResearchScoreCard report={report} />

          {/* Latest news */}
          {news.length > 0 && (
            <div className="rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
              <div className="px-5 py-3.5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                  Latest News
                </h3>
              </div>
              <div className="p-3 space-y-2">
                {news.slice(0, 6).map((article, i) => (
                  <NewsCard key={i} article={article} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Disclaimer */}
      <div
        className="rounded-xl p-3 text-[10px] leading-relaxed text-center"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}
      >
        This analysis is generated algorithmically from publicly available data and is for informational purposes only.
        EdgeAI is not a registered investment advisor. Nothing here constitutes financial advice.
        Past performance is not indicative of future results. Always conduct your own due diligence.
      </div>
    </div>
  );
}
