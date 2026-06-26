/**
 * Team feature extractor.
 *
 * Converts a raw Team record (from types.ts) + contextual data into
 * a normalized TeamFeatureVector suitable for all prediction models.
 */

import type { Team, Sport } from '../types';
import type { RawTeamStats, RawInjury } from '../providers/types';
import type { TeamFeatureVector } from './types';
import {
  winRateFromRecord,
  momentumFromSequence,
  streakValue,
  restFatigueScore,
  travelFatigueScore,
  minMax,
  clamp,
  injuryImpactScore,
} from './normalize';

// ── Sport-specific normalization ranges ───────────────────────────────────────
//
// Each sport has different scales for offensive/defensive ratings.
// These ranges define the min/max for min-max normalization → [0,1].

interface SportRatingRange {
  offMin: number; offMax: number;
  defMin: number; defMax: number;
  homeAdvElo: number; // ELO points for home field
}

const SPORT_RANGES: Record<string, SportRatingRange> = {
  NFL:                { offMin: 14, offMax: 32,  defMin: 14, defMax: 32,  homeAdvElo: 65  },
  NBA:                { offMin: 100, offMax: 125, defMin: 100, defMax: 125, homeAdvElo: 100 },
  MLB:                { offMin: 2.5, offMax: 7,   defMin: 2.5, defMax: 7,  homeAdvElo: 25  },
  NHL:                { offMin: 2.0, offMax: 4.5, defMin: 2.0, defMax: 4.5, homeAdvElo: 60  },
  Soccer:             { offMin: 0.5, offMax: 3.5, defMin: 0.5, defMax: 3.5, homeAdvElo: 90  },
  'NCAA Football':    { offMin: 14, offMax: 45,  defMin: 14, defMax: 45,  homeAdvElo: 70  },
  'NCAA Basketball':  { offMin: 60, offMax: 90,  defMin: 60, defMax: 90,  homeAdvElo: 100 },
  UFC:                { offMin: 0,  offMax: 100, defMin: 0,  defMax: 100, homeAdvElo: 0   },
  default:            { offMin: 0,  offMax: 100, defMin: 0,  defMax: 100, homeAdvElo: 50  },
};

function getRange(sport: Sport): SportRatingRange {
  return SPORT_RANGES[sport] ?? SPORT_RANGES.default;
}

// ── Injury impact calculation ─────────────────────────────────────────────────

const INJURY_IMPACT_LEVEL: Record<string, number> = {
  Critical: 1.0,
  High: 0.6,
  Medium: 0.35,
  Low: 0.15,
};

const INJURY_AVAILABILITY: Record<RawInjury['status'], number> = {
  out: 0,
  ir: 0,
  doubtful: 0.2,
  questionable: 0.5,
  'day-to-day': 0.7,
};

function computeInjuryImpact(injuries: RawInjury[]): number {
  if (injuries.length === 0) return 1;

  const players = injuries.map(inj => ({
    availability: INJURY_AVAILABILITY[inj.status] ?? 0.5,
    teamImpact: INJURY_IMPACT_LEVEL[inj.impactLevel] ?? 0.35,
  }));

  return injuryImpactScore(players);
}

// ── Main extractor ────────────────────────────────────────────────────────────

export interface TeamContextInput {
  restDays: number;           // days since last game
  isHome: boolean;
  travelDistanceKm: number;   // 0 for home team
  timezoneDeltaHours: number; // hours shifted; positive = travelling east→west
  opponentElo: number;        // for h2h win rate approximation
}

export function extractTeamFeatures(
  team: Team,
  context: TeamContextInput,
  rawStats?: RawTeamStats | null,
  injuries?: RawInjury[],
  h2hWinRate = 0.5,
  venueWinRate?: number,
): TeamFeatureVector {
  const sport = team.sport;
  const range = getRange(sport);

  // ── Ratings ────────────────────────────────────────────────────────────────
  const offRtg = minMax(team.offensiveRating, range.offMin, range.offMax);
  const defRtg = minMax(team.defensiveRating, range.defMin, range.defMax);

  // For defensive ratings, lower raw value = better defense. After min-max
  // normalization a "higher is better" bias may not hold — sports differ.
  // We invert so 1.0 = best possible defense.
  const defNorm = sport === 'NFL' || sport === 'NBA'
    ? 1 - defRtg  // lower points allowed = better
    : defRtg;     // for some sports the raw rating is already "higher is better"

  const netRtg = clamp((offRtg + defNorm) / 2, 0, 1);

  // ── Win rate ───────────────────────────────────────────────────────────────
  const winRate = rawStats
    ? rawStats.winPct
    : winRateFromRecord(team.record);

  const homeWinRate = rawStats
    ? (rawStats.homeWins / Math.max(1, rawStats.homeWins + rawStats.homeLosses))
    : winRateFromRecord(team.homeRecord);

  const awayWinRate = rawStats
    ? (rawStats.awayWins / Math.max(1, rawStats.awayWins + rawStats.awayLosses))
    : winRateFromRecord(team.awayRecord);

  // ── Form & momentum ────────────────────────────────────────────────────────
  const recentForm = team.last5.filter(r => r === 'W').length / Math.max(1, team.last5.length);
  const momentum   = momentumFromSequence(team.last5);
  const streak     = streakValue(team.last5);

  // ── Fatigue ────────────────────────────────────────────────────────────────
  const restDays     = clamp(context.restDays, 0, 14);
  const restFatigue  = restFatigueScore(restDays);
  const travelKm     = context.isHome ? 0 : clamp(context.travelDistanceKm, 0, 15_000);
  const travelFatigue = travelFatigueScore(travelKm);

  // ── Injury impact ──────────────────────────────────────────────────────────
  const injuryImpact = injuries
    ? computeInjuryImpact(injuries)
    : clamp(1 - team.injuries.filter(i => i.impact === 'Critical' || i.impact === 'High').length * 0.12, 0, 1);

  // ── Venue win rate ─────────────────────────────────────────────────────────
  const resolvedVenueWinRate = venueWinRate ?? (context.isHome ? homeWinRate : awayWinRate);

  return {
    teamId: team.id,
    sport,
    eloRating: team.eloRating,
    winRate,
    offensiveRating: offRtg,
    defensiveRating: defNorm,
    netRating: netRtg,
    pace: minMax(team.momentum, 0, 100), // momentum repurposed as pace proxy
    recentForm,
    streakValue: streak,
    momentumScore: momentum,
    isHome: context.isHome,
    restDays,
    restFatigue,
    travelDistanceKm: travelKm,
    travelFatigue,
    timezoneDeltaHours: context.timezoneDeltaHours,
    strengthOfSchedule: minMax(team.powerRanking, 1, 30),
    injuryImpact,
    h2hWinRate,
    venueWinRate: resolvedVenueWinRate,
  };
}
