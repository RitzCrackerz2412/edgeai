/**
 * +EV calculation engine for PrizePicks line comparison.
 *
 * Methodology (from video "How to Beat PrizePicks With Math"):
 * 1. Collect Over/Under odds for a player prop from sharp sportsbooks
 * 2. Remove vig using the ratio method to get true/fair probability
 * 3. PrizePicks prices all props at ~50/50 (flat payouts per leg)
 *    → any prop where no-vig prob > 50% is +EV on PrizePicks
 * 4. Breakeven % = payout-multiplier^(-1/legs) per Power Play size
 */

import type {
  PlayerProp,
  PropEVAnalysis,
  EVRating,
} from './types';

const MULTIPLIERS: Record<number, number> = { 2: 3, 3: 5, 4: 10, 5: 20, 6: 25 };

// ── Odds math ─────────────────────────────────────────────────────────────────

export function americanToDecimal(american: number): number {
  if (american > 0) return american / 100 + 1;
  return 100 / Math.abs(american) + 1;
}

export function americanToImplied(american: number): number {
  return 1 / americanToDecimal(american);
}

/**
 * Remove vig from a two-sided market (Over / Under) using the ratio method.
 * Returns true probabilities that sum to 100%.
 */
export function noVigProbs(overOdds: number, underOdds: number): {
  overPct: number;
  underPct: number;
  vigPct: number;
} {
  const impliedOver  = americanToImplied(overOdds);
  const impliedUnder = americanToImplied(underOdds);
  const total        = impliedOver + impliedUnder;
  const vigPct       = (total - 1) * 100;

  return {
    overPct:  (impliedOver  / total) * 100,
    underPct: (impliedUnder / total) * 100,
    vigPct,
  };
}

/**
 * Edge vs PrizePicks's implied 50% per leg.
 * Positive value = +EV on PrizePicks.
 */
export function evEdge(noVigPct: number): number {
  return +(noVigPct - 50).toFixed(2);
}

/**
 * Breakeven win % required per leg for a PrizePicks Power Play to break even.
 * Formula: p = (1/multiplier)^(1/legs)
 */
export function breakevenByLegs(): Record<number, number> {
  const result: Record<number, number> = {};
  for (const [legsStr, mult] of Object.entries(MULTIPLIERS)) {
    const legs = Number(legsStr);
    result[legs] = +((Math.pow(1 / mult, 1 / legs)) * 100).toFixed(1);
  }
  return result;
}

// ── Rating ────────────────────────────────────────────────────────────────────

function rateEdge(edgePct: number): EVRating {
  if (edgePct >= 8)  return 'strong';
  if (edgePct >= 5)  return 'good';
  if (edgePct >= 2)  return 'lean';
  if (edgePct >= 0)  return 'neutral';
  return 'fade';
}

// ── Slip recommendation ───────────────────────────────────────────────────────

function recommendSlip(edgePct: number, noVigPct: number): {
  recommendation: 'Power' | 'Flex' | 'Skip';
  reason: string;
} {
  const breakeven2 = breakevenByLegs()[2]; // ~57.7%
  if (noVigPct >= breakeven2 + 3) {
    return { recommendation: 'Power', reason: `No-vig prob ${noVigPct.toFixed(1)}% comfortably clears the ${breakeven2}% 2-leg Power Play breakeven — high-confidence power pick.` };
  }
  if (edgePct >= 3) {
    return { recommendation: 'Flex', reason: `${edgePct.toFixed(1)}% edge over PrizePicks 50% baseline — best used in a Flex Play to absorb variance.` };
  }
  if (edgePct >= 0) {
    return { recommendation: 'Flex', reason: `Marginal ${edgePct.toFixed(1)}% edge — only include in a Flex Play with other strong legs.` };
  }
  return { recommendation: 'Skip', reason: `No-vig prob ${noVigPct.toFixed(1)}% is below 50% on this side — avoid.` };
}

// ── Main analysis function ────────────────────────────────────────────────────

export function analyzeProp(prop: PlayerProp): PropEVAnalysis {
  const { overPct, underPct, vigPct } = noVigProbs(prop.overOdds, prop.underOdds);
  const breakeven = breakevenByLegs();

  const overEdge  = evEdge(overPct);
  const underEdge = evEdge(underPct);

  const bestSide    = overEdge >= underEdge ? 'Over' : 'Under';
  const bestEdgePct = Math.max(overEdge, underEdge);
  const bestNoVig   = bestSide === 'Over' ? overPct : underPct;

  const rating = rateEdge(bestEdgePct);
  const { recommendation: slipRecommendation, reason: slipReason } = recommendSlip(bestEdgePct, bestNoVig);

  return {
    ...prop,
    noVigOverPct:  +overPct.toFixed(2),
    noVigUnderPct: +underPct.toFixed(2),
    vigPct:        +vigPct.toFixed(2),
    overEdgePct:   overEdge,
    underEdgePct:  underEdge,
    bestSide,
    bestEdgePct:   +bestEdgePct.toFixed(2),
    rating,
    breakeven,
    slipRecommendation,
    slipReason,
  };
}
