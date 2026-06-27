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
                <div className="text-xs" style={{ color: team.last5[0] === 'W' ? 'var(--success)' : 'var(--danger)' }}>
                  {team.last5[0] === 'W' ? 'Win' : team.last5[0] === 'D' ? 'Draw' : 'Loss'}
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

            {/* Last 5 */}
            <div className="mt-3 pt-3 flex items-center justify-between" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <div className="flex gap-1">
                {team.last5.map((r, i) => (
                  <span
                    key={i}
                    className="w-5 h-5 flex items-center justify-center text-[10px] font-bold rounded"
                    style={{
                      background: r === 'W' ? 'var(--success)' : r === 'D' ? 'var(--warning)' : 'var(--danger)',
                      color: '#fff',
                    }}
                  >
                    {r}
                  </span>
                ))}
              </div>
              <Badge variant={team.last5[0] === 'W' ? 'green' : 'red'}>
                {team.last5.filter(r => r === 'W').length}-{team.last5.filter(r => r === 'L').length}
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
