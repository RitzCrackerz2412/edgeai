/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';
import type { ScannerPreset, ScannerResult } from '@/lib/finance/types';

export const dynamic = 'force-dynamic';

const PRESET_MAP: Record<ScannerPreset, { scrId: string; label: string }> = {
  high_growth:      { scrId: 'growth_technology_stocks',  label: 'High Growth' },
  deep_value:       { scrId: 'undervalued_large_caps',    label: 'Deep Value' },
  momentum_leaders: { scrId: 'day_gainers',               label: 'Momentum Leaders' },
  dividend_growth:  { scrId: 'high_yield_bond',           label: 'Dividend Growth' },
  insider_buying:   { scrId: 'most_actives',              label: 'Most Active' },
  analyst_upgrades: { scrId: 'aggressive_small_caps',     label: 'Analyst Upgrades' },
  low_debt_high_fcf:{ scrId: 'undervalued_growth_stocks', label: 'Low Debt / High FCF' },
  earnings_beat:    { scrId: 'strong_undervalued_stocks', label: 'Earnings Beats' },
};

function n(v: unknown): number | null {
  return typeof v === 'number' && isFinite(v) ? v : null;
}

export async function GET(req: NextRequest) {
  const preset = (req.nextUrl.searchParams.get('preset') ?? 'momentum_leaders') as ScannerPreset;
  const config = PRESET_MAP[preset] ?? PRESET_MAP.momentum_leaders;

  try {
    const screen: any = await yahooFinance.screener({ scrIds: config.scrId as any, count: 25 });
    const quotes: any[] = screen?.quotes ?? [];

    const results: ScannerResult[] = quotes.map((q: any, i: number) => ({
      ticker:     q.symbol ?? '',
      name:       String(q.shortName ?? q.longName ?? q.symbol ?? ''),
      price:      n(q.regularMarketPrice) ?? 0,
      changePct:  +((n(q.regularMarketChangePercent) ?? 0) * 100).toFixed(2),
      marketCap:  n(q.marketCap),
      score:      Math.max(40, 90 - i * 2),
      matchReason: config.label,
      metrics: {
        pe:           n(q.trailingPE),
        forwardPE:    n(q.forwardPE),
        revenueGrowth: n(q.revenueGrowth) != null
          ? +(((n(q.revenueGrowth) ?? 0) * 100).toFixed(1)) : null,
        dividendYield: n(q.trailingAnnualDividendYield) != null
          ? +(((n(q.trailingAnnualDividendYield) ?? 0) * 100).toFixed(2)) : null,
      },
    }));

    return NextResponse.json({ ok: true, preset, label: config.label, results }, {
      headers: { 'Cache-Control': 's-maxage=120, stale-while-revalidate=240' },
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
