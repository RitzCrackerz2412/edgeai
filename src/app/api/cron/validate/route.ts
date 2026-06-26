import { NextResponse } from 'next/server';
import { runValidationBatch } from '@/lib/automation/pipeline';

// Vercel Cron: runs every hour (see vercel.json)
// Validates yesterday's completed games against stored predictions

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth   = request.headers.get('Authorization');
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const yesterday = new Date(Date.now() - 86_400_000).toISOString().split('T')[0];

  const results = await runValidationBatch(yesterday);

  const totalValidated = results.reduce((s, r) => s + r.gamesValidated, 0);
  const totalCorrect   = results.reduce((s, r) => s + r.correct, 0);

  const summary = {
    totalValidated,
    totalCorrect,
    overallAccuracy: totalValidated > 0
      ? Math.round((totalCorrect / totalValidated) * 1000) / 10
      : 0,
    bySport:    results.map(r => ({ sport: r.sport, validated: r.gamesValidated, correct: r.correct, accuracy: r.accuracy })),
    errors:     results.flatMap(r => r.errors),
    validatedAt: new Date().toISOString(),
  };

  console.log('[Cron/validate]', summary);
  return NextResponse.json({ ok: true, ...summary });
}
