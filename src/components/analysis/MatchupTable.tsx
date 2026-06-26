import type { Team } from '@/lib/types';

interface MetricRow {
  label: string;
  home: string | number;
  away: string | number;
  winner?: 'home' | 'away' | 'even';
}

function rows(home: Team, away: Team): MetricRow[] {
  const h = home, a = away;
  return [
    { label: 'Record',              home: h.record,       away: a.record },
    { label: 'Win %',               home: `${(h.winPct * 100).toFixed(1)}%`, away: `${(a.winPct * 100).toFixed(1)}%`,  winner: h.winPct > a.winPct ? 'home' : 'away' },
    { label: 'Power Ranking',       home: `#${h.powerRanking}`, away: `#${a.powerRanking}`, winner: h.powerRanking < a.powerRanking ? 'home' : 'away' },
    { label: 'Offensive Rating',    home: h.offensiveRating, away: a.offensiveRating,       winner: h.offensiveRating > a.offensiveRating ? 'home' : 'away' },
    { label: 'Defensive Rating',    home: h.defensiveRating, away: a.defensiveRating,       winner: h.defensiveRating < a.defensiveRating ? 'home' : 'away' },
    { label: 'Net Rating',          home: (h.offensiveRating - h.defensiveRating).toFixed(1), away: (a.offensiveRating - a.defensiveRating).toFixed(1), winner: (h.offensiveRating - h.defensiveRating) > (a.offensiveRating - a.defensiveRating) ? 'home' : 'away' },
    { label: 'ELO Rating',          home: h.eloRating,    away: a.eloRating,                winner: h.eloRating > a.eloRating ? 'home' : 'away' },
    { label: 'Momentum',            home: h.momentum,     away: a.momentum,                 winner: h.momentum > a.momentum ? 'home' : 'away' },
    { label: 'Home Record',         home: h.homeRecord,   away: a.homeRecord },
    { label: 'Away Record',         home: h.awayRecord,   away: a.awayRecord },
  ];
}

export function MatchupTable({ homeTeam, awayTeam }: { homeTeam: Team; awayTeam: Team }) {
  const data = rows(homeTeam, awayTeam);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            <th
              className="px-3 py-2 text-left text-xs uppercase tracking-wider"
              style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-default)', width: '35%' }}
            >
              Metric
            </th>
            <th
              className="px-3 py-2 text-center text-xs uppercase tracking-wider"
              style={{ color: homeTeam.color, borderBottom: '1px solid var(--border-default)', width: '25%' }}
            >
              {homeTeam.abbreviation}
            </th>
            <th
              className="px-3 py-2 text-center text-xs"
              style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-default)', width: '15%' }}
            >
              —
            </th>
            <th
              className="px-3 py-2 text-center text-xs uppercase tracking-wider"
              style={{ color: awayTeam.color, borderBottom: '1px solid var(--border-default)', width: '25%' }}
            >
              {awayTeam.abbreviation}
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <td className="px-3 py-2" style={{ color: 'var(--text-secondary)' }}>{row.label}</td>
              <td
                className="px-3 py-2 text-center font-semibold text-mono"
                style={{
                  color: row.winner === 'home' ? 'var(--success)' : 'var(--text-primary)',
                  background: row.winner === 'home' ? 'rgba(34,197,94,0.06)' : 'transparent',
                }}
              >
                {row.home}
              </td>
              <td className="px-3 py-2 text-center">
                {row.winner && (
                  <div className="w-2 h-2 rounded-full mx-auto" style={{ background: row.winner === 'home' ? homeTeam.color : awayTeam.color }} />
                )}
              </td>
              <td
                className="px-3 py-2 text-center font-semibold text-mono"
                style={{
                  color: row.winner === 'away' ? 'var(--success)' : 'var(--text-primary)',
                  background: row.winner === 'away' ? 'rgba(34,197,94,0.06)' : 'transparent',
                }}
              >
                {row.away}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
