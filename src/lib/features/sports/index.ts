export { extractNFLFeatures } from './nfl';
export { extractNBAFeatures } from './nba';
export { extractMLBFeatures } from './mlb';
export { extractSoccerFeatures } from './soccer';
export type {
  SportFeatureBase,
  NFLFeatures,
  NBAFeatures,
  MLBFeatures,
  SoccerFeatures,
  UFCFeatures,
  SportFeatures,
  SportFeaturesBundle,
} from './types';

import type { Sport } from '../../types';
import type { RawTeamStats } from '../../providers/types';
import type { SportFeatures } from './types';
import { extractNFLFeatures } from './nfl';
import { extractNBAFeatures } from './nba';
import { extractMLBFeatures } from './mlb';
import { extractSoccerFeatures } from './soccer';

/** Dispatch to the correct extractor based on sport. */
export function extractSportFeatures(
  sport: Sport,
  teamId: string,
  isHome: boolean,
  raw?: RawTeamStats | null,
): SportFeatures {
  switch (sport) {
    case 'NFL':    return extractNFLFeatures(teamId, isHome, raw);
    case 'NBA':    return extractNBAFeatures(teamId, isHome, raw);
    case 'MLB':    return extractMLBFeatures(teamId, isHome, raw);
    case 'Soccer': return extractSoccerFeatures(teamId, isHome, raw);
    default:
      // UFC and NHL use defaults from base feature pipeline
      return extractNFLFeatures(teamId, isHome, undefined);
  }
}
