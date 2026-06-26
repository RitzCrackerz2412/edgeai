/**
 * Logistic regression prediction model.
 *
 * A linear model with a sigmoid output. Interpretable, fast, and a solid
 * baseline before introducing non-linear models (GBT, neural networks).
 *
 * Features (10) are all normalized to similar scales so weight magnitudes
 * are directly comparable — a larger weight = more important feature.
 *
 * Initial weights are set from sports analytics literature. They are updated
 * via gradient descent as validation data accumulates.
 *
 * Training interface:
 *   logisticModel.train(samples) — takes CalibrationSamples + feature vectors
 */

import type { GameFeatureVector } from '../features/types';
import type { FeatureContribution, ModelPrediction, PredictionModel } from './types';
import { clamp } from '../features/normalize';

// ── Feature vector for logistic regression ────────────────────────────────────
//
// All features are real-valued, centered around 0 or 0-1.

export interface LogisticFeatures {
  eloDiffNorm: number;     // (homeElo - awayElo) / 400, approx -2 to +2
  homeAdvantage: number;   // 1.0 always (model learns the weight)
  formDiff: number;        // homeRecentForm - awayRecentForm, -1 to +1
  restDiffNorm: number;    // (homeRestDays - awayRestDays) / 7, -2 to +2
  offRatingDiff: number;   // normalized offensive rating diff, -1 to +1
  defRatingDiff: number;   // normalized defensive rating diff, -1 to +1
  injuryAdvantage: number; // homeInjury - awayInjury, -1 to +1
  travelPenalty: number;   // away team travel fatigue, 0 to 1
  sosDiff: number;         // strength of schedule diff, -1 to +1
  momentumDiff: number;    // momentum score diff, -1 to +1
}

const FEATURE_NAMES: (keyof LogisticFeatures)[] = [
  'eloDiffNorm', 'homeAdvantage', 'formDiff', 'restDiffNorm',
  'offRatingDiff', 'defRatingDiff', 'injuryAdvantage', 'travelPenalty',
  'sosDiff', 'momentumDiff',
];

const FEATURE_LABELS: Record<keyof LogisticFeatures, string> = {
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

// ── Initial weights (bias at index 0, then one per feature) ──────────────────
//
// Sources: FiveThirtyEight NFL/NBA models, Sports Reference DVOA research.
// Intercept (bias): ~0 — no intrinsic home/away prediction without features.

const INITIAL_WEIGHTS = new Float64Array([
  0.00,  // bias
  1.50,  // eloDiffNorm   — strong single predictor
  0.20,  // homeAdvantage — ~5% unconditional boost
  0.60,  // formDiff      — hot/cold streaks matter
  0.15,  // restDiffNorm  — rest advantage is real but small
  0.40,  // offRatingDiff — offense and defense roughly equal
  0.40,  // defRatingDiff
  0.35,  // injuryAdvantage
  0.25,  // travelPenalty
  0.10,  // sosDiff
  0.20,  // momentumDiff
]);

// ── Training sample type ──────────────────────────────────────────────────────

export interface TrainingSample {
  features: LogisticFeatures;
  outcome: number;  // 1 = home team won, 0 = away team won, 0.5 = draw
  weight?: number;  // optional sample weight (recent results weighted more)
}

// ── Model implementation ──────────────────────────────────────────────────────

export class LogisticRegressionModel implements PredictionModel {
  readonly name = 'LogisticRegression';
  readonly version = '1.0.0';

  private weights = new Float64Array(INITIAL_WEIGHTS);
  private readonly learningRate = 0.01;
  private readonly l2Lambda     = 0.001; // L2 regularization

  // ── Numerically stable sigmoid ──────────────────────────────────────────────

  sigmoid(z: number): number {
    if (z >= 0) return 1 / (1 + Math.exp(-z));
    const e = Math.exp(z);
    return e / (1 + e);
  }

  // ── Feature vector → array ─────────────────────────────────────────────────

  private toArray(f: LogisticFeatures): number[] {
    return FEATURE_NAMES.map(k => f[k]);
  }

  // ── Raw probability from feature vector ────────────────────────────────────

  private rawPredict(f: LogisticFeatures): { prob: number; logit: number } {
    const x = this.toArray(f);
    let logit = this.weights[0]; // bias
    for (let i = 0; i < x.length; i++) {
      logit += this.weights[i + 1] * x[i];
    }
    return { prob: this.sigmoid(logit), logit };
  }

  // ── Build features from GameFeatureVector ─────────────────────────────────

  buildFeatures(gfv: GameFeatureVector): LogisticFeatures {
    return {
      eloDiffNorm:     clamp(gfv.derived.eloDiffNormalized, -3, 3),
      homeAdvantage:   1.0,
      formDiff:        clamp(gfv.derived.formDiff, -1, 1),
      restDiffNorm:    clamp((gfv.home.restDays - gfv.away.restDays) / 7, -2, 2),
      offRatingDiff:   clamp(gfv.derived.offRatingDiff, -1, 1),
      defRatingDiff:   clamp(gfv.derived.defRatingDiff, -1, 1),
      injuryAdvantage: clamp(gfv.derived.injuryAdvantage, -1, 1),
      travelPenalty:   clamp(gfv.away.travelFatigue, 0, 1),
      sosDiff:         clamp(gfv.home.strengthOfSchedule - gfv.away.strengthOfSchedule, -1, 1),
      momentumDiff:    clamp(gfv.home.momentumScore - gfv.away.momentumScore, -1, 1),
    };
  }

  // ── PredictionModel implementation ──────────────────────────────────────────

  async predict(features: GameFeatureVector): Promise<ModelPrediction> {
    const f = this.buildFeatures(features);
    const x = this.toArray(f);
    const { prob: rawProb, logit } = this.rawPredict(f);

    const adjustedProb = clamp(rawProb, 0.05, 0.95);

    // Feature contributions
    const contribs: FeatureContribution[] = FEATURE_NAMES.map((name, i) => {
      const w = this.weights[i + 1];
      const v = x[i];
      const contrib = w * v;
      return {
        featureName: name,
        featureLabel: FEATURE_LABELS[name],
        featureValue: v,
        weight: w,
        contribution: contrib,
        probabilityDelta: contrib * adjustedProb * (1 - adjustedProb), // sigmoid derivative approx
        direction: contrib > 0 ? 'positive' : 'negative',
        percentageOfTotal: 0, // filled below
      };
    });

    const totalAbs = contribs.reduce((s, c) => s + Math.abs(c.contribution), 0);
    for (const c of contribs) {
      c.percentageOfTotal = totalAbs > 0 ? (Math.abs(c.contribution) / totalAbs) * 100 : 0;
    }

    const sport = features.home.sport;
    const drawProb = sport === 'Soccer'
      ? clamp((1 - Math.abs(adjustedProb - 0.5) * 2) * 0.28, 0, 0.32)
      : 0;

    const homeWinProb = drawProb > 0
      ? clamp(adjustedProb - drawProb / 2, 0.05, 0.90)
      : adjustedProb;
    const awayWinProb = clamp(1 - homeWinProb - drawProb, 0.05, 0.90);

    const confidence = clamp(Math.abs(logit) / 3 * 0.9, 0.3, 0.95);

    return {
      homeWinProbability: homeWinProb,
      awayWinProbability: awayWinProb,
      drawProbability: drawProb,
      rawHomeWinProbability: rawProb,
      confidence,
      featureContributions: contribs,
      modelName: this.name,
      modelVersion: this.version,
      computedAt: new Date().toISOString(),
    };
  }

  // ── Gradient descent training ─────────────────────────────────────────────

  train(
    samples: TrainingSample[],
    epochs = 100,
  ): { finalLoss: number; lossHistory: number[] } {
    const history: number[] = [];
    const eps = 1e-15;

    for (let epoch = 0; epoch < epochs; epoch++) {
      let epochLoss = 0;
      let totalWeight = 0;

      for (const { features: f, outcome, weight = 1 } of samples) {
        const x = this.toArray(f);
        const { prob } = this.rawPredict(f);
        const error = prob - outcome;

        // Weighted binary cross-entropy loss
        const clipped = clamp(prob, eps, 1 - eps);
        epochLoss += weight * (-(outcome * Math.log(clipped) + (1 - outcome) * Math.log(1 - clipped)));
        totalWeight += weight;

        // Gradient update for bias
        this.weights[0] -= this.learningRate * weight * error;

        // Gradient update for feature weights with L2 regularization
        for (let j = 0; j < x.length; j++) {
          this.weights[j + 1] -= this.learningRate * (
            weight * error * x[j] + this.l2Lambda * this.weights[j + 1]
          );
        }
      }

      history.push(totalWeight > 0 ? epochLoss / totalWeight : 0);
    }

    return {
      finalLoss: history[history.length - 1] ?? 0,
      lossHistory: history,
    };
  }

  // ── Weight inspection ─────────────────────────────────────────────────────

  getWeights(): Record<string, number> {
    const names = ['bias', ...FEATURE_NAMES];
    return Object.fromEntries(names.map((n, i) => [n, this.weights[i]]));
  }

  setWeights(weights: number[]): void {
    if (weights.length !== this.weights.length) {
      throw new Error(`Expected ${this.weights.length} weights, got ${weights.length}`);
    }
    this.weights = new Float64Array(weights);
  }

  resetWeights(): void {
    this.weights = new Float64Array(INITIAL_WEIGHTS);
  }
}

export const logisticModel = new LogisticRegressionModel();
