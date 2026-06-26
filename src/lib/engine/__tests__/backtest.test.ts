import { describe, it, expect } from 'vitest';
import { runBacktest } from '../backtest';
import type { BacktestSample } from '../backtest';

function makeSamples(n: number, accuracy: number, prob = 0.7): BacktestSample[] {
  return Array.from({ length: n }, (_, i) => ({
    predictedProb: prob,
    actualOutcome: (i < Math.round(n * accuracy) ? 1 : 0) as 0 | 1,
  }));
}

describe('runBacktest', () => {
  it('returns empty result for empty input', () => {
    const r = runBacktest([]);
    expect(r.sampleCount).toBe(0);
    expect(r.winnerAccuracy).toBe(0);
  });

  it('computes correct winner accuracy', () => {
    const samples = makeSamples(100, 0.70);
    const r = runBacktest(samples);
    expect(r.winnerAccuracy).toBeCloseTo(0.70, 2);
  });

  it('Brier score is 0 for perfect predictions', () => {
    const perfect: BacktestSample[] = [
      { predictedProb: 1.0, actualOutcome: 1 },
      { predictedProb: 0.0, actualOutcome: 0 },
    ];
    const r = runBacktest(perfect);
    expect(r.brierScore).toBeCloseTo(0, 5);
  });

  it('Brier score is 0.25 for maximally uncertain', () => {
    const uncertain: BacktestSample[] = [
      { predictedProb: 0.5, actualOutcome: 1 },
      { predictedProb: 0.5, actualOutcome: 0 },
    ];
    const r = runBacktest(uncertain);
    expect(r.brierScore).toBeCloseTo(0.25, 5);
  });

  it('baseline Brier score is always 0.25', () => {
    const r = runBacktest(makeSamples(50, 0.6));
    expect(r.baselineBrierScore).toBe(0.25);
  });

  it('baseline accuracy equals home win rate', () => {
    const samples = makeSamples(100, 0.65);
    const r = runBacktest(samples);
    // 65% of samples have actualOutcome=1, so baseline = 0.65
    expect(r.baselineWinnerAccuracy).toBeCloseTo(0.65, 1);
  });

  it('brierSkill is positive for a model better than baseline', () => {
    // Create calibrated samples: predict 0.7 and be right 70% of the time
    const samples: BacktestSample[] = Array.from({ length: 200 }, (_, i) => ({
      predictedProb: 0.7,
      actualOutcome: (i < 140 ? 1 : 0) as 0 | 1,
    }));
    const r = runBacktest(samples);
    // Brier with these samples < 0.25, so skill > 0
    expect(r.brierSkill).toBeGreaterThan(0);
  });

  it('ROC-AUC is > 0.5 for a discriminative model', () => {
    // Discriminative: high prob → home wins, low prob → away wins
    const samples: BacktestSample[] = [
      ...Array.from({ length: 40 }, () => ({ predictedProb: 0.8, actualOutcome: 1 as 0 | 1 })),
      ...Array.from({ length: 40 }, () => ({ predictedProb: 0.2, actualOutcome: 0 as 0 | 1 })),
    ];
    const r = runBacktest(samples);
    expect(r.rocAuc).toBeGreaterThan(0.6);
  });

  it('computes score MAE when scores provided', () => {
    const samples: BacktestSample[] = [
      {
        predictedProb: 0.6,
        actualOutcome: 1,
        predictedHomeScore: 24,
        predictedAwayScore: 17,
        actualHomeScore: 27,
        actualAwayScore: 14,
      },
      {
        predictedProb: 0.4,
        actualOutcome: 0,
        predictedHomeScore: 20,
        predictedAwayScore: 24,
        actualHomeScore: 18,
        actualAwayScore: 28,
      },
    ];
    const r = runBacktest(samples);
    expect(r.scoreMAE).not.toBeNull();
    expect(r.scoreMAE!).toBeGreaterThanOrEqual(0);
  });

  it('scoreMAE is null when no score predictions provided', () => {
    const r = runBacktest(makeSamples(10, 0.6));
    expect(r.scoreMAE).toBeNull();
  });

  it('buckets contain only entries with count > 0', () => {
    // All predictions at 0.7 → only one bucket populated
    const samples = makeSamples(50, 0.65, 0.7);
    const r = runBacktest(samples);
    for (const b of r.buckets) {
      expect(b.count).toBeGreaterThan(0);
    }
  });

  it('ECE is between 0 and 1', () => {
    const r = runBacktest(makeSamples(100, 0.7, 0.7));
    expect(r.expectedCalibrationError).toBeGreaterThanOrEqual(0);
    expect(r.expectedCalibrationError).toBeLessThanOrEqual(1);
  });

  it('summary is a non-empty string', () => {
    const r = runBacktest(makeSamples(10, 0.6));
    expect(typeof r.summary).toBe('string');
    expect(r.summary.length).toBeGreaterThan(10);
  });
});
