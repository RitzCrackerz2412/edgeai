/**
 * Player props + PrizePicks +EV analysis types.
 *
 * Based on the line-comparison methodology:
 * 1. Fetch player prop lines from sharp sportsbooks (The Odds API)
 * 2. Remove vig to get fair/true probability
 * 3. Compare to PrizePicks implied 50% — any edge > 0 is +EV
 */

export type PropMarket =
  | 'player_points'
  | 'player_rebounds'
  | 'player_assists'
  | 'player_threes'
  | 'player_blocks'
  | 'player_steals'
  | 'player_turnovers'
  | 'player_goals'
  | 'player_pass_yds'
  | 'player_rush_yds'
  | 'player_reception_yds'
  | 'player_receptions'
  | 'player_tds'
  | 'pitcher_strikeouts'
  | 'batter_hits'
  | 'batter_home_runs'
  | 'batter_rbis';

export const MARKET_LABELS: Record<PropMarket, string> = {
  player_points:       'Points',
  player_rebounds:     'Rebounds',
  player_assists:      'Assists',
  player_threes:       '3-Pointers',
  player_blocks:       'Blocks',
  player_steals:       'Steals',
  player_turnovers:    'Turnovers',
  player_goals:        'Goals',
  player_pass_yds:     'Pass Yards',
  player_rush_yds:     'Rush Yards',
  player_reception_yds:'Rec Yards',
  player_receptions:   'Receptions',
  player_tds:          'Touchdowns',
  pitcher_strikeouts:  'Strikeouts',
  batter_hits:         'Hits',
  batter_home_runs:    'Home Runs',
  batter_rbis:         'RBIs',
};

// ── Power Play payouts ────────────────────────────────────────────────────────

export const POWER_PLAY_MULTIPLIERS: Record<number, number> = {
  2: 3,
  3: 5,
  4: 10,
  5: 20,
  6: 25,
};

// ── Core prop types ───────────────────────────────────────────────────────────

export interface BookLine {
  book:      string;
  overOdds:  number; // American
  underOdds: number; // American
}

export interface PlayerProp {
  player:      string;
  team:        string;
  market:      PropMarket;
  marketLabel: string;
  line:        number;          // e.g. 25.5
  /** Consensus over/under odds across sharp books (American) */
  overOdds:    number;
  underOdds:   number;
  bookLines:   BookLine[];      // per-book breakdown for line comparison display
  booksCount:  number;
}

export type EVRating = 'strong' | 'good' | 'lean' | 'neutral' | 'fade';

export interface PropEVAnalysis extends PlayerProp {
  // No-vig probabilities (vig removed via ratio method)
  noVigOverPct:  number;        // 0–100
  noVigUnderPct: number;        // 0–100

  // Raw vig
  vigPct: number;               // e.g. 4.8

  // Edge vs PrizePicks 50/50 implied
  overEdgePct:  number;         // positive = Over is +EV on PrizePicks
  underEdgePct: number;         // positive = Under is +EV on PrizePicks

  // Best side and its edge
  bestSide:    'Over' | 'Under';
  bestEdgePct: number;          // always >= 0

  // Rating
  rating: EVRating;

  // Breakeven win % needed per leg for profitable Power Play
  breakeven: Record<number, number>; // legs → breakeven %

  // Slip type recommendation
  slipRecommendation: 'Power' | 'Flex' | 'Skip';
  slipReason: string;
}

export interface PropsEVResponse {
  gameId?:    string;
  sport:      string;
  homeTeam?:  string;
  awayTeam?:  string;
  gameTime?:  string;
  props:      PropEVAnalysis[];
  updatedAt:  string;
  hasOddsKey: boolean;
}
