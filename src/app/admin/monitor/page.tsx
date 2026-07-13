'use client';

/**
 * System monitoring dashboard — /admin/monitor
 *
 * Two tabs: System (API metrics) and Live Sync (data sync health).
 */

import { useState, useEffect, useCallback } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface MetricsData {
  latency:     { p50: number; p95: number; p99: number; avg: number };
  traffic:     { requests: number; errorRate: number; errorCount: number };
  cache:       { hitRate: number; hits: number; misses: number };
  providers:   Record<string, { uptime: number; avgLatencyMs: number; callCount: number }>;
  queue:       { pending: number; running: number; completed: number; failed: number; dead: number };
  environment: { valid: boolean; warnings: number; errors: number };
  windowStarted: string;
  reportedAt:  string;
}

interface SyncStatus {
  sync: Record<string, { lastSyncAt: string | null; gamesUpdated: number; errorsCount: number } | null>;
  games: { live: number; upcoming: number; bySport: { sport: string; live: number; upcoming: number; final: number }[] };
  queue: { pending: number; running: number; completed: number; failed: number; dead: number };
  providers: { name: string; state: 'closed' | 'open' | 'half-open'; failures: number; lastFailureAt: string | null }[];
  cache: { hitRate: number; hits: number; misses: number };
  recentEvents: { event: string; at: string }[];
  reportedAt: string;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Gauge({ label, value, unit, good, bad, format = (v: number) => v.toFixed(0) }: {
  label: string; value: number; unit?: string; good?: boolean; bad?: boolean;
  format?: (v: number) => string;
}) {
  const color = good ? '#10b981' : bad ? '#ef4444' : 'var(--text-primary)';
  return (
    <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-muted)' }}>
      <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="text-2xl font-mono font-bold" style={{ color }}>{format(value)}{unit && <span className="text-base ml-1 font-normal">{unit}</span>}</p>
    </div>
  );
}

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span className="relative inline-flex">
      <span className={`inline-block w-2.5 h-2.5 rounded-full ${ok ? 'bg-emerald-400' : 'bg-red-400'}`} />
      {ok && <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-50" />}
    </span>
  );
}

function SyncRow({ label, meta }: { label: string; meta: { lastSyncAt: string | null; gamesUpdated: number; errorsCount: number } | null }) {
  const lastSync = meta?.lastSyncAt ? new Date(meta.lastSyncAt) : null;
  // eslint-disable-next-line react-hooks/purity -- Date.now() used for display only, not state
  const ageMin   = lastSync ? Math.floor((Date.now() - lastSync.getTime()) / 60_000) : null;
  const healthy  = ageMin !== null && ageMin < 10 && (meta?.errorsCount ?? 0) === 0;
  const stale    = ageMin === null || ageMin > 30;

  return (
    <tr style={{ borderTop: '1px solid var(--border-muted)' }}>
      <td className="px-4 py-2.5 font-medium capitalize">{label.replace(/_/g, ' ')}</td>
      <td className="px-4 py-2.5">
        <span className="flex items-center gap-2 text-sm">
          <StatusDot ok={healthy} />
          {stale ? <span style={{ color: '#ef4444' }}>Stale</span>
           : healthy ? <span style={{ color: '#10b981' }}>Live</span>
           : <span style={{ color: '#f59e0b' }}>Degraded</span>}
        </span>
      </td>
      <td className="px-4 py-2.5 text-sm" style={{ color: 'var(--text-muted)' }}>
        {lastSync ? lastSync.toLocaleTimeString() : '—'}
        {ageMin !== null && <span className="ml-2 text-xs">({ageMin}m ago)</span>}
      </td>
      <td className="px-4 py-2.5 text-right font-mono text-sm">{meta?.gamesUpdated ?? '—'}</td>
      <td className="px-4 py-2.5 text-right font-mono text-sm" style={{ color: (meta?.errorsCount ?? 0) > 0 ? '#ef4444' : 'var(--text-muted)' }}>
        {meta?.errorsCount ?? '—'}
      </td>
    </tr>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function MonitorPage() {
  const [tab,         setTab]         = useState<'system' | 'sync'>('sync');
  const [metrics,     setMetrics]     = useState<MetricsData | null>(null);
  const [syncStatus,  setSyncStatus]  = useState<SyncStatus | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [syncing,     setSyncing]     = useState(false);

  const fetchAll = useCallback(async () => {
    const [mRes, sRes] = await Promise.all([
      fetch('/api/metrics').catch(() => null),
      fetch('/api/sync/status').catch(() => null),
    ]);
    if (mRes?.ok)  setMetrics(await mRes.json());
    if (sRes?.ok)  setSyncStatus(await sRes.json());
    setLastUpdated(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard data-fetch pattern
    fetchAll();
    const id = setInterval(fetchAll, 15_000);
    return () => clearInterval(id);
  }, [fetchAll]);

  async function triggerCron(path: string) {
    setSyncing(true);
    try { await fetch(path, { headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET ?? ''}` } }); }
    catch { /* ignore */ }
    setTimeout(fetchAll, 800);
    setSyncing(false);
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8 space-y-8" style={{ color: 'var(--text-primary)' }}>
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">System Monitor</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Live sync status · API health · Provider circuit breakers
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Updated {lastUpdated.toLocaleTimeString()}
            </p>
          )}
          <button onClick={() => fetchAll()}
            className="text-xs px-3 py-1.5 rounded-lg cursor-pointer transition-opacity hover:opacity-75"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-muted)' }}>
            Refresh
          </button>
        </div>
      </div>

      {/* Live game banner */}
      {syncStatus && syncStatus.games.live > 0 && (
        <div className="rounded-xl px-5 py-3 flex items-center gap-3"
          style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)' }}>
          <StatusDot ok />
          <span className="text-sm font-semibold" style={{ color: '#10b981' }}>
            {syncStatus.games.live} game{syncStatus.games.live !== 1 ? 's' : ''} live right now
          </span>
          <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>
            {syncStatus.games.upcoming} upcoming today
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-muted)' }}>
        {(['sync', 'system'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-1.5 text-sm rounded-lg cursor-pointer transition-all capitalize"
            style={{
              background:  tab === t ? 'var(--bg-card)' : 'transparent',
              color:       tab === t ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight:  tab === t ? 600 : 400,
            }}>
            {t === 'sync' ? 'Live Sync' : 'System'}
          </button>
        ))}
      </div>

      {loading && <div className="text-center py-20" style={{ color: 'var(--text-muted)' }}>Loading…</div>}

      {/* ── LIVE SYNC TAB ──────────────────────────────────────────────────────── */}
      {!loading && tab === 'sync' && syncStatus && (
        <div className="space-y-8">

          {/* Sync feed table */}
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
              Data Feed Health
            </h2>
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-muted)' }}>
              <table className="w-full text-sm">
                <thead style={{ background: 'var(--bg-card)' }}>
                  <tr className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                    <th className="px-4 py-3 text-left">Feed</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Last Sync</th>
                    <th className="px-4 py-3 text-right">Updated</th>
                    <th className="px-4 py-3 text-right">Errors</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(syncStatus.sync).map(([key, meta]) => (
                    <SyncRow key={key} label={key} meta={meta} />
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Game counts by sport */}
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
              Games by Sport (Today)
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {syncStatus.games.bySport.filter(s => s.live + s.upcoming + s.final > 0).map(s => (
                <div key={s.sport} className="rounded-xl p-3"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-muted)' }}>
                  <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>{s.sport}</p>
                  <div className="flex gap-2 flex-wrap">
                    {s.live > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                        {s.live} Live
                      </span>
                    )}
                    {s.upcoming > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                        {s.upcoming} Up
                      </span>
                    )}
                    {s.final > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                        {s.final} Final
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Circuit breakers */}
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
              Provider Circuit Breakers
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {syncStatus.providers.map(p => (
                <div key={p.name} className="rounded-xl p-3"
                  style={{ background: 'var(--bg-card)', border: `1px solid ${p.state === 'closed' ? 'rgba(16,185,129,0.25)' : p.state === 'open' ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.25)'}` }}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold">{p.name}</p>
                    <StatusDot ok={p.state === 'closed'} />
                  </div>
                  <p className="text-xs capitalize font-mono"
                    style={{ color: p.state === 'closed' ? '#10b981' : p.state === 'open' ? '#ef4444' : '#f59e0b' }}>
                    {p.state}
                  </p>
                  {p.failures > 0 && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{p.failures} failures</p>}
                </div>
              ))}
            </div>
          </section>

          {/* Manual cron triggers */}
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
              Manual Triggers
            </h2>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Live Scores', path: '/api/cron/live' },
                { label: 'Injuries',    path: '/api/cron/injuries' },
                { label: 'Odds',        path: '/api/cron/odds' },
                { label: 'Stats',       path: '/api/cron/stats' },
                { label: 'Rankings',    path: '/api/cron/rankings' },
                { label: 'Full Sync',   path: '/api/cron/refresh' },
              ].map(({ label, path }) => (
                <button key={path} disabled={syncing} onClick={() => triggerCron(path)}
                  className="px-3 py-1.5 text-xs rounded-lg cursor-pointer disabled:opacity-50 transition-all hover:opacity-75"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-muted)' }}>
                  Sync {label}
                </button>
              ))}
            </div>
          </section>

          {/* Recent sync events */}
          {syncStatus.recentEvents.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
                Recent Events
              </h2>
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-muted)' }}>
                {syncStatus.recentEvents.slice(-10).reverse().map((e, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-2.5 text-sm"
                    style={{ borderBottom: i < 9 ? '1px solid var(--border-muted)' : 'none', background: 'var(--bg-card)' }}>
                    <span className="text-xs px-2 py-0.5 rounded-full font-mono"
                      style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                      {e.event}
                    </span>
                    <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>
                      {new Date(e.at).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* ── SYSTEM TAB ───────────────────────────────────────────────────────── */}
      {!loading && tab === 'system' && metrics && (
        <div className="space-y-8">
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>API Latency</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Gauge label="P50" value={metrics.latency.p50} unit="ms" good={metrics.latency.p50 < 200} bad={metrics.latency.p50 > 500} />
              <Gauge label="P95" value={metrics.latency.p95} unit="ms" good={metrics.latency.p95 < 500} bad={metrics.latency.p95 > 1000} />
              <Gauge label="P99" value={metrics.latency.p99} unit="ms" good={metrics.latency.p99 < 1000} bad={metrics.latency.p99 > 2000} />
              <Gauge label="Avg" value={metrics.latency.avg} unit="ms" />
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Traffic</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Gauge label="Requests"    value={metrics.traffic.requests} />
              <Gauge label="Error Rate"  value={metrics.traffic.errorRate * 100} unit="%" format={v => v.toFixed(2)}
                good={metrics.traffic.errorRate < 0.01} bad={metrics.traffic.errorRate > 0.05} />
              <Gauge label="5xx Errors"  value={metrics.traffic.errorCount} bad={metrics.traffic.errorCount > 0} />
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Cache</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Gauge label="Hit Rate"   value={metrics.cache.hitRate * 100} unit="%" format={v => v.toFixed(1)}
                good={metrics.cache.hitRate > 0.7} bad={metrics.cache.hitRate < 0.4} />
              <Gauge label="Hits"       value={metrics.cache.hits} />
              <Gauge label="Misses"     value={metrics.cache.misses} />
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Sync Queue</h2>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
              <Gauge label="Pending"   value={metrics.queue.pending}   />
              <Gauge label="Running"   value={metrics.queue.running}   />
              <Gauge label="Completed" value={metrics.queue.completed} good={metrics.queue.completed > 0} />
              <Gauge label="Failed"    value={metrics.queue.failed}    bad={metrics.queue.failed > 0} />
              <Gauge label="Dead"      value={metrics.queue.dead}      bad={metrics.queue.dead > 0} />
            </div>
          </section>

          {Object.keys(metrics.providers).length > 0 && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Provider Health</h2>
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-muted)' }}>
                <table className="w-full text-sm">
                  <thead style={{ background: 'var(--bg-card)' }}>
                    <tr className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                      <th className="px-4 py-3 text-left">Provider</th>
                      <th className="px-4 py-3 text-left">Health</th>
                      <th className="px-4 py-3 text-right">Uptime</th>
                      <th className="px-4 py-3 text-right">Avg Latency</th>
                      <th className="px-4 py-3 text-right">Calls</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(metrics.providers).map(([name, p]) => (
                      <tr key={name} style={{ borderTop: '1px solid var(--border-muted)' }}>
                        <td className="px-4 py-2.5 font-medium">{name}</td>
                        <td className="px-4 py-2.5">
                          <span className="flex items-center gap-2">
                            <StatusDot ok={p.uptime > 0.95} />
                            <span style={{ color: p.uptime > 0.95 ? '#10b981' : p.uptime > 0.8 ? '#f59e0b' : '#ef4444' }}>
                              {p.uptime > 0.95 ? 'Healthy' : p.uptime > 0.8 ? 'Degraded' : 'Down'}
                            </span>
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

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Environment</h2>
            <div className="rounded-xl p-4 flex items-center gap-3"
              style={{ background: metrics.environment.valid ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)', border: `1px solid ${metrics.environment.valid ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
              <StatusDot ok={metrics.environment.valid} />
              <span className="text-sm">
                {metrics.environment.valid ? 'All required environment variables are set.' : `${metrics.environment.errors} required env var(s) missing.`}
                {metrics.environment.warnings > 0 && ` (${metrics.environment.warnings} optional missing)`}
              </span>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
