import { NextRequest, NextResponse } from 'next/server';
import { getQuote } from '@/lib/finance/providers/yahoo';

export const dynamic = 'force-dynamic';

// GET /api/finance/quotes?tickers=AAPL,MSFT,NVDA
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('tickers') ?? '';
  const tickers = raw.split(',').map(t => t.trim().toUpperCase()).filter(Boolean).slice(0, 20);
  if (tickers.length === 0) return NextResponse.json({ ok: false, error: 'No tickers' }, { status: 400 });

  const results = await Promise.allSettled(tickers.map(t => getQuote(t)));
  const quotes = results.map((r, i) => ({
    ticker: tickers[i],
    quote: r.status === 'fulfilled' ? r.value : null,
  }));

  return NextResponse.json({ ok: true, quotes }, {
    headers: { 'Cache-Control': 's-maxage=30, stale-while-revalidate=60' },
  });
}
