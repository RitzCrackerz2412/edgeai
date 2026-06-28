/**
 * GET /api/sync/status — sync health snapshot for the monitoring dashboard and client hooks.
 *
 * Returns last-sync timestamps, live game counts, provider health, and queue stats.
 * Accessible without auth (summary data only — no sensitive info).
 */

import { NextResponse }    from 'next/server';
import { liveStore }       from '@/lib/sync/store';
import { jobQueue }        from '@/lib/sync/queue';
import { getAllBreakerStatuses } from '@/lib/providers';
import { metrics }         from '@/lib/observability/metrics';
import { syncBus }         from '@/lib/sync/event-bus';

const SCHEDULE_SPORTS = ['NFL', 'NBA', 'MLB', 'NHL', 'Soccer', 'NCAA Football', 'NCAA Basketball'] as const;

export async function GET() {
  const [syncMeta, queueStats, breakerStatuses] = await Promise.all([
    liveStore.getAllSyncMeta(),
    Promise.resolve(jobQueue.getStats()),
    Promise.resolve(getAllBreakerStatuses()),
  ]);

  // Count live and upcoming games across all cached sports
  const today    = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().split('T')[0];

  const gameCounts = await Promise.all(
    SCHEDULE_SPORTS.map(async sport => {
      const [todayGames, tomorrowGames] = await Promise.all([
        liveStore.getGames(sport, today),
        liveStore.getGames(sport, tomorrow),
      ]);
      const live     = todayGames.filter(g => g.status === 'inprogress').length;
      const upcoming = todayGames.filter(g => g.status === 'scheduled').length
                     + tomorrowGames.filter(g => g.status === 'scheduled').length;
      const final    = todayGames.filter(g => g.status === 'closed').length;
      return { sport, live, upcoming, final };
    }),
  );

  const totalLive     = gameCounts.reduce((s, g) => s + g.live, 0);
  const totalUpcoming = gameCounts.reduce((s, g) => s + g.upcoming, 0);

  const metricsSummary = metrics.getSummary();
  const recentEvents   = syncBus.getRecent(20);

  return NextResponse.json({
    ok:          true,
    reportedAt:  new Date().toISOString(),
    sync: {
      live:         syncMeta.live,
      schedules:    syncMeta.schedules,
      injuries:     syncMeta.injuries,
      odds:         syncMeta.odds,
      standings:    syncMeta.standings,
      team_stats:   syncMeta.team_stats,
      player_stats: syncMeta.player_stats,
      rankings:     syncMeta.rankings,
      daily:        syncMeta.daily,
    },
    games: {
      live:     totalLive,
      upcoming: totalUpcoming,
      bySport:  gameCounts,
    },
    queue: queueStats,
    providers: breakerStatuses,
    cache: {
      hitRate:  metricsSummary.cacheHitRate,
      hits:     metricsSummary.cacheHits,
      misses:   metricsSummary.cacheMisses,
    },
    recentEvents,
  });
}
