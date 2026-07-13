import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getLeagueById, getLeagues } from '@/lib/api';
import type { LeagueStanding, LeagueFixture } from '@/lib/types';

export async function generateStaticParams() {
  const leagues = await getLeagues();
  return leagues.map(l => ({ id: l.id }));
}

interface Props { params: Promise<{ id: string }> }

export default async function LeaguePage({ params }: Props) {
  const { id } = await params;
  const league = await getLeagueById(id);
  if (!league) notFound();

  const upcoming = league.fixtures.filter(f => f.status === 'Upcoming');
  const recent   = league.fixtures.filter(f => f.status === 'Final').reverse().slice(0, 5);
  const hasDraw  = league.standings.some(s => s.d > 0);

  return (
    <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8 space-y-8">

      {/* Header */}
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
          {league.sport} &mdash; {league.country}
        </p>
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          {league.name}
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {league.season} season &middot; {league.tier}
        </p>
      </header>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Standings table — takes 2 cols */}
        <section className="lg:col-span-2 space-y-3">
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Standings</h2>
          <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--border-subtle)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th className="px-3 py-2.5 text-left w-8" style={{ color: 'var(--text-muted)' }}>#</th>
                  <th className="px-3 py-2.5 text-left" style={{ color: 'var(--text-muted)' }}>Club</th>
                  <th className="px-3 py-2.5 text-center" style={{ color: 'var(--text-muted)' }}>GP</th>
                  <th className="px-3 py-2.5 text-center" style={{ color: 'var(--text-muted)' }}>W</th>
                  {hasDraw && <th className="px-3 py-2.5 text-center" style={{ color: 'var(--text-muted)' }}>D</th>}
                  <th className="px-3 py-2.5 text-center" style={{ color: 'var(--text-muted)' }}>L</th>
                  {hasDraw && (
                    <>
                      <th className="px-3 py-2.5 text-center" style={{ color: 'var(--text-muted)' }}>GF</th>
                      <th className="px-3 py-2.5 text-center" style={{ color: 'var(--text-muted)' }}>GA</th>
                      <th className="px-3 py-2.5 text-center" style={{ color: 'var(--text-muted)' }}>GD</th>
                      <th className="px-3 py-2.5 text-center font-bold" style={{ color: 'var(--text-primary)' }}>Pts</th>
                    </>
                  )}
                  {!hasDraw && (
                    <th className="px-3 py-2.5 text-center font-bold" style={{ color: 'var(--text-primary)' }}>Win%</th>
                  )}
                  <th className="px-3 py-2.5 text-center hidden sm:table-cell" style={{ color: 'var(--text-muted)' }}>Last 5</th>
                  <th className="px-3 py-2.5 text-center hidden sm:table-cell" style={{ color: 'var(--text-muted)' }}>Streak</th>
                </tr>
              </thead>
              <tbody>
                {league.standings.map((s, i) => (
                  <StandingRow key={s.teamId} s={s} i={i} total={league.standings.length} hasDraw={hasDraw} />
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Sidebar — fixtures */}
        <aside className="space-y-6">

          {/* Upcoming fixtures */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Upcoming</h2>
            {upcoming.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No upcoming fixtures</p>
            ) : (
              <div className="space-y-2">
                {upcoming.map((f, i) => <FixtureCard key={i} f={f} />)}
              </div>
            )}
          </section>

          {/* Recent results */}
          {recent.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Recent Results</h2>
              <div className="space-y-2">
                {recent.map((f, i) => <FixtureCard key={i} f={f} />)}
              </div>
            </section>
          )}

          {/* Matchup CTA */}
          <div
            className="rounded-xl p-4 space-y-2"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
          >
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Predict any matchup</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Pick two teams from this league and get a full AI prediction.
            </p>
            <Link
              href="/matchup"
              className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-1.5 transition-colors"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              Open Matchup Tool
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}

function StandingRow({ s, i, total, hasDraw }: { s: LeagueStanding; i: number; total: number; hasDraw: boolean }) {
  const isTop3   = i < 3;
  const isBottom = i >= total - 3;
  const rowBg    = i % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-elevated)';
  const borderLeft = isTop3 ? `3px solid ${s.color}` : isBottom ? '3px solid #EF4444' : '3px solid transparent';

  const streakColor =
    s.streak.startsWith('W') ? '#22C55E' :
    s.streak.startsWith('L') ? '#EF4444' : 'var(--text-muted)';

  return (
    <tr style={{ background: rowBg, borderLeft }}>
      <td className="px-3 py-2 text-center text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
        {s.rank}
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
          <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{s.teamName}</span>
          <span className="text-xs hidden md:inline" style={{ color: 'var(--text-muted)' }}>({s.abbreviation})</span>
        </div>
      </td>
      <td className="px-3 py-2 text-center text-xs" style={{ color: 'var(--text-muted)' }}>{s.gp}</td>
      <td className="px-3 py-2 text-center text-xs" style={{ color: 'var(--text-primary)' }}>{s.w}</td>
      {hasDraw && <td className="px-3 py-2 text-center text-xs" style={{ color: 'var(--text-muted)' }}>{s.d}</td>}
      <td className="px-3 py-2 text-center text-xs" style={{ color: 'var(--text-muted)' }}>{s.l}</td>
      {hasDraw && (
        <>
          <td className="px-3 py-2 text-center text-xs" style={{ color: 'var(--text-muted)' }}>{s.gf}</td>
          <td className="px-3 py-2 text-center text-xs" style={{ color: 'var(--text-muted)' }}>{s.ga}</td>
          <td className="px-3 py-2 text-center text-xs" style={{ color: s.gd > 0 ? '#22C55E' : s.gd < 0 ? '#EF4444' : 'var(--text-muted)' }}>
            {s.gd > 0 ? `+${s.gd}` : s.gd}
          </td>
          <td className="px-3 py-2 text-center text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{s.pts}</td>
        </>
      )}
      {!hasDraw && (
        <td className="px-3 py-2 text-center text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
          {(s.winPct * 100).toFixed(1)}%
        </td>
      )}
      <td className="px-3 py-2 text-center hidden sm:table-cell">
        <div className="flex items-center justify-center gap-0.5">
          {s.last5.map((r, j) => (
            <span
              key={j}
              className="w-4 h-4 rounded-sm text-[9px] font-bold flex items-center justify-center"
              style={{
                background: r === 'W' ? '#22C55E' : r === 'D' ? '#F59E0B' : '#EF4444',
                color: '#fff',
              }}
            >{r}</span>
          ))}
        </div>
      </td>
      <td className="px-3 py-2 text-center text-xs font-semibold hidden sm:table-cell" style={{ color: streakColor }}>
        {s.streak || '–'}
      </td>
    </tr>
  );
}

function FixtureCard({ f }: { f: LeagueFixture }) {
  const isFinal = f.status === 'Final';
  const date = new Date(f.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div
      className="rounded-lg px-3 py-2.5 space-y-1.5"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
    >
      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{date}</p>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: f.homeColor }} />
          <span className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{f.homeAbbr}</span>
        </div>
        {isFinal ? (
          <span className="text-xs font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
            {f.homeScore} – {f.awayScore}
          </span>
        ) : (
          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}>
            vs
          </span>
        )}
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{f.awayAbbr}</span>
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: f.awayColor }} />
        </div>
      </div>
    </div>
  );
}
