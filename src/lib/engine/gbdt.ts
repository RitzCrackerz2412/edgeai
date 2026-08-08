/**
 * Gradient Boosted Decision Trees — pure TypeScript implementation.
 *
 * Same algorithmic family as XGBoost/LightGBM. Uses depth-1 regression
 * stumps (optimal split on a single feature) as weak learners, iterated
 * via gradient descent on log-loss. No external dependencies; safe on
 * Vercel serverless (no WASM, no native binaries).
 *
 * Warm-start: when insufficient training data exists (<MIN_SAMPLES), the
 * model falls back to the LogisticRegressionModel so ensemble quality
 * never degrades during cold start.
 *
 * Training: call gbdtModel.fit(samples) whenever new game results accumulate.
 * Feature importances: call gbdtModel.featureImportances() for the admin page.
 */

import type { GameFeatureVector } from '../features/types';
import type { FeatureContribution, ModelPrediction, PredictionModel } from './types';
import { logisticModel } from './logistic';
import { buildGBDTFeatures, GBDT_FEATURE_NAMES, GBDT_FEATURE_LABELS } from './gbdtFeatures';

// ── Constants ─────────────────────────────────────────────────────────────────

const LEARNING_RATE  = 0.05;
const N_ESTIMATORS   = 120;
const MIN_SAMPLES    = 30;   // train only if we have at least this many samples
const MAX_LEAF_SIZE  = 2;    // min samples in each leaf of a stump

// ── Numerically stable sigmoid ────────────────────────────────────────────────

function sigmoid(x: number): number {
  if (x >= 0) {
    const e = Math.exp(-x);
    return 1 / (1 + e);
  }
  const e = Math.exp(x);
  return e / (1 + e);
}

// ── Decision stump (depth-1 regression tree) ──────────────────────────────────

interface Stump {
  featureIndex: number;
  threshold: number;
  leftValue:  number;   // mean pseudo-residual for samples ≤ threshold
  rightValue: number;   // mean pseudo-residual for samples > threshold
  splitGain:  number;   // MSE reduction — used for feature importance
}

function fitStump(X: number[][], residuals: number[]): Stump {
  const n        = X.length;
  const nFeats   = X[0].length;
  let bestGain   = -Infinity;
  let best: Stump = { featureIndex: 0, threshold: 0, leftValue: 0, rightValue: 0, splitGain: 0 };

  const totalMean = residuals.reduce((a, b) => a + b, 0) / n;
  const totalMSE  = residuals.reduce((s, r) => s + (r - totalMean) ** 2, 0);

  for (let f = 0; f < nFeats; f++) {
    // Collect unique thresholds for this feature (midpoints between sorted values)
    const vals = [...new Set(X.map(x => x[f]))].sort((a, b) => a - b);
    if (vals.length < 2) continue;

    for (let ti = 0; ti < vals.length - 1; ti++) {
      const threshold = (vals[ti] + vals[ti + 1]) / 2;

      const left: number[]  = [];
      const right: number[] = [];
      for (let i = 0; i < n; i++) {
        (X[i][f] <= threshold ? left : right).push(residuals[i]);
      }
      if (left.length < MAX_LEAF_SIZE || right.length < MAX_LEAF_SIZE) continue;

      const lMean = left.reduce((a, b) => a + b, 0) / left.length;
      const rMean = right.reduce((a, b) => a + b, 0) / right.length;

      const lMSE = left.reduce((s, v) => s + (v - lMean) ** 2, 0);
      const rMSE = right.reduce((s, v) => s + (v - rMean) ** 2, 0);
      const gain = totalMSE - lMSE - rMSE;

      if (gain > bestGain) {
        bestGain = gain;
        best = { featureIndex: f, threshold, leftValue: lMean, rightValue: rMean, splitGain: gain };
      }
    }
  }

  return best;
}

function applyStump(stump: Stump, x: number[]): number {
  return x[stump.featureIndex] <= stump.threshold ? stump.leftValue : stump.rightValue;
}

// ── Training sample ───────────────────────────────────────────────────────────

export interface GBDTTrainingSample {
  features: number[];   // ordered per GBDT_FEATURE_NAMES
  outcome: number;      // 1 = home team won, 0 = away team won
}

// ── GBDT model state ──────────────────────────────────────────────────────────

interface GBDTState {
  F0: number;
  stumps: Stump[];
  trainedOn: number;
  trainedAt: string;
}

class GBDTModel implements PredictionModel {
  readonly name    = 'GBDT';
  readonly version = '1.0.0';

  private state: GBDTState | null = null;
  // Accumulated importance scores (sum of split gains per feature across all stumps)
  private importance: number[] = new Array(GBDT_FEATURE_NAMES.length).fill(0);

  // ── Predict ────────────────────────────────────────────────────────────────

  async predict(features: GameFeatureVector): Promise<ModelPrediction> {
    const x = buildGBDTFeatures(features);

    // Cold-start: fall back to logistic regression until trained
    if (!this.state || this.state.trainedOn < MIN_SAMPLES) {
      const lr = await logisticModel.predict(features);
      return {
        ...lr,
        modelName:    this.name,
        modelVersion: this.version + '-cold-start',
      };
    }

    const rawProb = this.predictRaw(x);
    const contributions = this.computeContributions(x, rawProb);

    return {
      homeWinProbability:    rawProb,
      awayWinProbability:    1 - rawProb,
      drawProbability:       0,
      rawHomeWinProbability: rawProb,
      confidence:            Math.abs(rawProb - 0.5) * 2,
      featureContributions:  contributions,
      modelName:             this.name,
      modelVersion:          this.version,
      computedAt:            new Date().toISOString(),
    };
  }

  // ── Fit (gradient boosting loop) ───────────────────────────────────────────

  fit(samples: GBDTTrainingSample[]): void {
    if (samples.length < MIN_SAMPLES) return;

    const X = samples.map(s => s.features);
    const y = samples.map(s => s.outcome);
    const n = samples.length;

    // Initialize F0 as log-odds of the base rate
    const meanY = y.reduce((a, b) => a + b, 0) / n;
    const F0 = Math.log((meanY + 1e-7) / (1 - meanY + 1e-7));

    let F = new Array(n).fill(F0);
    const stumps: Stump[] = [];
    this.importance = new Array(GBDT_FEATURE_NAMES.length).fill(0);

    for (let m = 0; m < N_ESTIMATORS; m++) {
      // Negative gradient of log-loss = y - p  (pseudo-residuals)
      const residuals = y.map((yi, i) => yi - sigmoid(F[i]));

      const stump = fitStump(X, residuals);
      stumps.push(stump);

      // Accumulate feature importance
      this.importance[stump.featureIndex] += Math.max(0, stump.splitGain);

      // Update F
      F = F.map((f, i) => f + LEARNING_RATE * applyStump(stump, X[i]));
    }

    this.state = {
      F0,
      stumps,
      trainedOn: n,
      trainedAt: new Date().toISOString(),
    };
  }

  // ── Feature importances (normalised 0-1) ───────────────────────────────────

  featureImportances(): Array<{ name: string; label: string; importance: number }> {
    const total = this.importance.reduce((a, b) => a + b, 0) || 1;
    return GBDT_FEATURE_NAMES.map((name, i) => ({
      name,
      label:      GBDT_FEATURE_LABELS[name],
      importance: this.importance[i] / total,
    })).sort((a, b) => b.importance - a.importance);
  }

  isTrained(): boolean {
    return this.state !== null && this.state.trainedOn >= MIN_SAMPLES;
  }

  trainedOn(): number {
    return this.state?.trainedOn ?? 0;
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private predictRaw(x: number[]): number {
    if (!this.state) return 0.5;
    let F = this.state.F0;
    for (const stump of this.state.stumps) {
      F += LEARNING_RATE * applyStump(stump, x);
    }
    return sigmoid(F);
  }

  private computeContributions(x: number[], prob: number): FeatureContribution[] {
    if (!this.state) return [];

    // Attribute each stump's contribution to its feature
    const featureLogOddsContrib = new Array(GBDT_FEATURE_NAMES.length).fill(0);
    for (const stump of this.state.stumps) {
      featureLogOddsContrib[stump.featureIndex] +=
        LEARNING_RATE * applyStump(stump, x);
    }

    const totalAbs = featureLogOddsContrib.reduce((s, v) => s + Math.abs(v), 0) || 1;

    return GBDT_FEATURE_NAMES.map((name, i) => {
      const contribution   = featureLogOddsContrib[i];
      const probDelta      = contribution * prob * (1 - prob); // first-order delta
      const direction: 'positive' | 'negative' = contribution >= 0 ? 'positive' : 'negative';
      return {
        featureName:        name,
        featureLabel:       GBDT_FEATURE_LABELS[name],
        featureValue:       x[i],
        weight:             this.importance[i] / (this.importance.reduce((a, b) => a + b, 0) || 1),
        contribution,
        probabilityDelta:   probDelta,
        direction,
        percentageOfTotal:  (Math.abs(contribution) / totalAbs) * 100,
      };
    });
  }
}

export const gbdtModel = new GBDTModel();
