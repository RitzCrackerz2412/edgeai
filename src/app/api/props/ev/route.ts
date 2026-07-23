import { NextRequest, NextResponse } from 'next/server';
import { getAllEVProps, getGameEVProps } from '@/lib/props/fetcher';
import type { Sport } from '@/lib/types';

export const dynamic = 'force-dynamic';

const VALID_SPORTS: Sport[] = ['NBA', 'NFL', 'MLB', 'NHL', 'NCAA Basketball', 'NCAA Football'];

// GET /api/props/ev?sport=NBA&home=Lakers&away=Celtics&minEdge=2
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const sport    = (searchParams.get('sport') ?? 'NBA') as Sport;
  const home     = searchParams.get('home') ?? '';
  const away     = searchParams.get('away') ?? '';
  const minEdge  = Number(searchParams.get('minEdge') ?? '2');

  if (!VALID_SPORTS.includes(sport)) {
    return NextResponse.json({ ok: false, error: 'Unsupported sport' }, { status: 400 });
  }

  try {
    const hasOddsKey = Boolean(process.env.ODDS_API_KEY);

    if (home && away) {
      const props = await getGameEVProps(sport, home, away);
      return NextResponse.json({
        ok: true,
        sport,
        homeTeam: home,
        awayTeam: away,
        props,
        hasOddsKey,
        updatedAt: new Date().toISOString(),
      }, { headers: { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800' } });
    }

    const games = await getAllEVProps(sport, minEdge);
    return NextResponse.json({
      ok: true,
      sport,
      games,
      hasOddsKey,
      updatedAt: new Date().toISOString(),
    }, { headers: { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800' } });
  } catch (err) {
    console.error('[props/ev]', err);
    return NextResponse.json({ ok: false, error: 'Failed to fetch props' }, { status: 500 });
  }
}
