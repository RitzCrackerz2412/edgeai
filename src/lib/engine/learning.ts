/**
 * Continuous learning pipeline.
 *
 * After a game resolves:
 *  1. Fetch/receive the final box score
 *  2. Update ELO ratings from the result
 *  3. Add calibration sample to the stores
 *  4. Update dynamic model weights
 *  5. Trigger model retraining if threshold met
 *  6. Archive a model snapshot for rollback
 *
 * No DB or scheduler is implemented yet — this module manages
 * in-memory state and exposes functions that API routes call.
 */

import type { Sport } from '../types';
import { eloModel } from './elo';
import {
  calibrationStore,
  eloCalibrator,
  logisticCalibrator,
  ensembleCalibrator,
} from './calibration';
import { weightStore } from './weights';
import type { ValidationRecord } from './types';

// ── Model version archive ─────────────────────────────────────────────────────

export interface ModelSnapshot {
  version: number;
  timestamp: string;
  sport?: Sport;
  reason: string;
  metrics: {
    brierScore?: number;
    accuracy?: number;
    sampleCount: number;
  };
}

class ModelVersionStore {
  private snapshots: ModelSnapshot[] = [];
  private currentVersion = 1;

  archive(reason: string, sport?: Sport, metrics?: Partial<ModelSnapshot['metrics']>): ModelSnapshot {
    const allSamples = calibrationStore.all();
    const snapshot: ModelSnapshot = {
      version: this.currentVersion++,
      timestamp: new Date().toISOString(),
      sport,
      reason,
      metrics: {
        sampleCount: allSamples.length,
        ...metrics,
      },
    };
    this.snapshots.push(snapshot);
    return snapshot;
  }

  list(): ModelSnapshot[] {
    return [...this.snapshots].reverse();
  }

  latest(): ModelSnapshot | null {
    return this.snapshots.length > 0
      ? this.snapshots[this.snapshots.length - 1]
      : null;
  }
}

export const modelVersionStore = new ModelVersionStore();

// ── Retraining trigger ────────────────────────────────────────────────────────

const RETRAIN_EVERY = 50; // recalibrate after every N new samples
let samplesSinceRetrain = 0;

function shouldRetrain(): boolean {
  return samplesSinceRetrain >= RETRAIN_EVERY;
}

/**
 * Performs a lightweight recalibration pass on all calibrators.
 * Full logistic regression retraining would happen here when more
 * training data infrastructure is in place.
 */
function retrain(sport?: Sport): void {
  const allSamples = calibrationStore.all();
  if (allSamples.length >= 10) {
    eloCalibrator.fit(allSamples);
    logisticCalibrator.fit(allSamples);
    ensembleCalibrator.fit(allSamples);
  }

  modelVersionStore.archive(
    `Automatic recalibration after ${RETRAIN_EVERY} new samples`,
    sport,
  );

  samplesSinceRetrain = 0;
}

// ── Post-game update pipeline ─────────────────────────────────────────────────

export interface PostGameData {
  gameId: string;
  sport: Sport;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  /** The stored prediction from before the game */
  storedPrediction?: ValidationRecord;
}

export interface LearningResult {
  eloUpdated: boolean;
  calibrationSampleAdded: boolean;
  weightsUpdated: boolean;
  retrainTriggered: boolean;
  modelVersion?: ModelSnapshot;
}

/**
 * Main entry point: call this after every game resolves.
 */
export function processPostGame(data: PostGameData): LearningResult {
  let retrainTriggered = false;
  let modelVersion: ModelSnapshot | undefined;

  // 1. Update ELO ratings
  eloModel.updateFromResult(
    data.homeTeamId,
    data.awayTeamId,
    data.homeScore,
    data.awayScore,
    data.sport,
  );

  // 2. Add calibration sample if we have a stored prediction
  let calibrationSampleAdded = false;
  if (data.storedPrediction) {
    const outcome: 0 | 1 = data.homeScore > data.awayScore ? 1 : 0;
    calibrationStore.add({
      rawProbability: data.storedPrediction.predictedHomeWinProbability,
      outcome,
      modelName: data.storedPrediction.modelName,
      gameId: data.gameId,
    });
    calibrationSampleAdded = true;
    samplesSinceRetrain++;

    // 3. Update dynamic model weights with Brier contribution
    const brierContrib = Math.pow(
      data.storedPrediction.predictedHomeWinProbability - outcome, 2,
    );
    weightStore.record(data.sport, 'elo', brierContrib);
    weightStore.record(data.sport, 'logistic', brierContrib);
  }

  // 4. Trigger retraining if threshold met
  if (shouldRetrain()) {
    retrain(data.sport);
    retrainTriggered = true;
    modelVersion = modelVersionStore.latest() ?? undefined;
  }

  return {
    eloUpdated: true,
    calibrationSampleAdded,
    weightsUpdated: calibrationSampleAdded,
    retrainTriggered,
    modelVersion,
  };
}

/**
 * Called at start of a new season — regresses ELO ratings toward mean
 * and archives a snapshot.
 */
export function startNewSeason(sport: Sport): ModelSnapshot {
  eloModel.regressToMean(sport);
  return modelVersionStore.archive(`New season regression to mean`, sport);
}

export function getLearningStatus(): {
  totalSamples: number;
  samplesSinceRetrain: number;
  nextRetrainIn: number;
  snapshots: ModelSnapshot[];
} {
  return {
    totalSamples: calibrationStore.all().length,
    samplesSinceRetrain,
    nextRetrainIn: Math.max(0, RETRAIN_EVERY - samplesSinceRetrain),
    snapshots: modelVersionStore.list(),
  };
}
