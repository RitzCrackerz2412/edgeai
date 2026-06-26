import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getTournamentById, getTournaments } from '@/lib/api';
import type { LeagueStanding, TournamentMatch } from '@/lib/types';

export async function generateStaticParams() {
  const tournaments = await getTournaments();
  return tournaments.map(t => ({ id: t.id }));
}

interface Props { params: Promise<{ id: string }> }

export default async function TournamentPage({ params }: Props) {
  const { id } = await params;
  const tournament = await getTournamentById(id);
  if (!tournament) notFound();

  const statusColor =
    tournament.status === 'Active'    ? '#22C55E' :
    tournament.status === 'Completed' ? 'var(--text-muted)' : '#F59E0B';

  const knockout = tournament.knockoutMatches ?? [];
  const roundOrder = ['Round of 32','Round of 16','Quarterfinal','Semifinal','Third Place','Final'];
  const roundedKnockout = roundOrder
    .map(r => ({ round: r, matches: knockout.filter(m => m.round === r) }))
    .filter(g => g.matches.length > 0);

  return (
    <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8 space-y-10">

      {/* Header */}
      <header className="space-y-2">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {tournament.name}
          </h1>
          <span
            className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full"
            style={{ background: `${statusColor}20`, color: statusColor }}
          >
            {tournament.status}
          </span>
        </div>
        <div className="flex flex-wrap gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span>{tournament.sport} &middot; {tournament.country}</span>
          <span>{tournament.season}</span>
          <span>{tournament.teamCount} teams</span>
          <span>{tournament.format}</span>
        </div>
        {tournament.champion && (
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
          >
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Champion:</span>
            <span className="text-sm font-bold" style={{ color: '#F59E0B' }}>{tournament.champion}</span>
          </div>
        )}
        {tournament.topScorer && (
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ml-2"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
          >
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Top scorer:</span>
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {tournament.topScorer.name} ({tournament.topScorer.team}) — {tournament.topScorer.value} {tournament.topScorer.stat}
            </span>
          </div>
        )}
      </header>

      {/* Groups */}
      {tournament.groups && tournament.groups.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Group Stage</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {tournament.groups.map(group => (
              <GroupTable key={group.label} label={group.label} teams={group.teams} />
            ))}
          </div>
        </section>
      )}

      {/* Knockout bracket */}
      {roundedKnockout.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Knockout Stage</h2>
          <div className="space-y-6">
            {roundedKnockout.map(({ round, matches }) => (
              <RoundSection key={round} round={round} matches={matches} />
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <div
        className="rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
      >
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Predict any matchup</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Select two tournament teams and run a full AI prediction.
          </p>
        </div>
        <Link
          href="/matchup"
          className="inline-flex items-center gap-2 text-sm font-semibold rounded-xl px-4 py-2 shrink-0 transition-colors"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          Open Matchup Tool
        </Link>
      </div>
    </main>
  );
}

function GroupTable({ label, teams }: { label: string; teams: LeagueStanding[] }) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}
    >
      <div className="px-3 py-2 text-xs font-bold uppercase tracking-widest"
        style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
        {label}
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <th className="px-3 py-1.5 text-left" style={{ color: 'var(--text-muted)' }}>Team</th>
            <th className="px-2 py-1.5 text-center" style={{ color: 'var(--text-muted)' }}>GP</th>
            <th className="px-2 py-1.5 text-center" style={{ color: 'var(--text-muted)' }}>W</th>
            <th className="px-2 py-1.5 text-center" style={{ color: 'var(--text-muted)' }}>D</th>
            <th className="px-2 py-1.5 text-center" style={{ color: 'var(--text-muted)' }}>L</th>
            <th className="px-2 py-1.5 text-center font-bold" style={{ color: 'var(--text-primary)' }}>Pts</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((t, i) => (
            <tr key={t.teamId} style={{ background: i % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-elevated)' }}>
              <td className="px-3 py-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: t.color }} />
                  <span style={{ color: 'var(--text-primary)' }}>{t.teamName}</span>
                </div>
              </td>
              <td className="px-2 py-1.5 text-center" style={{ color: 'var(--text-muted)' }}>{t.gp}</td>
              <td className="px-2 py-1.5 text-center" style={{ color: 'var(--text-primary)' }}>{t.w}</td>
              <td className="px-2 py-1.5 text-center" style={{ color: 'var(--text-muted)' }}>{t.d}</td>
              <td className="px-2 py-1.5 text-center" style={{ color: 'var(--text-muted)' }}>{t.l}</td>
              <td className="px-2 py-1.5 text-center font-bold" style={{ color: i < 2 ? '#22C55E' : 'var(--text-primary)' }}>
                {t.pts}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RoundSection({ round, matches }: { round: string; matches: TournamentMatch[] }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
        {round}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {matches.map((m, i) => <MatchCard key={i} m={m} />)}
      </div>
    </div>
  );
}

function MatchCard({ m }: { m: TournamentMatch }) {
  const isFinal = m.status === 'Final';
  const date = new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const homeWon = isFinal && m.homeScore !== undefined && m.awayScore !== undefined && m.homeScore > m.awayScore;
  const awayWon = isFinal && m.homeScore !== undefined && m.awayScore !== undefined && m.awayScore > m.homeScore;

  return (
    <div
      className="rounded-xl p-3 space-y-2"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{date}</span>
        {isFinal
          ? <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: '#22C55E20', color: '#22C55E' }}>Final</span>
          : <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: '#F59E0B20', color: '#F59E0B' }}>Upcoming</span>}
      </div>
      <TeamLine name={m.homeTeam} abbr={m.homeAbbr} color={m.homeColor}
        score={m.homeScore} bold={isFinal} winner={homeWon} />
      <TeamLine name={m.awayTeam} abbr={m.awayAbbr} color={m.awayColor}
        score={m.awayScore} bold={isFinal} winner={awayWon} />
      {m.venue && (
        <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>{m.venue}</p>
      )}
    </div>
  );
}

function TeamLine({
  name, abbr, color, score, bold, winner,
}: {
  name: string; abbr: string; color: string;
  score?: number; bold: boolean; winner: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
        <span
          className="text-xs truncate"
          style={{ color: winner ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: winner ? 700 : 400 }}
        >
          {name.startsWith('TBD') ? 'TBD' : abbr}
        </span>
      </div>
      {score !== undefined && (
        <span
          className="text-sm tabular-nums"
          style={{ color: winner ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: winner ? 700 : 400 }}
        >
          {score}
        </span>
      )}
    </div>
  );
}
