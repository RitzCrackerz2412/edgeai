import { describe, it, expect } from 'vitest';
import {
  createRng,
  normalSample,
  poissonSample,
  simulate,
  quickEstimate,
} from '../montecarlo';

describe('createRng', () => {
  it('produces values in [0, 1)', () => {
    const rng = createRng(42);
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('is deterministic with same seed', () => {
    const rng1 = createRng(12345);
    const rng2 = createRng(12345);
    for (let i = 0; i < 20; i++) {
      expect(rng1()).toBe(rng2());
    }
  });

  it('produces different sequences for different seeds', () => {
    const r1 = createRng(1)();
    const r2 = createRng(2)();
    expect(r1).not.toBe(r2);
  });
});

describe('normalSample', () => {
  it('produces samples near the requested mean', () => {
    const rng = createRng(99);
    const samples = Array.from({ length: 5000 }, () => normalSample(rng, 10, 2));
    const mean = samples.reduce((s, x) => s + x, 0) / samples.length;
    expect(mean).toBeCloseTo(10, 0); // within 1 unit
  });

  it('produces samples with approximately correct std', () => {
    const rng = createRng(77);
    const samples = Array.from({ length: 5000 }, () => normalSample(rng, 0, 3));
    const mean = samples.reduce((s, x) => s + x, 0) / samples.length;
    const variance = samples.reduce((s, x) => s + (x - mean) ** 2, 0) / samples.length;
    expect(Math.sqrt(variance)).toBeCloseTo(3, 0);
  });
});

describe('poissonSample', () => {
  it('returns 0 for lambda <= 0', () => {
    const rng = createRng(1);
    expect(poissonSample(rng, 0)).toBe(0);
    expect(poissonSample(rng, -1)).toBe(0);
  });

  it('produces non-negative integers', () => {
    const rng = createRng(42);
    for (let i = 0; i < 500; i++) {
      const v = poissonSample(rng, 3);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(v)).toBe(true);
    }
  });

  it('approximates the correct mean', () => {
    const rng = createRng(55);
    const lambda = 4.3;
    const samples = Array.from({ length: 5000 }, () => poissonSample(rng, lambda));
    const mean = samples.reduce((s, x) => s + x, 0) / samples.length;
    expect(mean).toBeCloseTo(lambda, 0);
  });
});

describe('simulate', () => {
  it('is deterministic with same seed', () => {
    const input = { sport: 'NFL' as const, homeWinProbability: 0.6, n: 1000, seed: 42 };
    const r1 = simulate(input);
    const r2 = simulate(input);
    expect(r1.homeWinProbability).toBe(r2.homeWinProbability);
    expect(r1.expectedHomeScore).toBe(r2.expectedHomeScore);
  });

  it('respects n lower bound (clamps to 1000)', () => {
    const r = simulate({ sport: 'NFL', homeWinProbability: 0.5, n: 10, seed: 1 });
    expect(r.simulationCount).toBe(1000);
  });

  it('respects n upper bound (clamps to 100000)', () => {
    const r = simulate({ sport: 'NFL', homeWinProbability: 0.5, n: 999_999, seed: 1 });
    expect(r.simulationCount).toBe(100_000);
  });

  it('win probs sum to approximately 1', () => {
    const r = simulate({ sport: 'NFL', homeWinProbability: 0.65, n: 10_000, seed: 7 });
    const total = r.homeWinProbability + r.awayWinProbability + r.drawProbability;
    expect(total).toBeCloseTo(1, 2);
  });

  it('higher input prob produces higher home win frequency', () => {
    const rFav = simulate({ sport: 'NFL', homeWinProbability: 0.75, n: 10_000, seed: 1 });
    const rDog = simulate({ sport: 'NFL', homeWinProbability: 0.35, n: 10_000, seed: 1 });
    expect(rFav.homeWinProbability).toBeGreaterThan(rDog.homeWinProbability);
  });

  it('produces margin percentile ordering (p10 <= p50 <= p90)', () => {
    const r = simulate({ sport: 'NBA', homeWinProbability: 0.55, n: 5_000, seed: 99 });
    expect(r.marginP10).toBeLessThanOrEqual(r.marginP25);
    expect(r.marginP25).toBeLessThanOrEqual(r.marginP50);
    expect(r.marginP50).toBeLessThanOrEqual(r.marginP75);
    expect(r.marginP75).toBeLessThanOrEqual(r.marginP90);
  });

  it('produces non-empty distributions', () => {
    const r = simulate({ sport: 'MLB', homeWinProbability: 0.55, n: 2_000, seed: 5 });
    expect(r.scoreDistribution.length).toBeGreaterThan(0);
    expect(r.marginDistribution.length).toBeGreaterThan(0);
  });

  it('reports expected home score > expected away score when homeWinProb is high', () => {
    const r = simulate({ sport: 'NFL', homeWinProbability: 0.8, n: 10_000, seed: 3 });
    expect(r.expectedHomeScore).toBeGreaterThan(r.expectedAwayScore);
  });

  it('draws happen in soccer (poisson ties are possible)', () => {
    const r = simulate({ sport: 'Soccer', homeWinProbability: 0.4, n: 20_000, seed: 11 });
    expect(r.drawProbability).toBeGreaterThan(0.1); // soccer draws are common
  });

  it('NFL draw probability is effectively 0', () => {
    const r = simulate({ sport: 'NFL', homeWinProbability: 0.5, n: 10_000, seed: 22 });
    // NFL normal distribution rarely ties exactly
    expect(r.drawProbability).toBeLessThan(0.05);
  });

  it('blowout probability is higher for very lopsided games', () => {
    const rLopsided = simulate({ sport: 'NFL', homeWinProbability: 0.9, n: 10_000, seed: 33 });
    const rClose = simulate({ sport: 'NFL', homeWinProbability: 0.52, n: 10_000, seed: 33 });
    expect(rLopsided.blowoutProbability).toBeGreaterThan(rClose.blowoutProbability);
  });

  it('runtimeMs is a non-negative number', () => {
    const r = simulate({ sport: 'NBA', homeWinProbability: 0.5, n: 1_000, seed: 1 });
    expect(r.runtimeMs).toBeGreaterThanOrEqual(0);
  });
});

describe('quickEstimate', () => {
  it('returns correct probability shape', () => {
    const r = quickEstimate('NFL', 0.6);
    expect(r.homeWinProbability).toBeGreaterThan(0);
    expect(r.awayWinProbability).toBeGreaterThan(0);
  });
});
