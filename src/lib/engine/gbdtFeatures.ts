/**
 * Feature vector builder for the GBDT model.
 *
 * Uses the same 10 core features as the original logistic regression
 * (pre-context-signals) so the two models remain comparable.
 * Feature order is fixed — never reorder without retraining.
 */

import type { GameFeatureVector } from '../features/types';

export const GBDT_FEATURE_NAMES = [
  'eloDiffNorm',
  'homeAdvantage',
  'formDiff',
  'restDiffNorm',
  'offRatingDiff',
  'defRatingDiff',
  'injuryAdvantage',
  'travelPenalty',
  'sosDiff',
  'momentumDiff',
] as const;

export type GBDTFeatureName = typeof GBDT_FEATURE_NAMES[number];

export const GBDT_FEATURE_LABELS: Record<GBDTFeatureName, string> = {
  eloDiffNorm:     'ELO rating advantage',
  homeAdvantage:   'Home field advantage',
  formDiff:        'Recent form differential',
  restDiffNorm:    'Rest day advantage',
  offRatingDiff:   'Offensive rating edge',
  defRatingDiff:   'Defensive rating edge',
  injuryAdvantage: 'Injury report advantage',
  travelPenalty:   'Away travel fatigue',
  sosDiff:         'Strength of schedule diff',
  momentumDiff:    'Momentum differential',
};

/** Extract the fixed-order feature vector from a GameFeatureVector. */
export function buildGBDTFeatures(gfv: GameFeatureVector): number[] {
  const d = gfv.derived;
  return [
    d.eloDiffNormalized,                              // eloDiffNorm
    1.0,                                              // homeAdvantage constant
    d.formDiff,                                       // formDiff
    d.restAdvantage / 7,                              // restDiffNorm
    d.offRatingDiff,                                  // offRatingDiff
    d.defRatingDiff,                                  // defRatingDiff
    d.injuryAdvantage,                                // injuryAdvantage
    gfv.away.travelFatigue,                           // travelPenalty (away)
    gfv.home.strengthOfSchedule - gfv.away.strengthOfSchedule, // sosDiff
    gfv.home.momentumScore - gfv.away.momentumScore,  // momentumDiff
  ];
}

/** Convert a raw number[] (stored with a prediction) back to named features. */
export function featuresFromArray(arr: number[]): Record<GBDTFeatureName, number> {
  return Object.fromEntries(
    GBDT_FEATURE_NAMES.map((name, i) => [name, arr[i] ?? 0])
  ) as Record<GBDTFeatureName, number>;
}
