/**
 * In-memory token bucket rate limiter.
 *
 * Each IP gets its own bucket. Buckets refill at a steady rate.
 * No external dependencies — drops gracefully if not needed.
 *
 * Limits (per IP, per window):
 *   - Default API:   100 requests / 60 s
 *   - Auth routes:   10  requests / 60 s
 *   - Search/public: 200 requests / 60 s
 */

interface Bucket {
  tokens: number;
  lastRefill: number;
}

interface RateLimitConfig {
  maxTokens: number;   // bucket capacity
  refillRate: number;  // tokens per second
}

export const RATE_CONFIGS = {
  api:    { maxTokens: 100, refillRate: 100 / 60 },
  auth:   { maxTokens: 10,  refillRate: 10  / 60 },
  public: { maxTokens: 200, refillRate: 200 / 60 },
  admin:  { maxTokens: 50,  refillRate: 50  / 60 },
} satisfies Record<string, RateLimitConfig>;

export type RateLimitTier = keyof typeof RATE_CONFIGS;

// ── Bucket store ─────────────────────────────────────────────────────────────
// Keyed by `${tier}:${ip}`. GC'd every 5 minutes.

const buckets = new Map<string, Bucket>();
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
const BUCKET_EXPIRY_MS    = 10 * 60 * 1000;

if (typeof globalThis !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets.entries()) {
      if (now - bucket.lastRefill > BUCKET_EXPIRY_MS) buckets.delete(key);
    }
  }, CLEANUP_INTERVAL_MS).unref?.();
}

function refill(bucket: Bucket, config: RateLimitConfig, now: number): void {
  const elapsed = (now - bucket.lastRefill) / 1000; // seconds
  bucket.tokens = Math.min(config.maxTokens, bucket.tokens + elapsed * config.refillRate);
  bucket.lastRefill = now;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
  limit: number;
}

export function checkRateLimit(ip: string, tier: RateLimitTier = 'api'): RateLimitResult {
  const config = RATE_CONFIGS[tier];
  const key = `${tier}:${ip}`;
  const now = Date.now();

  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { tokens: config.maxTokens, lastRefill: now };
    buckets.set(key, bucket);
  }

  refill(bucket, config, now);

  const allowed = bucket.tokens >= 1;
  if (allowed) bucket.tokens -= 1;

  const resetInSeconds = Math.ceil((1 - bucket.tokens) / config.refillRate);

  return {
    allowed,
    remaining: Math.floor(bucket.tokens),
    resetInSeconds: Math.max(0, resetInSeconds),
    limit: config.maxTokens,
  };
}

/** Rate limit response headers */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit':     String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset':     String(Math.floor(Date.now() / 1000) + result.resetInSeconds),
    ...(result.allowed ? {} : { 'Retry-After': String(result.resetInSeconds) }),
  };
}

export function getIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? '127.0.0.1';
}
