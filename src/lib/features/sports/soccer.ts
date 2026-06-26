import { clamp } from '../normalize';
import type { SoccerFeatures } from './types';
import type { RawTeamStats } from '../../providers/types';
import type { Sport } from '../../types';

const SPORT: Sport = 'Soccer';

export function extractSoccerFeatures(
  teamId: string,
  isHome: boolean,
  raw?: RawTeamStats | null,
): SoccerFeatures {
  if (!raw?.extras) {
    return defaults(teamId, isHome);
  }

  const s = raw.extras;

  // xG per 90: 0.8 = poor, 1.3 = avg, 2.0 = elite
  const xgPerGame = clamp((s['xg_per_90'] ?? 1.3 - 0.8) / (2.0 - 0.8), 0, 1);

  // xA per 90: 0.5 = poor, 0.9 = avg, 1.5 = elite
  const xaPerGame = clamp((s['xa_per_90'] ?? 0.9 - 0.5) / (1.5 - 0.5), 0, 1);

  // Shots on target per 90: 3 = poor, 5 = avg, 8 = elite
  const shotsOnTarget = clamp((s['shots_on_target_per_90'] ?? 5 - 3) / (8 - 3), 0, 1);

  // Set piece xG per game: 0.1 = poor, 0.3 = avg, 0.6 = elite
  const setPieceEfficiency = clamp((s['set_piece_xg'] ?? 0.3 - 0.1) / (0.6 - 0.1), 0, 1);

  // xGA per 90: lower = better → inverted; 2.0 = poor, 1.3 = avg, 0.7 = elite
  const xgaPerGame = clamp(1 - (s['xga_per_90'] ?? 1.3 - 0.7) / (2.0 - 0.7), 0, 1);

  // Defensive errors leading to shots: 0 = elite, 3+ per game = poor → inverted
  const defensiveErrors = clamp(1 - (s['def_errors'] ?? 1) / 4, 0, 1);

  // Possession %: as fraction
  const possession = clamp(s['possession_pct'] ?? 0.5, 0.30, 0.70) / 0.70;

  // PPDA (passes allowed per defensive action): 5 = high press, 15 = low press → inverted
  const ppda = s['ppda'] ?? 10;
  const pressingIntensity = clamp(1 - (ppda - 5) / (15 - 5), 0, 1);

  // xG differential per game
  const xgDiffRaw = (s['xg_per_90'] ?? 1.3) - (s['xga_per_90'] ?? 1.3);
  const xgDiff = clamp((xgDiffRaw + 1) / 2, 0, 1);

  return {
    teamId, sport: SPORT, isHome, dataQuality: 1.0,
    xgPerGame,
    xaPerGame,
    shotsOnTarget,
    setPieceEfficiency,
    xgaPerGame,
    defensiveErrors,
    possession,
    pressingIntensity,
    xgDiff,
  };
}

function defaults(teamId: string, isHome: boolean): SoccerFeatures {
  return {
    teamId, sport: SPORT, isHome, dataQuality: 0,
    xgPerGame: 0.5,
    xaPerGame: 0.5,
    shotsOnTarget: 0.5,
    setPieceEfficiency: 0.5,
    xgaPerGame: 0.5,
    defensiveErrors: 0.5,
    possession: 0.5,
    pressingIntensity: 0.5,
    xgDiff: 0.5,
  };
}
