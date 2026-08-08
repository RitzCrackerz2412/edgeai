'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  TrendingUp, TrendingDown, Activity, RefreshCw,
  BarChart2, Newspaper, ChevronRight, Zap,
} from 'lucide-react';
import type { IndexQuote, MarketMover, SectorPerf } from '@/lib/finance/types';
import type { StockQuote } from '@/lib/finance/types';
import type { NewsArticle } from '@/lib/finance/types';

const FC = '#10b981'; // finance green

// ── helpers ───────────────────────────────────────────────────────────────────
function fmt(n: number) { return n.toLocaleString('en-US', { maximumFractionDigits: 2 }); }
function pct(n: number) { return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`; }
function timeAgo(iso: string | null) {
  if (!iso) return '';
  const d = Date.now() - new Date(iso).getTime();
  if (d < 3_600_000) return `${Math.floor(d / 60_000)}m ago`;
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h ago`;
  return `${Math.floor(d / 86_400_000)}d ago`;
}

function fearLabel(vix: number) {
  if (vix < 12) return { label: 'Extreme Greed', color: '#22c55e', pct: 90 };
  if (vix < 16) return { label: 'Greed',         color: '#4ade80', pct: 72 };
  if (vix < 20) return { label: 'Neutral',        color: '#f59e0b', pct: 50 };
  if (vix < 28) return { label: 'Fear',           color: '#f97316', pct: 30 };
  return               { label: 'Extreme Fear',   color: '#ef4444', pct: 10 };
}

const DEFAULT_WATCHLIST = [
  'DKNG','PENN','FUBO','DIS','NFLX','GOOGL','META','MSFT',
];
const LS_KEY = 'edgeai_watchlist_v1';
const INDEX_ORDER = ['^GSPC','^DJI','^IXIC','^RUT','^VIX'];
const INDEX_LABELS: Record<string,string> = {
  '^GSPC':'S&P 500','^DJI':'Dow Jones','^IXIC':'Nasdaq','^RUT':'Russell 2000','^VIX':'VIX',
};

// ── types ─────────────────────────────────────────────────────────────────────
interface WatchItem { ticker: string; quote: StockQuote | null }

function maCrossoverSignal(q: StockQuote | null): { label: string; color: string } | null {
  if (!q) return null;
  const { ma50, ma200, price } = q;
  if (ma50 != null && ma200 != null) {
    if (ma50 > ma200 && price > ma50)  return { label: 'Buy',  color: '#22c55e' };
    if (ma50 > ma200 && price <= ma50) return { label: 'Hold', color: '#f59e0b' };
    if (ma50 <= ma200)                 return { label: 'Sell', color: '#ef4444' };
  }
  // fallback: use daily change when MA data unavailable
  if (q.changePct >= 1)   return { label: 'Buy',  color: '#22c55e' };
  if (q.changePct >= -0.5) return { label: 'Hold', color: 'var(--text-muted)' };
  return { label: 'Sell', color: '#ef4444' };
}

interface LiveDashboardMarketProps {
  initialIndices:    IndexQuote[];
  initialMarketState: string;
  initialGainers:   MarketMover[];
  initialLosers:    MarketMover[];
  initialActives:   MarketMover[];
  initialSectors:   SectorPerf[];
  initialWatchlist: WatchItem[];
  initialNews:      NewsArticle[];
}

// ── sub-components ────────────────────────────────────────────────────────────
function ChgBadge({ v, size = 'sm' }: { v: number; size?: 'sm' | 'xs' }) {
  const pos = v >= 0;
  const fs  = size === 'xs' ? '0.5625rem' : '0.6875rem';
  return (
    <span style={{ fontSize: fs, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
      color: pos ? 'var(--success)' : 'var(--danger)' }}>
      {pct(v)}
    </span>
  );
}

function MoverRow({ m }: { m: MarketMover }) {
  const pos = m.changePct >= 0;
  return (
    <Link href={`/finance/${m.ticker}`} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0.4rem 0.75rem', textDecoration: 'none', color: 'inherit',
      borderRadius: 6, transition: 'background 0.1s',
    }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <div>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>{m.ticker}</div>
        <div style={{ fontSize: '0.5625rem', color: 'var(--text-muted)', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)' }}>${m.price.toFixed(2)}</div>
        <ChgBadge v={m.changePct} size="xs" />
      </div>
      <div style={{
        width: 3, height: 28, borderRadius: 2, marginLeft: 8, flexShrink: 0,
        background: pos ? 'var(--success)' : 'var(--danger)', opacity: 0.7,
      }} />
    </Link>
  );
}

// ── main component ────────────────────────────────────────────────────────────
export function LiveDashboardMarket({
  initialIndices, initialMarketState, initialGainers, initialLosers,
  initialActives, initialSectors, initialWatchlist, initialNews,
}: LiveDashboardMarketProps) {
  const [indices,        setIndices]      = useState(initialIndices);
  const [mktState,       setMktState]     = useState(initialMarketState);
  const [gainers,        setGainers]      = useState(initialGainers);
  const [losers,         setLosers]       = useState(initialLosers);
  const [actives,        setActives]      = useState(initialActives);
  const [sectors,        setSectors]      = useState(initialSectors);
  const [watchlist,      setWatchlist]    = useState(initialWatchlist);
  const [news,           setNews]         = useState(initialNews);
  const [updatedAt,      setUpdatedAt]    = useState<Date | null>(null);
  const [refreshing,     setRefreshing]   = useState(false);
  const [wlTickers,      setWlTickers]    = useState<string[]>(DEFAULT_WATCHLIST);
  const [addingTicker,   setAddingTicker] = useState(false);
  const [newTicker,      setNewTicker]    = useState('');
  const tickRef = useRef(0);

  // Load custom watchlist from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        if (Array.isArray(parsed) && parsed.length > 0) setWlTickers(parsed);
      }
    } catch { /* ignore */ }
  }, []);

  const saveWlTickers = (tickers: string[]) => {
    setWlTickers(tickers);
    try { localStorage.setItem(LS_KEY, JSON.stringify(tickers)); } catch { /* ignore */ }
  };

  const removeTicker = (ticker: string) => {
    saveWlTickers(wlTickers.filter(t => t !== ticker));
    setWatchlist(prev => prev.filter(w => w.ticker !== ticker));
  };

  const addTicker = async () => {
    const t = newTicker.trim().toUpperCase();
    if (!t || wlTickers.includes(t)) { setAddingTicker(false); setNewTicker(''); return; }
    const updated = [...wlTickers, t];
    saveWlTickers(updated);
    setAddingTicker(false);
    setNewTicker('');
    // Fetch quote for new ticker
    try {
      const r = await fetch(`/api/finance/quotes?tickers=${t}`);
      const d = await r.json();
      if (d.ok && d.quotes?.[0]) {
        setWatchlist(prev => [...prev, d.quotes[0]]);
      } else {
        setWatchlist(prev => [...prev, { ticker: t, quote: null }]);
      }
    } catch {
      setWatchlist(prev => [...prev, { ticker: t, quote: null }]);
    }
  };

  const refresh = useCallback(async (tickers?: string[]) => {
    setRefreshing(true);
    const tick = ++tickRef.current;
    const wl = tickers ?? wlTickers;
    try {
      const [mktRes, quotesRes, newsRes] = await Promise.allSettled([
        fetch('/api/finance/markets').then(r => r.json()),
        fetch(`/api/finance/quotes?tickers=${wl.join(',')}`).then(r => r.json()),
        fetch('/api/finance/news/%5EGSPC?count=5').then(r => r.json()),
      ]);
      if (tick !== tickRef.current) return;
      if (mktRes.status === 'fulfilled' && mktRes.value.ok) {
        const ov = mktRes.value.overview;
        setIndices(ov.indices ?? []);
        setMktState(ov.marketState ?? 'CLOSED');
        setGainers(ov.gainers ?? []);
        setLosers(ov.losers ?? []);
        setActives(ov.actives ?? []);
        setSectors(ov.sectors ?? []);
      }
      if (quotesRes.status === 'fulfilled' && quotesRes.value.ok) {
        setWatchlist(quotesRes.value.quotes);
      }
      if (newsRes.status === 'fulfilled' && newsRes.value.ok) {
        setNews(newsRes.value.news ?? []);
      }
      setUpdatedAt(new Date());
    } catch { /* silent */ } finally {
      setRefreshing(false);
    }
  }, [wlTickers]);

  // On first mount, refresh with stored tickers (may differ from defaults before LS loads)
  useEffect(() => {
    refresh();
    const id = setInterval(() => refresh(), 30_000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const vix    = indices.find(i => i.symbol === '^VIX');
  const fear   = vix ? fearLabel(vix.price) : null;
  const open   = mktState === 'REGULAR';
  const mainIx = indices.filter(i => INDEX_ORDER.includes(i.symbol))
    .sort((a, b) => INDEX_ORDER.indexOf(a.symbol) - INDEX_ORDER.indexOf(b.symbol));

  return (
    <div style={{ marginTop: '2rem' }}>
      {/* ── Section header ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BarChart2 size={13} color={FC} />
          <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: FC }}>
            Market Intelligence
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
            fontSize: '0.5625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
            padding: '0.15rem 0.5rem', borderRadius: 3,
            background: open ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
            color: open ? '#22c55e' : '#ef4444',
            border: `1px solid ${open ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: open ? '#22c55e' : '#ef4444', display: 'inline-block' }} />
            {open ? 'Markets Open' : 'Markets Closed'}
          </span>
          {updatedAt && (
            <span style={{ fontSize: '0.5625rem', color: 'var(--text-muted)' }}>
              Updated {updatedAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
            </span>
          )}
          <RefreshCw size={9} className={refreshing ? 'animate-spin' : ''} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
        </div>
        <Link href="/finance" style={{ marginLeft: 'auto', fontSize: '0.6875rem', color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
          Full Finance Dashboard <ChevronRight size={11} />
        </Link>
      </div>

      {/* ── Index strip ─────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: 0, overflow: 'hidden',
        background: 'var(--bg-card)', border: '1px solid var(--border-default)',
        borderRadius: 'var(--r-lg)', marginBottom: '1rem',
      }}>
        {mainIx.map((idx, i) => {
          const pos    = idx.changePct >= 0;
          const isVix  = idx.symbol === '^VIX';
          const label  = INDEX_LABELS[idx.symbol] ?? idx.name;
          return (
            <div key={idx.symbol} style={{
              flex: 1, padding: '0.75rem 1rem', minWidth: 0,
              borderRight: i < mainIx.length - 1 ? '1px solid var(--border-subtle)' : 'none',
              borderLeft: i === 0 ? `3px solid ${FC}` : 'none',
            }}>
              <div style={{ fontSize: '0.5625rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 3 }}>
                {label}
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)', lineHeight: 1 }}>
                {isVix ? idx.price.toFixed(2) : fmt(idx.price)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: 3 }}>
                {!isVix && (pos
                  ? <TrendingUp  size={9} color="var(--success)" />
                  : <TrendingDown size={9} color="var(--danger)" />
                )}
                <ChgBadge v={isVix ? -idx.changePct : idx.changePct} size="xs" />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Main 3-column grid ──────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>

        {/* Gainers */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.625rem 0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <TrendingUp size={11} color="var(--success)" />
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Top Gainers</span>
          </div>
          <div style={{ padding: '0.25rem 0' }}>
            {gainers.slice(0, 5).map(m => <MoverRow key={m.ticker} m={m} />)}
          </div>
        </div>

        {/* Losers */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.625rem 0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <TrendingDown size={11} color="var(--danger)" />
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Top Losers</span>
          </div>
          <div style={{ padding: '0.25rem 0' }}>
            {losers.slice(0, 5).map(m => <MoverRow key={m.ticker} m={m} />)}
          </div>
        </div>

        {/* Most Active */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.625rem 0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <Activity size={11} color="var(--info)" />
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Most Active</span>
          </div>
          <div style={{ padding: '0.25rem 0' }}>
            {actives.slice(0, 5).map(m => <MoverRow key={m.ticker} m={m} />)}
          </div>
        </div>
      </div>

      {/* ── Bottom row: Watchlist + Sectors/Fear + News ──────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: '1rem' }}>

        {/* Watchlist */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem 0.875rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Watchlist</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {addingTicker ? (
                <form onSubmit={e => { e.preventDefault(); addTicker(); }} style={{ display: 'flex', gap: '0.25rem' }}>
                  <input
                    autoFocus
                    value={newTicker}
                    onChange={e => setNewTicker(e.target.value.toUpperCase())}
                    placeholder="TICKER"
                    maxLength={6}
                    style={{
                      width: 72, padding: '0.1rem 0.4rem', fontSize: '0.6875rem', fontWeight: 700,
                      background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
                      borderRadius: 4, color: 'var(--text-primary)', outline: 'none',
                    }}
                  />
                  <button type="submit" style={{ fontSize: '0.5625rem', padding: '0.1rem 0.4rem', borderRadius: 3, background: FC, color: '#000', fontWeight: 700, border: 'none', cursor: 'pointer' }}>Add</button>
                  <button type="button" onClick={() => { setAddingTicker(false); setNewTicker(''); }} style={{ fontSize: '0.5625rem', padding: '0.1rem 0.4rem', borderRadius: 3, background: 'var(--bg-elevated)', color: 'var(--text-muted)', fontWeight: 700, border: '1px solid var(--border-default)', cursor: 'pointer' }}>✕</button>
                </form>
              ) : (
                <button onClick={() => setAddingTicker(true)} style={{ fontSize: '0.5625rem', padding: '0.1rem 0.4rem', borderRadius: 3, background: 'var(--bg-elevated)', color: FC, fontWeight: 700, border: `1px solid ${FC}30`, cursor: 'pointer' }}>+ Add</button>
              )}
              <Link href="/finance" style={{ fontSize: '0.5625rem', color: FC, textDecoration: 'none' }}>Research →</Link>
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                {['Symbol', 'Price', 'Change', 'Signal', ''].map((h, idx) => (
                  <th key={idx} style={{ padding: '0.3rem 0.75rem', fontSize: '0.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', textAlign: h === 'Symbol' ? 'left' : 'right' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {watchlist.length === 0
                ? wlTickers.map(ticker => (
                  <tr key={ticker} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '0.4rem 0.75rem' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: FC }}>{ticker}</div>
                    </td>
                    <td style={{ padding: '0.4rem 0.75rem', textAlign: 'right', color: 'var(--text-muted)' }}>—</td>
                    <td style={{ padding: '0.4rem 0.75rem', textAlign: 'right', color: 'var(--text-muted)' }}>—</td>
                    <td style={{ padding: '0.4rem 0.75rem', textAlign: 'right', color: 'var(--text-muted)' }}>—</td>
                    <td style={{ padding: '0.3rem 0.5rem', textAlign: 'right' }}>
                      <button onClick={() => removeTicker(ticker)} style={{ fontSize: '0.5rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5 }}>✕</button>
                    </td>
                  </tr>
                ))
                : watchlist.map(({ ticker, quote }) => {
                  const sig = maCrossoverSignal(quote);
                  return (
                    <tr key={ticker} style={{ borderBottom: '1px solid var(--border-subtle)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '0.4rem 0.75rem' }}>
                        <Link href={`/finance/${ticker}`} style={{ textDecoration: 'none' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: FC }}>{ticker}</div>
                          <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{quote?.name ?? ''}</div>
                        </Link>
                      </td>
                      <td style={{ padding: '0.4rem 0.75rem', textAlign: 'right', fontFamily: 'var(--font-display)', fontSize: '0.8125rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)' }}>
                        {quote ? `$${quote.price.toFixed(2)}` : '—'}
                      </td>
                      <td style={{ padding: '0.4rem 0.75rem', textAlign: 'right' }}>
                        {quote ? <ChgBadge v={quote.changePct} size="xs" /> : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                      <td style={{ padding: '0.4rem 0.75rem', textAlign: 'right' }}>
                        {sig ? (
                          <span style={{ fontSize: '0.5rem', fontWeight: 700, padding: '0.1rem 0.35rem', borderRadius: 2, color: sig.color, background: `${sig.color}15`, border: `1px solid ${sig.color}30` }}>
                            {sig.label}
                          </span>
                        ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                      <td style={{ padding: '0.3rem 0.5rem', textAlign: 'right' }}>
                        <button onClick={() => removeTicker(ticker)} style={{ fontSize: '0.5rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5 }} title="Remove">✕</button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Sectors + Fear gauge */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Fear & Greed */}
          {fear && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--r-lg)', padding: '0.875rem' }}>
              <div style={{ fontSize: '0.5625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 8 }}>
                Fear &amp; Greed · VIX {vix?.price.toFixed(2)}
              </div>
              <div style={{ height: 6, borderRadius: 3, overflow: 'hidden', background: 'var(--bg-elevated)', marginBottom: 6 }}>
                <div style={{ height: '100%', width: `${fear.pct}%`, background: `linear-gradient(90deg, #ef4444, #f97316, #f59e0b, #22c55e)`, borderRadius: 3 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: fear.color }}>{fear.label}</span>
                <span style={{ fontSize: '0.5625rem', color: 'var(--text-muted)' }}>{fear.pct}/100</span>
              </div>
            </div>
          )}

          {/* Sector performance */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--r-lg)', overflow: 'hidden', flex: 1 }}>
            <div style={{ padding: '0.625rem 0.875rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Sectors</span>
            </div>
            <div style={{ padding: '0.5rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {sectors.slice(0, 8).map(s => {
                const pos = s.changePct >= 0;
                const w   = Math.min(Math.abs(s.changePct) / 3 * 100, 100);
                return (
                  <div key={s.sector} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ fontSize: '0.5625rem', color: 'var(--text-muted)', width: 80, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.sector}
                    </div>
                    <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${w}%`, background: pos ? 'var(--success)' : 'var(--danger)', opacity: 0.8 }} />
                    </div>
                    <span style={{ fontSize: '0.5625rem', fontWeight: 700, width: 40, textAlign: 'right', flexShrink: 0, color: pos ? 'var(--success)' : 'var(--danger)' }}>
                      {pct(s.changePct)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Market News */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.625rem 0.875rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <Newspaper size={11} color="var(--text-muted)" />
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Market News</span>
            <Link href="/finance/news" style={{ marginLeft: 'auto', fontSize: '0.5625rem', color: 'var(--text-muted)', textDecoration: 'none' }}>More →</Link>
          </div>
          <div>
            {news.slice(0, 5).map((a, i) => (
              <a key={i} href={a.url} target="_blank" rel="noopener noreferrer" style={{
                display: 'block', padding: '0.625rem 0.875rem', textDecoration: 'none', color: 'inherit',
                borderBottom: i < Math.min(news.length, 5) - 1 ? '1px solid var(--border-subtle)' : 'none',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{
                  fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.4,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                } as React.CSSProperties}>
                  {a.title}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: 4 }}>
                  {a.publisher && (
                    <span style={{ fontSize: '0.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: FC, background: `${FC}15`, padding: '0.1rem 0.3rem', borderRadius: 2 }}>
                      {a.publisher}
                    </span>
                  )}
                  <span style={{ fontSize: '0.5rem', color: 'var(--text-muted)' }}>{timeAgo(a.publishedAt)}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', fontSize: '0.5625rem', color: 'var(--text-muted)', marginTop: '0.75rem', opacity: 0.6 }}>
        Data via Yahoo Finance · Auto-refreshes every 30s · Not financial advice
      </div>
    </div>
  );
}
