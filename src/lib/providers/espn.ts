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
  NHL:               'hockey/nhl',
  'NCAA Football':   'football/college-football',
  'NCAA Basketball': 'basketball/mens-college-basketball',
};

// Soccer uses multiple league paths — fetched in parallel
const SOCCER_PATHS: Record<string, string> = {
  // Major domestic leagues
  EPL:               'soccer/eng.1',
  'La Liga':         'soccer/esp.1',
  Bundesliga:        'soccer/ger.1',
  'Serie A':         'soccer/ita.1',
  'Ligue 1':         'soccer/fra.1',
  MLS:               'soccer/usa.1',
  NWSL:              'soccer/usa.nwsl',
  'Liga MX':         'soccer/mex.1',
  'Eredivisie':      'soccer/ned.1',
  'Primeira Liga':   'soccer/por.1',
  // European club competitions
  'Champions League':  'soccer/uefa.champions',
  'Europa League':     'soccer/uefa.europa',
  'Conference League': 'soccer/uefa.conference',
  // International club
  'Club World Cup':    'soccer/fifa.cwc',
  'Copa Libertadores': 'soccer/conmebol.libertadores',
  'Copa Sudamericana': 'soccer/conmebol.sudamericana',
  // International
  'World Cup':         'soccer/fifa.world',
  'Nations League':    'soccer/uefa.nations',
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
    // Strip hyphens directly — avoids UTC-midnight timezone trap from new Date("YYYY-MM-DD")
    const formatted = date.replace(/-/g, '');

    if (sport === 'Soccer') {
      const results = await Promise.all(
        Object.entries(SOCCER_PATHS).map(([league, path]) =>
          this.fetchScoreboard(path, formatted, sport, league).catch(() => [] as RawGame[]),
        ),
      );
      return results.flat();
    }

    const path = SPORT_PATH[sport];
    if (!path) return [];
    return this.fetchScoreboard(path, formatted, sport, sport).catch(() => []);
  }

  private async fetchScoreboard(path: string, formatted: string, sport: Sport, league: string): Promise<RawGame[]> {
    let scoreboard: ESPNScoreboard;
    try {
      scoreboard = await apiFetch<ESPNScoreboard>(
        `${BASE}/${path}/scoreboard?dates=${formatted}`,
        { rateLimitKey: `espn-${path.replace(/\//g, '-')}`, timeoutMs: 8_000, retries: 2, next: { revalidate: 60 } },
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
        id:           `${league}-${ev.id}`,
        sport,
        league,
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

  // ── Team stats ──────────────────────────────────────────────────────────────
  //
  // Fetches from ESPN's undocumented team stats endpoint.
  // teamId must be ESPN's numeric ID (e.g. "2" for Celtics).
  // Returns null for non-numeric IDs (our internal slugs) so the caller
  // can fall through to SportsDataIO or use static data.

  async getTeamStats(teamId: string, _season?: string): Promise<RawTeamStats | null> {
    if (!/^\d+$/.test(teamId)) return null; // not an ESPN numeric ID

    // Determine sport/league path from context — try all major leagues
    const paths = [
      'basketball/nba', 'football/nfl', 'baseball/mlb',
      'hockey/nhl', 'football/college-football', 'basketball/mens-college-basketball',
    ];

    for (const path of paths) {
      try {
        const data = await apiFetch<ESPNTeamStatsResponse>(
          `${BASE}/${path}/teams/${teamId}/statistics`,
          { rateLimitKey: `espn-stats-${teamId}`, timeoutMs: 6_000, retries: 1, next: { revalidate: 300 } },
        );
        if (!data) continue;
        const stats = parseTeamStats(data, teamId);
        if (stats) return stats;
      } catch {
        continue;
      }
    }
    return null;
  }

  // ── Injuries ─────────────────────────────────────────────────────────────────
  //
  // Fetches league-wide injuries and filters to the requested team.
  // teamId can be ESPN numeric or a team name fragment for fuzzy filtering.

  async getInjuries(teamId: string): Promise<RawInjury[]> {
    const sportPaths = [
      { sport: 'NBA', path: 'basketball/nba' },
      { sport: 'NFL', path: 'football/nfl' },
      { sport: 'MLB', path: 'baseball/mlb' },
      { sport: 'NHL', path: 'hockey/nhl' },
    ];

    for (const { path } of sportPaths) {
      try {
        const data = await apiFetch<ESPNInjuryResponse>(
          `${BASE}/${path}/injuries`,
          { rateLimitKey: `espn-injuries-${path}`, timeoutMs: 6_000, retries: 1, next: { revalidate: 180 } },
        );
        if (!data?.injuries?.length) continue;

        const injuries = parseInjuries(data.injuries, teamId);
        if (injuries.length > 0) return injuries;
      } catch {
        continue;
      }
    }
    return [];
  }

  async getPlayerStats(_playerId: string, _season?: string): Promise<RawPlayerStats | null> {
    return null;
  }

  async getVenue(_venueId: string): Promise<RawVenue | null> {
    return null;
  }
}

// ── ESPN response shapes ──────────────────────────────────────────────────────

interface ESPNStatValue {
  name: string;
  displayName?: string;
  shortDisplayName?: string;
  value: number;
}

interface ESPNStatCategory {
  name?: string;
  displayName?: string;
  stats: ESPNStatValue[];
}

interface ESPNTeamStatsResponse {
  team?: { id: string; displayName: string; abbreviation?: string };
  results?: ESPNStatCategory[];
  statistics?: ESPNStatValue[];
}

interface ESPNInjuryAthlete {
  id: string;
  displayName: string;
  position?: { abbreviation: string };
}

interface ESPNInjuryTeam {
  id: string;
  displayName: string;
  abbreviation?: string;
}

interface ESPNInjuryEntry {
  athlete?: ESPNInjuryAthlete;
  team?: ESPNInjuryTeam;
  status?: string;
  shortComment?: string;
  details?: { type?: string; detail?: string; side?: string };
}

interface ESPNInjuryResponse {
  injuries?: ESPNInjuryEntry[];
}

// ── Parsers ───────────────────────────────────────────────────────────────────

function findStat(stats: ESPNStatValue[], ...names: string[]): number | undefined {
  for (const name of names) {
    const s = stats.find(s => s.name === name || s.displayName === name || s.shortDisplayName === name);
    if (s !== undefined) return s.value;
  }
  return undefined;
}

function parseTeamStats(data: ESPNTeamStatsResponse, teamId: string): RawTeamStats | null {
  // Flatten all stats from categories or top-level array
  const allStats: ESPNStatValue[] = [];
  if (data.results) {
    for (const cat of data.results) allStats.push(...(cat.stats ?? []));
  } else if (data.statistics) {
    allStats.push(...data.statistics);
  }
  if (allStats.length === 0) return null;

  const wins    = findStat(allStats, 'wins', 'Wins', 'W') ?? 0;
  const losses  = findStat(allStats, 'losses', 'Losses', 'L') ?? 0;
  const draws   = findStat(allStats, 'ties', 'draws', 'Draws', 'D') ?? 0;
  const gp      = wins + losses + draws || 1;
  const ppg     = findStat(allStats, 'avgPoints', 'pointsPerGame', 'PPG') ?? 0;
  const papg    = findStat(allStats, 'avgPointsAllowed', 'oppPointsPerGame', 'PAPG') ?? 0;
  const offRtg  = findStat(allStats, 'offensiveRating', 'offRating', 'ORtg') ?? ppg;
  const defRtg  = findStat(allStats, 'defensiveRating', 'defRating', 'DRtg') ?? papg;

  return {
    teamId,
    teamName:            data.team?.displayName ?? '',
    season:              new Date().getFullYear().toString(),
    league:              '',
    gamesPlayed:         gp,
    wins,
    losses,
    draws,
    winPct:              wins / gp,
    pointsPerGame:       ppg,
    pointsAllowedPerGame: papg,
    netRating:           offRtg - defRtg,
    offensiveRating:     offRtg,
    defensiveRating:     defRtg,
    homeWins:            findStat(allStats, 'homeWins', 'HW') ?? 0,
    homeLosses:          findStat(allStats, 'homeLosses', 'HL') ?? 0,
    awayWins:            findStat(allStats, 'awayWins', 'AW') ?? 0,
    awayLosses:          findStat(allStats, 'awayLosses', 'AL') ?? 0,
    last10:              [],
    extras:              Object.fromEntries(allStats.map(s => [s.name, s.value])),
  };
}

function parseInjuries(entries: ESPNInjuryEntry[], teamId: string): RawInjury[] {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const nid = normalize(teamId);

  return entries
    .filter(e => {
      if (!e.team || !e.athlete) return false;
      // Filter by ESPN numeric team ID or fuzzy team name match
      if (/^\d+$/.test(teamId)) return e.team.id === teamId;
      return normalize(e.team.displayName).includes(nid) ||
             normalize(e.team.abbreviation ?? '').includes(nid) ||
             nid.includes(normalize(e.team.displayName));
    })
    .map(e => ({
      playerId:    e.athlete!.id,
      playerName:  e.athlete!.displayName,
      teamId:      e.team!.id,
      position:    e.athlete!.position?.abbreviation ?? '',
      status:      mapInjuryStatus(e.status ?? ''),
      description: e.shortComment ?? e.details?.detail ?? '',
      impactLevel: mapImpactLevel(e.status ?? '', e.athlete!.position?.abbreviation ?? ''),
      updatedAt:   new Date().toISOString(),
    }));
}

function mapInjuryStatus(raw: string): RawInjury['status'] {
  const s = raw.toLowerCase();
  if (s.includes('out') || s.includes('inactive')) return 'out';
  if (s.includes('doubtful'))                        return 'doubtful';
  if (s.includes('questionable'))                    return 'questionable';
  if (s.includes('day') || s.includes('dtd'))        return 'day-to-day';
  if (s.includes('ir') || s.includes('reserve'))     return 'ir';
  return 'questionable';
}

function mapImpactLevel(status: string, position: string): RawInjury['impactLevel'] {
  const s = status.toLowerCase();
  if (s.includes('out') || s.includes('ir'))  return 'Critical';
  if (s.includes('doubtful'))                 return 'High';
  // Stars and key positions hurt more
  const starPositions = ['QB', 'PG', 'SG', 'CF', 'C', 'RB'];
  if (s.includes('questionable') && starPositions.includes(position)) return 'High';
  if (s.includes('questionable'))             return 'Medium';
  return 'Low';
}
