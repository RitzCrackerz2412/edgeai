/**
 * Backtesting framework.
 *
 * Replays a set of historical predictions against known outcomes and
 * computes a comprehensive suite of performance metrics:
 *
 *   - Winner accuracy (correct side)
 *   - Brier score (calibration)
 *   - Log loss (sharpness)
 *   - Calibration error (ECE)
 *   - Score MAE (when score predictions are provided)
 *   - ROC-AUC (discrimination)
 *   - Performance per confidence bucket (is the model honest about uncertainty?)
 *   - Comparison vs always-pick-home baseline
 *
 * Per the project principle: don't judge the model solely by winner accuracy.
 */

import { brierScore, logLoss } from './calibration';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BacktestSample {
  /** Predicted home-win probability (0-1) */
  predictedProb: number;
  /** 1 if home won, 0 if away won */
  actualOutcome: 0 | 1;
  /** Optional score prediction */
  predictedHomeScore?: number;
  predictedAwayScore?: number;
  /** Optional actual scores */
  actualHomeScore?: number;
  actualAwayScore?: number;
  /** Game metadata */
  gameId?: string;
  sport?: string;
  date?: string;
}

export interface ConfidenceBucket {
  /** Bucket label, e.g. "60-70%" */
  label: string;
  /** Lower bound of predicted probability */
  probLow: number;
  /** Upper bound */
  probHigh: number;
  /** Number of games in bucket */
  count: number;
  /** Actual home win rate within bucket — should match bucket midpoint if calibrated */
  actualWinRate: number;
  /** Predicted win rate (midpoint of bucket) */
  predictedWinRate: number;
  /** Accuracy (predicted side matched actual) within bucket */
  accuracy: number;
  /** Brier score within bucket */
  brierScore: number;
}

export interface BacktestResult {
  // Overall metrics
  sampleCount: number;
  winnerAccuracy: number;
  brierScore: number;
  logLoss: number;
  expectedCalibrationError: number;    // ECE: average |predicted - actual| per bucket
  rocAuc: number;                      // Area under ROC curve

  // Score prediction metrics (only if score data provided)
  scoreMAE: number | null;             // mean absolute error of margin
  homeScoreMAE: number | null;
  awayScoreMAE: number | null;

  // Comparison to always-pick-home baseline
  baselineWinnerAccuracy: number;      // fraction of games home team won
  baselineBrierScore: number;          // Brier using 0.5 for every game
  brierSkill: number;                  // 1 - (model Brier / baseline Brier)

  // Per-confidence bucket
  buckets: ConfidenceBucket[];

  // Summary text
  summary: string;
}

// ── ROC-AUC ───────────────────────────────────────────────────────────────────
// Trapezoidal rule on (FPR, TPR) curve.

function computeRocAuc(samples: BacktestSample[]): number {
  if (samples.length === 0) return 0.5;

  const sorted = [...samples].sort((a, b) => b.predictedProb - a.predictedProb);
  const totalPos = sorted.filter((s) => s.actualOutcome === 1).length;
  const totalNeg = sorted.length - totalPos;
  if (totalPos === 0 || totalNeg === 0) return 0.5;

  let auc = 0;
  let fp = 0, tp = 0;
  let prevFpr = 0, prevTpr = 0;

  for (const s of sorted) {
    if (s.actualOutcome === 1) tp++;
    else fp++;
    const fpr = fp / totalNeg;
    const tpr = tp / totalPos;
    auc += (fpr - prevFpr) * (tpr + prevTpr) / 2;
    prevFpr = fpr;
    prevTpr = tpr;
  }

  return auc;
}

// ── Confidence buckets ────────────────────────────────────────────────────────

const BUCKET_EDGES = [0.5, 0.6, 0.7, 0.8, 0.9, 1.0];

function buildBuckets(samples: BacktestSample[]): ConfidenceBucket[] {
  // Flip "away confident" predictions so we always measure from the
  // perspective of the "predicted winner"
  const normalized = samples.map((s) => ({
    prob: s.predictedProb >= 0.5 ? s.predictedProb : 1 - s.predictedProb,
    won: s.predictedProb >= 0.5 ? s.actualOutcome === 1 : s.actualOutcome === 0,
    rawProb: s.predictedProb,
    rawOutcome: s.actualOutcome,
  }));

  const buckets: ConfidenceBucket[] = [];
  for (let i = 0; i < BUCKET_EDGES.length - 1; i++) {
    const lo = BUCKET_EDGES[i], hi = BUCKET_EDGES[i + 1];
    const inBucket = normalized.filter((s) => s.prob >= lo && s.prob < hi);
    const n = inBucket.length;
    if (n === 0) continue;

    const wins = inBucket.filter((s) => s.won).length;
    const mid = (lo + hi) / 2;
    const bs = inBucket.reduce(
      (sum, s) => sum + Math.pow(s.rawProb - s.rawOutcome, 2), 0,
    ) / n;

    buckets.push({
      label: `${Math.round(lo * 100)}-${Math.round(hi * 100)}%`,
      probLow: lo, probHigh: hi,
      count: n,
      actualWinRate: wins / n,
      predictedWinRate: mid,
      accuracy: wins / n,
      brierScore: bs,
    });
  }
  return buckets;
}

// ── Expected calibration error ─────────────────────────────────────────────────

function computeECE(buckets: ConfidenceBucket[]): number {
  const totalSamples = buckets.reduce((s, b) => s + b.count, 0);
  if (totalSamples === 0) return 0;
  return buckets.reduce(
    (sum, b) => sum + (b.count / totalSamples) * Math.abs(b.predictedWinRate - b.actualWinRate),
    0,
  );
}

// ── Score MAE ─────────────────────────────────────────────────────────────────

function computeScoreMAE(samples: BacktestSample[]): {
  marginMAE: number | null;
  homeMAE: number | null;
  awayMAE: number | null;
} {
  const withScores = samples.filter(
    (s) =>
      s.predictedHomeScore !== undefined &&
      s.predictedAwayScore !== undefined &&
      s.actualHomeScore !== undefined &&
      s.actualAwayScore !== undefined,
  );

  if (withScores.length === 0) return { marginMAE: null, homeMAE: null, awayMAE: null };

  const n = withScores.length;
  const marginMAE =
    withScores.reduce(
      (sum, s) =>
        sum +
        Math.abs(
          (s.predictedHomeScore! - s.predictedAwayScore!) -
          (s.actualHomeScore! - s.actualAwayScore!),
        ),
      0,
    ) / n;

  const homeMAE =
    withScores.reduce((sum, s) => sum + Math.abs(s.predictedHomeScore! - s.actualHomeScore!), 0) / n;

  const awayMAE =
    withScores.reduce((sum, s) => sum + Math.abs(s.predictedAwayScore! - s.actualAwayScore!), 0) / n;

  return { marginMAE, homeMAE, awayMAE };
}

// ── Main backtest function ────────────────────────────────────────────────────

export function runBacktest(samples: BacktestSample[]): BacktestResult {
  if (samples.length === 0) {
    return emptyResult();
  }

  const n = samples.length;
  const calSamples = samples.map((s) => ({
    rawProbability: s.predictedProb,
    outcome: s.actualOutcome as 0 | 1,
  }));

  const bs = brierScore(calSamples);
  const ll = logLoss(calSamples);
  const rocAuc = computeRocAuc(samples);
  const buckets = buildBuckets(samples);
  const ece = computeECE(buckets);

  const correct = samples.filter(
    (s) => (s.predictedProb >= 0.5 ? 1 : 0) === s.actualOutcome,
  ).length;
  const accuracy = correct / n;

  // Baseline: always pick home
  const homeWins = samples.filter((s) => s.actualOutcome === 1).length;
  const baselineAccuracy = homeWins / n;
  const baselineBrier = 0.25; // Brier with p=0.5 for all = 0.25
  const brierSkill = 1 - bs / baselineBrier;

  const { marginMAE, homeMAE, awayMAE } = computeScoreMAE(samples);

  const summary = buildSummary(accuracy, bs, ll, ece, brierSkill, n);

  return {
    sampleCount: n,
    winnerAccuracy: accuracy,
    brierScore: bs,
    logLoss: ll,
    expectedCalibrationError: ece,
    rocAuc,
    scoreMAE: marginMAE,
    homeScoreMAE: homeMAE,
    awayScoreMAE: awayMAE,
    baselineWinnerAccuracy: baselineAccuracy,
    baselineBrierScore: baselineBrier,
    brierSkill,
    buckets,
    summary,
  };
}

function buildSummary(
  accuracy: number,
  bs: number,
  ll: number,
  ece: number,
  skill: number,
  n: number,
): string {
  const grade = bs < 0.18 ? 'well-calibrated' : bs < 0.22 ? 'moderately calibrated' : 'poorly calibrated';
  const skillStr = (skill * 100).toFixed(1);
  return (
    `Over ${n} games: ${(accuracy * 100).toFixed(1)}% accuracy, ` +
    `Brier ${bs.toFixed(3)} (${grade}), ` +
    `Log-loss ${ll.toFixed(3)}, ECE ${ece.toFixed(3)}, ` +
    `${skillStr}% improvement over baseline.`
  );
}

function emptyResult(): BacktestResult {
  return {
    sampleCount: 0,
    winnerAccuracy: 0,
    brierScore: 0.25,
    logLoss: 0.693,
    expectedCalibrationError: 0,
    rocAuc: 0.5,
    scoreMAE: null, homeScoreMAE: null, awayScoreMAE: null,
    baselineWinnerAccuracy: 0.55,
    baselineBrierScore: 0.25,
    brierSkill: 0,
    buckets: [],
    summary: 'No data available.',
  };
}
