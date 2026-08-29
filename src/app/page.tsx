import { Metadata } from 'next';
import Link from 'next/link';
import { getUpcomingGames, getAccuracyStats } from '@/lib/api';
import { getRecentPredictions, getTrendingTeams } from '@/lib/dashboardData';
import { LiveDashboardMarket } from '@/components/finance/LiveDashboardMarket';
import { getMarketOverview } from '@/lib/finance/providers/yahoo';
import { ChevronRight, ChevronDown, Check, X } from 'lucide-react';
import { livePhase } from '@/lib/gameDisplay';

export const metadata: Metadata = { title: 'Dashboard — EdgeAI' };
export const revalidate = 60;

const SPORT_COLOR: Record<string, string> = {
  NFL: '#22C55E', NBA: '#EA580C', MLB: '#16A34A', NHL: '#2D7EFF',
  Soccer: '#10B981', 'NCAA Football': '#E05C1A', 'NCAA Basketball': '#D97706',
  UFC: '#E8364A', Boxing: '#B91C1C', Tennis: '#CA8A04', 'Formula 1': '#E8364A',
  Cricket: '#059669', Esports: '#6366F1',
};

function isFinal(s: string) { return s === 'Final' || s === 'Final/OT' || s === 'Final/SO'; }
function isLive(s: string) { return s === 'Live' || s === 'Halftime' || s === 'Pregame'; }

function fmtTime(g: { scheduledAt?: string; time: string }): string {
  return g.scheduledAt
    ? new Date(g.scheduledAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/New_York' })
    : g.time;
}

// Confidence color tiers: 75%+ blue, 65-74% slate, below muted
function confBarColor(conf: number): string {
  if (conf >= 75) return 'var(--accent)';
  if (conf >= 65) return 'var(--text-secondary)';
  return 'var(--text-muted)';
}

// ── Circular confidence gauge (SVG) ──────────────────────────────────────────

function ConfidenceGauge({ value, size = 84 }: { value: number; size?: number }) {
  const r = (size - 10) / 2;
  const c = 2 * Math.PI * r;
  const filled = (value / 100) * c;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${value}% confidence`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg-elevated)" strokeWidth={6} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="var(--accent)" strokeWidth={6} strokeLinecap="round"
        strokeDasharray={`${filled} ${c - filled}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%" y="50%" dominantBaseline="central" textAnchor="middle"
        style={{ fontFamily: 'var(--font-data)', fontSize: size * 0.24, fontWeight: 700, fill: 'var(--text-primary)' }}
      >
        {value}%
      </text>
    </svg>
  );
}

// ── 30-day trend sparkline ────────────────────────────────────────────────────

function TrendSparkline({ allTime, last30 }: { allTime: number; last30: number }) {
  // Simple monotone rise from the all-time baseline to the 30-day figure
  const w = 180, h = 56;
  const lo = Math.min(allTime, last30) - 1.5;
  const hi = Math.max(allTime, last30) + 1.5;
  const y = (v: number) => h - ((v - lo) / (hi - lo)) * (h - 12) - 6;
  const midY = (y(allTime) + y(last30)) / 2;
  const path = `M 4 ${y(allTime)} C ${w * 0.4} ${y(allTime)}, ${w * 0.55} ${midY}, ${w - 8} ${y(last30)}`;
  const up = last30 >= allTime;
  return (
    <div style={{ textAlign: 'right' }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`30-day accuracy trend: ${last30}%`}>
        <path d={path} fill="none" stroke={up ? 'var(--success)' : 'var(--danger)'} strokeWidth={2} strokeLinecap="round" />
        <circle cx={w - 8} cy={y(last30)} r={3.5} fill={up ? 'var(--success)' : 'var(--danger)'} />
      </svg>
      <div style={{ fontSize: '0.625rem', color: 'var(--text-secondary)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>
        Last 30 days{' '}
        <span style={{ fontFamily: 'var(--font-data)', color: up ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>
          {last30.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

// ── Section header ────────────────────────────────────────────────────────────

function SectionHead({ title, href, linkLabel }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.75rem' }}>
      <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
        {title}
      </h2>
      {href && (
        <Link href={href} style={{
          marginLeft: 'auto', fontSize: '0.6875rem', color: 'var(--text-secondary)',
          textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem',
        }}>
          {linkLabel ?? 'View all'} <ChevronRight size={11} />
        </Link>
      )}
    </div>
  );
}

export default async function HomePage() {
  const [[games, accuracy], overviewRes] = await Promise.all([
    Promise.all([getUpcomingGames(), getAccuracyStats()]),
    getMarketOverview().catch(() => null),
  ]);

  const recentPredictions = getRecentPredictions(7);
  const trendingTeams = getTrendingTeams(8);
  const marketOverview = overviewRes;

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

  // One factual line of model reasoning for the featured pick
  const featuredReason = featuredPick?.prediction.factors?.[0]?.detail ?? null;

  return (
    <div style={{ maxWidth: '80rem', margin: '0 auto' }} className="anim-fade-in">

      {/* ── Live ticker — slim network-style strip at the very top ── */}
      {liveGames.length > 0 && (
        <div className="ticker-strip">
          <span style={{
            display: 'flex', alignItems: 'center', gap: '0.375rem',
            padding: '0.4375rem 0.875rem', flexShrink: 0,
            borderRight: '1px solid var(--border-subtle)',
            fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: 'var(--danger)',
          }}>
            <span className="live-dot-sm" />Live
          </span>
          {liveGames.map(g => (
            <Link key={g.id} href={`/game/${g.id}`} className="ticker-item">
              <span style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.08em', color: SPORT_COLOR[g.sport] ?? 'var(--text-secondary)' }}>
                {g.league}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{g.homeTeam.abbreviation}</span>
              <span className="ticker-score">{g.homeScore ?? 0}–{g.awayScore ?? 0}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{g.awayTeam.abbreviation}</span>
              <span style={{ fontSize: '0.625rem', fontFamily: 'var(--font-data)', color: 'var(--text-muted)' }}>
                {livePhase(g)}
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* ── Hero — the accuracy number IS the value proposition ── */}
      <div className="hero-strip hero-in" style={{ marginBottom: '1.5rem' }}>
        <div>
          <div className="hero-number">{accuracy.overall.toFixed(1)}%</div>
          <div className="hero-sub">
            All-time accuracy · {accuracy.totalPredictions.toLocaleString()} predictions · {Object.keys(SPORT_COLOR).length} sports
          </div>
        </div>
        <TrendSparkline allTime={accuracy.overall} last30={accuracy.last30Days} />
      </div>

      {/* ── Main grid ── */}
      <div className="command-grid">

        {/* ── Main column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', minWidth: 0 }}>

          {/* Best Bet Today */}
          {featuredPick && (
            <section>
              <SectionHead title="Best bet today" />
              <Link href={`/game/${featuredPick.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                <div className="featured-pick" style={{ padding: '1.25rem 1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.25rem', flexWrap: 'wrap' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem' }}>
                        <span style={{ fontSize: '0.5625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: SPORT_COLOR[featuredPick.sport] ?? 'var(--text-secondary)' }}>
                          {featuredPick.league}
                        </span>
                        <span style={{ fontSize: '0.625rem', fontFamily: 'var(--font-data)', color: 'var(--text-secondary)' }}>
                          {fmtTime(featuredPick)} ET
                        </span>
                      </div>
                      <div style={{
                        fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700,
                        color: 'var(--text-primary)', lineHeight: 1.1, letterSpacing: '-0.01em',
                      }}>
                        {featuredPick.homeTeam.name}
                        <span style={{ color: 'var(--text-muted)', margin: '0 0.625rem', fontWeight: 500, fontSize: '1.125rem' }}>vs</span>
                        {featuredPick.awayTeam.name}
                      </div>
                      <div style={{ marginTop: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                        Pick:{' '}
                        <strong style={{ fontWeight: 700 }}>
                          {featuredPick.prediction.winner}
                        </strong>
                      </div>
                      {featuredReason && (
                        <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5, maxWidth: '34rem' }}>
                          {featuredReason}
                        </p>
                      )}
                    </div>
                    <ConfidenceGauge value={featuredPick.prediction.confidence} />
                  </div>
                </div>
              </Link>
            </section>
          )}

          {/* Today's picks — cards, confidence bars, sorted desc */}
          {remainingPicks.length > 0 && (
            <section>
              <SectionHead title="Today's picks" href="/games" linkLabel="Full schedule" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {remainingPicks.map((g, i) => {
                  const winHome = g.prediction.winner === g.homeTeam.name;
                  const conf = g.prediction.confidence;
                  const barColor = confBarColor(conf);
                  return (
                    <Link key={g.id} href={`/game/${g.id}`} className="pick-card">
                      {/* Logos */}
                      <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                        {[g.homeTeam, g.awayTeam].map((t, j) => (
                          t.logo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              key={t.id} src={t.logo} alt={t.abbreviation}
                              width={26} height={26} loading="lazy"
                              style={{ borderRadius: '50%', background: 'var(--bg-elevated)', marginLeft: j > 0 ? -6 : 0, border: '2px solid var(--bg-card)' }}
                            />
                          ) : (
                            <span key={t.id} style={{
                              width: 26, height: 26, borderRadius: '50%', background: `${t.color}30`,
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '0.5rem', fontWeight: 800, color: t.color,
                              marginLeft: j > 0 ? -6 : 0, border: '2px solid var(--bg-card)',
                            }}>{t.abbreviation.slice(0, 2)}</span>
                          )
                        ))}
                      </div>

                      {/* Matchup + time */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {g.homeTeam.abbreviation} vs {g.awayTeam.abbreviation}
                          <span style={{ color: 'var(--text-secondary)', fontWeight: 400, marginLeft: '0.5rem', fontSize: '0.6875rem' }}>
                            {g.league}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-data)', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>
                          {fmtTime(g)} ET · pick {winHome ? g.homeTeam.abbreviation : g.awayTeam.abbreviation}
                        </div>
                      </div>

                      {/* Confidence bar + number */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexShrink: 0, width: 148 }}>
                        <div className="conf-bar-track" style={{ flex: 1 }}>
                          <div
                            className="conf-bar-fill"
                            style={{ width: `${conf}%`, background: barColor, animationDelay: `${i * 50}ms` }}
                          />
                        </div>
                        <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.8125rem', fontWeight: 700, color: barColor, width: 38, textAlign: 'right' }}>
                          {conf}%
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* Accuracy by sport — horizontal bar chart */}
          <section>
            <SectionHead title="Accuracy by sport" href="/accuracy" linkLabel="Full metrics" />
            <div className="card" style={{ padding: '0.5rem 0' }}>
              {Object.entries(accuracy.bySport)
                .sort(([, a], [, b]) => b - a)
                .map(([sport, acc], i) => {
                  const barColor = acc > 70 ? 'var(--accent)' : acc >= 65 ? 'var(--text-secondary)' : 'var(--text-muted)';
                  return (
                    <div key={sport} style={{
                      display: 'grid', gridTemplateColumns: '8.5rem 1fr 3.25rem',
                      alignItems: 'center', gap: '0.875rem',
                      padding: '0.5rem 1.125rem',
                    }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 500 }}>{sport}</span>
                      <div className="conf-bar-track" style={{ height: 8 }}>
                        <div
                          className="conf-bar-fill"
                          style={{ width: `${acc}%`, background: barColor, animationDelay: `${i * 50}ms` }}
                        />
                      </div>
                      <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'right' }}>
                        {acc.toFixed(1)}%
                      </span>
                    </div>
                  );
                })}
            </div>
          </section>

          {/* Recent predictions — outcomes owned, losses visible */}
          <section>
            <SectionHead title="Recent predictions" href="/history" linkLabel="History" />
            <div className="card" style={{ overflow: 'hidden' }}>
              {recentPredictions.map((item, i, arr) => {
                const correct = item.correct;
                const resColor = correct ? 'var(--success)' : 'var(--danger)';
                const sportColor = SPORT_COLOR[item.sport] ?? 'var(--text-secondary)';
                return (
                  <div key={item.id} style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.625rem 1.125rem',
                    borderBottom: i < arr.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  }}>
                    <span style={{
                      fontSize: '0.5625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                      padding: '0.1875rem 0.5rem', borderRadius: 100, flexShrink: 0,
                      background: `color-mix(in srgb, ${sportColor} 14%, transparent)`,
                      color: sportColor,
                    }}>
                      {item.sport}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                        {item.homeTeam} vs {item.awayTeam}
                      </span>
                      <span style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-data)', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                        {item.score}
                      </span>
                      <div style={{ fontSize: '0.625rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>
                        Picked {item.prediction}
                      </div>
                    </div>
                    <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', flexShrink: 0 }}>
                      {item.confidence}%
                    </span>
                    {correct
                      ? <Check size={15} color="var(--success)" strokeWidth={2.5} style={{ flexShrink: 0 }} />
                      : <X size={15} color="var(--danger)" strokeWidth={2.5} style={{ flexShrink: 0 }} />}
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* ── Sidebar column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

          {/* Upset alerts — urgent, red-bordered */}
          {upsetAlerts.length > 0 && (
            <section>
              <SectionHead title="Upset alerts" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {upsetAlerts.map(g => {
                  const underdog = g.prediction.winner === g.homeTeam.name ? g.awayTeam : g.homeTeam;
                  return (
                    <Link key={g.id} href={`/game/${g.id}`} className="pick-card" style={{
                      borderLeft: '3px solid var(--danger)',
                      padding: '0.625rem 0.875rem',
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {g.homeTeam.abbreviation} vs {g.awayTeam.abbreviation}
                        </div>
                        <div style={{ fontSize: '0.625rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>
                          {underdog.abbreviation} live · {g.league}
                        </div>
                      </div>
                      <span style={{ fontFamily: 'var(--font-data)', fontSize: '1.125rem', fontWeight: 700, color: 'var(--danger)', flexShrink: 0 }}>
                        {g.prediction.upsetProbability}%
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* Trending teams — horizontal pill row */}
          <section>
            <SectionHead title="Trending teams" />
            <div className="scroll-ribbon" style={{ flexWrap: 'wrap', gap: '0.4375rem' }}>
              {trendingTeams.map(t => {
                const up = t.direction === 'hot';
                return (
                  <span key={t.id} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.4375rem',
                    padding: '0.375rem 0.75rem', borderRadius: 100,
                    background: 'var(--bg-card)', border: '1px solid var(--border-default)',
                    whiteSpace: 'nowrap',
                  }}>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: t.color ?? 'var(--text-primary)' }}>
                      {t.abbreviation}
                    </span>
                    <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.625rem', fontWeight: 700, color: up ? 'var(--success)' : 'var(--danger)' }}>
                      {t.streak}
                    </span>
                    <span style={{ fontSize: '0.5625rem', color: 'var(--text-secondary)' }}>{t.sport}</span>
                  </span>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      {/* ── Markets — below the fold, collapsed by default ── */}
      <details style={{ marginTop: '2rem' }}>
        <summary style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          cursor: 'pointer', listStyle: 'none',
          padding: '0.75rem 1.125rem',
          background: 'var(--bg-card)', border: '1px solid var(--border-default)',
          borderRadius: 'var(--r-lg)',
          fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)',
        }}>
          Market overview <ChevronDown size={14} style={{ color: 'var(--text-secondary)' }} />
        </summary>
        <div style={{ marginTop: '1rem' }}>
          <LiveDashboardMarket
            initialIndices={marketOverview?.indices ?? []}
            initialMarketState={marketOverview?.marketState ?? 'CLOSED'}
            initialGainers={marketOverview?.gainers ?? []}
            initialLosers={marketOverview?.losers ?? []}
            initialActives={marketOverview?.actives ?? []}
            initialSectors={marketOverview?.sectors ?? []}
            initialWatchlist={[]}
            initialNews={[]}
          />
        </div>
      </details>
    </div>
  );
}
