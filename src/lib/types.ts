export type Sport =
  | 'NFL' | 'NBA' | 'MLB' | 'NHL' | 'Soccer'
  | 'NCAA Football' | 'NCAA Basketball' | 'UFC'
  | 'Boxing' | 'Tennis' | 'F1' | 'Cricket' | 'Esports';

export interface Team {
  id: string;
  name: string;
  abbreviation: string;
  logo: string;
  sport: Sport;
  league: string;
  record: string;
  winPct: number;
  powerRanking: number;
  offensiveRating: number;
  defensiveRating: number;
  netRating: number;
  eloRating: number;
  momentum: number;
  homeRecord: string;
  awayRecord: string;
  last5: ('W' | 'L' | 'D')[];
  injuries: Injury[];
  color: string;
}

export interface Player {
  id: string;
  name: string;
  position: string;
  teamId: string;
  status: 'Active' | 'Questionable' | 'Doubtful' | 'Out';
  impact: number;
  stats: Record<string, number>;
}

export interface Injury {
  player: string;
  position: string;
  status: 'Questionable' | 'Doubtful' | 'Out';
  detail: string;
  impact: 'Low' | 'Medium' | 'High' | 'Critical';
}

export interface PredictionFactor {
  label: string;
  positive: boolean;
  weight: number;
  detail: string;
}

export interface Prediction {
  winner: string;
  winProbability: number;
  confidence: number;
  predictedScore: { home: number; away: number };
  expectedMargin: number;
  upsetProbability: number;
  playerOfMatch: string;
  highestImpactPlayer: string;
  lowestConfidenceVar: string;
  factors: PredictionFactor[];
  gameFlow: string;
  monteCarloWinRate: number;
  bayesianProbability: number;
  /** Prediction market comparison — populated when odds data is available */
  marketAnalysis?: import('./markets/types').MarketAnalysis;
}

export interface Game {
  id: string;
  sport: Sport;
  league: string;
  homeTeam: Team;
  awayTeam: Team;
  /** YYYY-MM-DD in ET — use scheduledAt for accurate timezone display */
  date: string;
  /** Human-readable time string, e.g. "7:30 PM ET" */
  time: string;
  /** Raw ISO 8601 timestamp from the provider */
  scheduledAt?: string;
  venue: string;
  venueCity?: string;
  venueState?: string;
  venueCountry?: string;
  status: 'Upcoming' | 'Pregame' | 'Live' | 'Halftime' | 'Final' | 'Final/OT' | 'Final/SO' | 'Postponed' | 'Cancelled';
  /** Current game clock, e.g. "2:45" */
  clock?: string;
  /** Current period / quarter / inning */
  period?: number;
  /** Actual home score (live or final) */
  homeScore?: number;
  /** Actual away score (live or final) */
  awayScore?: number;
  prediction: Prediction;
  odds: {
    opening: { home: number; away: number; spread: number };
    current: { home: number; away: number; spread: number };
    lineMovement: number;
    publicBettingPct: { home: number; away: number };
    sharpMoney: 'Home' | 'Away' | 'Split';
    expectedValue: number;
  };
  weather?: {
    temp: number;
    condition: string;
    wind: number;
    humidity: number;
  };
  headToHead: {
    allTime: { home: number; away: number };
    last5: { home: number; away: number };
    avgScore: { home: number; away: number };
    lastMeeting: string;
  };
}

export interface PredictionRecord {
  id: string;
  gameId: string;
  sport: Sport;
  prediction: string;
  confidence: number;
  actual: string | null;
  correct: boolean | null;
  margin: number | null;
  date: string;
}

// ── v3.0 League / Tournament types ──────────────────────────────────────────

export interface LeagueStanding {
  teamId: string;
  teamName: string;
  abbreviation: string;
  color: string;
  rank: number;
  gp: number;
  w: number;
  d: number;
  l: number;
  pts: number;
  gf: number;
  ga: number;
  gd: number;
  winPct: number;
  last5: ('W' | 'L' | 'D')[];
  streak: string;
}

export interface LeagueFixture {
  home: string; homeAbbr: string; homeColor: string;
  away: string; awayAbbr: string; awayColor: string;
  homeScore?: number; awayScore?: number;
  date: string; status: 'Upcoming' | 'Final';
}

export interface LeagueData {
  id: string;
  name: string;
  shortName: string;
  sport: Sport;
  country: string;
  season: string;
  tier: 'major' | 'minor' | 'college' | 'international';
  standings: LeagueStanding[];
  fixtures: LeagueFixture[];
}

export interface TournamentGroup {
  label: string;
  teams: LeagueStanding[];
}

export interface TournamentMatch {
  round: string;
  homeTeam: string; homeAbbr: string; homeColor: string;
  awayTeam: string; awayAbbr: string; awayColor: string;
  homeScore?: number; awayScore?: number;
  date: string; status: 'Upcoming' | 'Final';
  venue?: string;
}

export interface Tournament {
  id: string;
  name: string;
  shortName: string;
  sport: Sport;
  country: string;
  season: string;
  startDate: string;
  endDate: string;
  status: 'Upcoming' | 'Active' | 'Completed';
  format: string;
  teamCount: number;
  groups?: TournamentGroup[];
  knockoutMatches?: TournamentMatch[];
  champion?: string;
  topScorer?: { name: string; team: string; value: number; stat: string };
}

export interface AccuracyStats {
  overall: number;
  last30Days: number;
  bySport: Record<string, number>;
  byConfidenceTier: { tier: string; accuracy: number; count: number }[];
  brierScore: number;
  logLoss: number;
  rocAuc: number;
  upsetAccuracy: number;
  avgMarginError: number;
  totalPredictions: number;
  calibrationData: { predicted: number; actual: number }[];
}
