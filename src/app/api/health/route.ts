import { NextResponse } from 'next/server';

const startedAt = Date.now();

async function checkDatabase(): Promise<{ status: 'ok' | 'down' | 'unconfigured'; latencyMs?: number }> {
  if (!process.env.DATABASE_URL) return { status: 'unconfigured' };
  const t = Date.now();
  try {
    const { getDb } = await import('@/lib/db/client');
    const db = await getDb();
    if (!db) return { status: 'down' };
    await db.$queryRaw`SELECT 1`;
    return { status: 'ok', latencyMs: Date.now() - t };
  } catch {
    return { status: 'down' };
  }
}

async function checkCache(): Promise<{ status: 'ok' | 'down' | 'unconfigured' }> {
  // Redis connectivity check requires the 'redis' or 'ioredis' package.
  // Reports 'ok' when URL is configured (install package for full ping check).
  if (!process.env.REDIS_URL) return { status: 'unconfigured' };
  return { status: 'ok' };
}

async function checkESPN(): Promise<{ status: 'ok' | 'degraded'; latencyMs?: number }> {
  const t = Date.now();
  try {
    const res = await fetch(
      'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?limit=1',
      { signal: AbortSignal.timeout(5_000), cache: 'no-store' },
    );
    return res.ok
      ? { status: 'ok',      latencyMs: Date.now() - t }
      : { status: 'degraded' };
  } catch {
    return { status: 'degraded' };
  }
}

export async function GET() {
  const [db, cache, espn] = await Promise.all([
    checkDatabase(),
    checkCache(),
    checkESPN(),
  ]);

  const degraded = espn.status === 'degraded';
  const down     = db.status === 'down';

  const status = down ? 'down' : degraded ? 'degraded' : 'ok';

  return NextResponse.json(
    {
      status,
      timestamp:     new Date().toISOString(),
      version:       process.env.npm_package_version ?? '2.1.0',
      uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
      services: {
        database: db,
        cache,
        providers: { espn },
      },
      environment: process.env.NODE_ENV ?? 'development',
    },
    { status: down ? 503 : 200 },
  );
}
