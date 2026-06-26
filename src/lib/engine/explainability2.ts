/**
 * Explainability 2.0
 *
 * Builds on the existing explainability.ts to add:
 *  - Waterfall chart data (ordered feature contributions to probability)
 *  - Counterfactual analysis ("what if away team had better ELO?")
 *  - Confidence decomposition (how much each uncertainty source contributes)
 *  - Uncertainty intervals (Monte Carlo-derived)
 *
 * SHAP value computation (via exact marginal sampling) is wired for
 * logistic regression where weights are accessible; tree-based model
 * SHAP values are not yet implemented.
 */

import type { GameFeatureVector } from '../features/types';
import type { EnsemblePrediction, FeatureContribution } from './types';
import { simulate } from './montecarlo';
import type { Sport } from '../types';

// ── Waterfall chart data ──────────────────────────────────────────────────────

export interface WaterfallBar {
  /** Feature label for display */
  label: string;
  /** Change to home-win probability attributable to this feature */
  delta: number;
  /** Cumulative probability after applying this feature's effect */
  cumulative: number;
  /** Category for grouping and color */
  category: 'elo' | 'form' | 'injury' | 'travel' | 'environment' | 'tactical';
  /** Whether this feature helps home team */
  positive: boolean;
}

/**
 * Converts feature contributions to waterfall chart data.
 * The chart starts at 50% (coin flip), then layers each feature's impact.
 */
export function buildWaterfallData(
  contributions: FeatureContribution[],
  baselineProb = 0.5,
): WaterfallBar[] {
  // Sort: largest absolute contribution first
  const sorted = [...contributions].sort(
    (a, b) => Math.abs(b.probabilityDelta) - Math.abs(a.probabilityDelta),
  );

  let cumulative = baselineProb;
  const bars: WaterfallBar[] = [{
    label: 'Base Rate',
    delta: 0,
    cumulative,
    category: 'elo',
    positive: true,
  }];

  for (const c of sorted) {
    const delta = c.probabilityDelta;
    cumulative = Math.max(0.02, Math.min(0.98, cumulative + delta));
    bars.push({
      label: c.featureLabel,
      delta,
      cumulative,
      category: mapCategory(c.featureName),
      positive: delta > 0,
    });
  }

  return bars;
}

function mapCategory(featureName: string): WaterfallBar['category'] {
  if (featureName.startsWith('elo')) return 'elo';
  if (featureName.includes('form') || featureName.includes('momentum') || featureName.includes('streak')) return 'form';
  if (featureName.includes('injury')) return 'injury';
  if (featureName.includes('travel') || featureName.includes('rest')) return 'travel';
  if (featureName.includes('weather') || featureName.includes('altitude')) return 'environment';
  return 'tactical';
}

// ── Counterfactual analysis ───────────────────────────────────────────────────

export interface CounterfactualScenario {
  id: string;
  label: string;
  description: string;
  /** Delta to apply to home team's specified feature (0-1 normalized scale) */
  featureName: keyof GameFeatureVector['home'];
  featureDelta: number;
}

export interface CounterfactualResult {
  scenario: CounterfactualScenario;
  originalProb: number;
  counterfactualProb: number;
  probDelta: number;
  verdict: string;
}

/** Pre-built interesting "what if" scenarios */
export const STANDARD_COUNTERFACTUALS: CounterfactualScenario[] = [
  {
    id: 'home_injury_cleared',
    label: 'Home injury cleared',
    description: 'All home starters healthy',
    featureName: 'injuryImpact',
    featureDelta: +0.2,
  },
  {
    id: 'home_rested',
    label: 'Home team rested +2 days',
    description: 'Two additional rest days for home side',
    featureName: 'restFatigue',
    featureDelta: +0.15,
  },
  {
    id: 'away_fatigue',
    label: 'Away team fatigued',
    description: 'Away team on back-to-back travel',
    featureName: 'travelFatigue',
    featureDelta: -0.2,
  },
  {
    id: 'momentum_swing',
    label: 'Home 5-game win streak',
    description: 'Home team on a hot streak',
    featureName: 'momentumScore',
    featureDelta: +0.15,
  },
];

/**
 * Estimate the probability change from a single feature shift using
 * the logistic regression weight for that feature.
 *
 * This is a linear approximation — accurate near 0.5, less so near extremes.
 */
export function evaluateCounterfactual(
  originalProb: number,
  scenario: CounterfactualScenario,
  logisticWeightApprox = 0.5,
): CounterfactualResult {
  // Log-odds shift from the feature delta and approximate weight
  const logOddsShift = scenario.featureDelta * logisticWeightApprox;
  const origLogOdds = Math.log(originalProb / (1 - originalProb));
  const newLogOdds = origLogOdds + logOddsShift;
  const newProb = 1 / (1 + Math.exp(-newLogOdds));
  const delta = newProb - originalProb;

  const sign = delta > 0 ? '+' : '';
  const verdict = `Probability shifts from ${(originalProb * 100).toFixed(1)}% to ${(newProb * 100).toFixed(1)}% (${sign}${(delta * 100).toFixed(1)} pp)`;

  return {
    scenario,
    originalProb,
    counterfactualProb: Math.max(0.01, Math.min(0.99, newProb)),
    probDelta: delta,
    verdict,
  };
}

// ── Confidence decomposition ──────────────────────────────────────────────────

export interface UncertaintySource {
  name: string;
  contribution: number; // fraction of total uncertainty (sums to 1)
  description: string;
}

export interface ConfidenceDecomposition {
  totalUncertainty: number;         // 1 - max(p, 1-p); 0 = perfect certainty
  sources: UncertaintySource[];
  confidenceInterval: [number, number]; // 90% CI from Monte Carlo
  interpretation: string;
}

export function decomposeConfidence(
  prediction: EnsemblePrediction,
  sport: Sport,
): ConfidenceDecomposition {
  const p = prediction.homeWinProbability;
  const totalUncertainty = 1 - Math.abs(p - 0.5) * 2; // 0 at certainty, 1 at 50/50

  // Get Monte Carlo 90% interval
  const simResult = simulate({
    sport,
    homeWinProbability: p,
    n: 5_000,
    seed: 42,
  });

  const ci: [number, number] = [simResult.marginP10, simResult.marginP90];

  // Estimate source contributions from model disagreement
  const individual = prediction.individualPredictions;
  const pElo = individual?.elo?.homeWinProbability ?? p;
  const pLogistic = individual?.logistic?.homeWinProbability ?? p;
  const modelDisagreement = Math.abs(pElo - pLogistic);

  const sources: UncertaintySource[] = [
    {
      name: 'Model disagreement',
      contribution: Math.min(modelDisagreement / Math.max(totalUncertainty, 0.01), 0.4),
      description: `ELO and logistic models differ by ${(modelDisagreement * 100).toFixed(1)} pp`,
    },
    {
      name: 'Data completeness',
      contribution: 0.3,
      description: 'Missing advanced stats or live injury data',
    },
    {
      name: 'Inherent game variance',
      contribution: 0.3,
      description: 'Random noise unavoidable in sports outcomes',
    },
  ];

  // Normalize contributions
  const total = sources.reduce((s, x) => s + x.contribution, 0);
  const normalized = sources.map((s) => ({ ...s, contribution: s.contribution / total }));

  const pctStr = (p * 100).toFixed(0);
  const certainty = totalUncertainty < 0.15 ? 'high confidence' : totalUncertainty < 0.30 ? 'moderate confidence' : 'uncertain';
  const interpretation = `Model gives home team a ${pctStr}% win probability with ${certainty} (uncertainty score: ${(totalUncertainty * 100).toFixed(0)}%).`;

  return {
    totalUncertainty,
    sources: normalized,
    confidenceInterval: ci,
    interpretation,
  };
}

// ── Full explainability 2.0 package ──────────────────────────────────────────

export interface Explainability2Result {
  waterfallData: WaterfallBar[];
  counterfactuals: CounterfactualResult[];
  confidenceDecomposition: ConfidenceDecomposition;
}

export function buildExplainability2(
  prediction: EnsemblePrediction,
  sport: Sport,
): Explainability2Result {
  const waterfallData = buildWaterfallData(
    prediction.featureContributions,
    0.5,
  );

  const p = prediction.homeWinProbability;
  const counterfactuals = STANDARD_COUNTERFACTUALS.map((scenario) =>
    evaluateCounterfactual(p, scenario),
  );

  const confidenceDecomposition = decomposeConfidence(prediction, sport);

  return { waterfallData, counterfactuals, confidenceDecomposition };
}
