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
  LIVE_SCORE: 30,
  UPCOMING_GAMES: 300,
  TEAM_STATS: 3600,
  PLAYER_STATS: 3600,
  ODDS: 60,
  WEATHER: 900,
  PREDICTION: 600,
  FEATURES: 600,
  ACCURACY: 1800,
} as const;
