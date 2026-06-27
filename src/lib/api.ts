/**
 * Data layer — all data access goes through these functions.
 *
 * Live provider replacement guide:
 *   Schedules / scores / standings  → SportsDataIO (src/lib/providers/sportsdata.ts)
 *   Player stats / injuries         → SportsDataIO / Sportradar (same file)
 *   Historical / advanced analytics → Stats Perform, SportsBettingAPI
 *   Weather                         → OpenWeatherMap (src/lib/providers/weather.ts)
 *   Odds / betting lines            → The Odds API (src/lib/providers/odds.ts)
 *   Prediction engine               → src/lib/engine/ (ELO + Logistic Regression)
 *
 * To enable live data:
 *   1. Set SPORTS_DATA_IO_API_KEY, ODDS_API_KEY, OPENWEATHERMAP_API_KEY in .env.local
 *   2. Set ENGINE_ENABLED=true in .env.local to replace mock predictions
 *   3. Set REDIS_URL in .env.local for distributed caching (optional)
 */

import { Game, Sport, AccuracyStats, PredictionRecord, LeagueData, Tournament, type Team } from './types';
import { MOCK_GAMES, ACCURACY_STATS, PREDICTION_HISTORY } from './mockData';
import { TEAM_DETAILS, type TeamDetail } from './teamData';
import { PLAYER_DETAILS, PLAYER_LIST, type PlayerDetail } from './playerData';
import { ALL_TEAMS, TEAM_MAP } from './data/teams/index';
import { LEAGUES, ALL_LEAGUES } from './data/leagues';
import { TOURNAMENTS, ALL_TOURNAMENTS } from './data/tournaments';
import { rawGameToGame, getAllEspnPlayers, type PlayerSummary } from './data/live';
import { getProviders } from './providers';

// Engine imports (tree-shaken in production if ENGINE_ENABLED is false)
import type { EnginePrediction } from './engine';
import { cached, cacheKey, TTL } from './cache';

const LIVE_SPORTS: Sport[] = ['NFL', 'NBA', 'MLB', 'NHL'];

// ── Games ────────────────────────────────────────────────────────
export async function getUpcomingGames(filters?: {
  sport?: Sport;
  league?: string;
  minConfidence?: number;
}): Promise<Game[]> {
  // Fetch live games from ESPN for supported sports, merge with mock data
  const today = new Date().toISOString().split('T')[0];
  const sportsToFetch = filters?.sport
    ? (LIVE_SPORTS.includes(filters.sport) ? [filters.sport] : [])
    : LIVE_SPORTS;

  let liveGames: Game[] = [];
  if (sportsToFetch.length > 0) {
    try {
      const provider = getProviders().sports;
      const rawResults = await Promise.all(
        sportsToFetch.map(s => provider.getGames(s, today).catch(() => [])),
      );
      liveGames = rawResults.flat()
        .map(rawGameToGame)
        .filter((g): g is Game => g !== null);
    } catch {
      // Fall through to mock data
    }
  }

  // Merge: live games take priority; keep mock games for sports not covered by ESPN
  const liveIds = new Set(liveGames.map(g => g.id));
  const mockFallback = MOCK_GAMES.filter(g => !LIVE_SPORTS.includes(g.sport) && !liveIds.has(g.id));
  let games = [...liveGames, ...mockFallback];

  if (filters?.sport)         games = games.filter(g => g.sport === filters.sport);
  if (filters?.league)        games = games.filter(g => g.league.toLowerCase().includes(filters.league!.toLowerCase()));
  if (filters?.minConfidence) games = games.filter(g => g.prediction.confidence >= filters.minConfidence!);
  return games;
}

export async function getGameById(id: string): Promise<Game | null> {
  // Check ESPN live games first, then fall back to mock
  if (id.startsWith('espn-')) {
    const espnId = id.slice(5);
    const today = new Date().toISOString().split('T')[0];
    try {
      const provider = getProviders().sports;
      for (const sport of LIVE_SPORTS) {
        const rawGames = await provider.getGames(sport, today).catch(() => []);
        const match = rawGames.find(r => r.id === espnId);
        if (match) return rawGameToGame(match);
      }
    } catch { /* fall through */ }
  }
  return MOCK_GAMES.find(g => g.id === id) ?? null;
}

// ── Teams ────────────────────────────────────────────────────────
export async function getTeams(): Promise<Team[]> {
  return ALL_TEAMS;
}

export async function getTeamById(id: string): Promise<TeamDetail | Team | null> {
  // Legacy detailed profiles first, then v3 team data
  return TEAM_DETAILS[id] ?? TEAM_MAP[id] ?? null;
}

// ── Players ──────────────────────────────────────────────────────
export async function getPlayers(): Promise<PlayerSummary[]> {
  // Live ESPN roster data for all major US sports
  try {
    const espnPlayers = await getAllEspnPlayers();
    if (espnPlayers.length > 0) return espnPlayers;
  } catch { /* fall through to mock */ }
  // Fallback: wrap old player list into PlayerSummary shape
  return PLAYER_LIST.map(p => ({
    id: p.id,
    name: p.name,
    position: p.position ?? '—',
    jersey: '—',
    teamId: p.teamId ?? '',
    teamName: p.teamName ?? '',
    teamColor: '#6366f1',
    sport: (p.sport ?? 'NFL') as Sport,
    league: (p.sport ?? 'NFL') as string,
    status: 'Active' as const,
  }));
}

export async function getPlayerById(id: string): Promise<PlayerDetail | null> {
  // Live: fetch full player profile including game log from FantasyData / Sportradar
  return PLAYER_DETAILS[id] ?? null;
}

// ── Accuracy / model stats ───────────────────────────────────────
export async function getAccuracyStats(): Promise<AccuracyStats> {
  // Live: aggregate from predictions + validation_results tables
  return ACCURACY_STATS;
}

export async function getPredictionHistory(limit = 50): Promise<PredictionRecord[]> {
  // Live: query predictions table ORDER BY date DESC LIMIT $1
  return PREDICTION_HISTORY.slice(0, limit);
}

// ── Search ───────────────────────────────────────────────────────
export async function searchGames(query: string): Promise<Game[]> {
  // Live: full-text search via PostgreSQL pg_trgm or Elasticsearch
  const q = query.toLowerCase();
  return MOCK_GAMES.filter(g =>
    g.homeTeam.name.toLowerCase().includes(q) ||
    g.awayTeam.name.toLowerCase().includes(q) ||
    g.sport.toLowerCase().includes(q) ||
    g.league.toLowerCase().includes(q)
  );
}

export async function searchAll(query: string) {
  // Live: unified search across games + teams + players via search index
  const q = query.toLowerCase();
  return {
    games:   (await searchGames(query)),
    teams: ALL_TEAMS.filter(t =>
      t.name.toLowerCase().includes(q) || t.sport.toLowerCase().includes(q)
    ),
    players: PLAYER_LIST.filter(p =>
      p.name.toLowerCase().includes(q) || p.teamName.toLowerCase().includes(q)
    ),
    allTeams: ALL_TEAMS.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.sport.toLowerCase().includes(q) ||
      t.league.toLowerCase().includes(q) ||
      t.abbreviation.toLowerCase().includes(q)
    ),
    leagues: ALL_LEAGUES.filter(l =>
      l.name.toLowerCase().includes(q) ||
      l.shortName.toLowerCase().includes(q) ||
      l.country.toLowerCase().includes(q)
    ),
    tournaments: ALL_TOURNAMENTS.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.shortName.toLowerCase().includes(q)
    ),
  };
}

// ── v3.0 — Leagues ───────────────────────────────────────────────────────────
export async function getLeagues(): Promise<LeagueData[]> {
  return ALL_LEAGUES;
}

export async function getLeagueById(id: string): Promise<LeagueData | null> {
  return LEAGUES[id] ?? null;
}

// ── v3.0 — Tournaments ───────────────────────────────────────────────────────
export async function getTournaments(): Promise<Tournament[]> {
  return ALL_TOURNAMENTS;
}

export async function getTournamentById(id: string): Promise<Tournament | null> {
  return TOURNAMENTS[id] ?? null;
}

// ── v3.0 — All teams (500+ across all leagues) ───────────────────────────────
export async function getAllTeams(filters?: { sport?: Sport; league?: string }): Promise<Team[]> {
  let teams = ALL_TEAMS;
  if (filters?.sport) teams = teams.filter(t => t.sport === filters.sport);
  if (filters?.league) teams = teams.filter(t => t.league.toLowerCase().includes(filters.league!.toLowerCase()));
  return teams;
}

export async function getTeamV3(id: string): Promise<Team | null> {
  return TEAM_MAP[id] ?? null;
}

// ── Prediction engine ────────────────────────────────────────────────────────
//
// getEnginePrediction() runs the real ELO + Logistic Regression ensemble.
// It does NOT replace getGameById() — the frontend still receives Game objects
// with mock predictions. Components opt into engine output by calling this.
//
// Set ENGINE_ENABLED=true in .env.local to merge engine output into getGameById().

const ENGINE_ENABLED = process.env.ENGINE_ENABLED === 'true';

export async function getEnginePrediction(gameId: string): Promise<EnginePrediction | null> {
  const key = cacheKey('prediction:', gameId, 'engine');
  return cached(key, TTL.PREDICTION, async () => {
    const { runPrediction } = await import('./engine');
    const game = MOCK_GAMES.find(g => g.id === gameId);
    if (!game) return null;
    return runPrediction(game);
  });
}

// Overrides getGameById to inject real engine predictions when ENGINE_ENABLED.
// Existing callers transparently get improved predictions with zero changes.
export async function getEnrichedGame(id: string): Promise<Game | null> {
  const game = await getGameById(id);
  if (!game || !ENGINE_ENABLED) return game;

  try {
    const { toPrediction } = await import('./engine');
    const output = await getEnginePrediction(id);
    if (!output) return game;
    return { ...game, prediction: toPrediction(output, game) };
  } catch {
    // Engine failure should never block the UI — fall back to mock prediction
    return game;
  }
}

// ── Data quality monitoring ──────────────────────────────────────────────────

export async function getDataQualityReport() {
  const { dataLogger } = await import('./validation/logger');
  return {
    issues:      dataLogger.getIssues(),
    errorCount:  dataLogger.getErrorCount(),
    generatedAt: new Date().toISOString(),
  };
}

// ── Prediction validation stats ──────────────────────────────────────────────

export async function getValidationStats(sport?: string, modelName?: string) {
  const { validationStore } = await import('./engine/validator');
  return {
    accuracy:      validationStore.getAccuracy(sport, modelName),
    recentRecords: validationStore.all().slice(-10),
  };
}

// ── Calibration metrics ──────────────────────────────────────────────────────

export async function getCalibrationMetrics() {
  const { calibrationStore, calibrationCurve } = await import('./engine/calibration');
  const allSamples = calibrationStore.all();
  return {
    sampleCount:       allSamples.length,
    calibrationCurve:  calibrationCurve(allSamples),
    byModel: {
      ELO:               calibrationStore.getMetrics('ELO'),
      LogisticRegression: calibrationStore.getMetrics('LogisticRegression'),
    },
  };
}
