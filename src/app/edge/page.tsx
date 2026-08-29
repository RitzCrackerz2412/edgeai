import Link from 'next/link';
import { ChevronRight, Zap, Flame, Snowflake, Swords, TrendingUp } from 'lucide-react';
import { getUpcomingGames } from '@/lib/api';
import {
  getUpsetRadar, getEloStakes, getCivilWars, getMomentumBoard, getHeadliners,
} from '@/lib/edgeSheet';

export const revalidate = 300;

const card: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 12,
  padding: '1rem',
};

function TeamDot({ color }: { color: string }) {
  return <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0, display: 'inline-block' }} />;
}

function SectionHeader({ icon, title, sub }: { icon: React.ReactNode; title: string; sub?: string }) {
  return (
    <div className="section-label">
      {icon}
      <span className="section-label-text">{title}</span>
      {sub && <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>· {sub}</span>}
    </div>
  );
}

export default async function EdgeSheetPage() {
  const games = await getUpcomingGames({ includeRecent: false });

  const radar    = getUpsetRadar(games);
  const stakes   = getEloStakes(games);
  const wars     = getCivilWars(games);
  const momentum = getMomentumBoard(games);
  const heads    = getHeadliners(games, radar, wars);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', timeZone: 'America/New_York',
  });

  return (
    <main style={{ maxWidth: '56rem', margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title">The Edge Sheet</h1>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
          {today} · ET
        </span>
      </div>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '-0.75rem', marginBottom: '1.5rem' }}>
        Daily briefing — the signals buried in today&apos;s slate, surfaced.
      </p>

      {/* ── Headliners ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(15rem, 1fr))', gap: '0.75rem', marginBottom: '1.75rem' }}>
        {heads.lock && (
          <Link href={`/game/${heads.lock.id}`} style={{ ...card, display: 'block', borderTop: '2px solid #10b981' }}>
            <div style={{ fontSize: '0.5625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: '#10b981', marginBottom: '0.5rem' }}>
              Lock of the Day
            </div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {heads.lock.prediction.winner}
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              {heads.lock.homeTeam.abbreviation} vs {heads.lock.awayTeam.abbreviation} · {heads.lock.league}
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.625rem' }}>
              <div>
                <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#10b981', fontVariantNumeric: 'tabular-nums' }}>
                  {heads.lock.prediction.winProbability.toFixed(0)}%
                </div>
                <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Win Prob</div>
              </div>
              <div>
                <div style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                  {heads.lock.prediction.confidence.toFixed(0)}
                </div>
                <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Confidence</div>
              </div>
            </div>
          </Link>
        )}

        {heads.upset && (
          <Link href={`/game/${heads.upset.game.id}`} style={{ ...card, display: 'block', borderTop: '2px solid #f59e0b' }}>
            <div style={{ fontSize: '0.5625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: '#f59e0b', marginBottom: '0.5rem' }}>
              Upset Alert
            </div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {heads.upset.underdog.name}
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              live dog vs {heads.upset.favorite.abbreviation} · {heads.upset.game.league}
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.625rem' }}>
              <div>
                <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#f59e0b', fontVariantNumeric: 'tabular-nums' }}>
                  {heads.upset.upsetProb.toFixed(0)}%
                </div>
                <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Upset Prob</div>
              </div>
              <div>
                <div style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                  {heads.upset.underdogHeat}/5
                </div>
                <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Dog Last 5</div>
              </div>
            </div>
          </Link>
        )}

        {heads.civilWar && (
          <Link href={`/game/${heads.civilWar.game.id}`} style={{ ...card, display: 'block', borderTop: '2px solid #8b5cf6' }}>
            <div style={{ fontSize: '0.5625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: '#8b5cf6', marginBottom: '0.5rem' }}>
              Model Civil War
            </div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {heads.civilWar.game.homeTeam.abbreviation} vs {heads.civilWar.game.awayTeam.abbreviation}
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              our 3 models can&apos;t agree · {heads.civilWar.game.league}
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.625rem' }}>
              <div>
                <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#8b5cf6', fontVariantNumeric: 'tabular-nums' }}>
                  ±{heads.civilWar.disagreementPct.toFixed(0)}
                </div>
                <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Spread (pts)</div>
              </div>
              <div>
                <div style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                  {heads.civilWar.activeModels}
                </div>
                <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Models</div>
              </div>
            </div>
          </Link>
        )}
      </div>

      {/* ── Upset Radar ── */}
      {radar.length > 0 && (
        <section style={{ marginBottom: '1.75rem' }}>
          <SectionHeader
            icon={<Zap size={12} style={{ color: '#f59e0b' }} />}
            title="Upset Radar"
            sub="live underdogs, ranked by upset score"
          />
          <div className="fixture-section">
            {radar.map(a => (
              <Link key={a.game.id} href={`/game/${a.game.id}`} className="fixture-row" style={{ gridTemplateColumns: '1fr auto auto auto 13px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4375rem', minWidth: 0 }}>
                  <TeamDot color={a.underdog.color} />
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {a.underdog.name}
                  </span>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    over {a.favorite.abbreviation}
                  </span>
                </div>
                <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                  last 5: {a.underdogHeat}W
                </span>
                <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                  ELO gap {a.eloGap > 0 ? '+' : ''}{a.eloGap.toFixed(0)}
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#f59e0b', fontVariantNumeric: 'tabular-nums' }}>
                  {a.upsetProb.toFixed(0)}%
                </span>
                <ChevronRight size={13} style={{ color: 'var(--text-muted)' }} />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── ELO Stakes ── */}
      {stakes.length > 0 && (
        <section style={{ marginBottom: '1.75rem' }}>
          <SectionHeader
            icon={<TrendingUp size={12} style={{ color: 'var(--accent-light)' }} />}
            title="Rating Points at Stake"
            sub="games that move the power rankings most if the favorite falls"
          />
          <div className="fixture-section">
            {stakes.map(s => (
              <Link key={s.game.id} href={`/game/${s.game.id}`} className="fixture-row" style={{ gridTemplateColumns: '1fr auto auto 13px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4375rem', minWidth: 0 }}>
                  <TeamDot color={s.favorite.color} />
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.favorite.abbreviation}
                  </span>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>vs</span>
                  <TeamDot color={s.underdog.color} />
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.underdog.abbreviation}
                  </span>
                  <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>· {s.game.league}</span>
                </div>
                <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                  fav {s.favWinProb.toFixed(0)}%
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-light)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                  −{s.swingIfUpset.toFixed(1)} elo
                </span>
                <ChevronRight size={13} style={{ color: 'var(--text-muted)' }} />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Model Civil Wars ── */}
      {wars.length > 0 && (
        <section style={{ marginBottom: '1.75rem' }}>
          <SectionHeader
            icon={<Swords size={12} style={{ color: '#8b5cf6' }} />}
            title="Model Civil Wars"
            sub="three independent models, three different answers"
          />
          <div className="fixture-section">
            {wars.map(w => (
              <Link key={w.game.id} href={`/game/${w.game.id}`} className="fixture-row" style={{ gridTemplateColumns: '1fr auto auto 13px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4375rem', minWidth: 0 }}>
                  <TeamDot color={w.game.homeTeam.color} />
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {w.game.homeTeam.abbreviation}
                  </span>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>vs</span>
                  <TeamDot color={w.game.awayTeam.color} />
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {w.game.awayTeam.abbreviation}
                  </span>
                  <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>· {w.game.league}</span>
                </div>
                <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                  {w.scoreA.toFixed(0)} / {w.scoreB.toFixed(0)} / {w.scoreC.toFixed(0)} home-win%
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#8b5cf6', fontVariantNumeric: 'tabular-nums' }}>
                  ±{w.disagreementPct.toFixed(0)}
                </span>
                <ChevronRight size={13} style={{ color: 'var(--text-muted)' }} />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Momentum Board ── */}
      {(momentum.hot.length > 0 || momentum.cold.length > 0) && (
        <section style={{ marginBottom: '1.75rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(18rem, 1fr))', gap: '1.25rem' }}>
            <div>
              <SectionHeader icon={<Flame size={12} style={{ color: '#ef4444' }} />} title="Running Hot" />
              <div className="fixture-section">
                {momentum.hot.map(m => (
                  <Link key={m.team.id} href={`/game/${m.nextGameId}`} className="fixture-row" style={{ gridTemplateColumns: '1fr auto auto 13px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4375rem', minWidth: 0 }}>
                      <TeamDot color={m.team.color} />
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.team.name}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      next: {m.nextOpponent.split(' ').slice(-1)[0]}
                    </span>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#ef4444', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                      {m.record5} <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>L5</span>
                    </span>
                    <ChevronRight size={13} style={{ color: 'var(--text-muted)' }} />
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <SectionHeader icon={<Snowflake size={12} style={{ color: '#38bdf8' }} />} title="Ice Cold" />
              <div className="fixture-section">
                {momentum.cold.map(m => (
                  <Link key={m.team.id} href={`/game/${m.nextGameId}`} className="fixture-row" style={{ gridTemplateColumns: '1fr auto auto 13px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4375rem', minWidth: 0 }}>
                      <TeamDot color={m.team.color} />
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.team.name}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      next: {m.nextOpponent.split(' ').slice(-1)[0]}
                    </span>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#38bdf8', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                      {m.record5} <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>L5</span>
                    </span>
                    <ChevronRight size={13} style={{ color: 'var(--text-muted)' }} />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {games.filter(g => g.status === 'Upcoming' || g.status === 'Pregame').length === 0 && (
        <div style={{ textAlign: 'center', padding: '5rem 1rem', color: 'var(--text-muted)' }}>
          <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>No pending games to analyze</p>
          <p style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>The Edge Sheet rebuilds as new games are scheduled</p>
        </div>
      )}
    </main>
  );
}
