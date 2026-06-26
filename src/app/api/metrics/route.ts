/**
 * GET /api/metrics — observability summary for the monitoring dashboard
 */

import { NextResponse } from 'next/server';
import { metrics } from '@/lib/observability/metrics';
import { jobQueue } from '@/lib/sync/queue';
import { validateEnvironment } from '@/lib/security/env';

async function requireAdmin() {
  try {
    const { auth } = await import('@/lib/auth/config');
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') return null;
    return session;
  } catch { return null; }
}

export async function GET() {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const summary    = metrics.getSummary();
  const queueStats = jobQueue.getStats();
  const envStatus  = validateEnvironment();

  return NextResponse.json({
    latency:      { p50: summary.p50Ms, p95: summary.p95Ms, p99: summary.p99Ms, avg: summary.avgMs },
    traffic:      { requests: summary.requestCount, errorRate: summary.errorRate, errorCount: summary.errorCount },
    cache:        { hitRate: summary.cacheHitRate, hits: summary.cacheHits, misses: summary.cacheMisses },
    providers:    summary.providerHealth,
    queue:        queueStats,
    environment:  { valid: envStatus.valid, warnings: envStatus.warnings.length, errors: envStatus.errors.length },
    windowStarted: summary.windowStarted,
    reportedAt:    new Date().toISOString(),
  });
}
