import type { Metadata } from 'next';
import { searchGames } from '@/lib/api';
import { GameCard } from '@/components/games/GameCard';
import { SearchBox } from './SearchBox';

export const metadata: Metadata = {
  title: 'Search',
  description: 'Search games, teams, and players across all supported sports.',
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const results = q ? await searchGames(q) : [];

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Search
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Find games, teams, players, and leagues.
        </p>
      </div>

      <SearchBox initialQuery={q} />

      {q && (
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{q}&rdquo;
          </p>
          {results.length === 0 ? (
            <div className="text-center py-20" style={{ color: 'var(--text-muted)' }}>
              No matches found. Try a team name, sport, or league.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {results.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
