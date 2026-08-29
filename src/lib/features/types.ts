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

  // ── Contextual adjustments (all expressed as home-team win-prob delta) ──────
  /** Rivalry intensity + revenge game + playoff pressure + primetime. ±0.03 */
  psychologyMod: number;
  /** Referee/official home-call bias for this sport/crew. Typically +0.005–+0.02 */
  officiatingBias: number;
  /** Late warmup scratches or day-of lineup changes. ±0.15 */
  lateInjuryDelta: number;
  /** Trade or signing within 24 h of tip-off — integration disruption. ±0.05 */
  rosterMoveDelta: number;
}

// ── Psychology context ────────────────────────────────────────────────────────

export interface PsychologyContext {
  /** 0–1; 1 = well-documented divisional/historic rivalry */
  rivalryIntensity: number;
  /** 0–1; both teams fighting for playoff spots */
  playoffPressure: number;
  /** −1 to +1; positive = home team seeking revenge for recent lopsided loss */
  revengeFactorHome: number;
  /** true when nationally televised prime-time slot */
  isPrimetime: boolean;
  /** Combined probability delta for home team */
  mod: number;
}

// ── Officiating context ───────────────────────────────────────────────────────

export interface OfficiatingContext {
  /** Known home-call bias for this sport (published research values) */
  sportBaselineBias: number;
  /** Crew-specific adjustment when referee IDs are available (0 = unknown) */
  crewBias: number;
  /** High-foul-tendency crews disadvantage teams that drive to the basket */
  foulTendency: number;
  /** Combined probability delta for home team */
  bias: number;
}

// ── Late-breaking move signals ────────────────────────────────────────────────

export interface LateMoveSignal {
  /** True if any injury was reported < 2 h before scheduled tip-off */
  hasWarmupScratch: boolean;
  /** True if any roster move was reported < 24 h before tip-off */
  hasLastMinuteMove: boolean;
  /** Probability delta for home team from late home injuries (≤ 0) */
  homeLateScratchDelta: number;
  /** Probability delta for away team from late away injuries (≤ 0) */
  awayLateScratchDelta: number;
  /** Probability delta for home team from 24-h trade/signing disruption */
  homeRosterMoveDelta: number;
  /** Probability delta for away team from 24-h trade/signing disruption */
  awayRosterMoveDelta: number;
  /** Net home-team delta: awayPenalties − homePenalties */
  netHomeInjuryDelta: number;
  /** Net home-team delta from roster moves */
  netHomeRosterDelta: number;
}

// ── Assembled context signals ─────────────────────────────────────────────────

export interface GameContextSignals {
  psychology: PsychologyContext;
  officiating: OfficiatingContext;
  lateMoves: LateMoveSignal;
}

// ── Feature metadata ─────────────────────────────────────────────────────────

export interface FeatureMeta {
  gameId: string;
  sport: string;                // sport key, drives per-sport model weighting
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
  /** Psychology, officiating, and late-move signals */
  gameContext: GameContextSignals;
  /**
   * Vig-free market-implied home win probability (0–1), when odds data is
   * available. One input among many — statistical models stay primary;
   * the ensemble blends it at low weight in logit space.
   */
  marketImpliedHomeProb?: number;
}
