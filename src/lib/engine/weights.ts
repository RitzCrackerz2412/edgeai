/**
 * Dynamic model weighting.
 *
 * Tracks per-sport Brier score for each sub-model (ELO, LogReg, GBT)
 * and adjusts ensemble weights automatically so better-performing models
 * get more weight within a sport.
 *
 * Weight update rule: inverse-Brier proportional weighting with a floor
 * of 5% so no model is ever completely silenced.
 *
 * Thread-safety note: this is pure in-memory state — fine for a single
 * Node.js process. Persist to Redis / DB if you need durability.
 */

import type { Sport } from '../types';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ModelKey = 'elo' | 'logistic' | 'gbt';

export interface ModelWeights {
  elo: number;
  logistic: number;
  gbt: number;
}

export interface SportModelStats {
  brierSum: number;
  count: number;
}

// ── Default static weights (used before enough data accumulates) ──────────────

const DEFAULT_WEIGHTS: ModelWeights = { elo: 0.35, logistic: 0.65, gbt: 0.0 };
const MIN_SAMPLES_FOR_DYNAMIC = 20; // need at least 20 resolved games per sport
const FLOOR = 0.05;                  // minimum weight for any active model

// ── Weight store ──────────────────────────────────────────────────────────────

class DynamicWeightStore {
  /** stats[sport][model] */
  private stats = new Map<string, Map<ModelKey, SportModelStats>>();

  private ensureEntry(sport: Sport, model: ModelKey): SportModelStats {
    if (!this.stats.has(sport)) this.stats.set(sport, new Map());
    const sportMap = this.stats.get(sport)!;
    if (!sportMap.has(model)) sportMap.set(model, { brierSum: 0, count: 0 });
    return sportMap.get(model)!;
  }

  /**
   * Record a Brier contribution for a model's prediction.
   * @param sport  Sport the game belongs to
   * @param model  Which sub-model made this prediction
   * @param brier  Brier score for this single sample (p - y)²
   */
  record(sport: Sport, model: ModelKey, brier: number): void {
    const entry = this.ensureEntry(sport, model);
    entry.brierSum += brier;
    entry.count++;
  }

  /**
   * Returns the average Brier score for a model in a sport.
   * Returns null if fewer than MIN_SAMPLES_FOR_DYNAMIC observations.
   */
  avgBrier(sport: Sport, model: ModelKey): number | null {
    const entry = this.stats.get(sport)?.get(model);
    if (!entry || entry.count < MIN_SAMPLES_FOR_DYNAMIC) return null;
    return entry.brierSum / entry.count;
  }

  /**
   * Compute ensemble weights for the given sport.
   *
   * Uses inverse-Brier proportional weighting. If any model lacks enough
   * samples (or has weight=0 as default), falls back to DEFAULT_WEIGHTS.
   */
  getWeights(sport: Sport): ModelWeights {
    const elo = this.avgBrier(sport, 'elo');
    const logistic = this.avgBrier(sport, 'logistic');
    const gbt = this.avgBrier(sport, 'gbt');

    // Not enough data — use static defaults
    if (elo === null || logistic === null) return { ...DEFAULT_WEIGHTS };

    // GBT is optional (weight 0 until trained)
    const models: Array<{ key: ModelKey; brier: number }> = [
      { key: 'elo', brier: elo },
      { key: 'logistic', brier: logistic },
      ...(gbt !== null ? [{ key: 'gbt' as ModelKey, brier: gbt }] : []),
    ];

    // Inverse-Brier: lower Brier → higher weight
    // Avoid division by zero by clamping Brier to ≥ 0.001
    const inverseScores = models.map((m) => ({
      key: m.key,
      inv: 1 / Math.max(m.brier, 0.001),
    }));

    const total = inverseScores.reduce((s, m) => s + m.inv, 0);

    // Proportional weights, then apply floor
    const raw = inverseScores.map((m) => ({
      key: m.key,
      w: m.inv / total,
    }));

    // Apply floor and renormalize
    const floored = raw.map((m) => ({ key: m.key, w: Math.max(m.w, FLOOR) }));
    const flooredTotal = floored.reduce((s, m) => s + m.w, 0);
    const normalized = floored.map((m) => ({ key: m.key, w: m.w / flooredTotal }));

    const weights: ModelWeights = { elo: 0, logistic: 0, gbt: 0 };
    for (const { key, w } of normalized) weights[key] = w;

    return weights;
  }

  /** Full diagnostics for the feature importance dashboard */
  getStats(sport: Sport): Record<ModelKey, { avgBrier: number | null; count: number }> {
    const elo = this.stats.get(sport)?.get('elo');
    const logistic = this.stats.get(sport)?.get('logistic');
    const gbt = this.stats.get(sport)?.get('gbt');

    return {
      elo: { avgBrier: elo ? elo.brierSum / elo.count : null, count: elo?.count ?? 0 },
      logistic: { avgBrier: logistic ? logistic.brierSum / logistic.count : null, count: logistic?.count ?? 0 },
      gbt: { avgBrier: gbt ? gbt.brierSum / gbt.count : null, count: gbt?.count ?? 0 },
    };
  }

  reset(sport?: Sport): void {
    if (sport) this.stats.delete(sport);
    else this.stats.clear();
  }
}

export const weightStore = new DynamicWeightStore();
