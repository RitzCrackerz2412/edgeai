/**
 * Prediction & validation automation pipeline.
 *
 * fetchAndPredict(sport, date) — fetches upcoming games from ESPN/providers,
 * runs the prediction engine, logs or stores results.
 *
 * validateCompleted(sport, date) — fetches final scores, matches stored
 * predictions, computes per-game accuracy metrics.
 *
 * Both functions return a result summary and never throw — errors are collected
 * and returned in the `errors` array.
 */

import { getProviders } from '@/lib/providers';
import { getDb } from '@/lib/db/client';
import type { RawGame } from '@/lib/providers/types';
import type { Sport } from '@/lib/types';
import { MOCK_GAMES } from '@/lib/mockData';

export interface PipelineResult {
  sport:                 Sport;
  date:                  string;
  gamesFound:            number;
  predictionsGenerated:  number;
  errors:                string[];
  durationMs:            number;
}

export interface ValidationSummary {
  sport:           Sport;
  date:            string;
  gamesValidated:  number;
  correct:         number;
  accuracy:        number;
  errors:          string[];
  durationMs:      number;
}

// ── Prediction pipeline ────────────────────────────────────────────────────────

export async function fetchAndPredict(
  sport: Sport,
  date = new Date().toISOString().split('T')[0],
): Promise<PipelineResult> {
  const start = Date.now();
  const errors: string[] = [];
  let predictionsGenerated = 0;

  let games: RawGame[] = [];
  try {
    games = await getProviders().sports.getGames(sport, date);
  } catch (err) {
    errors.push(`getGames failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  const upcoming = games.filter(g => g.status === 'scheduled');

  for (const rawGame of upcoming) {
    try {
      await generateAndStore(rawGame);
      predictionsGenerated++;
    } catch (err) {
      errors.push(`Prediction failed (${rawGame.id}): ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { sport, date, gamesFound: games.length, predictionsGenerated, errors, durationMs: Date.now() - start };
}

async function generateAndStore(rawGame: RawGame): Promise<void> {
  const { runPrediction } = await import('@/lib/engine');

  // Match incoming raw game to a mock game by team name for the prediction engine.
  // When live team data is available in the DB, this lookup is replaced with a DB query.
  const mockGame = MOCK_GAMES.find(
    g =>
      g.homeTeam.name === rawGame.homeTeamName ||
      g.awayTeam.name === rawGame.awayTeamName,
  );

  if (!mockGame) return;

  const result = await runPrediction(mockGame);
  const { ensemble } = result;

  const homeIsWinner = ensemble.homeWinProbability >= ensemble.awayWinProbability;
  const winner       = homeIsWinner ? mockGame.homeTeam.name : mockGame.awayTeam.name;
  const winProb      = Math.round(Math.max(ensemble.homeWinProbability, ensemble.awayWinProbability) * 100);
  const confidence   = Math.round(ensemble.confidence * 100);
  const homeScore    = Math.round(ensemble.expectedHomeScore ?? 0);
  const awayScore    = Math.round(ensemble.expectedAwayScore ?? 0);
  const margin       = Math.round(Math.abs(ensemble.expectedMargin ?? homeScore - awayScore));
  const upsetProb    = Math.round(Math.min(ensemble.homeWinProbability, ensemble.awayWinProbability) * 100);

  const db = await getDb();
  if (db) {
    await db.prediction.create({
      data: {
        gameId:             rawGame.id,
        modelVersion:       'v1.1.0',
        winner,
        winProbability:     winProb,
        confidence,
        predictedHomeScore: homeScore,
        predictedAwayScore: awayScore,
        expectedMargin:     margin,
        upsetProbability:   upsetProb,
        factors:            ensemble.featureContributions.slice(0, 6).map(fc => ({
          label:       fc.featureLabel,
          value:       Math.round(fc.probabilityDelta * 100) / 100,
          direction:   fc.direction,
        })),
        featureValues: Object.fromEntries(
          ensemble.featureContributions.map(fc => [fc.featureName, fc.featureValue]),
        ),
      },
    }).catch((e: Error) => console.error('[Pipeline] DB write failed:', e.message));
  } else if (process.env.NODE_ENV !== 'production') {
    console.log('[Pipeline] Prediction', {
      game:       `${rawGame.homeTeamName} vs ${rawGame.awayTeamName}`,
      date:       rawGame.scheduledAt,
      winner,
      confidence,
    });
  }
}

// ── Validation pipeline ────────────────────────────────────────────────────────

export async function validateCompleted(
  sport: Sport,
  date = new Date(Date.now() - 86_400_000).toISOString().split('T')[0],
): Promise<ValidationSummary> {
  const start = Date.now();
  const errors: string[] = [];
  let gamesValidated = 0;
  let correct = 0;

  let games: RawGame[] = [];
  try {
    games = await getProviders().sports.getGames(sport, date);
  } catch (err) {
    errors.push(`getGames failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  const completed = games.filter(g => g.status === 'closed');

  for (const game of completed) {
    try {
      const isCorrect = await validate(game);
      if (isCorrect !== null) {
        gamesValidated++;
        if (isCorrect) correct++;
      }
    } catch (err) {
      errors.push(`Validate failed (${game.id}): ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  const accuracy = gamesValidated > 0 ? Math.round((correct / gamesValidated) * 1000) / 10 : 0;

  return { sport, date, gamesValidated, correct, accuracy, errors, durationMs: Date.now() - start };
}

async function validate(game: RawGame): Promise<boolean | null> {
  if (game.homeScore === undefined || game.awayScore === undefined) return null;

  const actualWinner = game.homeScore > game.awayScore
    ? game.homeTeamName
    : game.awayTeamName;

  const db = await getDb();

  if (db) {
    const prediction = await db.prediction.findFirst({
      where: { gameId: game.id },
      orderBy: { createdAt: 'desc' },
    }).catch(() => null);

    if (!prediction) return null;

    const correct = prediction.winner === actualWinner;
    const brierScore = Math.pow(prediction.winProbability / 100 - (correct ? 1 : 0), 2);
    const p = Math.max(0.001, Math.min(0.999, prediction.winProbability / 100));
    const o = correct ? 1 : 0;
    const logLoss = -(o * Math.log(p) + (1 - o) * Math.log(1 - p));
    const predictedMargin = prediction.predictedHomeScore - prediction.predictedAwayScore;
    const actualMargin = game.homeScore - (game.awayScore ?? 0);

    await db.validationResult.create({
      data: {
        predictionId:  prediction.id,
        gameId:        game.id,
        sport:         game.sport,
        correct,
        rawProbability: prediction.winProbability,
        actualOutcome: correct ? 1 : 0,
        brierScore,
        logLoss,
        marginError: Math.abs(predictedMargin - actualMargin),
        validatedAt: new Date(),
      },
    }).catch((e: Error) => console.error('[Validate] DB write failed:', e.message));

    return correct;
  }

  // Without DB, fall back to mock prediction comparison
  const mockGame = MOCK_GAMES.find(
    g => g.homeTeam.name === game.homeTeamName || g.awayTeam.name === game.awayTeamName,
  );
  if (!mockGame) return null;

  const correct = mockGame.prediction.winner === actualWinner;
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Validate]', { game: game.id, predicted: mockGame.prediction.winner, actual: actualWinner, correct });
  }
  return correct;
}

// ── Batch helpers ─────────────────────────────────────────────────────────────

const SPORTS: Sport[] = ['NFL', 'NBA', 'MLB', 'NHL'];

export async function runPredictionBatch(date?: string): Promise<PipelineResult[]> {
  return Promise.all(SPORTS.map(s => fetchAndPredict(s, date)));
}

export async function runValidationBatch(date?: string): Promise<ValidationSummary[]> {
  return Promise.all(SPORTS.map(s => validateCompleted(s, date)));
}
