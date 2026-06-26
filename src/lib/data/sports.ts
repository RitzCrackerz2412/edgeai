/**
 * Complete sport configuration registry.
 *
 * Contains metadata for all 13 supported sports:
 *   leagues, positions, stat categories, season structures,
 *   scoring conventions, and venue requirements.
 */

import type { Sport } from '../types';

export interface SportConfig {
  id: Sport;
  displayName: string;
  shortName: string;
  icon: string;
  color: string;
  leagues: LeagueConfig[];
  positions: string[];
  statCategories: StatCategory[];
  scoringUnit: string;             // "points" | "runs" | "goals" | etc.
  hasDraws: boolean;
  hasOvertime: boolean;
  hasPeriods: boolean;
  periodName: string;              // "quarter" | "inning" | "period" | etc.
  periodCount: number;
  gameLength: string;              // "60 min" | "9 innings" | etc.
  teamSize: number;                // active roster on field
  advancedStatsAvailable: boolean;
}

export interface LeagueConfig {
  id: string;
  name: string;
  country: string;
  tier: 'major' | 'minor' | 'college' | 'international';
  seasonStart: string;             // month abbreviation, e.g. "Sep"
  seasonEnd: string;
  playoffFormat: string;
  teamCount: number;
}

export interface StatCategory {
  key: string;
  label: string;
  unit: string;
  higherIsBetter: boolean;
  isAdvanced: boolean;
}

// ── Sport configurations ──────────────────────────────────────────────────────

export const SPORT_CONFIGS: Record<Sport, SportConfig> = {
  NFL: {
    id: 'NFL', displayName: 'National Football League', shortName: 'NFL',
    icon: '🏈', color: '#013369',
    scoringUnit: 'points', hasDraws: false, hasOvertime: true,
    hasPeriods: true, periodName: 'quarter', periodCount: 4,
    gameLength: '60 min', teamSize: 11, advancedStatsAvailable: true,
    leagues: [
      { id: 'nfl', name: 'NFL', country: 'USA', tier: 'major', seasonStart: 'Sep', seasonEnd: 'Feb', playoffFormat: 'Single Elimination (14 teams)', teamCount: 32 },
    ],
    positions: ['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'CB', 'S', 'K', 'P'],
    statCategories: [
      { key: 'pass_yards', label: 'Passing Yards', unit: 'yds', higherIsBetter: true,  isAdvanced: false },
      { key: 'rush_yards', label: 'Rushing Yards', unit: 'yds', higherIsBetter: true,  isAdvanced: false },
      { key: 'points_per_game', label: 'Points/Game', unit: 'pts', higherIsBetter: true, isAdvanced: false },
      { key: 'epa_per_play', label: 'EPA/Play', unit: '', higherIsBetter: true, isAdvanced: true },
      { key: 'dvoa', label: 'DVOA', unit: '%', higherIsBetter: true, isAdvanced: true },
      { key: 'success_rate', label: 'Success Rate', unit: '%', higherIsBetter: true, isAdvanced: true },
      { key: 'red_zone_td_pct', label: 'RZ TD%', unit: '%', higherIsBetter: true, isAdvanced: true },
      { key: 'turnover_diff', label: 'Turnover Diff', unit: '', higherIsBetter: true, isAdvanced: false },
    ],
  },

  NBA: {
    id: 'NBA', displayName: 'National Basketball Association', shortName: 'NBA',
    icon: '🏀', color: '#1d428a',
    scoringUnit: 'points', hasDraws: false, hasOvertime: true,
    hasPeriods: true, periodName: 'quarter', periodCount: 4,
    gameLength: '48 min', teamSize: 5, advancedStatsAvailable: true,
    leagues: [
      { id: 'nba', name: 'NBA', country: 'USA', tier: 'major', seasonStart: 'Oct', seasonEnd: 'Jun', playoffFormat: 'Best of 7 (16 teams)', teamCount: 30 },
    ],
    positions: ['PG', 'SG', 'SF', 'PF', 'C'],
    statCategories: [
      { key: 'points_per_game', label: 'PPG', unit: 'pts', higherIsBetter: true, isAdvanced: false },
      { key: 'off_rtg', label: 'Offensive Rating', unit: '', higherIsBetter: true, isAdvanced: false },
      { key: 'def_rtg', label: 'Defensive Rating', unit: '', higherIsBetter: false, isAdvanced: false },
      { key: 'ts_pct', label: 'True Shooting %', unit: '%', higherIsBetter: true, isAdvanced: true },
      { key: 'efg_pct', label: 'eFG%', unit: '%', higherIsBetter: true, isAdvanced: true },
      { key: 'assist_ratio', label: 'Assist Ratio', unit: '', higherIsBetter: true, isAdvanced: true },
      { key: 'net_rating', label: 'Net Rating', unit: '', higherIsBetter: true, isAdvanced: false },
    ],
  },

  MLB: {
    id: 'MLB', displayName: 'Major League Baseball', shortName: 'MLB',
    icon: '⚾', color: '#002D72',
    scoringUnit: 'runs', hasDraws: false, hasOvertime: true,
    hasPeriods: true, periodName: 'inning', periodCount: 9,
    gameLength: '9 innings', teamSize: 9, advancedStatsAvailable: true,
    leagues: [
      { id: 'mlb-al', name: 'American League', country: 'USA', tier: 'major', seasonStart: 'Apr', seasonEnd: 'Oct', playoffFormat: 'Wild Card + Division Series', teamCount: 15 },
      { id: 'mlb-nl', name: 'National League', country: 'USA', tier: 'major', seasonStart: 'Apr', seasonEnd: 'Oct', playoffFormat: 'Wild Card + Division Series', teamCount: 15 },
    ],
    positions: ['SP', 'RP', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'],
    statCategories: [
      { key: 'era', label: 'ERA', unit: '', higherIsBetter: false, isAdvanced: false },
      { key: 'ops', label: 'OPS', unit: '', higherIsBetter: true, isAdvanced: false },
      { key: 'wrc_plus', label: 'wRC+', unit: '', higherIsBetter: true, isAdvanced: true },
      { key: 'fip', label: 'FIP', unit: '', higherIsBetter: false, isAdvanced: true },
      { key: 'xfip', label: 'xFIP', unit: '', higherIsBetter: false, isAdvanced: true },
      { key: 'babip', label: 'BABIP', unit: '', higherIsBetter: true, isAdvanced: true },
      { key: 'war', label: 'WAR', unit: '', higherIsBetter: true, isAdvanced: true },
    ],
  },

  NHL: {
    id: 'NHL', displayName: 'National Hockey League', shortName: 'NHL',
    icon: '🏒', color: '#000000',
    scoringUnit: 'goals', hasDraws: false, hasOvertime: true,
    hasPeriods: true, periodName: 'period', periodCount: 3,
    gameLength: '60 min', teamSize: 6, advancedStatsAvailable: true,
    leagues: [
      { id: 'nhl', name: 'NHL', country: 'USA/Canada', tier: 'major', seasonStart: 'Oct', seasonEnd: 'Jun', playoffFormat: 'Best of 7 (16 teams)', teamCount: 32 },
    ],
    positions: ['C', 'LW', 'RW', 'LD', 'RD', 'G'],
    statCategories: [
      { key: 'goals', label: 'Goals', unit: '', higherIsBetter: true, isAdvanced: false },
      { key: 'shots_per_game', label: 'Shots/Game', unit: '', higherIsBetter: true, isAdvanced: false },
      { key: 'save_pct', label: 'Save %', unit: '%', higherIsBetter: true, isAdvanced: false },
      { key: 'corsi_pct', label: 'Corsi %', unit: '%', higherIsBetter: true, isAdvanced: true },
      { key: 'fenwick_pct', label: 'Fenwick %', unit: '%', higherIsBetter: true, isAdvanced: true },
      { key: 'expected_goals', label: 'xGoals', unit: '', higherIsBetter: true, isAdvanced: true },
    ],
  },

  Soccer: {
    id: 'Soccer', displayName: 'Soccer / Football', shortName: 'Soccer',
    icon: '⚽', color: '#2c7d3a',
    scoringUnit: 'goals', hasDraws: true, hasOvertime: true,
    hasPeriods: true, periodName: 'half', periodCount: 2,
    gameLength: '90 min', teamSize: 11, advancedStatsAvailable: true,
    leagues: [
      { id: 'epl', name: 'English Premier League', country: 'England', tier: 'major', seasonStart: 'Aug', seasonEnd: 'May', playoffFormat: 'None (league table)', teamCount: 20 },
      { id: 'laliga', name: 'La Liga', country: 'Spain', tier: 'major', seasonStart: 'Aug', seasonEnd: 'May', playoffFormat: 'None (league table)', teamCount: 20 },
      { id: 'bundesliga', name: 'Bundesliga', country: 'Germany', tier: 'major', seasonStart: 'Aug', seasonEnd: 'May', playoffFormat: 'None (league table)', teamCount: 18 },
      { id: 'seriea', name: 'Serie A', country: 'Italy', tier: 'major', seasonStart: 'Aug', seasonEnd: 'May', playoffFormat: 'None (league table)', teamCount: 20 },
      { id: 'ligue1', name: 'Ligue 1', country: 'France', tier: 'major', seasonStart: 'Aug', seasonEnd: 'May', playoffFormat: 'None (league table)', teamCount: 18 },
      { id: 'mls', name: 'MLS', country: 'USA', tier: 'major', seasonStart: 'Feb', seasonEnd: 'Dec', playoffFormat: 'Playoff bracket', teamCount: 29 },
      { id: 'ucl', name: 'UEFA Champions League', country: 'Europe', tier: 'international', seasonStart: 'Sep', seasonEnd: 'Jun', playoffFormat: 'Group stage + knockout', teamCount: 36 },
    ],
    positions: ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'ST'],
    statCategories: [
      { key: 'xg_per_90', label: 'xG/90', unit: '', higherIsBetter: true, isAdvanced: true },
      { key: 'xa_per_90', label: 'xA/90', unit: '', higherIsBetter: true, isAdvanced: true },
      { key: 'possession_pct', label: 'Possession', unit: '%', higherIsBetter: true, isAdvanced: false },
      { key: 'ppda', label: 'PPDA', unit: '', higherIsBetter: false, isAdvanced: true },
      { key: 'shots_on_target', label: 'SoT/Game', unit: '', higherIsBetter: true, isAdvanced: false },
    ],
  },

  'NCAA Football': {
    id: 'NCAA Football', displayName: 'NCAA Football', shortName: 'CFB',
    icon: '🏈', color: '#B08D57',
    scoringUnit: 'points', hasDraws: false, hasOvertime: true,
    hasPeriods: true, periodName: 'quarter', periodCount: 4,
    gameLength: '60 min', teamSize: 11, advancedStatsAvailable: true,
    leagues: [
      { id: 'cfb-p4', name: 'Power Four', country: 'USA', tier: 'college', seasonStart: 'Sep', seasonEnd: 'Jan', playoffFormat: 'CFP 12-team playoff', teamCount: 70 },
      { id: 'cfb-g5', name: 'Group of 5', country: 'USA', tier: 'college', seasonStart: 'Sep', seasonEnd: 'Jan', playoffFormat: 'Bowl games', teamCount: 65 },
    ],
    positions: ['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'CB', 'S', 'K', 'P'],
    statCategories: [
      { key: 'points_per_game', label: 'PPG', unit: 'pts', higherIsBetter: true, isAdvanced: false },
      { key: 'yards_per_play', label: 'Yds/Play', unit: 'yds', higherIsBetter: true, isAdvanced: false },
      { key: 'sp_plus', label: 'SP+', unit: '', higherIsBetter: true, isAdvanced: true },
    ],
    positions_extended: ['QB', 'RB', 'WR', 'TE', 'OL', 'DE', 'DT', 'LB', 'CB', 'S'],
  } as SportConfig,

  'NCAA Basketball': {
    id: 'NCAA Basketball', displayName: 'NCAA Basketball', shortName: 'CBB',
    icon: '🏀', color: '#FFB300',
    scoringUnit: 'points', hasDraws: false, hasOvertime: true,
    hasPeriods: true, periodName: 'half', periodCount: 2,
    gameLength: '40 min', teamSize: 5, advancedStatsAvailable: true,
    leagues: [
      { id: 'ncaab-d1', name: 'NCAA Division I', country: 'USA', tier: 'college', seasonStart: 'Nov', seasonEnd: 'Apr', playoffFormat: 'March Madness (68 teams)', teamCount: 362 },
    ],
    positions: ['PG', 'SG', 'SF', 'PF', 'C'],
    statCategories: [
      { key: 'adj_off_eff', label: 'Adj. Off. Eff.', unit: '', higherIsBetter: true, isAdvanced: true },
      { key: 'adj_def_eff', label: 'Adj. Def. Eff.', unit: '', higherIsBetter: false, isAdvanced: true },
      { key: 'kenpom_rank', label: 'KenPom Rank', unit: '', higherIsBetter: false, isAdvanced: true },
    ],
  },

  UFC: {
    id: 'UFC', displayName: 'Ultimate Fighting Championship', shortName: 'UFC',
    icon: '🥊', color: '#D20A0A',
    scoringUnit: 'rounds', hasDraws: true, hasOvertime: false,
    hasPeriods: true, periodName: 'round', periodCount: 3,
    gameLength: '3-5 rounds', teamSize: 1, advancedStatsAvailable: true,
    leagues: [
      { id: 'ufc', name: 'UFC', country: 'International', tier: 'major', seasonStart: 'Jan', seasonEnd: 'Dec', playoffFormat: 'N/A (ranked matchmaking)', teamCount: 700 },
    ],
    positions: ['Heavyweight', 'Light Heavyweight', 'Middleweight', 'Welterweight', 'Lightweight', 'Featherweight', 'Bantamweight', 'Flyweight'],
    statCategories: [
      { key: 'sig_strike_acc', label: 'Sig. Strike Acc.', unit: '%', higherIsBetter: true, isAdvanced: false },
      { key: 'takedown_acc', label: 'Takedown Acc.', unit: '%', higherIsBetter: true, isAdvanced: false },
      { key: 'finish_rate', label: 'Finish Rate', unit: '%', higherIsBetter: true, isAdvanced: false },
      { key: 'striking_differential', label: 'Strike Diff', unit: '', higherIsBetter: true, isAdvanced: true },
    ],
  },

  Boxing: {
    id: 'Boxing', displayName: 'Boxing', shortName: 'Boxing',
    icon: '🥊', color: '#8B0000',
    scoringUnit: 'rounds', hasDraws: true, hasOvertime: false,
    hasPeriods: true, periodName: 'round', periodCount: 12,
    gameLength: '12 rounds', teamSize: 1, advancedStatsAvailable: false,
    leagues: [
      { id: 'wbc', name: 'WBC', country: 'International', tier: 'major', seasonStart: 'Jan', seasonEnd: 'Dec', playoffFormat: 'N/A', teamCount: 200 },
      { id: 'wba', name: 'WBA', country: 'International', tier: 'major', seasonStart: 'Jan', seasonEnd: 'Dec', playoffFormat: 'N/A', teamCount: 200 },
    ],
    positions: ['Heavyweight', 'Cruiserweight', 'Light Heavyweight', 'Super Middleweight', 'Middleweight', 'Super Welterweight', 'Welterweight', 'Super Lightweight', 'Lightweight', 'Super Featherweight', 'Featherweight', 'Super Bantamweight', 'Bantamweight', 'Super Flyweight', 'Flyweight', 'Minimumweight'],
    statCategories: [
      { key: 'ko_rate', label: 'KO Rate', unit: '%', higherIsBetter: true, isAdvanced: false },
      { key: 'accuracy', label: 'Punch Accuracy', unit: '%', higherIsBetter: true, isAdvanced: false },
    ],
  },

  Tennis: {
    id: 'Tennis', displayName: 'Tennis', shortName: 'Tennis',
    icon: '🎾', color: '#C8A951',
    scoringUnit: 'sets', hasDraws: false, hasOvertime: false,
    hasPeriods: true, periodName: 'set', periodCount: 3,
    gameLength: 'Best of 3/5 sets', teamSize: 1, advancedStatsAvailable: true,
    leagues: [
      { id: 'atp', name: 'ATP Tour', country: 'International', tier: 'major', seasonStart: 'Jan', seasonEnd: 'Nov', playoffFormat: 'Grand Slams + Masters', teamCount: 500 },
      { id: 'wta', name: 'WTA Tour', country: 'International', tier: 'major', seasonStart: 'Jan', seasonEnd: 'Nov', playoffFormat: 'Grand Slams + Masters', teamCount: 500 },
    ],
    positions: ['Singles', 'Doubles'],
    statCategories: [
      { key: 'first_serve_pct', label: '1st Serve %', unit: '%', higherIsBetter: true, isAdvanced: false },
      { key: 'ace_rate', label: 'Ace Rate', unit: '', higherIsBetter: true, isAdvanced: false },
      { key: 'break_point_conversion', label: 'BP Conversion', unit: '%', higherIsBetter: true, isAdvanced: true },
      { key: 'surface_win_rate', label: 'Surface Win %', unit: '%', higherIsBetter: true, isAdvanced: true },
    ],
  },

  F1: {
    id: 'F1', displayName: 'Formula 1', shortName: 'F1',
    icon: '🏎️', color: '#E8002D',
    scoringUnit: 'points', hasDraws: false, hasOvertime: false,
    hasPeriods: false, periodName: 'race', periodCount: 1,
    gameLength: '~2 hrs', teamSize: 1, advancedStatsAvailable: true,
    leagues: [
      { id: 'f1', name: 'FIA Formula One World Championship', country: 'International', tier: 'major', seasonStart: 'Mar', seasonEnd: 'Dec', playoffFormat: 'Season championship points', teamCount: 20 },
    ],
    positions: ['Driver'],
    statCategories: [
      { key: 'qualifying_position', label: 'Avg Qualifying', unit: '', higherIsBetter: false, isAdvanced: false },
      { key: 'race_position', label: 'Avg Race Pos.', unit: '', higherIsBetter: false, isAdvanced: false },
      { key: 'points', label: 'Championship Points', unit: 'pts', higherIsBetter: true, isAdvanced: false },
      { key: 'fastest_laps', label: 'Fastest Laps', unit: '', higherIsBetter: true, isAdvanced: true },
      { key: 'dnf_rate', label: 'DNF Rate', unit: '%', higherIsBetter: false, isAdvanced: false },
    ],
  },

  Cricket: {
    id: 'Cricket', displayName: 'Cricket', shortName: 'Cricket',
    icon: '🏏', color: '#007A3D',
    scoringUnit: 'runs', hasDraws: true, hasOvertime: false,
    hasPeriods: true, periodName: 'innings', periodCount: 2,
    gameLength: 'Test: 5 days / ODI: 50 overs / T20: 20 overs', teamSize: 11, advancedStatsAvailable: true,
    leagues: [
      { id: 'icc-test', name: 'ICC Test Championship', country: 'International', tier: 'major', seasonStart: 'Jan', seasonEnd: 'Dec', playoffFormat: 'Final', teamCount: 12 },
      { id: 'ipl', name: 'Indian Premier League', country: 'India', tier: 'major', seasonStart: 'Mar', seasonEnd: 'May', playoffFormat: 'Playoff', teamCount: 10 },
      { id: 'icc-t20', name: 'ICC T20 World Cup', country: 'International', tier: 'international', seasonStart: 'Jun', seasonEnd: 'Jun', playoffFormat: 'Super 8 + Knockout', teamCount: 20 },
    ],
    positions: ['Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper'],
    statCategories: [
      { key: 'batting_average', label: 'Batting Average', unit: '', higherIsBetter: true, isAdvanced: false },
      { key: 'bowling_average', label: 'Bowling Average', unit: '', higherIsBetter: false, isAdvanced: false },
      { key: 'strike_rate', label: 'Strike Rate', unit: '', higherIsBetter: true, isAdvanced: false },
      { key: 'economy_rate', label: 'Economy Rate', unit: '', higherIsBetter: false, isAdvanced: false },
    ],
  },

  Esports: {
    id: 'Esports', displayName: 'Esports', shortName: 'Esports',
    icon: '🎮', color: '#6441A5',
    scoringUnit: 'maps', hasDraws: false, hasOvertime: false,
    hasPeriods: true, periodName: 'map', periodCount: 3,
    gameLength: 'Best of 3/5', teamSize: 5, advancedStatsAvailable: true,
    leagues: [
      { id: 'lol-worlds', name: 'League of Legends World Championship', country: 'International', tier: 'major', seasonStart: 'Oct', seasonEnd: 'Nov', playoffFormat: 'Group + Knockout', teamCount: 22 },
      { id: 'cs2-major', name: 'CS2 Major', country: 'International', tier: 'major', seasonStart: 'Various', seasonEnd: 'Various', playoffFormat: 'Swiss + Playoff', teamCount: 24 },
      { id: 'valorant-vct', name: 'Valorant Champions Tour', country: 'International', tier: 'major', seasonStart: 'Jan', seasonEnd: 'Aug', playoffFormat: 'Regional leagues + Champions', teamCount: 30 },
      { id: 'dota2-ti', name: 'The International (Dota 2)', country: 'International', tier: 'major', seasonStart: 'Oct', seasonEnd: 'Oct', playoffFormat: 'Group + Double Elimination', teamCount: 18 },
    ],
    positions: ['Top', 'Jungle', 'Mid', 'ADC', 'Support', 'IGL', 'Rifler', 'AWPer', 'Entry'],
    statCategories: [
      { key: 'win_rate', label: 'Win Rate', unit: '%', higherIsBetter: true, isAdvanced: false },
      { key: 'map_win_rate', label: 'Map Win Rate', unit: '%', higherIsBetter: true, isAdvanced: false },
      { key: 'rating', label: 'Player Rating', unit: '', higherIsBetter: true, isAdvanced: true },
      { key: 'kda', label: 'KDA Ratio', unit: '', higherIsBetter: true, isAdvanced: false },
    ],
  },
};

export const ALL_SPORTS = Object.keys(SPORT_CONFIGS) as Sport[];

export function getSportConfig(sport: Sport): SportConfig {
  return SPORT_CONFIGS[sport];
}

export function getSportsByCategory(): Record<string, Sport[]> {
  return {
    'American Sports':  ['NFL', 'NBA', 'MLB', 'NHL', 'NCAA Football', 'NCAA Basketball'],
    'Combat Sports':    ['UFC', 'Boxing'],
    'Global Sports':    ['Soccer', 'Tennis', 'Cricket'],
    'Racing & Tech':    ['F1'],
    'Digital Sports':   ['Esports'],
  };
}
