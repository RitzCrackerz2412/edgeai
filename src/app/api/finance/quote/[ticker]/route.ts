import { NextRequest, NextResponse } from 'next/server';
import { getQuote, getProfile } from '@/lib/finance/providers/yahoo';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> },
) {
  const { ticker } = await params;
  const sym = ticker.toUpperCase();

  const [quote, profile] = await Promise.allSettled([getQuote(sym), getProfile(sym)]);

  const q = quote.status === 'fulfilled' ? quote.value : null;
  if (!q) return NextResponse.json({ ok: false, error: 'Symbol not found' }, { status: 404 });

  const p = profile.status === 'fulfilled' ? profile.value : null;
  if (p) {
    q.sector   = p.sector;
    q.industry = p.industry;
  }

  return NextResponse.json({ ok: true, quote: q }, {
    headers: { 'Cache-Control': 's-maxage=30, stale-while-revalidate=60' },
  });
}
