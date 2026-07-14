import { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { getUpcomingGames, getAccuracyStats } from '@/lib/api';
import { ACTIVITY_FEED, TRENDING_TEAMS } from '@/lib/dashboardData';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { DashboardMarketWidget } from '@/components/finance/DashboardMarketWidget';
import {
  ChevronRight, TrendingUp, Target, Zap, Brain,
  Check, X, Flame, RefreshCw,
} from 'lucide-react';

export const metadata: Metadata = { title: 'Dashboard — EdgeAI' };
export const revalidate = 60;

const SPORT_COLOR: Record<string, string> = {
  NFL: '#2563eb', NBA: '#ea580c', MLB: '#16a34a', NHL: '#0ea5e9',
  Soccer: '#10b981', 'NCAA Football': '#e05c1a', 'NCAA Basketball': '#f59e0b',
  UFC: '#dc2626', Boxing: '#b91c1c', Tennis: '#ca8a04', 'Formula 1': '#dc2626',
  Cricket: '#059669', Esports: '#6366f1',
};

function isFinal(s: string) { return s === 'Final' || s === 'Final/OT' || s === 'Final/SO'; }
function isLive(s: string) { return s === 'Live' || s === 'Halftime' || s === 'Pregame'; }

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Inline mini sparkline bar — kills the "number + arrow" pattern
function MomentumBar({ value, direction }: { value: number; direction: 'hot' | 'cold' }) {
  const color = direction === 'hot' ? '#22c55e' : '#ef4444';
  const segments = 8;
  const filled = Math.round((value / 100) * segments);
  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      {Array.from({ length: segments }, (_, i) => (
        <div key={i} style={{
          width: 3, height: i < filled ? 10 : 5,
          borderRadius: 1,
          background: i < filled ? color : 'var(--border-default)',
          opacity: i < filled ? (0.4 + (i / segments) * 0.6) : 1,
          transition: 'height 0.2s',
        }} />
      ))}
    </div>
  );
}

// Activity type → Lucide icon (no emoji)
function ActivityIcon({ type }: { type: string }) {
  const isGood = type === 'correct' || type === 'high_conf' || type === 'streak' || type === 'model';
  const color = isGood ? '#22c55e' : '#ef4444';
  const Icon =
    type === 'correct'   ? Check :
    type === 'wrong'     ? X :
    type === 'upset'     ? Zap :
    type === 'streak'    ? Flame :
    type === 'high_conf' ? Target :
    RefreshCw;
  return (
    <div style={{
      width: 26, height: 26, borderRadius: 'var(--r-sm)', flexShrink: 0,
      background: isGood ? 'rgba(34,197,94,0.07)' : 'rgba(239,68,68,0.07)',
      border: `1px solid ${isGood ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.12)'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon size={12} color={color} strokeWidth={2.5} />
    </div>
  );
}

export default async function HomePage() {
  const [games, accuracy] = await Promise.all([getUpcomingGames(), getAccuracyStats()]);

  const liveGames = games.filter(g => isLive(g.status));
  const upcomingToday = games
    .filter(g => !isLive(g.status) && !isFinal(g.status))
    .slice(0, 12);
  const topPicks = [...upcomingToday]
    .sort((a, b) => b.prediction.confidence - a.prediction.confidence)
    .slice(0, 8);
  const featuredPick = topPicks[0] ?? null;
  const remainingPicks = topPicks.slice(1);
  const upsetAlerts = upcomingToday
    .filter(g => g.prediction.upsetProbability > 30)
    .sort((a, b) => b.prediction.upsetProbability - a.prediction.upsetProbability)
    .slice(0, 5);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'short', day: 'numeric', timeZone: 'America/New_York',
  });

  return (
    <div style={{ maxWidth: '80rem', margin: '0 auto' }} className="anim-fade-in">

      {/* ── Command Bar ──────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '0.75rem',
        paddingBottom: '1rem', marginBottom: '1.25rem',
        borderBottom: '1px solid var(--border-default)',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', flexWrap: 'wrap' }}>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: '1.375rem', fontWeight: 800,
            letterSpacing: '0.01em', textTransform: 'uppercase', color: 'var(--text-primary)',
          }}>
            Sports Intelligence
          </h1>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>{today}</span>
          {liveGames.length > 0 && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.3125rem',
              fontSize: '0.5625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
              padding: '0.1875rem 0.5625rem', borderRadius: 3,
              background: 'rgba(239,68,68,0.08)', color: '#ef4444',
              border: '1px solid rgba(239,68,68,0.18)',
            }}>
              <span className="live-dot-sm" />{liveGames.length} Live
            </span>
          )}
        </div>
        <Link href="/games" style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
          padding: '0.375rem 0.875rem', borderRadius: 'var(--r-md)',
          background: 'var(--accent)', color: '#000',
          fontSize: '0.75rem', fontWeight: 700, textDecoration: 'none',
          letterSpacing: '0.02em',
        }}>
          <Zap size={12} />All Games
        </Link>
      </div>

      {/* ── Model Metrics Bar — Accuracy gets distinct hero treatment ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr',
        background: 'var(--bg-card)', border: '1px solid var(--border-default)',
        borderRadius: 'var(--r-lg)', overflow: 'hidden', marginBottom: '1.5rem',
      }}>
        {/* Accuracy — the single featured metric, wider treatment */}
        <div style={{
          gridColumn: '1 / 2', padding: '1rem 1.25rem',
          borderRight: '1px solid var(--border-default)',
          borderLeft: '3px solid var(--accent)',
          background: 'rgba(245,158,11,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.375rem' }}>
            <Target size={10} color="var(--accent)" />
            <span className="text-label" style={{ color: 'var(--accent)', opacity: 0.8 }}>Accuracy</span>
          </div>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: '2.25rem', fontWeight: 800,
            lineHeight: 1, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums',
          }}>
            <AnimatedCounter value={accuracy.overall} decimals={1} suffix="%" />
          </div>
          <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', marginTop: '0.3125rem' }}>All-time</div>
        </div>

        {[
          { label: 'Last 30 Days', value: accuracy.last30Days, suffix: '%', decimals: 1, Icon: TrendingUp, sub: '+2.8% trend' },
          { label: 'Predictions',  value: accuracy.totalPredictions, suffix: '', decimals: 0, Icon: Brain, sub: '13 sports' },
          { label: 'ROC AUC',      value: accuracy.rocAuc, suffix: '', decimals: 3, Icon: Zap, sub: `Brier ${accuracy.brierScore}` },
        ].map(({ label, value, suffix, decimals, Icon, sub }, i, arr) => (
          <div key={label} style={{
            padding: '1rem 1.25rem',
            borderRight: i < arr.length - 1 ? '1px solid var(--border-default)' : undefined,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.375rem' }}>
              <Icon size={10} color="var(--text-muted)" />
              <span className="text-label">{label}</span>
            </div>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: '1.625rem', fontWeight: 700,
              lineHeight: 1, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums',
            }}>
              <AnimatedCounter value={value} decimals={decimals} suffix={suffix} />
            </div>
            {sub && <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', marginTop: '0.3125rem' }}>{sub}</div>}
          </div>
        ))}
      </div>

      {/* ── Live Games Ribbon ─────────────────────────────────────── */}
      {liveGames.length > 0 && (
        <section style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem' }}>
            <span className="live-dot" />
            <span className="text-label" style={{ color: '#ef4444' }}>Live Now</span>
            <Link href="/games" style={{
              marginLeft: 'auto', fontSize: '0.6875rem', color: 'var(--text-muted)',
              textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem',
            }}>
              All games <ChevronRight size={11} />
            </Link>
          </div>
          <div className="scroll-ribbon">
            {liveGames.map(g => {
              const homeLeads = (g.homeScore ?? 0) > (g.awayScore ?? 0);
              const awayLeads = (g.awayScore ?? 0) > (g.homeScore ?? 0);
              return (
                <Link key={g.id} href={`/game/${g.id}`} style={{
                  display: 'flex', flexDirection: 'column', gap: '0.5rem',
                  padding: '0.875rem', minWidth: '196px', flexShrink: 0,
                  background: 'var(--bg-card)', border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: 'var(--r-lg)', textDecoration: 'none', color: 'inherit',
                  position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: '#ef4444' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '0.5625rem', fontWeight: 700, textTransform: 'uppercase',
                      letterSpacing: '0.1em', color: SPORT_COLOR[g.sport] ?? 'var(--text-muted)',
                    }}>{g.league}</span>
                    <span style={{ fontSize: '0.5625rem', fontWeight: 700, color: '#ef4444', letterSpacing: '0.05em' }}>
                      {g.clock ? g.clock : 'LIVE'}{g.period ? ` P${g.period}` : ''}
                    </span>
                  </div>
                  {[
                    { team: g.homeTeam, score: g.homeScore, leads: homeLeads },
                    { team: g.awayTeam, score: g.awayScore, leads: awayLeads },
                  ].map(({ team, score, leads }) => (
                    <div key={team.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: team.color, display: 'inline-block', flexShrink: 0 }} />
                      <span style={{
                        fontSize: '0.8125rem', fontWeight: leads ? 600 : 400, flex: 1,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        color: leads ? 'var(--text-primary)' : 'var(--text-secondary)',
                      }}>{team.abbreviation}</span>
                      <span style={{
                        fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800,
                        fontVariantNumeric: 'tabular-nums', color: leads ? team.color : 'var(--text-primary)',
                      }}>{score ?? 0}</span>
                    </div>
                  ))}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Command Grid: main + sidebar ─────────────────────────── */}
      <div className="command-grid">

        {/* ── Main Column ──────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: 0 }}>

          {/* Featured Top Pick — visually distinct, not a grid tile */}
          {featuredPick && (
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem' }}>
                <span className="text-label">Top Pick Today</span>
                <span style={{
                  fontSize: '0.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
                  padding: '0.1rem 0.4rem', borderRadius: 2,
                  background: 'rgba(245,158,11,0.1)', color: 'var(--accent)',
                  border: '1px solid rgba(245,158,11,0.2)',
                }}>Highest confidence</span>
              </div>
              <Link href={`/game/${featuredPick.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                <div className="featured-pick" style={{ padding: '1.25rem 1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    {/* Teams */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.5625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: SPORT_COLOR[featuredPick.sport] ?? 'var(--text-muted)' }}>
                          {featuredPick.league}
                        </span>
                        <span style={{ fontSize: '0.5625rem', color: 'var(--text-muted)' }}>
                          {featuredPick.scheduledAt
                            ? new Date(featuredPick.scheduledAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/New_York' })
                            : featuredPick.time} ET
                        </span>
                      </div>
                      <div style={{
                        fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800,
                        color: 'var(--text-primary)', lineHeight: 1, letterSpacing: '0.01em',
                      }}>
                        {featuredPick.homeTeam.abbreviation}
                        <span style={{ color: 'var(--text-muted)', margin: '0 0.5rem', fontWeight: 400 }}>vs</span>
                        {featuredPick.awayTeam.abbreviation}
                      </div>
                      <div style={{ marginTop: '0.375rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {featuredPick.homeTeam.name} · {featuredPick.homeTeam.record} vs {featuredPick.awayTeam.record}
                      </div>
                    </div>

                    {/* Pick */}
                    <div style={{ textAlign: 'right' }}>
                      <div className="text-label" style={{ marginBottom: '0.3rem' }}>Model pick</div>
                      <div style={{
                        fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800,
                        color: featuredPick.prediction.winner === featuredPick.homeTeam.name
                          ? featuredPick.homeTeam.color : featuredPick.awayTeam.color,
                        lineHeight: 1,
                      }}>
                        {featuredPick.prediction.winner === featuredPick.homeTeam.name
                          ? featuredPick.homeTeam.abbreviation : featuredPick.awayTeam.abbreviation}
                      </div>
                      <div style={{
                        fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 800,
                        color: 'var(--accent)', lineHeight: 1, marginTop: '0.125rem',
                      }}>
                        {featuredPick.prediction.confidence}%
                      </div>
                      <div className="text-label" style={{ marginTop: '0.25rem' }}>confidence</div>
                    </div>
                  </div>

                  {/* Win probability bar */}
                  <div style={{ marginTop: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                        {featuredPick.homeTeam.abbreviation} {(featuredPick.prediction.winner === featuredPick.homeTeam.name ? featuredPick.prediction.winProbability : 100 - featuredPick.prediction.winProbability).toFixed(0)}%
                      </span>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                        {(featuredPick.prediction.winner === featuredPick.awayTeam.name ? featuredPick.prediction.winProbability : 100 - featuredPick.prediction.winProbability).toFixed(0)}% {featuredPick.awayTeam.abbreviation}
                      </span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, overflow: 'hidden', background: 'var(--bg-elevated)', display: 'flex' }}>
                      <div style={{
                        height: '100%',
                        width: `${featuredPick.prediction.winner === featuredPick.homeTeam.name ? featuredPick.prediction.winProbability : 100 - featuredPick.prediction.winProbability}%`,
                        background: featuredPick.homeTeam.color,
                      }} />
                      <div style={{ flex: 1, height: '100%', background: featuredPick.awayTeam.color }} />
                    </div>
                  </div>
                </div>
              </Link>
            </section>
          )}

          {/* Remaining Top Picks — compact table, no shadow */}
          {remainingPicks.length > 0 && (
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem' }}>
                <span className="text-label">Today&apos;s Picks</span>
                <Link href="/games" style={{
                  marginLeft: 'auto', fontSize: '0.6875rem', color: 'var(--text-muted)',
                  textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem',
                }}>
                  Full schedule <ChevronRight size={11} />
                </Link>
              </div>
              <div style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-default)',
                borderRadius: 'var(--r-lg)', overflow: 'hidden',
              }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Matchup</th>
                      <th style={{ textAlign: 'center' }}>Time</th>
                      <th style={{ textAlign: 'center' }}>Pick</th>
                      <th style={{ textAlign: 'right' }}>Conf.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {remainingPicks.map(g => {
                      const winHome = g.prediction.winner === g.homeTeam.name;
                      const conf = g.prediction.confidence;
                      const confColor = conf >= 80 ? 'var(--success)' : conf >= 65 ? 'var(--accent)' : 'var(--text-muted)';
                      const time = g.scheduledAt
                        ? new Date(g.scheduledAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/New_York' })
                        : g.time;
                      return (
                        <tr key={g.id}>
                          <td>
                            <Link href={`/game/${g.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                              <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                {g.homeTeam.abbreviation} vs {g.awayTeam.abbreviation}
                              </span>
                              <div style={{ fontSize: '0.5625rem', color: SPORT_COLOR[g.sport] ?? 'var(--text-muted)', marginTop: '0.1rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                {g.league}
                              </div>
                            </Link>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{ fontSize: '0.75rem', fontVariantNumeric: 'tabular-nums', color: 'var(--text-muted)' }}>{time}</span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <Link href={`/game/${g.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
                              <span style={{ fontSize: '0.8125rem', fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                                {winHome ? g.homeTeam.abbreviation : g.awayTeam.abbreviation}
                              </span>
                              <div style={{ width: 48, height: 2, borderRadius: 1, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${g.prediction.winProbability}%`, background: winHome ? g.homeTeam.color : g.awayTeam.color }} />
                              </div>
                            </Link>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <span style={{
                              fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700,
                              fontVariantNumeric: 'tabular-nums', color: confColor,
                            }}>
                              {conf}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Model Accuracy by Sport */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem' }}>
              <span className="text-label">Model Accuracy by Sport</span>
              <Link href="/accuracy" style={{
                marginLeft: 'auto', fontSize: '0.6875rem', color: 'var(--text-muted)',
                textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem',
              }}>
                Calibration <ChevronRight size={11} />
              </Link>
            </div>
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-default)',
              borderRadius: 'var(--r-lg)', overflow: 'hidden',
            }}>
              {Object.entries(accuracy.bySport)
                .sort(([, a], [, b]) => b - a)
                .map(([sport, acc], i, arr) => (
                  <div key={sport} style={{
                    display: 'grid', gridTemplateColumns: '6rem 1fr 2.5rem',
                    alignItems: 'center', gap: '0.875rem',
                    padding: '0.5625rem 1rem',
                    borderBottom: i < arr.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ width: 6, height: 6, borderRadius: 1, background: SPORT_COLOR[sport] ?? 'var(--text-muted)', display: 'inline-block', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{sport}</span>
                    </div>
                    <div style={{ height: 3, borderRadius: 1, overflow: 'hidden', background: 'var(--bg-elevated)' }}>
                      <div style={{
                        height: '100%', borderRadius: 1, width: `${acc}%`,
                        background: acc >= 70 ? 'var(--success)' : acc >= 65 ? 'var(--accent)' : 'var(--danger)',
                      }} />
                    </div>
                    <span style={{
                      fontFamily: 'var(--font-display)', fontSize: '0.9375rem', fontWeight: 700,
                      fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)', textAlign: 'right',
                    }}>
                      {acc}%
                    </span>
                  </div>
                ))}
            </div>
          </section>

          {/* Recent Activity — Lucide icons, no emoji */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem' }}>
              <span className="text-label">Recent Predictions</span>
              <Link href="/history" style={{
                marginLeft: 'auto', fontSize: '0.6875rem', color: 'var(--text-muted)',
                textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem',
              }}>
                History <ChevronRight size={11} />
              </Link>
            </div>
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-default)',
              borderRadius: 'var(--r-lg)', overflow: 'hidden',
            }}>
              {ACTIVITY_FEED.slice(0, 7).map((item, i, arr) => (
                <div key={item.id} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.625rem 1rem',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                }}>
                  <ActivityIcon type={item.type} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.detail}
                    </p>
                    <p style={{ fontSize: '0.5625rem', color: 'var(--text-muted)', marginTop: '0.125rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {item.sport} · {timeAgo(item.timestamp)}
                    </p>
                  </div>
                  {item.confidence && (
                    <span style={{
                      fontFamily: 'var(--font-display)', fontSize: '0.875rem', fontWeight: 700,
                      padding: '0.125rem 0.4375rem', borderRadius: 3,
                      background: item.type === 'correct' ? 'rgba(34,197,94,0.07)' : 'rgba(239,68,68,0.07)',
                      color: item.type === 'correct' ? '#22c55e' : item.type === 'wrong' ? '#ef4444' : 'var(--text-muted)',
                    }}>
                      {item.confidence}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ── Sidebar Column ────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Upset Alerts — Zap icon, amber border */}
          {upsetAlerts.length > 0 && (
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.625rem' }}>
                <Zap size={10} color="var(--accent)" />
                <span className="text-label" style={{ color: 'var(--accent)', opacity: 0.8 }}>Upset Alerts</span>
              </div>
              <div style={{
                background: 'var(--bg-card)', border: '1px solid rgba(245,158,11,0.15)',
                borderRadius: 'var(--r-lg)', overflow: 'hidden',
              }}>
                {upsetAlerts.map((g, i, arr) => {
                  const underdog = g.prediction.winner === g.homeTeam.name ? g.awayTeam : g.homeTeam;
                  return (
                    <Link key={g.id} href={`/game/${g.id}`} style={{
                      display: 'flex', flexDirection: 'column', gap: '0.25rem',
                      padding: '0.75rem 1rem', textDecoration: 'none', color: 'inherit',
                      borderBottom: i < arr.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                      transition: 'background 0.1s',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', letterSpacing: '0.01em' }}>
                          {g.homeTeam.abbreviation} vs {g.awayTeam.abbreviation}
                        </span>
                        <span style={{
                          fontFamily: 'var(--font-display)', fontSize: '0.875rem', fontWeight: 700,
                          padding: '0.125rem 0.375rem', borderRadius: 2,
                          background: 'rgba(245,158,11,0.1)', color: 'var(--accent)',
                        }}>
                          {g.prediction.upsetProbability}%
                        </span>
                      </div>
                      <span style={{ fontSize: '0.5625rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        {underdog.abbreviation} upset chance · {g.league}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* Trending Teams — sparkline bars instead of number+arrow */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem' }}>
              <span className="text-label">Trending Teams</span>
            </div>
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-default)',
              borderRadius: 'var(--r-lg)', overflow: 'hidden',
            }}>
              {TRENDING_TEAMS.slice(0, 6).map((t, i, arr) => (
                <div key={t.id} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.625rem 1rem',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                }}>
                  {/* Team swatch */}
                  <div style={{
                    width: 26, height: 26, borderRadius: 'var(--r-sm)',
                    background: `${t.color ?? '#888'}18`,
                    border: `1px solid ${t.color ?? '#888'}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <span style={{ fontSize: '0.5rem', fontWeight: 800, color: t.color ?? 'var(--text-muted)', letterSpacing: '0.03em' }}>
                      {t.abbreviation?.slice(0, 3)}
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.name}
                    </p>
                    <p style={{ fontSize: '0.5625rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '0.125rem' }}>
                      {t.streak} · {t.sport}
                    </p>
                  </div>
                  {/* Sparkline bar instead of number + arrow */}
                  {t.momentum !== undefined && (
                    <MomentumBar value={t.momentum} direction={t.direction} />
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Market Snapshot + Top Stocks + News */}
          <Suspense fallback={
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {[120, 180, 140].map(h => (
                <div key={h} style={{
                  height: h, borderRadius: 'var(--r-lg)', background: 'var(--bg-card)',
                  border: '1px solid var(--border-default)',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }} />
              ))}
            </div>
          }>
            <DashboardMarketWidget />
          </Suspense>

          {/* Quick Navigation — varied widths, no uniform grid */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem' }}>
              <span className="text-label">Quick Access</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {[
                { href: '/accuracy',  label: 'Accuracy',  sub: 'Model metrics',     color: 'var(--success)', wide: true },
                { href: '/matchup',   label: 'Matchup',   sub: 'Compare teams',     color: 'var(--accent)' },
                { href: '/games',     label: 'Games',     sub: `${games.length} fixtures`, color: 'var(--info)' },
                { href: '/history',   label: 'History',   sub: 'Prediction log',    color: 'var(--text-muted)' },
              ].map(({ href, label, sub, color, wide }) => (
                <Link key={href} href={href} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: wide ? '0.875rem 1rem' : '0.625rem 1rem',
                  background: 'var(--bg-card)', border: '1px solid var(--border-default)',
                  borderRadius: 'var(--r-md)', textDecoration: 'none',
                  transition: 'background 0.1s, border-color 0.1s',
                  borderLeft: wide ? `3px solid ${color}` : '1px solid var(--border-default)',
                }}>
                  <div>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>{label}</span>
                    <span style={{ fontSize: '0.5625rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{sub}</span>
                  </div>
                  <ChevronRight size={13} style={{ color, flexShrink: 0 }} />
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
