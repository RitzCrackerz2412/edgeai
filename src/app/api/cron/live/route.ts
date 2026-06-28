/**
 * GET /api/cron/live — live score refresh, runs every 1 minute.
 * Polls ESPN scoreboard for all in-progress games across all sports.
 */

import { NextResponse } from 'next/server';
import { getProviders } from '@/lib/providers';
import { liveStore }    from '@/lib/sync/store';
import { logger }       from '@/lib/observability/logger';
import { metrics }      from '@/lib/observability/metrics';

const LIVE_SPORTS = ['NFL', 'NBA', 'MLB', 'NHL', 'Soccer'] as const;

function authOk(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // dev mode — allow unauthenticated
  return req.headers.get('Authorization') === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authOk(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const start     = Date.now();
  const providers = getProviders();
  const today     = new Date().toISOString().split('T')[0];
  const results: Record<string, { live: number; total: number; error?: string }> = {};

  await Promise.all(
    LIVE_SPORTS.map(async sport => {
      const t0 = Date.now();
      try {
        const games = await providers.sports.getGames(sport, today);
        const live  = await liveStore.refreshLiveFromGames(games);
        // Also keep schedule cache warm
        await liveStore.setGames(sport, today, games);
        results[sport] = { live, total: games.length };
        metrics.recordProviderCall({ provider: 'ESPN', success: true, latencyMs: Date.now() - t0 });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        results[sport] = { live: 0, total: 0, error: msg };
        metrics.recordProviderCall({ provider: 'ESPN', success: false, latencyMs: Date.now() - t0 });
      }
    }),
  );

  const totalLive  = Object.values(results).reduce((s, r) => s + r.live, 0);
  const totalGames = Object.values(results).reduce((s, r) => s + r.total, 0);

  await liveStore.recordSync('live', {
    lastSyncAt:   new Date().toISOString(),
    gamesUpdated: totalLive,
    errorsCount:  Object.values(results).filter(r => r.error).length,
  });

  logger.info('[cron/live]', { totalLive, totalGames, durationMs: Date.now() - start });

  return NextResponse.json({
    ok: true,
    syncedAt: new Date().toISOString(),
    durationMs: Date.now() - start,
    liveGames: totalLive,
    results,
  });
}
