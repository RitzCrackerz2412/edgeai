// ── Cache interface ───────────────────────────────────────────────────────────

export interface Cache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
  del(key: string): Promise<void>;
  flush(prefix?: string): Promise<void>;
  has(key: string): Promise<boolean>;
  /** Number of entries currently held */
  size(): Promise<number>;
}

// ── Typed cache key prefixes ──────────────────────────────────────────────────

export type CacheKeyPrefix =
  | 'games:'
  | 'team:'
  | 'player:'
  | 'odds:'
  | 'weather:'
  | 'prediction:'
  | 'features:'
  | 'accuracy:'
  | 'validation:';

export function cacheKey(prefix: CacheKeyPrefix, id: string, suffix?: string): string {
  return suffix ? `${prefix}${id}:${suffix}` : `${prefix}${id}`;
}

// ── TTL constants (seconds) ───────────────────────────────────────────────────

export const TTL = {
  // Live data (very short)
  LIVE_SCORE: 30,
  ODDS: 60,
  // Near-real-time (5 min)
  UPCOMING_GAMES: 300,
  INJURIES: 300,
  LINEUPS: 300,
  // Medium refresh (15 min)
  PLAYER_STATS: 900,
  TEAM_STATS: 900,
  STANDINGS: 900,
  WEATHER: 900,
  // Slow refresh (1 hr)
  RANKINGS: 3600,
  SCHEDULES: 3600,
  // Prediction layer
  PREDICTION: 600,
  FEATURES: 600,
  // Historical (1 day)
  ACCURACY: 1800,
  DAILY: 86_400,
  // Sync metadata (last-sync timestamps)
  SYNC_META: 86_400,
} as const;

// Extended prefixes for sync layer
export type CacheSyncPrefix =
  | 'sync:live:'
  | 'sync:games:'
  | 'sync:injuries:'
  | 'sync:odds:'
  | 'sync:standings:'
  | 'sync:team:'
  | 'sync:player:'
  | 'sync:meta:'
  | 'sync:rankings:';
