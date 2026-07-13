import { NextRequest, NextResponse } from 'next/server';
import { getQuote, getFinancials, getAnalystData, getInsiderActivity, getHistory } from '@/lib/finance/providers/yahoo';
import { generateResearch } from '@/lib/finance/analysis/research';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> },
) {
  const { ticker } = await params;
  const sym = ticker.toUpperCase();

  const [quoteRes, metricsRes, historyRes] = await Promise.allSettled([
    getQuote(sym),
    getFinancials(sym),
    getHistory(sym, '1y'),
  ]);

  const quote   = quoteRes.status   === 'fulfilled' ? quoteRes.value   : null;
  const metrics = metricsRes.status === 'fulfilled' ? metricsRes.value : null;
  const history = historyRes.status === 'fulfilled' ? historyRes.value : [];

  if (!quote) return NextResponse.json({ ok: false, error: 'Symbol not found' }, { status: 404 });

  const [analystRes, insiderRes] = await Promise.allSettled([
    getAnalystData(sym, quote.price),
    getInsiderActivity(sym),
  ]);

  const { ratings: analyst } = analystRes.status === 'fulfilled'
    ? analystRes.value
    : { ratings: { strongBuy: 0, buy: 0, hold: 0, sell: 0, strongSell: 0, consensus: 'Hold' as const, avgPriceTarget: null, highPriceTarget: null, lowPriceTarget: null, numberOfAnalysts: 0, priceTargetUpside: null } };
  const insider = insiderRes.status === 'fulfilled'
    ? insiderRes.value
    : { netBuyShares: 0, netBuyValue: 0, netTransactions: 0, transactions: [] };

  const report = generateResearch({
    ticker:    sym,
    name:      quote.name,
    price:     quote.price,
    week52High: quote.week52High,
    week52Low:  quote.week52Low,
    volume:    quote.volume,
    avgVolume: quote.avgVolume,
    metrics:   metrics ?? {
      marketCap: quote.marketCap, enterpriseValue: null, pe: quote.pe, forwardPE: quote.forwardPE,
      peg: null, priceToBook: null, priceToSales: null, evToRevenue: null, evToEbitda: null,
      revenueGrowth: null, grossMargin: null, operatingMargin: null, profitMargin: null,
      returnOnEquity: null, returnOnAssets: null, totalRevenue: null, revenuePerShare: null,
      grossProfit: null, ebitda: null, netIncome: null, eps: quote.eps, epsGrowth: null,
      totalCash: null, totalDebt: null, debtToEquity: null, currentRatio: null, quickRatio: null,
      freeCashFlow: null, operatingCashFlow: null, beta: quote.beta, sharesOutstanding: null,
      sharesFloat: null, shortRatio: null, shortPct: null, dividendYield: quote.dividendYield, payoutRatio: null,
    },
    analyst,
    insider,
    history,
  });

  return NextResponse.json({ ok: true, report }, {
    headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' },
  });
}
