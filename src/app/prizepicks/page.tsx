import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, TrendingDown, AlertCircle, Zap } from 'lucide-react';
import { getAllEVProps } from '@/lib/props/fetcher';
import type { PropEVAnalysis, EVRating } from '@/lib/props/types';
import { POWER_PLAY_MULTIPLIERS } from '@/lib/props/types';
import type { Sport } from '@/lib/types';

export const metadata: Metadata = {
  title: 'PrizePicks +EV Plays · EdgeAI',
  description: 'Line comparison and expected value analysis for PrizePicks player props.',
};

export const revalidate = 900; // 15 min

const SPORTS: Sport[] = ['NBA', 'NFL', 'MLB'];

const RATING_CONFIG: Record<EVRating, { label: string; color: string; bg: string }> = {
  strong:  { label: 'Strong +EV', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
  good:    { label: '+EV',        color: '#4ade80', bg: 'rgba(74,222,128,0.08)' },
  lean:    { label: 'Lean +EV',   color: '#86efac', bg: 'rgba(134,239,172,0.07)' },
  neutral: { label: 'Neutral',    color: 'var(--text-muted)', bg: 'var(--bg-elevated)' },
  fade:    { label: 'Fade',       color: '#ef4444', bg: 'rgba(239,68,68,0.07)' },
};

function EVBadge({ rating }: { rating: EVRating }) {
  const rc = RATING_CONFIG[rating];
  return (
    <span style={{
      fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
      padding: '0.2rem 0.5rem', borderRadius: 4, background: rc.bg, color: rc.color,
    }}>
      {rc.label}
    </span>
  );
}

interface GameSectionProps {
  home: string;
  away: string;
  time: string;
  props: PropEVAnalysis[];
}

function GameSection({ home, away, time, props }: GameSectionProps) {
  const gameTime = new Date(time);
  const isValid  = !isNaN(gameTime.getTime());

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border-default)',
      borderRadius: 'var(--r-xl)', overflow: 'hidden',
    }}>
      {/* Game header */}
      <div style={{
        padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-secondary)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
          {away} @ {home}
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          {isValid ? gameTime.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Today'}
        </div>
      </div>

      {/* Props table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              {['Player', 'Prop', 'Line', 'Best Side', 'No-Vig %', 'Edge', 'Slip'].map(h => (
                <th key={h} style={{
                  padding: '0.5rem 0.75rem', textAlign: 'left',
                  fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.07em', color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {props.map((p, i) => {
              const isOver  = p.bestSide === 'Over';
              const noVigP  = isOver ? p.noVigOverPct : p.noVigUnderPct;
              return (
                <tr key={i} style={{
                  borderBottom: i < props.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  background: i % 2 === 0 ? 'transparent' : 'var(--bg-secondary)',
                }}>
                  <td style={{ padding: '0.6rem 0.75rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                    {p.player}
                  </td>
                  <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {p.marketLabel}
                  </td>
                  <td style={{ padding: '0.6rem 0.75rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)' }}>
                    {p.line}
                  </td>
                  <td style={{ padding: '0.6rem 0.75rem', whiteSpace: 'nowrap' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                      fontWeight: 700, color: isOver ? '#22c55e' : '#ef4444',
                    }}>
                      {isOver ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {p.bestSide}
                    </span>
                  </td>
                  <td style={{ padding: '0.6rem 0.75rem', fontVariantNumeric: 'tabular-nums' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${noVigP}%`, background: noVigP >= 50 ? '#22c55e' : '#ef4444' }} />
                      </div>
                      <span style={{ color: noVigP >= 50 ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                        {noVigP.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '0.6rem 0.75rem' }}>
                    <EVBadge rating={p.rating} />
                  </td>
                  <td style={{ padding: '0.6rem 0.75rem', whiteSpace: 'nowrap' }}>
                    <span style={{
                      fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.45rem', borderRadius: 4,
                      background: p.slipRecommendation === 'Power' ? 'rgba(245,158,11,0.1)'
                               : p.slipRecommendation === 'Flex'  ? 'rgba(59,130,246,0.1)' : 'var(--bg-elevated)',
                      color: p.slipRecommendation === 'Power' ? '#f59e0b'
                           : p.slipRecommendation === 'Flex'  ? '#3b82f6' : 'var(--text-muted)',
                    }}>
                      {p.slipRecommendation}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default async function PrizePicksPage() {
  const hasKey = Boolean(process.env.ODDS_API_KEY);

  // Fetch all sports in parallel
  const results = await Promise.allSettled(
    SPORTS.map(sport => getAllEVProps(sport, 2)),
  );

  const allGames = results.flatMap((r, i) => {
    if (r.status !== 'fulfilled') return [];
    return r.value.map(g => ({ ...g, sport: SPORTS[i] }));
  });

  const topProps = allGames.flatMap(g => g.props).sort((a, b) => b.bestEdgePct - a.bestEdgePct);
  const strongEV = topProps.filter(p => p.rating === 'strong' || p.rating === 'good');

  return (
    <div className="p-6 max-w-screen-xl mx-auto space-y-6 anim-fade-in">

      {/* Back nav */}
      <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.85rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>
        <ArrowLeft size={14} /> Dashboard
      </Link>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Zap size={20} style={{ color: '#f59e0b' }} />
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              PrizePicks +EV Plays
            </h1>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
            Line comparison against sharp sportsbooks · No-vig fair odds · Expected value vs PrizePicks 50% baseline
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {SPORTS.map(s => (
            <span key={s} style={{
              fontSize: '0.7rem', fontWeight: 600, padding: '0.25rem 0.6rem', borderRadius: 6,
              background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)',
            }}>
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* Demo warning */}
      {!hasKey && (
        <div style={{ display: 'flex', gap: '0.625rem', padding: '0.75rem 1rem', borderRadius: 10, background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)' }}>
          <AlertCircle size={16} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontWeight: 700, fontSize: '0.8rem', color: '#f59e0b', margin: '0 0 0.25rem' }}>Demo Mode — Simulated Lines</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
              Add <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--bg-elevated)', padding: '0.1rem 0.3rem', borderRadius: 3 }}>ODDS_API_KEY</code> to
              {' '}<code style={{ fontFamily: 'var(--font-mono)' }}>.env.local</code> for live DraftKings, FanDuel, and Pinnacle lines via The Odds API.
            </p>
          </div>
        </div>
      )}

      {/* How it works — methodology from video */}
      <div style={{
        padding: '1rem', borderRadius: 'var(--r-lg)', background: 'var(--bg-card)',
        border: '1px solid var(--border-default)',
      }}>
        <h2 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', margin: '0 0 0.75rem' }}>
          How the +EV System Works
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
          {[
            { step: '1', title: 'Line Comparison', desc: 'Collect Over/Under odds for each player prop across DraftKings, FanDuel, and Pinnacle.' },
            { step: '2', title: 'Remove the Vig', desc: 'Apply the ratio method to strip out the bookmaker\'s edge and calculate the true probability for each side.' },
            { step: '3', title: '+EV vs PrizePicks', desc: 'PrizePicks prices every pick at ~50/50. Any prop with no-vig prob > 50% is +EV.' },
            { step: '4', title: 'Slip Type', desc: 'Power Play (all must hit) for high-confidence legs. Flex Play when you want to absorb 1 miss.' },
          ].map(s => (
            <div key={s.step} style={{ display: 'flex', gap: '0.625rem', alignItems: 'flex-start' }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.7rem', fontWeight: 800, color: '#000',
              }}>
                {s.step}
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{s.title}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      {topProps.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.625rem' }}>
          {[
            { label: 'Games analyzed', value: allGames.length },
            { label: 'Total props',    value: topProps.length },
            { label: '+EV plays',      value: topProps.filter(p => p.bestEdgePct >= 2).length, color: '#22c55e' },
            { label: 'Strong EV',      value: strongEV.length, color: '#4ade80' },
          ].map(s => (
            <div key={s.label} style={{
              padding: '0.875rem', borderRadius: 'var(--r-lg)', background: 'var(--bg-card)',
              border: '1px solid var(--border-default)', textAlign: 'center',
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color ?? 'var(--text-primary)' }}>{s.value}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Power Play breakeven reference */}
      <div style={{
        padding: '0.875rem 1rem', borderRadius: 'var(--r-lg)',
        background: 'var(--bg-card)', border: '1px solid var(--border-default)',
      }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '0.625rem' }}>
          Power Play Breakeven Win % Per Leg
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {Object.entries(POWER_PLAY_MULTIPLIERS).map(([legs, mult]) => {
            const be = +(Math.pow(1 / mult, 1 / Number(legs)) * 100).toFixed(1);
            return (
              <div key={legs} style={{
                padding: '0.5rem 0.75rem', borderRadius: 8, textAlign: 'center',
                background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
              }}>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{legs}-leg · {mult}x payout</div>
                <div style={{ fontSize: '0.925rem', fontWeight: 800, color: '#f59e0b' }}>{be}%</div>
                <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>win rate needed</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Games + props by sport */}
      {SPORTS.map((sport, si) => {
        const sportGames = allGames.filter(g => g.sport === sport && g.props.length > 0);
        if (sportGames.length === 0) return null;
        return (
          <div key={sport}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>{sport}</span>
              <span style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                {sportGames.reduce((s, g) => s + g.props.length, 0)} +EV props across {sportGames.length} game{sportGames.length !== 1 ? 's' : ''}
              </span>
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {sportGames.map(g => (
                <GameSection key={g.eventId} home={g.home} away={g.away} time={g.time} props={g.props} />
              ))}
            </div>
          </div>
        );
      })}

      {allGames.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
          No +EV props available right now. Check back when games are scheduled.
        </div>
      )}

      <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center', paddingBottom: '1rem' }}>
        EdgeAI does not facilitate or encourage gambling. This is a statistical model for informational purposes only.
      </p>
    </div>
  );
}
