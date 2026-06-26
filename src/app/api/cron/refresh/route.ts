import { NextResponse } from 'next/server';
import { getProviders } from '@/lib/providers';

// Vercel Cron: runs every 15 minutes (see vercel.json)
// Warms the data cache for today's and tomorrow's games

const SPORTS = ['NFL', 'NBA', 'MLB', 'NHL'] as const;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth   = request.headers.get('Authorization');
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const today    = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().split('T')[0];

  const providers = getProviders();
  const results: Record<string, unknown> = {};

  await Promise.all(
    SPORTS.map(async sport => {
      try {
        const [t, tm] = await Promise.all([
          providers.sports.getGames(sport, today),
          providers.sports.getGames(sport, tomorrow),
        ]);
        results[sport] = { today: t.length, tomorrow: tm.length };
      } catch (err) {
        results[sport] = { error: err instanceof Error ? err.message : 'Unknown' };
      }
    }),
  );

  console.log('[Cron/refresh]', results);
  return NextResponse.json({ ok: true, refreshedAt: new Date().toISOString(), results });
}
