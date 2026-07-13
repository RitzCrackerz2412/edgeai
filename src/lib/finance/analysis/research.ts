import type {
  FinancialMetrics, AnalystRatings, InsiderSummary, PricePoint,
  ResearchReport, ResearchRating, ScoreBreakdown, ResearchFactor, Outlook,
} from '../types';

// ── Scoring helpers ───────────────────────────────────────────────────────────

function clamp(v: number, min = 0, max = 100) { return Math.max(min, Math.min(max, v)); }
function lerp(v: number, lo: number, hi: number, outLo = 0, outHi = 100) {
  if (hi === lo) return outLo;
  return clamp(outLo + ((v - lo) / (hi - lo)) * (outHi - outLo), outLo, outHi);
}

// ── Financial Health Score ────────────────────────────────────────────────────

function scoreFinancial(m: FinancialMetrics): ScoreBreakdown {
  let score = 50;
  const details: string[] = [];

  if (m.revenueGrowth != null) {
    const pts = lerp(m.revenueGrowth, -20, 30, -15, 20);
    score += pts;
    if (m.revenueGrowth > 15) details.push(`Revenue growing ${m.revenueGrowth.toFixed(1)}% YoY`);
    else if (m.revenueGrowth < 0) details.push(`Revenue declining ${Math.abs(m.revenueGrowth).toFixed(1)}% YoY`);
    else details.push(`Revenue growth ${m.revenueGrowth.toFixed(1)}% YoY`);
  }

  if (m.grossMargin != null) {
    const pts = lerp(m.grossMargin, 0, 80, -10, 15);
    score += pts;
    details.push(`Gross margin ${m.grossMargin.toFixed(1)}%`);
  }

  if (m.freeCashFlow != null) {
    const pts = m.freeCashFlow > 0 ? 8 : m.freeCashFlow > -1e8 ? -3 : -10;
    score += pts;
    details.push(m.freeCashFlow > 0 ? 'Positive free cash flow' : 'Negative free cash flow');
  }

  if (m.debtToEquity != null) {
    const pts = lerp(m.debtToEquity, 0, 300, 8, -12);
    score += pts;
    if (m.debtToEquity > 150) details.push(`High D/E ratio of ${m.debtToEquity.toFixed(0)}%`);
    else if (m.debtToEquity < 50) details.push(`Low leverage (D/E ${m.debtToEquity.toFixed(0)}%)`);
  }

  if (m.profitMargin != null) {
    const pts = lerp(m.profitMargin, -20, 30, -10, 15);
    score += pts;
    details.push(`Net margin ${m.profitMargin.toFixed(1)}%`);
  }

  if (m.returnOnEquity != null) {
    const pts = lerp(m.returnOnEquity, -10, 40, -8, 12);
    score += pts;
  }

  return {
    label:    'Financial Health',
    score:    clamp(Math.round(score)),
    maxScore: 100,
    signal:   score >= 65 ? 'positive' : score >= 45 ? 'neutral' : 'negative',
    details,
  };
}

// ── Valuation Score ───────────────────────────────────────────────────────────

function scoreValuation(m: FinancialMetrics, currentPrice: number): ScoreBreakdown {
  let score = 50;
  const details: string[] = [];

  // PE ratio
  if (m.pe != null && m.pe > 0) {
    // Consider a PE below 15 as cheap, above 40 as expensive
    const pts = lerp(m.pe, 5, 60, 20, -20);
    score += pts;
    if (m.pe < 15) details.push(`Low P/E of ${m.pe.toFixed(1)}x — potentially undervalued`);
    else if (m.pe > 40) details.push(`High P/E of ${m.pe.toFixed(1)}x — growth premium priced in`);
    else details.push(`P/E ratio ${m.pe.toFixed(1)}x`);
  }

  // PEG ratio
  if (m.peg != null && m.peg > 0) {
    const pts = lerp(m.peg, 0.5, 3, 15, -15);
    score += pts;
    if (m.peg < 1) details.push(`Attractive PEG of ${m.peg.toFixed(2)} (below 1 = growth at value)`);
    else if (m.peg > 2) details.push(`High PEG of ${m.peg.toFixed(2)} — growth may be overpriced`);
  }

  // Forward PE discount vs trailing
  if (m.forwardPE != null && m.pe != null && m.pe > 0 && m.forwardPE > 0) {
    const discount = (m.pe - m.forwardPE) / m.pe;
    if (discount > 0.1) { score += 10; details.push('Earnings growth expected — forward PE lower than trailing'); }
    else if (discount < -0.1) { score -= 8; details.push('Forward PE above trailing — earnings expected to decline'); }
  }

  // Price to Book
  if (m.priceToBook != null && m.priceToBook > 0) {
    const pts = lerp(m.priceToBook, 0.5, 10, 10, -10);
    score += pts;
    if (m.priceToBook < 1.5) details.push(`Trading near book value (P/B ${m.priceToBook.toFixed(1)}x)`);
  }

  // Price to Sales
  if (m.priceToSales != null && m.priceToSales > 0) {
    const pts = lerp(m.priceToSales, 0.5, 20, 8, -10);
    score += pts;
  }

  void currentPrice;
  return {
    label:    'Valuation',
    score:    clamp(Math.round(score)),
    maxScore: 100,
    signal:   score >= 65 ? 'positive' : score >= 40 ? 'neutral' : 'negative',
    details,
  };
}

// ── Momentum Score ────────────────────────────────────────────────────────────

function scoreMomentum(history: PricePoint[], quote: { price: number; week52High: number; week52Low: number; volume: number; avgVolume: number }): ScoreBreakdown {
  let score = 50;
  const details: string[] = [];

  if (history.length > 20) {
    const closes = history.map(h => h.close);
    const latest = closes[closes.length - 1];

    // 52-week position
    const range = quote.week52High - quote.week52Low;
    const pos   = range > 0 ? (latest - quote.week52Low) / range : 0.5;
    const pts   = lerp(pos, 0, 1, -15, 15);
    score += pts;
    const pct52 = (pos * 100).toFixed(0);
    details.push(`At ${pct52}% of 52-week range ($${quote.week52Low.toFixed(2)} – $${quote.week52High.toFixed(2)})`);

    // 50-day vs 200-day MA
    if (closes.length >= 50) {
      const ma50  = closes.slice(-50).reduce((s, v) => s + v, 0) / 50;
      if (closes.length >= 200) {
        const ma200 = closes.slice(-200).reduce((s, v) => s + v, 0) / 200;
        if (ma50 > ma200) { score += 12; details.push('Golden cross: 50-day MA above 200-day MA (bullish trend)'); }
        else               { score -= 10; details.push('Death cross: 50-day MA below 200-day MA (bearish trend)'); }
      }
      if (latest > ma50) { score += 8; details.push('Trading above 50-day moving average'); }
      else                { score -= 6; details.push('Trading below 50-day moving average'); }
    }

    // 1-month return
    if (closes.length >= 22) {
      const ret1m = (latest / closes[closes.length - 22] - 1) * 100;
      const pts1m = lerp(ret1m, -15, 20, -12, 12);
      score += pts1m;
      if (Math.abs(ret1m) > 5) details.push(`${ret1m >= 0 ? '+' : ''}${ret1m.toFixed(1)}% over past month`);
    }

    // Volume trend (relative to avg)
    if (quote.avgVolume > 0) {
      const volRatio = quote.volume / quote.avgVolume;
      if (volRatio > 1.5) { score += 5; details.push('Above-average volume — heightened interest'); }
      else if (volRatio < 0.5) { score -= 3; details.push('Below-average volume'); }
    }
  }

  return {
    label:    'Price Momentum',
    score:    clamp(Math.round(score)),
    maxScore: 100,
    signal:   score >= 62 ? 'positive' : score >= 42 ? 'neutral' : 'negative',
    details,
  };
}

// ── Analyst Score ─────────────────────────────────────────────────────────────

function scoreAnalyst(ratings: AnalystRatings): ScoreBreakdown {
  const details: string[] = [];
  const total = ratings.strongBuy + ratings.buy + ratings.hold + ratings.sell + ratings.strongSell;

  if (total === 0) {
    return {
      label: 'Analyst Consensus', score: 50, maxScore: 100, signal: 'neutral',
      details: ['No analyst coverage data available'],
    };
  }

  const bullPct = (ratings.strongBuy + ratings.buy) / total;
  let score     = lerp(bullPct, 0, 1, 20, 90);

  details.push(`${ratings.numberOfAnalysts || total} analysts: ${ratings.strongBuy + ratings.buy} Buy, ${ratings.hold} Hold, ${ratings.sell + ratings.strongSell} Sell`);
  details.push(`Consensus: ${ratings.consensus}`);

  if (ratings.priceTargetUpside != null) {
    const pts = lerp(ratings.priceTargetUpside, -20, 40, -15, 15);
    score += pts;
    if (ratings.priceTargetUpside > 10) details.push(`Avg. price target implies ${ratings.priceTargetUpside.toFixed(1)}% upside`);
    else if (ratings.priceTargetUpside < -5) details.push(`Avg. price target implies ${Math.abs(ratings.priceTargetUpside).toFixed(1)}% downside`);
  }

  return {
    label:    'Analyst Consensus',
    score:    clamp(Math.round(score)),
    maxScore: 100,
    signal:   score >= 65 ? 'positive' : score >= 45 ? 'neutral' : 'negative',
    details,
  };
}

// ── Insider Score ─────────────────────────────────────────────────────────────

function scoreInsider(insider: InsiderSummary): ScoreBreakdown {
  const details: string[] = [];
  const net = insider.netTransactions;

  let score = 50;
  if (net > 3)       { score = 80; details.push('Strong net insider buying in recent months'); }
  else if (net > 0)  { score = 65; details.push('Moderate insider buying activity'); }
  else if (net === 0) { score = 50; details.push('Neutral insider activity'); }
  else if (net > -3) { score = 40; details.push('Some insider selling — monitor for context'); }
  else               { score = 25; details.push('Significant net insider selling'); }

  const buyCount  = insider.transactions.filter(t => t.type === 'buy').length;
  const sellCount = insider.transactions.filter(t => t.type === 'sell').length;
  if (buyCount > 0 || sellCount > 0) {
    details.push(`${buyCount} purchase(s) vs ${sellCount} sale(s) in tracked window`);
  }

  return {
    label:    'Insider Activity',
    score:    clamp(score),
    maxScore: 100,
    signal:   score >= 65 ? 'positive' : score >= 40 ? 'neutral' : 'negative',
    details,
  };
}

// ── Narrative Generator ───────────────────────────────────────────────────────

function formatBig(n: number | null, prefix = '$'): string {
  if (n == null) return 'N/A';
  if (Math.abs(n) >= 1e12) return `${prefix}${(n / 1e12).toFixed(2)}T`;
  if (Math.abs(n) >= 1e9)  return `${prefix}${(n / 1e9).toFixed(2)}B`;
  if (Math.abs(n) >= 1e6)  return `${prefix}${(n / 1e6).toFixed(2)}M`;
  return `${prefix}${n.toFixed(2)}`;
}

function buildNarratives(
  name: string, ticker: string, m: FinancialMetrics,
  scores: ResearchReport['scores'], analyst: AnalystRatings, compositeScore: number,
  insider: InsiderSummary,
): {
  executiveSummary: string;
  financialHealthNote: string;
  valuationNote: string;
  technicalNote: string;
  riskNote: string;
  catalystNote: string;
  bullCase: string;
  bearCase: string;
} {
  const rating = compositeScore >= 72 ? 'strong buy' : compositeScore >= 60 ? 'buy'
    : compositeScore >= 48 ? 'neutral' : compositeScore >= 36 ? 'cautious' : 'bearish';

  const executiveSummary = [
    `${name} (${ticker}) receives a ${rating} outlook with a composite score of ${compositeScore}/100.`,
    scores.financial.score >= 65
      ? `Financial health is strong, supported by ${m.revenueGrowth != null && m.revenueGrowth > 0 ? `${m.revenueGrowth.toFixed(1)}% revenue growth` : 'solid fundamentals'}.`
      : scores.financial.score < 45
        ? 'Financial health raises concerns that investors should monitor closely.'
        : 'Financial health appears stable.',
    analyst.numberOfAnalysts > 0
      ? `${analyst.numberOfAnalysts} analysts rate the stock ${analyst.consensus.toLowerCase()}, with an average price target of ${formatBig(analyst.avgPriceTarget)}.`
      : '',
    insider.netTransactions > 0
      ? 'Recent insider purchases signal management confidence.'
      : insider.netTransactions < -2
        ? 'Net insider selling warrants additional due diligence.'
        : '',
  ].filter(Boolean).join(' ');

  const financialHealthNote = [
    m.totalRevenue != null ? `${name} generated ${formatBig(m.totalRevenue)} in trailing revenue` : null,
    m.revenueGrowth != null ? `(${m.revenueGrowth > 0 ? '+' : ''}${m.revenueGrowth.toFixed(1)}% YoY growth)` : null,
    m.grossMargin != null ? `, with a gross margin of ${m.grossMargin.toFixed(1)}%` : null,
    m.freeCashFlow != null ? ` and free cash flow of ${formatBig(m.freeCashFlow)}` : null,
    '.',
    m.debtToEquity != null
      ? ` Leverage (D/E ${m.debtToEquity.toFixed(0)}%) is ${m.debtToEquity < 80 ? 'conservative' : m.debtToEquity < 200 ? 'moderate' : 'elevated'}.`
      : '',
    m.returnOnEquity != null
      ? ` Return on equity of ${m.returnOnEquity.toFixed(1)}% ${m.returnOnEquity > 15 ? 'reflects strong capital efficiency' : m.returnOnEquity > 5 ? 'is in line with peers' : 'suggests room for improvement'}.`
      : '',
  ].filter(Boolean).join('');

  const valuationNote = [
    m.pe != null ? `Trailing P/E of ${m.pe.toFixed(1)}x` : 'P/E data unavailable',
    m.forwardPE != null ? ` (forward ${m.forwardPE.toFixed(1)}x)` : '',
    m.priceToBook != null ? `, Price/Book ${m.priceToBook.toFixed(1)}x` : '',
    m.peg != null && m.peg > 0 ? `, PEG ${m.peg.toFixed(2)}` : '',
    '.',
    scores.valuation.score >= 65
      ? ' Valuation appears attractive relative to fundamentals.'
      : scores.valuation.score < 40
        ? ' The stock carries a premium valuation that requires sustained growth to justify.'
        : ' Valuation is in a fair range based on current metrics.',
    analyst.avgPriceTarget != null && analyst.priceTargetUpside != null
      ? ` Analyst consensus target of ${formatBig(analyst.avgPriceTarget)} implies ${analyst.priceTargetUpside > 0 ? '+' : ''}${analyst.priceTargetUpside.toFixed(1)}% potential return.`
      : '',
  ].join('');

  const technicalNote = scores.momentum.details.slice(0, 2).join('. ') + '.';

  const riskNote = [
    m.debtToEquity != null && m.debtToEquity > 200 ? 'High debt levels could pressure performance in a rising-rate environment. ' : '',
    m.shortPct != null && m.shortPct > 15 ? `Significant short interest (${m.shortPct.toFixed(1)}% of float) suggests institutional skepticism. ` : '',
    m.beta != null && m.beta > 1.5 ? `High beta of ${m.beta.toFixed(2)} means above-average sensitivity to market swings. ` : '',
    m.freeCashFlow != null && m.freeCashFlow < 0 ? 'Negative free cash flow requires external financing and dilutes shareholder value. ' : '',
    'Past performance is not indicative of future results. This analysis is for informational purposes only.',
  ].filter(Boolean).join('');

  const catalystNote = [
    analyst.numberOfAnalysts > 0 ? `Watch for changes in the analyst consensus (currently ${analyst.consensus}). ` : '',
    m.revenueGrowth != null && m.revenueGrowth > 15 ? 'Continued revenue acceleration could drive re-rating. ' : '',
    m.freeCashFlow != null && m.freeCashFlow > 0 ? 'Growing free cash flow supports dividend growth or buyback capacity. ' : '',
    'Upcoming earnings reports, macro policy shifts, and sector rotation are key catalysts to monitor.',
  ].filter(Boolean).join('');

  const bullCase = [
    scores.financial.score >= 60 ? `Strong fundamentals (${scores.financial.details[0]?.toLowerCase() ?? 'solid metrics'}) provide a durable foundation. ` : '',
    analyst.priceTargetUpside != null && analyst.priceTargetUpside > 10 ? `Analyst consensus of ${analyst.consensus} with ${analyst.priceTargetUpside.toFixed(1)}% upside suggests material appreciation potential. ` : '',
    scores.valuation.score >= 60 ? 'Attractive valuation relative to growth rates limits downside. ' : '',
    insider.netTransactions > 0 ? 'Insider purchases align management incentives with shareholders. ' : '',
    'A bull case materializes if revenue growth accelerates, margins expand, or sector tailwinds strengthen.',
  ].filter(Boolean).join('');

  const bearCase = [
    scores.financial.score < 45 ? 'Deteriorating financial metrics could accelerate a re-rating lower. ' : '',
    scores.valuation.score < 40 ? 'Premium valuation leaves little room for error — any earnings miss could trigger sharp selloffs. ' : '',
    m.shortPct != null && m.shortPct > 10 ? `Short sellers (${m.shortPct.toFixed(1)}% of float) are betting on decline. ` : '',
    insider.netTransactions < -2 ? 'Net insider selling suggests insiders see limited near-term upside. ' : '',
    'A bear case materializes if macroeconomic conditions worsen, competition intensifies, or growth disappoints consensus estimates.',
  ].filter(Boolean).join('');

  return { executiveSummary, financialHealthNote, valuationNote, technicalNote, riskNote, catalystNote, bullCase, bearCase };
}

// ── Build Key Factors ─────────────────────────────────────────────────────────

function buildFactors(
  m: FinancialMetrics, analyst: AnalystRatings, insider: InsiderSummary, scores: ResearchReport['scores'],
): { bullFactors: ResearchFactor[]; bearFactors: ResearchFactor[] } {
  const bull: ResearchFactor[] = [];
  const bear: ResearchFactor[] = [];

  if (m.revenueGrowth != null) {
    if (m.revenueGrowth > 15) bull.push({ label: 'Revenue Growth', positive: true, weight: Math.min(m.revenueGrowth / 5, 9), detail: `${m.revenueGrowth.toFixed(1)}% YoY growth` });
    else if (m.revenueGrowth < 0) bear.push({ label: 'Revenue Decline', positive: false, weight: Math.min(Math.abs(m.revenueGrowth) / 5, 9), detail: `Revenue down ${Math.abs(m.revenueGrowth).toFixed(1)}% YoY` });
  }
  if (m.grossMargin != null && m.grossMargin > 40) bull.push({ label: 'High Gross Margin', positive: true, weight: Math.min(m.grossMargin / 15, 8), detail: `${m.grossMargin.toFixed(1)}% gross margin` });
  if (m.freeCashFlow != null) {
    if (m.freeCashFlow > 1e8) bull.push({ label: 'Free Cash Flow', positive: true, weight: 7, detail: `Generates ${formatBig(m.freeCashFlow)} FCF` });
    else if (m.freeCashFlow < 0) bear.push({ label: 'Negative FCF', positive: false, weight: 6, detail: `FCF deficit of ${formatBig(Math.abs(m.freeCashFlow))}` });
  }
  if (m.debtToEquity != null && m.debtToEquity > 200) bear.push({ label: 'High Leverage', positive: false, weight: Math.min(m.debtToEquity / 50, 8), detail: `D/E ratio ${m.debtToEquity.toFixed(0)}%` });
  if (m.pe != null && m.pe > 0 && m.pe < 15) bull.push({ label: 'Value Opportunity', positive: true, weight: 6, detail: `Low P/E of ${m.pe.toFixed(1)}x` });
  if (m.pe != null && m.pe > 50) bear.push({ label: 'Premium Valuation', positive: false, weight: 6, detail: `High P/E of ${m.pe.toFixed(1)}x requires sustained growth` });
  if (analyst.priceTargetUpside != null && analyst.priceTargetUpside > 15) bull.push({ label: 'Analyst Upside', positive: true, weight: 7, detail: `Analyst target implies ${analyst.priceTargetUpside.toFixed(1)}% upside` });
  if (analyst.priceTargetUpside != null && analyst.priceTargetUpside < -5) bear.push({ label: 'Analyst Downside', positive: false, weight: 6, detail: `Analyst target implies ${Math.abs(analyst.priceTargetUpside).toFixed(1)}% downside` });
  if (insider.netTransactions > 2) bull.push({ label: 'Insider Buying', positive: true, weight: 8, detail: 'Management buying shares — aligned with shareholders' });
  if (insider.netTransactions < -3) bear.push({ label: 'Insider Selling', positive: false, weight: 7, detail: 'Net insider selling in recent period' });
  if (scores.momentum.score >= 70) bull.push({ label: 'Strong Momentum', positive: true, weight: 6, detail: 'Trading above key moving averages' });
  if (scores.momentum.score <= 35) bear.push({ label: 'Weak Momentum', positive: false, weight: 6, detail: 'Price trend is bearish — below key MAs' });

  return {
    bullFactors: bull.sort((a, b) => b.weight - a.weight).slice(0, 5),
    bearFactors: bear.sort((a, b) => b.weight - a.weight).slice(0, 5),
  };
}

// ── Main Research Generator ───────────────────────────────────────────────────

export function generateResearch(input: {
  ticker: string;
  name: string;
  price: number;
  week52High: number;
  week52Low: number;
  volume: number;
  avgVolume: number;
  metrics: FinancialMetrics;
  analyst: AnalystRatings;
  insider: InsiderSummary;
  history: PricePoint[];
}): ResearchReport {
  const { ticker, name, price, metrics, analyst, insider, history } = input;

  const financial = scoreFinancial(metrics);
  const valuation = scoreValuation(metrics, price);
  const momentum  = scoreMomentum(history, {
    price, week52High: input.week52High, week52Low: input.week52Low,
    volume: input.volume, avgVolume: input.avgVolume,
  });
  const analystScore = scoreAnalyst(analyst);
  const insiderScore = scoreInsider(insider);

  const weights = { financial: 0.30, valuation: 0.25, momentum: 0.20, analyst: 0.15, insider: 0.10 };
  const composite = Math.round(
    financial.score  * weights.financial  +
    valuation.score  * weights.valuation  +
    momentum.score   * weights.momentum   +
    analystScore.score * weights.analyst  +
    insiderScore.score * weights.insider,
  );

  const scores: ResearchReport['scores'] = { financial, valuation, momentum, analyst: analystScore, insider: insiderScore };

  const rating: ResearchRating =
    composite >= 72 ? 'Strong Buy' :
    composite >= 60 ? 'Buy' :
    composite >= 48 ? 'Neutral' :
    composite >= 36 ? 'Sell' : 'Strong Sell';

  const outlook: Outlook =
    composite >= 72 ? 'Positive' :
    composite >= 60 ? 'Cautious Positive' :
    composite >= 48 ? 'Neutral' :
    composite >= 36 ? 'Cautious Negative' : 'Negative';

  const confidence = Math.round(
    (Math.abs(composite - 50) / 50) * 40 + 40 +
    (analyst.numberOfAnalysts > 10 ? 10 : analyst.numberOfAnalysts) +
    (history.length > 100 ? 10 : 0),
  );

  const narratives = buildNarratives(name, ticker, metrics, scores, analyst, composite, insider);
  const { bullFactors, bearFactors } = buildFactors(metrics, analyst, insider, scores);

  return {
    ticker, name, rating, compositeScore: composite, outlook,
    confidence: clamp(confidence),
    priceTarget: analyst.avgPriceTarget,
    potentialUpside: analyst.priceTargetUpside,
    scores,
    bullFactors, bearFactors,
    ...narratives,
    generatedAt: new Date().toISOString(),
  };
}
