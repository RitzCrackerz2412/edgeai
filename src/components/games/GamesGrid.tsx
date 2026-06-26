'use client';

import { useState, useMemo } from 'react';
import { Game, Sport } from '@/lib/types';
import { GameCard } from './GameCard';
import { SportFilter } from './SportFilter';
import { GameCardSkeleton } from '@/components/ui/LoadingSkeleton';

interface GamesGridProps {
  games: Game[];
}

export function GamesGrid({ games }: GamesGridProps) {
  const [sport, setSport] = useState<Sport | 'All'>('All');
  const [minConf, setMinConf] = useState(0);
  const [sortBy, setSortBy] = useState<'date' | 'confidence'>('date');

  const filtered = useMemo(() => {
    let g = games;
    if (sport !== 'All') g = g.filter((x) => x.sport === sport);
    if (minConf > 0) g = g.filter((x) => x.prediction.confidence >= minConf);
    if (sortBy === 'confidence') g = [...g].sort((a, b) => b.prediction.confidence - a.prediction.confidence);
    return g;
  }, [games, sport, minConf, sortBy]);

  return (
    <div className="space-y-6">
      {/* Filters row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SportFilter selected={sport} onChange={setSport} />

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
              Min confidence
            </label>
            <select
              value={minConf}
              onChange={(e) => setMinConf(Number(e.target.value))}
              className="text-xs rounded-md px-2 py-1.5 outline-none"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
              }}
            >
              <option value={0}>Any</option>
              <option value={60}>60%+</option>
              <option value={70}>70%+</option>
              <option value={80}>80%+</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
              Sort
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'confidence')}
              className="text-xs rounded-md px-2 py-1.5 outline-none"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
              }}
            >
              <option value="date">Date</option>
              <option value="confidence">Confidence</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        {filtered.length} upcoming {filtered.length === 1 ? 'game' : 'games'}
        {sport !== 'All' ? ` · ${sport}` : ''}
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20" style={{ color: 'var(--text-muted)' }}>
          No games match your filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((game) => (
            <div key={game.id} className="animate-slide-up">
              <GameCard game={game} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function GamesGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <GameCardSkeleton key={i} />
      ))}
    </div>
  );
}
