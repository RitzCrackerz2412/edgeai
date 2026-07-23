'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown, RefreshCw, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import type { PropEVAnalysis, EVRating } from '@/lib/props/types';
import { POWER_PLAY_MULTIPLIERS } from '@/lib/props/types';
import type { Sport } from '@/lib/types';

interface Props {
  sport: Sport;
  homeTeam: string;
  awayTeam: string;
}

const RATING_CONFIG: Record<EVRating, { label: string; color: string; bg: string; border: string }> = {
  strong:  { label: 'Strong +EV', color: '#22c55e', bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.25)' },
  good:    { label: '+EV',        color: '#4ade80', bg: 'rgba(74,222,128,0.08)', border: 'rgba(74,222,128,0.2)' },
  lean:    { label: 'Lean +EV',   color: '#86efac', bg: 'rgba(134,239,172,0.07)', border: 'rgba(134,239,172,0.18)' },
  neutral: { label: 'Neutral',    color: 'var(--text-muted)', bg: 'var(--bg-elevated)', border: 'var(--border-subtle)' },
  fade:    { label: 'Fade',       color: '#ef4444', bg: 'rgba(239,68,68,0.07)', border: 'rgba(239,68,68,0.2)' },
};

const SLIP_CONFIG: Record<'Power' | 'Flex' | 'Skip', { color: string; bg: string }> = {
  Power: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  Flex:  { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  Skip:  { color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
};

function noVigLabel(odds: number): string {
  return odds > 0 ? `+${odds}` : `${odds}`;
}

function PropCard({ prop }: { prop: PropEVAnalysis }) {
  const [expanded, setExpanded] = useState(false);
  const rc = RATING_CONFIG[prop.rating];
  const sc = SLIP_CONFIG[prop.slipRecommendation];
  const isOver = prop.bestSide === 'Over';

  return (
    <div
      style={{
        border: `1px solid ${rc.border}`,
        borderRadius: 'var(--r-lg)',
        background: 'var(--bg-card)',
        overflow: 'hidden',
      }}
    >
      {/* Header row */}
      <div style={{ padding: '0.75rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          {/* EV rating badge */}
          <span style={{
            fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
            padding: '0.2rem 0.5rem', borderRadius: 4,
            background: rc.bg, color: rc.color, border: `1px solid ${rc.border}`,
          }}>
            {rc.label}
          </span>
          {/* Slip type badge */}
          <span style={{
            fontSize: '0.6rem', fontWeight: 700, padding: '0.2rem 0.45rem', borderRadius: 4,
            background: sc.bg, color: sc.color,
          }}>
            {prop.slipRecommendation} Play
          </span>
          {prop.booksCount > 0 && (
            <span style={{ marginLeft: 'auto', fontSize: '0.6rem', color: 'var(--text-muted)' }}>
              {prop.booksCount} book{prop.booksCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Player + prop */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {prop.player}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 1 }}>
              {prop.marketLabel} — Line: <strong>{prop.line}</strong>
            </div>
          </div>

          {/* Best side + edge */}
          <div style={{ textAlign: 'right' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.3rem', justifyContent: 'flex-end',
              fontSize: '1rem', fontWeight: 800, color: isOver ? '#22c55e' : '#ef4444',
            }}>
              {isOver ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {prop.bestSide} {prop.line}
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: prop.bestEdgePct >= 5 ? '#22c55e' : 'var(--text-secondary)' }}>
              +{prop.bestEdgePct.toFixed(1)}% edge
            </div>
          </div>
        </div>

        {/* No-vig bar */}
        <div style={{ marginTop: '0.625rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: 3 }}>
            <span>No-vig Over {prop.noVigOverPct.toFixed(1)}%</span>
            <span>No-vig Under {prop.noVigUnderPct.toFixed(1)}%</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${prop.noVigOverPct}%`, background: prop.noVigOverPct >= 50 ? '#22c55e' : '#ef4444', borderRadius: 3 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 3 }}>
            <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>50% PrizePicks threshold</span>
          </div>
        </div>
      </div>

      {/* Expand button */}
      <button
        onClick={() => setExpanded(v => !v)}
        style={{
          width: '100%', padding: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
          fontSize: '0.65rem', color: 'var(--text-muted)', background: 'var(--bg-elevated)',
          border: 'none', borderTop: '1px solid var(--border-subtle)', cursor: 'pointer',
        }}
      >
        {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        {expanded ? 'Hide' : 'Show'} line comparison & breakeven
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

          {/* Line comparison by book */}
          {prop.bookLines.length > 0 && (
            <div>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                Line Comparison
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {prop.bookLines.map((bl, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{bl.book}</span>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <span style={{ color: '#22c55e' }}>Over {noVigLabel(bl.overOdds)}</span>
                      <span style={{ color: '#ef4444' }}>Under {noVigLabel(bl.underOdds)}</span>
                    </div>
                  </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', borderTop: '1px solid var(--border-subtle)', paddingTop: 4, marginTop: 2 }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Consensus</span>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <span style={{ fontWeight: 700, color: '#22c55e' }}>Over {noVigLabel(prop.overOdds)}</span>
                    <span style={{ fontWeight: 700, color: '#ef4444' }}>Under {noVigLabel(prop.underOdds)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* No-vig calculation */}
          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              No-Vig Fair Odds (Vig: {prop.vigPct.toFixed(1)}%)
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <div style={{ flex: 1, padding: '0.5rem', borderRadius: 8, background: prop.bestSide === 'Over' ? 'rgba(34,197,94,0.08)' : 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: 2 }}>Over (true prob)</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: prop.noVigOverPct >= 50 ? '#22c55e' : 'var(--text-secondary)' }}>
                  {prop.noVigOverPct.toFixed(1)}%
                </div>
                <div style={{ fontSize: '0.6rem', color: prop.overEdgePct >= 0 ? '#22c55e' : '#ef4444' }}>
                  {prop.overEdgePct >= 0 ? '+' : ''}{prop.overEdgePct.toFixed(1)}% vs PrizePicks
                </div>
              </div>
              <div style={{ flex: 1, padding: '0.5rem', borderRadius: 8, background: prop.bestSide === 'Under' ? 'rgba(34,197,94,0.08)' : 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: 2 }}>Under (true prob)</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: prop.noVigUnderPct >= 50 ? '#22c55e' : 'var(--text-secondary)' }}>
                  {prop.noVigUnderPct.toFixed(1)}%
                </div>
                <div style={{ fontSize: '0.6rem', color: prop.underEdgePct >= 0 ? '#22c55e' : '#ef4444' }}>
                  {prop.underEdgePct >= 0 ? '+' : ''}{prop.underEdgePct.toFixed(1)}% vs PrizePicks
                </div>
              </div>
            </div>
          </div>

          {/* Power Play breakeven table */}
          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              Power Play Breakeven %
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 4 }}>
              {Object.entries(POWER_PLAY_MULTIPLIERS).map(([legs, mult]) => {
                const be = prop.bestSide === 'Over' ? prop.noVigOverPct : prop.noVigUnderPct;
                const breakevenNeeded = prop.breakeven[Number(legs)];
                const beats = be >= breakevenNeeded;
                return (
                  <div key={legs} style={{
                    padding: '0.4rem 0.3rem', borderRadius: 6, textAlign: 'center',
                    background: beats ? 'rgba(34,197,94,0.08)' : 'var(--bg-card)',
                    border: `1px solid ${beats ? 'rgba(34,197,94,0.2)' : 'var(--border-subtle)'}`,
                  }}>
                    <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>{legs}-leg {mult}x</div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: beats ? '#22c55e' : 'var(--text-secondary)' }}>
                      {breakevenNeeded}%
                    </div>
                    <div style={{ fontSize: '0.5rem', color: beats ? '#22c55e' : '#ef4444' }}>
                      {beats ? '✓ beats' : '✗ need'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Slip recommendation */}
          <div style={{
            padding: '0.5rem 0.75rem', borderRadius: 8,
            background: SLIP_CONFIG[prop.slipRecommendation].bg,
            border: `1px solid ${SLIP_CONFIG[prop.slipRecommendation].color}40`,
          }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: SLIP_CONFIG[prop.slipRecommendation].color, marginBottom: 2 }}>
              Recommendation: {prop.slipRecommendation} Play
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              {prop.slipReason}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function PlayerPropsEV({ sport, homeTeam, awayTeam }: Props) {
  const [props, setProps]       = useState<PropEVAnalysis[]>([]);
  const [loading, setLoading]   = useState(true);
  const [hasKey, setHasKey]     = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [filter, setFilter]     = useState<'all' | 'over' | 'under'>('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/props/ev?sport=${encodeURIComponent(sport)}&home=${encodeURIComponent(homeTeam)}&away=${encodeURIComponent(awayTeam)}`,
      );
      const data = await res.json();
      if (data.ok) {
        setProps(data.props ?? []);
        setHasKey(data.hasOddsKey);
      } else {
        setHasKey(false);
        setError(data.error ?? 'Failed to load props');
      }
    } catch (e) {
      setError('Network error — could not load player props');
    } finally {
      setLoading(false);
    }
  }, [sport, homeTeam, awayTeam]);

  useEffect(() => { load(); }, [load]);

  const visible = props.filter(p => {
    if (filter === 'over')  return p.bestSide === 'Over';
    if (filter === 'under') return p.bestSide === 'Under';
    return true;
  });

  const evProps   = props.filter(p => p.bestEdgePct >= 2);
  const strongEV  = props.filter(p => p.rating === 'strong' || p.rating === 'good');

  return (
    <div className="space-y-4">
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        Line comparison methodology: no-vig fair odds from sharp sportsbooks vs PrizePicks implied 50%. For informational purposes only.
      </p>

      {error && (
        <div style={{ display: 'flex', gap: '0.5rem', padding: '0.625rem 0.75rem', borderRadius: 8, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <AlertCircle size={14} style={{ color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{error}</p>
        </div>
      )}

      {!error && !hasKey && (
        <div style={{ display: 'flex', gap: '0.5rem', padding: '0.625rem 0.75rem', borderRadius: 8, background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <AlertCircle size={14} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            Showing demo data. Add <code style={{ fontFamily: 'var(--font-mono)' }}>ODDS_API_KEY</code> to .env.local for live sportsbook lines.
          </p>
        </div>
      )}

      {/* Summary stats */}
      {!loading && props.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.5rem' }}>
          {[
            { label: 'Props analyzed', value: props.length },
            { label: '+EV plays (≥2%)', value: evProps.length, color: '#22c55e' },
            { label: 'Strong EV',       value: strongEV.length, color: '#4ade80' },
          ].map(s => (
            <div key={s.label} style={{ padding: '0.625rem', borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: s.color ?? 'var(--text-primary)' }}>{s.value}</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 1 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      {!loading && props.length > 0 && (
        <div style={{ display: 'flex', gap: '0.375rem' }}>
          {(['all', 'over', 'under'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '0.3rem 0.75rem', borderRadius: 6, fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer',
                background: filter === f ? 'var(--accent)' : 'var(--bg-elevated)',
                color: filter === f ? '#fff' : 'var(--text-secondary)',
                border: `1px solid ${filter === f ? 'var(--accent)' : 'var(--border-subtle)'}`,
              }}
            >
              {f === 'all' ? 'All Props' : f === 'over' ? '↑ Overs' : '↓ Unders'}
            </button>
          ))}
          <button
            onClick={load}
            style={{
              marginLeft: 'auto', padding: '0.3rem 0.5rem', borderRadius: 6,
              background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem',
              fontSize: '0.65rem', color: 'var(--text-muted)',
            }}
          >
            <RefreshCw size={10} /> Refresh
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 96, borderRadius: 12, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      )}

      {/* Props list */}
      {!loading && visible.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {visible.map((prop, i) => <PropCard key={`${prop.player}-${prop.market}-${i}`} prop={prop} />)}
        </div>
      )}

      {!loading && visible.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          No +EV props found for this game.
        </div>
      )}

      <div style={{ textAlign: 'center', paddingTop: 4 }}>
        <Link href="/prizepicks" style={{ fontSize: '0.7rem', color: 'var(--accent)', textDecoration: 'none' }}>
          View all today's +EV plays →
        </Link>
      </div>
    </div>
  );
}
