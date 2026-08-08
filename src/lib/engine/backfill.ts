/**
 * Historical backfill — seeds GBDT training samples from EXTENDED_HISTORY.
 *
 * Since we don't have the original feature vectors for historical games,
 * we reconstruct approximate vectors using the available signals:
 *
 *   - eloDiffNorm:   derived from the predicted win probability via logit
 *   - homeAdvantage: always 1.0 (constant)
 *   - formDiff:      estimated from margin size (larger = better form)
 *   - restDiffNorm:  0 (unknown for historical games)
 *   - offRatingDiff: estimated from score margin
 *   - defRatingDiff: estimated from score margin (inverse)
 *   - injuryAdvantage: 0 (unknown)
 *   - travelPenalty: 0 (unknown)
 *   - sosDiff:       0 (unknown)
 *   - momentumDiff:  0 (unknown)
 *
 * These are approximations — they give the model directional signal on
 * the most important features. Accuracy will improve as live game data
 * accumulates with full feature vectors.
 */

import { EXTENDED_HISTORY } from '../dashboardData';
import { seedGBDTSample } from './learning';
import { gbdtModel } from './gbdt';
import { persistGBDTSample, backfillSamplesExist } from '../db/gbdtSamples';

function logit(p: number): number {
  const clamped = Math.max(0.01, Math.min(0.99, p));
  return Math.log(clamped / (1 - clamped));
}

function buildBackfillFeatures(entry: typeof EXTENDED_HISTORY[number]): number[] {
  // Convert confidence (0-100) and direction to P(home wins)
  const confidenceFraction = entry.confidence / 100;
  const predictedHome = entry.homeTeam === entry.prediction;
  const pHome = predictedHome ? confidenceFraction : 1 - confidenceFraction;

  // ELO diff proxy: logit of pHome, scaled to [-2, 2]
  const eloDiffNorm = Math.max(-2, Math.min(2, logit(pHome) / 2));

  // Score margin as a proxy for offensive/defensive quality
  // margin > 0 means home won by that amount; negative = away won
  const margin = entry.margin ?? 0;
  const normalizedMargin = Math.max(-1, Math.min(1, margin / 20));

  return [
    eloDiffNorm,           // eloDiffNorm
    1.0,                   // homeAdvantage (constant)
    normalizedMargin * 0.5,// formDiff (proxy from actual margin)
    0,                     // restDiffNorm (unknown)
    normalizedMargin * 0.4,// offRatingDiff (proxy)
    normalizedMargin * 0.3,// defRatingDiff (proxy)
    0,                     // injuryAdvantage (unknown)
    0,                     // travelPenalty (unknown)
    0,                     // sosDiff (unknown)
    0,                     // momentumDiff (unknown)
  ];
}

export interface BackfillResult {
  seeded: number;
  skipped: number;
  alreadyExists: boolean;
  modelFitted: boolean;
}

export async function runBackfill(force = false): Promise<BackfillResult> {
  // Don't re-seed if backfill already ran (unless forced)
  if (!force && await backfillSamplesExist()) {
    return { seeded: 0, skipped: EXTENDED_HISTORY.length, alreadyExists: true, modelFitted: false };
  }

  let seeded = 0;
  let skipped = 0;

  for (const entry of EXTENDED_HISTORY) {
    // Outcome: 1 if home team actually won
    const homeTeamWon = entry.actual === entry.homeTeam;
    // Skip draws (soccer) — ambiguous outcome for binary classification
    if (entry.actual === 'Draw') { skipped++; continue; }

    const features = buildBackfillFeatures(entry);
    const outcome: 0 | 1 = homeTeamWon ? 1 : 0;

    seedGBDTSample(features, outcome);
    await persistGBDTSample(features, outcome, entry.id, entry.sport, 'backfill');
    seeded++;
  }

  // Fit the model immediately if we now have enough samples
  const { getGBDTSamples } = await import('./learning');
  const allSamples = getGBDTSamples();
  let modelFitted = false;
  if (allSamples.length >= 30) {
    gbdtModel.fit(allSamples);
    modelFitted = true;
  }

  return { seeded, skipped, alreadyExists: false, modelFitted };
}
