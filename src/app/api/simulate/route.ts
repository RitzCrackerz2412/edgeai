/**
 * POST /api/simulate
 * Body: { gameId, sport, homeWinProbability, n?, seed? }
 *
 * GET  /api/simulate?sport=NFL&homeWinProbability=0.62&n=10000
 */

import { NextRequest, NextResponse } from 'next/server';
import { simulate } from '@/lib/engine/montecarlo';
import type { Sport } from '@/lib/types';

const VALID_SPORTS: Sport[] = ['NFL', 'NBA', 'MLB', 'NHL', 'Soccer', 'UFC'];

function parseSport(v: unknown): Sport | null {
  if (typeof v === 'string' && (VALID_SPORTS as string[]).includes(v)) return v as Sport;
  return null;
}

function parseProb(v: unknown): number | null {
  const n = parseFloat(String(v));
  if (isNaN(n) || n < 0 || n > 1) return null;
  return n;
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const sport = parseSport(body.sport);
  const homeWinProb = parseProb(body.homeWinProbability);

  if (!sport) {
    return NextResponse.json({ error: `Invalid sport. Valid: ${VALID_SPORTS.join(', ')}` }, { status: 400 });
  }
  if (homeWinProb === null) {
    return NextResponse.json({ error: 'homeWinProbability must be a number in [0, 1]' }, { status: 400 });
  }

  const n = typeof body.n === 'number' ? Math.min(Math.max(body.n, 1000), 100_000) : 10_000;
  const seed = typeof body.seed === 'number' ? body.seed : undefined;
  const expectedHomeScore = typeof body.expectedHomeScore === 'number' ? body.expectedHomeScore : undefined;
  const expectedAwayScore = typeof body.expectedAwayScore === 'number' ? body.expectedAwayScore : undefined;

  try {
    const result = simulate({ sport, homeWinProbability: homeWinProb, n, seed, expectedHomeScore, expectedAwayScore });
    return NextResponse.json({ result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Simulation failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const sport = parseSport(sp.get('sport'));
  const homeWinProb = parseProb(sp.get('homeWinProbability'));

  if (!sport || homeWinProb === null) {
    return NextResponse.json(
      { error: 'Required: sport (NFL|NBA|MLB|NHL|Soccer|UFC), homeWinProbability (0-1)' },
      { status: 400 },
    );
  }

  const n = parseInt(sp.get('n') ?? '10000', 10);
  const seed = sp.has('seed') ? parseInt(sp.get('seed')!, 10) : undefined;

  try {
    const result = simulate({ sport, homeWinProbability: homeWinProb, n, seed });
    return NextResponse.json({ result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Simulation failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
