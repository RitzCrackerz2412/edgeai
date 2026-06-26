/**
 * POST /api/validate
 *
 * Record an actual game result and validate a stored prediction against it.
 * Updates calibration data so models improve over time.
 *
 * Request body:
 *   {
 *     gameId: string
 *     homeScore: number
 *     awayScore: number
 *     storedPrediction: {
 *       modelName: string
 *       homeWinProbability: number   // 0-1
 *       predictedHomeScore?: number
 *       predictedAwayScore?: number
 *       predictedAt: string          // ISO 8601
 *     }
 *   }
 *
 * Response: ValidationRecord
 */

import { NextRequest, NextResponse } from 'next/server';
import { recordResult } from '@/lib/engine';
import { validationStore } from '@/lib/engine/validator';
import { getCache, cacheKey } from '@/lib/cache';
import { dataLogger } from '@/lib/validation/logger';
import type { StoredPrediction, GameResult } from '@/lib/engine';

interface ValidateBody {
  gameId: string;
  sport?: string;
  homeScore: number;
  awayScore: number;
  storedPrediction: Omit<StoredPrediction, 'gameId' | 'sport'>;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as unknown;

    if (!isValidateBody(body)) {
      return NextResponse.json(
        { error: 'Invalid request body. Requires gameId, homeScore, awayScore, storedPrediction.' },
        { status: 400 },
      );
    }

    const { gameId, sport = 'unknown', homeScore, awayScore, storedPrediction } = body;

    const stored: StoredPrediction = {
      ...storedPrediction,
      gameId,
      sport,
    };

    const result: GameResult = { gameId, sport, homeScore, awayScore };

    const record = recordResult(stored, result);

    // Invalidate prediction cache for this game
    const cache = getCache();
    await cache.del(cacheKey('prediction:', gameId)).catch(() => {});

    return NextResponse.json({
      record,
      accuracy: validationStore.getAccuracy(sport),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Validation failed';
    dataLogger.log('error', 'provider_error', 'validate', 'unknown', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function isValidateBody(body: unknown): body is ValidateBody {
  if (typeof body !== 'object' || body === null) return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.gameId === 'string' &&
    typeof b.homeScore === 'number' &&
    typeof b.awayScore === 'number' &&
    typeof b.storedPrediction === 'object' &&
    b.storedPrediction !== null
  );
}

// GET — retrieve validation stats
export async function GET(req: NextRequest) {
  const sport    = req.nextUrl.searchParams.get('sport') ?? undefined;
  const model    = req.nextUrl.searchParams.get('model') ?? undefined;
  const gameId   = req.nextUrl.searchParams.get('replay');

  if (gameId) {
    const record = validationStore.replay(gameId);
    if (!record) return NextResponse.json({ error: 'No validation record for this game' }, { status: 404 });
    return NextResponse.json({ record });
  }

  return NextResponse.json({
    accuracy: validationStore.getAccuracy(sport, model),
    recentRecords: validationStore.all().slice(-20),
  });
}
