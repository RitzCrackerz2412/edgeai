import { getAllTeams } from '@/lib/api';
import { MatchupClient } from './MatchupClient';

export default async function MatchupPage() {
  const teams = await getAllTeams();

  return (
    <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Matchup Predictor
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Select any two teams from 500+ across all major leagues for an AI-powered prediction.
        </p>
      </header>

      <MatchupClient teams={teams} />
    </main>
  );
}
