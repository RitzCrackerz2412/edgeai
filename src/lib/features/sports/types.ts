/**
 * Sport-specific advanced feature interfaces.
 *
 * Each extends SportFeatureBase with metrics meaningful for that sport.
 * The base model (logistic regression) uses only the common GameFeatureVector.
 * Sport-specific models can additionally consume these extended features.
 */

import type { Sport } from '../../types';

// ── Common base ───────────────────────────────────────────────────────────────

export interface SportFeatureBase {
  teamId: string;
  sport: Sport;
  isHome: boolean;
  /** 0-1, overall data freshness/completeness score */
  dataQuality: number;
}

// ── NFL ───────────────────────────────────────────────────────────────────────

export interface NFLFeatures extends SportFeatureBase {
  // Offensive efficiency
  epaPplay: number;              // Expected Points Added per play (+/-)
  successRate: number;           // % plays gaining ≥50% of needed yards (0-1)
  dvoa: number;                  // DVOA proxy, normalized: 0=avg, >0=better
  explosivePlayRate: number;     // % of plays >20y passing / >10y rushing (0-1)

  // Situational
  redZoneEfficiency: number;     // TD% in red zone (0-1)
  thirdDownConversion: number;   // 3rd down conversion % (0-1)

  // Defensive
  pressureRate: number;          // pass pressure rate generated (0-1)
  sackRate: number;              // sacks per pass attempt (0-1)
  turnoverDifferential: number;  // TO diff per game (+/-)

  // Special teams
  specialTeamsRating: number;    // ST DVOA proxy, normalized 0-1
}

// ── NBA ───────────────────────────────────────────────────────────────────────

export interface NBAFeatures extends SportFeatureBase {
  // Shooting efficiency
  trueShootingPct: number;       // TS% (0-1)
  effectiveFGPct: number;        // eFG% (0-1)

  // Possession
  assistRatio: number;           // assists per 100 possessions (0-1 normalized)
  reboundingPct: number;         // total rebounding % (0-1)
  turnoversPerPoss: number;      // TOV per 100 poss, inverted so higher = better (0-1)

  // Lineup / clutch
  clutchRating: number;          // net rating in final 5 min of close games (0-1)
  lineupNetRating: number;       // best 5-man lineup net rating, normalized (0-1)
  paceAdjustedOffRtg: number;    // pace-normalized offensive rating (0-1)
  paceAdjustedDefRtg: number;    // pace-normalized defensive rating (0-1)
}

// ── MLB ───────────────────────────────────────────────────────────────────────

export interface MLBFeatures extends SportFeatureBase {
  // Batting
  wrcPlus: number;               // wRC+ (100 = league avg), normalized 0-1
  ops: number;                   // OPS (0-1 normalized, 0.8 OPS = elite)
  babip: number;                 // BABIP (normalized; extremes suggest luck)

  // Pitching
  fip: number;                   // FIP (lower = better), inverted to 0-1
  xfip: number;                  // xFIP, inverted to 0-1
  startingPitcherQuality: number; // projected starter ERA+, normalized 0-1
  bullpenRating: number;         // bullpen ERA-, inverted to 0-1

  // Context
  parkFactor: number;            // run environment (1.0 = neutral, >1 = hitter-friendly)
  platoonsAdvantage: number;     // platoon advantage vs starter, -1 to +1
}

// ── Soccer ────────────────────────────────────────────────────────────────────

export interface SoccerFeatures extends SportFeatureBase {
  // Attack
  xgPerGame: number;             // xG per 90 min (normalized 0-1)
  xaPerGame: number;             // xA per 90 min (normalized 0-1)
  shotsOnTarget: number;         // shots on target per 90 (normalized 0-1)
  setPieceEfficiency: number;    // xG from set pieces per game (0-1)

  // Defense
  xgaPerGame: number;            // xGA per 90 min (lower = better), inverted 0-1
  defensiveErrors: number;       // errors leading to shots, inverted 0-1

  // Style
  possession: number;            // possession % (0-1)
  pressingIntensity: number;     // PPDA (lower = more pressing), inverted 0-1

  // Summary
  xgDiff: number;                // xG - xGA per game, normalized
}

// ── UFC ───────────────────────────────────────────────────────────────────────

export interface UFCFeatures extends SportFeatureBase {
  strikeAccuracy: number;        // significant strike accuracy (0-1)
  strikeDefense: number;         // significant strike defense (0-1)
  takedownAccuracy: number;      // takedown accuracy (0-1)
  takedownDefense: number;       // takedown defense (0-1)
  submissionAttempts: number;    // sub attempts per 15 min, normalized (0-1)
  knockdownsPerFight: number;    // normalized (0-1)
  finishRate: number;            // % fights finished (KO/TKO/Sub) (0-1)
  activityScore: number;         // recent activity / ring rust, 0-1
}

// ── Union type ────────────────────────────────────────────────────────────────

export type SportFeatures = NFLFeatures | NBAFeatures | MLBFeatures | SoccerFeatures | UFCFeatures;

export interface SportFeaturesBundle {
  home: SportFeatures;
  away: SportFeatures;
}
