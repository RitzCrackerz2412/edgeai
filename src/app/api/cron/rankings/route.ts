/**
 * GET /api/cron/rankings — power rankings refresh, runs every hour.
 * Derives ELO-sorted rankings from team data and publishes to the live store.
 */

import { NextResponse } from 'next/server';
import { liveStore }    from '@/lib/sync/store';
import { getTeamsBySport } from '@/lib/data/teams';
import { logger }       from '@/lib/observability/logger';
import type { Sport }   from '@/lib/types';

const RANKING_SPORTS: Sport[] = [
  'NFL', 'NBA', 'MLB', 'NHL', 'Soccer',
  'NCAA Football', 'NCAA Basketball', 'UFC', 'Boxing', 'Tennis', 'F1', 'Cricket', 'Esports',
];

function authOk(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get('Authorization') === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authOk(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const start = Date.now();
  const results: Record<string, number> = {};

  await Promise.all(
    RANKING_SPORTS.map(async sport => {
      try {
        const teams = getTeamsBySport(sport);
        if (teams.length === 0) return;

        // Sort by ELO descending, assign ranks, detect trends (static for now)
        const sorted = [...teams].sort((a, b) => (b.eloRating ?? 1500) - (a.eloRating ?? 1500));

        const rankings = sorted.map((t, i) => ({
          teamId:    t.id,
          teamName:  t.name,
          rank:      i + 1,
          eloRating: t.eloRating ?? 1500,
          record:    t.record ?? '0-0',
          trend:     'same' as const,
        }));

        await liveStore.setRankings(sport, rankings);
        results[sport] = rankings.length;
      } catch {
        results[sport] = 0;
      }
    }),
  );

  await liveStore.recordSync('rankings', {
    lastSyncAt:   new Date().toISOString(),
    gamesUpdated: Object.values(results).reduce((s, n) => s + n, 0),
    errorsCount:  0,
  });

  logger.info('[cron/rankings]', { sports: RANKING_SPORTS.length, durationMs: Date.now() - start });

  return NextResponse.json({
    ok: true,
    syncedAt:   new Date().toISOString(),
    durationMs: Date.now() - start,
    results,
  });
}
