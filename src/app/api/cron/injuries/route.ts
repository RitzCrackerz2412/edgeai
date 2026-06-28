/**
 * GET /api/cron/injuries — injury & roster refresh, runs every 5 minutes.
 * Detects status changes and triggers prediction refresh via event bus.
 */

import { NextResponse } from 'next/server';
import { getProviders } from '@/lib/providers';
import { liveStore }    from '@/lib/sync/store';
import { logger }       from '@/lib/observability/logger';
import { metrics }      from '@/lib/observability/metrics';
import type { Sport }   from '@/lib/types';

const INJURY_SPORTS: Sport[] = ['NFL', 'NBA', 'MLB', 'NHL', 'NCAA Football', 'NCAA Basketball'];

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
  const results: Record<string, { count: number; changed: number; error?: string }> = {};

  await Promise.all(
    INJURY_SPORTS.map(async sport => {
      const t0 = Date.now();
      try {
        // SportsDataIO returns league-wide injuries; ESPN doesn't expose a clean injury endpoint.
        // We call with 'all' as a team hint — the provider handles the league query.
        const injuries = await providers.sports.getInjuries(sport).catch(() => []);

        // Store detects changes and fires event bus automatically
        const before = await liveStore.getInjuries(sport);
        await liveStore.setInjuries(sport, injuries);
        const after = await liveStore.getInjuries(sport);

        const changed = after.filter(a => {
          const b = before.find(p => p.playerId === a.playerId);
          return !b || b.status !== a.status;
        }).length;

        results[sport] = { count: injuries.length, changed };
        metrics.recordProviderCall({ provider: 'SportsDataIO', success: true, latencyMs: Date.now() - t0 });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        results[sport] = { count: 0, changed: 0, error: msg };
        metrics.recordProviderCall({ provider: 'SportsDataIO', success: false, latencyMs: Date.now() - t0 });
      }
    }),
  );

  const totalInjuries = Object.values(results).reduce((s, r) => s + r.count, 0);
  const totalChanged  = Object.values(results).reduce((s, r) => s + r.changed, 0);

  await liveStore.recordSync('injuries', {
    lastSyncAt:   new Date().toISOString(),
    gamesUpdated: totalChanged,
    errorsCount:  Object.values(results).filter(r => r.error).length,
  });

  logger.info('[cron/injuries]', { total: totalInjuries, changed: totalChanged, durationMs: Date.now() - start });

  return NextResponse.json({
    ok: true,
    syncedAt:   new Date().toISOString(),
    durationMs: Date.now() - start,
    totalInjuries,
    totalChanged,
    results,
  });
}
