import { NextResponse } from 'next/server';
import { resultsStore } from '@/lib/results/store';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get('teamId');

  if (teamId) {
    const stats = resultsStore.getTeamStats(teamId);
    if (!stats) {
      return NextResponse.json({ error: `No results for team: ${teamId}` }, { status: 404 });
    }
    return NextResponse.json(stats);
  }

  const summary = resultsStore.getSummary();
  const recent  = resultsStore.getRecentGames(20);
  const all     = resultsStore.getAllStats();

  // Build a quick leaderboard sorted by games played
  const teams = Object.values(all)
    .sort((a, b) => b.gamesPlayed - a.gamesPlayed)
    .slice(0, 30)
    .map(s => ({
      teamId:           s.teamId,
      sport:            s.sport,
      gamesPlayed:      s.gamesPlayed,
      record:           `${s.wins}-${s.losses}`,
      offRating:        s.offRatingRolling,
      defRating:        s.defRatingRolling,
      eloRating:        s.eloRating,
      homeRecord:       `${s.homeWins}-${s.homeLosses}`,
      awayRecord:       `${s.awayWins}-${s.awayLosses}`,
      recentForm:       s.recentResults.join(''),
      lastUpdated:      s.lastUpdated,
    }));

  return NextResponse.json({ summary, teams, recentGames: recent });
}
