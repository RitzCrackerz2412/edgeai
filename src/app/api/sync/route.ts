/**
 * POST /api/sync  — trigger a sync job
 * Body: { type: 'all' | 'schedules' | 'injuries' | 'weather' | 'odds' | 'standings' | 'player_stats', sport? }
 *
 * GET  /api/sync  — queue health + DLQ summary
 */

import { NextRequest, NextResponse } from 'next/server';
import { jobQueue } from '@/lib/sync/queue';
import { JOB_TYPES, scheduleFullSync, scheduleOddsRefresh, scheduleInjuryRefresh } from '@/lib/sync/jobs';
import { checkRateLimit, getIp } from '@/lib/security/rateLimit';
import type { Sport } from '@/lib/types';

const VALID_TYPES = ['all', 'schedules', 'injuries', 'weather', 'odds', 'standings', 'player_stats'] as const;
type SyncType = (typeof VALID_TYPES)[number];

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
  const stats = jobQueue.getStats();
  const dlq = jobQueue.getDLQ().slice(0, 20); // last 20 dead jobs
  return NextResponse.json({ stats, deadLetterQueue: dlq });
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Stricter rate limit for admin operations
  const ip = getIp(req);
  const rl = checkRateLimit(ip, 'admin');
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const type = body.type as SyncType;
  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: `type must be one of: ${VALID_TYPES.join(', ')}` }, { status: 400 });
  }

  const sport = typeof body.sport === 'string' ? body.sport as Sport : undefined;

  let jobId: string;
  switch (type) {
    case 'all':          jobId = scheduleFullSync(sport); break;
    case 'odds':         jobId = sport ? scheduleOddsRefresh(sport) : jobQueue.enqueue(JOB_TYPES.REFRESH_ODDS, { sport }); break;
    case 'injuries':     jobId = sport ? scheduleInjuryRefresh(sport) : jobQueue.enqueue(JOB_TYPES.REFRESH_INJURIES, { sport }); break;
    case 'schedules':    jobId = jobQueue.enqueue(JOB_TYPES.REFRESH_SCHEDULES,    { sport }, { priority: 'high' }); break;
    case 'weather':      jobId = jobQueue.enqueue(JOB_TYPES.REFRESH_WEATHER,      {}, { priority: 'normal' }); break;
    case 'standings':    jobId = jobQueue.enqueue(JOB_TYPES.REFRESH_STANDINGS,    { sport }, { priority: 'normal' }); break;
    case 'player_stats': jobId = jobQueue.enqueue(JOB_TYPES.REFRESH_PLAYER_STATS, { sport }, { priority: 'low' }); break;
    default: return NextResponse.json({ error: 'Unknown type' }, { status: 400 });
  }

  return NextResponse.json({ jobId, status: 'queued', type, sport: sport ?? 'all' });
}
