import Link from 'next/link';
import type { Game } from '@/lib/types';
import { sportIcon } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

export function TopPicks({ games }: { games: Game[] }) {
  const sorted = [...games].sort((a, b) => b.prediction.confidence - a.prediction.confidence).slice(0, 3);

  return (
    <div className="space-y-2">
      {sorted.map((game, i) => {
        const conf = game.prediction.confidence;
        const confColor = conf >= 85 ? 'var(--success)' : conf >= 75 ? 'var(--accent-light)' : 'var(--warning)';
        const confBg = conf >= 85 ? 'var(--success-dim)' : conf >= 75 ? 'var(--accent-dim)' : 'var(--warning-dim)';

        return (
          <Link
            key={game.id}
            href={`/game/${game.id}`}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', textDecoration: 'none' }}
          >
            {/* Rank */}
            <div className="w-5 text-center text-xs font-bold text-mono" style={{ color: 'var(--text-muted)' }}>
              #{i + 1}
            </div>

            {/* Sport + matchup */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>
                <span>{sportIcon(game.sport)}</span>
                <span>{game.sport}</span>
              </div>
              <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                {game.prediction.winner}
              </div>
              <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                vs {game.homeTeam.name === game.prediction.winner ? game.awayTeam.abbreviation : game.homeTeam.abbreviation}
                {' · '}{game.date}
              </div>
            </div>

            {/* Confidence */}
            <div className="flex items-center gap-2 shrink-0">
              <div
                className="text-sm font-bold px-2 py-0.5 rounded text-mono"
                style={{ background: confBg, color: confColor }}
              >
                {conf}%
              </div>
              <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
