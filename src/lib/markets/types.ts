/**
 * Prediction market analysis types.
 *
 * EdgeAI generates its own independent probability predictions.
 * Market data is a supplementary signal — used to detect disagreements,
 * adjust confidence, and track model vs market accuracy over time.
 */

// ── Edge classification ───────────────────────────────────────────────────────

export type MarketEdge =
  | 'strong-model'     // model home prob >8% above market (model sees value)
  | 'moderate-model'   // model home prob 4–8% above market
  | 'agreement'        // within ±4% — model and market agree
  | 'moderate-market'  // market home prob 4–8% above model
  | 'strong-market';   // market home prob >8% above model (market very different)

// ── Line movement signal ──────────────────────────────────────────────────────

export type LineMovementSignal =
  | 'sharp-money'   // large move, often reverse public split → professional action
  | 'injury-news'   // sudden move, likely player news
  | 'public-heavy'  // gradual move toward popular side
  | 'neutral';      // normal market fluctuation

// ── Core market analysis result ───────────────────────────────────────────────

export interface MarketAnalysis {
  // Implied probabilities — bookmaker vig removed (Shin method)
  marketHomeProb: number;       // 0–100
  marketAwayProb: number;       // 0–100
  marketDrawProb: number;       // 0–100 (0 for sports without draws)

  // EdgeAI model probabilities (0–100)
  modelHomeProb: number;
  modelAwayProb: number;

  // Agreement / disagreement
  homeEdge: number;             // modelHomeProb − marketHomeProb (+ = model favors home more)
  edgeClassification: MarketEdge;
  edgeLabel: string;            // human-readable, e.g. "Strong Model Edge"

  // Raw consensus odds (American)
  homeMoneyline: number;
  awayMoneyline: number;
  drawMoneyline: number | null;
  spread: number;               // home team spread, e.g. −3.5
  overUnder: number;

  // Opening vs current
  openingHomeMoneyline: number;
  openingAwayMoneyline: number;
  openingSpread: number;

  // Line movement
  moneylineMovement: number;    // change in home moneyline (opening → current)
  spreadMovement: number;       // change in spread (opening → current, negative = home favored more)
  movementSignal: LineMovementSignal;
  movementExplanation: string;

  // Public betting (0–100, may be 50/50 default when unavailable)
  publicBettingPctHome: number;
  publicBettingPctAway: number;
  sharpMoneyDirection: 'home' | 'away' | 'split';

  // Confidence impact
  confidenceAdjustment: number; // −10 to +5 pp applied to model confidence
  confidenceReason: string;

  // AI-generated explanation
  marketExplanation: string;

  // Meta
  hasLiveOdds: boolean;         // false when no odds API key or no data
  booksCount: number;
  updatedAt: string;
}

// ── Market accuracy history entry ─────────────────────────────────────────────

export interface MarketAccuracyRecord {
  gameId:         string;
  sport:          string;
  date:           string;
  modelHomeProb:  number;
  marketHomeProb: number;
  homeEdge:       number;
  modelCorrect:   boolean;
  marketCorrect:  boolean;        // would market implied pick have been correct?
  edgeClassification: MarketEdge;
}

// ── Aggregate market performance stats ────────────────────────────────────────

export interface MarketPerformanceStats {
  totalGames:          number;
  modelVsMarketWinRate: number;   // % games model was right when it disagreed with market
  agreeAccuracy:       number;    // % correct when agreeing with market
  disagreeAccuracy:    number;    // % correct when disagreeing with market
  strongEdgeAccuracy:  number;    // % correct on strong-model-edge calls
  avgEdge:             number;    // average homeEdge across all games
  byClassification: Record<MarketEdge, { games: number; accuracy: number }>;
}
