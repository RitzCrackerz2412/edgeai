import { clamp } from '../normalize';
import type { NBAFeatures } from './types';
import type { RawTeamStats } from '../../providers/types';
import type { Sport } from '../../types';

const SPORT: Sport = 'NBA';

export function extractNBAFeatures(
  teamId: string,
  isHome: boolean,
  raw?: RawTeamStats | null,
): NBAFeatures {
  if (!raw?.extras) {
    return defaults(teamId, isHome);
  }

  const s = raw.extras;

  // TS%: league avg ≈ 57%, elite ≈ 62%, poor ≈ 52%
  const trueShootingPct = clamp((s['ts_pct'] ?? 0.57 - 0.52) / (0.62 - 0.52), 0, 1);

  // eFG%: league avg ≈ 53%, elite ≈ 58%
  const effectiveFGPct = clamp((s['efg_pct'] ?? 0.53 - 0.48) / (0.58 - 0.48), 0, 1);

  // Assist ratio (per 100 poss): avg ≈ 18, elite ≈ 24
  const assistRatio = clamp((s['assist_ratio'] ?? 18 - 12) / (24 - 12), 0, 1);

  // Rebounding %: total reb %, avg ≈ 50, elite ≈ 55, poor ≈ 45
  const reboundingPct = clamp((s['reb_pct'] ?? 50 - 45) / (55 - 45), 0, 1);

  // TOV per 100 poss: avg ≈ 13, poor ≈ 17, elite ≈ 10 → inverted
  const tovRaw = s['tov_per_100'] ?? 13;
  const turnoversPerPoss = clamp(1 - (tovRaw - 10) / (17 - 10), 0, 1);

  // Clutch net rating: ±15 is extreme
  const clutchNR = s['clutch_net_rating'] ?? 0;
  const clutchRating = clamp((clutchNR + 15) / 30, 0, 1);

  // Best 5-man lineup net rating: +30 is elite, -20 is poor
  const lineupNR = s['lineup_net_rating'] ?? 0;
  const lineupNetRating = clamp((lineupNR + 20) / 50, 0, 1);

  // Pace-adjusted ratings: off 100-125, def 100-125 (inverted for def)
  const paceAdjustedOffRtg = clamp((s['off_rtg'] ?? 112 - 100) / 25, 0, 1);
  const paceAdjustedDefRtg = clamp(1 - (s['def_rtg'] ?? 112 - 100) / 25, 0, 1);

  return {
    teamId, sport: SPORT, isHome, dataQuality: 1.0,
    trueShootingPct,
    effectiveFGPct,
    assistRatio,
    reboundingPct,
    turnoversPerPoss,
    clutchRating,
    lineupNetRating,
    paceAdjustedOffRtg,
    paceAdjustedDefRtg,
  };
}

function defaults(teamId: string, isHome: boolean): NBAFeatures {
  return {
    teamId, sport: SPORT, isHome, dataQuality: 0,
    trueShootingPct: 0.5,
    effectiveFGPct: 0.5,
    assistRatio: 0.5,
    reboundingPct: 0.5,
    turnoversPerPoss: 0.5,
    clutchRating: 0.5,
    lineupNetRating: 0.5,
    paceAdjustedOffRtg: 0.5,
    paceAdjustedDefRtg: 0.5,
  };
}
