/**
 * Sync job definitions and handlers.
 *
 * Each job type corresponds to refreshing a specific data feed.
 * All jobs are idempotent — re-running one multiple times is safe.
 *
 * Schedule targets (for production cron):
 *   schedules      : every 4 h
 *   injuries       : every 30 min
 *   weather        : every 1 h
 *   odds           : every 5 min (pre-game)
 *   standings      : every 1 h
 *   player_stats   : every 6 h
 */

import { jobQueue } from './queue';
import { logger } from '../observability/logger';
import { metrics } from '../observability/metrics';
import type { Sport } from '../types';

// ── Job type constants ────────────────────────────────────────────────────────

export const JOB_TYPES = {
  REFRESH_SCHEDULES:    'sync:schedules',
  REFRESH_INJURIES:     'sync:injuries',
  REFRESH_WEATHER:      'sync:weather',
  REFRESH_ODDS:         'sync:odds',
  REFRESH_STANDINGS:    'sync:standings',
  REFRESH_PLAYER_STATS: 'sync:player_stats',
  REFRESH_ALL:          'sync:all',
} as const;

export type JobType = (typeof JOB_TYPES)[keyof typeof JOB_TYPES];

// ── Job payloads ──────────────────────────────────────────────────────────────

export interface SyncPayload {
  sport?: Sport;
  gameId?: string;
  force?: boolean;
}

// ── Mock sync implementations ─────────────────────────────────────────────────
// These stubs simulate calling real APIs. Replace with actual provider calls
// once API keys are configured.

async function mockFetch(provider: string, endpoint: string): Promise<void> {
  const start = Date.now();
  // Simulate network latency: 50–500 ms
  await new Promise(r => setTimeout(r, 50 + Math.random() * 450));
  // Simulate 5% failure rate to exercise retry logic
  if (Math.random() < 0.05) throw new Error(`${provider} returned 503`);
  metrics.recordProviderCall({ provider, success: true, latencyMs: Date.now() - start });
  logger.info(`Sync completed`, { route: endpoint });
}

// ── Handler registration ──────────────────────────────────────────────────────

jobQueue.register<SyncPayload>(JOB_TYPES.REFRESH_SCHEDULES, async (job) => {
  const sport = job.payload.sport ?? 'all';
  logger.info(`Refreshing schedules`, { sport: String(sport) });
  await mockFetch('SportsDataIO', `/v3/${sport}/scores/json/GamesByDate`);
});

jobQueue.register<SyncPayload>(JOB_TYPES.REFRESH_INJURIES, async (job) => {
  const sport = job.payload.sport ?? 'all';
  logger.info(`Refreshing injuries`, { sport: String(sport) });
  await mockFetch('SportsDataIO', `/v3/${sport}/injuries/json/Injuries`);
});

jobQueue.register<SyncPayload>(JOB_TYPES.REFRESH_WEATHER, async (job) => {
  logger.info(`Refreshing weather`);
  await mockFetch('OpenWeatherMap', `/data/2.5/weather`);
});

jobQueue.register<SyncPayload>(JOB_TYPES.REFRESH_ODDS, async (job) => {
  const sport = job.payload.sport ?? 'all';
  logger.info(`Refreshing odds`, { sport: String(sport) });
  await mockFetch('TheOddsAPI', `/v4/sports/${sport}/odds`);
});

jobQueue.register<SyncPayload>(JOB_TYPES.REFRESH_STANDINGS, async (job) => {
  const sport = job.payload.sport ?? 'all';
  logger.info(`Refreshing standings`, { sport: String(sport) });
  await mockFetch('SportsDataIO', `/v3/${sport}/scores/json/Standings`);
});

jobQueue.register<SyncPayload>(JOB_TYPES.REFRESH_PLAYER_STATS, async (job) => {
  const sport = job.payload.sport ?? 'all';
  logger.info(`Refreshing player stats`, { sport: String(sport) });
  await mockFetch('SportsDataIO', `/v3/${sport}/stats/json/PlayerSeasonStats`);
});

jobQueue.register<SyncPayload>(JOB_TYPES.REFRESH_ALL, async (job) => {
  const sport = job.payload.sport;
  const payload: SyncPayload = sport ? { sport } : {};
  logger.info(`Starting full sync`, { sport: String(sport ?? 'all') });

  jobQueue.enqueue(JOB_TYPES.REFRESH_SCHEDULES,    payload, { priority: 'high' });
  jobQueue.enqueue(JOB_TYPES.REFRESH_INJURIES,     payload, { priority: 'high' });
  jobQueue.enqueue(JOB_TYPES.REFRESH_WEATHER,      payload, { priority: 'normal' });
  jobQueue.enqueue(JOB_TYPES.REFRESH_ODDS,         payload, { priority: 'high' });
  jobQueue.enqueue(JOB_TYPES.REFRESH_STANDINGS,    payload, { priority: 'normal' });
  jobQueue.enqueue(JOB_TYPES.REFRESH_PLAYER_STATS, payload, { priority: 'low' });
});

// ── Convenience triggers ──────────────────────────────────────────────────────

export function scheduleFullSync(sport?: Sport): string {
  return jobQueue.enqueue(JOB_TYPES.REFRESH_ALL, { sport }, { priority: 'high' });
}

export function scheduleOddsRefresh(sport: Sport): string {
  return jobQueue.enqueue(JOB_TYPES.REFRESH_ODDS, { sport }, { priority: 'critical', maxAttempts: 5 });
}

export function scheduleInjuryRefresh(sport: Sport): string {
  return jobQueue.enqueue(JOB_TYPES.REFRESH_INJURIES, { sport }, { priority: 'high', maxAttempts: 3 });
}
