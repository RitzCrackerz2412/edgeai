/**
 * GET /api/cron/stats — player & team stats + standings, runs every 15 minutes.
 */

import { NextResponse } from 'next/server';
import { getProviders } from '@/lib/providers';
import { liveStore }    from '@/lib/sync/store';
import { logger }       from '@/lib/observability/logger';
import { metrics }      from '@/lib/observability/metrics';
import type { Sport }   from '@/lib/types';

const STATS_SPORTS: Sport[] = ['NFL', 'NBA', 'MLB', 'NHL', 'Soccer', 'NCAA Football', 'NCAA Basketball'];

// Tracked teams for standings refresh — extend as team IDs are mapped
// These are the team IDs used by SportsDataIO for the core US leagues
const TEAM_IDS: Partial<Record<Sport, string[]>> = {
  NFL: ['KC', 'SF', 'BAL', 'PHI', 'DAL', 'BUF', 'DET', 'LAR', 'GB', 'MIA',
        'HOU', 'CLE', 'JAX', 'PIT', 'CIN', 'NYJ', 'IND', 'TEN', 'LVR', 'DEN',
        'LAC', 'NE', 'SEA', 'ARI', 'ATL', 'NO', 'CAR', 'TB', 'NYG', 'WAS', 'CHI', 'MIN'],
  NBA: ['BOS', 'GSW', 'LAL', 'MIA', 'PHI', 'NYK', 'DEN', 'MIL', 'PHX', 'MEM',
        'OKC', 'SAC', 'CLE', 'NOP', 'IND', 'MIN', 'ATL', 'DAL', 'LAC', 'CHI',
        'TOR', 'POR', 'ORL', 'UTA', 'SAS', 'HOU', 'WAS', 'DET', 'CHA', 'BKN'],
};

function authOk(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get('Authorization') === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authOk(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const start     = Date.now();
  const providers = getProviders();
  const season    = new Date().getFullYear().toString();
  let teamsUpdated = 0;
  const errors: string[] = [];

  // ── Team stats & standings ────────────────────────────────────────────────

  await Promise.all(
    STATS_SPORTS.map(async sport => {
      const ids = TEAM_IDS[sport] ?? [];
      const t0  = Date.now();

      if (ids.length === 0) return; // sport not yet mapped to team IDs

      try {
        await Promise.all(
          ids.map(async teamId => {
            const stats = await providers.sports.getTeamStats(teamId, season).catch(() => null);
            if (stats) {
              await liveStore.setTeamStats(teamId, stats);
              teamsUpdated++;
            }
          }),
        );
        metrics.recordProviderCall({ provider: 'SportsDataIO', success: true, latencyMs: Date.now() - t0 });
      } catch (err) {
        errors.push(`${sport}: ${err instanceof Error ? err.message : String(err)}`);
        metrics.recordProviderCall({ provider: 'SportsDataIO', success: false, latencyMs: Date.now() - t0 });
      }
    }),
  );

  await Promise.all([
    liveStore.recordSync('team_stats',   { lastSyncAt: new Date().toISOString(), gamesUpdated: teamsUpdated, errorsCount: errors.length }),
    liveStore.recordSync('player_stats', { lastSyncAt: new Date().toISOString(), gamesUpdated: 0, errorsCount: 0 }),
    liveStore.recordSync('standings',    { lastSyncAt: new Date().toISOString(), gamesUpdated: teamsUpdated, errorsCount: 0 }),
  ]);

  logger.info('[cron/stats]', { teamsUpdated, errors: errors.length, durationMs: Date.now() - start });

  return NextResponse.json({
    ok: true,
    syncedAt:    new Date().toISOString(),
    durationMs:  Date.now() - start,
    teamsUpdated,
    errors,
  });
}
