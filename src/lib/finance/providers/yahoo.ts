/* eslint-disable @typescript-eslint/no-explicit-any */
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] as any });
import type {
  StockQuote, CompanyProfile, FinancialMetrics, PricePoint,
  AnalystRatings, AnalystAction, InsiderTransaction, InsiderSummary,
  EarningsQuarter, MarketOverview, MarketMover, IndexQuote, SectorPerf,
  NewsArticle, EarningsCalendarItem,
} from '../types';

// ── Utility ───────────────────────────────────────────────────────────────────

function n(v: unknown): number | null {
  if (v === null || v === undefined || typeof v !== 'number' || !isFinite(v)) return null;
  return v;
}
function pct(v: unknown): number | null {
  const x = n(v);
  return x === null ? null : +(x * 100).toFixed(2);
}
function fmt(v: unknown): number | null {
  const x = n(v);
  return x === null ? null : +x.toFixed(4);
}

// ── Quote ─────────────────────────────────────────────────────────────────────

export async function getQuote(ticker: string): Promise<StockQuote | null> {
  try {
    const q: any = await (yahooFinance.quote as any)(ticker);
    if (!q) return null;

    const detail: any = await (yahooFinance.quoteSummary as any)(ticker,
      { modules: ['price', 'summaryDetail', 'defaultKeyStatistics'] },
    ).catch(() => ({}));

    const kstat: any = (detail as any)?.defaultKeyStatistics ?? {};
    const sd: any    = (detail as any)?.summaryDetail ?? {};

    return {
      ticker:          q.symbol ?? ticker,
      name:            q.longName ?? q.shortName ?? ticker,
      price:           q.regularMarketPrice ?? 0,
      change:          q.regularMarketChange ?? 0,
      changePct:       +(q.regularMarketChangePercent ?? 0).toFixed(2),
      open:            q.regularMarketOpen ?? 0,
      high:            q.regularMarketDayHigh ?? 0,
      low:             q.regularMarketDayLow ?? 0,
      prevClose:       q.regularMarketPreviousClose ?? 0,
      volume:          q.regularMarketVolume ?? 0,
      avgVolume:       q.averageDailyVolume3Month ?? q.averageDailyVolume10Day ?? 0,
      marketCap:       n(q.marketCap),
      currency:        q.currency ?? 'USD',
      exchange:        q.fullExchangeName ?? q.exchange ?? '',
      marketState:     (q.marketState as StockQuote['marketState']) ?? 'CLOSED',
      preMarketPrice:  n(q.preMarketPrice),
      preMarketChange: typeof q.preMarketChangePercent === 'number' ? +q.preMarketChangePercent.toFixed(2) : null,
      postMarketPrice: n(q.postMarketPrice),
      postMarketChange: typeof q.postMarketChangePercent === 'number' ? +q.postMarketChangePercent.toFixed(2) : null,
      week52High:      q.fiftyTwoWeekHigh ?? 0,
      week52Low:       q.fiftyTwoWeekLow ?? 0,
      beta:            n(kstat?.beta ?? sd?.beta ?? q.beta),
      pe:              n(q.trailingPE),
      eps:             n(q.epsTrailingTwelveMonths),
      forwardPE:       n(q.forwardPE),
      dividendYield:   sd?.dividendYield != null ? +(sd.dividendYield * 100).toFixed(2) : null,
      sector:          null,
      industry:        null,
      updatedAt:       new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

// ── Company Profile ───────────────────────────────────────────────────────────

export async function getProfile(ticker: string): Promise<CompanyProfile | null> {
  try {
    const data: any = await yahooFinance.quoteSummary(ticker, {
      modules: ['summaryProfile', 'price'] as any,
    });
    const p  = data?.summaryProfile ?? {};
    const pr = data?.price ?? {};
    if (!p.longBusinessSummary && !p.sector) return null;

    return {
      ticker,
      name:        pr?.longName ?? pr?.shortName ?? ticker,
      description: p.longBusinessSummary ?? '',
      sector:      p.sector ?? 'Unknown',
      industry:    p.industry ?? 'Unknown',
      website:     p.website ?? '',
      employees:   n(p.fullTimeEmployees),
      country:     p.country ?? '',
      city:        p.city ?? '',
      state:       p.state ?? '',
      exchange:    pr?.exchangeName ?? '',
      logo:        `https://logo.clearbit.com/${(p.website ?? '').replace(/^https?:\/\//, '').split('/')[0]}`,
    };
  } catch {
    return null;
  }
}

// ── Financial Metrics ─────────────────────────────────────────────────────────

export async function getFinancials(ticker: string): Promise<FinancialMetrics | null> {
  try {
    const data: any = await yahooFinance.quoteSummary(ticker, {
      modules: ['financialData', 'defaultKeyStatistics', 'summaryDetail', 'price'] as any,
    });

    const fd  = data?.financialData         ?? {};
    const ks  = data?.defaultKeyStatistics  ?? {};
    const sd  = data?.summaryDetail         ?? {};
    const pr  = data?.price                 ?? {};

    return {
      marketCap:         n(pr?.marketCap ?? sd?.marketCap),
      enterpriseValue:   n(ks?.enterpriseValue),
      pe:                n(sd?.trailingPE),
      forwardPE:         n(sd?.forwardPE ?? ks?.forwardPE),
      peg:               n(ks?.pegRatio),
      priceToBook:       n(ks?.priceToBook),
      priceToSales:      n(ks?.priceToSalesTrailing12Months),
      evToRevenue:       n(ks?.enterpriseToRevenue),
      evToEbitda:        n(ks?.enterpriseToEbitda),

      revenueGrowth:     pct(fd?.revenueGrowth),
      grossMargin:       pct(fd?.grossMargins),
      operatingMargin:   pct(fd?.operatingMargins),
      profitMargin:      pct(fd?.profitMargins),
      returnOnEquity:    pct(fd?.returnOnEquity),
      returnOnAssets:    pct(fd?.returnOnAssets),

      totalRevenue:      n(fd?.totalRevenue),
      revenuePerShare:   n(fd?.revenuePerShare),
      grossProfit:       n(fd?.grossProfits),
      ebitda:            n(fd?.ebitda),
      netIncome:         n(ks?.netIncomeToCommon),
      eps:               n(ks?.trailingEps),
      epsGrowth:         pct(ks?.earningsQuarterlyGrowth),

      totalCash:         n(fd?.totalCash),
      totalDebt:         n(fd?.totalDebt),
      debtToEquity:      fmt(fd?.debtToEquity),
      currentRatio:      fmt(fd?.currentRatio),
      quickRatio:        fmt(fd?.quickRatio),

      freeCashFlow:      n(fd?.freeCashflow),
      operatingCashFlow: n(fd?.operatingCashflow),

      beta:              n(ks?.beta ?? sd?.beta),
      sharesOutstanding: n(ks?.sharesOutstanding),
      sharesFloat:       n(ks?.floatShares),
      shortRatio:        fmt(ks?.shortRatio),
      shortPct:          pct(ks?.shortPercentOfFloat),
      dividendYield:     sd?.dividendYield != null ? +(sd.dividendYield * 100).toFixed(2) : null,
      payoutRatio:       sd?.payoutRatio != null ? +(sd.payoutRatio * 100).toFixed(2) : null,
    };
  } catch {
    return null;
  }
}

// ── Price History ─────────────────────────────────────────────────────────────

type HistRange = '1d' | '5d' | '1mo' | '3mo' | '1y' | '5y';
type HistInterval = '1m' | '5m' | '1d' | '1wk';

export async function getHistory(ticker: string, range: HistRange = '1y'): Promise<PricePoint[]> {
  try {
    const intervalMap: Record<HistRange, HistInterval> = {
      '1d':  '5m',
      '5d':  '5m',
      '1mo': '1d',
      '3mo': '1d',
      '1y':  '1d',
      '5y':  '1wk',
    };
    const period1Map: Record<HistRange, Date> = {
      '1d':  new Date(Date.now() - 86_400_000),
      '5d':  new Date(Date.now() - 5 * 86_400_000),
      '1mo': new Date(Date.now() - 30 * 86_400_000),
      '3mo': new Date(Date.now() - 90 * 86_400_000),
      '1y':  new Date(Date.now() - 365 * 86_400_000),
      '5y':  new Date(Date.now() - 5 * 365 * 86_400_000),
    };

    const history: any[] = await yahooFinance.historical(ticker, {
      period1:  period1Map[range],
      period2:  new Date(),
      interval: intervalMap[range] as any,
    });

    return history.map((h: any) => ({
      date:     h.date instanceof Date ? h.date.toISOString() : String(h.date),
      open:     h.open ?? 0,
      high:     h.high ?? 0,
      low:      h.low ?? 0,
      close:    h.close ?? 0,
      volume:   h.volume ?? 0,
      adjClose: h.adjClose ?? undefined,
    }));
  } catch {
    return [];
  }
}

// ── Analyst Ratings ───────────────────────────────────────────────────────────

export async function getAnalystData(ticker: string, currentPrice: number): Promise<{
  ratings: AnalystRatings;
  recentActions: AnalystAction[];
}> {
  try {
    const data: any = await yahooFinance.quoteSummary(ticker, {
      modules: ['recommendationTrend', 'upgradeDowngradeHistory', 'financialData'] as any,
    });

    const trend   = data?.recommendationTrend?.trend?.[0] ?? {};
    const history: any[] = data?.upgradeDowngradeHistory?.history?.slice(0, 10) ?? [];
    const fd      = data?.financialData ?? {};

    const strongBuy  = trend?.strongBuy  ?? 0;
    const buy        = trend?.buy        ?? 0;
    const hold       = trend?.hold       ?? 0;
    const sell       = trend?.sell       ?? 0;
    const strongSell = trend?.strongSell ?? 0;
    const total      = strongBuy + buy + hold + sell + strongSell;

    const bullPct = total > 0 ? (strongBuy + buy) / total : 0;
    const bearPct = total > 0 ? (sell + strongSell) / total : 0;

    let consensus: AnalystRatings['consensus'] = 'Hold';
    if      (bullPct >= 0.7)  consensus = 'Strong Buy';
    else if (bullPct >= 0.55) consensus = 'Buy';
    else if (bearPct >= 0.7)  consensus = 'Strong Sell';
    else if (bearPct >= 0.55) consensus = 'Sell';

    const avgTarget  = n(fd?.targetMeanPrice);
    const highTarget = n(fd?.targetHighPrice);
    const lowTarget  = n(fd?.targetLowPrice);
    const numAnalysts = n(fd?.numberOfAnalystOpinions);

    return {
      ratings: {
        strongBuy, buy, hold, sell, strongSell, consensus,
        avgPriceTarget:   avgTarget,
        highPriceTarget:  highTarget,
        lowPriceTarget:   lowTarget,
        numberOfAnalysts: numAnalysts ?? total,
        priceTargetUpside: avgTarget && currentPrice > 0
          ? +((avgTarget / currentPrice - 1) * 100).toFixed(1) : null,
      },
      recentActions: history.map((h: any) => ({
        date:      h.epochGradeDate instanceof Date ? h.epochGradeDate.toISOString() : String(h.epochGradeDate ?? ''),
        firm:      h.firm ?? '',
        action:    (['upgrade', 'downgrade', 'init', 'reiterate'].includes(h.action) ? h.action : 'reiterate') as AnalystAction['action'],
        fromGrade: h.fromGrade ?? null,
        toGrade:   h.toGrade ?? '',
      })),
    };
  } catch {
    return {
      ratings: {
        strongBuy: 0, buy: 0, hold: 0, sell: 0, strongSell: 0,
        consensus: 'Hold', avgPriceTarget: null, highPriceTarget: null,
        lowPriceTarget: null, numberOfAnalysts: 0, priceTargetUpside: null,
      },
      recentActions: [],
    };
  }
}

// ── Insider Activity ──────────────────────────────────────────────────────────

export async function getInsiderActivity(ticker: string): Promise<InsiderSummary> {
  const empty: InsiderSummary = { netBuyShares: 0, netBuyValue: 0, netTransactions: 0, transactions: [] };
  try {
    const data: any = await yahooFinance.quoteSummary(ticker, {
      modules: ['insiderTransactions'] as any,
    });

    const txns: any[] = data?.insiderTransactions?.transactions ?? [];
    const mapped: InsiderTransaction[] = txns.slice(0, 20).map((t: any) => {
      const shares = n(t.shares) ?? 0;
      const val    = n(t.value) ?? 0;
      const price  = shares > 0 ? val / shares : 0;
      const isSell = (t.transactionDescription ?? '').toLowerCase().includes('sale') ||
                     (t.transactionDescription ?? '').toLowerCase().includes('sell');
      return {
        date:          t.startDate instanceof Date ? t.startDate.toISOString() : String(t.startDate ?? ''),
        name:          t.filerName ?? '',
        title:         t.filerRelation ?? '',
        type:          isSell ? 'sell' : 'buy',
        shares:        Math.abs(shares),
        value:         val,
        pricePerShare: price,
      };
    });

    const netShares = mapped.reduce((s, t) => s + (t.type === 'buy' ? t.shares : -t.shares), 0);
    const netValue  = mapped.reduce((s, t) => s + (t.type === 'buy' ? t.value : -t.value), 0);
    const netTxns   = mapped.reduce((s, t) => s + (t.type === 'buy' ? 1 : -1), 0);

    return { netBuyShares: netShares, netBuyValue: netValue, netTransactions: netTxns, transactions: mapped };
  } catch {
    return empty;
  }
}

// ── Earnings ─────────────────────────────────────────────────────────────────

export async function getEarnings(ticker: string): Promise<EarningsQuarter[]> {
  try {
    const data: any = await yahooFinance.quoteSummary(ticker, {
      modules: ['earnings'] as any,
    });

    const quarterly: any[] = data?.earnings?.earningsChart?.quarterly ?? [];
    return quarterly.map((q: any) => {
      const surprise = q.actual != null && q.estimate != null && q.estimate !== 0
        ? +((q.actual - q.estimate) / Math.abs(q.estimate) * 100).toFixed(1) : null;
      return {
        period:   q.date ?? '',
        date:     q.date ?? '',
        actual:   n(q.actual),
        estimate: n(q.estimate),
        surprise,
      };
    });
  } catch {
    return [];
  }
}

// ── News ──────────────────────────────────────────────────────────────────────

export async function getNews(ticker: string, count = 20): Promise<NewsArticle[]> {
  try {
    const results: any = await yahooFinance.search(ticker, { newsCount: count, quotesCount: 0 });
    const news: any[] = results?.news ?? [];
    return news.map((item: any) => ({
      title:       item.title ?? '',
      url:         item.link ?? '',
      publisher:   item.publisher ?? '',
      publishedAt: item.providerPublishTime instanceof Date
        ? item.providerPublishTime.toISOString()
        : new Date((item.providerPublishTime ?? 0) * 1000).toISOString(),
      summary:     '',
      tickers:     item.relatedTickers ?? [],
      thumbnail:   item.thumbnail?.resolutions?.[0]?.url ?? undefined,
    }));
  } catch {
    return [];
  }
}

// ── Market Overview ───────────────────────────────────────────────────────────

const INDEX_SYMBOLS = ['^GSPC', '^DJI', '^IXIC', '^RUT', '^VIX'];
const INDEX_NAMES: Record<string, string> = {
  '^GSPC': 'S&P 500',
  '^DJI':  'Dow Jones',
  '^IXIC': 'Nasdaq',
  '^RUT':  'Russell 2000',
  '^VIX':  'VIX',
};

const SECTOR_ETFS: { symbol: string; sector: string }[] = [
  { symbol: 'XLK',  sector: 'Technology' },
  { symbol: 'XLF',  sector: 'Financials' },
  { symbol: 'XLV',  sector: 'Healthcare' },
  { symbol: 'XLY',  sector: 'Consumer Discr.' },
  { symbol: 'XLP',  sector: 'Consumer Staples' },
  { symbol: 'XLE',  sector: 'Energy' },
  { symbol: 'XLI',  sector: 'Industrials' },
  { symbol: 'XLU',  sector: 'Utilities' },
  { symbol: 'XLRE', sector: 'Real Estate' },
  { symbol: 'XLB',  sector: 'Materials' },
  { symbol: 'XLC',  sector: 'Communication' },
];

export async function getMarketOverview(): Promise<MarketOverview> {
  try {
    const [indexResults, sectorResults, screenResults] = await Promise.allSettled([
      Promise.all(INDEX_SYMBOLS.map(s => (yahooFinance.quote as any)(s).catch(() => null))),
      Promise.all(SECTOR_ETFS.map(s => (yahooFinance.quote as any)(s.symbol).catch(() => null))),
      Promise.allSettled([
        yahooFinance.screener({ scrIds: 'day_gainers', count: 10 }),
        yahooFinance.screener({ scrIds: 'day_losers',  count: 10 }),
        yahooFinance.screener({ scrIds: 'most_actives', count: 10 }),
      ]),
    ]);

    const indices: IndexQuote[] = [];
    if (indexResults.status === 'fulfilled') {
      for (const q of indexResults.value) {
        if (!q) continue;
        const qr = q as any;
        indices.push({
          symbol:    qr.symbol,
          name:      INDEX_NAMES[qr.symbol] ?? qr.shortName ?? qr.symbol,
          price:     qr.regularMarketPrice ?? 0,
          change:    qr.regularMarketChange ?? 0,
          changePct: +(qr.regularMarketChangePercent ?? 0).toFixed(2),
        });
      }
    }

    const sectors: SectorPerf[] = [];
    if (sectorResults.status === 'fulfilled') {
      for (let i = 0; i < sectorResults.value.length; i++) {
        const q = sectorResults.value[i] as any;
        if (!q) continue;
        sectors.push({
          sector:    SECTOR_ETFS[i]?.sector ?? q.symbol,
          symbol:    q.symbol,
          changePct: +(q.regularMarketChangePercent ?? 0).toFixed(2),
        });
      }
    }

    const toMover = (q: any): MarketMover => ({
      ticker:    String(q.symbol ?? ''),
      name:      String(q.shortName ?? q.longName ?? q.symbol ?? ''),
      price:     Number(q.regularMarketPrice ?? 0),
      change:    Number(q.regularMarketChange ?? 0),
      changePct: +(Number(q.regularMarketChangePercent ?? 0)).toFixed(2),
      volume:    Number(q.regularMarketVolume ?? 0),
      marketCap: n(q.marketCap),
    });

    let gainers: MarketMover[] = [], losers: MarketMover[] = [], actives: MarketMover[] = [];
    if (screenResults.status === 'fulfilled') {
      const [gRes, lRes, aRes] = screenResults.value;
      if (gRes.status === 'fulfilled') gainers = ((gRes.value as any).quotes ?? []).map(toMover);
      if (lRes.status === 'fulfilled') losers  = ((lRes.value as any).quotes ?? []).map(toMover);
      if (aRes.status === 'fulfilled') actives = ((aRes.value as any).quotes ?? []).map(toMover);
    }

    // Derive market state from the actual Yahoo marketState field on the first index quote.
    // Yahoo returns PRE/POST/PREPRE/POSTPOST/REGULAR/CLOSED — map to our union.
    const rawState: string = (indexResults.status === 'fulfilled' && (indexResults.value[0] as any)?.marketState) || 'CLOSED';
    const marketState: MarketOverview['marketState'] =
      rawState === 'REGULAR' ? 'REGULAR' :
      (rawState === 'PRE' || rawState === 'PREPRE') ? 'PRE' :
      (rawState === 'POST' || rawState === 'POSTPOST') ? 'POST' :
      'CLOSED';

    return { indices, gainers, losers, actives, sectors, marketState, updatedAt: new Date().toISOString() };
  } catch {
    return { indices: [], gainers: [], losers: [], actives: [], sectors: [], marketState: 'CLOSED', updatedAt: new Date().toISOString() };
  }
}

// ── Search ────────────────────────────────────────────────────────────────────

export async function searchStocks(query: string): Promise<{ ticker: string; name: string; exchange: string; type: string }[]> {
  try {
    const results: any = await yahooFinance.search(query, { quotesCount: 10, newsCount: 0 });
    return (results?.quotes ?? []).map((q: any) => ({
      ticker:   q.symbol,
      name:     q.longname ?? q.shortname ?? q.symbol,
      exchange: q.exchange ?? '',
      type:     q.quoteType ?? 'EQUITY',
    }));
  } catch {
    return [];
  }
}

// ── Earnings Calendar ─────────────────────────────────────────────────────────

export async function getEarningsCalendar(tickers: string[]): Promise<EarningsCalendarItem[]> {
  const results: EarningsCalendarItem[] = [];
  await Promise.allSettled(
    tickers.map(async ticker => {
      try {
        const data: any = await yahooFinance.quoteSummary(ticker, { modules: ['calendarEvents', 'price'] as any });
        const evt = data?.calendarEvents;
        const pr  = data?.price;
        const earningsDate = evt?.earnings?.earningsDate?.[0];
        if (earningsDate) {
          results.push({
            ticker,
            name:        pr?.longName ?? pr?.shortName ?? ticker,
            date:        earningsDate instanceof Date ? earningsDate.toISOString() : String(earningsDate),
            epsEstimate: n(evt?.earnings?.epsEstimate),
            when:        'Unknown',
          });
        }
      } catch { /* skip */ }
    }),
  );
  return results.sort((a, b) => a.date.localeCompare(b.date));
}
