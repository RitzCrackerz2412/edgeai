/**
 * POST /api/backfill
 *
 * Seeds GBDT training data from EXTENDED_HISTORY and fits the model
 * immediately if ≥30 samples are available.
 *
 * Query params:
 *   ?force=true  — re-run even if backfill already exists in DB
 *
 * This is an admin-only route. Protect it with ADMIN_SECRET in production.
 * Running it once is enough; subsequent calls are no-ops unless forced.
 */

import { NextRequest, NextResponse } from 'next/server';
import { runBackfill } from '@/lib/engine/backfill';

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret') ?? req.nextUrl.searchParams.get('secret');
  if (process.env.ADMIN_SECRET && secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const force = req.nextUrl.searchParams.get('force') === 'true';

  try {
    const result = await runBackfill(force);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Backfill failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Allow GET for easy browser triggering in dev
export async function GET(req: NextRequest) {
  return POST(new NextRequest(req.url, { method: 'POST', headers: req.headers }));
}
