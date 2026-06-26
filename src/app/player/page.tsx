import { Metadata } from 'next';
import Link from 'next/link';
import { getPlayers } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Activity } from 'lucide-react';

export const metadata: Metadata = { title: 'Players' };

type PlayerStatus = 'Active' | 'Questionable' | 'Doubtful' | 'Out';

function statusVariant(s: PlayerStatus) {
  if (s === 'Active')       return 'green'  as const;
  if (s === 'Questionable') return 'yellow' as const;
  if (s === 'Doubtful')     return 'yellow' as const;
  return 'red' as const;
}

export default async function PlayersPage() {
  const players = await getPlayers();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-h1" style={{ color: 'var(--text-primary)' }}>Players</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
          {players.length} players profiled · Stats, AI projections, and game logs
        </p>
      </div>

      {/* Player grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {players.map(player => (
          <Link
            key={player.id}
            href={`/player/${player.id}`}
            className="card-link"
          >
            {/* Player header */}
            <div className="flex items-start gap-3 mb-4">
              {/* Jersey number */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
                style={{ background: player.teamColor }}
              >
                {player.number}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{player.name}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {player.position} · {player.teamName}
                </div>
              </div>
              <Badge variant={statusVariant(player.status as PlayerStatus)}>{player.status}</Badge>
            </div>

            {/* Sport chip + primary stat */}
            <div className="flex items-center justify-between">
              <div
                className="text-xs font-semibold px-2 py-0.5 rounded"
                style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
              >
                {player.sport}
              </div>
              {player.primaryStat && (
                <div className="text-right">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{player.primaryStat.label} </span>
                  <span className="font-bold text-mono" style={{ color: 'var(--accent-light)' }}>
                    {player.primaryStat.value}
                  </span>
                </div>
              )}
            </div>

            {/* View indicator */}
            <div
              className="mt-3 pt-3 flex items-center gap-1.5"
              style={{ borderTop: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}
            >
              <Activity size={12} />
              <span className="text-xs">View profile &amp; AI projection</span>
            </div>
          </Link>
        ))}
      </div>

      <p className="mt-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
        Showing {players.length} players · Player database grows with connected leagues
      </p>
    </div>
  );
}
