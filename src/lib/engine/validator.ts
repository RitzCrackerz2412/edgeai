/**
 * Post-game prediction validator.
 *
 * After a game completes:
 *  1. Fetch the actual result (score, winner)
 *  2. Compare against stored prediction
 *  3. Compute accuracy metrics: correctness, margin error, Brier contribution
 *  4. Update calibration store so models improve over time
 */

import type { ValidationRecord } from './types';
import { calibrationStore } from './calibration';
import { clamp } from '../features/normalize';

// ── Result input ──────────────────────────────────────────────────────────────

export interface GameResult {
  gameId: string;
  sport: string;
  homeScore: number;
  awayScore: number;
}

// ── Stored prediction record (minimum required fields) ───────────────────────

export interface StoredPrediction {
  gameId: string;
  sport: string;
  modelName: string;
  homeWinProbability: number;  // calibrated
  predictedHomeScore?: number;
  predictedAwayScore?: number;
  predictedAt: string;
}

// ── Validation computation ────────────────────────────────────────────────────

export function validatePrediction(
  stored: StoredPrediction,
  result: GameResult,
): ValidationRecord {
  const homeWon    = result.homeScore > result.awayScore;
  const predicted  = stored.homeWinProbability;
  const outcome    = homeWon ? 1 : 0;

  const correct = homeWon === (predicted > 0.5);

  // Brier contribution: (predicted_prob - actual_outcome)^2
  const brierContribution = Math.pow(predicted - outcome, 2);

  // Log loss contribution
  const eps = 1e-15;
  const pCl = clamp(predicted, eps, 1 - eps);
  const logLossContribution = -(outcome * Math.log(pCl) + (1 - outcome) * Math.log(1 - pCl));

  // Margin error
  const actualMargin    = result.homeScore - result.awayScore;
  const predictedMargin = stored.predictedHomeScore !== undefined && stored.predictedAwayScore !== undefined
    ? stored.predictedHomeScore - stored.predictedAwayScore
    : (predicted - 0.5) * 20; // rough margin from probability if no score prediction

  const marginError = Math.abs(predictedMargin - actualMargin);

  // Score MAE (if score prediction was made)
  const scoreMAE = stored.predictedHomeScore !== undefined && stored.predictedAwayScore !== undefined
    ? (Math.abs(stored.predictedHomeScore - result.homeScore) +
       Math.abs(stored.predictedAwayScore - result.awayScore)) / 2
    : 0;

  // Confidence error
  const confidenceError = Math.abs((correct ? 100 : 0) - stored.homeWinProbability * 100);

  const record: ValidationRecord = {
    gameId:                    stored.gameId,
    sport:                     stored.sport,
    modelName:                 stored.modelName,
    predictedHomeWinProbability: predicted,
    actualHomeScore:           result.homeScore,
    actualAwayScore:           result.awayScore,
    predictedHomeScore:        stored.predictedHomeScore,
    predictedAwayScore:        stored.predictedAwayScore,
    homeWon,
    predictionCorrect:         correct,
    marginError,
    scoreMAE,
    brierContribution,
    logLossContribution,
    confidenceError,
    predictedAt:               stored.predictedAt,
    validatedAt:               new Date().toISOString(),
  };

  // Feed result to calibration store so Platt calibrators can retrain
  calibrationStore.add({
    rawProbability: predicted,
    outcome,
    modelName: stored.modelName,
    gameId: stored.gameId,
    // Weight recent games more heavily (decay over 90 days)
    weight: Math.exp(-daysSince(stored.predictedAt) / 90),
  });

  return record;
}

function daysSince(isoDate: string): number {
  return (Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24);
}

// ── In-memory validation history ──────────────────────────────────────────────
//
// In-memory store — replace with PostgreSQL queries via getDb() for persistence.

class ValidationStore {
  private records: ValidationRecord[] = [];

  add(record: ValidationRecord): void {
    this.records.push(record);
  }

  all(): ValidationRecord[] {
    return [...this.records];
  }

  forSport(sport: string): ValidationRecord[] {
    return this.records.filter(r => r.sport === sport);
  }

  forModel(modelName: string): ValidationRecord[] {
    return this.records.filter(r => r.modelName === modelName);
  }

  getAccuracy(sport?: string, modelName?: string): {
    accuracy: number;
    brierScore: number;
    logLoss: number;
    sampleCount: number;
  } {
    let records = [...this.records];
    if (sport)     records = records.filter(r => r.sport === sport);
    if (modelName) records = records.filter(r => r.modelName === modelName);

    if (records.length === 0) {
      return { accuracy: 0, brierScore: 0, logLoss: 0, sampleCount: 0 };
    }

    const accuracy   = records.filter(r => r.predictionCorrect).length / records.length;
    const brierScore = records.reduce((s, r) => s + r.brierContribution, 0) / records.length;
    const logLoss    = records.reduce((s, r) => s + r.logLossContribution, 0) / records.length;

    return { accuracy, brierScore, logLoss, sampleCount: records.length };
  }

  // Replay predictions: show what the model said vs what happened
  replay(gameId: string): ValidationRecord | null {
    return this.records.find(r => r.gameId === gameId) ?? null;
  }

  clear(): void {
    this.records = [];
  }
}

export const validationStore = new ValidationStore();
