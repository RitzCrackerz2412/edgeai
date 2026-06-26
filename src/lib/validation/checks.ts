/**
 * Domain-level data quality checks.
 *
 * These run after schema validation and enforce sports-domain constraints:
 *  - Duplicate game detection
 *  - Stale API response detection
 *  - Impossible stat values for each sport
 *  - Lineup completeness checks
 */

import type { RawGame, RawTeamStats, RawOdds, RawWeather } from '../providers/types';
import { dataLogger } from './logger';

// ── Duplicate detection ───────────────────────────────────────────────────────

export function detectDuplicateGames(games: RawGame[]): {
  unique: RawGame[];
  duplicates: Array<{ game: RawGame; duplicateOf: string }>;
} {
  const seen = new Map<string, string>(); // canonical key → first id
  const unique: RawGame[] = [];
  const duplicates: Array<{ game: RawGame; duplicateOf: string }> = [];

  for (const game of games) {
    // Canonical key: both team IDs + scheduled date (order-independent)
    const teams = [game.homeTeamId, game.awayTeamId].sort().join(':');
    const date  = new Date(game.scheduledAt).toISOString().slice(0, 10);
    const key   = `${game.sport}:${teams}:${date}`;

    const existingId = seen.get(key);
    if (existingId) {
      dataLogger.duplicate('game', game.id, existingId);
      duplicates.push({ game, duplicateOf: existingId });
    } else {
      seen.set(key, game.id);
      unique.push(game);
    }
  }

  return { unique, duplicates };
}

// ── Stale response detection ──────────────────────────────────────────────────

export function checkStaleWeather(
  weather: RawWeather,
  maxAgeSeconds = 900, // 15 min
): boolean {
  const ageSec = (Date.now() - new Date(weather.fetchedAt).getTime()) / 1000;
  if (ageSec > maxAgeSeconds) {
    dataLogger.stale('weather', weather.venueId, ageSec, maxAgeSeconds);
    return true;
  }
  return false;
}

// ── Sport-specific stat bounds ────────────────────────────────────────────────

interface StatBounds {
  field: string;
  min: number;
  max: number;
}

const NFL_BOUNDS: StatBounds[] = [
  { field: 'pointsPerGame',       min: 0,  max: 60  },
  { field: 'pointsAllowedPerGame',min: 0,  max: 60  },
  { field: 'winPct',              min: 0,  max: 1   },
];

const NBA_BOUNDS: StatBounds[] = [
  { field: 'pointsPerGame',       min: 80,  max: 140 },
  { field: 'pointsAllowedPerGame',min: 80,  max: 140 },
  { field: 'offensiveRating',     min: 90,  max: 130 },
  { field: 'defensiveRating',     min: 90,  max: 130 },
];

const MLB_BOUNDS: StatBounds[] = [
  { field: 'pointsPerGame',       min: 1,  max: 12  },
  { field: 'pointsAllowedPerGame',min: 1,  max: 12  },
];

const NHL_BOUNDS: StatBounds[] = [
  { field: 'pointsPerGame',       min: 1.0, max: 5.5 },
  { field: 'pointsAllowedPerGame',min: 1.0, max: 5.5 },
];

const SPORT_BOUNDS: Record<string, StatBounds[]> = {
  NFL:  NFL_BOUNDS,
  NBA:  NBA_BOUNDS,
  MLB:  MLB_BOUNDS,
  NHL:  NHL_BOUNDS,
};

export function checkTeamStatBounds(
  stats: RawTeamStats,
  sport: string,
): string[] {
  const bounds = SPORT_BOUNDS[sport] ?? [];
  const issues: string[] = [];

  for (const { field, min, max } of bounds) {
    const value = (stats as unknown as Record<string, unknown>)[field];
    if (value === undefined || value === null) continue; // missing fields handled separately
    if (typeof value !== 'number') continue;

    if (value < min || value > max) {
      dataLogger.impossible('teamStats', stats.teamId, field, value);
      issues.push(`${field}=${value} outside [${min}, ${max}] for ${sport}`);
    }
  }

  return issues;
}

// ── Odds sanity check ─────────────────────────────────────────────────────────

export function checkOddsSanity(odds: RawOdds): string[] {
  const issues: string[] = [];

  // Implied probability sum should be slightly above 1.0 (house edge), but not above 1.25
  const homeImpl = odds.homeMoneyline > 0
    ? 100 / (odds.homeMoneyline + 100)
    : -odds.homeMoneyline / (-odds.homeMoneyline + 100);
  const awayImpl = odds.awayMoneyline > 0
    ? 100 / (odds.awayMoneyline + 100)
    : -odds.awayMoneyline / (-odds.awayMoneyline + 100);

  const impliedSum = homeImpl + awayImpl + (odds.drawMoneyline !== undefined
    ? odds.drawMoneyline > 0
      ? 100 / (odds.drawMoneyline + 100)
      : -odds.drawMoneyline / (-odds.drawMoneyline + 100)
    : 0);

  if (impliedSum < 0.95) {
    dataLogger.invalid('odds', odds.gameId, 'impliedSum', impliedSum,
      'implied probabilities sum below 0.95 — possible data error');
    issues.push(`implied probability sum ${impliedSum.toFixed(3)} < 0.95`);
  }

  if (impliedSum > 1.30) {
    dataLogger.invalid('odds', odds.gameId, 'impliedSum', impliedSum,
      'vig above 30% — likely bad data');
    issues.push(`implied probability sum ${impliedSum.toFixed(3)} > 1.30 (excessive vig)`);
  }

  return issues;
}

// ── Completeness check ────────────────────────────────────────────────────────

export function checkTeamStatsCompleteness(
  stats: RawTeamStats,
  requiredFields: string[] = ['gamesPlayed', 'wins', 'losses', 'winPct'],
): string[] {
  const missing: string[] = [];
  for (const field of requiredFields) {
    const v = (stats as unknown as Record<string, unknown>)[field];
    if (v === undefined || v === null || (typeof v === 'number' && isNaN(v))) {
      dataLogger.missing('teamStats', stats.teamId, field);
      missing.push(field);
    }
  }
  return missing;
}
