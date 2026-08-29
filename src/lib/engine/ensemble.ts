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
import type { Sport } from '../types';
import { eloModel }       from './elo';
import { logisticModel }  from './logistic';
import { gbdtModel }      from './gbdt';
import { eloCalibrator, logisticCalibrator, ensembleCalibrator } from './calibration';
import { clamp } from '../features/normalize';
import { weightStore, type ModelKey } from './weights';

// ── Logit-space pooling helpers ───────────────────────────────────────────────
//
// Averaging probabilities linearly biases the pool toward 0.5 and is
// dominated by log-odds (geometric) pooling for log-loss. All blending
// below happens in logit space.

function logit(p: number): number {
  const q = clamp(p, 1e-6, 1 - 1e-6);
  return Math.log(q / (1 - q));
}
function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/** Registry model names → dynamic weight-store keys */
const MODEL_KEY: Record<string, ModelKey> = {
  ELO: 'elo',
  LogisticRegression: 'logistic',
  GBDT: 'gbt',
};

/** Weight of the vig-free market signal when odds are available (logit blend). */
const MARKET_ANCHOR_WEIGHT = 0.12;

// ── Model-type selection ──────────────────────────────────────────────────────
//
// Set MODEL_TYPE=gbdt in .env.local (or Vercel env vars) to switch the
// secondary model from Logistic Regression to GBDT for A/B comparison.
// Defaults to 'logistic' so production is never silently changed.

const MODEL_TYPE = (process.env.MODEL_TYPE ?? 'logistic') as 'logistic' | 'gbdt';

// ── Model registry ────────────────────────────────────────────────────────────

interface ModelEntry {
  model: PredictionModel;
  weight: number;
  enabled: boolean;
}

function buildRegistry(): Record<string, ModelEntry> {
  const useGBDT = MODEL_TYPE === 'gbdt';
  return {
    ELO: {
      model: eloModel,
      weight: 0.35,
      enabled: true,
    },
    LogisticRegression: {
      model: logisticModel,
      weight: useGBDT ? 0 : 0.65,
      enabled: !useGBDT,
    },
    GBDT: {
      model: gbdtModel,
      weight: useGBDT ? 0.65 : 0,
      enabled: useGBDT,
    },
  };
}

const MODEL_REGISTRY = buildRegistry();

// ── Ensemble calibration ──────────────────────────────────────────────────────

function applyCalibration(modelName: string, rawProb: number): number {
  switch (modelName) {
    case 'ELO':                return eloCalibrator.calibrate(rawProb);
    case 'LogisticRegression': return logisticCalibrator.calibrate(rawProb);
    case 'GBDT':               return logisticCalibrator.calibrate(rawProb); // reuse LR calibrator until GBDT-specific one is fitted
    default:                   return rawProb;
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

    // ── Per-sport dynamic weighting ─────────────────────────────────────────
    // Inverse-Brier learned weights replace the static registry weights once
    // a sport has ≥20 resolved games per model. Falls back to registry
    // weights for models the store has no signal for.
    const dynamic = weightStore.getWeights(features.meta.sport as Sport);
    const withDynamic = results.map(r => {
      const key = MODEL_KEY[r.name];
      const dw = key ? dynamic[key] : 0;
      return { ...r, weight: dw > 0 ? dw : r.weight };
    });

    const totalWeight = withDynamic.reduce((s, r) => s + r.weight, 0);
    const normalizedWeights = Object.fromEntries(
      withDynamic.map(r => [r.name, r.weight / Math.max(totalWeight, 1e-9)]),
    );

    // ── Log-odds pooling of calibrated probabilities ────────────────────────
    let pooledLogit = 0;
    let confidence  = 0;
    const individualPredictions: Record<string, ModelPrediction> = {};
    const modelWeights: Record<string, number> = {};
    const memberProbs: number[] = [];

    for (const { name, pred } of withDynamic) {
      const w = normalizedWeights[name] ?? 0;
      pooledLogit += w * logit(pred.homeWinProbability);
      confidence  += w * pred.confidence;
      individualPredictions[name] = pred;
      modelWeights[name] = w;
      memberProbs.push(pred.homeWinProbability);
    }

    // ── Market anchor — one input among many, models stay primary ───────────
    // When vig-free odds exist, nudge the pooled logit toward the market at
    // low fixed weight. Never replaces the statistical estimate.
    if (features.marketImpliedHomeProb !== undefined) {
      pooledLogit =
        (1 - MARKET_ANCHOR_WEIGHT) * pooledLogit +
        MARKET_ANCHOR_WEIGHT * logit(features.marketImpliedHomeProb);
    }

    // Two-way (home-vs-not-home) probability from the pool, calibrated
    // BEFORE the draw split so home + draw + away always sums to 1.
    const rawTwoWay = clamp(sigmoid(pooledLogit), 0.05, 0.95);
    const calTwoWay = clamp(ensembleCalibrator.calibrate(rawTwoWay), 0.05, 0.95);

    // ── Draw model — Davidson-style, soccer only ────────────────────────────
    // Draw likelihood peaks for evenly-matched sides (~28% at even odds,
    // consistent with top-league base rates) and decays with the logit gap.
    let drawProb = 0;
    if (features.meta.sport === 'Soccer') {
      const gap = Math.abs(logit(calTwoWay));
      drawProb = clamp(0.28 * Math.exp(-(gap * gap) / 2.42), 0.04, 0.32);
    }
    const homeWinProb = clamp(calTwoWay * (1 - drawProb), 0.05, 0.95);
    const awayWinProb = Math.max(1 - homeWinProb - drawProb, 0.02);

    // ── Disagreement-aware confidence ───────────────────────────────────────
    // When members disagree, the pooled point estimate is less trustworthy:
    // shrink stated confidence by up to 35% proportional to member std-dev.
    if (memberProbs.length > 1) {
      const mean = memberProbs.reduce((s, p) => s + p, 0) / memberProbs.length;
      const sd = Math.sqrt(memberProbs.reduce((s, p) => s + (p - mean) ** 2, 0) / memberProbs.length);
      confidence *= 1 - Math.min(sd * 2.2, 0.35);
    }

    // Merge feature explanations
    const merged = mergeContributions(individualPredictions, normalizedWeights);

    // Estimate scores from ELO-predicted margin + base rates
    const eloMar = features.derived.eloDiff / 20; // rough margin proxy
    const expectedMargin   = eloMar * (homeWinProb - 0.5) * 2; // scale by confidence

    return {
      homeWinProbability:    homeWinProb,
      awayWinProbability:    awayWinProb,
      drawProbability:       drawProb,
      rawHomeWinProbability: rawTwoWay,
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
