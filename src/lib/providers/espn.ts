/**
 * ESPN public scoreboard API — no API key required.
 * Used as the primary free data source for live schedules and scores.
 *
 * Unofficial API; subject to change without notice.
 * Falls back silently on error so callers always get a valid (possibly empty) result.
 */

import { apiFetch } from './client';
import type { RawGame, RawTeamStats, RawInjury, RawPlayerStats, RawVenue, SportsDataProvider } from './types';
import type { Sport } from '../types';

const BASE = 'https://site.api.espn.com/apis/site/v2/sports';

const SPORT_PATH: Partial<Record<Sport, string>> = {
  NFL:               'football/nfl',
  NBA:               'basketball/nba',
  MLB:               'baseball/mlb',
  NHL:               'icehockey/nhl',
  Soccer:            'soccer/eng.1',
  'NCAA Football':   'football/college-football',
  'NCAA Basketball': 'basketball/mens-college-basketball',
};

function normStatus(espnTypeName: string): RawGame['status'] {
  switch (espnTypeName) {
    case 'STATUS_SCHEDULED':
    case 'STATUS_PREGAME':
      return 'scheduled';
    case 'STATUS_IN_PROGRESS':
    case 'STATUS_FIRST_HALF':
    case 'STATUS_SECOND_HALF':
    case 'STATUS_HALFTIME':
    case 'STATUS_END_PERIOD':
    case 'STATUS_OVERTIME':
      return 'inprogress';
    case 'STATUS_FINAL':
    case 'STATUS_FINAL_OT':
    case 'STATUS_FINAL_SO':
    case 'STATUS_FULL_TIME':
      return 'closed';
    case 'STATUS_POSTPONED':
      return 'postponed';
    case 'STATUS_CANCELLED':
    case 'STATUS_CANCELED':
      return 'cancelled';
    default:
      return 'scheduled';
  }
}

// ── Raw ESPN response shapes ──────────────────────────────────────────────────

interface ESPNTeam {
  id: string;
  abbreviation: string;
  displayName: string;
}

interface ESPNCompetitor {
  id: string;
  homeAway: 'home' | 'away';
  score: string;
  team: ESPNTeam;
}

interface ESPNVenue {
  id: string;
  fullName: string;
  indoor: boolean;
  address?: { city?: string; state?: string; country?: string };
}

interface ESPNStatus {
  displayClock: string;
  period: number;
  type: { name: string; completed: boolean };
}

interface ESPNCompetition {
  competitors: ESPNCompetitor[];
  venue?: ESPNVenue;
}

interface ESPNEvent {
  id: string;
  date: string;
  status: ESPNStatus;
  competitions: ESPNCompetition[];
}

interface ESPNScoreboard {
  events?: ESPNEvent[];
}

// ── Adapter ───────────────────────────────────────────────────────────────────

export class ESPNProvider implements SportsDataProvider {
  readonly name = 'ESPN';

  async getGames(sport: Sport, date: string): Promise<RawGame[]> {
    const path = SPORT_PATH[sport];
    if (!path) return [];

    const d = new Date(date);
    const formatted =
      String(d.getFullYear()) +
      String(d.getMonth() + 1).padStart(2, '0') +
      String(d.getDate()).padStart(2, '0');

    let scoreboard: ESPNScoreboard;
    try {
      scoreboard = await apiFetch<ESPNScoreboard>(
        `${BASE}/${path}/scoreboard?dates=${formatted}`,
        { rateLimitKey: 'espn', timeoutMs: 8_000, retries: 2 },
      );
    } catch {
      return [];
    }

    if (!scoreboard?.events?.length) return [];

    return scoreboard.events.flatMap(ev => {
      const comp = ev.competitions[0];
      if (!comp) return [];

      const home  = comp.competitors.find(c => c.homeAway === 'home');
      const away  = comp.competitors.find(c => c.homeAway === 'away');
      const venue = comp.venue;

      const game: RawGame = {
        id:           ev.id,
        sport,
        league:       sport,
        homeTeamId:   home?.team.id ?? '',
        awayTeamId:   away?.team.id ?? '',
        homeTeamName: home?.team.displayName ?? '',
        awayTeamName: away?.team.displayName ?? '',
        scheduledAt:  ev.date,
        venue:        venue?.fullName ?? 'Unknown Venue',
        venueId:      venue?.id ?? 'unknown',
        venueCity:    venue?.address?.city ?? '',
        venueState:   venue?.address?.state ?? '',
        venueCountry: venue?.address?.country ?? 'USA',
        status:       normStatus(ev.status.type.name),
        period:       ev.status.period || undefined,
        clock:        ev.status.displayClock || undefined,
        homeScore:    home?.score ? parseInt(home.score, 10) : undefined,
        awayScore:    away?.score ? parseInt(away.score, 10) : undefined,
      };
      return [game];
    });
  }

  // ESPN's public API doesn't expose team stats or injuries in a structured format.
  // Fall through to SportsDataIO for these endpoints.

  async getTeamStats(_teamId: string, _season?: string): Promise<RawTeamStats | null> {
    return null;
  }

  async getInjuries(_teamId: string): Promise<RawInjury[]> {
    return [];
  }

  async getPlayerStats(_playerId: string, _season?: string): Promise<RawPlayerStats | null> {
    return null;
  }

  async getVenue(_venueId: string): Promise<RawVenue | null> {
    return null;
  }
}
