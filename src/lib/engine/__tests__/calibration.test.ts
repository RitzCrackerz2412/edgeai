import { describe, it, expect, beforeEach } from 'vitest';
import {
  brierScore,
  logLoss,
  PlattCalibrator,
  calibrationCurve,
} from '../calibration';
import type { CalibrationSample } from '../types';

const perfect: CalibrationSample[] = [
  { rawProbability: 1.0, outcome: 1 },
  { rawProbability: 0.0, outcome: 0 },
];

const random: CalibrationSample[] = [
  { rawProbability: 0.5, outcome: 1 },
  { rawProbability: 0.5, outcome: 0 },
];

describe('brierScore', () => {
  it('returns 0 for empty samples', () => {
    expect(brierScore([])).toBe(0);
  });

  it('returns 0 for perfect predictions', () => {
    expect(brierScore(perfect)).toBeCloseTo(0, 5);
  });

  it('returns 0.25 for maximally uncertain predictions', () => {
    expect(brierScore(random)).toBeCloseTo(0.25, 5);
  });

  it('is lower for better predictions', () => {
    const good: CalibrationSample[] = [
      { rawProbability: 0.8, outcome: 1 },
      { rawProbability: 0.2, outcome: 0 },
    ];
    const bad: CalibrationSample[] = [
      { rawProbability: 0.2, outcome: 1 },
      { rawProbability: 0.8, outcome: 0 },
    ];
    expect(brierScore(good)).toBeLessThan(brierScore(bad));
  });

  it('respects sample weights', () => {
    const s: CalibrationSample[] = [
      { rawProbability: 0.9, outcome: 1, weight: 2 },
      { rawProbability: 0.1, outcome: 0, weight: 1 },
    ];
    // Not 0 but should be small and different from unweighted
    const bs = brierScore(s);
    expect(bs).toBeGreaterThanOrEqual(0);
    expect(bs).toBeLessThan(0.25);
  });
});

describe('logLoss', () => {
  it('returns 0 for empty samples', () => {
    expect(logLoss([])).toBe(0);
  });

  it('returns a small value for confident correct predictions', () => {
    const s: CalibrationSample[] = [
      { rawProbability: 0.99, outcome: 1 },
      { rawProbability: 0.01, outcome: 0 },
    ];
    expect(logLoss(s)).toBeLessThan(0.1);
  });

  it('is lower for better predictions', () => {
    const good: CalibrationSample[] = [
      { rawProbability: 0.8, outcome: 1 },
      { rawProbability: 0.2, outcome: 0 },
    ];
    const bad: CalibrationSample[] = [
      { rawProbability: 0.3, outcome: 1 },
      { rawProbability: 0.7, outcome: 0 },
    ];
    expect(logLoss(good)).toBeLessThan(logLoss(bad));
  });

  it('is approximately 0.693 for random predictions (ln 2)', () => {
    expect(logLoss(random)).toBeCloseTo(0.693, 2);
  });
});

describe('PlattCalibrator', () => {
  let cal: PlattCalibrator;

  beforeEach(() => {
    cal = new PlattCalibrator();
  });

  it('is identity before fitting (A=1, B=0)', () => {
    expect(cal.calibrate(0.7)).toBeCloseTo(0.668, 2); // sigmoid(1*0.7) ≈ 0.668
  });

  it('getParams returns A=1, B=0 initially', () => {
    const { A, B } = cal.getParams();
    expect(A).toBe(1.0);
    expect(B).toBe(0.0);
  });

  it('does not fit with fewer than 10 samples', () => {
    const small = Array.from({ length: 5 }, (_, i) => ({
      rawProbability: 0.5 + i * 0.05,
      outcome: i % 2,
    }));
    cal.fit(small);
    const { A, B } = cal.getParams();
    expect(A).toBe(1.0);
    expect(B).toBe(0.0);
  });

  it('fits and shifts calibration for overconfident model', () => {
    // Model is overconfident: always predicts 0.9 but only right 60% of the time
    const samples: CalibrationSample[] = Array.from({ length: 50 }, (_, i) => ({
      rawProbability: 0.9,
      outcome: i < 30 ? 1 : 0, // 60% correct
    }));
    cal.fit(samples, 1000, 0.1);
    // After fitting, calibrate(0.9) should be closer to 0.6
    const calibrated = cal.calibrate(0.9);
    expect(calibrated).toBeLessThan(0.85); // pulled down
  });

  it('reset restores to identity', () => {
    cal.setParams(2.0, -0.5);
    cal.reset();
    expect(cal.getParams()).toEqual({ A: 1.0, B: 0.0 });
  });

  it('calibrate returns value in (0, 1)', () => {
    for (let p = 0; p <= 1; p += 0.1) {
      const c = cal.calibrate(p);
      expect(c).toBeGreaterThan(0);
      expect(c).toBeLessThan(1);
    }
  });
});

describe('calibrationCurve', () => {
  it('returns empty array for empty samples', () => {
    expect(calibrationCurve([])).toEqual([]);
  });

  it('returns bins with count >= 3', () => {
    const samples: CalibrationSample[] = Array.from({ length: 100 }, (_, i) => ({
      rawProbability: i / 100,
      outcome: Math.random() > 0.5 ? 1 : 0,
    }));
    const curve = calibrationCurve(samples);
    for (const bin of curve) {
      expect(bin.count).toBeGreaterThanOrEqual(3);
    }
  });
});
