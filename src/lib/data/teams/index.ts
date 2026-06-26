import type { Team } from '../../types';
import { NFL_TEAMS }          from './nfl';
import { NBA_TEAMS }          from './nba';
import { MLB_TEAMS }          from './mlb';
import { NHL_TEAMS }          from './nhl';
import { SOCCER_TEAMS }       from './soccer';
import { WC_TEAMS, COPA_TEAMS, EURO_TEAMS } from './international';
import { F1_DRIVERS, UFC_FIGHTERS, ATP_PLAYERS, WTA_PLAYERS, NCAAF_TEAMS, NCAAB_TEAMS } from './other';

// Single flat map of every team / player / driver by ID
export const TEAM_MAP: Record<string, Team> = {
  ...NFL_TEAMS,
  ...NBA_TEAMS,
  ...MLB_TEAMS,
  ...NHL_TEAMS,
  ...SOCCER_TEAMS,
  ...WC_TEAMS,
  ...COPA_TEAMS,
  ...EURO_TEAMS,
  ...F1_DRIVERS,
  ...UFC_FIGHTERS,
  ...ATP_PLAYERS,
  ...WTA_PLAYERS,
  ...NCAAF_TEAMS,
  ...NCAAB_TEAMS,
};

export const ALL_TEAMS: Team[] = Object.values(TEAM_MAP);

export function getTeamById(id: string): Team | undefined {
  return TEAM_MAP[id];
}

export function getTeamsByLeague(leagueId: string): Team[] {
  return ALL_TEAMS.filter(t => t.league.toLowerCase() === leagueId.toLowerCase());
}

export function getTeamsBySport(sport: string): Team[] {
  return ALL_TEAMS.filter(t => t.sport === sport);
}

// Named re-exports for consumers that want per-sport arrays
export { NFL_TEAMS, NBA_TEAMS, MLB_TEAMS, NHL_TEAMS, SOCCER_TEAMS };
export { WC_TEAMS, COPA_TEAMS, EURO_TEAMS };
export { F1_DRIVERS, UFC_FIGHTERS, ATP_PLAYERS, WTA_PLAYERS, NCAAF_TEAMS, NCAAB_TEAMS };
