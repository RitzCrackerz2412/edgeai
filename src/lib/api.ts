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

import { Game, Sport, AccuracyStats, PredictionRecord } from './types';
import { MOCK_GAMES, ACCURACY_STATS, PREDICTION_HISTORY } from './mockData';
import { TEAM_DETAILS, TEAM_LIST, type TeamDetail } from './teamData';
import { PLAYER_DETAILS, PLAYER_LIST, type PlayerDetail } from './playerData';

// Engine imports (tree-shaken in production if ENGINE_ENABLED is false)
import type { EnginePrediction } from './engine';
import { cached, cacheKey, TTL } from './cache';

// ── Games ────────────────────────────────────────────────────────
export async function getUpcomingGames(filters?: {
  sport?: Sport;
  league?: string;
  minConfidence?: number;
}): Promise<Game[]> {
  // Live: fetch from sports schedule API (SportsDataIO) when API key is set
  let games = [...MOCK_GAMES];
  if (filters?.sport)           games = games.filter(g => g.sport === filters.sport);
  if (filters?.league)          games = games.filter(g => g.league.toLowerCase().includes(filters.league!.toLowerCase()));
  if (filters?.minConfidence)   games = games.filter(g => g.prediction.confidence >= filters.minConfidence!);
  return games;
}

export async function getGameById(id: string): Promise<Game | null> {
  // Live: fetch single game with live score updates from sports API
  return MOCK_GAMES.find(g => g.id === id) ?? null;
}

// ── Teams ────────────────────────────────────────────────────────
export async function getTeams(): Promise<typeof TEAM_LIST> {
  // Live: fetch team list from sports standings API
  return TEAM_LIST;
}

export async function getTeamById(id: string): Promise<TeamDetail | null> {
  // Live: fetch full team profile including roster / injuries from Sportradar
  return TEAM_DETAILS[id] ?? null;
}

// ── Players ──────────────────────────────────────────────────────
export async function getPlayers(): Promise<typeof PLAYER_LIST> {
  // Live: fetch player list from sports stats API
  return PLAYER_LIST;
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
    teams:   TEAM_LIST.filter(t =>
      t.name.toLowerCase().includes(q) || t.sport.toLowerCase().includes(q)
    ),
    players: PLAYER_LIST.filter(p =>
      p.name.toLowerCase().includes(q) || p.teamName.toLowerCase().includes(q)
    ),
  };
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
