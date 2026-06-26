import { clamp } from '../normalize';
import type { NFLFeatures } from './types';
import type { RawTeamStats } from '../../providers/types';
import type { Sport } from '../../types';

const SPORT: Sport = 'NFL';

/**
 * Extract NFL-specific advanced features from raw stats or reasonable defaults.
 *
 * Normalization targets: all output values in [0,1] unless noted.
 * League averages used as anchors when data is sparse.
 */
export function extractNFLFeatures(
  teamId: string,
  isHome: boolean,
  raw?: RawTeamStats | null,
): NFLFeatures {
  if (!raw?.extras) {
    return defaults(teamId, isHome);
  }

  const s = raw.extras;

  // EPA/play: league avg ≈ 0.0, elite ≈ +0.15, poor ≈ -0.15 → normalize to [0,1]
  const epaPplay = s['epa_per_play'] ?? 0;
  const epaNorm = clamp((epaPplay + 0.15) / 0.30, 0, 1);

  // Success rate: league avg ≈ 44%, elite ≈ 52%, poor ≈ 36%
  const successRate = clamp((s['success_rate'] ?? 0.44 - 0.36) / (0.52 - 0.36), 0, 1);

  // DVOA: league avg = 0%, elite ≈ +25%, poor ≈ -25% → normalize
  const dvoa = s['dvoa'] ?? 0;
  const dvoaNorm = clamp((dvoa + 25) / 50, 0, 1);

  // Explosive play rate: <10% is poor, 15%+ is elite
  const explosivePlayRate = clamp((s['explosive_play_rate'] ?? 0.12 - 0.10) / 0.10, 0, 1);

  // Red zone TD%: league avg ≈ 56%, elite ≈ 68%, poor ≈ 44%
  const redZoneEfficiency = clamp((s['red_zone_td_pct'] ?? 0.56 - 0.44) / (0.68 - 0.44), 0, 1);

  // Third down: league avg ≈ 39%, elite ≈ 48%, poor ≈ 30%
  const thirdDownConversion = clamp((s['third_down_pct'] ?? 0.39 - 0.30) / (0.48 - 0.30), 0, 1);

  // Pressure rate generated (defense): avg ≈ 25%, elite ≈ 37%
  const pressureRate = clamp((s['pressure_rate'] ?? 0.25 - 0.18) / (0.37 - 0.18), 0, 1);

  // Sack rate: avg ≈ 6%, elite ≈ 9%
  const sackRate = clamp((s['sack_rate'] ?? 0.06 - 0.03) / (0.09 - 0.03), 0, 1);

  // Turnover differential: ±3 per game is extreme
  const toDiff = s['turnover_diff'] ?? 0;

  // ST rating: DVOA scale, same normalization
  const stDvoa = s['st_dvoa'] ?? 0;
  const specialTeamsRating = clamp((stDvoa + 5) / 10, 0, 1);

  const dataQuality = raw ? 1.0 : 0.5;

  return {
    teamId, sport: SPORT, isHome, dataQuality,
    epaPplay: epaNorm,
    successRate,
    dvoa: dvoaNorm,
    explosivePlayRate,
    redZoneEfficiency,
    thirdDownConversion,
    pressureRate,
    sackRate,
    turnoverDifferential: toDiff,
    specialTeamsRating,
  };
}

function defaults(teamId: string, isHome: boolean): NFLFeatures {
  return {
    teamId, sport: SPORT, isHome, dataQuality: 0,
    epaPplay: 0.5,
    successRate: 0.5,
    dvoa: 0.5,
    explosivePlayRate: 0.5,
    redZoneEfficiency: 0.5,
    thirdDownConversion: 0.5,
    pressureRate: 0.5,
    sackRate: 0.5,
    turnoverDifferential: 0,
    specialTeamsRating: 0.5,
  };
}
