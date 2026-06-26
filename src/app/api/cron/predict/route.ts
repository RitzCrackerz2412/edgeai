import { NextResponse } from 'next/server';
import { runPredictionBatch } from '@/lib/automation/pipeline';

// Vercel Cron: runs every 2 hours (see vercel.json)
// Protected with CRON_SECRET header

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth   = request.headers.get('Authorization');
  // Fail closed: deny if secret is unset (misconfiguration) OR token doesn't match
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const today    = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().split('T')[0];

  const [todayResults, tomorrowResults] = await Promise.all([
    runPredictionBatch(today),
    runPredictionBatch(tomorrow),
  ]);

  const results = [...todayResults, ...tomorrowResults];

  const summary = {
    totalGames:       results.reduce((s, r) => s + r.gamesFound, 0),
    totalPredictions: results.reduce((s, r) => s + r.predictionsGenerated, 0),
    errors:           results.flatMap(r => r.errors),
    generatedAt:      new Date().toISOString(),
  };

  console.log('[Cron/predict]', summary);
  return NextResponse.json({ ok: true, ...summary });
}
