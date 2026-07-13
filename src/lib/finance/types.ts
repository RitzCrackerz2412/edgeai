// ── Core Quote ──────────────────────────────────────────────────────────────

export interface StockQuote {
  ticker:        string;
  name:          string;
  price:         number;
  change:        number;
  changePct:     number;
  open:          number;
  high:          number;
  low:           number;
  prevClose:     number;
  volume:        number;
  avgVolume:     number;
  marketCap:     number | null;
  currency:      string;
  exchange:      string;
  marketState:   'REGULAR' | 'PRE' | 'POST' | 'CLOSED' | 'PREPRE' | 'POSTPOST';
  preMarketPrice?:    number | null;
  preMarketChange?:   number | null;
  postMarketPrice?:   number | null;
  postMarketChange?:  number | null;
  week52High:    number;
  week52Low:     number;
  beta:          number | null;
  pe:            number | null;
  eps:           number | null;
  forwardPE:     number | null;
  dividendYield: number | null;
  sector:        string | null;
  industry:      string | null;
  updatedAt:     string;
}

// ── Company Profile ──────────────────────────────────────────────────────────

export interface CompanyProfile {
  ticker:      string;
  name:        string;
  description: string;
  sector:      string;
  industry:    string;
  website:     string;
  employees:   number | null;
  country:     string;
  city:        string;
  state:       string;
  exchange:    string;
  logo:        string;
}

// ── Financial Data ───────────────────────────────────────────────────────────

export interface FinancialMetrics {
  // Valuation
  marketCap:          number | null;
  enterpriseValue:    number | null;
  pe:                 number | null;
  forwardPE:          number | null;
  peg:                number | null;
  priceToBook:        number | null;
  priceToSales:       number | null;
  evToRevenue:        number | null;
  evToEbitda:         number | null;

  // Profitability
  revenueGrowth:      number | null; // YoY %
  grossMargin:        number | null; // %
  operatingMargin:    number | null; // %
  profitMargin:       number | null; // %
  returnOnEquity:     number | null; // %
  returnOnAssets:     number | null; // %

  // Revenue & Income
  totalRevenue:       number | null;
  revenuePerShare:    number | null;
  grossProfit:        number | null;
  ebitda:             number | null;
  netIncome:          number | null;
  eps:                number | null;
  epsGrowth:          number | null;

  // Balance Sheet
  totalCash:          number | null;
  totalDebt:          number | null;
  debtToEquity:       number | null;
  currentRatio:       number | null;
  quickRatio:         number | null;

  // Cash Flow
  freeCashFlow:       number | null;
  operatingCashFlow:  number | null;

  // Other
  beta:               number | null;
  sharesOutstanding:  number | null;
  sharesFloat:        number | null;
  shortRatio:         number | null;
  shortPct:           number | null;
  dividendYield:      number | null;
  payoutRatio:        number | null;
}

// ── Historical Price ─────────────────────────────────────────────────────────

export interface PricePoint {
  date:   string; // ISO
  open:   number;
  high:   number;
  low:    number;
  close:  number;
  volume: number;
  adjClose?: number;
}

// ── Analyst Data ─────────────────────────────────────────────────────────────

export interface AnalystRatings {
  strongBuy:   number;
  buy:         number;
  hold:        number;
  sell:        number;
  strongSell:  number;
  consensus:   'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell';
  avgPriceTarget: number | null;
  highPriceTarget: number | null;
  lowPriceTarget:  number | null;
  numberOfAnalysts: number;
  priceTargetUpside: number | null; // % from current price
}

export interface AnalystAction {
  date:         string;
  firm:         string;
  action:       'upgrade' | 'downgrade' | 'init' | 'reiterate';
  fromGrade:    string | null;
  toGrade:      string;
}

// ── Insider Activity ─────────────────────────────────────────────────────────

export interface InsiderTransaction {
  date:         string;
  name:         string;
  title:        string;
  type:         'buy' | 'sell' | 'option' | 'grant';
  shares:       number;
  value:        number;
  pricePerShare: number;
}

export interface InsiderSummary {
  netBuyShares:    number;
  netBuyValue:     number;
  netTransactions: number; // positive = net buying
  transactions:    InsiderTransaction[];
}

// ── Earnings ─────────────────────────────────────────────────────────────────

export interface EarningsQuarter {
  period:     string; // e.g. "Q3 2024"
  date:       string;
  actual:     number | null;
  estimate:   number | null;
  surprise:   number | null; // %
}

export interface EarningsCalendarItem {
  ticker:    string;
  name:      string;
  date:      string;
  epsEstimate: number | null;
  when:      'Before Open' | 'After Close' | 'Unknown';
}

// ── Market Overview ───────────────────────────────────────────────────────────

export interface IndexQuote {
  symbol: string;
  name:   string;
  price:  number;
  change: number;
  changePct: number;
  ytdPct?: number;
}

export interface SectorPerf {
  sector:    string;
  changePct: number;
  symbol:    string;
}

export interface MarketMover {
  ticker:    string;
  name:      string;
  price:     number;
  change:    number;
  changePct: number;
  volume:    number;
  marketCap: number | null;
}

export interface MarketOverview {
  indices:     IndexQuote[];
  gainers:     MarketMover[];
  losers:      MarketMover[];
  actives:     MarketMover[];
  sectors:     SectorPerf[];
  marketState: 'REGULAR' | 'PRE' | 'POST' | 'CLOSED';
  updatedAt:   string;
}

// ── News ─────────────────────────────────────────────────────────────────────

export interface NewsArticle {
  title:       string;
  url:         string;
  publisher:   string;
  publishedAt: string;
  summary:     string;
  tickers:     string[];
  thumbnail?:  string;
}

// ── Research Report ───────────────────────────────────────────────────────────

export type ResearchRating =
  | 'Strong Buy' | 'Buy' | 'Neutral' | 'Sell' | 'Strong Sell';

export type Outlook = 'Positive' | 'Cautious Positive' | 'Neutral' | 'Cautious Negative' | 'Negative';

export interface ScoreBreakdown {
  label:      string;
  score:      number; // 0-100
  maxScore:   number;
  signal:     'positive' | 'neutral' | 'negative';
  details:    string[];
}

export interface ResearchFactor {
  label:    string;
  positive: boolean;
  weight:   number; // magnitude of impact
  detail:   string;
}

export interface ResearchReport {
  ticker:          string;
  name:            string;
  rating:          ResearchRating;
  compositeScore:  number;        // 0-100
  outlook:         Outlook;
  confidence:      number;        // 0-100
  priceTarget:     number | null; // analyst consensus
  potentialUpside: number | null; // % from current

  // Score breakdown
  scores: {
    financial: ScoreBreakdown;
    valuation: ScoreBreakdown;
    momentum:  ScoreBreakdown;
    analyst:   ScoreBreakdown;
    insider:   ScoreBreakdown;
  };

  // Key factors driving the rating
  bullFactors:  ResearchFactor[];
  bearFactors:  ResearchFactor[];

  // Narrative sections
  executiveSummary:     string;
  financialHealthNote:  string;
  valuationNote:        string;
  technicalNote:        string;
  riskNote:             string;
  catalystNote:         string;
  bullCase:             string;
  bearCase:             string;

  generatedAt: string;
}

// ── Scanner ───────────────────────────────────────────────────────────────────

export type ScannerPreset =
  | 'high_growth'
  | 'deep_value'
  | 'momentum_leaders'
  | 'dividend_growth'
  | 'insider_buying'
  | 'analyst_upgrades'
  | 'low_debt_high_fcf'
  | 'earnings_beat';

export interface ScannerResult {
  ticker:     string;
  name:       string;
  price:      number;
  changePct:  number;
  marketCap:  number | null;
  score:      number;
  matchReason: string;
  metrics:    Partial<FinancialMetrics>;
}

// ── Portfolio ─────────────────────────────────────────────────────────────────

export interface PortfolioHolding {
  ticker:       string;
  name:         string;
  shares:       number;
  costBasis:    number;
  currentPrice: number;
  marketValue:  number;
  gainLoss:     number;
  gainLossPct:  number;
  weight:       number; // % of portfolio
  sector:       string | null;
  changePct:    number; // today's change
}

export interface PortfolioSummary {
  totalValue:     number;
  totalCost:      number;
  totalGainLoss:  number;
  totalGainLossPct: number;
  dayChange:      number;
  dayChangePct:   number;
  holdings:       PortfolioHolding[];
  sectorWeights:  { sector: string; weight: number }[];
  diversificationScore: number; // 0-100
}
