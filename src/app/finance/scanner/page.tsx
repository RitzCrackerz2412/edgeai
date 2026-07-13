'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Scan, TrendingUp } from 'lucide-react';
import { FinanceSearchBar } from '@/components/finance/FinanceSearchBar';
import type { ScannerPreset, ScannerResult } from '@/lib/finance/types';

const FINANCE_COLOR = '#10b981';

const PRESETS: { id: ScannerPreset; label: string; desc: string; icon: string }[] = [
  { id: 'momentum_leaders',  label: 'Momentum Leaders',  desc: 'Stocks with the strongest price momentum', icon: '🚀' },
  { id: 'high_growth',       label: 'High Growth',       desc: 'Fast-growing companies with accelerating revenue', icon: '📈' },
  { id: 'deep_value',        label: 'Deep Value',        desc: 'Undervalued large caps trading at a discount', icon: '💎' },
  { id: 'low_debt_high_fcf', label: 'Quality / FCF',     desc: 'Low leverage + strong free cash flow generation', icon: '💰' },
  { id: 'dividend_growth',   label: 'Dividend Growth',   desc: 'Companies with growing dividend yields', icon: '💸' },
  { id: 'analyst_upgrades',  label: 'Analyst Upgrades',  desc: 'Stocks with recent analyst upgrades', icon: '⭐' },
  { id: 'insider_buying',    label: 'Most Active',        desc: 'Highest trading volume today', icon: '🔥' },
  { id: 'earnings_beat',     label: 'Undervalued Growth', desc: 'Growth stocks trading below fair value', icon: '🎯' },
];

function fmtBig(v: number | null): string {
  if (v == null) return '—';
  if (v >= 1e12) return `$${(v / 1e12).toFixed(1)}T`;
  if (v >= 1e9)  return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6)  return `$${(v / 1e6).toFixed(1)}M`;
  return '—';
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 75 ? '#22c55e' : score >= 55 ? '#f59e0b' : '#94a3b8';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'var(--border-default)' }}>
        <div className="h-full rounded-full" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-[10px] font-mono w-6 text-right" style={{ color }}>{score}</span>
    </div>
  );
}

export default function ScannerPage() {
  const [preset, setPreset] = useState<ScannerPreset>('momentum_leaders');
  const [results, setResults] = useState<ScannerResult[]>([]);
  const [label, setLabel]     = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard data-fetch pattern
    setLoading(true);
    fetch(`/api/finance/scanner?preset=${preset}`)
      .then(r => r.json())
      .then(d => { if (d.ok) { setResults(d.results ?? []); setLabel(d.label ?? ''); } })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [preset]);

  return (
    <div className="space-y-6 max-w-screen-2xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Scan size={12} style={{ color: FINANCE_COLOR }} />
            <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: FINANCE_COLOR }}>
              Opportunity Scanner
            </span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
            Market Scanner
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Find investment opportunities matching specific criteria
          </p>
        </div>
        <div className="w-full sm:w-80">
          <FinanceSearchBar />
        </div>
      </div>

      {/* Preset grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {PRESETS.map(p => (
          <button
            key={p.id}
            onClick={() => setPreset(p.id)}
            className="rounded-xl p-3 text-left transition-all cursor-pointer"
            style={{
              background: preset === p.id ? `${FINANCE_COLOR}15` : 'var(--bg-card)',
              border: `1px solid ${preset === p.id ? FINANCE_COLOR : 'var(--border-subtle)'}`,
            }}
          >
            <div className="text-base mb-1">{p.icon}</div>
            <div className="text-xs font-semibold" style={{ color: preset === p.id ? FINANCE_COLOR : 'var(--text-primary)' }}>{p.label}</div>
            <div className="text-[10px] mt-0.5 leading-tight" style={{ color: 'var(--text-muted)' }}>{p.desc}</div>
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
        <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {label || PRESETS.find(p => p.id === preset)?.label}
            </h3>
            {!loading && <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{results.length} results</p>}
          </div>
          <TrendingUp size={14} style={{ color: FINANCE_COLOR }} />
        </div>

        {loading ? (
          <div className="p-5 space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-12 rounded-lg animate-pulse" style={{ background: 'var(--bg-elevated)' }} />
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            No results returned for this screen. Try a different preset.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  {['Ticker', 'Company', 'Price', 'Today', 'Market Cap', 'P/E', 'Score', ''].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map(r => {
                  const pos = r.changePct >= 0;
                  return (
                    <tr
                      key={r.ticker}
                      style={{ borderBottom: '1px solid var(--border-subtle)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td className="px-4 py-3 font-bold" style={{ color: 'var(--text-primary)' }}>{r.ticker}</td>
                      <td className="px-4 py-3 text-xs max-w-[180px] truncate" style={{ color: 'var(--text-muted)' }}>{r.name}</td>
                      <td className="px-4 py-3 font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>${r.price.toFixed(2)}</td>
                      <td className="px-4 py-3 font-mono font-semibold" style={{ color: pos ? 'var(--success)' : 'var(--danger)' }}>
                        {pos ? '+' : ''}{r.changePct.toFixed(2)}%
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>{fmtBig(r.marketCap)}</td>
                      <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                        {r.metrics.pe ? `${r.metrics.pe.toFixed(1)}x` : '—'}
                      </td>
                      <td className="px-4 py-3" style={{ width: 100 }}>
                        <ScoreBar score={r.score} />
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/finance/${r.ticker}`}
                          className="text-[10px] font-semibold px-2 py-1 rounded"
                          style={{ background: `${FINANCE_COLOR}15`, color: FINANCE_COLOR, textDecoration: 'none' }}
                        >
                          Research →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
