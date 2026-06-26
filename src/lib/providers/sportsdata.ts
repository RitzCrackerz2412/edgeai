/**
 * SportsDataIO adapter — US sports (NFL, NBA, MLB, NHL, NCAA).
 *
 * Requires SPORTS_DATA_IO_API_KEY in .env.local — sign up at https://sportsdata.io/
 * Free tier covers NFL, NBA, MLB, NHL with limited requests/day.
 */

import { apiFetch, ProviderError } from './client';
import type {
  RawGame, RawTeamStats, RawInjury, RawPlayerStats, RawVenue,
  SportsDataProvider,
} from './types';
import type { Sport } from '../types';

const BASE = 'https://api.sportsdata.io/v3';
const KEY = process.env.SPORTS_DATA_IO_API_KEY ?? '';

// SportsDataIO uses different sub-paths for each sport
const SPORT_PATH: Partial<Record<Sport, string>> = {
  NFL: 'nfl',
  NBA: 'nba',
  MLB: 'mlb',
  NHL: 'nhl',
  'NCAA Football': 'cfb',
  'NCAA Basketball': 'cbb',
};

function url(sport: Sport, path: string): string {
  const sp = SPORT_PATH[sport];
  if (!sp) throw new ProviderError(`SportsDataIO: unsupported sport "${sport}"`);
  return `${BASE}/${sp}/json/${path}?key=${KEY}`;
}

// ── Raw SportsDataIO response shapes ─────────────────────────────────────────

interface SDIOGame {
  GameKey: string;
  Date: string;
  AwayTeamID: number;
  HomeTeamID: number;
  AwayTeam: string;
  HomeTeam: string;
  Stadium?: string;
  Status: string;
  AwayScore?: number;
  HomeScore?: number;
  Quarter?: number;
  TimeRemainingMinutes?: number;
  TimeRemainingSeconds?: number;
}

interface SDIOTeamStats {
  TeamID: number;
  Key: string;
  Season: number;
  Wins: number;
  Losses: number;
  Ties?: number;
  PointsPerGameOffense?: number;
  PointsPerGameDefense?: number;
  HomeWins?: number;
  HomeLosses?: number;
  AwayWins?: number;
  AwayLosses?: number;
}

interface SDIOInjury {
  PlayerID: number;
  Name: string;
  Team: string;
  Position: string;
  InjuryStatus: string;
  InjuryBodyPart: string;
  InjuryNotes: string;
  Updated: string;
}

// ── Normalization helpers ────────────────────────────────────────────────────

function normStatus(s: string): RawGame['status'] {
  switch (s.toLowerCase()) {
    case 'scheduled': return 'scheduled';
    case 'inprogress': case 'in progress': return 'inprogress';
    case 'final': case 'f': case 'f/ot': case 'f/so': return 'closed';
    case 'postponed': return 'postponed';
    case 'cancelled': case 'canceled': return 'cancelled';
    default: return 'scheduled';
  }
}

function injuryStatus(s: string): RawInjury['status'] {
  switch (s.toLowerCase()) {
    case 'out': return 'out';
    case 'doubtful': return 'doubtful';
    case 'questionable': return 'questionable';
    case 'ir': case 'injured reserve': return 'ir';
    default: return 'day-to-day';
  }
}

// ── Adapter implementation ────────────────────────────────────────────────────

export class SportsDataIOProvider implements SportsDataProvider {
  readonly name = 'SportsDataIO';

  async getGames(sport: Sport, date: string): Promise<RawGame[]> {
    if (!KEY) {
      console.warn('[SportsDataIO] No API key configured — returning empty games list');
      return [];
    }
    // Format: YYYY-MMM-DD (e.g. 2026-JUN-28)
    const formatted = new Date(date).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: '2-digit',
    }).replace(/\//g, '-');

    const raw = await apiFetch<SDIOGame[]>(
      url(sport, `GamesByDate/${formatted}`),
      { rateLimitKey: 'sportsdata' },
    );

    return raw.map(g => ({
      id: g.GameKey,
      sport,
      league: sport,
      homeTeamId: String(g.HomeTeamID),
      awayTeamId: String(g.AwayTeamID),
      homeTeamName: g.HomeTeam,
      awayTeamName: g.AwayTeam,
      scheduledAt: g.Date,
      venue: g.Stadium ?? 'Unknown',
      venueId: g.Stadium ?? 'unknown',
      venueCity: '',
      venueState: '',
      venueCountry: 'USA',
      status: normStatus(g.Status),
      period: g.Quarter,
      homeScore: g.HomeScore,
      awayScore: g.AwayScore,
    }));
  }

  async getTeamStats(teamId: string, season = '2026'): Promise<RawTeamStats | null> {
    if (!KEY) return null;

    // SportsDataIO standings endpoint returns all teams — find by ID
    const raw = await apiFetch<SDIOTeamStats[]>(
      url('NFL', `TeamSeasonStats/${season}`),
      { rateLimitKey: 'sportsdata' },
    );

    const team = raw.find(t => String(t.TeamID) === teamId || t.Key === teamId);
    if (!team) return null;

    return {
      teamId,
      teamName: team.Key,
      season: String(team.Season),
      league: 'NFL',
      gamesPlayed: team.Wins + team.Losses + (team.Ties ?? 0),
      wins: team.Wins,
      losses: team.Losses,
      draws: team.Ties ?? 0,
      winPct: team.Wins / Math.max(1, team.Wins + team.Losses),
      pointsPerGame: team.PointsPerGameOffense ?? 0,
      pointsAllowedPerGame: team.PointsPerGameDefense ?? 0,
      netRating: (team.PointsPerGameOffense ?? 0) - (team.PointsPerGameDefense ?? 0),
      offensiveRating: team.PointsPerGameOffense ?? 0,
      defensiveRating: team.PointsPerGameDefense ?? 0,
      homeWins: team.HomeWins ?? 0,
      homeLosses: team.HomeLosses ?? 0,
      awayWins: team.AwayWins ?? 0,
      awayLosses: team.AwayLosses ?? 0,
      last10: [],
      extras: {},
    };
  }

  async getInjuries(teamId: string): Promise<RawInjury[]> {
    if (!KEY) return [];

    const raw = await apiFetch<SDIOInjury[]>(
      url('NFL', `InjuriesByTeam/${teamId}`),
      { rateLimitKey: 'sportsdata' },
    );

    return raw.map(i => ({
      playerId: String(i.PlayerID),
      playerName: i.Name,
      teamId,
      position: i.Position,
      status: injuryStatus(i.InjuryStatus),
      description: `${i.InjuryBodyPart}: ${i.InjuryNotes}`,
      impactLevel: 'Medium' as const,
      updatedAt: i.Updated,
    }));
  }

  async getPlayerStats(playerId: string, season = '2026'): Promise<RawPlayerStats | null> {
    if (!KEY) return null;

    // Player stats endpoint varies per sport — implement when adding player detail pages
    void season;
    void playerId;
    return null;
  }

  async getVenue(_venueId: string): Promise<RawVenue | null> {
    // SportsDataIO Stadium endpoint — not yet wired up
    return null;
  }
}
