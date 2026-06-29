import { Metadata } from 'next';
import Link from 'next/link';
import { getUpcomingGames, getAccuracyStats } from '@/lib/api';
import { ACTIVITY_FEED, TRENDING_TEAMS } from '@/lib/dashboardData';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { ChevronRight, TrendingUp, Target, Zap, Brain, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const metadata: Metadata = { title: 'Dashboard — EdgeAI' };

const SPORT_COLOR: Record<string, string> = {
  NFL: '#2563eb', NBA: '#ea580c', MLB: '#16a34a', NHL: '#0ea5e9',
  Soccer: '#10b981', 'NCAA Football': '#7c3aed', 'NCAA Basketball': '#f59e0b',
  UFC: '#dc2626', Boxing: '#b91c1c', Tennis: '#ca8a04', 'Formula 1': '#dc2626',
  Cricket: '#059669', Esports: '#8b5cf6',
};

function isFinal(s: string) { return s === 'Final' || s === 'Final/OT' || s === 'Final/SO'; }
function isLive(s: string) { return s === 'Live' || s === 'Halftime' || s === 'Pregame'; }

export default async function HomePage() {
  const [games, accuracy] = await Promise.all([getUpcomingGames(), getAccuracyStats()]);

  const liveGames = games.filter(g => isLive(g.status));
  const upcomingToday = games
    .filter(g => !isLive(g.status) && !isFinal(g.status))
    .slice(0, 12);
  const topPicks = [...upcomingToday]
    .sort((a, b) => b.prediction.confidence - a.prediction.confidence)
    .slice(0, 8);
  const upsetAlerts = upcomingToday
    .filter(g => g.prediction.upsetProbability > 30)
    .sort((a, b) => b.prediction.upsetProbability - a.prediction.upsetProbability)
    .slice(0, 5);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/New_York',
  });

  return (
    <div style={{ maxWidth: '80rem', margin: '0 auto' }} className="anim-fade-in">

      {/* ── Command Bar ──────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        paddingBottom: '1.125rem',
        marginBottom: '1.25rem',
        borderBottom: '1px solid var(--border-default)',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.875rem', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--text-primary)' }}>
            Sports Intelligence
          </h1>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{today}</span>
          {liveGames.length > 0 && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.3125rem',
              fontSize: '0.5625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em',
              padding: '0.1875rem 0.5625rem', borderRadius: 100,
              background: 'rgba(239,68,68,0.1)', color: '#ef4444',
              border: '1px solid rgba(239,68,68,0.15)',
            }}>
              <span className="live-dot-sm" />{liveGames.length} Live
            </span>
          )}
        </div>
        <Link href="/games" className="btn-accent">
          <Zap size={13} />All Games
        </Link>
      </div>

      {/* ── Model Metrics Bar ─────────────────────────────────────── */}
      <div className="metrics-bar" style={{ marginBottom: '1.25rem' }}>
        {[
          { label: 'Overall Accuracy', value: accuracy.overall, suffix: '%', decimals: 1, Icon: Target, accent: true },
          { label: 'Last 30 Days',     value: accuracy.last30Days, suffix: '%', decimals: 1, Icon: TrendingUp, sub: '↑2.8%' },
          { label: 'Predictions',      value: accuracy.totalPredictions, suffix: '', decimals: 0, Icon: Brain, sub: '13 sports' },
          { label: 'ROC AUC',          value: accuracy.rocAuc, suffix: '', decimals: 3, Icon: Zap, sub: `Brier ${accuracy.brierScore}` },
        ].map(({ label, value, suffix, decimals, Icon, sub, accent }) => (
          <div key={label} className="metrics-bar-item" style={{ background: accent ? 'var(--accent-dim)' : undefined }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.3125rem' }}>
              <Icon size={11} style={{ color: accent ? 'var(--accent-light)' : 'var(--text-muted)' }} />
              <span className="text-label" style={{ color: accent ? 'var(--accent-light)' : undefined }}>{label}</span>
            </div>
            <div style={{
              fontSize: '1.375rem', fontWeight: 800, letterSpacing: '-0.03em',
              fontVariantNumeric: 'tabular-nums',
              fontFamily: 'var(--font-geist-mono)',
              color: accent ? 'var(--accent-light)' : 'var(--text-primary)',
            }}>
              <AnimatedCounter value={value} decimals={decimals} suffix={suffix} />
            </div>
            {sub && <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.1875rem' }}>{sub}</div>}
          </div>
        ))}
      </div>

      {/* ── Live Games Ribbon ─────────────────────────────────────── */}
      {liveGames.length > 0 && (
        <section style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <span className="live-dot" />
            <span className="text-label" style={{ color: '#ef4444' }}>Live Now</span>
            <Link href="/games" style={{ marginLeft: 'auto', fontSize: '0.6875rem', color: 'var(--accent-light)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
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
                  padding: '0.875rem', minWidth: '200px', flexShrink: 0,
                  background: 'var(--bg-card)', border: '1px solid rgba(239,68,68,0.25)',
                  borderRadius: 'var(--r-lg)', textDecoration: 'none', color: 'inherit',
                  position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: '#ef4444' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.5625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: SPORT_COLOR[g.sport] ?? 'var(--text-muted)' }}>
                      {g.league}
                    </span>
                    <span style={{ fontSize: '0.5625rem', fontWeight: 700, color: '#ef4444' }}>
                      {g.clock ? g.clock : 'LIVE'}{g.period ? ` P${g.period}` : ''}
                    </span>
                  </div>
                  {[
                    { team: g.homeTeam, score: g.homeScore, leads: homeLeads },
                    { team: g.awayTeam, score: g.awayScore, leads: awayLeads },
                  ].map(({ team, score, leads }) => (
                    <div key={team.id} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: team.color, display: 'inline-block', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.75rem', fontWeight: leads ? 600 : 400, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: leads ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                        {team.name.split(' ').slice(-1)[0]}
                      </span>
                      <span style={{ fontSize: '1.125rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--font-geist-mono)', color: leads ? team.color : 'var(--text-primary)' }}>
                        {score ?? 0}
                      </span>
                    </div>
                  ))}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Command Grid: main + sidebar ──────────────────────────── */}
      <div className="command-grid">

        {/* ── Main Column ──────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', minWidth: 0 }}>

          {/* Today's Top Picks — compact table */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem' }}>
              <span className="text-label">Today&apos;s Top Picks</span>
              <span style={{ marginLeft: 'auto', fontSize: '0.6875rem', color: 'var(--accent-light)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                <Link href="/games" style={{ fontSize: '0.6875rem', color: 'var(--accent-light)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  Full schedule <ChevronRight size={11} />
                </Link>
              </span>
            </div>
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-default)',
              borderRadius: 'var(--r-lg)', overflow: 'hidden',
            }}>
              {topPicks.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                  No upcoming games today
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Matchup</th>
                      <th style={{ textAlign: 'center' }}>Time</th>
                      <th style={{ textAlign: 'center' }}>AI Pick</th>
                      <th style={{ textAlign: 'right' }}>Conf.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPicks.map(g => {
                      const winHome = g.prediction.winner === g.homeTeam.name;
                      const conf = g.prediction.confidence;
                      const confColor = conf >= 80 ? 'var(--success)' : conf >= 65 ? 'var(--accent-light)' : 'var(--text-muted)';
                      const time = g.scheduledAt
                        ? new Date(g.scheduledAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/New_York' })
                        : g.time;
                      return (
                        <tr key={g.id}>
                          <td>
                            <Link href={`/game/${g.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1875rem' }}>
                                  <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                    {g.homeTeam.abbreviation} vs {g.awayTeam.abbreviation}
                                  </span>
                                  <span style={{ fontSize: '0.625rem', color: SPORT_COLOR[g.sport] ?? 'var(--text-muted)' }}>
                                    {g.league}
                                  </span>
                                </div>
                              </div>
                            </Link>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <Link href={`/game/${g.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                              <span style={{ fontSize: '0.75rem', fontVariantNumeric: 'tabular-nums', color: 'var(--text-muted)' }}>{time}</span>
                            </Link>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <Link href={`/game/${g.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.1875rem' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                  {winHome ? g.homeTeam.abbreviation : g.awayTeam.abbreviation}
                                </span>
                                <div style={{ width: 56, height: 3, borderRadius: 2, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: `${winHome ? g.prediction.winProbability : 100 - g.prediction.winProbability}%`, background: winHome ? g.homeTeam.color : g.awayTeam.color, borderRadius: 2 }} />
                                </div>
                              </div>
                            </Link>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <Link href={`/game/${g.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                              <span style={{ fontSize: '0.8125rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: confColor }}>
                                {conf}%
                              </span>
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          {/* Sport-by-Sport Accuracy */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem' }}>
              <span className="text-label">Model Accuracy by Sport</span>
              <Link href="/accuracy" style={{ marginLeft: 'auto', fontSize: '0.6875rem', color: 'var(--accent-light)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
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
                    display: 'flex', alignItems: 'center', gap: '0.875rem',
                    padding: '0.625rem 1rem',
                    borderBottom: i < arr.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  }}>
                    <span style={{ width: 7, height: 7, borderRadius: 2, background: SPORT_COLOR[sport] ?? 'var(--text-muted)', display: 'inline-block', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', width: '6rem', flexShrink: 0 }}>{sport}</span>
                    <div style={{ flex: 1, height: 3, borderRadius: 2, overflow: 'hidden', background: 'var(--bg-elevated)' }}>
                      <div style={{
                        height: '100%', borderRadius: 2,
                        width: `${acc}%`,
                        background: acc >= 70 ? 'var(--success)' : acc >= 65 ? 'var(--accent)' : 'var(--warning)',
                      }} />
                    </div>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--font-geist-mono)', color: 'var(--text-primary)', width: '2.5rem', textAlign: 'right' }}>
                      {acc}%
                    </span>
                  </div>
                ))}
            </div>
          </section>

          {/* Recent Activity */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem' }}>
              <span className="text-label">Recent Predictions</span>
              <Link href="/history" style={{ marginLeft: 'auto', fontSize: '0.6875rem', color: 'var(--accent-light)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                History <ChevronRight size={11} />
              </Link>
            </div>
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-default)',
              borderRadius: 'var(--r-lg)', overflow: 'hidden',
            }}>
              {ACTIVITY_FEED.slice(0, 7).map((item, i, arr) => {
                const isGood = item.type === 'correct' || item.type === 'high_conf' || item.type === 'streak' || item.type === 'model';
                return (
                <div key={item.id} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.625rem 1rem',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 'var(--r-sm)',
                    background: isGood ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <span style={{ fontSize: '0.75rem', color: isGood ? 'var(--success)' : 'var(--danger)' }}>
                      {item.type === 'correct' ? '✓' : item.type === 'wrong' ? '✗' : item.type === 'upset' ? '⚡' : item.type === 'streak' ? '↑' : '●'}
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.detail}
                    </p>
                    <p style={{ fontSize: '0.625rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                      {item.sport} · {item.timestamp}
                    </p>
                  </div>
                  {item.confidence && (
                    <span style={{
                      fontSize: '0.625rem', fontWeight: 700, padding: '0.125rem 0.4375rem',
                      borderRadius: 3,
                      background: isGood ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                      color: isGood ? '#22c55e' : '#ef4444',
                    }}>
                      {item.confidence}%
                    </span>
                  )}
                </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* ── Sidebar Column ────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Upset Alerts */}
          {upsetAlerts.length > 0 && (
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem' }}>
                <span className="text-label" style={{ color: 'var(--warning)' }}>⚡ Upset Alerts</span>
              </div>
              <div style={{
                background: 'var(--bg-card)', border: '1px solid rgba(245,158,11,0.2)',
                borderRadius: 'var(--r-lg)', overflow: 'hidden',
              }}>
                {upsetAlerts.map((g, i, arr) => {
                  const underdog = g.prediction.winner === g.homeTeam.name ? g.awayTeam : g.homeTeam;
                  return (
                    <Link key={g.id} href={`/game/${g.id}`} style={{
                      display: 'flex', flexDirection: 'column', gap: '0.3125rem',
                      padding: '0.75rem 1rem', textDecoration: 'none', color: 'inherit',
                      borderBottom: i < arr.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                      transition: 'background 0.1s',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {g.homeTeam.abbreviation} vs {g.awayTeam.abbreviation}
                        </span>
                        <span style={{
                          fontSize: '0.5625rem', fontWeight: 700, padding: '0.125rem 0.375rem',
                          borderRadius: 3, background: 'rgba(245,158,11,0.12)', color: '#f59e0b',
                        }}>
                          {g.prediction.upsetProbability}% upset
                        </span>
                      </div>
                      <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>
                        {underdog.abbreviation} could pull the upset · {g.league}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* Trending Teams */}
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
                  <div style={{
                    width: 28, height: 28, borderRadius: 'var(--r-sm)',
                    background: `${t.color ?? '#6366f1'}18`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <span style={{ fontSize: '0.5625rem', fontWeight: 800, color: t.color ?? 'var(--accent-light)' }}>
                      {t.abbreviation?.slice(0, 3)}
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.name}
                    </p>
                    <p style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>
                      {t.streak} · {t.sport}
                    </p>
                  </div>
                  {t.momentum !== undefined && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.1875rem' }}>
                      {t.momentum > 55 ? (
                        <ArrowUpRight size={12} style={{ color: 'var(--success)' }} />
                      ) : t.momentum < 45 ? (
                        <ArrowDownRight size={12} style={{ color: 'var(--danger)' }} />
                      ) : (
                        <span style={{ width: 12, height: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ width: 8, height: 1.5, background: 'var(--text-muted)', borderRadius: 1, display: 'block' }} />
                        </span>
                      )}
                      <span style={{ fontSize: '0.6875rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: t.momentum > 55 ? 'var(--success)' : t.momentum < 45 ? 'var(--danger)' : 'var(--text-muted)' }}>
                        {t.momentum}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Quick Navigation */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem' }}>
              <span className="text-label">Quick Access</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {[
                { href: '/accuracy', label: 'Accuracy', sub: 'Model metrics', color: 'var(--success)' },
                { href: '/matchup', label: 'Matchup', sub: 'Compare teams', color: 'var(--accent-light)' },
                { href: '/games', label: 'Games', sub: `${games.length} fixtures`, color: 'var(--info)' },
                { href: '/history', label: 'History', sub: 'Prediction log', color: 'var(--purple)' },
              ].map(({ href, label, sub, color }) => (
                <Link key={href} href={href} style={{
                  display: 'flex', flexDirection: 'column', gap: '0.25rem',
                  padding: '0.75rem 0.875rem',
                  background: 'var(--bg-card)', border: '1px solid var(--border-default)',
                  borderRadius: 'var(--r-md)', textDecoration: 'none',
                  transition: 'background 0.1s, border-color 0.1s',
                }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>
                  <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>{sub}</span>
                  <ChevronRight size={11} style={{ color, marginTop: '0.25rem' }} />
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
