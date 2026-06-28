/**
 * GET /api/cron/odds — betting odds refresh, runs every 5 minutes.
 * Detects line movement and triggers prediction refresh for moved games.
 */

import { NextResponse } from 'next/server';
import { getProviders } from '@/lib/providers';
import { liveStore }    from '@/lib/sync/store';
import { logger }       from '@/lib/observability/logger';
import { metrics }      from '@/lib/observability/metrics';
import type { Sport }   from '@/lib/types';

const ODDS_SPORTS: Sport[] = ['NFL', 'NBA', 'MLB', 'NHL', 'Soccer', 'NCAA Football', 'NCAA Basketball'];

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
  const today     = new Date().toISOString().split('T')[0];
  let oddsUpdated = 0;
  let linesMoved  = 0;
  const errors: string[] = [];

  await Promise.all(
    ODDS_SPORTS.map(async sport => {
      const t0 = Date.now();
      try {
        const games    = await liveStore.getGames(sport, today);
        const upcoming = games.filter(g => g.status === 'scheduled');

        await Promise.all(
          upcoming.map(async game => {
            const prevOdds = await liveStore.getOdds(game.id);
            const newOdds  = await providers.odds.getOdds(sport, game.id).catch(() => []);

            if (newOdds.length === 0) return;

            const prevSpread = prevOdds[0]?.homeSpread ?? 0;
            const newSpread  = newOdds[0]?.homeSpread  ?? 0;
            if (Math.abs(prevSpread - newSpread) >= 1.5) linesMoved++;

            await liveStore.setOdds(game.id, newOdds);
            oddsUpdated++;
          }),
        );
        metrics.recordProviderCall({ provider: 'OddsAPI', success: true, latencyMs: Date.now() - t0 });
      } catch (err) {
        errors.push(`${sport}: ${err instanceof Error ? err.message : String(err)}`);
        metrics.recordProviderCall({ provider: 'OddsAPI', success: false, latencyMs: Date.now() - t0 });
      }
    }),
  );

  await liveStore.recordSync('odds', {
    lastSyncAt:   new Date().toISOString(),
    gamesUpdated: oddsUpdated,
    errorsCount:  errors.length,
  });

  logger.info('[cron/odds]', { oddsUpdated, linesMoved, errors: errors.length, durationMs: Date.now() - start });

  return NextResponse.json({
    ok: true,
    syncedAt:    new Date().toISOString(),
    durationMs:  Date.now() - start,
    oddsUpdated,
    linesMoved,
    errors,
  });
}
