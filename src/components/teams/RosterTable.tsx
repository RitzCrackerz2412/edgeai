import type { RosterPlayer } from '@/lib/teamData';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';

const statusVariant = (s: RosterPlayer['status']) => {
  if (s === 'Active')       return 'green';
  if (s === 'Questionable') return 'yellow';
  if (s === 'Doubtful')     return 'yellow';
  return 'red';
};

export function RosterTable({ roster }: { roster: RosterPlayer[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Player</th>
            <th>Pos</th>
            <th>Age</th>
            <th>Ht / Wt</th>
            <th>Status</th>
            <th>Impact</th>
            <th className="text-right">Key Stats</th>
          </tr>
        </thead>
        <tbody>
          {roster.map(p => (
            <tr key={p.id} className="cursor-pointer">
              <td className="text-mono-sm" style={{ color: 'var(--text-muted)', width: '2rem' }}>{p.number}</td>
              <td>
                <Link
                  href={`/player/${p.id}`}
                  className="font-medium hover:underline"
                  style={{ color: 'var(--text-primary)', textDecoration: 'none' }}
                >
                  {p.name}
                </Link>
              </td>
              <td>
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>
                  {p.position}
                </span>
              </td>
              <td>{p.age}</td>
              <td style={{ color: 'var(--text-muted)' }}>{p.height} / {p.weight} lbs</td>
              <td>
                <Badge variant={statusVariant(p.status)}>{p.status}</Badge>
              </td>
              <td>
                <div className="flex items-center gap-2" style={{ minWidth: '80px' }}>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-default)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${p.impact}%`,
                        background: p.impact >= 85 ? 'var(--accent)' : p.impact >= 70 ? 'var(--warning)' : 'var(--text-muted)',
                      }}
                    />
                  </div>
                  <span className="text-xs text-mono" style={{ color: 'var(--text-secondary)' }}>{p.impact}</span>
                </div>
              </td>
              <td className="text-right text-mono-sm" style={{ color: 'var(--text-muted)' }}>
                {Object.entries(p.stats).slice(0, 3).map(([k, v]) => `${k}: ${v}`).join(' · ')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
