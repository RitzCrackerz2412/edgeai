import { describe, it, expect } from 'vitest';
import {
  clamp,
  minMax,
  momentumFromSequence,
  streakValue,
  winRateFromRecord,
  restFatigueScore,
  travelFatigueScore,
  weatherScore,
  injuryImpactScore,
  americanToImplied,
  devig,
  eloDiffToProb,
} from '../normalize';

describe('clamp', () => {
  it('clamps below min', () => expect(clamp(-5, 0, 1)).toBe(0));
  it('clamps above max', () => expect(clamp(2, 0, 1)).toBe(1));
  it('passes through within range', () => expect(clamp(0.5, 0, 1)).toBe(0.5));
  it('handles min == max', () => expect(clamp(0.3, 0.5, 0.5)).toBe(0.5));
});

describe('minMax', () => {
  it('returns 0 at min', () => expect(minMax(0, 0, 10)).toBe(0));
  it('returns 1 at max', () => expect(minMax(10, 0, 10)).toBe(1));
  it('returns 0.5 at midpoint', () => expect(minMax(5, 0, 10)).toBeCloseTo(0.5));
  it('clamps below range', () => expect(minMax(-1, 0, 10)).toBe(0));
  it('clamps above range', () => expect(minMax(15, 0, 10)).toBe(1));
});

describe('momentumFromSequence', () => {
  // Index 0 = most recent game. Output is a win rate in [0, 1].
  it('returns 0.5 for empty sequence (neutral default)', () => {
    expect(momentumFromSequence([])).toBe(0.5);
  });

  it('returns 1 for all wins', () => {
    const m = momentumFromSequence(['W', 'W', 'W', 'W', 'W']);
    expect(m).toBeCloseTo(1, 5);
  });

  it('returns 0 for all losses', () => {
    const m = momentumFromSequence(['L', 'L', 'L', 'L', 'L']);
    expect(m).toBeCloseTo(0, 5);
  });

  it('most recent game (index 0) weighted more heavily than older games', () => {
    // Same wins/losses, different order: recent W vs recent L
    // ['W', 'L', 'W', 'L'] — most recent W
    // ['L', 'W', 'L', 'W'] — most recent L
    const recentW = momentumFromSequence(['W', 'L', 'W', 'L']);
    const recentL = momentumFromSequence(['L', 'W', 'L', 'W']);
    expect(recentW).toBeGreaterThan(recentL);
  });

  it('returns value in [0, 1]', () => {
    const seq: ('W' | 'L')[] = ['W', 'L', 'W', 'W', 'L'];
    const v = momentumFromSequence(seq);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('streakValue', () => {
  it('returns 1 for 10-game win streak', () => {
    const v = streakValue(['W', 'W', 'W', 'W', 'W', 'W', 'W', 'W', 'W', 'W']);
    expect(v).toBeCloseTo(1, 5);
  });

  it('returns -1 for 10-game loss streak', () => {
    const v = streakValue(['L', 'L', 'L', 'L', 'L', 'L', 'L', 'L', 'L', 'L']);
    expect(v).toBeCloseTo(-1, 5);
  });

  it('counts the leading streak from most-recent game (index 0)', () => {
    // Most-recent is W, then L — streak = 1
    const v = streakValue(['W', 'L', 'W', 'W']);
    expect(v).toBeCloseTo(0.1, 5); // 1/maxStreak(10) = 0.1
  });

  it('returns 0 for empty sequence', () => {
    expect(streakValue([])).toBe(0);
  });
});

describe('winRateFromRecord', () => {
  it('parses W-L format', () => {
    expect(winRateFromRecord('11-4')).toBeCloseTo(11 / 15, 4);
  });

  it('parses W-L-T format (ties count as 0.5 wins)', () => {
    // wins=8, losses=4, draws=4, total=16 → (8 + 0.5*4)/16 = 10/16 = 0.625
    expect(winRateFromRecord('8-4-4')).toBeCloseTo(0.625, 4);
  });

  it('returns 0.5 for 0-0', () => {
    expect(winRateFromRecord('0-0')).toBeCloseTo(0.5, 4);
  });

  it('returns 1 for undefeated record', () => {
    expect(winRateFromRecord('10-0')).toBeCloseTo(1.0, 4);
  });
});

describe('restFatigueScore', () => {
  it('returns 1 for 7+ days rest', () => {
    expect(restFatigueScore(7)).toBe(1);
    expect(restFatigueScore(14)).toBe(1);
  });

  it('returns lower score for fewer rest days', () => {
    const noRest = restFatigueScore(0);
    const rested = restFatigueScore(5);
    expect(noRest).toBeLessThan(rested);
  });

  it('returns value in [0, 1]', () => {
    for (const d of [0, 1, 2, 3, 4, 5, 6, 7]) {
      const v = restFatigueScore(d);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
});

describe('travelFatigueScore', () => {
  // Convention: 0 = no fatigue (no travel), higher = more fatigue.
  it('returns 0 for no travel (km = 0)', () => {
    expect(travelFatigueScore(0)).toBe(0);
  });

  it('returns higher score for more travel', () => {
    const local = travelFatigueScore(100);
    const crossCountry = travelFatigueScore(3000);
    expect(crossCountry).toBeGreaterThan(local);
  });

  it('returns value in [0, 1]', () => {
    for (const km of [0, 500, 1000, 2000, 5000]) {
      const v = travelFatigueScore(km);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
});

describe('weatherScore', () => {
  it('returns a high value for ideal conditions (>= 0.9)', () => {
    expect(weatherScore(65, 5, 0, false)).toBeGreaterThan(0.9);
  });

  it('returns 1 for indoor games regardless of conditions', () => {
    expect(weatherScore(-10, 50, 100, true)).toBe(1);
  });

  it('returns lower score for extreme conditions', () => {
    const good = weatherScore(65, 5, 0, false);
    const bad = weatherScore(15, 40, 50, false);
    expect(good).toBeGreaterThan(bad);
  });

  it('returns value in [0, 1]', () => {
    const v = weatherScore(30, 30, 20, false);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('injuryImpactScore', () => {
  // Convention: 1 = fully healthy team, lower = more injuries.
  it('returns 1 for empty list (fully healthy)', () => {
    expect(injuryImpactScore([])).toBe(1);
  });

  it('returns 1 for 100% available players', () => {
    const v = injuryImpactScore([
      { availability: 1.0, teamImpact: 0.8 },
      { availability: 1.0, teamImpact: 0.4 },
    ]);
    expect(v).toBeCloseTo(1, 5);
  });

  it('returns < 1 when some players are unavailable', () => {
    const v = injuryImpactScore([{ availability: 0.0, teamImpact: 0.8 }]);
    expect(v).toBeLessThan(1);
  });

  it('returns lower score for more severe injuries', () => {
    const minor = injuryImpactScore([{ availability: 0.5, teamImpact: 0.2 }]);
    const severe = injuryImpactScore([
      { availability: 0.0, teamImpact: 0.9 },
      { availability: 0.0, teamImpact: 0.5 },
    ]);
    expect(severe).toBeLessThan(minor);
  });

  it('returns value in [0, 1]', () => {
    const v = injuryImpactScore([
      { availability: 0.3, teamImpact: 0.7 },
      { availability: 0.8, teamImpact: 0.3 },
    ]);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe('americanToImplied', () => {
  it('converts +100 to 50% implied probability', () => {
    expect(americanToImplied(100)).toBeCloseTo(0.5, 3);
  });

  it('converts -110 to ~52.4% implied probability', () => {
    expect(americanToImplied(-110)).toBeCloseTo(0.524, 2);
  });

  it('converts -200 to ~66.7% implied probability', () => {
    expect(americanToImplied(-200)).toBeCloseTo(0.667, 2);
  });
});

describe('devig', () => {
  it('removes vig from equal odds', () => {
    const result = devig(-110, -110);
    expect(result.home).toBeCloseTo(0.5, 2);
    expect(result.away).toBeCloseTo(0.5, 2);
    expect(result.home + result.away).toBeCloseTo(1.0, 4);
  });

  it('produces probabilities that sum to 1', () => {
    const result = devig(-150, +130);
    expect(result.home + result.away).toBeCloseTo(1.0, 4);
  });
});

describe('eloDiffToProb', () => {
  it('returns 0.5 for 0 difference', () => {
    expect(eloDiffToProb(0)).toBeCloseTo(0.5, 5);
  });

  it('returns > 0.5 for positive diff', () => {
    expect(eloDiffToProb(100)).toBeGreaterThan(0.5);
  });

  it('is symmetric: p(d) + p(-d) = 1', () => {
    const p = eloDiffToProb(200);
    const q = eloDiffToProb(-200);
    expect(p + q).toBeCloseTo(1.0, 5);
  });
});
