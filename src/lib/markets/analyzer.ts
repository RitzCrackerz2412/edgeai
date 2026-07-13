/**
 * Market analysis engine.
 *
 * Takes EdgeAI model probabilities + raw market odds and produces a
 * MarketAnalysis object with edge detection, line movement analysis,
 * confidence adjustment, and a natural-language explanation.
 *
 * The model remains fully independent — market data adjusts confidence
 * but never overrides the predicted winner or probability.
 */

import type { MarketAnalysis, MarketEdge, LineMovementSignal } from './types';
import { americanToCleanProb, vigPct } from './normalize';
import type { RawOdds } from '../providers/types';
import type { Game } from '../types';

// ── Edge classification ───────────────────────────────────────────────────────

function classifyEdge(homeEdgePp: number): MarketEdge {
  if (homeEdgePp >= 8)  return 'strong-model';
  if (homeEdgePp >= 4)  return 'moderate-model';
  if (homeEdgePp <= -8) return 'strong-market';
  if (homeEdgePp <= -4) return 'moderate-market';
  return 'agreement';
}

const EDGE_LABELS: Record<MarketEdge, string> = {
  'strong-model':    'Strong Model Edge',
  'moderate-model':  'Moderate Model Edge',
  'agreement':       'Market Agreement',
  'moderate-market': 'Market Favors Other Side',
  'strong-market':   'Strong Market Disagreement',
};

// ── Line movement signal ──────────────────────────────────────────────────────

function detectMovementSignal(
  spreadMove: number,
  mlMove: number,
  publicHomePct: number,
): { signal: LineMovementSignal; explanation: string } {
  const absSpread = Math.abs(spreadMove);
  const absML     = Math.abs(mlMove);

  // Sharp money: line moves opposite to public betting
  if (absSpread > 1.5 && publicHomePct > 60 && spreadMove > 0) {
    return {
      signal: 'sharp-money',
      explanation: 'Line moved against public betting flow — professional money likely driving this shift.',
    };
  }
  if (absSpread > 1.5 && publicHomePct < 40 && spreadMove < 0) {
    return {
      signal: 'sharp-money',
      explanation: 'Significant line move against public action suggests sharp/professional betting activity.',
    };
  }
  // Sudden large movement → injury/news
  if (absML > 30 || absSpread > 2.5) {
    return {
      signal: 'injury-news',
      explanation: 'Rapid, large line move often indicates breaking news — check injury reports.',
    };
  }
  // Public action: line moves with heavy one-sided public betting
  if (absSpread > 0.5 && ((publicHomePct > 65 && spreadMove < 0) || (publicHomePct < 35 && spreadMove > 0))) {
    return {
      signal: 'public-heavy',
      explanation: 'Gradual line movement consistent with heavy one-sided public betting action.',
    };
  }
  return {
    signal: 'neutral',
    explanation: absSpread > 0.3
      ? `Moderate line movement of ${spreadMove > 0 ? '+' : ''}${spreadMove.toFixed(1)} points — normal market adjustment.`
      : 'Minimal line movement — market has been stable.',
  };
}

// ── Confidence adjustment ─────────────────────────────────────────────────────

function computeConfidenceAdjustment(
  homeEdgePp: number,
  edge: MarketEdge,
  factorsCount: number,
): { adjustment: number; reason: string } {
  switch (edge) {
    case 'agreement':
      return {
        adjustment: +3,
        reason: 'Model and market agree — convergent signals increase confidence.',
      };
    case 'moderate-model':
      return {
        adjustment: factorsCount >= 3 ? 0 : -3,
        reason: factorsCount >= 3
          ? 'Model has moderate edge over market, supported by multiple statistical factors.'
          : 'Moderate disagreement with market — slight confidence reduction pending more data.',
      };
    case 'strong-model':
      return {
        adjustment: factorsCount >= 4 ? +2 : -5,
        reason: factorsCount >= 4
          ? 'Model holds strong edge with robust statistical support — high conviction call.'
          : 'Large disagreement with market without enough statistical support — confidence reduced.',
      };
    case 'moderate-market':
      return {
        adjustment: -5,
        reason: 'Market favors other side moderately — confidence reduced until reconciled.',
      };
    case 'strong-market':
      return {
        adjustment: -10,
        reason: 'Significant market disagreement — model maintains prediction but with reduced confidence.',
      };
  }
}

// ── Natural-language explanation ──────────────────────────────────────────────

function generateExplanation(
  game: Game,
  modelHomeProb: number,
  marketHomeProb: number,
  homeEdge: number,
  edge: MarketEdge,
  movementSignal: LineMovementSignal,
  spreadMove: number,
): string {
  const home = game.homeTeam.name;
  const away = game.awayTeam.name;
  const absDiff = Math.abs(homeEdge).toFixed(1);

  const modelFavors = modelHomeProb >= 50 ? home : away;
  const modelProb   = modelHomeProb >= 50 ? modelHomeProb : 100 - modelHomeProb;
  const marketProb  = modelHomeProb >= 50 ? marketHomeProb : 100 - marketHomeProb;

  let base = `EdgeAI projects ${modelFavors} with a ${modelProb.toFixed(1)}% win probability compared to the market's ${marketProb.toFixed(1)}%.`;

  if (edge === 'agreement') {
    base += ` Both the model and market are aligned on this outcome — convergent signals suggest a reliable prediction.`;
  } else if (edge === 'strong-model' || edge === 'moderate-model') {
    base += ` The ${absDiff}pp difference is primarily driven by ${home}'s stronger recent ${game.homeTeam.offensiveRating > game.awayTeam.offensiveRating ? 'offensive efficiency' : 'defensive metrics'} and a favorable ELO rating advantage.`;
    if (spreadMove !== 0) {
      base += ` Despite ${Math.abs(spreadMove).toFixed(1)}-point line movement ${spreadMove < 0 ? 'toward' : 'away from'} ${home}, the model maintains confidence due to multiple supporting statistical indicators.`;
    }
  } else {
    base += ` The market is pricing ${home} ${absDiff}pp ${edge === 'strong-market' ? 'significantly' : 'moderately'} higher than the model.`;
    base += ` EdgeAI's independent statistical analysis does not fully align with market consensus — monitor for injury or roster updates.`;
  }

  if (movementSignal === 'sharp-money') {
    base += ` Notable: professional betting activity detected in line movement.`;
  } else if (movementSignal === 'injury-news') {
    base += ` Caution: rapid line movement may reflect breaking news not yet in the model.`;
  }

  return base;
}

// ── Main analysis function ────────────────────────────────────────────────────

export function analyzeMarket(
  game: Game,
  modelHomeWinProb: number, // 0–100
  odds: RawOdds | null,
): MarketAnalysis {
  // No odds data — return a minimal analysis showing model only
  if (!odds || odds.homeMoneyline === 0) {
    return buildFallback(game, modelHomeWinProb);
  }

  const { home: marketHomeProb, away: marketAwayProb, draw: marketDrawProb } =
    americanToCleanProb(odds.homeMoneyline, odds.awayMoneyline, odds.drawMoneyline ?? undefined);

  const modelAwayProb = 100 - modelHomeWinProb - (marketDrawProb > 0 ? marketDrawProb * (modelHomeWinProb / 100) : 0);

  const homeEdge = parseFloat((modelHomeWinProb - marketHomeProb).toFixed(1));
  const edge     = classifyEdge(homeEdge);

  // Opening odds defaults to current if not available
  const openingHomeML = odds.openingHomeMoneyline ?? odds.homeMoneyline;
  const openingAwayML = odds.awayMoneyline;

  const spreadMove    = 0; // no opening spread stored — movement tracking requires ODDS_API_KEY
  const mlMove        = odds.homeMoneyline - openingHomeML;

  const publicHomePct = odds.publicBettingPctHome ?? 50;

  const { signal, explanation: movementExpl } = detectMovementSignal(spreadMove, mlMove, publicHomePct);

  const factorsCount = game.prediction.factors.filter(f => f.positive).length;
  const { adjustment, reason: confReason } = computeConfidenceAdjustment(homeEdge, edge, factorsCount);

  const marketExplanation = generateExplanation(
    game, modelHomeWinProb, marketHomeProb, homeEdge, edge, signal, spreadMove,
  );

  // Determine sharp money direction from line move vs public
  let sharpDir: 'home' | 'away' | 'split' = 'split';
  if (signal === 'sharp-money') {
    sharpDir = publicHomePct > 55 ? 'away' : 'home';
  } else if (mlMove < -15) {
    sharpDir = 'home';
  } else if (mlMove > 15) {
    sharpDir = 'away';
  }

  return {
    marketHomeProb,
    marketAwayProb,
    marketDrawProb,
    modelHomeProb:        modelHomeWinProb,
    modelAwayProb:        parseFloat(modelAwayProb.toFixed(1)),
    homeEdge,
    edgeClassification:   edge,
    edgeLabel:            EDGE_LABELS[edge],
    homeMoneyline:        odds.homeMoneyline,
    awayMoneyline:        odds.awayMoneyline,
    drawMoneyline:        odds.drawMoneyline ?? null,
    spread:               odds.homeSpread ?? 0,
    overUnder:            odds.overUnder ?? 0,
    openingHomeMoneyline: openingHomeML,
    openingAwayMoneyline: openingAwayML,
    openingSpread:        odds.homeSpread ?? 0,
    moneylineMovement:    mlMove,
    spreadMovement:       spreadMove,
    movementSignal:       signal,
    movementExplanation:  movementExpl,
    publicBettingPctHome: publicHomePct,
    publicBettingPctAway: 100 - publicHomePct,
    sharpMoneyDirection:  sharpDir,
    confidenceAdjustment: adjustment,
    confidenceReason:     confReason,
    marketExplanation,
    hasLiveOdds:          true,
    booksCount:           1,
    updatedAt:            odds.updatedAt,
  };
}

// ── Fallback when no odds are available ───────────────────────────────────────

function buildFallback(game: Game, modelHomeWinProb: number): MarketAnalysis {
  const home = game.homeTeam.name;
  const away = game.awayTeam.name;
  const prob = modelHomeWinProb.toFixed(1);

  return {
    marketHomeProb:       0,
    marketAwayProb:       0,
    marketDrawProb:       0,
    modelHomeProb:        modelHomeWinProb,
    modelAwayProb:        100 - modelHomeWinProb,
    homeEdge:             0,
    edgeClassification:   'agreement',
    edgeLabel:            'No Market Data',
    homeMoneyline:        0,
    awayMoneyline:        0,
    drawMoneyline:        null,
    spread:               0,
    overUnder:            0,
    openingHomeMoneyline: 0,
    openingAwayMoneyline: 0,
    openingSpread:        0,
    moneylineMovement:    0,
    spreadMovement:       0,
    movementSignal:       'neutral',
    movementExplanation:  'No odds data available — configure ODDS_API_KEY to enable market comparison.',
    publicBettingPctHome: 50,
    publicBettingPctAway: 50,
    sharpMoneyDirection:  'split',
    confidenceAdjustment: 0,
    confidenceReason:     'No market data to cross-reference.',
    marketExplanation:    `EdgeAI projects ${modelHomeWinProb >= 50 ? home : away} with a ${prob}% win probability based on statistical analysis. No sportsbook odds are currently available for market comparison — set ODDS_API_KEY in your environment to enable full market intelligence.`,
    hasLiveOdds:          false,
    booksCount:           0,
    updatedAt:            new Date().toISOString(),
  };
}
