import Link from 'next/link';
import type { Game } from '@/lib/types';
import { AlertTriangle, ChevronRight } from 'lucide-react';

export function UpsetAlerts({ games }: { games: Game[] }) {
  const upsets = games
    .filter(g => g.prediction.upsetProbability >= 28)
    .sort((a, b) => b.prediction.upsetProbability - a.prediction.upsetProbability)
    .slice(0, 3);

  if (upsets.length === 0) {
    return (
      <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>
        No significant upset threats today.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {upsets.map(game => {
        const upsetTeam = game.prediction.winner === game.homeTeam.name ? game.awayTeam : game.homeTeam;
        const pct = game.prediction.upsetProbability;
        const alertLevel = pct >= 40 ? 'high' : pct >= 33 ? 'medium' : 'low';
        const alertColor = alertLevel === 'high' ? 'var(--danger)' : alertLevel === 'medium' ? 'var(--warning)' : 'var(--text-secondary)';
        const alertBg = alertLevel === 'high' ? 'var(--danger-dim)' : alertLevel === 'medium' ? 'var(--warning-dim)' : 'var(--bg-elevated)';

        return (
          <Link
            key={game.id}
            href={`/game/${game.id}`}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
            style={{ background: alertBg, border: `1px solid ${alertColor}30`, textDecoration: 'none' }}
          >
            <AlertTriangle size={14} style={{ color: alertColor, flexShrink: 0 }} />

            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {upsetTeam.name}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {upsetTeam.abbreviation} upset probability vs {game.prediction.winner.split(' ').pop()}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-sm font-bold text-mono" style={{ color: alertColor }}>
                {pct.toFixed(1)}%
              </span>
              <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
