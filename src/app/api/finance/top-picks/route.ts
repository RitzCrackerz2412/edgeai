import { NextResponse } from 'next/server';
import { getTopPicks } from '@/lib/finance/providers/yahoo';

// Revalidate every hour — picks refresh with the trading day
export const revalidate = 3600;

export async function GET() {
  try {
    const picks = await getTopPicks(8);
    return NextResponse.json({ ok: true, picks, generatedAt: new Date().toISOString() });
  } catch {
    return NextResponse.json({ ok: false, picks: [], generatedAt: new Date().toISOString() });
  }
}
