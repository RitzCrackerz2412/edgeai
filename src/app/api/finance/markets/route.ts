import { NextResponse } from 'next/server';
import { getMarketOverview } from '@/lib/finance/providers/yahoo';

export const dynamic = 'force-dynamic';

export async function GET() {
  const overview = await getMarketOverview();
  return NextResponse.json({ ok: true, ...overview }, {
    headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=120' },
  });
}
