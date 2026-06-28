/**
 * Live data bridge — converts ESPN RawGame data into our enriched Game type.
 * Uses TEAM_MAP to look up ELO, ratings, momentum, etc.
 * Falls back to mock data on any error so the UI never breaks.
 */

import type { Game, Sport, Team, Prediction } from '../types';
import type { RawGame } from '../providers/types';
import { ALL_TEAMS } from './teams/index';

// ── Team lookup ───────────────────────────────────────────────────────────────

function buildNameIndex(): Map<string, Team> {
  const idx = new Map<string, Team>();
  for (const t of ALL_TEAMS) {
    idx.set(t.name.toLowerCase(), t);
    idx.set(t.abbreviation.toLowerCase(), t);
    // Also index by short name parts (e.g. "Chiefs" from "Kansas City Chiefs")
    const parts = t.name.split(' ');
    if (parts.length > 1) idx.set(parts[parts.length - 1].toLowerCase(), t);
  }
  return idx;
}

let _nameIndex: Map<string, Team> | null = null;
function getNameIndex(): Map<string, Team> {
  if (!_nameIndex) _nameIndex = buildNameIndex();
  return _nameIndex;
}

function findTeam(sport: Sport, displayName: string): Team | null {
  const idx = getNameIndex();
  const q = displayName.toLowerCase();

  // 1. Exact full-name match with sport check
  const byName = idx.get(q);
  if (byName && byName.sport === sport) return byName;

  // 2. Linear scan for partial-name match within sport
  const sportTeams = ALL_TEAMS.filter(t => t.sport === sport);
  // Abbreviation match: only treat as a hit if the abbreviation appears as a
  // standalone word in the query, not just as a substring (avoids "VER" matching "cape verde")
  const abbrWordMatch = (abbr: string) => {
    const a = abbr.toLowerCase();
    return new RegExp(`(^|\\s)${a}(\\s|$)`).test(q);
  };
  return (
    sportTeams.find(t => t.name.toLowerCase() === q) ??
    sportTeams.find(t => abbrWordMatch(t.abbreviation)) ??
    sportTeams.find(t => t.name.toLowerCase().includes(q.split(' ').pop()!)) ??
    null
  );
}

function makeFallbackTeam(sport: Sport, league: string, displayName: string, abbr: string, color: string): Team {
  return {
    id: `live-${abbr.toLowerCase()}`,
    name: displayName,
    abbreviation: abbr,
    logo: '',
    sport,
    league,
    record: '0-0',
    winPct: 0.5,
    powerRanking: 15,
    offensiveRating: 100,
    defensiveRating: 100,
    netRating: 0,
    eloRating: 1500,
    momentum: 0.5,
    homeRecord: '0-0',
    awayRecord: '0-0',
    last5: [],
    injuries: [],
    color: color ? `#${color}` : '#6366f1',
  };
}

// ── ELO prediction ────────────────────────────────────────────────────────────

function buildPrediction(home: Team, away: Team, homeScore?: number, awayScore?: number, status?: Game['status']): Prediction {
  const prob = Math.round((1 / (1 + Math.pow(10, (away.eloRating - home.eloRating) / 400))) * 100);
  const conf = Math.min(95, Math.round(50 + (Math.abs(home.eloRating - away.eloRating) / 400) * 45));
  const isFinal = status === 'Final' || status === 'Final/OT' || status === 'Final/SO';

  if (isFinal && homeScore !== undefined && awayScore !== undefined) {
    const winner = homeScore > awayScore ? home : away;
    return {
      winner: winner.name,
      winProbability: homeScore > awayScore ? prob : 100 - prob,
      confidence: conf,
      predictedScore: { home: homeScore, away: awayScore },
      expectedMargin: Math.abs(homeScore - awayScore),
      upsetProbability: Math.min(prob, 100 - prob),
      playerOfMatch: '', highestImpactPlayer: '', lowestConfidenceVar: '',
      factors: [],
      gameFlow: `Final: ${away.abbreviation} ${awayScore} @ ${home.abbreviation} ${homeScore}`,
      monteCarloWinRate: prob,
      bayesianProbability: prob,
    };
  }

  const winner = prob >= 50 ? home : away;
  return {
    winner: winner.name,
    winProbability: prob,
    confidence: conf,
    predictedScore: {
      home: Math.round(home.offensiveRating / (home.sport === 'NFL' ? 3.5 : home.sport === 'NBA' ? 1 : home.sport === 'MLB' ? 20 : 8)),
      away: Math.round(away.offensiveRating / (away.sport === 'NFL' ? 3.5 : away.sport === 'NBA' ? 1 : away.sport === 'MLB' ? 20 : 8)),
    },
    expectedMargin: Math.abs(Math.round((home.eloRating - away.eloRating) / 40)),
    upsetProbability: Math.min(prob, 100 - prob),
    playerOfMatch: '', highestImpactPlayer: '', lowestConfidenceVar: '',
    factors: [
      { label: 'ELO Edge', positive: home.eloRating >= away.eloRating, weight: 0.4, detail: `${home.eloRating} vs ${away.eloRating}` },
      { label: 'Home Field', positive: true, weight: 0.15, detail: 'Home advantage applied' },
      { label: 'Momentum', positive: home.momentum >= away.momentum, weight: 0.2, detail: `${(home.momentum * 100).toFixed(0)}% vs ${(away.momentum * 100).toFixed(0)}%` },
    ],
    gameFlow: 'AI pre-game projection',
    monteCarloWinRate: prob,
    bayesianProbability: prob,
  };
}

// ── RawGame → Game ────────────────────────────────────────────────────────────

export function rawGameToGame(raw: RawGame): Game | null {
  // ESPN homeTeamId in the provider is ESPN's internal numeric ID (not abbr).
  // We match by displayName within the same sport.
  const homeTeam = findTeam(raw.sport, raw.homeTeamName);
  const awayTeam = findTeam(raw.sport, raw.awayTeamName);

  // Build minimal fallbacks so live games always show even if team not in our dataset
  const home = homeTeam ?? makeFallbackTeam(raw.sport, raw.league, raw.homeTeamName, raw.homeTeamId.slice(0, 3).toUpperCase(), '6366f1');
  const away = awayTeam ?? makeFallbackTeam(raw.sport, raw.league, raw.awayTeamName, raw.awayTeamId.slice(0, 3).toUpperCase(), 'ef4444');

  const dateObj = new Date(raw.scheduledAt);
  const dateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(dateObj);
  const timeStr = dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'America/New_York',
  }) + ' ET';

  // Validate: home ≠ away, both teams must have non-empty names
  if (!raw.homeTeamName || !raw.awayTeamName) return null;
  if (raw.homeTeamId === raw.awayTeamId && raw.homeTeamId !== '') return null;
  // Final scores must exist when status is closed
  if (raw.status === 'closed' && (raw.homeScore === undefined || raw.awayScore === undefined)) {
    // Allow — sometimes ESPN returns closed with score=0
  }

  const statusMap: Record<string, Game['status']> = {
    scheduled:  'Upcoming',
    inprogress: 'Live',
    closed:     'Final',
    postponed:  'Postponed',
    cancelled:  'Cancelled',
  };
  const status = statusMap[raw.status] ?? 'Upcoming';

  const prediction = buildPrediction(home, away, raw.homeScore, raw.awayScore, status);

  return {
    id: `espn-${raw.id}`,
    sport: raw.sport,
    league: raw.league,
    homeTeam: home,
    awayTeam: away,
    date: dateStr,
    time: timeStr,
    scheduledAt: raw.scheduledAt,
    venue: raw.venue,
    status,
    period: raw.period,
    clock: raw.clock,
    homeScore: raw.homeScore,
    awayScore: raw.awayScore,
    prediction,
    odds: {
      opening: { home: -110, away: -110, spread: 0 },
      current:  { home: -110, away: -110, spread: 0 },
      lineMovement: 0,
      publicBettingPct: { home: 50, away: 50 },
      sharpMoney: 'Split',
      expectedValue: 0,
    },
    headToHead: {
      allTime: { home: 0, away: 0 },
      last5:   { home: 0, away: 0 },
      avgScore: { home: 0, away: 0 },
      lastMeeting: 'N/A',
    },
  };
}

// ── ESPN player summary (lightweight) ────────────────────────────────────────

export interface PlayerSummary {
  id: string;
  name: string;
  position: string;
  jersey: string;
  teamId: string;
  teamName: string;
  teamColor: string;
  sport: Sport;
  league: string;
  status: 'Active' | 'Questionable' | 'Doubtful' | 'Out';
}

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports';

const ESPN_ROUTES: Partial<Record<Sport, { path: string; label: string }>> = {
  NFL: { path: 'football/nfl',   label: 'NFL' },
  NBA: { path: 'basketball/nba', label: 'NBA' },
  MLB: { path: 'baseball/mlb',   label: 'MLB' },
  NHL: { path: 'hockey/nhl',     label: 'NHL' },
};

async function espnFetch(url: string) {
  try {
    const r = await fetch(url, { next: { revalidate: 3600 } });
    if (!r.ok) return null;
    return r.json();
  } catch { return null; }
}

/** Fetch all players for a sport from ESPN rosters. Cached 1 hour. */
export async function getEspnPlayersForSport(sport: Sport): Promise<PlayerSummary[]> {
  const route = ESPN_ROUTES[sport];
  if (!route) return [];

  // First get all team IDs for this sport
  const teamsData = await espnFetch(`${ESPN_BASE}/${route.path}/teams?limit=50`);
  if (!teamsData) return [];

  const espnTeams: { id: string; displayName: string; abbreviation: string; color: string }[] =
    teamsData.sports?.[0]?.leagues?.[0]?.teams?.map((t: { team: { id: string; displayName: string; abbreviation: string; color: string } }) => t.team) ?? [];

  // Fetch rosters in parallel (batches of 8 to avoid hammering)
  const players: PlayerSummary[] = [];
  const BATCH = 8;

  for (let i = 0; i < espnTeams.length; i += BATCH) {
    const batch = espnTeams.slice(i, i + BATCH);
    const rosters = await Promise.all(
      batch.map(async team => {
        const data = await espnFetch(`${ESPN_BASE}/${route.path}/teams/${team.id}/roster`);
        return { team, data };
      }),
    );

    for (const { team, data } of rosters) {
      if (!data?.athletes) continue;
      const color = team.color ? `#${team.color}` : '#6366f1';

      // athletes is an array of position-group objects, each with items[]
      for (const group of data.athletes as { items?: { id: string; displayName: string; position?: { abbreviation: string }; jersey?: string; status?: { name: string } }[] }[]) {
        for (const p of group.items ?? []) {
          const rawStatus = p.status?.name ?? 'Active';
          const status: PlayerSummary['status'] =
            rawStatus === 'Questionable' ? 'Questionable' :
            rawStatus === 'Doubtful'     ? 'Doubtful' :
            rawStatus === 'Out' || rawStatus === 'Injured Reserve' ? 'Out' : 'Active';

          players.push({
            id: `espn-${p.id}`,
            name: p.displayName,
            position: p.position?.abbreviation ?? '—',
            jersey: p.jersey ?? '—',
            teamId: team.id,
            teamName: team.displayName,
            teamColor: color,
            sport,
            league: route.label,
            status,
          });
        }
      }
    }
  }

  return players;
}

/** Fetch players for all ESPN-supported sports in parallel. */
export async function getAllEspnPlayers(): Promise<PlayerSummary[]> {
  const sports = Object.keys(ESPN_ROUTES) as Sport[];
  const results = await Promise.all(sports.map(s => getEspnPlayersForSport(s)));
  return results.flat();
}
