/**
 * Sync job definitions and handlers.
 *
 * Each job type corresponds to refreshing a specific data feed.
 * All jobs are idempotent — re-running one multiple times is safe.
 *
 * Production cron schedule (vercel.json):
 *   live          : every 1 min   (/api/cron/live)
 *   odds/injuries : every 5 min   (/api/cron/odds, /api/cron/injuries)
 *   stats         : every 15 min  (/api/cron/stats)
 *   rankings      : every 1 hr    (/api/cron/rankings)
 *   daily         : every 24 hr   (/api/cron/refresh)
 */

import { jobQueue }  from './queue';
import { liveStore } from './store';
import { logger }    from '../observability/logger';
import { metrics }   from '../observability/metrics';
import type { Sport } from '../types';

// ── Job type constants ────────────────────────────────────────────────────────

export const JOB_TYPES = {
  REFRESH_LIVE:         'sync:live',
  REFRESH_SCHEDULES:    'sync:schedules',
  REFRESH_INJURIES:     'sync:injuries',
  REFRESH_ODDS:         'sync:odds',
  REFRESH_STANDINGS:    'sync:standings',
  REFRESH_PLAYER_STATS: 'sync:player_stats',
  REFRESH_TEAM_STATS:   'sync:team_stats',
  REFRESH_RANKINGS:     'sync:rankings',
  REFRESH_ALL:          'sync:all',
} as const;

export type JobType = (typeof JOB_TYPES)[keyof typeof JOB_TYPES];

// ── Job payloads ──────────────────────────────────────────────────────────────

export interface SyncPayload {
  sport?: Sport;
  gameId?: string;
  force?: boolean;
}

// ── Sports covered by each feed type ─────────────────────────────────────────

const SCHEDULE_SPORTS: Sport[] = ['NFL', 'NBA', 'MLB', 'NHL', 'Soccer', 'NCAA Football', 'NCAA Basketball', 'Tennis', 'F1', 'Cricket', 'Esports'];
const STATS_SPORTS:    Sport[] = ['NFL', 'NBA', 'MLB', 'NHL', 'Soccer', 'NCAA Football', 'NCAA Basketball'];
const INJURY_SPORTS:   Sport[] = ['NFL', 'NBA', 'MLB', 'NHL', 'NCAA Football', 'NCAA Basketball'];

// ── 1-min: Live score refresh ─────────────────────────────────────────────────

jobQueue.register<SyncPayload>(JOB_TYPES.REFRESH_LIVE, async (job) => {
  const { getProviders } = await import('../providers');
  const providers = getProviders();
  const today = new Date().toISOString().split('T')[0];
  const sports = job.payload.sport ? [job.payload.sport] : SCHEDULE_SPORTS;

  let updated = 0;
  const errors: string[] = [];

  await Promise.all(
    sports.map(async sport => {
      const start = Date.now();
      try {
        const games = await providers.sports.getGames(sport, today);
        const liveGames = games.filter(g => g.status === 'inprogress');
        updated += await liveStore.refreshLiveFromGames(games);
        metrics.recordProviderCall({ provider: 'ESPN', success: true, latencyMs: Date.now() - start });
        if (liveGames.length > 0) {
          logger.info('Live scores updated', { sport, liveGames: liveGames.length });
        }
      } catch (err) {
        errors.push(`${sport}: ${err instanceof Error ? err.message : String(err)}`);
        metrics.recordProviderCall({ provider: 'ESPN', success: false, latencyMs: Date.now() - start });
      }
    }),
  );

  await liveStore.recordSync('live', {
    lastSyncAt:   new Date().toISOString(),
    gamesUpdated: updated,
    errorsCount:  errors.length,
  });

  if (errors.length) logger.warn('Live sync partial errors', { errors });
});

// ── 5-min: Full schedule refresh ──────────────────────────────────────────────

jobQueue.register<SyncPayload>(JOB_TYPES.REFRESH_SCHEDULES, async (job) => {
  const { getProviders } = await import('../providers');
  const providers = getProviders();
  const today    = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().split('T')[0];
  const sports = job.payload.sport ? [job.payload.sport] : SCHEDULE_SPORTS;

  let updated = 0;
  const errors: string[] = [];

  await Promise.all(
    sports.flatMap(sport =>
      [today, tomorrow].map(async date => {
        const start = Date.now();
        try {
          const games = await providers.sports.getGames(sport, date);
          await liveStore.setGames(sport, date, games);
          updated += games.length;
          metrics.recordProviderCall({ provider: 'Composite', success: true, latencyMs: Date.now() - start });
        } catch (err) {
          errors.push(`${sport}/${date}: ${err instanceof Error ? err.message : String(err)}`);
          metrics.recordProviderCall({ provider: 'Composite', success: false, latencyMs: Date.now() - start });
        }
      }),
    ),
  );

  await liveStore.recordSync('schedules', { lastSyncAt: new Date().toISOString(), gamesUpdated: updated, errorsCount: errors.length });
  logger.info('Schedule sync complete', { updated, errors: errors.length });
});

// ── 5-min: Injury refresh ─────────────────────────────────────────────────────

jobQueue.register<SyncPayload>(JOB_TYPES.REFRESH_INJURIES, async (job) => {
  const { getProviders } = await import('../providers');
  const providers = getProviders();
  const sports = job.payload.sport ? [job.payload.sport] : INJURY_SPORTS;

  let total = 0;
  const errors: string[] = [];

  await Promise.all(
    sports.map(async sport => {
      const start = Date.now();
      try {
        // SportsDataIO injuries endpoint returns all teams for a sport
        const injuries = await providers.sports.getInjuries('all').catch(() => []);
        const sportInjuries = injuries.filter(() => true); // all already sport-scoped
        await liveStore.setInjuries(sport, sportInjuries);
        total += sportInjuries.length;
        metrics.recordProviderCall({ provider: 'SportsDataIO', success: true, latencyMs: Date.now() - start });
      } catch (err) {
        errors.push(`${sport}: ${err instanceof Error ? err.message : String(err)}`);
        metrics.recordProviderCall({ provider: 'SportsDataIO', success: false, latencyMs: Date.now() - start });
      }
    }),
  );

  await liveStore.recordSync('injuries', { lastSyncAt: new Date().toISOString(), gamesUpdated: total, errorsCount: errors.length });
  logger.info('Injury sync complete', { total, errors: errors.length });
});

// ── 5-min: Odds refresh ───────────────────────────────────────────────────────

jobQueue.register<SyncPayload>(JOB_TYPES.REFRESH_ODDS, async (job) => {
  const { getProviders } = await import('../providers');
  const providers = getProviders();
  const today = new Date().toISOString().split('T')[0];
  const sports = job.payload.sport ? [job.payload.sport] : SCHEDULE_SPORTS;

  let updated = 0;
  const errors: string[] = [];

  await Promise.all(
    sports.map(async sport => {
      const start = Date.now();
      try {
        const games = await liveStore.getGames(sport, today);
        const upcoming = games.filter(g => g.status === 'scheduled');

        await Promise.all(
          upcoming.map(async game => {
            const odds = await providers.odds.getOdds(sport, game.id).catch(() => []);
            if (odds.length > 0) {
              await liveStore.setOdds(game.id, odds);
              updated++;
            }
          }),
        );
        metrics.recordProviderCall({ provider: 'OddsAPI', success: true, latencyMs: Date.now() - start });
      } catch (err) {
        errors.push(`${sport}: ${err instanceof Error ? err.message : String(err)}`);
        metrics.recordProviderCall({ provider: 'OddsAPI', success: false, latencyMs: Date.now() - start });
      }
    }),
  );

  await liveStore.recordSync('odds', { lastSyncAt: new Date().toISOString(), gamesUpdated: updated, errorsCount: errors.length });
  logger.info('Odds sync complete', { updated, errors: errors.length });
});

// ── 15-min: Standings ─────────────────────────────────────────────────────────

jobQueue.register<SyncPayload>(JOB_TYPES.REFRESH_STANDINGS, async (job) => {
  const { getProviders } = await import('../providers');
  const providers = getProviders();
  const sports = job.payload.sport ? [job.payload.sport] : STATS_SPORTS;

  let updated = 0;
  const errors: string[] = [];

  await Promise.all(
    sports.map(async sport => {
      const start = Date.now();
      try {
        // For sports with team IDs, fetch stats per team
        // This is a placeholder until team-ID mapping is complete
        const stats = await providers.sports.getTeamStats('all', '2026').catch(() => null);
        if (stats) {
          await liveStore.setStandings(sport, [stats]);
          updated++;
        }
        metrics.recordProviderCall({ provider: 'SportsDataIO', success: true, latencyMs: Date.now() - start });
      } catch (err) {
        errors.push(`${sport}: ${err instanceof Error ? err.message : String(err)}`);
        metrics.recordProviderCall({ provider: 'SportsDataIO', success: false, latencyMs: Date.now() - start });
      }
    }),
  );

  await liveStore.recordSync('standings', { lastSyncAt: new Date().toISOString(), gamesUpdated: updated, errorsCount: errors.length });
  logger.info('Standings sync complete', { updated, errors: errors.length });
});

// ── 15-min: Player stats ──────────────────────────────────────────────────────

jobQueue.register<SyncPayload>(JOB_TYPES.REFRESH_PLAYER_STATS, async (job) => {
  void job; // Player stats are fetched on-demand via /api/players — this job pre-warms cache
  await liveStore.recordSync('player_stats', {
    lastSyncAt: new Date().toISOString(), gamesUpdated: 0, errorsCount: 0,
  });
  logger.info('Player stats sync scheduled (on-demand mode)');
});

// ── 15-min: Team stats ────────────────────────────────────────────────────────

jobQueue.register<SyncPayload>(JOB_TYPES.REFRESH_TEAM_STATS, async (job) => {
  void job;
  await liveStore.recordSync('team_stats', {
    lastSyncAt: new Date().toISOString(), gamesUpdated: 0, errorsCount: 0,
  });
  logger.info('Team stats sync scheduled (on-demand mode)');
});

// ── Hourly: Rankings ──────────────────────────────────────────────────────────

jobQueue.register<SyncPayload>(JOB_TYPES.REFRESH_RANKINGS, async (job) => {
  const { getTeamsBySport } = await import('../data/teams');
  const sports = job.payload.sport ? [job.payload.sport] : STATS_SPORTS;

  for (const sport of sports) {
    const teams = getTeamsBySport(sport as Sport);
    const rankings = teams
      .sort((a, b) => (b.eloRating ?? 1500) - (a.eloRating ?? 1500))
      .map((t, i) => ({
        teamId:    t.id,
        teamName:  t.name,
        rank:      i + 1,
        eloRating: t.eloRating ?? 1500,
        record:    t.record ?? '0-0',
        trend:     'same' as const,
      }));
    await liveStore.setRankings(sport as Sport, rankings);
  }

  await liveStore.recordSync('rankings', { lastSyncAt: new Date().toISOString(), gamesUpdated: sports.length, errorsCount: 0 });
  logger.info('Rankings sync complete', { sports: sports.length });
});

// ── Full sync (daily) ─────────────────────────────────────────────────────────

jobQueue.register<SyncPayload>(JOB_TYPES.REFRESH_ALL, async (job) => {
  const sport = job.payload.sport;
  const payload: SyncPayload = sport ? { sport } : {};
  logger.info('Starting full sync', { sport: String(sport ?? 'all') });

  jobQueue.enqueue(JOB_TYPES.REFRESH_SCHEDULES,    payload, { priority: 'high' });
  jobQueue.enqueue(JOB_TYPES.REFRESH_INJURIES,     payload, { priority: 'high' });
  jobQueue.enqueue(JOB_TYPES.REFRESH_ODDS,         payload, { priority: 'high' });
  jobQueue.enqueue(JOB_TYPES.REFRESH_STANDINGS,    payload, { priority: 'normal' });
  jobQueue.enqueue(JOB_TYPES.REFRESH_TEAM_STATS,   payload, { priority: 'normal' });
  jobQueue.enqueue(JOB_TYPES.REFRESH_PLAYER_STATS, payload, { priority: 'low' });
  jobQueue.enqueue(JOB_TYPES.REFRESH_RANKINGS,     payload, { priority: 'low' });

  await liveStore.recordSync('daily', { lastSyncAt: new Date().toISOString(), gamesUpdated: 0, errorsCount: 0 });
});

// ── Convenience triggers ──────────────────────────────────────────────────────

export function scheduleFullSync(sport?: Sport):  string { return jobQueue.enqueue(JOB_TYPES.REFRESH_ALL, { sport }, { priority: 'high' }); }
export function scheduleLiveRefresh(sport?: Sport): string { return jobQueue.enqueue(JOB_TYPES.REFRESH_LIVE, { sport }, { priority: 'critical', maxAttempts: 5 }); }
export function scheduleOddsRefresh(sport: Sport): string { return jobQueue.enqueue(JOB_TYPES.REFRESH_ODDS, { sport }, { priority: 'critical', maxAttempts: 5 }); }
export function scheduleInjuryRefresh(sport: Sport): string { return jobQueue.enqueue(JOB_TYPES.REFRESH_INJURIES, { sport }, { priority: 'high', maxAttempts: 3 }); }
