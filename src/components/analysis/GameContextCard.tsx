import type { Game } from '@/lib/types';
import { Cloud, Wind, Thermometer, MapPin, Clock, Plane } from 'lucide-react';

interface ContextRow {
  label: string;
  homeValue: string;
  awayValue: string;
  icon: React.ReactNode;
}

export function GameContextCard({ game }: { game: Game }) {
  const rows: ContextRow[] = [
    {
      label: 'Rest Days',
      homeValue: `${getMockRestDays(game.homeTeam.sport, 'home')} days`,
      awayValue: `${getMockRestDays(game.homeTeam.sport, 'away')} days`,
      icon: <Clock size={12} />,
    },
    {
      label: 'Travel Distance',
      homeValue: 'Home (0 mi)',
      awayValue: `${getMockTravel(game.awayTeam.abbreviation)} mi`,
      icon: <Plane size={12} />,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Venue */}
      <div className="flex items-start gap-2.5">
        <MapPin size={14} style={{ color: 'var(--accent-light)', marginTop: '2px', flexShrink: 0 }} />
        <div>
          <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{game.venue.split(',')[0]}</div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{game.venue}</div>
        </div>
      </div>

      {/* Weather (if applicable) */}
      {game.weather && (
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
      )}

      {!game.weather && (
        <div className="rounded-xl p-3 flex items-center gap-2" style={{ background: 'var(--bg-elevated)' }}>
          <Cloud size={14} style={{ color: 'var(--text-muted)' }} />
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Indoor venue — weather N/A</span>
        </div>
      )}

      {/* Rest + Travel */}
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
            {rows.map((r, i) => (
              <tr key={i} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <td className="py-2 text-xs flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{r.icon}</span>
                  {r.label}
                </td>
                <td className="py-2 text-center text-xs text-mono" style={{ color: 'var(--text-primary)' }}>{r.homeValue}</td>
                <td className="py-2 text-center text-xs text-mono" style={{ color: 'var(--text-primary)' }}>{r.awayValue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}

function getMockRestDays(sport: string, side: 'home' | 'away'): number {
  // Live: derive from schedule API (SportsDataIO) game log
  if (sport === 'NBA') return side === 'home' ? 1 : 2;
  if (sport === 'NFL') return 7;
  if (sport === 'NHL') return side === 'away' ? 1 : 3;
  if (sport === 'MLB') return 0;
  return 3;
}

function getMockTravel(abbr: string): number {
  // Live: replace with city-to-city distance from venue coordinates
  const distances: Record<string, number> = {
    BUF: 1134, LAL: 1590, HOU: 1357, TOR: 1862,
    ARS: 5258, SM: 0, BOS: 1842, DEN: 1862,
  };
  return distances[abbr] ?? 1200;
}
