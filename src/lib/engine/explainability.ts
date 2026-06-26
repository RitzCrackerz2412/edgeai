/**
 * Model explainability module.
 *
 * Provides human-readable explanations for predictions:
 *  - Feature importance ranking (from logistic weights × feature values)
 *  - Natural language factor summaries
 *  - Counterfactual scenarios ("what if X were different?")
 *  - SHAP-ready architecture (shapValues() placeholder for future GBT/DNN)
 *
 * The core insight: for logistic regression, the contribution of feature i
 * to the log-odds is simply weight_i × value_i. Converting this back to
 * probability space gives an interpretable "delta probability" for each factor.
 */

import type { FeatureContribution, ModelPrediction } from './types';
import type { GameFeatureVector } from '../features/types';
import type { Game, PredictionFactor } from '../types';
import { clamp } from '../features/normalize';

// ── Factor categories ─────────────────────────────────────────────────────────

export type FactorCategory =
  | 'rating'
  | 'form'
  | 'home_field'
  | 'injury'
  | 'environment'
  | 'schedule';

const CATEGORY_MAP: Record<string, FactorCategory> = {
  elo_diff:          'rating',
  eloDiffNorm:       'rating',
  offRatingDiff:     'rating',
  defRatingDiff:     'rating',
  formDiff:          'form',
  momentumDiff:      'form',
  home_advantage:    'home_field',
  homeAdvantage:     'home_field',
  injuryAdvantage:   'injury',
  injury_differential: 'injury',
  travelPenalty:     'environment',
  travel_fatigue:    'environment',
  restDiffNorm:      'schedule',
  rest_advantage:    'schedule',
  sosDiff:           'schedule',
  weatherMod:        'environment',
};

export function categorize(featureName: string): FactorCategory {
  return CATEGORY_MAP[featureName] ?? 'rating';
}

// ── Top contributors ──────────────────────────────────────────────────────────

export interface ExplainabilityResult {
  topPositive: FeatureContribution[];   // top 3 factors favoring home team
  topNegative: FeatureContribution[];   // top 3 factors favoring away team
  categoryBreakdown: CategoryBreakdown[];
  upsetRisk: 'low' | 'medium' | 'high';
  upsetRiskPct: number;
  naturalLanguageSummary: string;
}

export interface CategoryBreakdown {
  category: FactorCategory;
  label: string;
  netContribution: number; // positive = favors home
  percentageOfTotal: number;
}

const CATEGORY_LABELS: Record<FactorCategory, string> = {
  rating:     'Team Ratings',
  form:       'Recent Form',
  home_field: 'Home Field',
  injury:     'Injury Report',
  environment: 'Environment',
  schedule:   'Schedule',
};

export function explainPrediction(
  prediction: ModelPrediction,
  features: GameFeatureVector,
): ExplainabilityResult {
  const contribs = prediction.featureContributions;

  // Sort positive vs negative contributors
  const sorted = [...contribs].sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
  const topPositive = sorted.filter(c => c.direction === 'positive').slice(0, 3);
  const topNegative = sorted.filter(c => c.direction === 'negative').slice(0, 3);

  // Category breakdown
  const catTotals: Partial<Record<FactorCategory, number>> = {};
  const catAbs:    Partial<Record<FactorCategory, number>> = {};

  for (const c of contribs) {
    const cat = categorize(c.featureName);
    catTotals[cat] = (catTotals[cat] ?? 0) + c.contribution;
    catAbs[cat]    = (catAbs[cat]    ?? 0) + Math.abs(c.contribution);
  }

  const totalAbsContrib = Object.values(catAbs).reduce((s, v) => s + (v ?? 0), 0);

  const categoryBreakdown: CategoryBreakdown[] = (Object.keys(catTotals) as FactorCategory[]).map(cat => ({
    category: cat,
    label: CATEGORY_LABELS[cat],
    netContribution: catTotals[cat] ?? 0,
    percentageOfTotal: totalAbsContrib > 0 ? ((catAbs[cat] ?? 0) / totalAbsContrib) * 100 : 0,
  })).sort((a, b) => Math.abs(b.netContribution) - Math.abs(a.netContribution));

  // Upset risk
  const awayWinProb = prediction.awayWinProbability;
  const upsetRiskPct = Math.round(awayWinProb * 100);
  const upsetRisk: 'low' | 'medium' | 'high' =
    awayWinProb < 0.25 ? 'low' :
    awayWinProb < 0.40 ? 'medium' : 'high';

  // Natural language summary (concise 1-sentence)
  const homeWinPct = Math.round(prediction.homeWinProbability * 100);
  const topFactor  = topPositive[0]?.featureLabel ?? 'team strength';
  const topRisk    = topNegative[0]?.featureLabel ?? 'opponent quality';
  const naturalLanguageSummary =
    `Home team is a ${homeWinPct}% favorite driven by ${topFactor.toLowerCase()}, ` +
    `with ${topRisk.toLowerCase()} as the primary risk factor.`;

  return {
    topPositive,
    topNegative,
    categoryBreakdown,
    upsetRisk,
    upsetRiskPct,
    naturalLanguageSummary,
  };
}

// ── Convert engine output to legacy PredictionFactor format ──────────────────
//
// This preserves backward compatibility with the existing frontend components
// that render factors as { label, positive, weight, detail }.

export function toPredictionFactors(
  contributions: FeatureContribution[],
  homeName: string,
  awayName: string,
): PredictionFactor[] {
  return contributions
    .filter(c => Math.abs(c.percentageOfTotal) > 2) // exclude trivial factors
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
    .slice(0, 8)
    .map(c => ({
      label: c.featureLabel,
      positive: c.direction === 'positive',
      weight: parseFloat(Math.abs(c.probabilityDelta * 100).toFixed(1)),
      detail: buildDetail(c, homeName, awayName),
    }));
}

function buildDetail(c: FeatureContribution, homeName: string, awayName: string): string {
  const pct = Math.round(Math.abs(c.probabilityDelta * 100));

  switch (c.featureName) {
    case 'elo_diff':
    case 'eloDiffNorm':
      return c.direction === 'positive'
        ? `${homeName} has a ${Math.round(Math.abs(c.featureValue * 400))}-point ELO advantage`
        : `${awayName} holds a ${Math.round(Math.abs(c.featureValue * 400))}-point ELO lead`;

    case 'home_advantage':
    case 'homeAdvantage':
      return `Historical home-field effect worth ~${pct}% win probability`;

    case 'formDiff':
      return c.direction === 'positive'
        ? `${homeName} is in better recent form (win rate differential)`
        : `${awayName} has been hotter recently`;

    case 'injuryAdvantage':
    case 'injury_differential':
      return c.direction === 'positive'
        ? `${homeName} has a healthier roster based on injury reports`
        : `${awayName} has injury-list advantage`;

    case 'travelPenalty':
    case 'travel_fatigue':
      return `${awayName} traveled ${Math.round(c.featureValue * 15_000)} km — potential fatigue`;

    case 'restDiffNorm':
    case 'rest_advantage':
      return c.direction === 'positive'
        ? `${homeName} had more rest days before this game`
        : `${awayName} is better rested`;

    default:
      return `Contributes ~${pct}% to win probability estimate`;
  }
}

// ── SHAP-ready architecture (placeholder) ─────────────────────────────────────
//
// SHAP (SHapley Additive exPlanations) requires model-specific integration.
// For logistic regression, contributions above are already SHAP-equivalent.
// For GBT/neural networks, this would call the SHAP library.

export interface ShapValues {
  featureName: string;
  shapValue: number;      // additive contribution to final prediction
  baseValue: number;      // expected model output (marginal prediction)
}

export function computeShapValues(
  _features: GameFeatureVector,
  _prediction: ModelPrediction,
): ShapValues[] {
  // Tree-SHAP (GBT) and kernel-SHAP (neural nets) not yet implemented.
  // For logistic regression, SHAP values equal the feature contributions above.
  throw new Error('SHAP values require GBT/neural model — use featureContributions for logistic regression');
}
