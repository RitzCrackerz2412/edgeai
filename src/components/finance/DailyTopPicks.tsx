'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { TrendingUp, RefreshCw, Star, Target } from 'lucide-react';
import type { TopPickEntry } from '@/lib/finance/providers/yahoo';

function fmtCap(v: number | null): string {
  if (v == null) return '';
  if (v >= 1e12) return `$${(v / 1e12).toFixed(1)}T`;
  if (v >= 1e9)  return `$${(v / 1e9).toFixed(1)}B`;
  return `$${(v / 1e6).toFixed(0)}M`;
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? '#22c55e' : score >= 58 ? '#f59e0b' : '#94a3b8';
  const bg    = score >= 70 ? 'rgba(34,197,94,0.1)' : score >= 58 ? 'rgba(245,158,11,0.1)' : 'rgba(148,163,184,0.1)';
  return (
    <span
      className="text-[10px] font-black font-mono px-1.5 py-0.5 rounded"
      style={{ color, background: bg }}
    >
      {score}
    </span>
  );
}

interface Props {
  initialPicks: TopPickEntry[];
}

export function DailyTopPicks({ initialPicks }: Props) {
  const [picks, setPicks]         = useState(initialPicks);
  const [refreshing, setRefreshing] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const r = await fetch('/api/finance/top-picks');
      const d = await r.json();
      if (d.ok && d.picks?.length) {
        setPicks(d.picks);
        setGeneratedAt(d.generatedAt);
      }
    } catch { /* silent */ } finally {
      setRefreshing(false);
    }
  }, []);

  // Refresh once per hour
  useEffect(() => {
    const id = setInterval(refresh, 3_600_000);
    return () => clearInterval(id);
  }, [refresh]);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <div
      className="rounded-2xl p-5 space-y-4"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(16,185,129,0.12)' }}
          >
            <Star size={13} style={{ color: '#10b981' }} />
          </div>
          <div>
            <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              Today's Top Picks
            </div>
            <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              {today} · Scored by fundamentals + momentum
            </div>
          </div>
        </div>
        <button
          onClick={refresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-lg transition-opacity hover:opacity-70"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}
        >
          <RefreshCw size={9} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {picks.length === 0 ? (
        <div className="py-8 flex flex-col items-center gap-2" style={{ color: 'var(--text-muted)' }}>
          <TrendingUp size={20} style={{ opacity: 0.4 }} />
          <span className="text-xs">Loading picks…</span>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-2">
          {picks.map((pick, i) => {
            const pos = pick.changePct >= 0;
            const range = pick.week52High - pick.week52Low;
            const rangePct = range > 0 ? Math.round(((pick.price - pick.week52Low) / range) * 100) : 50;

            return (
              <Link
                key={pick.ticker}
                href={`/finance/${pick.ticker}`}
                className="group flex items-start gap-3 rounded-xl p-3 transition-all hover:opacity-90"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  textDecoration: 'none',
                }}
              >
                {/* Rank */}
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5"
                  style={{ background: i < 3 ? 'rgba(16,185,129,0.15)' : 'var(--border-subtle)', color: i < 3 ? '#10b981' : 'var(--text-muted)' }}
                >
                  {i + 1}
                </div>

                {/* Main info */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{pick.ticker}</span>
                      <ScoreBadge score={pick.score} />
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold font-mono" style={{ color: 'var(--text-primary)' }}>
                        ${pick.price.toFixed(2)}
                      </div>
                      <div className="text-[10px] font-semibold font-mono" style={{ color: pos ? 'var(--success)' : 'var(--danger)' }}>
                        {pos ? '+' : ''}{pick.changePct.toFixed(2)}%
                      </div>
                    </div>
                  </div>

                  <div className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>{pick.name}</div>

                  {/* 52-week bar */}
                  <div className="space-y-0.5">
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--border-muted)' }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${rangePct}%`, background: '#10b981', opacity: 0.7 }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px]" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>
                      <span>${pick.week52Low.toFixed(0)}</span>
                      <span>{rangePct}% of 52-wk</span>
                      <span>${pick.week52High.toFixed(0)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[10px] italic" style={{ color: 'var(--text-muted)', opacity: 0.8 }}>
                      {pick.rationale}
                    </span>
                    {pick.upsidePct != null && (
                      <div className="flex items-center gap-0.5 shrink-0" style={{ color: pick.upsidePct > 0 ? '#10b981' : 'var(--danger)' }}>
                        <Target size={9} />
                        <span className="text-[10px] font-semibold">
                          {pick.upsidePct > 0 ? '+' : ''}{pick.upsidePct.toFixed(0)}% target
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <p className="text-[9px] text-center" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
        Scored by valuation, momentum & analyst consensus · Not financial advice · Refreshes hourly
      </p>
    </div>
  );
}
