import type { Sport } from '../types';

// ── Team feature vector ───────────────────────────────────────────────────────

export interface TeamFeatureVector {
  teamId: string;
  sport: Sport;

  // ELO rating (absolute, e.g. 1500 = league average)
  eloRating: number;

  // Season performance (0-1, where 0.5 = league average)
  winRate: number;
  offensiveRating: number;
  defensiveRating: number;
  netRating: number;
  pace: number;               // 0-1 (relevant for NBA/soccer)

  // Recent form (last 5-10 games)
  recentForm: number;         // win rate, 0-1
  streakValue: number;        // -1 (5L) to +1 (5W)
  momentumScore: number;      // exponentially weighted, 0-1

  // Game context
  isHome: boolean;
  restDays: number;           // days since last game (capped at 14)
  restFatigue: number;        // 0-1 penalty (1 = rested, <1 = fatigued)
  travelDistanceKm: number;   // km traveled (0 for home team)
  travelFatigue: number;      // 0-1 fatigue from travel
  timezoneDeltaHours: number; // eastward = positive (jet lag direction)

  // Schedule context
  strengthOfSchedule: number; // 0-1, average opponent ELO quantile
  injuryImpact: number;       // 0-1 (1 = fully healthy, lower = missing players)

  // Venue-specific history
  h2hWinRate: number;         // 0-1 vs this specific opponent
  venueWinRate: number;       // 0-1 at this specific venue
}

// ── Player feature vector ─────────────────────────────────────────────────────

export interface PlayerFeatureVector {
  playerId: string;
  name: string;
  position: string;
  availabilityScore: number;  // 1=healthy, 0.5=questionable, 0.2=doubtful, 0=out
  expectedParticipation: number; // 0-1 expected contribution level
  usageRate: number;          // 0-1
  recentFormScore: number;    // 0-1, vs season average
  injuryRiskScore: number;    // 0-1 (1 = highest risk)
  clutchRating: number;       // 0-1, late-game performance
  matchupAdvantage: number;   // -1 to +1 vs primary opponent
  teamImpactScore: number;    // 0-1, importance to team outcome
}

// ── Environment feature vector ────────────────────────────────────────────────

export interface EnvironmentFeatureVector {
  venueId: string;
  altitudeFeet: number;
  altitudeDeltaFeet: number;  // how much higher than away team's home venue
  isIndoor: boolean;

  // Weather (0 for indoor venues)
  temperatureFahrenheit: number;
  windSpeedMph: number;
  precipitationMm: number;
  weatherScore: number;       // 0-1 (1 = ideal, 0 = extreme)

  // Crowd
  crowdAdvantage: number;     // 0-1 home crowd effect

  // Away team travel context
  awayTravelKm: number;
  awayTimezoneDelta: number;  // hours shifted (east→west = positive)
}

// ── Derived difference features (used directly by models) ────────────────────

export interface DerivedFeatures {
  eloDiff: number;            // homeElo - awayElo
  eloDiffNormalized: number;  // eloDiff / 400 (sigmoid-scale)
  formDiff: number;           // homeForm - awayForm, -1 to +1
  injuryAdvantage: number;    // homeInjury - awayInjury, positive = home healthier
  restAdvantage: number;      // homeRestDays - awayRestDays
  offRatingDiff: number;      // (homeOff - awayOff) / 20 (normalized)
  defRatingDiff: number;      // (awayDef - homeDef) / 20 (positive = home better defense)
  overallStrengthDiff: number; // composite team strength difference, -1 to +1
}

// ── Feature metadata ─────────────────────────────────────────────────────────

export interface FeatureMeta {
  gameId: string;
  generatedAt: string;          // ISO 8601
  dataFreshnessSeconds: number; // age of the oldest underlying data point
  missingFields: string[];      // fields that fell back to defaults
  qualityScore: number;         // 0-1, overall confidence in feature quality
}

// ── Assembled game feature vector ────────────────────────────────────────────

export interface GameFeatureVector {
  meta: FeatureMeta;
  home: TeamFeatureVector;
  away: TeamFeatureVector;
  homePlayers: PlayerFeatureVector[];
  awayPlayers: PlayerFeatureVector[];
  environment: EnvironmentFeatureVector;
  derived: DerivedFeatures;
}
