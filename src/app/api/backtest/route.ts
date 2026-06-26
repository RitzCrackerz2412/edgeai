/**
 * POST /api/backtest
 * Body: { samples: BacktestSample[] }
 *
 * GET  /api/backtest
 * Returns a backtest against the validation store's recorded games.
 */

import { NextRequest, NextResponse } from 'next/server';
import { runBacktest } from '@/lib/engine/backtest';
import { validationStore } from '@/lib/engine/validator';
import type { BacktestSample } from '@/lib/engine/backtest';

async function requireAdmin() {
  try {
    const { auth } = await import('@/lib/auth/config');
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') return null;
    return session;
  } catch { return null; }
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const raw = body.samples;
  if (!Array.isArray(raw)) {
    return NextResponse.json({ error: '`samples` must be an array of BacktestSample objects' }, { status: 400 });
  }

  const samples: BacktestSample[] = raw.map((s) => ({
    predictedProb: Number(s?.predictedProb ?? 0),
    actualOutcome: (Number(s?.actualOutcome ?? 0) as 0 | 1),
    predictedHomeScore: s?.predictedHomeScore != null ? Number(s.predictedHomeScore) : undefined,
    predictedAwayScore: s?.predictedAwayScore != null ? Number(s.predictedAwayScore) : undefined,
    actualHomeScore: s?.actualHomeScore != null ? Number(s.actualHomeScore) : undefined,
    actualAwayScore: s?.actualAwayScore != null ? Number(s.actualAwayScore) : undefined,
    gameId: String(s?.gameId ?? ''),
    sport: String(s?.sport ?? ''),
    date: String(s?.date ?? ''),
  }));

  if (samples.length === 0) {
    return NextResponse.json({ error: 'No samples provided' }, { status: 400 });
  }

  const result = runBacktest(samples);
  return NextResponse.json({ result });
}

export async function GET() {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Run backtest against all stored validation records
  const records = validationStore.all();

  if (records.length === 0) {
    return NextResponse.json({
      result: null,
      message: 'No validation records yet. Submit game results via POST /api/validate first.',
    });
  }

  const samples: BacktestSample[] = records.map((r) => ({
    predictedProb: r.predictedHomeWinProbability,
    actualOutcome: (r.homeWon ? 1 : 0) as 0 | 1,
    predictedHomeScore: r.predictedHomeScore,
    predictedAwayScore: r.predictedAwayScore,
    actualHomeScore: r.actualHomeScore,
    actualAwayScore: r.actualAwayScore,
    gameId: r.gameId,
    sport: r.sport,
    date: r.validatedAt,
  }));

  const result = runBacktest(samples);
  return NextResponse.json({ result, sampleCount: samples.length });
}
