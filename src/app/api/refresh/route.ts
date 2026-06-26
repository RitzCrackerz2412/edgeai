/**
 * POST /api/refresh
 *
 * Triggers a background data refresh for a specific game or all upcoming games.
 * Clears cached features and predictions so the next request recomputes
 * from fresh provider data.
 *
 * In production, this would be called:
 *  - By a cron job every 5-15 minutes during game days
 *  - On-demand from the admin panel
 *  - By a webhook from a sports data provider when data changes
 *
 * Request body:
 *   { gameId?: string, sport?: string, scope: 'game' | 'all' | 'sport' }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCache } from '@/lib/cache';
import { dataLogger } from '@/lib/validation/logger';
import { getUpcomingGames } from '@/lib/api';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as unknown;
    const b = (typeof body === 'object' && body !== null)
      ? body as Record<string, unknown>
      : {};

    const scope  = typeof b.scope === 'string' ? b.scope : 'all';
    const gameId = typeof b.gameId === 'string' ? b.gameId : undefined;
    const sport  = typeof b.sport === 'string' ? b.sport : undefined;

    const cache = getCache();
    const flushed: string[] = [];

    if (scope === 'game' && gameId) {
      // Flush prediction + feature caches for a single game
      await Promise.allSettled([
        cache.del(`prediction:${gameId}`),
        cache.del(`features:${gameId}`),
        cache.del(`odds:${gameId}`),
        cache.del(`weather:${gameId}`),
      ]);
      flushed.push(`prediction:${gameId}`, `features:${gameId}`, `odds:${gameId}`, `weather:${gameId}`);

    } else if (scope === 'sport' && sport) {
      // Flush all cache entries for a sport
      const games = await getUpcomingGames({ sport: sport as import('@/lib/types').Sport });
      for (const game of games) {
        await Promise.allSettled([
          cache.del(`prediction:${game.id}`),
          cache.del(`features:${game.id}`),
        ]);
        flushed.push(`prediction:${game.id}`, `features:${game.id}`);
      }

    } else {
      // Full cache flush (all prefixes)
      await Promise.allSettled([
        cache.flush('prediction:'),
        cache.flush('features:'),
        cache.flush('odds:'),
        cache.flush('weather:'),
        cache.flush('games:'),
      ]);
      flushed.push('prediction:*', 'features:*', 'odds:*', 'weather:*', 'games:*');
    }

    const cacheSize = await cache.size().catch(() => -1);

    return NextResponse.json({
      success: true,
      flushed,
      cacheSize,
      refreshedAt: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Refresh failed';
    dataLogger.log('error', 'provider_error', 'refresh', 'unknown', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET — cache health check
export async function GET() {
  const cache = getCache();
  const size  = await cache.size().catch(() => -1);
  const issues = dataLogger.getIssues({ severity: 'error' }).length;

  return NextResponse.json({
    cacheSize:   size,
    errorCount:  issues,
    recentIssues: dataLogger.getIssues().slice(-10),
    checkedAt:   new Date().toISOString(),
  });
}
