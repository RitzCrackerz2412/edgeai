/**
 * Probability calibration and evaluation metrics.
 *
 * A model that predicts 70% win probability should be correct ~70% of the
 * time. Calibration checks and corrects this alignment.
 *
 * Methods:
 *  - Platt scaling (sigmoid calibration): most sample-efficient, works with
 *    50–200 examples. Industry standard for well-behaved binary classifiers.
 *  - Isotonic regression: stronger but requires 1 000+ samples (not yet implemented).
 *
 * Metrics:
 *  - Brier score: mean squared error of probabilities. Range [0, 1]; lower is better.
 *    Perfect calibration = 0, random = 0.25.
 *  - Log loss: log likelihood of predictions. Range [0, ∞); lower is better.
 *    Perfect = 0, random ≈ 0.693.
 */

import type { CalibrationSample } from './types';
import { clamp } from '../features/normalize';

// ── Metric functions ─────────────────────────────────────────────────────────

export function brierScore(samples: CalibrationSample[]): number {
  if (samples.length === 0) return 0;
  const totalWeight = samples.reduce((s, x) => s + (x.weight ?? 1), 0);
  return samples.reduce((sum, { rawProbability: p, outcome: y, weight: w = 1 }) =>
    sum + w * Math.pow(p - y, 2), 0,
  ) / totalWeight;
}

export function logLoss(samples: CalibrationSample[]): number {
  if (samples.length === 0) return 0;
  const eps = 1e-15;
  const totalWeight = samples.reduce((s, x) => s + (x.weight ?? 1), 0);
  return -samples.reduce((sum, { rawProbability: p, outcome: y, weight: w = 1 }) => {
    const pCl = clamp(p, eps, 1 - eps);
    return sum + w * (y * Math.log(pCl) + (1 - y) * Math.log(1 - pCl));
  }, 0) / totalWeight;
}

/** Resolution: how much the predicted probabilities vary. Higher = more decisive. */
export function resolution(samples: CalibrationSample[]): number {
  if (samples.length === 0) return 0;
  const mean = samples.reduce((s, x) => s + x.rawProbability, 0) / samples.length;
  return samples.reduce((s, x) => s + Math.pow(x.rawProbability - mean, 2), 0) / samples.length;
}

/** Reliability: how close predicted probs match actual frequencies. Lower = better. */
export function reliability(
  samples: CalibrationSample[],
  bins = 10,
): number {
  const n = samples.length;
  if (n === 0) return 0;
  const binWidth = 1 / bins;
  let rel = 0;

  for (let b = 0; b < bins; b++) {
    const lo = b * binWidth;
    const hi = (b + 1) * binWidth;
    const binSamples = samples.filter(s => s.rawProbability >= lo && s.rawProbability < hi);
    if (binSamples.length === 0) continue;
    const avgPred = binSamples.reduce((s, x) => s + x.rawProbability, 0) / binSamples.length;
    const avgAct  = binSamples.reduce((s, x) => s + x.outcome, 0) / binSamples.length;
    rel += (binSamples.length / n) * Math.pow(avgPred - avgAct, 2);
  }

  return rel;
}

// ── Calibration curve data (for the reliability diagram) ─────────────────────

export interface CalibrationBin {
  predictedMidpoint: number;  // midpoint of predicted probability range
  actualFrequency: number;    // actual win frequency in this bin
  count: number;
  label: string;
}

export function calibrationCurve(
  samples: CalibrationSample[],
  bins = 10,
): CalibrationBin[] {
  const binWidth = 1 / bins;
  const result: CalibrationBin[] = [];

  for (let b = 0; b < bins; b++) {
    const lo = b * binWidth;
    const hi = (b + 1) * binWidth;
    const midpoint = (lo + hi) / 2;
    const binSamples = samples.filter(s => s.rawProbability >= lo && s.rawProbability < hi);

    if (binSamples.length < 3) continue; // skip bins with too few samples

    const actual = binSamples.reduce((s, x) => s + x.outcome, 0) / binSamples.length;
    result.push({
      predictedMidpoint: Math.round(midpoint * 100),
      actualFrequency: Math.round(actual * 100),
      count: binSamples.length,
      label: `${Math.round(lo * 100)}-${Math.round(hi * 100)}%`,
    });
  }

  return result;
}

// ── Platt scaling calibrator ──────────────────────────────────────────────────

export class PlattCalibrator {
  private A = 1.0; // slope  (1 = no transform)
  private B = 0.0; // offset (0 = no transform)

  /** Apply calibration to a raw probability */
  calibrate(rawProb: number): number {
    const z = this.A * rawProb + this.B;
    // Numerically stable sigmoid
    if (z >= 0) return 1 / (1 + Math.exp(-z));
    const e = Math.exp(z);
    return e / (1 + e);
  }

  /**
   * Fit calibration parameters on held-out validation samples.
   * Requires at least 30 samples for meaningful results.
   */
  fit(
    samples: CalibrationSample[],
    iterations = 300,
    learningRate = 0.05,
  ): void {
    if (samples.length < 10) return; // not enough data to fit

    const eps = 1e-15;

    // Laplace-smoothed targets to prevent log(0)
    const n = samples.length;
    const targets = samples.map(s => ({
      f: s.rawProbability,
      y: (s.outcome * n + 0.5) / (n + 1), // Laplace smoothing
      w: s.weight ?? 1,
    }));

    for (let iter = 0; iter < iterations; iter++) {
      let dA = 0, dB = 0;

      for (const { f, y, w } of targets) {
        const z = this.A * f + this.B;
        const p = z >= 0 ? 1 / (1 + Math.exp(-z)) : Math.exp(z) / (1 + Math.exp(z));
        const pCl = clamp(p, eps, 1 - eps);
        const error = pCl - y;
        dA += w * error * f;
        dB += w * error;
      }

      const totalWeight = targets.reduce((s, t) => s + t.w, 0);
      this.A -= learningRate * dA / totalWeight;
      this.B -= learningRate * dB / totalWeight;
    }
  }

  getParams(): { A: number; B: number } {
    return { A: this.A, B: this.B };
  }

  setParams(A: number, B: number): void {
    this.A = A;
    this.B = B;
  }

  reset(): void {
    this.A = 1.0;
    this.B = 0.0;
  }
}

// ── Singleton calibrators (one per model) ────────────────────────────────────

export const eloCalibrator       = new PlattCalibrator();
export const logisticCalibrator  = new PlattCalibrator();
export const ensembleCalibrator  = new PlattCalibrator();

// ── In-memory validation store ────────────────────────────────────────────────

interface StoredSample extends CalibrationSample {
  modelName: string;
  gameId: string;
  recordedAt: string;
}

class CalibrationStore {
  private samples: StoredSample[] = [];
  private readonly MAX_SAMPLES = 5000;

  add(sample: Omit<StoredSample, 'recordedAt'>): void {
    this.samples.push({ ...sample, recordedAt: new Date().toISOString() });
    // Keep only most recent samples when at limit
    if (this.samples.length > this.MAX_SAMPLES) {
      this.samples = this.samples.slice(-this.MAX_SAMPLES);
    }
  }

  forModel(modelName: string): CalibrationSample[] {
    return this.samples
      .filter(s => s.modelName === modelName)
      .map(({ rawProbability, outcome, weight }) => ({ rawProbability, outcome, weight }));
  }

  all(): CalibrationSample[] {
    return this.samples.map(({ rawProbability, outcome, weight }) => ({ rawProbability, outcome, weight }));
  }

  getMetrics(modelName: string): {
    brierScore: number;
    logLoss: number;
    sampleCount: number;
  } {
    const s = this.forModel(modelName);
    return {
      brierScore: brierScore(s),
      logLoss: logLoss(s),
      sampleCount: s.length,
    };
  }

  clear(): void {
    this.samples = [];
  }
}

export const calibrationStore = new CalibrationStore();
