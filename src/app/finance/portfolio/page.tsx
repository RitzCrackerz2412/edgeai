'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Trash2, BarChart2 } from 'lucide-react';
import { FinanceSearchBar } from '@/components/finance/FinanceSearchBar';

const FINANCE_COLOR = '#10b981';

interface Holding {
  ticker: string;
  name:   string;
  shares: number;
  cost:   number;
  // Live data (fetched)
  price?:     number;
  changePct?: number;
}

const SAMPLE: Holding[] = [
  { ticker: 'AAPL',  name: 'Apple',     shares: 10, cost: 150 },
  { ticker: 'MSFT',  name: 'Microsoft', shares: 5,  cost: 380 },
  { ticker: 'NVDA',  name: 'NVIDIA',    shares: 3,  cost: 620 },
  { ticker: 'GOOGL', name: 'Alphabet',  shares: 4,  cost: 160 },
];

function usePortfolio() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [enriched, setEnriched] = useState<Holding[]>([]);
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read from localStorage on mount
    setHoldings(JSON.parse(localStorage.getItem('edgeai-portfolio') ?? 'null') ?? SAMPLE);
  }, []);

  const enrichHoldings = useCallback((current: Holding[]) => {
    if (current.length === 0) { setEnriched([]); return; }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard data-fetch pattern
    setLoading(true);
    Promise.all(
      current.map(h =>
        fetch(`/api/finance/quote/${h.ticker}`)
          .then(r => r.json())
          .then(d => ({ ...h, price: d.quote?.price ?? h.cost, changePct: d.quote?.changePct ?? 0 }))
          .catch(() => h),
      ),
    ).then(results => { setEnriched(results); setLoading(false); });
  }, []);

  useEffect(() => {
    localStorage.setItem('edgeai-portfolio', JSON.stringify(holdings));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- clear/set on data changes
    if (holdings.length === 0) { setEnriched([]); return; }
    enrichHoldings(holdings);
  }, [holdings, enrichHoldings]);

  // Auto-refresh prices every 60s
  useEffect(() => {
    if (holdings.length === 0) return;
    const id = setInterval(() => enrichHoldings(holdings), 60_000);
    return () => clearInterval(id);
  }, [holdings, enrichHoldings]);

  const add = (ticker: string, name: string, shares: number, cost: number) => {
    setHoldings(prev => [...prev.filter(h => h.ticker !== ticker), { ticker, name, shares, cost }]);
  };
  const remove = (ticker: string) => setHoldings(prev => prev.filter(h => h.ticker !== ticker));

  return { holdings: enriched, loading, add, remove };
}

export default function PortfolioPage() {
  const { holdings, loading, add, remove } = usePortfolio();
  const [newTicker, setNewTicker] = useState('');
  const [newShares, setNewShares] = useState('');
  const [newCost,   setNewCost]   = useState('');
  const [adding,    setAdding]    = useState(false);

  const totalValue = holdings.reduce((s, h) => s + (h.price ?? h.cost) * h.shares, 0);
  const totalCost  = holdings.reduce((s, h) => s + h.cost * h.shares, 0);
  const totalGL    = totalValue - totalCost;
  const totalGLPct = totalCost > 0 ? (totalGL / totalCost) * 100 : 0;
  const dayChange  = holdings.reduce((s, h) => s + ((h.changePct ?? 0) / 100) * (h.price ?? h.cost) * h.shares, 0);

  const handleAdd = async () => {
    if (!newTicker || !newShares || !newCost) return;
    const ticker = newTicker.toUpperCase().trim();
    // Fetch name
    const r = await fetch(`/api/finance/quote/${ticker}`).catch(() => null);
    const d = await r?.json().catch(() => null);
    add(ticker, d?.quote?.name ?? ticker, Number(newShares), Number(newCost));
    setNewTicker(''); setNewShares(''); setNewCost('');
    setAdding(false);
  };

  const gl = (h: Holding) => ((h.price ?? h.cost) - h.cost) * h.shares;
  const glPct = (h: Holding) => h.cost > 0 ? (((h.price ?? h.cost) / h.cost) - 1) * 100 : 0;

  return (
    <div className="space-y-6 max-w-screen-2xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart2 size={12} style={{ color: FINANCE_COLOR }} />
            <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: FINANCE_COLOR }}>
              Portfolio Intelligence
            </span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
            My Portfolio
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Track and analyze your holdings</p>
        </div>
        <div className="w-full sm:w-80">
          <FinanceSearchBar />
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Portfolio Value', value: `$${totalValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}` },
          { label: 'Total Cost',      value: `$${totalCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}` },
          { label: 'Total Return',    value: `${totalGL >= 0 ? '+' : ''}$${totalGL.toLocaleString('en-US', { maximumFractionDigits: 0 })} (${totalGLPct.toFixed(2)}%)`, color: totalGL >= 0 ? 'var(--success)' : 'var(--danger)' },
          { label: "Today's P&L",     value: `${dayChange >= 0 ? '+' : ''}$${Math.abs(dayChange).toFixed(0)}`, color: dayChange >= 0 ? 'var(--success)' : 'var(--danger)' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
            <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
            <div className="text-lg font-bold font-mono" style={{ color: color ?? 'var(--text-primary)' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Holdings table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
        <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Holdings</h3>
          <button
            onClick={() => setAdding(v => !v)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition-all"
            style={{ background: `${FINANCE_COLOR}15`, color: FINANCE_COLOR, border: `1px solid ${FINANCE_COLOR}40` }}
          >
            <Plus size={12} /> Add Position
          </button>
        </div>

        {/* Add form */}
        {adding && (
          <div className="px-5 py-4 flex flex-wrap gap-2 items-end" style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)' }}>
            <div>
              <div className="text-[10px] mb-1" style={{ color: 'var(--text-muted)' }}>Ticker</div>
              <input
                value={newTicker} onChange={e => setNewTicker(e.target.value.toUpperCase())}
                placeholder="AAPL"
                className="px-3 py-1.5 rounded-lg text-sm bg-transparent border"
                style={{ color: 'var(--text-primary)', borderColor: 'var(--border-default)', width: 80 }}
              />
            </div>
            <div>
              <div className="text-[10px] mb-1" style={{ color: 'var(--text-muted)' }}>Shares</div>
              <input
                type="number" value={newShares} onChange={e => setNewShares(e.target.value)}
                placeholder="10"
                className="px-3 py-1.5 rounded-lg text-sm bg-transparent border"
                style={{ color: 'var(--text-primary)', borderColor: 'var(--border-default)', width: 80 }}
              />
            </div>
            <div>
              <div className="text-[10px] mb-1" style={{ color: 'var(--text-muted)' }}>Cost Basis</div>
              <input
                type="number" value={newCost} onChange={e => setNewCost(e.target.value)}
                placeholder="150.00"
                className="px-3 py-1.5 rounded-lg text-sm bg-transparent border"
                style={{ color: 'var(--text-primary)', borderColor: 'var(--border-default)', width: 100 }}
              />
            </div>
            <button
              onClick={handleAdd}
              className="px-4 py-1.5 rounded-lg text-sm font-semibold cursor-pointer"
              style={{ background: FINANCE_COLOR, color: '#fff' }}
            >
              Add
            </button>
          </div>
        )}

        {loading ? (
          <div className="p-5 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 rounded-lg animate-pulse" style={{ background: 'var(--bg-elevated)' }} />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  {['Symbol', 'Name', 'Shares', 'Cost', 'Price', 'Value', 'Gain/Loss', 'Today', ''].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {holdings.map(h => {
                  const gainLoss = gl(h);
                  const gainLossPct = glPct(h);
                  const glPos = gainLoss >= 0;
                  const dayPos = (h.changePct ?? 0) >= 0;
                  const value = (h.price ?? h.cost) * h.shares;
                  const weight = totalValue > 0 ? (value / totalValue) * 100 : 0;

                  return (
                    <tr key={h.ticker} style={{ borderBottom: '1px solid var(--border-subtle)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td className="px-4 py-3">
                        <Link href={`/finance/${h.ticker}`} className="font-bold hover:opacity-80" style={{ color: FINANCE_COLOR, textDecoration: 'none' }}>{h.ticker}</Link>
                        <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{weight.toFixed(1)}% wt.</div>
                      </td>
                      <td className="px-4 py-3 text-xs max-w-[160px] truncate" style={{ color: 'var(--text-muted)' }}>{h.name}</td>
                      <td className="px-4 py-3 font-mono" style={{ color: 'var(--text-secondary)' }}>{h.shares}</td>
                      <td className="px-4 py-3 font-mono" style={{ color: 'var(--text-secondary)' }}>${h.cost.toFixed(2)}</td>
                      <td className="px-4 py-3 font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {h.price ? `$${h.price.toFixed(2)}` : '…'}
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>
                        ${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs font-semibold" style={{ color: glPos ? 'var(--success)' : 'var(--danger)' }}>
                          {glPos ? '+' : ''}{gainLossPct.toFixed(2)}%
                        </div>
                        <div className="text-[10px] font-mono" style={{ color: glPos ? 'var(--success)' : 'var(--danger)' }}>
                          {glPos ? '+' : ''}${gainLoss.toFixed(0)}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-semibold" style={{ color: dayPos ? 'var(--success)' : 'var(--danger)' }}>
                        {dayPos ? '+' : ''}{(h.changePct ?? 0).toFixed(2)}%
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => remove(h.ticker)} className="cursor-pointer opacity-40 hover:opacity-100 transition-opacity">
                          <Trash2 size={12} style={{ color: 'var(--danger)' }} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-[10px] text-center" style={{ color: 'var(--text-muted)' }}>
        Portfolio saved locally in browser · Not financial advice · Prices delayed up to 15 minutes
      </p>
    </div>
  );
}
