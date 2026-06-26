/**
 * Redis cache adapter — stub implementation.
 *
 * To enable: install ioredis (`npm install ioredis`), set REDIS_URL, then
 * replace each method body with the real ioredis calls shown in the comments.
 *
 * Until then the stub is a silent no-op: get() returns null, writes are
 * discarded. The app falls back to its in-memory LRU cache (cache/index.ts).
 */

import type { Cache } from './types';

export class RedisCache implements Cache {
  // Real implementation sketch:
  //   import Redis from 'ioredis';
  //   private client = new Redis(process.env.REDIS_URL);
  //   async get<T>(key: string): Promise<T | null> {
  //     const raw = await this.client.get(key);
  //     return raw ? JSON.parse(raw) : null;
  //   }
  //   async set<T>(key: string, value: T, ttlSeconds: number) {
  //     await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  //   }

  async get<T>(_key: string): Promise<T | null> {
    return null;
  }

  async set<T>(_key: string, _value: T, _ttlSeconds: number): Promise<void> {
    // no-op until ioredis is installed
  }

  async del(_key: string): Promise<void> {
    // no-op
  }

  async flush(_prefix?: string): Promise<void> {
    // no-op
  }

  async has(_key: string): Promise<boolean> {
    return false;
  }

  async size(): Promise<number> {
    return 0;
  }
}
