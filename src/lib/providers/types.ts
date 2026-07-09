import type { Sport } from '../types';

// ── Raw types (normalized from any external API) ─────────────────────────────

export interface RawGame {
  id: string;
  sport: Sport;
  league: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  scheduledAt: string;        // ISO 8601
  venue: string;
  venueId: string;
  venueCity: string;
  venueState: string;
  venueCountry: string;
  status: 'scheduled' | 'inprogress' | 'closed' | 'postponed' | 'cancelled';
  period?: number;
  clock?: string;
  homeScore?: number;
  awayScore?: number;
  /** Consensus odds attached by an odds provider, if available */
  odds?: RawOdds;
  /** Top stat performers per team, extracted from ESPN summary leaders */
  leaders?: RawPlayerLeader[];
}

export interface RawPlayerLeader {
  teamName: string;
  playerName: string;
  category: string;
  value: number;
}

export interface RawTeamStats {
  teamId: string;
  teamName: string;
  season: string;
  league: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  winPct: number;
  pointsPerGame: number;
  pointsAllowedPerGame: number;
  netRating: number;
  offensiveRating: number;
  defensiveRating: number;
  homeWins: number;
  homeLosses: number;
  awayWins: number;
  awayLosses: number;
  last10: ('W' | 'L')[];
  // Sport-specific extended stats
  extras: Record<string, number>;
}

export interface RawInjury {
  playerId: string;
  playerName: string;
  teamId: string;
  position: string;
  status: 'questionable' | 'doubtful' | 'out' | 'day-to-day' | 'ir';
  description: string;
  impactLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  updatedAt: string;
}

export interface RawPlayerStats {
  playerId: string;
  playerName: string;
  teamId: string;
  position: string;
  gamesPlayed: number;
  minutesPerGame: number;
  usageRate: number;
  // Core performance stats (normalized for cross-sport comparison where possible)
  stats: Record<string, number>;
}

export interface RawOdds {
  gameId: string;
  bookmaker: string;
  homeMoneyline: number;      // American odds, e.g. -180
  awayMoneyline: number;
  drawMoneyline?: number;
  homeSpread: number;         // e.g. -3.5
  awaySpread: number;
  homeSpreadOdds: number;
  awaySpreadOdds: number;
  overUnder: number;
  overOdds: number;
  underOdds: number;
  openingHomeMoneyline?: number;
  publicBettingPctHome?: number;
  updatedAt: string;
}

export interface RawWeather {
  venueId: string;
  temperature: number;        // Fahrenheit
  feelsLike: number;
  humidity: number;           // 0-100
  windSpeed: number;          // mph
  windDirection: number;      // degrees
  precipitationMm: number;
  condition: string;
  isIndoor: boolean;
  fetchedAt: string;
}

export interface RawVenue {
  id: string;
  name: string;
  city: string;
  state: string;
  country: string;
  capacity: number;
  isIndoor: boolean;
  roofType: 'open' | 'retractable' | 'fixed_dome' | 'none';
  altitudeFeet: number;
  latitude: number;
  longitude: number;
}

// ── Provider interfaces ───────────────────────────────────────────────────────

export interface SportsDataProvider {
  readonly name: string;
  getGames(sport: Sport, date: string): Promise<RawGame[]>;
  getTeamStats(teamId: string, season?: string): Promise<RawTeamStats | null>;
  getInjuries(teamId: string): Promise<RawInjury[]>;
  getPlayerStats(playerId: string, season?: string): Promise<RawPlayerStats | null>;
  getVenue(venueId: string): Promise<RawVenue | null>;
}

export interface OddsProvider {
  readonly name: string;
  getOdds(sport: Sport, gameId: string): Promise<RawOdds[]>;
  getConsensusOdds(sport: Sport, gameId: string): Promise<RawOdds | null>;
  findGameOdds(sport: Sport, homeTeam: string, awayTeam: string, league?: string): Promise<RawOdds | null>;
}

export interface WeatherProvider {
  readonly name: string;
  getVenueWeather(venueId: string, gameTime: string): Promise<RawWeather | null>;
}

export interface DataProviders {
  sports: SportsDataProvider;
  odds: OddsProvider;
  weather: WeatherProvider;
}
