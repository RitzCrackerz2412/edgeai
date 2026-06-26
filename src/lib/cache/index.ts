/**
 * Cache factory.
 *
 * Returns Redis when REDIS_URL is configured, otherwise the in-memory LRU
 * cache. Call sites never need to know which backend is in use.
 *
 * TTL constants are re-exported for convenience.
 */

import type { Cache }   from './types';
import { MemoryCache }  from './memory';
import { RedisCache }   from './redis';

export { cacheKey, TTL } from './types';
export type { Cache, CacheKeyPrefix } from './types';

let _cache: Cache | null = null;

export function getCache(): Cache {
  if (_cache) return _cache;

  if (process.env.REDIS_URL) {
    // Attempt to use Redis; fall back to memory on connection errors
    try {
      _cache = new RedisCache();
    } catch {
      console.warn('[Cache] Redis connection failed — falling back to in-memory cache');
      _cache = new MemoryCache();
    }
  } else {
    _cache = new MemoryCache();
  }

  return _cache;
}

/** Reset the singleton (useful in tests) */
export function resetCache(): void {
  _cache = null;
}

// ── Cached wrapper ────────────────────────────────────────────────────────────
//
// Usage:
//   const result = await cached('features:nfl-001', 600, () => computeFeatures(game));

export async function cached<T>(
  key: string,
  ttlSeconds: number,
  compute: () => Promise<T>,
): Promise<T> {
  const cache = getCache();

  const hit = await cache.get<T>(key).catch(() => null);
  if (hit !== null) return hit;

  const value = await compute();
  await cache.set(key, value, ttlSeconds).catch(() => {}); // best-effort write

  return value;
}
