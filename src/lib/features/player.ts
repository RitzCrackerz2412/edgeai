/**
 * Player feature extractor.
 *
 * Converts raw player injury/stats data to PlayerFeatureVectors.
 * Player features are aggregated into team-level injury impact by the pipeline.
 */

import type { RawInjury, RawPlayerStats } from '../providers/types';
import type { PlayerFeatureVector } from './types';
import { clamp, minMax } from './normalize';

// ── Availability from injury status ──────────────────────────────────────────

const STATUS_AVAILABILITY: Record<RawInjury['status'], number> = {
  out: 0,
  ir: 0,
  doubtful: 0.2,
  questionable: 0.5,
  'day-to-day': 0.75,
};

// ── Position impact weights (sport-agnostic approximation) ───────────────────

// Position-to-impact mapping. Abbreviations that overlap across sports
// use a blended value (the position impact is a coarse approximation anyway).
const POSITION_IMPACT: Record<string, number> = {
  // Quarterbacks and pitchers are the single highest-impact positions
  QB: 1.0, SP: 0.65,
  // Playmakers / stars
  PG: 0.7, SG: 0.6, SF: 0.6, WR: 0.55,
  // Anchor positions
  GK: 0.65, G: 0.65,  // goalie (NHL) — slightly above soccer GK
  CAM: 0.55, PF: 0.55,
  // Mid-impact
  C: 0.50, CM: 0.50,  // center (NBA/MLB/NHL) and central midfielder
  ST: 0.50,
  RB: 0.45, TE: 0.4, SS: 0.4,
  // Role players
  LW: 0.42, RW: 0.42, OF: 0.38,
  CB: 0.38, LB: 0.35, OL: 0.35, DL: 0.35, D: 0.35, '1B': 0.35, '3B': 0.35,
  '2B': 0.30, RP: 0.30, S: 0.28,
};

function positionImpact(position: string): number {
  return POSITION_IMPACT[position.toUpperCase()] ?? 0.4;
}

// ── Feature extractor from injury record ─────────────────────────────────────

export function extractPlayerFeaturesFromInjury(injury: RawInjury): PlayerFeatureVector {
  const impact = positionImpact(injury.position);
  const availability = STATUS_AVAILABILITY[injury.status] ?? 0.5;

  return {
    playerId: injury.playerId,
    name: injury.playerName,
    position: injury.position,
    availabilityScore: availability,
    expectedParticipation: availability * impact,
    usageRate: impact,
    recentFormScore: 0.5, // unknown without stats
    injuryRiskScore: 1 - availability,
    clutchRating: 0.5,    // unknown without stats
    matchupAdvantage: 0,  // neutral default
    teamImpactScore: impact * availability,
  };
}

// ── Feature extractor from stats record ──────────────────────────────────────

export function extractPlayerFeaturesFromStats(
  stats: RawPlayerStats,
  injuryStatus?: RawInjury['status'],
): PlayerFeatureVector {
  const impact = positionImpact(stats.position);
  const availability = injuryStatus ? (STATUS_AVAILABILITY[injuryStatus] ?? 1) : 1;

  // Normalize usage rate: typically 0–35% in NBA, 0–100% in other sports
  const usageRate = clamp(stats.usageRate / 100, 0, 1);

  // Derive form score from recent vs season performance if available
  const recentScore = stats.stats['recentFormScore'] ?? 0.5;
  const recentFormScore = minMax(recentScore, 0, 1);

  return {
    playerId: stats.playerId,
    name: stats.playerName,
    position: stats.position,
    availabilityScore: availability,
    expectedParticipation: clamp(stats.minutesPerGame / 48, 0, 1), // normalized to NBA game length
    usageRate,
    recentFormScore,
    injuryRiskScore: injuryStatus ? (1 - availability) : 0,
    clutchRating: stats.stats['clutchRating'] != null
      ? clamp(stats.stats['clutchRating'] / 100, 0, 1)
      : 0.5,
    matchupAdvantage: 0,
    teamImpactScore: impact * availability,
  };
}

// ── Team-level aggregate from player list ─────────────────────────────────────

export function aggregatePlayerImpact(players: PlayerFeatureVector[]): {
  teamHealthScore: number;  // 0-1
  starPlayerAvailability: number; // 0-1, availability of top 2 players by impact
  depthScore: number;       // 0-1, breadth of contributor availability
} {
  if (players.length === 0) {
    return { teamHealthScore: 1, starPlayerAvailability: 1, depthScore: 1 };
  }

  const sorted = [...players].sort((a, b) => b.teamImpactScore - a.teamImpactScore);

  const totalImpact = sorted.reduce((s, p) => s + p.teamImpactScore, 0);
  const weightedAvail = sorted.reduce((s, p) => s + p.availabilityScore * p.teamImpactScore, 0);
  const teamHealthScore = clamp(totalImpact > 0 ? weightedAvail / totalImpact : 1, 0, 1);

  const top2 = sorted.slice(0, 2);
  const starAvail = top2.length > 0
    ? top2.reduce((s, p) => s + p.availabilityScore, 0) / top2.length
    : 1;

  const aboveAvg = players.filter(p => p.availabilityScore >= 0.7).length;
  const depthScore = clamp(aboveAvg / Math.max(5, players.length), 0, 1);

  return {
    teamHealthScore,
    starPlayerAvailability: starAvail,
    depthScore,
  };
}
