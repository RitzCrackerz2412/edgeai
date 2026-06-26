/**
 * POST /api/predict
 *
 * On-demand prediction for a single game.
 * Runs the ensemble model and returns calibrated win probabilities,
 * feature contributions, and model metadata.
 *
 * Request body: { gameId: string }
 * Response: EnginePrediction serialized as JSON
 */

import { NextRequest, NextResponse } from 'next/server';
import { getGameById } from '@/lib/api';
import { runPrediction, toPrediction } from '@/lib/engine';
import { getCache, cacheKey, TTL } from '@/lib/cache';
import { dataLogger } from '@/lib/validation/logger';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as unknown;
    if (
      typeof body !== 'object' || body === null ||
      typeof (body as Record<string, unknown>).gameId !== 'string'
    ) {
      return NextResponse.json({ error: 'gameId (string) is required' }, { status: 400 });
    }

    const { gameId } = body as { gameId: string };

    // Check cache first
    const cache = getCache();
    const key = cacheKey('prediction:', gameId);
    const cached = await cache.get<{ prediction: unknown; engineMeta: unknown }>(key).catch(() => null);

    if (cached) {
      return NextResponse.json({ ...cached, cached: true });
    }

    // Load game
    const game = await getGameById(gameId);
    if (!game) {
      return NextResponse.json({ error: `Game "${gameId}" not found` }, { status: 404 });
    }

    // Run prediction engine
    const output      = await runPrediction(game);
    const prediction  = toPrediction(output, game);

    const responseData = {
      gameId,
      prediction,
      engineMeta: {
        modelName:         output.ensemble.modelName,
        modelVersion:      output.ensemble.modelVersion,
        computedAt:        output.ensemble.computedAt,
        confidence:        output.ensemble.confidence,
        individualModels:  Object.fromEntries(
          Object.entries(output.ensemble.individualPredictions).map(([name, pred]) => [
            name,
            { homeWinProb: pred.homeWinProbability, confidence: pred.confidence },
          ]),
        ),
        featureQuality:    output.features.meta.qualityScore,
        missingFields:     output.features.meta.missingFields,
        modelWeights:      output.ensemble.modelWeights,
      },
      cached: false,
    };

    // Cache for 10 minutes
    await cache.set(key, responseData, TTL.PREDICTION).catch(() => {});

    return NextResponse.json(responseData);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Prediction failed';
    dataLogger.log('error', 'provider_error', 'prediction', 'unknown', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Support GET with gameId query param for browser testing
export async function GET(req: NextRequest) {
  const gameId = req.nextUrl.searchParams.get('gameId');
  if (!gameId) {
    return NextResponse.json({ error: 'gameId query param required' }, { status: 400 });
  }
  return POST(new NextRequest(req.url, {
    method: 'POST',
    body: JSON.stringify({ gameId }),
    headers: { 'Content-Type': 'application/json' },
  }));
}
