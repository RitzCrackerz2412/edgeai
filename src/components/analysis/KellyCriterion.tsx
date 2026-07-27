'use client';

import { useState, useMemo } from 'react';
import { AlertTriangle, Info, TrendingDown } from 'lucide-react';

interface Props {
  ensembleAvg: number;   // home win probability 0–100
  highUncertainty: boolean;
  homeTeam: string;
  awayTeam: string;
}

function americanToDecimal(american: number): number {
  if (american > 0) return american / 100 + 1;
  return 100 / Math.abs(american) + 1;
}

/** Kelly fraction: f = (b·p − q) / b */
function kellyFraction(decimalOdds: number, winProb: number): number {
  const b = decimalOdds - 1;
  const p = winProb;
  const q = 1 - p;
  if (b <= 0) return 0;
  return (b * p - q) / b;
}

export function KellyCriterion({ ensembleAvg, highUncertainty, homeTeam, awayTeam }: Props) {
  const [odds, setOdds]         = useState('');
  const [betSide, setBetSide]   = useState<'home' | 'away'>('home');
  const [bankroll, setBankroll] = useState('1000');
  const [showTooltip, setShowTooltip] = useState(false);

  const winProb = useMemo(() => {
    const raw = betSide === 'home' ? ensembleAvg / 100 : 1 - ensembleAvg / 100;
    return raw;
  }, [ensembleAvg, betSide]);

  const result = useMemo(() => {
    const oddsNum = parseInt(odds, 10);
    if (!odds || isNaN(oddsNum) || oddsNum === 0 || oddsNum === -100 || oddsNum === 100) return null;

    // American odds must be |n| >= 100
    if (Math.abs(oddsNum) < 100) return null;

    const decimal = americanToDecimal(oddsNum);
    const f       = kellyFraction(decimal, winProb);
    const bankAmt = parseFloat(bankroll) || 0;

    return {
      fullKelly:    f,
      halfKelly:    f / 2,
      quarterKelly: f / 4,
      fullAmt:      bankAmt * f,
      halfAmt:      bankAmt * f / 2,
      quarterAmt:   bankAmt * f / 4,
      noEdge:       f <= 0,
      decimal,
    };
  }, [odds, winProb, bankroll]);

  const probPct = (winProb * 100).toFixed(1);
  const teamLabel = betSide === 'home' ? homeTeam : awayTeam;

  return (
    <div className="space-y-4">

      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Model win probability used:&nbsp;
            <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{probPct}%</span>
            <span className="ml-1" style={{ color: 'var(--text-muted)' }}>
              ({teamLabel.split(' ').slice(-1)[0]})
            </span>
          </p>
        </div>
        <button
          className="relative"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          aria-label="What is Kelly Criterion?"
        >
          <Info size={15} style={{ color: 'var(--text-muted)', cursor: 'help' }} />
          {showTooltip && (
            <div
              className="absolute right-0 top-6 w-72 rounded-xl px-4 py-3 text-xs leading-relaxed z-20"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}
            >
              <p className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Kelly Criterion</p>
              <p>A mathematical formula that calculates the optimal fraction of your bankroll to wager to maximize long-run growth rate.</p>
              <p className="mt-1.5 font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>
                f = (b·p − q) / b
              </p>
              <p className="mt-1.5">
                <span className="font-semibold">b</span> = decimal odds − 1 &nbsp;·&nbsp;
                <span className="font-semibold">p</span> = model win prob &nbsp;·&nbsp;
                <span className="font-semibold">q</span> = 1 − p
              </p>
              <p className="mt-1.5" style={{ color: '#f59e0b' }}>
                Half/Quarter Kelly are safer in practice — full Kelly assumes zero estimation error.
              </p>
            </div>
          )}
        </button>
      </div>

      {/* High uncertainty lockout */}
      {highUncertainty ? (
        <div
          className="flex items-center gap-3 rounded-xl px-4 py-3"
          style={{
            background: 'rgba(245,158,11,0.06)',
            border: '1px solid rgba(245,158,11,0.2)',
          }}
        >
          <AlertTriangle size={16} style={{ color: '#f59e0b', flexShrink: 0 }} />
          <p className="text-sm" style={{ color: '#f59e0b' }}>
            Ensemble disagreement too high — sizing unreliable. Resolve model conflict before using Kelly.
          </p>
        </div>
      ) : (
        <>
          {/* Inputs */}
          <div className="grid grid-cols-2 gap-3">
            {/* Bet side */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest block mb-1" style={{ color: 'var(--text-muted)' }}>
                Betting on
              </label>
              <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-default)' }}>
                {(['home', 'away'] as const).map(side => (
                  <button
                    key={side}
                    onClick={() => setBetSide(side)}
                    className="flex-1 py-1.5 text-xs font-semibold transition-colors"
                    style={{
                      background: betSide === side ? 'var(--accent)' : 'var(--bg-elevated)',
                      color: betSide === side ? '#fff' : 'var(--text-muted)',
                    }}
                  >
                    {side === 'home' ? homeTeam.split(' ').slice(-1)[0] : awayTeam.split(' ').slice(-1)[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Bankroll */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest block mb-1" style={{ color: 'var(--text-muted)' }}>
                Bankroll ($)
              </label>
              <input
                type="number"
                value={bankroll}
                onChange={e => setBankroll(e.target.value)}
                placeholder="1000"
                className="w-full rounded-lg px-3 py-1.5 text-sm"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Odds input */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest block mb-1" style={{ color: 'var(--text-muted)' }}>
              Sportsbook odds (American format, e.g. −150 or +120)
            </label>
            <input
              type="number"
              value={odds}
              onChange={e => setOdds(e.target.value)}
              placeholder="-110"
              className="w-full rounded-lg px-3 py-2 text-sm"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            />
            {odds && result === null && (
              <p className="text-[10px] mt-1" style={{ color: '#ef4444' }}>
                Enter valid American odds (e.g. −110, +200). Must be ≥ 100 or ≤ −100.
              </p>
            )}
          </div>

          {/* Results */}
          {result && (
            result.noEdge ? (
              <div
                className="flex items-center gap-2 rounded-xl px-4 py-3"
                style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)' }}
              >
                <TrendingDown size={14} style={{ color: '#ef4444', flexShrink: 0 }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#ef4444' }}>No edge — do not bet</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    Kelly fraction is {(result.fullKelly * 100).toFixed(1)}%. The model&apos;s win probability does not overcome the book&apos;s implied edge at these odds ({result.decimal.toFixed(2)}x).
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                  Suggested wager sizes
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { label: 'Full Kelly', f: result.fullKelly, amt: result.fullAmt, color: '#22c55e', note: 'Aggressive' },
                    { label: 'Half Kelly', f: result.halfKelly, amt: result.halfAmt, color: '#f59e0b', note: 'Recommended' },
                    { label: '¼ Kelly',   f: result.quarterKelly, amt: result.quarterAmt, color: '#3b82f6', note: 'Conservative' },
                  ] as const).map(({ label, f, amt, color, note }) => (
                    <div
                      key={label}
                      className="rounded-xl p-3 text-center"
                      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
                    >
                      <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{label}</p>
                      <p className="text-lg font-black font-mono mt-1" style={{ color }}>
                        {(f * 100).toFixed(1)}%
                      </p>
                      <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                        ${amt.toFixed(0)}
                      </p>
                      <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{note}</p>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] leading-snug" style={{ color: 'var(--text-muted)' }}>
                  Based on ensemble win probability of {probPct}% vs. {result.decimal.toFixed(2)}x decimal odds. Half Kelly is recommended in practice — full Kelly assumes the model estimate is exact.
                </p>
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}
