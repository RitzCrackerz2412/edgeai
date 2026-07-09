import type { Game } from '@/lib/types';
import { Cloud, Wind, Thermometer, MapPin, Clock, Plane, Shield } from 'lucide-react';

export function GameContextCard({ game }: { game: Game }) {
  const location = [game.venueCity, game.venueState ?? game.venueCountry]
    .filter(Boolean)
    .join(', ');

  const homeAdv = getHomeAdvantage(game.homeTeam.sport);
  const contextRows = getContextRows(game);

  return (
    <div className="space-y-4">
      {/* Venue */}
      <div className="flex items-start gap-2.5">
        <MapPin size={14} style={{ color: 'var(--accent)', marginTop: '2px', flexShrink: 0 }} />
        <div>
          <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {game.venue.split(',')[0]}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {location || game.venue}
          </div>
        </div>
      </div>

      {/* Weather (if applicable) */}
      {game.weather ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl p-3" style={{ background: 'var(--bg-elevated)' }}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Thermometer size={12} style={{ color: 'var(--info)' }} />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Temperature</span>
            </div>
            <div className="font-bold text-mono" style={{ color: 'var(--text-primary)' }}>{game.weather.temp}°F</div>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{game.weather.condition}</div>
          </div>
          <div className="rounded-xl p-3" style={{ background: 'var(--bg-elevated)' }}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Wind size={12} style={{ color: 'var(--info)' }} />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Wind</span>
            </div>
            <div className="font-bold text-mono" style={{ color: 'var(--text-primary)' }}>{game.weather.wind} mph</div>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Humidity {game.weather.humidity}%</div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl p-3 flex items-center gap-2" style={{ background: 'var(--bg-elevated)' }}>
          <Cloud size={14} style={{ color: 'var(--text-muted)' }} />
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Indoor venue — weather N/A</span>
        </div>
      )}

      {/* Context factors */}
      <div>
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left text-xs pb-2" style={{ color: 'var(--text-muted)' }}>Factor</th>
              <th className="text-center text-xs pb-2" style={{ color: game.homeTeam.color }}>{game.homeTeam.abbreviation}</th>
              <th className="text-center text-xs pb-2" style={{ color: game.awayTeam.color }}>{game.awayTeam.abbreviation}</th>
            </tr>
          </thead>
          <tbody>
            {contextRows.map((r, i) => (
              <tr key={i} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <td className="py-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <span className="flex items-center gap-1.5">
                    <span style={{ color: 'var(--text-muted)' }}>{r.icon}</span>
                    {r.label}
                  </span>
                </td>
                <td className="py-2 text-center text-xs text-mono" style={{ color: r.homeEdge ? 'var(--success)' : 'var(--text-primary)' }}>{r.homeValue}</td>
                <td className="py-2 text-center text-xs text-mono" style={{ color: r.awayEdge ? 'var(--success)' : 'var(--text-primary)' }}>{r.awayValue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Home advantage note */}
      <div className="rounded-xl p-3 flex items-start gap-2.5" style={{ background: 'var(--bg-elevated)' }}>
        <Shield size={13} style={{ color: 'var(--accent)', marginTop: '1px', flexShrink: 0 }} />
        <div>
          <div className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>Home Advantage</div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{homeAdv}</div>
        </div>
      </div>
    </div>
  );
}

interface ContextRow {
  label: string;
  homeValue: string;
  awayValue: string;
  icon: React.ReactNode;
  homeEdge?: boolean;
  awayEdge?: boolean;
}

function getContextRows(game: Game): ContextRow[] {
  const sport = game.homeTeam.sport;
  const homeElo = game.homeTeam.eloRating;
  const awayElo = game.awayTeam.eloRating;
  const eloDiff = homeElo - awayElo;

  const rows: ContextRow[] = [
    {
      label: 'ELO Rating',
      homeValue: String(homeElo),
      awayValue: String(awayElo),
      icon: <Shield size={11} />,
      homeEdge: eloDiff > 0,
      awayEdge: eloDiff < 0,
    },
    {
      label: 'Location',
      homeValue: 'Home',
      awayValue: 'Away',
      icon: <Plane size={11} />,
      homeEdge: true,
    },
  ];

  if (sport === 'NFL' || sport === 'NBA' || sport === 'NHL') {
    rows.push({
      label: 'Win %',
      homeValue: `${Math.round(game.homeTeam.winPct * 100)}%`,
      awayValue: `${Math.round(game.awayTeam.winPct * 100)}%`,
      icon: <Clock size={11} />,
      homeEdge: game.homeTeam.winPct > game.awayTeam.winPct,
      awayEdge: game.awayTeam.winPct > game.homeTeam.winPct,
    });
  }

  return rows;
}

function getHomeAdvantage(sport: string): string {
  if (sport === 'NFL') return '+2.5 pts avg. home-field boost applied to projection';
  if (sport === 'NBA') return '+3.3 pts avg. crowd noise + familiarity edge';
  if (sport === 'MLB') return '+0.18 runs avg. home park factor';
  if (sport === 'NHL') return '+0.15 goals avg. last-change line matching';
  if (sport === 'Soccer') return '+0.22 goals avg. crowd pressure + no travel fatigue';
  return 'Home court/field advantage factored into prediction';
}
