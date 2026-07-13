import { NextRequest, NextResponse } from 'next/server';
import { getHistory } from '@/lib/finance/providers/yahoo';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> },
) {
  const { ticker } = await params;
  const range = (req.nextUrl.searchParams.get('range') ?? '1y') as '1d' | '5d' | '1mo' | '3mo' | '1y' | '5y';
  const sym = ticker.toUpperCase();

  const history = await getHistory(sym, range);
  return NextResponse.json({ ok: true, history }, {
    headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=120' },
  });
}
