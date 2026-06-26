/**
 * Ensemble model — weighted combination of individual models.
 *
 * Currently supports:
 *  - ELO baseline (weight: 0.4 — robust with limited data)
 *  - Logistic Regression (weight: 0.6 — richer features)
 *
 * Placeholders for future additions:
 *  - GBT (Gradient Boosted Trees): set weight to 0 until trained
 *  - Neural network: set weight to 0 until trained
 *
 * Ensemble weighting strategy:
 *  Simple weighted average of calibrated win probabilities.
 *  More sophisticated stacking (meta-learner) can be added later.
 */

import type { GameFeatureVector } from '../features/types';
import type { EnsemblePrediction, ModelPrediction, FeatureContribution, PredictionModel } from './types';
import { eloModel }       from './elo';
import { logisticModel }  from './logistic';
import { eloCalibrator, logisticCalibrator, ensembleCalibrator } from './calibration';
import { clamp } from '../features/normalize';

// ── Model registry ────────────────────────────────────────────────────────────

interface ModelEntry {
  model: PredictionModel;
  weight: number;
  enabled: boolean;
}

const MODEL_REGISTRY: Record<string, ModelEntry> = {
  ELO: {
    model: eloModel,
    weight: 0.35,
    enabled: true,
  },
  LogisticRegression: {
    model: logisticModel,
    weight: 0.65,
    enabled: true,
  },
  GBT: {
    // GBT model — implement GradientBoostedTreesModel and set enabled=true
    // once trained on 500+ historical games; adjust weights accordingly.
    model: {
      name: 'GBT',
      version: 'placeholder',
      predict: async () => { throw new Error('GBT model not yet implemented'); },
    },
    weight: 0,
    enabled: false,
  },
};

// ── Ensemble calibration ──────────────────────────────────────────────────────

function applyCalibration(modelName: string, rawProb: number): number {
  switch (modelName) {
    case 'ELO':               return eloCalibrator.calibrate(rawProb);
    case 'LogisticRegression': return logisticCalibrator.calibrate(rawProb);
    default:                  return rawProb;
  }
}

// ── Merge feature contributions across models ─────────────────────────────────

function mergeContributions(
  predictions: Record<string, ModelPrediction>,
  weights: Record<string, number>,
): FeatureContribution[] {
  // Collect all unique feature names
  const featureMap = new Map<string, FeatureContribution>();

  for (const [modelName, pred] of Object.entries(predictions)) {
    const w = weights[modelName] ?? 0;
    for (const c of pred.featureContributions) {
      const existing = featureMap.get(c.featureName);
      if (!existing) {
        featureMap.set(c.featureName, { ...c, contribution: c.contribution * w, percentageOfTotal: 0 });
      } else {
        existing.contribution += c.contribution * w;
        existing.probabilityDelta += c.probabilityDelta * w;
      }
    }
  }

  const merged = Array.from(featureMap.values());

  // Recompute percentage of total
  const totalAbs = merged.reduce((s, c) => s + Math.abs(c.contribution), 0);
  for (const c of merged) {
    c.direction    = c.contribution > 0 ? 'positive' : 'negative';
    c.percentageOfTotal = totalAbs > 0 ? (Math.abs(c.contribution) / totalAbs) * 100 : 0;
  }

  return merged.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
}

// ── Ensemble model ────────────────────────────────────────────────────────────

export class EnsembleModel implements PredictionModel {
  readonly name = 'Ensemble';
  readonly version = '1.0.0';

  async predict(features: GameFeatureVector): Promise<EnsemblePrediction> {
    const enabled = Object.entries(MODEL_REGISTRY).filter(([, e]) => e.enabled);

    // Run all enabled models in parallel
    const results = await Promise.all(
      enabled.map(async ([name, entry]) => {
        const pred = await entry.model.predict(features);
        // Apply per-model Platt calibration
        const calibratedProb = applyCalibration(name, pred.rawHomeWinProbability);
        return {
          name,
          weight: entry.weight,
          pred: { ...pred, homeWinProbability: calibratedProb, awayWinProbability: 1 - calibratedProb - pred.drawProbability },
        };
      }),
    );

    // Normalize weights (in case some models are disabled)
    const totalWeight = results.reduce((s, r) => s + r.weight, 0);
    const normalizedWeights = Object.fromEntries(
      results.map(r => [r.name, r.weight / Math.max(totalWeight, 1e-9)]),
    );

    // Weighted average of calibrated probabilities
    let homeWinProb  = 0;
    let drawProb     = 0;
    let confidence   = 0;
    const individualPredictions: Record<string, ModelPrediction> = {};
    const modelWeights: Record<string, number> = {};

    for (const { name, pred, weight } of results) {
      const w = normalizedWeights[name] ?? 0;
      homeWinProb  += w * pred.homeWinProbability;
      drawProb     += w * pred.drawProbability;
      confidence   += w * pred.confidence;
      individualPredictions[name] = pred;
      modelWeights[name] = w;
    }

    homeWinProb = clamp(homeWinProb, 0.05, 0.95);
    drawProb    = clamp(drawProb, 0, 0.40);
    const awayWinProb = clamp(1 - homeWinProb - drawProb, 0.05, 0.90);

    // Apply ensemble-level Platt calibration
    const rawEnsembleProb = homeWinProb;
    const calibratedEnsemble = ensembleCalibrator.calibrate(rawEnsembleProb);

    // Merge feature explanations
    const merged = mergeContributions(individualPredictions, normalizedWeights);

    // Estimate scores from ELO-predicted margin + base rates
    const eloMar = features.derived.eloDiff / 20; // rough margin proxy
    const expectedMargin   = eloMar * (homeWinProb - 0.5) * 2; // scale by confidence

    return {
      homeWinProbability:    clamp(calibratedEnsemble, 0.05, 0.95),
      awayWinProbability:    awayWinProb,
      drawProbability:       drawProb,
      rawHomeWinProbability: rawEnsembleProb,
      confidence:            clamp(confidence, 0.3, 0.95),
      expectedMargin,
      featureContributions:  merged,
      modelName: this.name,
      modelVersion: this.version,
      computedAt: new Date().toISOString(),
      modelWeights,
      individualPredictions,
    };
  }
}

export const ensembleModel = new EnsembleModel();
