import type { GameLogEntry } from '@/lib/playerData';
import { Badge } from '@/components/ui/Badge';

const perfVariant = (p: GameLogEntry['performance']) => {
  if (p === 'Elite')   return 'accent';
  if (p === 'Good')    return 'green';
  if (p === 'Average') return 'default';
  return 'red';
};

export function GameLogTable({ log }: { log: GameLogEntry[] }) {
  const statKeys = Object.keys(log[0]?.stats ?? {});

  return (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Opp</th>
            <th>H/A</th>
            <th>Result</th>
            {statKeys.map(k => <th key={k}>{k}</th>)}
            <th>Rating</th>
          </tr>
        </thead>
        <tbody>
          {log.map((g, i) => (
            <tr key={i}>
              <td className="text-mono-sm">{g.date}</td>
              <td className="font-medium" style={{ color: 'var(--text-primary)' }}>{g.opponent}</td>
              <td style={{ color: 'var(--text-muted)' }}>{g.home ? 'H' : 'A'}</td>
              <td>
                <span
                  className="text-xs font-bold"
                  style={{ color: g.result === 'W' ? 'var(--success)' : 'var(--danger)' }}
                >
                  {g.result}
                </span>
              </td>
              {statKeys.map(k => (
                <td key={k} className="text-mono-sm" style={{ color: 'var(--text-primary)' }}>
                  {g.stats[k]}
                </td>
              ))}
              <td><Badge variant={perfVariant(g.performance)}>{g.performance}</Badge></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
