import { clamp } from '../normalize';
import type { MLBFeatures } from './types';
import type { RawTeamStats } from '../../providers/types';
import type { Sport } from '../../types';

const SPORT: Sport = 'MLB';

export function extractMLBFeatures(
  teamId: string,
  isHome: boolean,
  raw?: RawTeamStats | null,
): MLBFeatures {
  if (!raw?.extras) {
    return defaults(teamId, isHome);
  }

  const s = raw.extras;

  // wRC+: 100 = league avg, 140+ = elite, 70- = poor
  const wrcPlus = clamp((s['wrc_plus'] ?? 100 - 70) / (140 - 70), 0, 1);

  // OPS: 0.700 = avg, 0.850 = elite, 0.600 = poor
  const ops = clamp((s['ops'] ?? 0.700 - 0.600) / (0.850 - 0.600), 0, 1);

  // BABIP: .300 = neutral, extremes can indicate luck (0.25-0.35 range)
  const babip = clamp((s['babip'] ?? 0.300 - 0.250) / (0.350 - 0.250), 0, 1);

  // FIP: 3.5 = avg, 2.8 = elite, 4.5 = poor → inverted
  const fip = clamp(1 - (s['fip'] ?? 3.5 - 2.5) / (4.8 - 2.5), 0, 1);

  // xFIP: same scale, inverted
  const xfip = clamp(1 - (s['xfip'] ?? 3.5 - 2.5) / (4.8 - 2.5), 0, 1);

  // Starter quality via ERA+: 100 = avg, 150 = elite, 60 = poor
  const startingPitcherQuality = clamp((s['era_plus'] ?? 100 - 60) / (150 - 60), 0, 1);

  // Bullpen ERA-: 100 = avg, 70 = elite, 130 = poor → inverted
  const bullpenRating = clamp(1 - (s['bullpen_era_minus'] ?? 100 - 70) / (130 - 70), 0, 1);

  // Park factor: 0.85-1.15 is typical range; 1.0 = neutral
  const parkFactor = s['park_factor'] ?? 1.0;

  // Platoon advantage: -1 to +1 from raw
  const platoonsAdvantage = clamp(s['platoon_advantage'] ?? 0, -1, 1);

  return {
    teamId, sport: SPORT, isHome, dataQuality: 1.0,
    wrcPlus,
    ops,
    babip,
    fip,
    xfip,
    startingPitcherQuality,
    bullpenRating,
    parkFactor,
    platoonsAdvantage,
  };
}

function defaults(teamId: string, isHome: boolean): MLBFeatures {
  return {
    teamId, sport: SPORT, isHome, dataQuality: 0,
    wrcPlus: 0.5,
    ops: 0.5,
    babip: 0.5,
    fip: 0.5,
    xfip: 0.5,
    startingPitcherQuality: 0.5,
    bullpenRating: 0.5,
    parkFactor: 1.0,
    platoonsAdvantage: 0,
  };
}
