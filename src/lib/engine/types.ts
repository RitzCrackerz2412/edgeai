import type { GameFeatureVector } from '../features/types';

// ── Feature contribution (explainability) ────────────────────────────────────

export interface FeatureContribution {
  featureName: string;
  featureLabel: string;
  featureValue: number;
  weight: number;
  contribution: number;         // contribution to log-odds (weight * featureValue)
  probabilityDelta: number;     // approximate effect on win probability
  direction: 'positive' | 'negative'; // relative to home team winning
  percentageOfTotal: number;    // |contribution| / Σ|contributions| * 100
}

// ── Individual model prediction ───────────────────────────────────────────────

export interface ModelPrediction {
  homeWinProbability: number;       // 0-1, calibrated
  awayWinProbability: number;       // 0-1, calibrated
  drawProbability: number;          // 0-1 (0 for sports without draws)
  rawHomeWinProbability: number;    // 0-1, before Platt scaling
  confidence: number;               // 0-1, model confidence metric
  expectedHomeScore?: number;
  expectedAwayScore?: number;
  expectedMargin?: number;          // home - away expected
  featureContributions: FeatureContribution[];
  modelName: string;
  modelVersion: string;
  computedAt: string;
}

// ── Ensemble prediction ───────────────────────────────────────────────────────

export interface EnsemblePrediction extends ModelPrediction {
  modelWeights: Record<string, number>;
  individualPredictions: Record<string, ModelPrediction>;
}

// ── Post-game validation record ───────────────────────────────────────────────

export interface ValidationRecord {
  gameId: string;
  sport: string;
  modelName: string;
  predictedHomeWinProbability: number;
  actualHomeScore: number;
  actualAwayScore: number;
  predictedHomeScore?: number;
  predictedAwayScore?: number;
  homeWon: boolean;
  predictionCorrect: boolean;
  marginError: number;              // |predictedMargin - actualMargin|
  scoreMAE: number;                 // mean absolute error of predicted scores
  brierContribution: number;        // (predictedProb - outcome)^2
  logLossContribution: number;      // -[y*log(p) + (1-y)*log(1-p)]
  confidenceError: number;          // |predictedConfidence - actualCorrect*100|
  predictedAt: string;
  validatedAt: string;
}

// ── Model interface ───────────────────────────────────────────────────────────

export interface PredictionModel {
  readonly name: string;
  readonly version: string;
  predict(features: GameFeatureVector): Promise<ModelPrediction>;
}

// ── Calibration sample (for fitting Platt scaling) ───────────────────────────

export interface CalibrationSample {
  rawProbability: number;
  outcome: number;  // 1 if predicted team won, 0 otherwise
  weight?: number;  // optional sample weight (recent samples weighted higher)
}
