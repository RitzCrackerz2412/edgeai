/**
 * Sport-specific configuration — the single source of truth for all 12 sport modules.
 * Each config drives: stats, prediction engine, AI analysis, standings, UI accents.
 */
import type { Team } from '@/lib/types';

// ── Core types ─────────────────────────────────────────────────────────────────

export interface StatDef {
  key: string;
  label: string;
  unit?: string;
  description: string;
  higherBetter: boolean;
  format: 'int' | 'dec1' | 'dec2' | 'dec3' | 'pct' | 'pct1' | 'str';
  /** Derive value from base Team object when no explicit stat provided */
  derive: (t: Team) => number | string;
}

export interface MatchupFactor {
  label: string;
  description: string;
  homeAdvantage?: boolean;
}

export interface MatchupResult {
  homeWinProb: number;
  awayWinProb: number;
  drawProb?: number;
  confidence: number;
  keyFactors: { label: string; side: 'home' | 'away' | 'split'; detail: string }[];
  projectedScore?: { home: string; away: string };
  aiAnalysis: string;
}

export interface SubPage {
  slug: string;
  label: string;
}

export interface SportConfig {
  id: string;
  name: string;
  fullName: string;
  slug: string;
  sport: string; // matches Team.sport
  color: string;
  secondaryColor: string;
  description: string;
  emoji: string;

  // Labels
  competitorLabel: string;  // "Team" | "Fighter" | "Driver" | "Player"
  isIndividual: boolean;    // UFC, Boxing, Tennis, F1

  // Stats for team/competitor pages
  teamStats: StatDef[];

  // Stats for player/individual leaderboard
  playerStatKeys: string[]; // keys from PlayerDetail.seasonStats

  // Standings
  standingsCols: { key: string; label: string; short: string }[];

  // Matchup
  matchupFactors: MatchupFactor[];
  predict(home: Team, away: Team): MatchupResult;

  // Sub-navigation
  subPages: SubPage[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function clamp(v: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, v));
}

function pickFactors(
  home: Team, away: Team,
  labels: string[],
  homeVals: number[],
  awayVals: number[],
  descs: string[],
  hiBetter: boolean[] = [],
): MatchupResult['keyFactors'] {
  return labels.map((label, i) => {
    const hv = homeVals[i] ?? 0;
    const av = awayVals[i] ?? 0;
    const hi = hiBetter[i] !== false;
    const side: 'home' | 'away' | 'split' =
      Math.abs(hv - av) < 0.5 ? 'split' : (hi ? hv > av : hv < av) ? 'home' : 'away';
    return { label, side, detail: descs[i] ?? '' };
  });
}

function aiText(home: Team, away: Team, prob: number, phrases: string[]): string {
  const favorite = prob > 0.5 ? home : away;
  const favProb = prob > 0.5 ? prob : 1 - prob;
  const pct = Math.round(favProb * 100);
  const phrase = phrases[Math.floor(Math.random() * phrases.length)];
  return `EdgeAI gives ${favorite.name} a ${pct}% win probability. ${phrase}`;
}

// ── SPORT CONFIGS ──────────────────────────────────────────────────────────────

// ─── NBA ──────────────────────────────────────────────────────────────────────
const NBA: SportConfig = {
  id: 'nba', name: 'NBA', fullName: 'National Basketball Association',
  slug: 'nba', sport: 'NBA', color: '#C8102E', secondaryColor: '#1D428A',
  description: 'Professional basketball — the most athletic sport on the planet.',
  emoji: '🏀', competitorLabel: 'Team', isIndividual: false,

  teamStats: [
    { key: 'offRtg', label: 'Off Rtg', description: 'Points scored per 100 possessions', higherBetter: true, format: 'dec1',
      derive: t => t.offensiveRating },
    { key: 'defRtg', label: 'Def Rtg', description: 'Points allowed per 100 possessions', higherBetter: false, format: 'dec1',
      derive: t => t.defensiveRating },
    { key: 'netRtg', label: 'Net Rtg', description: 'Offensive minus defensive rating', higherBetter: true, format: 'dec1',
      derive: t => t.netRating },
    { key: 'pace',   label: 'Pace',    description: 'Possessions per 48 minutes', higherBetter: false, format: 'dec1',
      derive: t => 96 + (t.offensiveRating - 112) * 0.4 },
    { key: 'ppg',    label: 'PPG',     description: 'Points per game', higherBetter: true, format: 'dec1',
      derive: t => t.offensiveRating * 0.95 },
    { key: 'papg',   label: 'OppPPG',  description: 'Opponent points per game', higherBetter: false, format: 'dec1',
      derive: t => t.defensiveRating * 0.95 },
    { key: 'ts',     label: 'TS%',     description: 'True shooting percentage', higherBetter: true, format: 'pct1',
      derive: t => 0.52 + (t.offensiveRating - 112) * 0.003 },
    { key: 'elo',    label: 'ELO',     description: 'ELO power rating', higherBetter: true, format: 'int',
      derive: t => t.eloRating },
  ],

  playerStatKeys: ['PPG', 'RPG', 'APG', 'TS%', 'PER', 'BPM'],

  standingsCols: [
    { key: 'record', label: 'Record', short: 'W-L' },
    { key: 'winPct', label: 'Win %', short: 'PCT' },
    { key: 'ppg', label: 'PPG', short: 'PPG' },
    { key: 'offRtg', label: 'OffRtg', short: 'ORtg' },
    { key: 'defRtg', label: 'DefRtg', short: 'DRtg' },
    { key: 'netRtg', label: 'NetRtg', short: 'NRtg' },
  ],

  matchupFactors: [
    { label: 'Offensive Efficiency', description: 'Points per 100 possessions' },
    { label: 'Defensive Efficiency', description: 'Points allowed per 100 possessions' },
    { label: 'Pace Matchup', description: 'Which team controls tempo' },
    { label: 'Home Court', description: 'Home floor advantage (~3.5 pts)', homeAdvantage: true },
    { label: 'ELO Rating', description: 'Historical power rating' },
    { label: 'Momentum', description: 'Recent form and momentum' },
  ],

  predict(home, away) {
    const offEdge = (home.offensiveRating - away.defensiveRating) / 20;
    const defEdge = (away.offensiveRating - home.defensiveRating) / 20;
    const eloEdge = (home.eloRating - away.eloRating) / 400;
    const momEdge = (home.momentum - away.momentum) / 200;
    const homeAdv = 0.06;
    const logit = homeAdv + offEdge * 0.4 - defEdge * 0.4 + eloEdge * 0.3 + momEdge * 0.2;
    const hwp = clamp(sigmoid(logit * 3), 0.12, 0.88);
    const conf = Math.round(60 + Math.abs(logit) * 15);
    const hScore = Math.round(home.offensiveRating * 0.93 + 2);
    const aScore = Math.round(away.offensiveRating * 0.90);
    return {
      homeWinProb: hwp, awayWinProb: 1 - hwp, confidence: Math.min(92, conf),
      projectedScore: { home: String(hScore), away: String(aScore) },
      keyFactors: pickFactors(home, away,
        ['Offensive Efficiency', 'Defensive Efficiency', 'ELO Rating', 'Momentum'],
        [home.offensiveRating, home.defensiveRating, home.eloRating, home.momentum],
        [away.offensiveRating, away.defensiveRating, away.eloRating, away.momentum],
        ['Points per 100 possessions edge', 'Points allowed per 100 possessions', 'Historical power rating', 'Recent form'],
        [true, false, true, true],
      ),
      aiAnalysis: `${hwp > 0.5 ? home.name : away.name}'s ${hwp > 0.5 ? (home.netRating > 0 ? 'elite net rating' : 'offensive firepower') : (away.netRating > 0 ? 'superior net rating' : 'defensive efficiency')} creates a measurable edge. Pace matchup and ${hwp > 0.5 ? home.name : away.name}'s home court advantage (≈3.5 pts) are decisive factors in this projection.`,
    };
  },

  subPages: [
    { slug: '', label: 'Overview' }, { slug: 'teams', label: 'Teams' },
    { slug: 'players', label: 'Players' }, { slug: 'matchup', label: 'Matchup' },
    { slug: 'standings', label: 'Standings' }, { slug: 'schedule', label: 'Schedule' },
    { slug: 'power-rankings', label: 'Power Rankings' },
    { slug: 'leaderboard', label: 'Leaderboard' }, { slug: 'predictions', label: 'AI Predictions' },
  ],
};

// ─── MLB ──────────────────────────────────────────────────────────────────────
const MLB: SportConfig = {
  id: 'mlb', name: 'MLB', fullName: 'Major League Baseball',
  slug: 'mlb', sport: 'MLB', color: '#002D72', secondaryColor: '#D50032',
  description: 'America\'s pastime — 162 games of strategy, pitching, and power.',
  emoji: '⚾', competitorLabel: 'Team', isIndividual: false,

  teamStats: [
    { key: 'era',   label: 'Team ERA', description: 'Earned run average (pitching)', higherBetter: false, format: 'dec2',
      derive: t => 4.0 - (t.defensiveRating - 50) * 0.02 },
    { key: 'whip',  label: 'WHIP',     description: 'Walks + hits per inning pitched', higherBetter: false, format: 'dec2',
      derive: t => 1.30 - (t.defensiveRating - 50) * 0.005 },
    { key: 'ops',   label: 'Team OPS', description: 'On-base + slugging', higherBetter: true, format: 'dec3',
      derive: t => 0.720 + (t.offensiveRating - 50) * 0.003 },
    { key: 'bavg',  label: 'AVG',      description: 'Team batting average', higherBetter: true, format: 'dec3',
      derive: t => 0.245 + (t.offensiveRating - 50) * 0.0008 },
    { key: 'fip',   label: 'FIP',      description: 'Fielding-independent pitching', higherBetter: false, format: 'dec2',
      derive: t => 4.10 - (t.defensiveRating - 50) * 0.015 },
    { key: 'rpg',   label: 'R/Game',   description: 'Runs scored per game', higherBetter: true, format: 'dec2',
      derive: t => 4.0 + (t.offensiveRating - 50) * 0.04 },
    { key: 'ra',    label: 'RA/Game',  description: 'Runs allowed per game', higherBetter: false, format: 'dec2',
      derive: t => 4.5 - (t.defensiveRating - 50) * 0.03 },
    { key: 'elo',   label: 'ELO',      description: 'Power rating', higherBetter: true, format: 'int',
      derive: t => t.eloRating },
  ],

  playerStatKeys: ['AVG', 'OPS', 'HR', 'RBI', 'WAR', 'ERA', 'WHIP'],

  standingsCols: [
    { key: 'record', label: 'Record', short: 'W-L' },
    { key: 'winPct', label: 'Win %', short: 'PCT' },
    { key: 'rpg',    label: 'R/G', short: 'R/G' },
    { key: 'era',    label: 'ERA', short: 'ERA' },
    { key: 'ops',    label: 'OPS', short: 'OPS' },
    { key: 'fip',    label: 'FIP', short: 'FIP' },
  ],

  matchupFactors: [
    { label: 'Starting Pitching', description: 'Quality of today\'s starters' },
    { label: 'Bullpen Depth', description: 'Relief pitching quality and availability' },
    { label: 'Offensive Lineup', description: 'Batting order vs opposing pitcher' },
    { label: 'Park Factor', description: 'Ballpark effect on scoring', homeAdvantage: true },
    { label: 'Recent Form', description: 'Team performance over last 10 games' },
    { label: 'Batter-Pitcher Splits', description: 'Historical L/R split matchups' },
  ],

  predict(home, away) {
    const pitchEdge = (home.defensiveRating - away.defensiveRating) / 30;
    const offEdge  = (home.offensiveRating - away.offensiveRating) / 30;
    const eloEdge  = (home.eloRating - away.eloRating) / 400;
    const homeAdv  = 0.04;
    const logit = homeAdv + pitchEdge * 0.5 + offEdge * 0.3 + eloEdge * 0.2;
    const hwp = clamp(sigmoid(logit * 3), 0.18, 0.82);
    const hRuns = (3.8 + (home.offensiveRating - 50) * 0.04).toFixed(1);
    const aRuns = (3.6 + (away.offensiveRating - 50) * 0.04).toFixed(1);
    return {
      homeWinProb: hwp, awayWinProb: 1 - hwp, confidence: Math.min(88, 58 + Math.abs(pitchEdge + offEdge) * 30),
      projectedScore: { home: hRuns, away: aRuns },
      keyFactors: pickFactors(home, away,
        ['Pitching Strength', 'Offensive Output', 'ELO Power Rating', 'Home Park'],
        [home.defensiveRating, home.offensiveRating, home.eloRating, 1],
        [away.defensiveRating, away.offensiveRating, away.eloRating, 0],
        ['ERA and WHIP quality', 'Runs per game and OPS', 'Season-long dominance', 'Home ballpark advantage'],
        [true, true, true, true],
      ),
      aiAnalysis: `Starting pitching matchup and bullpen depth ${pitchEdge > 0 ? `favor ${home.name}` : `favor ${away.name}`}. In baseball, pitching accounts for roughly 50% of outcome variance. ${hwp > 0.5 ? home.name : away.name}'s offensive lineup advantages make this a ${Math.abs(hwp - 0.5) > 0.15 ? 'clear' : 'close'} edge.`,
    };
  },

  subPages: [
    { slug: '', label: 'Overview' }, { slug: 'teams', label: 'Teams' },
    { slug: 'players', label: 'Players' }, { slug: 'matchup', label: 'Matchup' },
    { slug: 'standings', label: 'Standings' }, { slug: 'schedule', label: 'Schedule' },
    { slug: 'power-rankings', label: 'Power Rankings' },
    { slug: 'leaderboard', label: 'Leaderboard' }, { slug: 'predictions', label: 'AI Predictions' },
  ],
};

// ─── NHL ──────────────────────────────────────────────────────────────────────
const NHL: SportConfig = {
  id: 'nhl', name: 'NHL', fullName: 'National Hockey League',
  slug: 'nhl', sport: 'NHL', color: '#000000', secondaryColor: '#A4A9AD',
  description: 'Fastest team sport on the planet — ice hockey at its pinnacle.',
  emoji: '🏒', competitorLabel: 'Team', isIndividual: false,

  teamStats: [
    { key: 'gf',      label: 'GF/G',    description: 'Goals for per game', higherBetter: true, format: 'dec2',
      derive: t => 2.8 + (t.offensiveRating - 50) * 0.04 },
    { key: 'ga',      label: 'GA/G',    description: 'Goals against per game', higherBetter: false, format: 'dec2',
      derive: t => 3.2 - (t.defensiveRating - 50) * 0.03 },
    { key: 'corsi',   label: 'Corsi%',  description: 'Shot attempt share at 5-on-5', higherBetter: true, format: 'pct1',
      derive: t => 0.50 + (t.offensiveRating - 50) * 0.002 },
    { key: 'fenwick', label: 'Fenwick%',description: 'Unblocked shot attempt share', higherBetter: true, format: 'pct1',
      derive: t => 0.50 + (t.netRating) * 0.002 },
    { key: 'svpct',   label: 'SV%',     description: 'Team save percentage', higherBetter: true, format: 'dec3',
      derive: t => 0.890 + (t.defensiveRating - 50) * 0.001 },
    { key: 'pppct',   label: 'PP%',     description: 'Power play percentage', higherBetter: true, format: 'pct1',
      derive: t => 0.18 + (t.offensiveRating - 50) * 0.001 },
    { key: 'pkpct',   label: 'PK%',     description: 'Penalty kill percentage', higherBetter: true, format: 'pct1',
      derive: t => 0.78 + (t.defensiveRating - 50) * 0.001 },
    { key: 'pdo',     label: 'PDO',     description: 'Sh% + SV% (luck indicator)', higherBetter: true, format: 'dec1',
      derive: t => 100 + t.momentum * 0.02 },
  ],

  playerStatKeys: ['Goals', 'Assists', 'Points', 'TOI', 'Corsi%', 'SV%'],

  standingsCols: [
    { key: 'record', label: 'Record', short: 'W-L-OT' },
    { key: 'winPct', label: 'Points%', short: 'P%' },
    { key: 'gf',     label: 'GF/G', short: 'GF' },
    { key: 'ga',     label: 'GA/G', short: 'GA' },
    { key: 'svpct',  label: 'SV%', short: 'SV%' },
    { key: 'pppct',  label: 'PP%', short: 'PP%' },
  ],

  matchupFactors: [
    { label: 'Goaltending', description: 'Starting goalie form and save percentage' },
    { label: 'Top Line Production', description: 'First-line scoring threat' },
    { label: 'Corsi / Shot Control', description: '5-on-5 possession and shot advantage' },
    { label: 'Power Play vs Penalty Kill', description: 'Special teams efficiency' },
    { label: 'Home Ice', description: 'Last change advantage', homeAdvantage: true },
  ],

  predict(home, away) {
    const saveEdge = (home.defensiveRating - away.defensiveRating) / 40;
    const shotEdge = (home.offensiveRating - away.offensiveRating) / 40;
    const eloEdge  = (home.eloRating - away.eloRating) / 400;
    const homeAdv  = 0.05;
    const logit = homeAdv + saveEdge * 0.45 + shotEdge * 0.35 + eloEdge * 0.2;
    const hwp = clamp(sigmoid(logit * 3.5), 0.20, 0.80);
    const hGoals = (2.8 + (home.offensiveRating - 50) * 0.035).toFixed(1);
    const aGoals = (2.5 + (away.offensiveRating - 50) * 0.030).toFixed(1);
    return {
      homeWinProb: hwp, awayWinProb: 1 - hwp, drawProb: 0.20,
      confidence: Math.min(86, 54 + Math.abs(logit) * 25),
      projectedScore: { home: hGoals, away: aGoals },
      keyFactors: pickFactors(home, away,
        ['Goaltending', 'Corsi% Possession', 'Power Play %', 'ELO Rating'],
        [home.defensiveRating, home.offensiveRating, home.offensiveRating, home.eloRating],
        [away.defensiveRating, away.offensiveRating, away.offensiveRating, away.eloRating],
        ['Save % and goalie quality', '5-on-5 shot attempt share', 'Power play conversion', 'Season-long power rating'],
        [true, true, true, true],
      ),
      aiAnalysis: `The goaltending matchup and 5-on-5 possession control are the primary drivers. ${hwp > 0.5 ? home.name : away.name}'s ${hwp > 0.5 ? (home.defensiveRating > away.defensiveRating ? 'superior goaltending' : 'offensive depth') : (away.defensiveRating > home.defensiveRating ? 'elite goaltending' : 'top-line dominance')} gives them the edge. Special teams efficiency could be decisive.`,
    };
  },

  subPages: [
    { slug: '', label: 'Overview' }, { slug: 'teams', label: 'Teams' },
    { slug: 'players', label: 'Players' }, { slug: 'matchup', label: 'Matchup' },
    { slug: 'standings', label: 'Standings' }, { slug: 'schedule', label: 'Schedule' },
    { slug: 'power-rankings', label: 'Power Rankings' },
    { slug: 'leaderboard', label: 'Leaderboard' }, { slug: 'predictions', label: 'AI Predictions' },
  ],
};

// ─── Soccer ───────────────────────────────────────────────────────────────────
const SOCCER: SportConfig = {
  id: 'soccer', name: 'Soccer', fullName: 'Global Football',
  slug: 'soccer', sport: 'Soccer', color: '#00A550', secondaryColor: '#FFFFFF',
  description: 'The beautiful game — xG, PPDA, and the world\'s most popular sport.',
  emoji: '⚽', competitorLabel: 'Team', isIndividual: false,

  teamStats: [
    { key: 'xg',     label: 'xG/Game', description: 'Expected goals per match', higherBetter: true, format: 'dec2',
      derive: t => 1.2 + (t.offensiveRating - 50) * 0.025 },
    { key: 'xga',    label: 'xGA/Game',description: 'Expected goals against per match', higherBetter: false, format: 'dec2',
      derive: t => 1.5 - (t.defensiveRating - 50) * 0.020 },
    { key: 'ppda',   label: 'PPDA',    description: 'Passes allowed per defensive action (pressing)', higherBetter: false, format: 'dec1',
      derive: t => 12 - (t.defensiveRating - 50) * 0.08 },
    { key: 'poss',   label: 'Poss%',   description: 'Average possession percentage', higherBetter: false, format: 'pct1',
      derive: t => 0.50 + (t.offensiveRating - 50) * 0.002 },
    { key: 'progp',  label: 'Prog Pass',description: 'Progressive passes per 90', higherBetter: true, format: 'dec1',
      derive: t => 50 + (t.offensiveRating - 50) * 0.6 },
    { key: 'goals',  label: 'Goals/G', description: 'Goals scored per match', higherBetter: true, format: 'dec2',
      derive: t => 1.4 + (t.offensiveRating - 50) * 0.022 },
    { key: 'cs',     label: 'Clean Sheet%', description: 'Clean sheet percentage', higherBetter: true, format: 'pct1',
      derive: t => 0.25 + (t.defensiveRating - 50) * 0.003 },
    { key: 'elo',    label: 'ELO',     description: 'Global power rating', higherBetter: true, format: 'int',
      derive: t => t.eloRating },
  ],

  playerStatKeys: ['Goals', 'Assists', 'xG', 'xA', 'Key Passes', 'Dribbles/90'],

  standingsCols: [
    { key: 'record', label: 'GD/Pts', short: 'Pts' },
    { key: 'winPct', label: 'Win %', short: 'W%' },
    { key: 'goals',  label: 'GF', short: 'GF' },
    { key: 'cs',     label: 'CS%', short: 'CS%' },
    { key: 'xg',     label: 'xG', short: 'xG' },
    { key: 'ppda',   label: 'PPDA', short: 'PPDA' },
  ],

  matchupFactors: [
    { label: 'Expected Goals', description: 'xG differential — quality of chances' },
    { label: 'PPDA / Pressing', description: 'High press intensity and effectiveness' },
    { label: 'Possession Control', description: 'Ability to dominate the ball' },
    { label: 'Home Advantage', description: 'Home crowd and pitch familiarity', homeAdvantage: true },
    { label: 'Injury & Fatigue', description: 'Squad depth and rotation' },
  ],

  predict(home, away) {
    const xgEdge  = (home.offensiveRating - away.defensiveRating) / 60;
    const xgaEdge = (away.offensiveRating - home.defensiveRating) / 60;
    const eloEdge = (home.eloRating - away.eloRating) / 400;
    const homeAdv = 0.08;
    const logit = homeAdv + xgEdge * 0.5 - xgaEdge * 0.4 + eloEdge * 0.3;
    const rawHwp = sigmoid(logit * 3);
    const drawProb = 0.22 - Math.abs(rawHwp - 0.5) * 0.3;
    const hwp = clamp((rawHwp - drawProb / 2), 0.12, 0.82);
    const awp = clamp(1 - hwp - drawProb, 0.10, 0.80);
    const hxg = (1.2 + (home.offensiveRating - 50) * 0.022).toFixed(1);
    const axg = (1.1 + (away.offensiveRating - 50) * 0.020).toFixed(1);
    return {
      homeWinProb: hwp, awayWinProb: awp, drawProb,
      confidence: Math.min(82, 50 + Math.abs(logit) * 20),
      projectedScore: { home: hxg + ' xG', away: axg + ' xG' },
      keyFactors: pickFactors(home, away,
        ['xG Superiority', 'Pressing (PPDA)', 'ELO Power Rating', 'Home Advantage'],
        [home.offensiveRating, home.defensiveRating, home.eloRating, 1],
        [away.offensiveRating, away.defensiveRating, away.eloRating, 0],
        ['Expected goals quality', 'Passes allowed per press', 'Historical dominance', 'Home pitch advantage'],
        [true, true, true, true],
      ),
      aiAnalysis: `${hwp > awp ? home.name : away.name}'s high press and expected goals differential provide the strongest edge. PPDA and progressive passing metrics indicate ${xgEdge > 0 ? `${home.name} creates higher quality chances` : `${away.name} generates more xG per possession`}. Draw probability is elevated at ${Math.round(drawProb * 100)}% — single-goal margins are likely.`,
    };
  },

  subPages: [
    { slug: '', label: 'Overview' }, { slug: 'teams', label: 'Clubs' },
    { slug: 'players', label: 'Players' }, { slug: 'matchup', label: 'Matchup' },
    { slug: 'standings', label: 'Table' }, { slug: 'schedule', label: 'Fixtures' },
    { slug: 'power-rankings', label: 'Power Rankings' },
    { slug: 'leaderboard', label: 'Top Scorers' }, { slug: 'predictions', label: 'AI Predictions' },
  ],
};

// ─── NCAA Football ────────────────────────────────────────────────────────────
const NCAAF: SportConfig = {
  id: 'ncaaf', name: 'NCAAF', fullName: 'NCAA Football',
  slug: 'ncaaf', sport: 'NCAA Football', color: '#FF6B00', secondaryColor: '#1A1A2E',
  description: 'College football — 130 teams, 65,000-seat stadiums, unmatched passion.',
  emoji: '🏈', competitorLabel: 'Team', isIndividual: false,

  teamStats: [
    { key: 'epa',      label: 'EPA/Play',  description: 'Expected points added per play', higherBetter: true, format: 'dec2',
      derive: t => (t.offensiveRating - 50) * 0.004 },
    { key: 'sucr',     label: 'Success%',  description: 'Play success rate', higherBetter: true, format: 'pct1',
      derive: t => 0.42 + (t.offensiveRating - 50) * 0.002 },
    { key: 'ppg',      label: 'PPG',       description: 'Points per game', higherBetter: true, format: 'dec1',
      derive: t => 24 + (t.offensiveRating - 50) * 0.4 },
    { key: 'papg',     label: 'PA/G',      description: 'Points allowed per game', higherBetter: false, format: 'dec1',
      derive: t => 28 - (t.defensiveRating - 50) * 0.35 },
    { key: 'ypp',      label: 'Yds/Play',  description: 'Yards per play', higherBetter: true, format: 'dec2',
      derive: t => 5.2 + (t.offensiveRating - 50) * 0.025 },
    { key: 'sack',     label: 'Sack Rate', description: 'Pass rush sack rate', higherBetter: true, format: 'pct1',
      derive: t => 0.06 + (t.defensiveRating - 50) * 0.001 },
    { key: '3rd',      label: '3rd Dwn%',  description: 'Third down conversion rate', higherBetter: true, format: 'pct1',
      derive: t => 0.40 + (t.offensiveRating - 50) * 0.002 },
    { key: 'rz',       label: 'RedZone%',  description: 'Red zone touchdown rate', higherBetter: true, format: 'pct1',
      derive: t => 0.55 + (t.offensiveRating - 50) * 0.002 },
  ],

  playerStatKeys: ['Passing Yards', 'TDs', 'Completion%', 'QBR', 'Rushing Yards'],

  standingsCols: [
    { key: 'record', label: 'Record', short: 'W-L' },
    { key: 'ppg',    label: 'PPG', short: 'PPG' },
    { key: 'papg',   label: 'PA/G', short: 'PA/G' },
    { key: 'epa',    label: 'EPA/Play', short: 'EPA' },
    { key: 'ypp',    label: 'Yds/Play', short: 'YPP' },
    { key: 'elo',    label: 'CFP Pts', short: 'Pts' },
  ],

  matchupFactors: [
    { label: 'EPA / Play', description: 'Expected points added efficiency' },
    { label: 'Pass Rush', description: 'Pressure rate and sack percentage' },
    { label: 'Third Down', description: 'Third down conversion and stop rate' },
    { label: 'Home Field', description: 'Home crowd and travel factor', homeAdvantage: true },
    { label: 'Turnover Margin', description: 'Ball security and takeaway ability' },
  ],

  predict(home, away) {
    const offEdge = (home.offensiveRating - away.defensiveRating) / 25;
    const defEdge = (away.offensiveRating - home.defensiveRating) / 25;
    const eloEdge = (home.eloRating - away.eloRating) / 400;
    const homeAdv = 0.07;
    const logit = homeAdv + offEdge * 0.45 - defEdge * 0.4 + eloEdge * 0.25;
    const hwp = clamp(sigmoid(logit * 3), 0.10, 0.90);
    const hScore = Math.round(24 + (home.offensiveRating - 50) * 0.35);
    const aScore = Math.round(22 + (away.offensiveRating - 50) * 0.30);
    return {
      homeWinProb: hwp, awayWinProb: 1 - hwp,
      confidence: Math.min(90, 55 + Math.abs(logit) * 20),
      projectedScore: { home: String(hScore), away: String(aScore) },
      keyFactors: pickFactors(home, away,
        ['EPA Efficiency', 'Defensive Rating', 'ELO Power', 'Momentum'],
        [home.offensiveRating, home.defensiveRating, home.eloRating, home.momentum],
        [away.offensiveRating, away.defensiveRating, away.eloRating, away.momentum],
        ['Points per play efficiency', 'Yards and points allowed', 'Season power rating', 'Recent form'],
        [true, true, true, true],
      ),
      aiAnalysis: `EPA/play differential and third-down efficiency are the dominant factors. ${hwp > 0.5 ? home.name : away.name}'s ${hwp > 0.5 ? 'offensive success rate and pass rush' : 'defensive discipline and turnovers'} create the statistical edge. Home field advantage (≈3 pts in college football) is a meaningful factor in this projection.`,
    };
  },

  subPages: [
    { slug: '', label: 'Overview' }, { slug: 'teams', label: 'Teams' },
    { slug: 'players', label: 'Players' }, { slug: 'matchup', label: 'Matchup' },
    { slug: 'standings', label: 'Rankings' }, { slug: 'schedule', label: 'Schedule' },
    { slug: 'power-rankings', label: 'CFP Rankings' },
    { slug: 'leaderboard', label: 'Stats Leaders' }, { slug: 'predictions', label: 'AI Predictions' },
  ],
};

// ─── NCAA Basketball ─────────────────────────────────────────────────────────
const NCAAB: SportConfig = {
  id: 'ncaab', name: 'NCAAB', fullName: 'NCAA Basketball',
  slug: 'ncaab', sport: 'NCAA Basketball', color: '#003087', secondaryColor: '#FFB81C',
  description: 'March Madness and 360+ teams fighting for one title.',
  emoji: '🏀', competitorLabel: 'Team', isIndividual: false,

  teamStats: [
    { key: 'ortg',  label: 'Off Rtg',  description: 'Points per 100 possessions', higherBetter: true, format: 'dec1',
      derive: t => 100 + (t.offensiveRating - 50) * 0.5 },
    { key: 'drtg',  label: 'Def Rtg',  description: 'Points allowed per 100 possessions', higherBetter: false, format: 'dec1',
      derive: t => 108 - (t.defensiveRating - 50) * 0.4 },
    { key: 'nrtg',  label: 'Net Rtg',  description: 'Off - Def rating', higherBetter: true, format: 'dec1',
      derive: t => t.netRating * 0.8 },
    { key: 'pace',  label: 'Pace',     description: 'Possessions per 40 minutes', higherBetter: false, format: 'dec1',
      derive: t => 68 + (t.offensiveRating - 50) * 0.2 },
    { key: 'efg',   label: 'eFG%',     description: 'Effective field goal percentage', higherBetter: true, format: 'pct1',
      derive: t => 0.50 + (t.offensiveRating - 50) * 0.002 },
    { key: 'to',    label: 'TO%',      description: 'Turnover rate per 100 possessions', higherBetter: false, format: 'pct1',
      derive: t => 0.19 - (t.offensiveRating - 50) * 0.001 },
    { key: 'or',    label: 'OR%',      description: 'Offensive rebounding percentage', higherBetter: true, format: 'pct1',
      derive: t => 0.28 + (t.offensiveRating - 50) * 0.001 },
    { key: 'elo',   label: 'KenPom',   description: 'Adjusted efficiency margin', higherBetter: true, format: 'dec1',
      derive: t => (t.eloRating - 1500) / 50 },
  ],

  playerStatKeys: ['PPG', 'RPG', 'APG', 'FG%', 'BPG'],

  standingsCols: [
    { key: 'record', label: 'Record', short: 'W-L' },
    { key: 'winPct', label: 'Win %', short: 'PCT' },
    { key: 'ortg',   label: 'OffRtg', short: 'ORtg' },
    { key: 'drtg',   label: 'DefRtg', short: 'DRtg' },
    { key: 'nrtg',   label: 'NetRtg', short: 'NRtg' },
    { key: 'elo',    label: 'AdjEM', short: 'AdjEM' },
  ],

  matchupFactors: [
    { label: 'Offensive Rating', description: 'Adjusted offensive efficiency' },
    { label: 'Defensive Rating', description: 'Adjusted defensive efficiency' },
    { label: 'Effective FG%', description: 'Shooting efficiency including 3-pointers' },
    { label: 'Turnover Margin', description: 'Ball security vs. takeaways' },
    { label: 'Home Court', description: 'Student section and home environment', homeAdvantage: true },
  ],

  predict(home, away) {
    const adjOff = (home.offensiveRating - away.defensiveRating) / 15;
    const adjDef = (away.offensiveRating - home.defensiveRating) / 15;
    const eloEdge = (home.eloRating - away.eloRating) / 400;
    const homeAdv = 0.065;
    const logit = homeAdv + adjOff * 0.45 - adjDef * 0.4 + eloEdge * 0.3;
    const hwp = clamp(sigmoid(logit * 3.2), 0.12, 0.88);
    const hScore = Math.round(70 + (home.offensiveRating - 50) * 0.35);
    const aScore = Math.round(67 + (away.offensiveRating - 50) * 0.30);
    return {
      homeWinProb: hwp, awayWinProb: 1 - hwp,
      confidence: Math.min(88, 55 + Math.abs(logit) * 22),
      projectedScore: { home: String(hScore), away: String(aScore) },
      keyFactors: pickFactors(home, away,
        ['Offensive Efficiency', 'Defensive Efficiency', 'Adjusted EM', 'Recent Form'],
        [home.offensiveRating, home.defensiveRating, home.eloRating, home.momentum],
        [away.offensiveRating, away.defensiveRating, away.eloRating, away.momentum],
        ['ORtg per 100 possessions', 'DRtg per 100 possessions', 'KenPom adjusted margin', 'Last 10 results'],
        [true, true, true, true],
      ),
      aiAnalysis: `Net rating differential is the strongest predictor in college basketball. ${hwp > 0.5 ? home.name : away.name}'s adjusted efficiency margin gives them a measurable edge. Effective field goal percentage and turnover prevention are the secondary factors in this model.`,
    };
  },

  subPages: [
    { slug: '', label: 'Overview' }, { slug: 'teams', label: 'Teams' },
    { slug: 'players', label: 'Players' }, { slug: 'matchup', label: 'Matchup' },
    { slug: 'standings', label: 'NET Rankings' }, { slug: 'schedule', label: 'Schedule' },
    { slug: 'power-rankings', label: 'AP Poll' },
    { slug: 'leaderboard', label: 'Stats Leaders' }, { slug: 'predictions', label: 'Bracket AI' },
  ],
};

// ─── UFC ──────────────────────────────────────────────────────────────────────
const UFC_CONF: SportConfig = {
  id: 'ufc', name: 'UFC', fullName: 'Ultimate Fighting Championship',
  slug: 'ufc', sport: 'UFC', color: '#D20A0A', secondaryColor: '#FFD700',
  description: 'MMA\'s pinnacle — striking, grappling, and elite fight intelligence.',
  emoji: '🥊', competitorLabel: 'Fighter', isIndividual: true,

  teamStats: [
    { key: 'winpct',  label: 'Win%',     description: 'Win percentage', higherBetter: true, format: 'pct1',
      derive: t => t.winPct },
    { key: 'ko',      label: 'KO Rate',  description: 'Knockout/TKO finish rate', higherBetter: true, format: 'pct1',
      derive: t => 0.35 + (t.offensiveRating - 50) * 0.004 },
    { key: 'sub',     label: 'Sub Rate', description: 'Submission finish rate', higherBetter: true, format: 'pct1',
      derive: t => 0.25 + (t.defensiveRating - 50) * 0.002 },
    { key: 'sigstr',  label: 'SigStr/m', description: 'Significant strikes per minute', higherBetter: true, format: 'dec1',
      derive: t => 4 + (t.offensiveRating - 50) * 0.06 },
    { key: 'stracc',  label: 'Str Acc%', description: 'Striking accuracy', higherBetter: true, format: 'pct1',
      derive: t => 0.43 + (t.offensiveRating - 50) * 0.002 },
    { key: 'tdacc',   label: 'TD Acc%',  description: 'Takedown accuracy', higherBetter: true, format: 'pct1',
      derive: t => 0.40 + (t.offensiveRating - 50) * 0.002 },
    { key: 'tddef',   label: 'TD Def%',  description: 'Takedown defense', higherBetter: true, format: 'pct1',
      derive: t => 0.60 + (t.defensiveRating - 50) * 0.003 },
    { key: 'reach',   label: 'Reach',    description: 'Reach in inches', higherBetter: true, format: 'dec1',
      derive: t => 72 + (t.eloRating - 1500) * 0.005 },
  ],

  playerStatKeys: ['Win%', 'KO Rate', 'Sig Strikes/m', 'Striking Accuracy', 'Takedown Accuracy'],

  standingsCols: [
    { key: 'record', label: 'Record', short: 'W-L' },
    { key: 'winpct', label: 'Win%', short: 'W%' },
    { key: 'ko',     label: 'KO%', short: 'KO%' },
    { key: 'sub',    label: 'Sub%', short: 'Sub%' },
    { key: 'sigstr', label: 'SigStr/m', short: 'SS' },
    { key: 'elo',    label: 'UFC Ranking', short: 'Rank' },
  ],

  matchupFactors: [
    { label: 'Significant Striking', description: 'Volume and accuracy of meaningful strikes' },
    { label: 'Grappling Control', description: 'Takedown and submission threat' },
    { label: 'Reach Advantage', description: 'Physical reach differential' },
    { label: 'Chin & Durability', description: 'Ability to absorb punishment' },
    { label: 'Style Matchup', description: 'Striker vs grappler advantage' },
  ],

  predict(home, away) {
    const strikeEdge = (home.offensiveRating - away.defensiveRating) / 50;
    const groundEdge = (home.defensiveRating - away.offensiveRating) / 50;
    const eloEdge = (home.eloRating - away.eloRating) / 400;
    const logit = strikeEdge * 0.45 + groundEdge * 0.35 + eloEdge * 0.3;
    const hwp = clamp(sigmoid(logit * 3), 0.15, 0.85);
    return {
      homeWinProb: hwp, awayWinProb: 1 - hwp,
      confidence: Math.min(82, 52 + Math.abs(logit) * 20),
      keyFactors: pickFactors(home, away,
        ['Significant Striking', 'Grappling Defense', 'ELO / Ranking', 'Finish Rate'],
        [home.offensiveRating, home.defensiveRating, home.eloRating, home.momentum],
        [away.offensiveRating, away.defensiveRating, away.eloRating, away.momentum],
        ['Sig strikes landed per minute', 'Takedown defense rate', 'UFC power rating', 'KO/Sub finish rate'],
        [true, true, true, true],
      ),
      aiAnalysis: `The striking differential and takedown defense suggest a stylistic advantage for ${hwp > 0.5 ? home.name : away.name}. ${hwp > 0.5 ? (home.offensiveRating > away.offensiveRating ? 'Superior offensive striking output' : 'Elite defensive grappling') : (away.offensiveRating > home.offensiveRating ? 'Dominant significant strike rate' : 'Grappling control advantage')} is the primary factor in this prediction.`,
    };
  },

  subPages: [
    { slug: '', label: 'Overview' }, { slug: 'teams', label: 'Fighters' },
    { slug: 'players', label: 'Rankings' }, { slug: 'matchup', label: 'Fight Predictor' },
    { slug: 'standings', label: 'Divisions' }, { slug: 'schedule', label: 'Events' },
    { slug: 'power-rankings', label: 'P4P Rankings' },
    { slug: 'leaderboard', label: 'Fighter Stats' }, { slug: 'predictions', label: 'Fight Picks' },
  ],
};

// ─── Boxing ───────────────────────────────────────────────────────────────────
const BOXING_CONF: SportConfig = {
  id: 'boxing', name: 'Boxing', fullName: 'Professional Boxing',
  slug: 'boxing', sport: 'Boxing', color: '#8B0000', secondaryColor: '#FFD700',
  description: 'The sweet science — power, precision, and ring generalship.',
  emoji: '🥊', competitorLabel: 'Fighter', isIndividual: true,

  teamStats: [
    { key: 'wins',   label: 'Wins',    description: 'Total wins', higherBetter: true, format: 'int',
      derive: t => Math.round(t.winPct * 40) },
    { key: 'kos',    label: 'KOs',     description: 'Knockout wins', higherBetter: true, format: 'int',
      derive: t => Math.round(t.winPct * 40 * 0.7) },
    { key: 'kopct',  label: 'KO%',     description: 'Knockout percentage', higherBetter: true, format: 'pct1',
      derive: t => 0.50 + (t.offensiveRating - 50) * 0.005 },
    { key: 'pacc',   label: 'Pch Acc', description: 'Punch accuracy', higherBetter: true, format: 'pct1',
      derive: t => 0.38 + (t.offensiveRating - 50) * 0.003 },
    { key: 'pdef',   label: 'Pch Def', description: 'Punch defense', higherBetter: true, format: 'pct1',
      derive: t => 0.55 + (t.defensiveRating - 50) * 0.003 },
    { key: 'power',  label: 'Power Rtg',description: 'Power rating (punching)', higherBetter: true, format: 'int',
      derive: t => Math.round(60 + (t.offensiveRating - 50) * 0.8) },
    { key: 'reach',  label: 'Reach',   description: 'Reach in inches', higherBetter: true, format: 'int',
      derive: t => 70 + Math.round((t.eloRating - 1500) * 0.005) },
    { key: 'elo',    label: 'Ranking', description: 'P4P rank proxy', higherBetter: true, format: 'int',
      derive: t => t.eloRating },
  ],

  playerStatKeys: ['Record', 'KO%', 'Punch Accuracy', 'Power Rating', 'Reach'],

  standingsCols: [
    { key: 'record', label: 'Record', short: 'W-L' },
    { key: 'kopct',  label: 'KO%', short: 'KO%' },
    { key: 'pacc',   label: 'Accuracy', short: 'Acc' },
    { key: 'pdef',   label: 'Defense', short: 'Def' },
    { key: 'power',  label: 'Power Rtg', short: 'Power' },
    { key: 'elo',    label: 'P4P Rank', short: 'P4P' },
  ],

  matchupFactors: [
    { label: 'Power & KO Ability', description: 'Knockout punch power rating' },
    { label: 'Punch Accuracy', description: 'Percentage of punches landed' },
    { label: 'Defense & Head Movement', description: 'Punches avoided' },
    { label: 'Reach Advantage', description: 'Physical reach and jab range' },
    { label: 'Ring Experience', description: 'Fights and rounds at top level' },
  ],

  predict(home, away) {
    const powerEdge = (home.offensiveRating - away.defensiveRating) / 50;
    const defEdge   = (home.defensiveRating - away.offensiveRating) / 50;
    const eloEdge   = (home.eloRating - away.eloRating) / 400;
    const logit = powerEdge * 0.45 + defEdge * 0.35 + eloEdge * 0.3;
    const hwp = clamp(sigmoid(logit * 3), 0.18, 0.82);
    return {
      homeWinProb: hwp, awayWinProb: 1 - hwp,
      confidence: Math.min(80, 50 + Math.abs(logit) * 18),
      keyFactors: pickFactors(home, away,
        ['Punch Power', 'Defensive Rating', 'P4P Ranking', 'Recent Form'],
        [home.offensiveRating, home.defensiveRating, home.eloRating, home.momentum],
        [away.offensiveRating, away.defensiveRating, away.eloRating, away.momentum],
        ['KO power and accuracy edge', 'Head movement and guard', 'All-time ranking proxy', 'Last 5 fights'],
        [true, true, true, true],
      ),
      aiAnalysis: `Power differential and punch accuracy are the decisive factors. ${hwp > 0.5 ? home.name : away.name}'s ${hwp > 0.5 ? 'offensive output and KO rate' : 'defensive boxing and counter-punching'} represent the statistical edge. Ring experience and reach are secondary considerations.`,
    };
  },

  subPages: [
    { slug: '', label: 'Overview' }, { slug: 'teams', label: 'Fighters' },
    { slug: 'players', label: 'Rankings' }, { slug: 'matchup', label: 'Fight Predictor' },
    { slug: 'standings', label: 'Weight Classes' }, { slug: 'schedule', label: 'Cards' },
    { slug: 'power-rankings', label: 'P4P Rankings' },
    { slug: 'leaderboard', label: 'Fighter Stats' }, { slug: 'predictions', label: 'Fight Picks' },
  ],
};

// ─── Tennis ───────────────────────────────────────────────────────────────────
const TENNIS_CONF: SportConfig = {
  id: 'tennis', name: 'Tennis', fullName: 'Professional Tennis (ATP/WTA)',
  slug: 'tennis', sport: 'Tennis', color: '#006400', secondaryColor: '#FFD700',
  description: 'Singles and doubles tennis — Grand Slams, ELO, and surface analytics.',
  emoji: '🎾', competitorLabel: 'Player', isIndividual: true,

  teamStats: [
    { key: 'rank',   label: 'ATP/WTA Rank',description: 'Current world ranking', higherBetter: false, format: 'int',
      derive: t => Math.max(1, Math.round((1 - t.winPct) * 100 + 1)) },
    { key: 'winpct', label: 'Win %',    description: 'Match win percentage', higherBetter: true, format: 'pct1',
      derive: t => t.winPct },
    { key: 'fs1',    label: '1st Srv%', description: 'First serve percentage', higherBetter: true, format: 'pct1',
      derive: t => 0.60 + (t.offensiveRating - 50) * 0.001 },
    { key: 'aces',   label: 'Ace/Match',description: 'Aces per match', higherBetter: true, format: 'dec1',
      derive: t => 5 + (t.offensiveRating - 50) * 0.08 },
    { key: 'bpsaved',label: 'BP Saved%',description: 'Break points saved', higherBetter: true, format: 'pct1',
      derive: t => 0.62 + (t.defensiveRating - 50) * 0.002 },
    { key: 'retwin', label: 'Return%',  description: 'Return points won', higherBetter: true, format: 'pct1',
      derive: t => 0.38 + (t.offensiveRating - 50) * 0.002 },
    { key: 'elo',    label: 'Tennis ELO',description: 'Surface-adjusted ELO rating', higherBetter: true, format: 'int',
      derive: t => t.eloRating },
    { key: 'gs',     label: 'Grand Slams',description: 'Career Grand Slam titles', higherBetter: true, format: 'int',
      derive: t => Math.max(0, Math.round((t.eloRating - 1500) / 100)) },
  ],

  playerStatKeys: ['Win%', 'First Serve%', 'Return Win%', 'Ace/Match', 'Break Points Saved%'],

  standingsCols: [
    { key: 'rank',    label: 'Ranking', short: 'Rank' },
    { key: 'winpct',  label: 'Win %', short: 'W%' },
    { key: 'elo',     label: 'ELO', short: 'ELO' },
    { key: 'fs1',     label: '1st Srv%', short: '1st%' },
    { key: 'bpsaved', label: 'BP Saved', short: 'BPS%' },
    { key: 'gs',      label: 'Grand Slams', short: 'GS' },
  ],

  matchupFactors: [
    { label: 'ATP/WTA ELO', description: 'Surface-adjusted ELO power rating' },
    { label: 'First Serve %', description: 'Serve effectiveness and hold rate' },
    { label: 'Return Points Won', description: 'Break point creation ability' },
    { label: 'Surface Win Rate', description: 'Clay/Hard/Grass specific record' },
    { label: 'H2H Record', description: 'Historical head-to-head matchup' },
  ],

  predict(home, away) {
    const eloEdge  = (home.eloRating - away.eloRating) / 400;
    const serveEdge = (home.offensiveRating - away.offensiveRating) / 50;
    const retEdge  = (home.defensiveRating - away.defensiveRating) / 50;
    const logit = eloEdge * 0.5 + serveEdge * 0.3 + retEdge * 0.3;
    const hwp = clamp(sigmoid(logit * 3.5), 0.10, 0.90);
    return {
      homeWinProb: hwp, awayWinProb: 1 - hwp,
      confidence: Math.min(86, 54 + Math.abs(logit) * 22),
      keyFactors: pickFactors(home, away,
        ['ELO Rating', 'Serve Efficiency', 'Return Effectiveness', 'Recent Form'],
        [home.eloRating, home.offensiveRating, home.defensiveRating, home.momentum],
        [away.eloRating, away.offensiveRating, away.defensiveRating, away.momentum],
        ['Surface-adjusted power rating', 'First serve % and aces', 'Return points won', 'Last 5 match form'],
        [true, true, true, true],
      ),
      aiAnalysis: `ELO differential and surface efficiency are the primary predictors in tennis. ${hwp > 0.5 ? home.name : away.name}'s ${hwp > 0.5 ? 'superior serve dominance' : 'return game and break-point conversion'} creates the statistical edge. Break point saved percentage and H2H record provide further confirmation.`,
    };
  },

  subPages: [
    { slug: '', label: 'Overview' }, { slug: 'teams', label: 'Players' },
    { slug: 'players', label: 'Rankings' }, { slug: 'matchup', label: 'Match Predictor' },
    { slug: 'standings', label: 'Rankings' }, { slug: 'schedule', label: 'Draws' },
    { slug: 'power-rankings', label: 'ELO Rankings' },
    { slug: 'leaderboard', label: 'Stat Leaders' }, { slug: 'predictions', label: 'Match Picks' },
  ],
};

// ─── Formula 1 ───────────────────────────────────────────────────────────────
const F1_CONF: SportConfig = {
  id: 'f1', name: 'Formula 1', fullName: 'FIA Formula 1 World Championship',
  slug: 'f1', sport: 'F1', color: '#E8002D', secondaryColor: '#1E1E1E',
  description: 'The pinnacle of motorsport — aerodynamics, strategy, and 200mph precision.',
  emoji: '🏎️', competitorLabel: 'Driver', isIndividual: true,

  teamStats: [
    { key: 'pts',    label: 'Points',   description: 'Championship points', higherBetter: true, format: 'int',
      derive: t => Math.round(t.eloRating - 1400) },
    { key: 'wins',   label: 'Wins',     description: 'Race victories', higherBetter: true, format: 'int',
      derive: t => Math.max(0, Math.round((t.offensiveRating - 50) * 0.3)) },
    { key: 'pods',   label: 'Podiums',  description: 'Podium finishes', higherBetter: true, format: 'int',
      derive: t => Math.max(0, Math.round((t.offensiveRating - 50) * 0.6)) },
    { key: 'ppr',    label: 'Pts/Race', description: 'Average points per race', higherBetter: true, format: 'dec1',
      derive: t => Math.max(0, (t.offensiveRating - 50) * 0.2) },
    { key: 'qpos',   label: 'Avg Qual', description: 'Average qualifying position', higherBetter: false, format: 'dec1',
      derive: t => Math.max(1, 10 - (t.offensiveRating - 50) * 0.1) },
    { key: 'dnf',    label: 'DNF Rate', description: 'Did not finish rate', higherBetter: false, format: 'pct1',
      derive: t => Math.max(0, 0.15 - (t.defensiveRating - 50) * 0.002) },
    { key: 'tire',   label: 'Tire Mgt', description: 'Tire management score', higherBetter: true, format: 'int',
      derive: t => Math.round(50 + (t.defensiveRating - 50) * 0.8) },
    { key: 'elo',    label: 'Driver ELO',description: 'ELO power rating', higherBetter: true, format: 'int',
      derive: t => t.eloRating },
  ],

  playerStatKeys: ['Points', 'Wins', 'Podiums', 'Qualifying Pace', 'Tire Management'],

  standingsCols: [
    { key: 'record', label: 'Record', short: 'W-DNF' },
    { key: 'pts',    label: 'Points', short: 'PTS' },
    { key: 'wins',   label: 'Wins', short: 'W' },
    { key: 'pods',   label: 'Podiums', short: 'POD' },
    { key: 'ppr',    label: 'Pts/Race', short: 'PPR' },
    { key: 'elo',    label: 'ELO', short: 'ELO' },
  ],

  matchupFactors: [
    { label: 'Driver Pace', description: 'Raw qualifying and race pace' },
    { label: 'Constructor Advantage', description: 'Car performance ceiling' },
    { label: 'Tire Degradation', description: 'Tire management strategy' },
    { label: 'Track History', description: 'Circuit-specific performance' },
    { label: 'DRS Zones', description: 'Overtaking opportunity on this circuit' },
  ],

  predict(home, away) {
    const paceEdge  = (home.offensiveRating - away.offensiveRating) / 40;
    const reliEdge  = (home.defensiveRating - away.defensiveRating) / 40;
    const eloEdge   = (home.eloRating - away.eloRating) / 400;
    const logit = paceEdge * 0.5 + reliEdge * 0.25 + eloEdge * 0.35;
    const hwp = clamp(sigmoid(logit * 3), 0.08, 0.92);
    return {
      homeWinProb: hwp, awayWinProb: 1 - hwp,
      confidence: Math.min(84, 52 + Math.abs(logit) * 22),
      keyFactors: pickFactors(home, away,
        ['Race Pace', 'Car Reliability', 'ELO Power Rating', 'Tire Management'],
        [home.offensiveRating, home.defensiveRating, home.eloRating, home.momentum],
        [away.offensiveRating, away.defensiveRating, away.eloRating, away.momentum],
        ['Lap time and overtaking pace', 'DNF rate and reliability', 'Season-long dominance', 'Tire degradation management'],
        [true, true, true, true],
      ),
      aiAnalysis: `Track characteristics and tire degradation simulations favor ${hwp > 0.5 ? home.name : away.name}. Constructor pace advantage and qualifying position are the primary predictors in F1 — the car ceiling matters. Pit strategy and reliability are secondary factors.`,
    };
  },

  subPages: [
    { slug: '', label: 'Overview' }, { slug: 'teams', label: 'Drivers' },
    { slug: 'players', label: 'Constructors' }, { slug: 'matchup', label: 'Race Predictor' },
    { slug: 'standings', label: 'Standings' }, { slug: 'schedule', label: 'Calendar' },
    { slug: 'power-rankings', label: 'Driver Power' },
    { slug: 'leaderboard', label: 'Stat Leaders' }, { slug: 'predictions', label: 'Race Picks' },
  ],
};

// ─── Cricket ──────────────────────────────────────────────────────────────────
const CRICKET_CONF: SportConfig = {
  id: 'cricket', name: 'Cricket', fullName: 'International Cricket',
  slug: 'cricket', sport: 'Cricket', color: '#1B5E20', secondaryColor: '#FFD700',
  description: 'Test, ODI and T20 cricket — format-specific analytics and predictions.',
  emoji: '🏏', competitorLabel: 'Team', isIndividual: false,

  teamStats: [
    { key: 'batavg',  label: 'Bat AVG',  description: 'Team batting average', higherBetter: true, format: 'dec2',
      derive: t => 28 + (t.offensiveRating - 50) * 0.3 },
    { key: 'sr',      label: 'Bat SR',   description: 'Batting strike rate', higherBetter: true, format: 'dec1',
      derive: t => 120 + (t.offensiveRating - 50) * 1.2 },
    { key: 'bowlavg', label: 'Bowl AVG', description: 'Bowling average (lower=better)', higherBetter: false, format: 'dec2',
      derive: t => 32 - (t.defensiveRating - 50) * 0.3 },
    { key: 'econ',    label: 'Economy',  description: 'Runs per over conceded', higherBetter: false, format: 'dec2',
      derive: t => 7.2 - (t.defensiveRating - 50) * 0.04 },
    { key: 'wkts',    label: 'Wkts/Inn', description: 'Wickets per innings', higherBetter: true, format: 'dec1',
      derive: t => 5 + (t.defensiveRating - 50) * 0.05 },
    { key: 'dot',     label: 'Dot Ball%', description: 'Dot ball percentage', higherBetter: true, format: 'pct1',
      derive: t => 0.40 + (t.defensiveRating - 50) * 0.002 },
    { key: 'bound',   label: 'Boundary%',description: 'Boundary percentage', higherBetter: true, format: 'pct1',
      derive: t => 0.40 + (t.offensiveRating - 50) * 0.002 },
    { key: 'elo',     label: 'ICC Rating',description: 'ICC power rating', higherBetter: true, format: 'int',
      derive: t => t.eloRating },
  ],

  playerStatKeys: ['Batting AVG', 'Strike Rate', 'Bowling AVG', 'Economy', 'Wickets'],

  standingsCols: [
    { key: 'record',  label: 'Record', short: 'W-L' },
    { key: 'winPct',  label: 'Win %', short: 'W%' },
    { key: 'batavg',  label: 'Bat AVG', short: 'BAT' },
    { key: 'bowlavg', label: 'Bowl AVG', short: 'BWL' },
    { key: 'econ',    label: 'Economy', short: 'ECO' },
    { key: 'elo',     label: 'ICC Rating', short: 'ICC' },
  ],

  matchupFactors: [
    { label: 'Batting Lineup', description: 'Batting average and strike rate depth' },
    { label: 'Bowling Attack', description: 'Bowling average and economy rate' },
    { label: 'Pitch Conditions', description: 'Spin or pace-friendly surface' },
    { label: 'Home Advantage', description: 'Familiar conditions and crowd', homeAdvantage: true },
    { label: 'Format (T20/ODI)', description: 'Team\'s format-specific record' },
  ],

  predict(home, away) {
    const batEdge  = (home.offensiveRating - away.defensiveRating) / 40;
    const bowlEdge = (home.defensiveRating - away.offensiveRating) / 40;
    const eloEdge  = (home.eloRating - away.eloRating) / 400;
    const homeAdv  = 0.06;
    const logit = homeAdv + batEdge * 0.4 + bowlEdge * 0.4 + eloEdge * 0.3;
    const hwp = clamp(sigmoid(logit * 3), 0.15, 0.85);
    return {
      homeWinProb: hwp, awayWinProb: 1 - hwp,
      confidence: Math.min(82, 50 + Math.abs(logit) * 18),
      keyFactors: pickFactors(home, away,
        ['Batting Depth', 'Bowling Attack', 'ICC Rating', 'Home Conditions'],
        [home.offensiveRating, home.defensiveRating, home.eloRating, 1],
        [away.offensiveRating, away.defensiveRating, away.eloRating, 0],
        ['Batting average and strike rate', 'Bowling average and economy', 'ICC power rating', 'Home pitch familiarity'],
        [true, true, true, true],
      ),
      aiAnalysis: `Batting depth and bowling attack quality are the primary predictors. ${hwp > 0.5 ? home.name : away.name}'s ${hwp > 0.5 ? 'superior batting lineup depth' : 'bowling attack and economy rate'} is the decisive factor. Pitch conditions and format-specific records should be monitored.`,
    };
  },

  subPages: [
    { slug: '', label: 'Overview' }, { slug: 'teams', label: 'Teams' },
    { slug: 'players', label: 'Players' }, { slug: 'matchup', label: 'Match Predictor' },
    { slug: 'standings', label: 'ICC Rankings' }, { slug: 'schedule', label: 'Fixtures' },
    { slug: 'power-rankings', label: 'Power Rankings' },
    { slug: 'leaderboard', label: 'Batting/Bowling' }, { slug: 'predictions', label: 'Match Picks' },
  ],
};

// ─── Esports ──────────────────────────────────────────────────────────────────
const ESPORTS_CONF: SportConfig = {
  id: 'esports', name: 'Esports', fullName: 'Competitive Esports',
  slug: 'esports', sport: 'Esports', color: '#6D28D9', secondaryColor: '#10B981',
  description: 'League of Legends, CS2, Valorant, Dota 2 — elite competitive gaming.',
  emoji: '🎮', competitorLabel: 'Team', isIndividual: false,

  teamStats: [
    { key: 'winpct', label: 'Win%',     description: 'Match win percentage', higherBetter: true, format: 'pct1',
      derive: t => t.winPct },
    { key: 'kda',    label: 'KDA',      description: 'Kill/death/assist ratio (LoL/CS2)', higherBetter: true, format: 'dec2',
      derive: t => 1.0 + (t.offensiveRating - 50) * 0.02 },
    { key: 'adr',    label: 'ADR',      description: 'Average damage per round (CS2)', higherBetter: true, format: 'dec1',
      derive: t => 70 + (t.offensiveRating - 50) * 0.5 },
    { key: 'impact', label: 'Impact',   description: 'HLTV Impact Rating / team DPM', higherBetter: true, format: 'dec2',
      derive: t => 1.0 + (t.offensiveRating - 50) * 0.015 },
    { key: 'def',    label: 'Defense',  description: 'Defensive utility and coordination', higherBetter: true, format: 'dec1',
      derive: t => 50 + (t.defensiveRating - 50) * 0.6 },
    { key: 'eco',    label: 'Economy',  description: 'Resource management efficiency', higherBetter: true, format: 'dec1',
      derive: t => 50 + (t.netRating) * 0.8 },
    { key: 'ctrlmap',label: 'Map Ctrl%',description: 'Map control score', higherBetter: true, format: 'pct1',
      derive: t => 0.50 + (t.offensiveRating - 50) * 0.003 },
    { key: 'elo',    label: 'ELO',      description: 'Competitive ELO ranking', higherBetter: true, format: 'int',
      derive: t => t.eloRating },
  ],

  playerStatKeys: ['KDA', 'ADR', 'Impact Rating', 'KAST%', 'Win%'],

  standingsCols: [
    { key: 'record',  label: 'Record', short: 'W-L' },
    { key: 'winpct',  label: 'Win%', short: 'W%' },
    { key: 'kda',     label: 'KDA', short: 'KDA' },
    { key: 'adr',     label: 'ADR', short: 'ADR' },
    { key: 'impact',  label: 'Impact', short: 'IMP' },
    { key: 'elo',     label: 'ELO', short: 'ELO' },
  ],

  matchupFactors: [
    { label: 'Mechanical Skill', description: 'Individual player mechanics and aim rating' },
    { label: 'Team Coordination', description: 'Communication and strategic execution' },
    { label: 'Map Control', description: 'Map knowledge and territory control' },
    { label: 'Economy Management', description: 'Buy rounds and eco management' },
    { label: 'Meta Adaptation', description: 'Patch and meta reading speed' },
  ],

  predict(home, away) {
    const skillEdge = (home.offensiveRating - away.offensiveRating) / 40;
    const defEdge   = (home.defensiveRating - away.defensiveRating) / 40;
    const eloEdge   = (home.eloRating - away.eloRating) / 400;
    const logit = skillEdge * 0.45 + defEdge * 0.3 + eloEdge * 0.35;
    const hwp = clamp(sigmoid(logit * 3.5), 0.10, 0.90);
    return {
      homeWinProb: hwp, awayWinProb: 1 - hwp,
      confidence: Math.min(88, 54 + Math.abs(logit) * 20),
      keyFactors: pickFactors(home, away,
        ['Mechanical Rating', 'Defensive Play', 'ELO Power Rating', 'Map Control'],
        [home.offensiveRating, home.defensiveRating, home.eloRating, home.momentum],
        [away.offensiveRating, away.defensiveRating, away.eloRating, away.momentum],
        ['Individual skill and aim rating', 'Utility usage and defense', 'HLTV/ELO power rating', 'Map presence and control'],
        [true, true, true, true],
      ),
      aiAnalysis: `${hwp > 0.5 ? home.name : away.name}'s mechanical skill rating and team coordination give them the statistical edge. In competitive esports, individual impact metrics (ADR, KDA, Rating) drive outcome variance more than any tactical factor. Map pick advantage and economic discipline are the secondary predictors.`,
    };
  },

  subPages: [
    { slug: '', label: 'Overview' }, { slug: 'teams', label: 'Teams' },
    { slug: 'players', label: 'Players' }, { slug: 'matchup', label: 'Match Predictor' },
    { slug: 'standings', label: 'Circuit Standings' }, { slug: 'schedule', label: 'Schedule' },
    { slug: 'power-rankings', label: 'Power Rankings' },
    { slug: 'leaderboard', label: 'Player Stats' }, { slug: 'predictions', label: 'Match Picks' },
  ],
};

// ── SPORT MAP ─────────────────────────────────────────────────────────────────

export const SPORT_CONFIGS: Record<string, SportConfig> = {
  nba:     NBA,
  mlb:     MLB,
  nhl:     NHL,
  soccer:  SOCCER,
  ncaaf:   NCAAF,
  ncaab:   NCAAB,
  ufc:     UFC_CONF,
  boxing:  BOXING_CONF,
  tennis:  TENNIS_CONF,
  f1:      F1_CONF,
  cricket: CRICKET_CONF,
  esports: ESPORTS_CONF,
};

export const ALL_SPORT_CONFIGS = Object.values(SPORT_CONFIGS);

export function getSportConfig(slug: string): SportConfig | undefined {
  return SPORT_CONFIGS[slug.toLowerCase()];
}

/** Format a stat value according to its StatDef */
export function formatStat(value: number | string, format: StatDef['format']): string {
  if (typeof value === 'string') return value;
  switch (format) {
    case 'int':  return Math.round(value).toLocaleString();
    case 'dec1': return value.toFixed(1);
    case 'dec2': return value.toFixed(2);
    case 'dec3': return value.toFixed(3);
    case 'pct':  return (value * 100).toFixed(0) + '%';
    case 'pct1': return (value * 100).toFixed(1) + '%';
    default:     return String(value);
  }
}
