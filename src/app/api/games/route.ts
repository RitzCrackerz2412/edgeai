/**
 * GET /api/games?sport=NBA&days=7
 *
 * Returns games for a sport across a window of days (yesterday → +days).
 * Used by SportSchedule (client component) and any other client-side consumers.
 * Validates inputs, deduplicates by game ID, and never returns fabricated data.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getProviders } from '@/lib/providers';
import { rawGameToGame } from '@/lib/data/live';
import type { Sport } from '@/lib/types';
import type { RawGame } from '@/lib/providers/types';

export const dynamic = 'force-dynamic';

const VALID_SPORTS: Sport[] = [
  'NFL', 'NBA', 'MLB', 'NHL', 'Soccer',
  'NCAA Football', 'NCAA Basketball',
];

const MAX_DAYS = 21;

function addDays(base: Date, n: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const sport = searchParams.get('sport') as Sport | null;
  const days  = Math.min(parseInt(searchParams.get('days') ?? '7', 10), MAX_DAYS);

  if (!sport || !VALID_SPORTS.includes(sport)) {
    return NextResponse.json(
      { error: `sport must be one of: ${VALID_SPORTS.join(', ')}` },
      { status: 400 },
    );
  }

  const today = new Date();
  const dates: string[] = [];
  for (let i = -1; i <= days; i++) dates.push(addDays(today, i));

  try {
    const provider = getProviders().sports;
    const rawResults = await Promise.all(
      dates.map(d => provider.getGames(sport, d).catch((): RawGame[] => [])),
    );

    const seen = new Set<string>();
    const games = rawResults.flat()
      .map(rawGameToGame)
      .filter((g): g is NonNullable<typeof g> => g !== null)
      .filter(g => {
        if (seen.has(g.id)) return false;
        seen.add(g.id);
        return true;
      })
      .sort((a, b) => {
        const at = a.scheduledAt ?? (a.date + 'T00:00:00');
        const bt = b.scheduledAt ?? (b.date + 'T00:00:00');
        return at.localeCompare(bt);
      });

    return NextResponse.json({ ok: true, sport, count: games.length, games });
  } catch (err) {
    console.error('[api/games] provider error:', err);
    return NextResponse.json({ ok: false, error: 'Provider unavailable', games: [] });
  }
}
