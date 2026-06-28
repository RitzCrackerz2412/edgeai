/**
 * GET /api/game/[id]
 *
 * Returns a single game by ID. Checks ESPN live data first, falls back to mock.
 * Used by the live simulation page (client component cannot call server functions directly).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getGameById } from '@/lib/api';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const game = await getGameById(id).catch(() => null);
  if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 });

  return NextResponse.json({ ok: true, game });
}
