/**
 * Live data bridge — converts ESPN RawGame data into our enriched Game type.
 * Uses TEAM_MAP to look up ELO, ratings, momentum, etc.
 * Falls back to mock data on any error so the UI never breaks.
 */

import type { Game, Sport, Team, Prediction } from '../types';
import type { RawGame, RawOdds, RawPlayerLeader } from '../providers/types';
import { ALL_TEAMS } from './teams/index';
import { resultsStore } from '../results/store';
import { enrichTeam } from '../results/enrichTeam';
import { analyzeMarket } from '../markets/analyzer';
import { extractFeatures } from '../features/pipeline';
import { ensembleModel } from '../engine/ensemble';

// ── Team lookup ───────────────────────────────────────────────────────────────
//
// Matching an ESPN display name to a stored Team must be conservative:
// a wrong match attaches real live scores to the wrong club, its ELO, and
// its colors (historically "Bay FC" substring-matched "AFC Bournemouth").
// When no confident match exists we return null and the caller builds a
// fallback team carrying the real ESPN name — always correct to display.

/** ESPN league label → which stored team leagues may be matched against. */
const EURO_CLUB_POOL = ['Premier League', 'La Liga', 'Bundesliga', 'Serie A', 'Ligue 1'];
const LEAGUE_TEAM_POOLS: Record<string, string[]> = {
  EPL:                ['Premier League'],
  'La Liga':          ['La Liga'],
  Bundesliga:         ['Bundesliga'],
  'Serie A':          ['Serie A'],
  'Ligue 1':          ['Ligue 1'],
  MLS:                ['MLS East', 'MLS West'],
  'World Cup':        ['FIFA World Cup'],
  'Nations League':   ['FIFA World Cup', 'UEFA Euro'],
  'Champions League':  EURO_CLUB_POOL,
  'Europa League':     EURO_CLUB_POOL,
  'Conference League': EURO_CLUB_POOL,
  'Club World Cup':    [...EURO_CLUB_POOL, 'MLS East', 'MLS West'],
};

/** Tokens too generic to identify a club on their own. */
const GENERIC_TOKENS = new Set([
  'fc', 'afc', 'cf', 'sc', 'ac', 'as', 'ssc', 'cd', 'rcd', 'rc', 'ud', 'us',
  'club', 'de', 'la', 'los', 'el', 'st', 'saint', 'utd', 'united', 'city',
  'town', 'county', 'albion', 'wanderers', 'rovers', 'athletic', 'atletico',
  'sporting', 'racing', 'the', 'and', 'of', '1', 'i', 'ii',
]);

function normName(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // strip diacritics
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function distinctiveTokens(s: string): string[] {
  return normName(s).split(' ').filter(t => t.length > 0 && !GENERIC_TOKENS.has(t));
}

function findTeam(sport: Sport, league: string, displayName: string): Team | null {
  const q = normName(displayName);
  if (!q) return null;

  // Candidate pool: league-gated for soccer (all soccer leagues share one
  // sport, so sport-wide matching caused cross-league pollution). Leagues we
  // don't stock (NWSL, Liga MX, Eredivisie, …) get no pool → fallback team.
  let pool: Team[];
  if (sport === 'Soccer') {
    const leagues = LEAGUE_TEAM_POOLS[league];
    if (!leagues) return null;
    pool = ALL_TEAMS.filter(t => t.sport === 'Soccer' && leagues.includes(t.league));
  } else {
    pool = ALL_TEAMS.filter(t => t.sport === sport);
  }

  // 1. Exact normalized-name match
  const exact = pool.find(t => normName(t.name) === q);
  if (exact) return exact;

  // 2. Whole-query abbreviation match ("LAFC", "PSG")
  const abbr = pool.find(t => t.abbreviation.toLowerCase() === q);
  if (abbr) return abbr;

  // 3. Distinctive-token overlap — the match must be unique and one side's
  // distinctive tokens must be a subset of the other's. Ambiguity → null.
  const qd = distinctiveTokens(displayName);
  if (qd.length === 0) return null;

  let best: Team | null = null;
  let bestScore = 0;
  let tied = false;
  for (const t of pool) {
    const td = distinctiveTokens(t.name);
    if (td.length === 0) continue;
    const overlap = td.filter(x => qd.includes(x)).length;
    if (overlap === 0) continue;
    const subset = qd.every(x => td.includes(x)) || td.every(x => qd.includes(x));
    if (!subset) continue;
    if (overlap > bestScore) { best = t; bestScore = overlap; tied = false; }
    else if (overlap === bestScore) tied = true;
  }
  return tied ? null : best;
}

function makeFallbackTeam(sport: Sport, league: string, displayName: string, abbr: string, color: string): Team {
  // ID from the full name slug — abbreviation-based ids collided across games
  const slug = displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || abbr.toLowerCase();
  return {
    id: `live-${slug}`,
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
  'NCAA Football':    { leagueAvg: 26.0,  homeAdv: 3.5,  eloFactor: 0.09, noiseRange: 7 },
  'NCAA Basketball':  { leagueAvg: 72.0,  homeAdv: 3.8,  eloFactor: 0.03, noiseRange: 5 },
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

  const predHome = homeBase + cfg.homeAdv + eloEdge / 2 + momAdj / 2 + noise;
  const predAway = awayBase - cfg.homeAdv * 0.5 - eloEdge / 2 - momAdj / 2 - noise * 0.6;

  const floor = cfg.leagueAvg * 0.30;
  return {
    home: Math.round(Math.max(floor, predHome)),
    away: Math.round(Math.max(floor, predAway)),
  };
}

// ── ELO prediction ────────────────────────────────────────────────────────────

function pickKeyPlayers(leaders: RawPlayerLeader[] | undefined, home: Team, away: Team, eloDiff: number, sport: Sport): Pick<Prediction, 'playerOfMatch' | 'highestImpactPlayer' | 'lowestConfidenceVar'> {
  if (leaders && leaders.length > 0) {
    const sorted = [...leaders].sort((a, b) => b.value - a.value);
    const top = sorted[0];
    const second = sorted.find(l => l.teamName !== top.teamName) ?? sorted[1];
    const playerOfMatch = top ? `${top.playerName} · ${top.category}` : '';
    const highestImpactPlayer = second ? `${second.playerName} · ${second.category}` : '';
    // Uncertainty: the stat category where both teams have a leader (contested)
    const categories = new Set(leaders.map(l => l.category));
    const contested = [...categories].find(cat => leaders.filter(l => l.category === cat).length > 1);
    const lowestConfidenceVar = contested ? `${contested} battle` : sport === 'Soccer' ? 'Set piece threat' : 'Late-game variance';
    return { playerOfMatch, highestImpactPlayer, lowestConfidenceVar };
  }
  // No live leaders yet — derive uncertainty note from prediction factors
  const absElo = Math.abs(eloDiff);
  let lowestConfidenceVar = '';
  if (absElo < 50) lowestConfidenceVar = 'Near-even ELO matchup';
  else if (sport === 'Soccer') lowestConfidenceVar = 'Set piece + goalkeeper form';
  else if (sport === 'NFL') lowestConfidenceVar = 'Turnover variance';
  else if (sport === 'NBA') lowestConfidenceVar = 'Pace-of-play mismatch';
  else if (sport === 'MLB') lowestConfidenceVar = 'Starting pitcher rest';
  else if (sport === 'NHL') lowestConfidenceVar = 'Goaltender hot streak';
  else lowestConfidenceVar = 'Home court advantage variance';
  return { playerOfMatch: '', highestImpactPlayer: '', lowestConfidenceVar };
}

function buildPrediction(rawHome: Team, rawAway: Team, homeScore?: number, awayScore?: number, status?: Game['status'], rawOdds?: RawOdds | null, leaders?: RawPlayerLeader[]): Prediction {
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

  const eloDiff = home.eloRating - away.eloRating;
  const keyPlayers = pickKeyPlayers(leaders, home, away, eloDiff, home.sport);

  if (isFinal && homeScore !== undefined && awayScore !== undefined) {
    const winner = homeScore > awayScore ? home : away;
    return {
      winner: winner.name,
      winProbability: homeScore > awayScore ? prob : 100 - prob,
      confidence: conf,
      predictedScore: { home: predHome, away: predAway },
      expectedMargin: Math.abs(homeScore - awayScore),
      upsetProbability: Math.min(prob, 100 - prob),
      ...keyPlayers,
      factors: [],
      gameFlow: `Final: ${away.abbreviation} ${awayScore} @ ${home.abbreviation} ${homeScore}`,
      monteCarloWinRate: prob,
      bayesianProbability: prob,
    };
  }

  const winner  = prob >= 50 ? home : away;

  const netHome = home.offensiveRating - home.defensiveRating;
  const netAway = away.offensiveRating - away.defensiveRating;

  const factors: Prediction['factors'] = [
    { label: 'ELO Edge',     positive: eloDiff >= 0,   weight: 0.4,  detail: `${home.eloRating} vs ${away.eloRating} (${eloDiff > 0 ? '+' : ''}${eloDiff})` },
    { label: 'Home Field',   positive: true,            weight: 0.15, detail: 'Home advantage applied' },
    { label: 'Momentum',     positive: home.momentum >= away.momentum, weight: 0.2, detail: `${home.momentum} vs ${away.momentum}` },
    { label: 'Off/Def Edge', positive: netHome >= netAway, weight: 0.25, detail: `Net ${netHome >= 0 ? '+' : ''}${netHome.toFixed(1)} vs ${netAway >= 0 ? '+' : ''}${netAway.toFixed(1)}` },
  ];

  // Key Player Edge — when real match leaders are available (live/completed games)
  // ESPN returns home team first, so leaders[0].teamName = home team
  if (leaders && leaders.length >= 2) {
    const homeTeamKey = leaders[0].teamName;
    const homeLeaders = leaders.filter(l => l.teamName === homeTeamKey);
    const awayLeaders = leaders.filter(l => l.teamName !== homeTeamKey);
    if (homeLeaders.length > 0 && awayLeaders.length > 0) {
      const homeTop = homeLeaders.reduce((a, b) => b.value > a.value ? b : a);
      const awayTop = awayLeaders.reduce((a, b) => b.value > a.value ? b : a);
      factors.push({
        label: 'Key Player Edge',
        positive: homeTop.value >= awayTop.value,
        weight: 0.1,
        detail: `${homeTop.playerName} vs ${awayTop.playerName} · ${homeTop.category}`,
      });
    }
  }

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
    ...keyPlayers,
    factors,
    gameFlow: 'AI pre-game projection',
    monteCarloWinRate: prob,
    bayesianProbability: prob,
    marketAnalysis,
  };
}

// ── Ensemble override ─────────────────────────────────────────────────────────
//
// buildPrediction() above gives every live game a fast, always-available
// raw-ELO baseline. For pending games we then run the full ensemble
// (log-odds pooling, per-sport dynamic weighting, disagreement-aware
// confidence, Davidson soccer draw model, empirical-Bayes form shrinkage,
// vig-free market anchor — see engine/ensemble.ts) and use its verdict
// instead. Never throws: any failure just keeps the ELO baseline.

async function applyEnsemblePrediction(game: Game): Promise<void> {
  try {
    const features = extractFeatures(game);
    const ens = await ensembleModel.predict(features);

    // Renormalize to a two-way split so winProbability + (100 − winProbability)
    // still sums to 100 for every surface that assumes a binary split — the
    // draw slice (soccer) is proportionally folded back into home/away.
    const total = ens.homeWinProbability + ens.awayWinProbability;
    const homePct = total > 0 ? Math.round((ens.homeWinProbability / total) * 100) : 50;
    const awayPct = 100 - homePct;
    const winnerIsHome = homePct >= awayPct;

    game.prediction.winner = winnerIsHome ? game.homeTeam.name : game.awayTeam.name;
    game.prediction.winProbability = winnerIsHome ? homePct : awayPct;
    game.prediction.confidence = Math.min(95, Math.max(20, Math.round(ens.confidence * 100)));
    game.prediction.upsetProbability = Math.min(homePct, awayPct);
    game.prediction.monteCarloWinRate = homePct;
    game.prediction.bayesianProbability = homePct;
  } catch {
    // Ensemble unavailable — keep the ELO-only baseline from buildPrediction
  }
}

// ── RawGame → Game ────────────────────────────────────────────────────────────

export async function rawGameToGame(raw: RawGame): Promise<Game | null> {
  // ESPN homeTeamId in the provider is ESPN's internal numeric ID (not abbr).
  // We match by displayName within the same sport AND league.
  const homeTeam = findTeam(raw.sport, raw.league, raw.homeTeamName);
  const awayTeam = findTeam(raw.sport, raw.league, raw.awayTeamName);

  // Build minimal fallbacks so live games always show even if team not in our dataset
  const toAbbr = (name: string) => name.split(' ').map(w => w[0] ?? '').join('').slice(0, 3).toUpperCase() || '???';
  const home = homeTeam ?? makeFallbackTeam(raw.sport, raw.league, raw.homeTeamName, toAbbr(raw.homeTeamName), '6366f1');
  const away = awayTeam ?? makeFallbackTeam(raw.sport, raw.league, raw.awayTeamName, toAbbr(raw.awayTeamName), 'ef4444');

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

  const prediction = buildPrediction(home, away, raw.homeScore, raw.awayScore, status, raw.odds ?? null, raw.leaders);

  const game: Game = {
    id: `espn-${raw.id}`,
    sport: raw.sport,
    league: raw.league,
    homeTeam: home,
    awayTeam: away,
    date: dateStr,
    time: timeStr,
    scheduledAt: raw.scheduledAt,
    venue: raw.venue,
    venueCity: raw.venueCity || undefined,
    venueState: raw.venueState || undefined,
    venueCountry: raw.venueCountry || undefined,
    status,
    period: raw.period,
    clock: raw.clock,
    statusDetail: raw.statusDetail,
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

  // Only pending/live games get the full ensemble — finished games keep
  // their ELO-baseline prediction as the historical record of what was
  // called, not a retroactively "improved" pick.
  if (status !== 'Final' && status !== 'Final/OT' && status !== 'Final/SO') {
    await applyEnsemblePrediction(game);
  }

  return game;
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
