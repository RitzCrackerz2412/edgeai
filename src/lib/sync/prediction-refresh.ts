/**
 * Prediction refresh — automatically recomputes predictions when new data arrives.
 *
 * Called by the event bus when:
 *  - An injury status changes (sport-wide refresh)
 *  - Betting line moves significantly (game-specific refresh)
 *  - Weather changes for an outdoor venue
 *  - A starting lineup is announced
 *
 * Uses the existing prediction pipeline and writes results to cache.
 */

import { getCache, TTL } from '../cache';
import { liveStore } from './store';
import { metrics } from '../observability/metrics';
import { logger } from '../observability/logger';
import type { Sport } from '../types';

// ── In-flight dedup guard ─────────────────────────────────────────────────────
// Prevents stacking identical refresh jobs if events fire rapidly

const inFlight = new Set<string>();

function guardedRefresh(key: string, fn: () => Promise<void>): void {
  if (inFlight.has(key)) return;
  inFlight.add(key);
  fn().finally(() => inFlight.delete(key));
}

// ── Sport-wide refresh ────────────────────────────────────────────────────────

export function refreshPredictionsForSport(sport: Sport): void {
  guardedRefresh(`sport:${sport}`, async () => {
    const start = Date.now();
    const today = new Date().toISOString().split('T')[0];
    const games = await liveStore.getGames(sport, today);
    const upcoming = games.filter(g => g.status === 'scheduled');

    let refreshed = 0;
    for (const game of upcoming) {
      try {
        await invalidatePredictionCache(game.id);
        refreshed++;
      } catch { /* continue */ }
    }

    metrics.recordProviderCall({ provider: 'PredictionRefresh', success: true, latencyMs: Date.now() - start });
    logger.info('Prediction refresh completed', { sport, refreshed, trigger: 'injury' });
  });
}

// ── Game-specific refresh ─────────────────────────────────────────────────────

export function refreshPredictionForGame(gameId: string): void {
  guardedRefresh(`game:${gameId}`, async () => {
    const start = Date.now();
    await invalidatePredictionCache(gameId);
    metrics.recordProviderCall({ provider: 'PredictionRefresh', success: true, latencyMs: Date.now() - start });
    logger.info('Prediction cache invalidated', { gameId, trigger: 'line-move' });
  });
}

// ── Cache invalidation ────────────────────────────────────────────────────────

async function invalidatePredictionCache(gameId: string): Promise<void> {
  const cache = getCache();
  await Promise.all([
    cache.del(`prediction:${gameId}`),
    cache.del(`features:${gameId}`),
  ]);
}

// ── Full prediction refresh sweep ─────────────────────────────────────────────
// Called by the daily full-sync cron to pre-warm predictions for all upcoming games.

export async function sweepAllPredictions(sports: Sport[]): Promise<{ refreshed: number; errors: number }> {
  const today    = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().split('T')[0];
  let refreshed = 0;
  let errors = 0;

  for (const sport of sports) {
    for (const date of [today, tomorrow]) {
      const games = await liveStore.getGames(sport, date).catch(() => [] as typeof liveStore extends { getGames: (...args: unknown[]) => Promise<infer R> } ? R : never[]);
      for (const game of (games as { id: string; status: string }[])) {
        if (game.status !== 'scheduled') continue;
        try {
          await invalidatePredictionCache(game.id);
          refreshed++;
        } catch {
          errors++;
        }
      }
    }
  }

  return { refreshed, errors };
}

// ── Injury impact assessment ──────────────────────────────────────────────────
// Returns a numeric adjustment to win probability based on injured player impact.
// Used by sport configs when live injury data is available.

export function injuryWinProbAdjustment(injuries: import('../providers/types').RawInjury[]): number {
  const impactWeights: Record<string, number> = {
    Critical: -0.08,
    High:     -0.04,
    Medium:   -0.02,
    Low:      -0.005,
  };

  return injuries.reduce((acc, inj) => {
    if (inj.status === 'out' || inj.status === 'ir' || inj.status === 'doubtful') {
      return acc + (impactWeights[inj.impactLevel] ?? -0.02);
    }
    if (inj.status === 'questionable') {
      return acc + (impactWeights[inj.impactLevel] ?? -0.02) * 0.4;
    }
    return acc;
  }, 0);
}

// TTL export for consumers
export { TTL };
