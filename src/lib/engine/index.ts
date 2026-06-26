/**
 * Prediction engine — public API.
 *
 * Usage:
 *   import { runPrediction, validateResult } from '@/lib/engine';
 *
 * runPrediction(game):
 *   Takes a Game object (from types.ts), extracts features, runs the ensemble
 *   model, calibrates output, and returns an EnginePrediction ready for display.
 *
 * runPredictionLive(game, providers):
 *   Same but enriches features with live API data first.
 *
 * validateResult(stored, result):
 *   Records a completed game result and updates calibration.
 *
 * toPrediction(output, game):
 *   Converts EnginePrediction back to the legacy Prediction type for the UI.
 */

import type { Game, Prediction } from '../types';
import type { DataProviders }    from '../providers/types';
import type { GameFeatureVector } from '../features/types';
import type { EnsemblePrediction } from './types';
import { extractFeatures, extractFeaturesLive } from '../features/pipeline';
import { eloModel }      from './elo';
import { ensembleModel } from './ensemble';
import { toPredictionFactors } from './explainability';
import { validatePrediction, type StoredPrediction, type GameResult, validationStore } from './validator';

export type { StoredPrediction, GameResult };

// ── Engine prediction output ──────────────────────────────────────────────────

export interface EnginePrediction {
  features: GameFeatureVector;
  ensemble: EnsemblePrediction;
}

// ── Seed ELO ratings from mock team data on first use ────────────────────────
//
// Once a database exists, this should be replaced with a DB query.

let eloSeeded = false;

async function ensureEloSeeded(game: Game): Promise<void> {
  if (eloSeeded) return;

  const { TEAM_DETAILS } = await import('../teamData');
  const teams = Object.values(TEAM_DETAILS).map(t => ({
    id: t.id,
    eloRating: t.eloRating ?? 1500,
  }));

  // Also include teams from this game in case they're not in TEAM_DETAILS
  teams.push(
    { id: game.homeTeam.id, eloRating: game.homeTeam.eloRating },
    { id: game.awayTeam.id, eloRating: game.awayTeam.eloRating },
  );

  eloModel.seed(teams);
  eloSeeded = true;
}

// ── Primary prediction function (uses mock/existing data) ─────────────────────

export async function runPrediction(game: Game): Promise<EnginePrediction> {
  await ensureEloSeeded(game);

  // Override ELO with current values from game data (fresher than TEAM_DETAILS)
  eloModel.setRating(game.homeTeam.id, game.homeTeam.eloRating);
  eloModel.setRating(game.awayTeam.id, game.awayTeam.eloRating);

  const features = extractFeatures(game);
  const ensemble = await ensembleModel.predict(features);

  return { features, ensemble };
}

// ── Live-enriched prediction ──────────────────────────────────────────────────

export async function runPredictionLive(
  game: Game,
  providers: DataProviders,
): Promise<EnginePrediction> {
  await ensureEloSeeded(game);

  eloModel.setRating(game.homeTeam.id, game.homeTeam.eloRating);
  eloModel.setRating(game.awayTeam.id, game.awayTeam.eloRating);

  const features = await extractFeaturesLive(game, providers);
  const ensemble = await ensembleModel.predict(features);

  return { features, ensemble };
}

// ── Post-game result recording ────────────────────────────────────────────────

export function recordResult(stored: StoredPrediction, result: GameResult) {
  const record = validatePrediction(stored, result);
  validationStore.add(record);

  // Update ELO ratings after each real game
  if (result.homeScore !== undefined && result.awayScore !== undefined) {
    eloModel.updateFromResult(
      result.gameId.split('-')[0] ?? 'unknown',
      result.gameId.split('-')[1] ?? 'unknown',
      result.homeScore,
      result.awayScore,
      result.sport,
    );
  }

  return record;
}

// ── Convert to legacy Prediction type (for frontend compatibility) ────────────
//
// The frontend Game.prediction field uses the existing Prediction interface
// from types.ts. This function maps engine output to that shape so no
// frontend component needs to change.

export function toPrediction(
  output: EnginePrediction,
  game: Game,
): Prediction {
  const { ensemble, features } = output;
  const home = game.homeTeam;
  const away = game.awayTeam;

  const homeWinPct = ensemble.homeWinProbability * 100;
  const awayWinPct = ensemble.awayWinProbability * 100;
  const predictedWinner = homeWinPct >= awayWinPct ? home.name : away.name;
  const winProb         = Math.max(homeWinPct, awayWinPct);
  const upsetProb       = Math.min(homeWinPct, awayWinPct);
  const confidence      = Math.round(ensemble.confidence * 100);

  // Score prediction (rough approximation from ELO margin proxy)
  const baseHomeScore = game.prediction.predictedScore.home; // use existing as baseline
  const baseAwayScore = game.prediction.predictedScore.away;
  const marginAdj     = (ensemble.expectedMargin ?? 0) - game.prediction.expectedMargin;
  const predHome      = Math.max(0, Math.round(baseHomeScore + marginAdj / 2));
  const predAway      = Math.max(0, Math.round(baseAwayScore - marginAdj / 2));

  const factors = toPredictionFactors(ensemble.featureContributions, home.name, away.name);

  return {
    winner:               predictedWinner,
    winProbability:       parseFloat(winProb.toFixed(1)),
    confidence,
    predictedScore:       { home: predHome, away: predAway },
    expectedMargin:       Math.abs(predHome - predAway),
    upsetProbability:     parseFloat(upsetProb.toFixed(1)),
    playerOfMatch:        game.prediction.playerOfMatch,
    highestImpactPlayer:  game.prediction.highestImpactPlayer,
    lowestConfidenceVar:  game.prediction.lowestConfidenceVar,
    factors:              factors.length > 0 ? factors : game.prediction.factors,
    gameFlow:             game.prediction.gameFlow,
    monteCarloWinRate:    ensemble.individualPredictions['ELO']
      ? ensemble.individualPredictions['ELO'].homeWinProbability * 100
      : game.prediction.monteCarloWinRate,
    bayesianProbability:  ensemble.individualPredictions['LogisticRegression']
      ? ensemble.individualPredictions['LogisticRegression'].homeWinProbability * 100
      : game.prediction.bayesianProbability,
  };
}

// ── Re-exports ────────────────────────────────────────────────────────────────

export { eloModel }         from './elo';
export { logisticModel }    from './logistic';
export { ensembleModel }    from './ensemble';
export { validationStore }  from './validator';
export { calibrationStore, brierScore, logLoss, calibrationCurve } from './calibration';
export { explainPrediction } from './explainability';
