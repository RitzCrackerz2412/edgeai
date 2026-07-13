import { NextRequest, NextResponse } from 'next/server';
import { getNews } from '@/lib/finance/providers/yahoo';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> },
) {
  const { ticker } = await params;
  const count = parseInt(req.nextUrl.searchParams.get('count') ?? '20', 10);

  const news = await getNews(ticker.toUpperCase(), count);
  return NextResponse.json({ ok: true, news }, {
    headers: { 'Cache-Control': 's-maxage=120, stale-while-revalidate=240' },
  });
}
