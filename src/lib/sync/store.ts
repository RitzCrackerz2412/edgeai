/**
 * Live data store — single source of truth for all synchronized sports data.
 *
 * All data is backed by the cache layer (Redis in prod, memory in dev).
 * Change detection compares incoming vs cached values and fires the sync
 * event bus when meaningful changes are detected.
 */

import { getCache, TTL } from '../cache';
import { syncBus } from './event-bus';
import type { RawGame, RawInjury, RawOdds, RawTeamStats, RawPlayerStats } from '../providers/types';
import type { Sport } from '../types';

// ── Key builders ──────────────────────────────────────────────────────────────

const k = {
  liveScore:   (gameId: string)          => `sync:live:${gameId}`,
  games:       (sport: string, date: string) => `sync:games:${sport}:${date}`,
  injuries:    (sport: string)           => `sync:injuries:${sport}`,
  odds:        (gameId: string)          => `sync:odds:${gameId}`,
  standings:   (sport: string)           => `sync:standings:${sport}`,
  teamStats:   (teamId: string)          => `sync:team:${teamId}`,
  playerStats: (playerId: string)        => `sync:player:${playerId}`,
  rankings:    (sport: string)           => `sync:rankings:${sport}`,
  meta:        (type: string)            => `sync:meta:${type}`,
};

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LiveScore {
  gameId: string;
  homeScore: number;
  awayScore: number;
  period: number;
  clock: string;
  status: RawGame['status'];
  fetchedAt: string;
}

export interface SyncMeta {
  lastSyncAt: string;
  gamesUpdated: number;
  errorsCount: number;
}

export interface RankingEntry {
  teamId: string;
  teamName: string;
  rank: number;
  eloRating: number;
  record: string;
  trend: 'up' | 'down' | 'same';
}

// ── Store implementation ──────────────────────────────────────────────────────

class LiveDataStore {

  // ─── Live scores ────────────────────────────────────────────────────────────

  async setLiveScore(score: LiveScore): Promise<void> {
    const cache = getCache();
    const prev = await cache.get<LiveScore>(k.liveScore(score.gameId)).catch(() => null);

    const changed =
      !prev ||
      prev.homeScore !== score.homeScore ||
      prev.awayScore !== score.awayScore ||
      prev.period !== score.period ||
      prev.status !== score.status;

    await cache.set(k.liveScore(score.gameId), score, TTL.LIVE_SCORE);

    if (changed) {
      syncBus.emit('live:score', { gameId: score.gameId, score });
      if (score.status === 'closed') {
        syncBus.emit('game:final', { gameId: score.gameId, score });
      }
    }
  }

  async getLiveScore(gameId: string): Promise<LiveScore | null> {
    return getCache().get<LiveScore>(k.liveScore(gameId)).catch(() => null);
  }

  // ─── Game schedules ──────────────────────────────────────────────────────────

  async setGames(sport: Sport, date: string, games: RawGame[]): Promise<void> {
    const cache = getCache();
    const isToday = date === new Date().toISOString().split('T')[0];
    const ttl = isToday ? TTL.UPCOMING_GAMES : TTL.SCHEDULES;
    await cache.set(k.games(sport, date), games, ttl);

    // Propagate live score updates for in-progress games
    for (const g of games) {
      if (g.status === 'inprogress' && g.homeScore !== undefined && g.awayScore !== undefined) {
        await this.setLiveScore({
          gameId:    g.id,
          homeScore: g.homeScore,
          awayScore: g.awayScore ?? 0,
          period:    g.period ?? 1,
          clock:     g.clock ?? '',
          status:    g.status,
          fetchedAt: new Date().toISOString(),
        });
      }
    }

    syncBus.emit('schedule:updated', { sport, date, count: games.length });
  }

  async getGames(sport: Sport, date: string): Promise<RawGame[]> {
    return (await getCache().get<RawGame[]>(k.games(sport, date)).catch(() => null)) ?? [];
  }

  // ─── Injuries ────────────────────────────────────────────────────────────────

  async setInjuries(sport: Sport, injuries: RawInjury[]): Promise<void> {
    const cache = getCache();
    const prev = await cache.get<RawInjury[]>(k.injuries(sport)).catch(() => null);

    // Detect new or changed injury statuses
    const prevMap = new Map((prev ?? []).map(i => [i.playerId, i.status]));
    const changed = injuries.filter(i => prevMap.get(i.playerId) !== i.status);

    await cache.set(k.injuries(sport), injuries, TTL.INJURIES);

    if (changed.length > 0) {
      syncBus.emit('injuries:changed', { sport, changed });
    }
  }

  async getInjuries(sport: Sport): Promise<RawInjury[]> {
    return (await getCache().get<RawInjury[]>(k.injuries(sport)).catch(() => null)) ?? [];
  }

  // ─── Odds ────────────────────────────────────────────────────────────────────

  async setOdds(gameId: string, odds: RawOdds[]): Promise<void> {
    const cache = getCache();
    const prev = await cache.get<RawOdds[]>(k.odds(gameId)).catch(() => null);

    // Detect significant line movement (≥ 3 points on spread)
    const prevConsensus = prev?.[0];
    const newConsensus  = odds[0];
    const spreadMoved =
      prevConsensus && newConsensus &&
      Math.abs((prevConsensus.homeSpread ?? 0) - (newConsensus.homeSpread ?? 0)) >= 1.5;

    await cache.set(k.odds(gameId), odds, TTL.ODDS);

    if (spreadMoved) {
      syncBus.emit('odds:line-moved', { gameId, prev: prevConsensus, current: newConsensus });
    }
  }

  async getOdds(gameId: string): Promise<RawOdds[]> {
    return (await getCache().get<RawOdds[]>(k.odds(gameId)).catch(() => null)) ?? [];
  }

  // ─── Standings ───────────────────────────────────────────────────────────────

  async setStandings(sport: Sport, standings: RawTeamStats[]): Promise<void> {
    await getCache().set(k.standings(sport), standings, TTL.STANDINGS);
    syncBus.emit('standings:updated', { sport });
  }

  async getStandings(sport: Sport): Promise<RawTeamStats[]> {
    return (await getCache().get<RawTeamStats[]>(k.standings(sport)).catch(() => null)) ?? [];
  }

  // ─── Team stats ──────────────────────────────────────────────────────────────

  async setTeamStats(teamId: string, stats: RawTeamStats): Promise<void> {
    await getCache().set(k.teamStats(teamId), stats, TTL.TEAM_STATS);
    syncBus.emit('team:stats-updated', { teamId });
  }

  async getTeamStats(teamId: string): Promise<RawTeamStats | null> {
    return getCache().get<RawTeamStats>(k.teamStats(teamId)).catch(() => null);
  }

  // ─── Player stats ────────────────────────────────────────────────────────────

  async setPlayerStats(playerId: string, stats: RawPlayerStats): Promise<void> {
    await getCache().set(k.playerStats(playerId), stats, TTL.PLAYER_STATS);
    syncBus.emit('player:stats-updated', { playerId });
  }

  async getPlayerStats(playerId: string): Promise<RawPlayerStats | null> {
    return getCache().get<RawPlayerStats>(k.playerStats(playerId)).catch(() => null);
  }

  // ─── Rankings ────────────────────────────────────────────────────────────────

  async setRankings(sport: Sport, rankings: RankingEntry[]): Promise<void> {
    await getCache().set(k.rankings(sport), rankings, TTL.RANKINGS);
    syncBus.emit('rankings:updated', { sport });
  }

  async getRankings(sport: Sport): Promise<RankingEntry[]> {
    return (await getCache().get<RankingEntry[]>(k.rankings(sport)).catch(() => null)) ?? [];
  }

  // ─── Sync metadata ───────────────────────────────────────────────────────────

  async recordSync(type: string, meta: SyncMeta): Promise<void> {
    await getCache().set(k.meta(type), meta, TTL.SYNC_META);
  }

  async getSyncMeta(type: string): Promise<SyncMeta | null> {
    return getCache().get<SyncMeta>(k.meta(type)).catch(() => null);
  }

  async getAllSyncMeta(): Promise<Record<string, SyncMeta | null>> {
    const types = [
      'live', 'schedules', 'injuries', 'odds',
      'standings', 'team_stats', 'player_stats', 'rankings', 'daily',
    ];
    const entries = await Promise.all(types.map(async t => [t, await this.getSyncMeta(t)] as const));
    return Object.fromEntries(entries);
  }

  // ─── Bulk live game refresh ───────────────────────────────────────────────────

  /** Refresh live scores for all in-progress games from a game list */
  async refreshLiveFromGames(games: RawGame[]): Promise<number> {
    const live = games.filter(g => g.status === 'inprogress');
    await Promise.all(
      live.map(g =>
        g.homeScore !== undefined && g.awayScore !== undefined
          ? this.setLiveScore({
              gameId:    g.id,
              homeScore: g.homeScore,
              awayScore: g.awayScore ?? 0,
              period:    g.period ?? 1,
              clock:     g.clock ?? '',
              status:    g.status,
              fetchedAt: new Date().toISOString(),
            })
          : Promise.resolve(),
      ),
    );
    return live.length;
  }
}

export const liveStore = new LiveDataStore();
