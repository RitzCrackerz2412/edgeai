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
  last5: ('W' | 'L')[];
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
}

export interface Game {
  id: string;
  sport: Sport;
  league: string;
  homeTeam: Team;
  awayTeam: Team;
  date: string;
  time: string;
  venue: string;
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
  status: 'Upcoming' | 'Live' | 'Final';
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
