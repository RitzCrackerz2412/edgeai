/**
 * Runtime type validation for incoming data.
 *
 * These guards validate raw API responses before they enter the feature pipeline.
 * They catch schema mismatches from API version changes, missing fields,
 * and impossible values before they corrupt predictions.
 */

import type { RawGame, RawTeamStats, RawInjury, RawPlayerStats, RawOdds, RawWeather } from '../providers/types';

// ── Type guard helpers ────────────────────────────────────────────────────────

function isString(v: unknown): v is string  { return typeof v === 'string'; }
function isNumber(v: unknown): v is number  { return typeof v === 'number' && isFinite(v); }
function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

// ── Schema result ─────────────────────────────────────────────────────────────

export interface SchemaResult<T> {
  valid: boolean;
  data?: T;
  errors: string[];
}

// ── RawGame validator ─────────────────────────────────────────────────────────

export function validateRawGame(raw: unknown): SchemaResult<RawGame> {
  const errors: string[] = [];
  if (!isObject(raw)) return { valid: false, errors: ['Not an object'] };

  if (!isString(raw.id))           errors.push('id: must be string');
  if (!isString(raw.sport))        errors.push('sport: must be string');
  if (!isString(raw.homeTeamId))   errors.push('homeTeamId: must be string');
  if (!isString(raw.awayTeamId))   errors.push('awayTeamId: must be string');
  if (!isString(raw.scheduledAt))  errors.push('scheduledAt: must be ISO string');
  if (!isString(raw.status))       errors.push('status: must be string');

  // Validate status enum
  const validStatuses = ['scheduled', 'inprogress', 'closed', 'postponed', 'cancelled'];
  if (isString(raw.status) && !validStatuses.includes(raw.status)) {
    errors.push(`status: unknown value "${raw.status}"`);
  }

  // Validate ISO date
  if (isString(raw.scheduledAt) && isNaN(Date.parse(raw.scheduledAt))) {
    errors.push('scheduledAt: invalid ISO date string');
  }

  // Scores must be non-negative if present
  if (raw.homeScore !== undefined && (!isNumber(raw.homeScore) || raw.homeScore < 0)) {
    errors.push('homeScore: must be non-negative number');
  }
  if (raw.awayScore !== undefined && (!isNumber(raw.awayScore) || raw.awayScore < 0)) {
    errors.push('awayScore: must be non-negative number');
  }

  return errors.length === 0
    ? { valid: true, data: raw as unknown as RawGame, errors: [] }
    : { valid: false, errors };
}

// ── RawTeamStats validator ────────────────────────────────────────────────────

export function validateRawTeamStats(raw: unknown): SchemaResult<RawTeamStats> {
  const errors: string[] = [];
  if (!isObject(raw)) return { valid: false, errors: ['Not an object'] };

  if (!isString(raw.teamId))    errors.push('teamId: must be string');
  if (!isNumber(raw.gamesPlayed) || raw.gamesPlayed < 0) errors.push('gamesPlayed: must be non-negative number');
  if (!isNumber(raw.wins)       || raw.wins < 0)         errors.push('wins: must be non-negative number');
  if (!isNumber(raw.losses)     || raw.losses < 0)       errors.push('losses: must be non-negative number');
  if (!isNumber(raw.winPct)     || raw.winPct < 0 || raw.winPct > 1) errors.push('winPct: must be 0–1');

  // Wins + losses ≤ gamesPlayed
  if (isNumber(raw.wins) && isNumber(raw.losses) && isNumber(raw.gamesPlayed)) {
    const draws = isNumber(raw.draws) ? raw.draws : 0;
    if (raw.wins + raw.losses + draws > raw.gamesPlayed + 1) { // +1 tolerance for live games
      errors.push('wins + losses + draws exceeds gamesPlayed');
    }
  }

  return errors.length === 0
    ? { valid: true, data: raw as unknown as RawTeamStats, errors: [] }
    : { valid: false, errors };
}

// ── RawInjury validator ───────────────────────────────────────────────────────

export function validateRawInjury(raw: unknown): SchemaResult<RawInjury> {
  const errors: string[] = [];
  if (!isObject(raw)) return { valid: false, errors: ['Not an object'] };

  if (!isString(raw.playerId))   errors.push('playerId: must be string');
  if (!isString(raw.playerName)) errors.push('playerName: must be string');
  if (!isString(raw.teamId))     errors.push('teamId: must be string');
  if (!isString(raw.position))   errors.push('position: must be string');

  const validStatuses = ['questionable', 'doubtful', 'out', 'day-to-day', 'ir'];
  if (!isString(raw.status) || !validStatuses.includes(raw.status)) {
    errors.push(`status: must be one of ${validStatuses.join(', ')}`);
  }

  return errors.length === 0
    ? { valid: true, data: raw as unknown as RawInjury, errors: [] }
    : { valid: false, errors };
}

// ── RawOdds validator ─────────────────────────────────────────────────────────

export function validateRawOdds(raw: unknown): SchemaResult<RawOdds> {
  const errors: string[] = [];
  if (!isObject(raw)) return { valid: false, errors: ['Not an object'] };

  if (!isString(raw.gameId))    errors.push('gameId: must be string');
  if (!isString(raw.bookmaker)) errors.push('bookmaker: must be string');

  // American odds: must be < -100 or > 100
  const isValidAmerican = (v: unknown) =>
    isNumber(v) && (v >= 100 || v <= -100 || v === 0);

  if (!isValidAmerican(raw.homeMoneyline)) errors.push('homeMoneyline: invalid American odds');
  if (!isValidAmerican(raw.awayMoneyline)) errors.push('awayMoneyline: invalid American odds');

  // Over/under must be positive
  if (raw.overUnder !== undefined && (!isNumber(raw.overUnder) || raw.overUnder <= 0)) {
    errors.push('overUnder: must be positive number');
  }

  return errors.length === 0
    ? { valid: true, data: raw as unknown as RawOdds, errors: [] }
    : { valid: false, errors };
}

// ── RawWeather validator ──────────────────────────────────────────────────────

export function validateRawWeather(raw: unknown): SchemaResult<RawWeather> {
  const errors: string[] = [];
  if (!isObject(raw)) return { valid: false, errors: ['Not an object'] };

  if (!isString(raw.venueId))    errors.push('venueId: must be string');

  if (!isNumber(raw.temperature) || raw.temperature < -100 || raw.temperature > 140) {
    errors.push('temperature: must be -100 to 140°F');
  }
  if (!isNumber(raw.humidity) || raw.humidity < 0 || raw.humidity > 100) {
    errors.push('humidity: must be 0–100');
  }
  if (!isNumber(raw.windSpeed) || raw.windSpeed < 0 || raw.windSpeed > 200) {
    errors.push('windSpeed: must be 0–200 mph');
  }

  return errors.length === 0
    ? { valid: true, data: raw as unknown as RawWeather, errors: [] }
    : { valid: false, errors };
}

// ── Batch validation helper ────────────────────────────────────────────────────

export function validateAll<T>(
  items: unknown[],
  validate: (item: unknown) => SchemaResult<T>,
): { valid: T[]; invalid: Array<{ item: unknown; errors: string[] }> } {
  const valid: T[]   = [];
  const invalid: Array<{ item: unknown; errors: string[] }> = [];

  for (const item of items) {
    const result = validate(item);
    if (result.valid && result.data) valid.push(result.data);
    else invalid.push({ item, errors: result.errors });
  }

  return { valid, invalid };
}
