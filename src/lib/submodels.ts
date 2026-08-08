/**
 * Runtime sub-model computation for Feature 3 (Ensemble Disagreement).
 *
 * Three genuinely independent signals derived from real data already on Game:
 *   A — Recency:     last-5 H2H win rate
 *   B — Season-long: ELO win probability (same formula as engine/elo.ts)
 *   C — Historical:  all-time H2H win rate
 *
 * Ensemble average = mean(A, B, C)
 * Disagreement     = std-dev(A, B, C) in percentage points
 */

import type { Game } from './types';
import { DISAGREEMENT_THRESHOLD } from './constants';

export interface SubModelResult {
  /** Recency: last-5 H2H win rate for home team (0–100) */
  scoreA: number;
  /** Season-long: ELO-derived win probability for home team (0–100) */
  scoreB: number;
  /** Historical: all-time H2H win rate for home team (0–100) */
  scoreC: number;
  /** Human-readable data source for each model */
  labelA: string;
  labelB: string;
  labelC: string;
  /** Whether each H2H model has real data (false = defaulted to 50, excluded from ensemble) */
  hasDataA: boolean;
  hasDataC: boolean;
  /** How many models contributed to ensembleAvg (max 3, min 1) */
  activeModels: number;
  /** Mean of models that have real data only */
  ensembleAvg: number;
  /** Std dev of the three scores — higher = more disagreement */
  disagreementPct: number;
  /** True when disagreementPct > DISAGREEMENT_THRESHOLD */
  highUncertainty: boolean;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/** ELO win probability — identical formula to engine/elo.ts */
function eloWinProb(homeElo: number, awayElo: number): number {
  return 1 / (1 + Math.pow(10, (awayElo - homeElo) / 400));
}

function stdDev(values: number[]): number {
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export function computeSubModels(game: Game): SubModelResult {
  const { homeTeam, awayTeam, headToHead } = game;

  // ── Model A: recency (last 5 H2H meetings) ──────────────────────────────────
  const last5Total = headToHead.last5.home + headToHead.last5.away;
  const hasDataA   = last5Total > 0;
  const rawA       = hasDataA ? headToHead.last5.home / last5Total : 0.5;
  const scoreA     = clamp(rawA * 100, 15, 85);
  const labelA     = hasDataA
    ? `last 5 H2H: ${headToHead.last5.home}–${headToHead.last5.away}`
    : 'last 5 H2H: no data';

  // ── Model B: season-long form via ELO ratings (always has data) ──────────────
  const rawB   = eloWinProb(homeTeam.eloRating, awayTeam.eloRating);
  const scoreB = clamp(rawB * 100, 5, 95);
  const labelB = `ELO ${homeTeam.eloRating} vs ${awayTeam.eloRating}`;

  // ── Model C: all-time H2H historical record ──────────────────────────────────
  const allTotal = headToHead.allTime.home + headToHead.allTime.away;
  const hasDataC = allTotal > 0;
  const rawC     = hasDataC ? headToHead.allTime.home / allTotal : 0.5;
  const scoreC   = clamp(rawC * 100, 10, 90);
  const labelC   = hasDataC
    ? `all-time H2H: ${headToHead.allTime.home}–${headToHead.allTime.away}`
    : 'all-time H2H: no data';

  // ── Ensemble: only average models that have real data ───────────────────────
  // Model B (ELO) always contributes. A and C only contribute when H2H data exists.
  const activeScores: number[] = [scoreB];
  if (hasDataA) activeScores.push(scoreA);
  if (hasDataC) activeScores.push(scoreC);

  const activeModels   = activeScores.length;
  const ensembleAvg    = activeScores.reduce((s, v) => s + v, 0) / activeModels;

  // Disagreement still computed across all three scores so it reflects true spread
  const disagreementPct = stdDev([scoreA, scoreB, scoreC]);

  return {
    scoreA:          +scoreA.toFixed(1),
    scoreB:          +scoreB.toFixed(1),
    scoreC:          +scoreC.toFixed(1),
    labelA,
    labelB,
    labelC,
    hasDataA,
    hasDataC,
    activeModels,
    ensembleAvg:     +ensembleAvg.toFixed(1),
    disagreementPct: +disagreementPct.toFixed(1),
    highUncertainty: disagreementPct > DISAGREEMENT_THRESHOLD,
  };
}
