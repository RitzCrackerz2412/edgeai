import { Metadata } from 'next';
import Link from 'next/link';
import { getTeams } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { TrendingUp, Shield, Trophy } from 'lucide-react';

export const metadata: Metadata = { title: 'Teams' };

function momentumColor(m: number) {
  if (m >= 80) return 'var(--success)';
  if (m >= 60) return 'var(--accent-light)';
  if (m >= 40) return 'var(--warning)';
  return 'var(--danger)';
}

export default async function TeamsPage() {
  const teams = await getTeams();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-h1" style={{ color: 'var(--text-primary)' }}>Teams</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
          {teams.length} teams tracked · Power rankings, ELO ratings, and AI momentum scores
        </p>
      </div>

      {/* Team grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {teams.map(team => (
          <Link
            key={team.id}
            href={`/team/${team.id}`}
            className="card-link"
          >
            {/* Team header */}
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
                style={{ background: team.color }}
              >
                {team.abbreviation}
              </div>
              <div className="min-w-0">
                <div className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                  {team.name}
                </div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {team.league}
                </div>
              </div>
              <div className="ml-auto text-right shrink-0">
                <div className="font-bold text-mono" style={{ color: 'var(--text-primary)' }}>{team.record}</div>
                <div className="text-xs" style={{ color: team.streak.startsWith('W') ? 'var(--success)' : 'var(--danger)' }}>
                  {team.streak}
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <Trophy size={10} style={{ color: 'var(--text-muted)' }} />
                  <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Rank</span>
                </div>
                <div className="font-bold text-lg text-mono" style={{ color: 'var(--accent-light)' }}>#{team.powerRanking}</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <Shield size={10} style={{ color: 'var(--text-muted)' }} />
                  <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>ELO</span>
                </div>
                <div className="font-bold text-lg text-mono" style={{ color: 'var(--text-primary)' }}>{team.eloRating}</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <TrendingUp size={10} style={{ color: 'var(--text-muted)' }} />
                  <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Mom.</span>
                </div>
                <div className="font-bold text-lg text-mono" style={{ color: momentumColor(team.momentum) }}>{team.momentum}</div>
              </div>
            </div>

            {/* Last 10 */}
            <div className="mt-3 pt-3 flex items-center justify-between" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Last 10: {team.last10}</span>
              <Badge variant={team.streak.startsWith('W') ? 'green' : 'red'}>
                {team.streak}
              </Badge>
            </div>
          </Link>
        ))}
      </div>

      {/* More teams note */}
      <p className="mt-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
        Showing {teams.length} teams · Additional teams will appear as data is added
      </p>
    </div>
  );
}
