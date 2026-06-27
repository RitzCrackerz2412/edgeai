import { NextRequest, NextResponse } from 'next/server';
import { getEspnPlayersForSport } from '@/lib/data/live';
import { PLAYER_DETAILS } from '@/lib/playerData';
import type { Sport } from '@/lib/types';

export const dynamic = 'force-dynamic';

const ESPN_SPORTS = new Set<string>(['NFL', 'NBA', 'MLB', 'NHL']);

export async function GET(req: NextRequest) {
  const sport = req.nextUrl.searchParams.get('sport');

  if (sport && ESPN_SPORTS.has(sport)) {
    const players = await getEspnPlayersForSport(sport as Sport);
    return NextResponse.json({ players });
  }

  if (sport) {
    // Static players for non-ESPN sports (UFC, Boxing, Tennis, etc.)
    const players = Object.values(PLAYER_DETAILS)
      .filter(p => p.sport === sport)
      .map(p => ({
        id: p.id,
        name: p.name,
        position: p.position,
        jersey: p.number,
        teamId: p.teamId,
        teamName: p.teamName,
        teamColor: p.teamColor,
        sport: p.sport as Sport,
        league: p.sport,
        status: p.status,
      }));
    return NextResponse.json({ players });
  }

  // No sport filter — return all static players as summary
  const players = Object.values(PLAYER_DETAILS).map(p => ({
    id: p.id,
    name: p.name,
    position: p.position,
    jersey: p.number,
    teamId: p.teamId,
    teamName: p.teamName,
    teamColor: p.teamColor,
    sport: p.sport as Sport,
    league: p.sport,
    status: p.status,
  }));
  return NextResponse.json({ players });
}
