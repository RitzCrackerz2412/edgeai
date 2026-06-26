/**
 * GET  /api/learn  — return continuous learning status
 * POST /api/learn  — trigger post-game update
 * Body: { gameId, sport, homeTeamId, awayTeamId, homeScore, awayScore, storedPrediction? }
 */

import { NextRequest, NextResponse } from 'next/server';
import { processPostGame, getLearningStatus, startNewSeason } from '@/lib/engine/learning';
import type { ValidationRecord } from '@/lib/engine/types';
import type { Sport } from '@/lib/types';

export async function GET() {
  const status = getLearningStatus();
  return NextResponse.json({ status });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Handle new season regression
  if (body.action === 'newSeason') {
    const sport = body.sport as Sport;
    if (!sport) return NextResponse.json({ error: 'sport required' }, { status: 400 });
    const snapshot = startNewSeason(sport);
    return NextResponse.json({ snapshot });
  }

  const { gameId, sport, homeTeamId, awayTeamId, homeScore, awayScore } = body;
  if (!gameId || !sport || !homeTeamId || !awayTeamId || homeScore === undefined || awayScore === undefined) {
    return NextResponse.json(
      { error: 'Required: gameId, sport, homeTeamId, awayTeamId, homeScore, awayScore' },
      { status: 400 },
    );
  }

  const result = processPostGame({
    gameId: String(gameId),
    sport: sport as Sport,
    homeTeamId: String(homeTeamId),
    awayTeamId: String(awayTeamId),
    homeScore: Number(homeScore),
    awayScore: Number(awayScore),
    storedPrediction: body.storedPrediction as ValidationRecord | undefined,
  });

  return NextResponse.json({ result });
}
