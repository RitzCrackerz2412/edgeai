/**
 * In-memory metrics store.
 *
 * Tracks latency, error rates, cache performance, and provider health.
 * Designed to be replaced with a real telemetry backend (Datadog, Prometheus,
 * OpenTelemetry) — the interface is intentionally minimal.
 *
 * Thread safety: single-process Node.js is event-loop-serial so Map
 * operations are safe without locks.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LatencySample {
  route: string;
  method: string;
  statusCode: number;
  durationMs: number;
  timestamp: number;
}

export interface CacheSample {
  key: string;
  hit: boolean;
  tier: 'redis' | 'memory';
  timestamp: number;
}

export interface ErrorSample {
  route: string;
  statusCode: number;
  message: string;
  timestamp: number;
}

export interface ProviderHealthSample {
  provider: string;
  success: boolean;
  latencyMs: number;
  timestamp: number;
}

export interface MetricsSummary {
  // Latency
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  avgMs: number;
  requestCount: number;
  // Error rate
  errorRate: number;
  errorCount: number;
  // Cache
  cacheHitRate: number;
  cacheHits: number;
  cacheMisses: number;
  // Providers
  providerHealth: Record<string, { uptime: number; avgLatencyMs: number; callCount: number }>;
  // Time
  windowStarted: string;
}

// ── Circular buffers ──────────────────────────────────────────────────────────

const MAX_SAMPLES = 1000;

class CircularBuffer<T> {
  private buf: T[] = [];
  private idx = 0;

  push(item: T): void {
    if (this.buf.length < MAX_SAMPLES) {
      this.buf.push(item);
    } else {
      this.buf[this.idx % MAX_SAMPLES] = item;
      this.idx++;
    }
  }

  toArray(): T[] { return [...this.buf]; }
  get length(): number { return this.buf.length; }
  clear(): void { this.buf = []; this.idx = 0; }
}

// ── Metrics store ─────────────────────────────────────────────────────────────

class MetricsStore {
  private latency  = new CircularBuffer<LatencySample>();
  private cache    = new CircularBuffer<CacheSample>();
  private errors   = new CircularBuffer<ErrorSample>();
  private provider = new CircularBuffer<ProviderHealthSample>();
  private started  = new Date().toISOString();

  // ── Recording methods ──────────────────────────────────────────────────────

  recordLatency(sample: Omit<LatencySample, 'timestamp'>): void {
    this.latency.push({ ...sample, timestamp: Date.now() });
  }

  recordCache(sample: Omit<CacheSample, 'timestamp'>): void {
    this.cache.push({ ...sample, timestamp: Date.now() });
  }

  recordError(sample: Omit<ErrorSample, 'timestamp'>): void {
    this.errors.push({ ...sample, timestamp: Date.now() });
  }

  recordProviderCall(sample: Omit<ProviderHealthSample, 'timestamp'>): void {
    this.provider.push({ ...sample, timestamp: Date.now() });
  }

  // ── Aggregation ────────────────────────────────────────────────────────────

  getSummary(): MetricsSummary {
    const lat = this.latency.toArray();
    const cach = this.cache.toArray();
    const err = this.errors.toArray();
    const prov = this.provider.toArray();

    // Percentiles
    const durations = lat.map(s => s.durationMs).sort((a, b) => a - b);
    const p = (pct: number) => durations.length > 0
      ? durations[Math.floor(durations.length * pct / 100)] ?? 0
      : 0;
    const avg = durations.length > 0
      ? durations.reduce((s, x) => s + x, 0) / durations.length
      : 0;

    // Errors
    const errCount = err.filter(e => e.statusCode >= 500).length;

    // Cache
    const cacheHits   = cach.filter(c => c.hit).length;
    const cacheMisses = cach.length - cacheHits;

    // Provider health
    const providerMap: MetricsSummary['providerHealth'] = {};
    for (const s of prov) {
      if (!providerMap[s.provider]) {
        providerMap[s.provider] = { uptime: 0, avgLatencyMs: 0, callCount: 0 };
      }
      const entry = providerMap[s.provider];
      const successCount = s.success ? 1 : 0;
      // Rolling average
      entry.uptime = (entry.uptime * entry.callCount + successCount) / (entry.callCount + 1);
      entry.avgLatencyMs = (entry.avgLatencyMs * entry.callCount + s.latencyMs) / (entry.callCount + 1);
      entry.callCount++;
    }

    return {
      p50Ms: p(50), p95Ms: p(95), p99Ms: p(99), avgMs: avg,
      requestCount: lat.length,
      errorRate: lat.length > 0 ? errCount / lat.length : 0,
      errorCount: errCount,
      cacheHitRate: cach.length > 0 ? cacheHits / cach.length : 0,
      cacheHits, cacheMisses,
      providerHealth: providerMap,
      windowStarted: this.started,
    };
  }

  getRecentLatency(n = 50): LatencySample[] {
    return this.latency.toArray().slice(-n);
  }

  getRecentErrors(n = 20): ErrorSample[] {
    return this.errors.toArray().slice(-n);
  }

  reset(): void {
    this.latency.clear();
    this.cache.clear();
    this.errors.clear();
    this.provider.clear();
    this.started = new Date().toISOString();
  }
}

export const metrics = new MetricsStore();

// ── Timing helper ─────────────────────────────────────────────────────────────

export function timed<T>(
  fn: () => Promise<T>,
  onComplete: (durationMs: number, error?: unknown) => void,
): Promise<T> {
  const start = Date.now();
  return fn().then(
    (result) => { onComplete(Date.now() - start); return result; },
    (err)    => { onComplete(Date.now() - start, err); return Promise.reject(err); },
  );
}
