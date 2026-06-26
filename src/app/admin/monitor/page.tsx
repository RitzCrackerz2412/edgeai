'use client';

/**
 * System monitoring dashboard — /admin/monitor
 *
 * Shows: API latency, cache hit rate, provider uptime,
 * queue health, error rates, environment config status.
 */

import { useState, useEffect, useCallback } from 'react';

interface MetricsData {
  latency:  { p50: number; p95: number; p99: number; avg: number };
  traffic:  { requests: number; errorRate: number; errorCount: number };
  cache:    { hitRate: number; hits: number; misses: number };
  providers: Record<string, { uptime: number; avgLatencyMs: number; callCount: number }>;
  queue:    { pending: number; running: number; completed: number; failed: number; dead: number };
  environment: { valid: boolean; warnings: number; errors: number };
  windowStarted: string;
  reportedAt: string;
}

function Gauge({ label, value, unit, good, bad, format = (v: number) => v.toFixed(0) }: {
  label: string; value: number; unit?: string; good?: boolean; bad?: boolean;
  format?: (v: number) => string;
}) {
  const color = good ? 'text-emerald-400' : bad ? 'text-red-400' : 'text-slate-100';
  return (
    <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-muted)' }}>
      <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className={`text-2xl font-mono font-bold ${color}`}>{format(value)}{unit && <span className="text-base ml-1">{unit}</span>}</p>
    </div>
  );
}

function StatusDot({ ok }: { ok: boolean }) {
  return <span className={`inline-block w-2 h-2 rounded-full ${ok ? 'bg-emerald-400' : 'bg-red-400'}`} />;
}

export default function MonitorPage() {
  const [data,    setData]    = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await fetch('/api/metrics');
      if (res.ok) {
        setData(await res.json());
        setLastUpdated(new Date());
      }
    } catch {
      // silent — show stale data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 15_000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  const [syncing, setSyncing] = useState(false);

  async function triggerSync(type: string) {
    setSyncing(true);
    await fetch('/api/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type }) });
    setTimeout(fetchMetrics, 500);
    setSyncing(false);
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8 space-y-10" style={{ color: 'var(--text-primary)' }}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">System Monitor</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Real-time observability — auto-refreshes every 15 s
          </p>
        </div>
        <div className="text-right">
          {lastUpdated && (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
          <button onClick={fetchMetrics} className="mt-1 text-xs px-3 py-1 rounded-lg cursor-pointer transition-opacity hover:opacity-75"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-muted)' }}>
            Refresh now
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div className="text-center py-20" style={{ color: 'var(--text-muted)' }}>Loading metrics…</div>
      ) : data ? (
        <>
          {/* API Latency */}
          <section>
            <h2 className="text-base font-semibold mb-3">API Latency</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Gauge label="P50" value={data.latency.p50} unit="ms" good={data.latency.p50 < 200} bad={data.latency.p50 > 500} />
              <Gauge label="P95" value={data.latency.p95} unit="ms" good={data.latency.p95 < 500} bad={data.latency.p95 > 1000} />
              <Gauge label="P99" value={data.latency.p99} unit="ms" good={data.latency.p99 < 1000} bad={data.latency.p99 > 2000} />
              <Gauge label="Avg" value={data.latency.avg} unit="ms" />
            </div>
          </section>

          {/* Traffic & Errors */}
          <section>
            <h2 className="text-base font-semibold mb-3">Traffic</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Gauge label="Requests" value={data.traffic.requests} />
              <Gauge label="Error Rate" value={data.traffic.errorRate * 100} unit="%" format={v => v.toFixed(2)} good={data.traffic.errorRate < 0.01} bad={data.traffic.errorRate > 0.05} />
              <Gauge label="Errors (5xx)" value={data.traffic.errorCount} bad={data.traffic.errorCount > 0} />
            </div>
          </section>

          {/* Cache */}
          <section>
            <h2 className="text-base font-semibold mb-3">Cache</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Gauge label="Hit Rate" value={data.cache.hitRate * 100} unit="%" format={v => v.toFixed(1)} good={data.cache.hitRate > 0.7} bad={data.cache.hitRate < 0.4} />
              <Gauge label="Cache Hits" value={data.cache.hits} />
              <Gauge label="Cache Misses" value={data.cache.misses} />
            </div>
          </section>

          {/* Queue */}
          <section>
            <h2 className="text-base font-semibold mb-3">Sync Queue</h2>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-4 mb-4">
              <Gauge label="Pending"   value={data.queue.pending}   />
              <Gauge label="Running"   value={data.queue.running}   />
              <Gauge label="Completed" value={data.queue.completed} good={data.queue.completed > 0} />
              <Gauge label="Failed"    value={data.queue.failed}    bad={data.queue.failed > 0} />
              <Gauge label="Dead"      value={data.queue.dead}      bad={data.queue.dead > 0} />
            </div>
            <div className="flex flex-wrap gap-2">
              {(['all', 'schedules', 'injuries', 'odds', 'standings'] as const).map(type => (
                <button key={type} disabled={syncing} onClick={() => triggerSync(type)}
                  className="px-3 py-1.5 text-xs rounded-lg cursor-pointer disabled:opacity-50 transition-opacity hover:opacity-75"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-muted)' }}>
                  Sync {type}
                </button>
              ))}
            </div>
          </section>

          {/* Providers */}
          {Object.keys(data.providers).length > 0 && (
            <section>
              <h2 className="text-base font-semibold mb-3">Data Providers</h2>
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-muted)' }}>
                <table className="w-full text-sm">
                  <thead style={{ background: 'var(--bg-card)' }}>
                    <tr className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                      <th className="px-4 py-3 text-left">Provider</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-right">Uptime</th>
                      <th className="px-4 py-3 text-right">Avg Latency</th>
                      <th className="px-4 py-3 text-right">Calls</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(data.providers).map(([name, p]) => (
                      <tr key={name} style={{ borderTop: '1px solid var(--border-muted)' }}>
                        <td className="px-4 py-2.5 font-medium">{name}</td>
                        <td className="px-4 py-2.5">
                          <span className="flex items-center gap-2">
                            <StatusDot ok={p.uptime > 0.95} />
                            {p.uptime > 0.95 ? 'Healthy' : p.uptime > 0.8 ? 'Degraded' : 'Down'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono">{(p.uptime * 100).toFixed(1)}%</td>
                        <td className="px-4 py-2.5 text-right font-mono">{p.avgLatencyMs.toFixed(0)} ms</td>
                        <td className="px-4 py-2.5 text-right font-mono">{p.callCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Environment */}
          <section>
            <h2 className="text-base font-semibold mb-3">Environment</h2>
            <div className="rounded-xl p-4 flex items-center gap-3"
              style={{ background: data.environment.valid ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)', border: `1px solid ${data.environment.valid ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
              <StatusDot ok={data.environment.valid} />
              <span className="text-sm">
                {data.environment.valid ? 'All required environment variables are set.' : `${data.environment.errors} required env var(s) missing.`}
                {data.environment.warnings > 0 && ` (${data.environment.warnings} optional missing)`}
              </span>
            </div>
          </section>
        </>
      ) : (
        <div className="text-center py-20 text-sm" style={{ color: 'var(--text-muted)' }}>
          Could not load metrics.
        </div>
      )}
    </div>
  );
}
