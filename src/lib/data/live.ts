/**
 * Live data bridge — converts ESPN RawGame data into our enriched Game type.
 * Uses TEAM_MAP to look up ELO, ratings, momentum, etc.
 * Falls back to mock data on any error so the UI never breaks.
 */

import type { Game, Sport, Team, Prediction } from '../types';
import type { RawGame, RawOdds } from '../providers/types';
import { ALL_TEAMS } from './teams/index';
import { resultsStore } from '../results/store';
import { enrichTeam } from '../results/enrichTeam';
import { analyzeMarket } from '../markets/analyzer';

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

// ── Sport-aware scoring config ────────────────────────────────────────────────
// leagueAvg:  typical points/goals per team per game
// homeAdv:    points added to home team score for home-field advantage
// eloFactor:  per-400-ELO-points contribution as fraction of leagueAvg
// noiseRange: max per-matchup spread units (half applied each side)

const SPORT_SCORING: Record<string, { leagueAvg: number; homeAdv: number; eloFactor: number; noiseRange: number }> = {
  NFL:    { leagueAvg: 23.0,  homeAdv: 2.5,  eloFactor: 0.08, noiseRange: 6 },
  NBA:    { leagueAvg: 114.0, homeAdv: 3.3,  eloFactor: 0.02, noiseRange: 8 },
  MLB:    { leagueAvg: 4.5,   homeAdv: 0.18, eloFactor: 0.04, noiseRange: 1 },
  NHL:    { leagueAvg: 3.0,   homeAdv: 0.15, eloFactor: 0.04, noiseRange: 1 },
  Soccer: { leagueAvg: 1.4,   homeAdv: 0.22, eloFactor: 0.05, noiseRange: 1 },
  NCAAF:  { leagueAvg: 26.0,  homeAdv: 3.5,  eloFactor: 0.09, noiseRange: 7 },
  NCAAB:  { leagueAvg: 72.0,  homeAdv: 3.8,  eloFactor: 0.03, noiseRange: 5 },
};

// Deterministic per-matchup noise using a simple string hash.
// Same two teams always get the same spread, making predictions stable but varied.
function matchupHash(a: string, b: string): number {
  const s = a + '|' + b;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function predictScores(home: Team, away: Team): { home: number; away: number } {
  const cfg = SPORT_SCORING[home.sport as string];
  if (!cfg) return { home: 0, away: 0 }; // individual sports (UFC, Tennis, etc.)

  // Additive model: start from each team's own average scoring rate, then adjust up/down
  // based on how the opponent's defense compares to the league average.
  // (leagueAvg - away.defensiveRating) > 0 means opponent has poor defense → home scores more
  // (leagueAvg - away.defensiveRating) < 0 means opponent has elite defense → home scores less
  const homeBase = home.offensiveRating + (cfg.leagueAvg - away.defensiveRating) * 0.5;
  const awayBase = away.offensiveRating + (cfg.leagueAvg - home.defensiveRating) * 0.5;

  // ELO edge: 400-point gap produces eloFactor * leagueAvg additional points of total margin
  const eloDiff = home.eloRating - away.eloRating;
  const eloEdge = (eloDiff / 400) * cfg.leagueAvg * cfg.eloFactor;

  // Momentum tilt: recent form on top of structural ratings (small signal)
  const momAdj = ((home.momentum - away.momentum) / 100) * cfg.leagueAvg * 0.02;

  // Deterministic per-matchup fingerprint so every game pair has its own spread
  const hash  = matchupHash(home.id, away.id);
  const noise = ((hash % (cfg.noiseRange * 2 + 1)) - cfg.noiseRange) * 0.5;

  let predHome = homeBase + cfg.homeAdv + eloEdge / 2 + momAdj / 2 + noise;
  let predAway = awayBase - cfg.homeAdv * 0.5 - eloEdge / 2 - momAdj / 2 - noise * 0.6;

  const floor = cfg.leagueAvg * 0.30;
  return {
    home: Math.round(Math.max(floor, predHome)),
    away: Math.round(Math.max(floor, predAway)),
  };
}

// ── ELO prediction ────────────────────────────────────────────────────────────

function buildPrediction(rawHome: Team, rawAway: Team, homeScore?: number, awayScore?: number, status?: Game['status'], rawOdds?: RawOdds | null): Prediction {
  // Use live-enriched ratings for win probability when available
  const home = enrichTeam(rawHome);
  const away = enrichTeam(rawAway);
  const prob = Math.round((1 / (1 + Math.pow(10, (away.eloRating - home.eloRating) / 400))) * 100);
  const conf = Math.min(95, Math.round(50 + (Math.abs(home.eloRating - away.eloRating) / 400) * 45));
  const isFinal = status === 'Final' || status === 'Final/OT' || status === 'Final/SO';

  // Compute model-predicted scores and align their direction with ELO winner.
  // ELO is the authoritative pick — if the score model points the other way,
  // swap scores so the predicted winner always has the higher predicted score.
  let { home: predHome, away: predAway } = predictScores(home, away);
  const eloFavorsHome = prob >= 50;
  if (eloFavorsHome !== (predHome >= predAway)) {
    [predHome, predAway] = [predAway, predHome];
  }

  if (isFinal && homeScore !== undefined && awayScore !== undefined) {
    const winner = homeScore > awayScore ? home : away;
    return {
      winner: winner.name,
      winProbability: homeScore > awayScore ? prob : 100 - prob,
      confidence: conf,
      predictedScore: { home: predHome, away: predAway },
      expectedMargin: Math.abs(homeScore - awayScore),
      upsetProbability: Math.min(prob, 100 - prob),
      playerOfMatch: '', highestImpactPlayer: '', lowestConfidenceVar: '',
      factors: [],
      gameFlow: `Final: ${away.abbreviation} ${awayScore} @ ${home.abbreviation} ${homeScore}`,
      monteCarloWinRate: prob,
      bayesianProbability: prob,
    };
  }

  const eloDiff = home.eloRating - away.eloRating;
  const winner  = prob >= 50 ? home : away;

  const netHome = home.offensiveRating - home.defensiveRating;
  const netAway = away.offensiveRating - away.defensiveRating;

  const factors: Prediction['factors'] = [
    { label: 'ELO Edge',     positive: eloDiff >= 0,   weight: 0.4,  detail: `${home.eloRating} vs ${away.eloRating} (${eloDiff > 0 ? '+' : ''}${eloDiff})` },
    { label: 'Home Field',   positive: true,            weight: 0.15, detail: 'Home advantage applied' },
    { label: 'Momentum',     positive: home.momentum >= away.momentum, weight: 0.2, detail: `${home.momentum} vs ${away.momentum}` },
    { label: 'Off/Def Edge', positive: netHome >= netAway, weight: 0.25, detail: `Net ${netHome >= 0 ? '+' : ''}${netHome.toFixed(1)} vs ${netAway >= 0 ? '+' : ''}${netAway.toFixed(1)}` },
  ];

  // Build a partial game object for market analyzer (avoids circular construction)
  const partialGame = {
    homeTeam: rawHome, awayTeam: rawAway,
    prediction: { factors, winProbability: prob },
  } as unknown as Game;

  const marketAnalysis = analyzeMarket(partialGame, prob, rawOdds ?? null);

  // Apply market-based confidence adjustment (capped to ±10pp)
  const adjustedConf = Math.min(95, Math.max(20, conf + marketAnalysis.confidenceAdjustment));

  // winProbability is always the WINNER's probability so components that do
  // `homeWinPct = winnerIsHome ? winProbability : 100 - winProbability` are correct.
  const winnerProb = prob >= 50 ? prob : 100 - prob;

  return {
    winner: winner.name,
    winProbability: winnerProb,
    confidence: adjustedConf,
    predictedScore: { home: predHome, away: predAway },
    expectedMargin: Math.abs(predHome - predAway),
    upsetProbability: Math.min(prob, 100 - prob),
    playerOfMatch: '', highestImpactPlayer: '', lowestConfidenceVar: '',
    factors,
    gameFlow: 'AI pre-game projection',
    monteCarloWinRate: prob,
    bayesianProbability: prob,
    marketAnalysis,
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

  // Record final game results so future predictions use real accumulated data
  if (
    (status === 'Final' || status === 'Final/OT' || status === 'Final/SO') &&
    raw.homeScore !== undefined &&
    raw.awayScore !== undefined &&
    homeTeam && awayTeam  // only record when we matched real teams (not fallbacks)
  ) {
    const gameId = `espn-${raw.id}`;
    if (!resultsStore.hasGame(gameId)) {
      const dateStr2 = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit',
      }).format(new Date(raw.scheduledAt));
      resultsStore.recordGame(
        {
          gameId,
          sport: raw.sport,
          league: raw.league,
          homeTeamId: homeTeam.id,
          awayTeamId: awayTeam.id,
          homeScore: raw.homeScore,
          awayScore: raw.awayScore,
          date: dateStr2,
          status: raw.status,
          recordedAt: new Date().toISOString(),
        },
        homeTeam.eloRating,
        awayTeam.eloRating,
      );
    }
  }

  const prediction = buildPrediction(home, away, raw.homeScore, raw.awayScore, status, raw.odds ?? null);

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
