/**
 * Monte Carlo simulation engine.
 *
 * Runs N simulated games to produce score and margin distributions.
 * Supports deterministic output via seeded PRNG for reproducibility.
 *
 * Architecture:
 *  - Mulberry32 PRNG (fast, good statistical properties)
 *  - Normal distribution via Box-Muller transform (NFL, NBA)
 *  - Poisson distribution via Knuth's algorithm (MLB, NHL, Soccer)
 *  - Sport-specific score parameterization calibrated to historical averages
 *
 * The predicted win probability from the ensemble model drives the
 * expected score differential — the simulation is consistent with it.
 */

import type { Sport } from '../types';

// ── Seeded PRNG (Mulberry32) ──────────────────────────────────────────────────

export function createRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s += 0x6D2B79F5;
    let t = Math.imul(s ^ (s >>> 15), s | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Statistical distributions ─────────────────────────────────────────────────

/** Box-Muller transform: Normal(mean, std) */
export function normalSample(rng: () => number, mean: number, std: number): number {
  let u1: number;
  do { u1 = rng(); } while (u1 === 0); // avoid log(0)
  const u2 = rng();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + std * z;
}

/** Knuth's algorithm: Poisson(lambda). For lambda < 30, use direct method. */
export function poissonSample(rng: () => number, lambda: number): number {
  if (lambda <= 0) return 0;
  // For large lambda, use Normal approximation
  if (lambda > 30) {
    return Math.max(0, Math.round(normalSample(rng, lambda, Math.sqrt(lambda))));
  }
  const L = Math.exp(-lambda);
  let k = 0, p = 1;
  do { k++; p *= rng(); } while (p > L);
  return k - 1;
}

// ── Sport-specific parameters ─────────────────────────────────────────────────

interface SportParams {
  type: 'normal' | 'poisson';
  /** Base mean scores (before win-probability adjustment) */
  homeMean: number;
  awayMean: number;
  /** Standard deviation (Normal only) */
  homeSd: number;
  awaySd: number;
  /** "Points per logit unit" — how much win probability shifts expected score diff */
  logitToPoints: number;
  /** Overtime threshold: margin ≤ this is "close game / OT possible" */
  otMarginThreshold: number;
  /** Blowout threshold: margin ≥ this */
  blowoutMarginThreshold: number;
  /** Minimum possible score (e.g. 0 goals, but NFL usually ≥ 0) */
  minScore: number;
  /** Maximum realistic score for histogram bounds */
  maxScore: number;
}

const SPORT_PARAMS: Record<string, SportParams> = {
  NFL: {
    type: 'normal', homeMean: 23.5, awayMean: 21.5, homeSd: 9.8, awaySd: 9.8,
    logitToPoints: 7, otMarginThreshold: 7, blowoutMarginThreshold: 21, minScore: 0, maxScore: 60,
  },
  NBA: {
    type: 'normal', homeMean: 113, awayMean: 109, homeSd: 11, awaySd: 11,
    logitToPoints: 15, otMarginThreshold: 10, blowoutMarginThreshold: 25, minScore: 80, maxScore: 150,
  },
  MLB: {
    type: 'poisson', homeMean: 4.3, awayMean: 4.0, homeSd: 0, awaySd: 0,
    logitToPoints: 1.5, otMarginThreshold: 0, blowoutMarginThreshold: 6, minScore: 0, maxScore: 20,
  },
  NHL: {
    type: 'poisson', homeMean: 3.1, awayMean: 2.8, homeSd: 0, awaySd: 0,
    logitToPoints: 0.8, otMarginThreshold: 0, blowoutMarginThreshold: 4, minScore: 0, maxScore: 12,
  },
  Soccer: {
    type: 'poisson', homeMean: 1.55, awayMean: 1.20, homeSd: 0, awaySd: 0,
    logitToPoints: 0.4, otMarginThreshold: 0, blowoutMarginThreshold: 3, minScore: 0, maxScore: 8,
  },
  UFC: {
    type: 'normal', homeMean: 0, awayMean: 0, homeSd: 0, awaySd: 0,
    logitToPoints: 0, otMarginThreshold: 0, blowoutMarginThreshold: 0, minScore: 0, maxScore: 0,
  },
  default: {
    type: 'normal', homeMean: 50, awayMean: 47, homeSd: 12, awaySd: 12,
    logitToPoints: 10, otMarginThreshold: 5, blowoutMarginThreshold: 20, minScore: 0, maxScore: 120,
  },
};

function getParams(sport: Sport): SportParams {
  return SPORT_PARAMS[sport] ?? SPORT_PARAMS.default;
}

// ── Win-probability-adjusted score means ─────────────────────────────────────
//
// The predicted probability determines the EXPECTED differential, not the
// absolute scores. We shift both means symmetrically around their midpoint.

function adjustedMeans(
  p: SportParams,
  homeWinProb: number,
): { homeMean: number; awayMean: number } {
  // Logit of the win probability
  const prob = Math.max(0.05, Math.min(0.95, homeWinProb));
  const logit = Math.log(prob / (1 - prob));
  const adj = (logit * p.logitToPoints) / 2;

  return {
    homeMean: p.homeMean + adj,
    awayMean: p.awayMean - adj,
  };
}

// ── Simulation input/output ────────────────────────────────────────────────────

export interface SimulationInput {
  sport: Sport;
  homeWinProbability: number;    // from ensemble model (0-1)
  expectedHomeScore?: number;    // optional; used to anchor means if provided
  expectedAwayScore?: number;
  seed?: number;                 // for reproducibility (default: Date.now())
  n?: number;                    // number of simulations (default: 10 000)
}

export interface ScoreBucket {
  score: number;
  homePct: number;  // % of simulations where home team scored exactly this
  awayPct: number;
}

export interface MarginBucket {
  margin: number;   // home - away
  frequency: number; // fraction of simulations
}

export interface SimulationResult {
  // Core probabilities
  homeWinProbability: number;
  awayWinProbability: number;
  drawProbability: number;
  overtimeProbability: number;
  blowoutProbability: number;

  // Score expectations
  expectedHomeScore: number;
  expectedAwayScore: number;
  expectedMargin: number;

  // Margin percentiles
  marginP10: number;
  marginP25: number;
  marginP50: number;
  marginP75: number;
  marginP90: number;

  // Histogram data (for UI charts)
  scoreDistribution: ScoreBucket[];
  marginDistribution: MarginBucket[];

  // Metadata
  simulationCount: number;
  seed: number;
  runtimeMs: number;
}

// ── Main simulation function ──────────────────────────────────────────────────

export function simulate(input: SimulationInput): SimulationResult {
  const t0 = Date.now();
  const n = Math.min(Math.max(input.n ?? 10_000, 1_000), 100_000);
  const seed = input.seed ?? (Date.now() & 0xFFFFFFFF);
  const rng = createRng(seed);
  const p = getParams(input.sport);

  let { homeMean, awayMean } = adjustedMeans(p, input.homeWinProbability);

  // If caller provides explicit expected scores, use those as means
  if (input.expectedHomeScore !== undefined) homeMean = input.expectedHomeScore;
  if (input.expectedAwayScore !== undefined) awayMean = input.expectedAwayScore;

  // Counters
  let homeWins = 0, awayWins = 0, draws = 0;
  let overtime = 0, blowouts = 0;

  const homeScores: number[] = new Array(n);
  const awayScores: number[] = new Array(n);

  for (let i = 0; i < n; i++) {
    let hs: number, as_: number;

    if (p.type === 'poisson') {
      hs = poissonSample(rng, Math.max(0.1, homeMean));
      as_ = poissonSample(rng, Math.max(0.1, awayMean));
    } else {
      hs = Math.max(p.minScore, Math.round(normalSample(rng, homeMean, p.homeSd)));
      as_ = Math.max(p.minScore, Math.round(normalSample(rng, awayMean, p.awaySd)));
    }

    homeScores[i] = hs;
    awayScores[i] = as_;

    const margin = hs - as_;
    if (margin > 0) homeWins++;
    else if (margin < 0) awayWins++;
    else draws++;

    if (p.otMarginThreshold > 0 && Math.abs(margin) <= p.otMarginThreshold) overtime++;
    if (Math.abs(margin) >= p.blowoutMarginThreshold) blowouts++;
  }

  // ── Percentiles of margin ────────────────────────────────────────────────
  const margins = homeScores.map((h, i) => h - awayScores[i]);
  margins.sort((a, b) => a - b);

  function percentile(arr: number[], p: number): number {
    const idx = Math.floor(arr.length * p / 100);
    return arr[Math.min(idx, arr.length - 1)];
  }

  // ── Score distribution histogram ─────────────────────────────────────────

  const scoreCounts = new Map<number, { home: number; away: number }>();
  for (let i = 0; i < n; i++) {
    const hs = homeScores[i], as_ = awayScores[i];
    const hEntry = scoreCounts.get(hs) ?? { home: 0, away: 0 };
    hEntry.home++;
    scoreCounts.set(hs, hEntry);
    const aEntry = scoreCounts.get(as_) ?? { home: 0, away: 0 };
    aEntry.away++;
    scoreCounts.set(as_, aEntry);
  }

  const scoreDistribution: ScoreBucket[] = Array.from(scoreCounts.entries())
    .filter(([s]) => s >= p.minScore && s <= p.maxScore)
    .map(([score, counts]) => ({
      score,
      homePct: counts.home / n,
      awayPct: counts.away / n,
    }))
    .sort((a, b) => a.score - b.score);

  // ── Margin distribution histogram (binned by 3 for NFL, 1 for others) ────

  const binSize = input.sport === 'NFL' ? 3 : input.sport === 'NBA' ? 5 : 1;
  const marginCounts = new Map<number, number>();
  for (const m of margins) {
    const bin = Math.round(m / binSize) * binSize;
    marginCounts.set(bin, (marginCounts.get(bin) ?? 0) + 1);
  }

  const marginDistribution: MarginBucket[] = Array.from(marginCounts.entries())
    .map(([margin, count]) => ({ margin, frequency: count / n }))
    .sort((a, b) => a.margin - b.margin);

  // ── Expected scores ───────────────────────────────────────────────────────

  const sumHome = homeScores.reduce((s, x) => s + x, 0);
  const sumAway = awayScores.reduce((s, x) => s + x, 0);

  return {
    homeWinProbability: homeWins / n,
    awayWinProbability: awayWins / n,
    drawProbability: draws / n,
    overtimeProbability: overtime / n,
    blowoutProbability: blowouts / n,
    expectedHomeScore: sumHome / n,
    expectedAwayScore: sumAway / n,
    expectedMargin: (sumHome - sumAway) / n,
    marginP10: percentile(margins, 10),
    marginP25: percentile(margins, 25),
    marginP50: percentile(margins, 50),
    marginP75: percentile(margins, 75),
    marginP90: percentile(margins, 90),
    scoreDistribution,
    marginDistribution,
    simulationCount: n,
    seed,
    runtimeMs: Date.now() - t0,
  };
}

// ── Quick probability estimate (1 000 sims, fast) ────────────────────────────

export function quickEstimate(sport: Sport, homeWinProb: number): Pick<SimulationResult,
  'homeWinProbability' | 'awayWinProbability' | 'drawProbability' |
  'overtimeProbability' | 'blowoutProbability'
> {
  const r = simulate({ sport, homeWinProbability: homeWinProb, n: 1_000, seed: 42 });
  return {
    homeWinProbability: r.homeWinProbability,
    awayWinProbability: r.awayWinProbability,
    drawProbability: r.drawProbability,
    overtimeProbability: r.overtimeProbability,
    blowoutProbability: r.blowoutProbability,
  };
}
