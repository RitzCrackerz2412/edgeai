import type { FinancialMetrics, StockQuote } from '@/lib/finance/types';

function fmtBig(v: number | null): string {
  if (v == null) return '—';
  const abs = Math.abs(v);
  if (abs >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  if (abs >= 1e9)  return `$${(v / 1e9).toFixed(2)}B`;
  if (abs >= 1e6)  return `$${(v / 1e6).toFixed(2)}M`;
  return `$${v.toFixed(2)}`;
}
function fmtPct(v: number | null): string {
  return v == null ? '—' : `${v > 0 ? '+' : ''}${v.toFixed(1)}%`;
}
function fmtX(v: number | null): string {
  return v == null ? '—' : `${v.toFixed(1)}x`;
}
function fmtN(v: number | null, dec = 2): string {
  return v == null ? '—' : v.toFixed(dec);
}

interface MetricItem {
  label:  string;
  value:  string;
  signal?: 'positive' | 'negative' | 'neutral';
}

function item(label: string, value: string, signal?: MetricItem['signal']): MetricItem {
  return { label, value, signal };
}

interface Props {
  metrics: FinancialMetrics;
  quote:   StockQuote;
}

function MetricCell({ label, value, signal }: MetricItem) {
  const color = signal === 'positive' ? 'var(--success)'
    : signal === 'negative' ? 'var(--danger)' : 'var(--text-primary)';
  return (
    <div className="flex flex-col gap-0.5 p-3 rounded-lg" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
      <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span className="text-sm font-semibold font-mono" style={{ color }}>{value}</span>
    </div>
  );
}

export function FinanceMetricGrid({ metrics: m, quote: q }: Props) {
  const valuationMetrics: MetricItem[] = [
    item('Market Cap',     fmtBig(m.marketCap ?? q.marketCap)),
    item('P/E (TTM)',      fmtX(m.pe ?? q.pe), m.pe != null ? (m.pe < 20 ? 'positive' : m.pe > 40 ? 'negative' : 'neutral') : undefined),
    item('Forward P/E',   fmtX(m.forwardPE ?? q.forwardPE), m.forwardPE != null ? (m.forwardPE < 20 ? 'positive' : m.forwardPE > 40 ? 'negative' : 'neutral') : undefined),
    item('PEG Ratio',     m.peg != null ? fmtN(m.peg) : '—', m.peg != null ? (m.peg < 1 ? 'positive' : m.peg > 2 ? 'negative' : 'neutral') : undefined),
    item('EV/EBITDA',     fmtX(m.evToEbitda)),
    item('Price/Book',    fmtX(m.priceToBook)),
    item('Price/Sales',   fmtX(m.priceToSales)),
    item('EV/Revenue',    fmtX(m.evToRevenue)),
  ];

  const profitMetrics: MetricItem[] = [
    item('Revenue',       fmtBig(m.totalRevenue)),
    item('Rev Growth',    fmtPct(m.revenueGrowth), m.revenueGrowth != null ? (m.revenueGrowth > 10 ? 'positive' : m.revenueGrowth < 0 ? 'negative' : 'neutral') : undefined),
    item('Gross Margin',  m.grossMargin != null ? `${m.grossMargin.toFixed(1)}%` : '—', m.grossMargin != null ? (m.grossMargin > 40 ? 'positive' : m.grossMargin < 20 ? 'negative' : 'neutral') : undefined),
    item('Oper. Margin',  m.operatingMargin != null ? `${m.operatingMargin.toFixed(1)}%` : '—', m.operatingMargin != null ? (m.operatingMargin > 15 ? 'positive' : m.operatingMargin < 0 ? 'negative' : 'neutral') : undefined),
    item('Net Margin',    m.profitMargin != null ? `${m.profitMargin.toFixed(1)}%` : '—', m.profitMargin != null ? (m.profitMargin > 10 ? 'positive' : m.profitMargin < 0 ? 'negative' : 'neutral') : undefined),
    item('ROE',           m.returnOnEquity != null ? `${m.returnOnEquity.toFixed(1)}%` : '—', m.returnOnEquity != null ? (m.returnOnEquity > 15 ? 'positive' : m.returnOnEquity < 5 ? 'negative' : 'neutral') : undefined),
    item('Free Cash Flow',fmtBig(m.freeCashFlow), m.freeCashFlow != null ? (m.freeCashFlow > 0 ? 'positive' : 'negative') : undefined),
    item('EPS',           m.eps != null ? `$${m.eps.toFixed(2)}` : '—'),
  ];

  const balanceMetrics: MetricItem[] = [
    item('Total Cash',    fmtBig(m.totalCash)),
    item('Total Debt',    fmtBig(m.totalDebt), m.totalDebt != null && m.totalCash != null ? (m.totalCash > m.totalDebt ? 'positive' : 'negative') : undefined),
    item('D/E Ratio',     m.debtToEquity != null ? `${m.debtToEquity.toFixed(0)}%` : '—', m.debtToEquity != null ? (m.debtToEquity < 80 ? 'positive' : m.debtToEquity > 200 ? 'negative' : 'neutral') : undefined),
    item('Current Ratio', fmtN(m.currentRatio), m.currentRatio != null ? (m.currentRatio > 1.5 ? 'positive' : m.currentRatio < 1 ? 'negative' : 'neutral') : undefined),
    item('Beta',          fmtN(m.beta ?? q.beta), m.beta != null ? (m.beta < 1 ? 'positive' : m.beta > 2 ? 'negative' : 'neutral') : undefined),
    item('Short % Float', m.shortPct != null ? `${m.shortPct.toFixed(1)}%` : '—', m.shortPct != null ? (m.shortPct > 15 ? 'negative' : m.shortPct < 5 ? 'positive' : 'neutral') : undefined),
    item('Div. Yield',    m.dividendYield != null ? `${m.dividendYield.toFixed(2)}%` : '—', m.dividendYield != null ? (m.dividendYield > 2 ? 'positive' : 'neutral') : undefined),
    item('52W Range',     `$${q.week52Low.toFixed(2)} – $${q.week52High.toFixed(2)}`),
  ];

  return (
    <div className="space-y-5">
      <MetricSection title="Valuation"           items={valuationMetrics} />
      <MetricSection title="Profitability"        items={profitMetrics} />
      <MetricSection title="Balance Sheet & Risk" items={balanceMetrics} />
    </div>
  );
}

function MetricSection({ title, items }: { title: string; items: MetricItem[] }) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>{title}</h4>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {items.map(i => <MetricCell key={i.label} {...i} />)}
      </div>
    </div>
  );
}
