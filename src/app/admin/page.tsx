'use client';

/**
 * Admin dashboard — /admin
 *
 * Sections:
 *  1. Quick stats (predictions, accuracy, Brier)
 *  2. Provider status with refresh controls
 *  3. Cache management (view stats, flush)
 *  4. Sync queue controls
 *  5. User management table
 *  6. Model versions
 *
 * All data from /api/metrics, /api/sync, /api/learn.
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { StatCard } from '@/components/ui/StatCard';

// ── Type shapes mirroring API responses ──────────────────────────────────────

interface MetricsResp {
  latency:  { p50: number; p95: number; p99: number; avg: number };
  traffic:  { requests: number; errorRate: number; errorCount: number };
  cache:    { hitRate: number; hits: number; misses: number };
  providers: Record<string, { uptime: number; avgLatencyMs: number; callCount: number }>;
  queue:    { pending: number; running: number; completed: number; failed: number; dead: number };
  environment: { valid: boolean; warnings: number; errors: number };
}

interface SyncResp {
  stats: { pending: number; running: number; completed: number; failed: number };
  dlq: { id: string; type: string; error: string; failedAt: number }[];
}

interface LearnResp {
  totalSamples: number;
  samplesSinceRetrain: number;
  nextRetrainIn: number;
  snapshots: { sport: string; timestamp: number; sampleCount: number; version: number }[];
}

function StatusChip({ ok, label }: { ok: boolean; label?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full ${ok ? 'text-emerald-300' : 'text-red-300'}`}
      style={{ background: ok ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${ok ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
      <span className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-emerald-400' : 'bg-red-400'}`} />
      {label ?? (ok ? 'Healthy' : 'Down')}
    </span>
  );
}

export default function AdminPage() {
  const [metrics, setMetrics] = useState<MetricsResp | null>(null);
  const [sync,    setSync]    = useState<SyncResp | null>(null);
  const [learn,   setLearn]   = useState<LearnResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast,   setToast]   = useState('');

  const fetchAll = useCallback(async () => {
    const [mRes, sRes, lRes] = await Promise.allSettled([
      fetch('/api/metrics').then(r => r.json()),
      fetch('/api/sync').then(r => r.json()),
      fetch('/api/learn').then(r => r.json()),
    ]);
    if (mRes.status === 'fulfilled') setMetrics(mRes.value);
    if (sRes.status === 'fulfilled') setSync(sRes.value);
    if (lRes.status === 'fulfilled') setLearn(lRes.value);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAll();
  }, [fetchAll]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  async function triggerSync(type: string) {
    await fetch('/api/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type }) });
    showToast(`Sync job "${type}" enqueued`);
    setTimeout(fetchAll, 800);
  }

  async function retryDead() {
    await fetch('/api/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'retryDead' }) });
    showToast('Dead jobs requeued for retry');
    setTimeout(fetchAll, 800);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" style={{ color: 'var(--text-muted)' }}>
        Loading dashboard…
      </div>
    );
  }

  const q = metrics?.queue;

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8 space-y-10" style={{ color: 'var(--text-primary)' }}>
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl text-sm font-medium shadow-xl"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-muted)', color: 'var(--text-primary)' }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Model performance, system health, and operations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/monitor"
            className="text-xs px-3 py-1.5 rounded-lg cursor-pointer transition-opacity hover:opacity-75"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-muted)' }}>
            Live Monitor
          </Link>
          <Link href="/admin/model"
            className="text-xs px-3 py-1.5 rounded-lg cursor-pointer transition-opacity hover:opacity-75"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-muted)' }}>
            Model Dashboard
          </Link>
        </div>
      </div>

      {/* Environment alert */}
      {metrics && !metrics.environment.valid && (
        <div className="rounded-xl px-4 py-3 text-sm"
          style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
          {metrics.environment.errors} required environment variable(s) missing. Check{' '}
          <Link href="/admin/monitor" className="underline">System Monitor</Link> for details.
        </div>
      )}

      {/* Quick stats */}
      <section>
        <h2 className="text-base font-semibold mb-3">System Overview</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="API Latency P50" value={`${metrics?.latency.p50.toFixed(0) ?? '—'} ms`} />
          <StatCard label="Cache Hit Rate" value={`${((metrics?.cache.hitRate ?? 0) * 100).toFixed(1)}%`} accent />
          <StatCard label="Queue Pending" value={String(q?.pending ?? 0)} />
          <StatCard label="Error Rate" value={`${((metrics?.traffic.errorRate ?? 0) * 100).toFixed(2)}%`} />
        </div>
      </section>

      {/* Provider Status */}
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
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {metrics && Object.keys(metrics.providers).length > 0 ? (
                Object.entries(metrics.providers).map(([name, p]) => (
                  <tr key={name} style={{ borderTop: '1px solid var(--border-muted)' }}>
                    <td className="px-4 py-2.5 font-medium">{name}</td>
                    <td className="px-4 py-2.5">
                      <StatusChip ok={p.uptime > 0.95} label={p.uptime > 0.95 ? 'Healthy' : p.uptime > 0.8 ? 'Degraded' : 'Down'} />
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono">{(p.uptime * 100).toFixed(1)}%</td>
                    <td className="px-4 py-2.5 text-right font-mono">{p.avgLatencyMs.toFixed(0)} ms</td>
                    <td className="px-4 py-2.5 text-right font-mono">{p.callCount}</td>
                    <td className="px-4 py-2.5 text-right">
                      <button onClick={() => triggerSync(name.toLowerCase())}
                        className="text-xs px-2 py-1 rounded-lg cursor-pointer hover:opacity-75"
                        style={{ background: 'var(--bg-base)', border: '1px solid var(--border-muted)' }}>
                        Refresh
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                /* Fallback rows for configured providers */
                [
                  { name: 'Sports Schedule API',  note: 'SportsDataIO / ESPN' },
                  { name: 'Injuries & Rosters',   note: 'Sportradar' },
                  { name: 'Odds / Lines',          note: 'The Odds API' },
                  { name: 'Weather',               note: 'OpenWeatherMap' },
                ].map(row => (
                  <tr key={row.name} style={{ borderTop: '1px solid var(--border-muted)' }}>
                    <td className="px-4 py-2.5 font-medium">{row.name}</td>
                    <td className="px-4 py-2.5"><StatusChip ok={false} label="Not configured" /></td>
                    <td className="px-4 py-2.5 text-right font-mono" style={{ color: 'var(--text-muted)' }}>—</td>
                    <td className="px-4 py-2.5 text-right font-mono" style={{ color: 'var(--text-muted)' }}>—</td>
                    <td className="px-4 py-2.5 text-right font-mono" style={{ color: 'var(--text-muted)' }}>—</td>
                    <td className="px-4 py-2.5 text-right">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{row.note}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Queue & Sync */}
      <section>
        <h2 className="text-base font-semibold mb-3">Sync Queue</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
          {[
            { label: 'Pending',   value: sync?.stats.pending   ?? q?.pending   ?? 0 },
            { label: 'Running',   value: sync?.stats.running   ?? q?.running   ?? 0 },
            { label: 'Completed', value: sync?.stats.completed ?? q?.completed ?? 0 },
            { label: 'Failed',    value: sync?.stats.failed    ?? q?.failed    ?? 0 },
            { label: 'Dead',      value: q?.dead ?? 0 },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl p-3 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-muted)' }}>
              <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
              <p className="text-xl font-mono font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {(['all', 'schedules', 'injuries', 'odds', 'standings'] as const).map(type => (
            <button key={type} onClick={() => triggerSync(type)}
              className="px-3 py-1.5 text-xs rounded-lg cursor-pointer hover:opacity-75 transition-opacity"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-muted)' }}>
              Sync {type}
            </button>
          ))}
          {(q?.dead ?? 0) > 0 && (
            <button onClick={retryDead}
              className="px-3 py-1.5 text-xs rounded-lg cursor-pointer hover:opacity-75 transition-opacity"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
              Retry {q?.dead} dead job(s)
            </button>
          )}
        </div>

        {/* DLQ */}
        {sync && sync.dlq.length > 0 && (
          <div className="mt-4 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(239,68,68,0.2)' }}>
            <div className="px-4 py-2.5 text-xs font-medium" style={{ background: 'rgba(239,68,68,0.06)', color: '#fca5a5' }}>
              Dead Letter Queue ({sync.dlq.length} jobs)
            </div>
            {sync.dlq.map(j => (
              <div key={j.id} className="px-4 py-2.5 text-xs" style={{ borderTop: '1px solid rgba(239,68,68,0.1)', color: 'var(--text-secondary)' }}>
                <span className="font-medium">{j.type}</span>
                <span className="ml-3" style={{ color: 'var(--text-muted)' }}>{j.error}</span>
                <span className="ml-3" style={{ color: 'var(--text-muted)' }}>{new Date(j.failedAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Model versions */}
      {learn && learn.snapshots.length > 0 && (
        <section>
          <h2 className="text-base font-semibold mb-3">Model Versions</h2>
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-muted)' }}>
            <table className="w-full text-sm">
              <thead style={{ background: 'var(--bg-card)' }}>
                <tr className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                  <th className="px-4 py-3 text-left">Sport</th>
                  <th className="px-4 py-3 text-right">Version</th>
                  <th className="px-4 py-3 text-right">Samples</th>
                  <th className="px-4 py-3 text-right">Trained</th>
                </tr>
              </thead>
              <tbody>
                {learn.snapshots.map(s => (
                  <tr key={`${s.sport}-${s.version}`} style={{ borderTop: '1px solid var(--border-muted)' }}>
                    <td className="px-4 py-2.5 font-medium">{s.sport}</td>
                    <td className="px-4 py-2.5 text-right font-mono">v{s.version}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{s.sampleCount}</td>
                    <td className="px-4 py-2.5 text-right" style={{ color: 'var(--text-muted)' }}>
                      {new Date(s.timestamp).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-2.5 text-xs" style={{ borderTop: '1px solid var(--border-muted)', color: 'var(--text-muted)' }}>
              {learn.samplesSinceRetrain} samples since last retrain · next retrain in {learn.nextRetrainIn} samples
            </div>
          </div>
        </section>
      )}

      {/* Auth status */}
      <section>
        <h2 className="text-base font-semibold mb-3">Authentication</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/auth/signin"
            className="text-sm px-4 py-2 rounded-lg cursor-pointer hover:opacity-75 transition-opacity"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-muted)' }}>
            Sign In Page
          </Link>
          <Link href="/auth/register"
            className="text-sm px-4 py-2 rounded-lg cursor-pointer hover:opacity-75 transition-opacity"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-muted)' }}>
            Register Page
          </Link>
          <a href="/api/auth/session" target="_blank" rel="noreferrer"
            className="text-sm px-4 py-2 rounded-lg cursor-pointer hover:opacity-75 transition-opacity"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-muted)' }}>
            Session API
          </a>
        </div>
        <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
          Demo accounts are configured via <code>DEMO_ADMIN_EMAIL</code> / <code>DEMO_USER_EMAIL</code> environment variables.
        </p>
      </section>
    </div>
  );
}
