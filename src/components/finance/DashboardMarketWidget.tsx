import Link from 'next/link';
import { TrendingUp, TrendingDown, Newspaper, ChevronRight, BarChart2 } from 'lucide-react';
import { getMarketOverview, getQuote, getNews } from '@/lib/finance/providers/yahoo';

const FINANCE_COLOR = '#10b981';

const WATCHLIST = [
  { ticker: 'AAPL',  name: 'Apple' },
  { ticker: 'NVDA',  name: 'NVIDIA' },
  { ticker: 'MSFT',  name: 'Microsoft' },
  { ticker: 'GOOGL', name: 'Alphabet' },
  { ticker: 'AMZN',  name: 'Amazon' },
  { ticker: 'META',  name: 'Meta' },
];

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

export async function DashboardMarketWidget() {
  const [overviewRes, newsRes, quotesRes] = await Promise.allSettled([
    getMarketOverview(),
    getNews('^GSPC', 5),
    Promise.allSettled(WATCHLIST.map(w => getQuote(w.ticker))),
  ]);

  const overview  = overviewRes.status  === 'fulfilled' ? overviewRes.value  : null;
  const news      = newsRes.status      === 'fulfilled' ? newsRes.value      : [];
  const rawQuotes = quotesRes.status    === 'fulfilled' ? quotesRes.value    : [];

  // Build enriched watchlist from settled quote results
  const stocks = WATCHLIST
    .map((w, i) => {
      const res = rawQuotes[i];
      const q   = res?.status === 'fulfilled' ? res.value : null;
      return q ? { ...w, price: q.price, changePct: q.changePct, change: q.change, marketCap: q.marketCap } : null;
    })
    .filter(Boolean) as { ticker: string; name: string; price: number; changePct: number; change: number; marketCap: number | null }[];

  // Sort by changePct desc — top movers first
  const topStocks = [...stocks].sort((a, b) => b.changePct - a.changePct).slice(0, 4);

  // Pull key indices
  const spx  = overview?.indices.find(i => i.symbol === '^GSPC');
  const ndx  = overview?.indices.find(i => i.symbol === '^IXIC');
  const vix  = overview?.indices.find(i => i.symbol === '^VIX');
  const open  = overview?.marketState === 'REGULAR';

  function ratingLabel(changePct: number): { label: string; color: string; bg: string } {
    if (changePct >= 2)   return { label: 'Strong Buy',  color: '#22c55e', bg: 'rgba(34,197,94,0.08)' };
    if (changePct >= 0.5) return { label: 'Buy',         color: '#4ade80', bg: 'rgba(74,222,128,0.07)' };
    if (changePct >= 0)   return { label: 'Hold',        color: 'var(--text-muted)', bg: 'var(--bg-elevated)' };
    return                       { label: 'Watch',       color: '#f87171', bg: 'rgba(239,68,68,0.07)' };
  }

  return (
    <>
      {/* ── Market Snapshot ──────────────────────────────────── */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.625rem' }}>
          <BarChart2 size={10} color={FINANCE_COLOR} />
          <span className="text-label" style={{ color: FINANCE_COLOR, opacity: 0.9 }}>Market Snapshot</span>
          <Link href="/finance" style={{
            marginLeft: 'auto', fontSize: '0.6875rem', color: 'var(--text-muted)',
            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem',
          }}>
            Full dashboard <ChevronRight size={11} />
          </Link>
        </div>

        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-default)',
          borderRadius: 'var(--r-lg)', overflow: 'hidden',
        }}>
          {/* Market status bar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.5rem 1rem',
            borderBottom: '1px solid var(--border-subtle)',
            background: open ? 'rgba(34,197,94,0.03)' : 'rgba(239,68,68,0.03)',
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: open ? '#22c55e' : '#ef4444',
              display: 'inline-block',
            }} />
            <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: open ? '#22c55e' : '#ef4444' }}>
              {open ? 'Markets Open' : 'Markets Closed'}
            </span>
          </div>

          {/* Indices */}
          {[
            { label: 'S&P 500', idx: spx },
            { label: 'Nasdaq',  idx: ndx },
            { label: 'VIX',     idx: vix },
          ].filter(r => r.idx).map(({ label, idx }, i, arr) => {
            if (!idx) return null;
            const pos = idx.changePct >= 0;
            const isVix = label === 'VIX';
            return (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.5625rem 1rem',
                borderBottom: i < arr.length - 1 ? '1px solid var(--border-subtle)' : 'none',
              }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)' }}>
                    {isVix ? idx.price.toFixed(2) : idx.price.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', justifyContent: 'flex-end' }}>
                    {isVix
                      ? <span style={{ fontSize: '0.625rem', color: pos ? '#ef4444' : '#22c55e' }}>{pos ? '+' : ''}{idx.changePct.toFixed(2)}%</span>
                      : <>
                          {pos ? <TrendingUp size={9} color="var(--success)" /> : <TrendingDown size={9} color="var(--danger)" />}
                          <span style={{ fontSize: '0.625rem', color: pos ? 'var(--success)' : 'var(--danger)' }}>{pos ? '+' : ''}{idx.changePct.toFixed(2)}%</span>
                        </>
                    }
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Top Stock Picks ──────────────────────────────────── */}
      {topStocks.length > 0 && (
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.625rem' }}>
            <TrendingUp size={10} color={FINANCE_COLOR} />
            <span className="text-label" style={{ color: FINANCE_COLOR, opacity: 0.9 }}>Top Stocks Today</span>
            <Link href="/finance" style={{
              marginLeft: 'auto', fontSize: '0.6875rem', color: 'var(--text-muted)',
              textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem',
            }}>
              All <ChevronRight size={11} />
            </Link>
          </div>

          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-default)',
            borderRadius: 'var(--r-lg)', overflow: 'hidden',
          }}>
            {topStocks.map((s, i, arr) => {
              const pos    = s.changePct >= 0;
              const rating = ratingLabel(s.changePct);
              return (
                <Link key={s.ticker} href={`/finance/${s.ticker}`} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.625rem 1rem', textDecoration: 'none', color: 'inherit',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  transition: 'background 0.1s',
                }}>
                  {/* Ticker badge */}
                  <div style={{
                    width: 30, height: 30, borderRadius: 'var(--r-sm)', flexShrink: 0,
                    background: `${FINANCE_COLOR}15`, border: `1px solid ${FINANCE_COLOR}25`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: '0.5rem', fontWeight: 800, color: FINANCE_COLOR }}>{s.ticker.slice(0, 4)}</span>
                  </div>

                  {/* Name + rating */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.name}
                    </div>
                    <span style={{
                      display: 'inline-block',
                      fontSize: '0.5rem', fontWeight: 700, padding: '0.1rem 0.35rem', borderRadius: 2, marginTop: 2,
                      background: rating.bg, color: rating.color,
                    }}>
                      {rating.label}
                    </span>
                  </div>

                  {/* Price + change */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 700, fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)' }}>
                      ${s.price.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '0.625rem', fontWeight: 600, color: pos ? 'var(--success)' : 'var(--danger)' }}>
                      {pos ? '+' : ''}{s.changePct.toFixed(2)}%
                    </div>
                  </div>
                </Link>
              );
            })}

            <Link href="/finance" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0.5rem', gap: '0.3rem',
              fontSize: '0.6875rem', color: FINANCE_COLOR, textDecoration: 'none',
              borderTop: '1px solid var(--border-subtle)',
            }}>
              Full AI research <ChevronRight size={10} />
            </Link>
          </div>
        </section>
      )}

      {/* ── Market News ──────────────────────────────────────── */}
      {news.length > 0 && (
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.625rem' }}>
            <Newspaper size={10} color="var(--text-muted)" />
            <span className="text-label">Market News</span>
            <Link href="/finance/news" style={{
              marginLeft: 'auto', fontSize: '0.6875rem', color: 'var(--text-muted)',
              textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem',
            }}>
              More <ChevronRight size={11} />
            </Link>
          </div>

          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-default)',
            borderRadius: 'var(--r-lg)', overflow: 'hidden',
          }}>
            {news.slice(0, 4).map((article, i, arr) => (
              <a
                key={i}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block', padding: '0.625rem 1rem', textDecoration: 'none', color: 'inherit',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  transition: 'background 0.1s',
                }}
              >
                <div style={{
                  fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-primary)',
                  lineHeight: 1.4,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>
                  {article.title}
                </div>
                <div style={{ fontSize: '0.5625rem', color: 'var(--text-muted)', marginTop: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  {article.source}{article.publishedAt ? ` · ${timeAgo(article.publishedAt)}` : ''}
                </div>
              </a>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
