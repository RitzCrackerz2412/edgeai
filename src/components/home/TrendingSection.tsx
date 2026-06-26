import Link from 'next/link';
import type { TrendingTeam } from '@/lib/dashboardData';
import { TrendingUp, TrendingDown } from 'lucide-react';

export function TrendingSection({ teams }: { teams: TrendingTeam[] }) {
  const hot  = teams.filter(t => t.direction === 'hot');
  const cold = teams.filter(t => t.direction === 'cold');

  return (
    <div className="grid sm:grid-cols-2 gap-6">
      <TrendGroup label="Hot" teams={hot} positive />
      <TrendGroup label="Cold" teams={cold} positive={false} />
    </div>
  );
}

function TrendGroup({ label, teams, positive }: { label: string; teams: TrendingTeam[]; positive: boolean }) {
  const color = positive ? 'var(--success)' : 'var(--danger)';
  const Icon  = positive ? TrendingUp : TrendingDown;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={14} style={{ color }} />
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color }}>
          {label}
        </span>
      </div>
      <div className="space-y-2">
        {teams.map(team => (
          <Link
            key={team.id}
            href={`/team/${team.id}`}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', textDecoration: 'none' }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold text-white shrink-0"
              style={{ background: team.color }}
            >
              {team.abbreviation.slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{team.name}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{team.sport} · {team.streak}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-sm font-bold text-mono" style={{ color: positive ? 'var(--success)' : 'var(--danger)' }}>
                {team.change > 0 ? '+' : ''}{team.change}
              </div>
              <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>momentum</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
