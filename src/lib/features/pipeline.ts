/**
 * Feature pipeline.
 *
 * Takes a Game object (from types.ts) plus optional live data and
 * assembles a complete GameFeatureVector ready for prediction models.
 *
 * Call extractFeatures(game) to get features from mock/existing data.
 * Call extractFeaturesLive(game, providers) to enrich with live API data.
 */

import type { Game } from '../types';
import type { DataProviders, RawInjury } from '../providers/types';
import type { GameFeatureVector, DerivedFeatures, FeatureMeta } from './types';
import { extractTeamFeatures, type TeamContextInput } from './team';
import { extractPlayerFeaturesFromInjury, aggregatePlayerImpact } from './player';
import { extractEnvironmentFeatures, haversineKm } from './environment';
import { clamp, minMax } from './normalize';

// ── Venue ID from game venue string ──────────────────────────────────────────

function venueIdFromString(venue: string): string {
  return venue.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-');
}

// ── Rest days from mock (approximate) ────────────────────────────────────────
//
// Without a game schedule database, we approximate rest days from
// the 'last5' form field and sport schedules.

function estimateRestDays(sport: string): { home: number; away: number } {
  // Conservative defaults based on typical inter-game gaps per sport
  const defaults: Record<string, number> = {
    NBA: 2, NFL: 7, MLB: 1, NHL: 2, Soccer: 7, UFC: 56, default: 4,
  };
  const days = defaults[sport] ?? defaults.default;
  return { home: days, away: days };
}

// ── Derived difference features ───────────────────────────────────────────────

function computeDerived(
  homeElo: number, awayElo: number,
  homeOff: number, awayOff: number,
  homeDef: number, awayDef: number,
  homeForm: number, awayForm: number,
  homeInjury: number, awayInjury: number,
  homeRest: number, awayRest: number,
): DerivedFeatures {
  const eloDiff = homeElo - awayElo;
  return {
    eloDiff,
    eloDiffNormalized: clamp(eloDiff / 400, -2, 2),
    formDiff: homeForm - awayForm,
    injuryAdvantage: homeInjury - awayInjury,
    restAdvantage: homeRest - awayRest,
    offRatingDiff: (homeOff - awayOff) / 0.4, // normalized to ~[-1,+1]
    defRatingDiff: (awayDef - homeDef) / 0.4, // positive = home better defense
    overallStrengthDiff: clamp(
      (eloDiff / 400) * 0.5 +
      (homeOff - awayOff) * 0.25 +
      (awayDef - homeDef) * 0.25,
      -1, 1,
    ),
  };
}

// ── Feature meta ──────────────────────────────────────────────────────────────

function buildMeta(
  gameId: string,
  missingFields: string[],
  dataFreshnessSeconds: number,
): FeatureMeta {
  const qualityScore = clamp(1 - missingFields.length * 0.08, 0.2, 1);
  return {
    gameId,
    generatedAt: new Date().toISOString(),
    dataFreshnessSeconds,
    missingFields,
    qualityScore,
  };
}

// ── Primary entry point (mock data) ──────────────────────────────────────────

export function extractFeatures(game: Game): GameFeatureVector {
  const missing: string[] = [];
  const rest = estimateRestDays(game.sport);

  const homeContext: TeamContextInput = {
    restDays: rest.home,
    isHome: true,
    travelDistanceKm: 0,
    timezoneDeltaHours: 0,
    opponentElo: game.awayTeam.eloRating,
  };

  const awayContext: TeamContextInput = {
    restDays: rest.away,
    isHome: false,
    travelDistanceKm: 800, // mock default travel
    timezoneDeltaHours: 1,  // mock default
    opponentElo: game.homeTeam.eloRating,
  };

  // Extract team injury data from existing mock injuries array
  const homeInjuries: RawInjury[] = game.homeTeam.injuries.map(inj => ({
    playerId: `${game.homeTeam.id}-${inj.player.toLowerCase().replace(/\s+/g, '-')}`,
    playerName: inj.player,
    teamId: game.homeTeam.id,
    position: inj.position,
    status: inj.status.toLowerCase() as RawInjury['status'],
    description: inj.detail,
    impactLevel: inj.impact,
    updatedAt: new Date().toISOString(),
  }));

  const awayInjuries: RawInjury[] = game.awayTeam.injuries.map(inj => ({
    playerId: `${game.awayTeam.id}-${inj.player.toLowerCase().replace(/\s+/g, '-')}`,
    playerName: inj.player,
    teamId: game.awayTeam.id,
    position: inj.position,
    status: inj.status.toLowerCase() as RawInjury['status'],
    description: inj.detail,
    impactLevel: inj.impact,
    updatedAt: new Date().toISOString(),
  }));

  // h2h win rate derived from existing headToHead data
  const h2hTotal = game.headToHead.allTime.home + game.headToHead.allTime.away;
  const homeH2H  = h2hTotal > 0 ? game.headToHead.allTime.home / h2hTotal : 0.5;
  const awayH2H  = 1 - homeH2H;

  const home = extractTeamFeatures(game.homeTeam, homeContext, null, homeInjuries, homeH2H);
  const away = extractTeamFeatures(game.awayTeam, awayContext, null, awayInjuries, awayH2H);

  if (game.homeTeam.injuries.length === 0 && game.awayTeam.injuries.length === 0) {
    // Not necessarily missing — healthy teams have empty arrays
  }

  // Player features from injury lists
  const homePlayers = homeInjuries.map(extractPlayerFeaturesFromInjury);
  const awayPlayers = awayInjuries.map(extractPlayerFeaturesFromInjury);

  // Environment
  const venueId = venueIdFromString(game.venue);
  const mockWeather = game.weather
    ? {
        venueId,
        temperature: game.weather.temp,
        feelsLike: game.weather.temp - 3,
        humidity: game.weather.humidity,
        windSpeed: game.weather.wind,
        windDirection: 180,
        precipitationMm: 0,
        condition: game.weather.condition,
        isIndoor: false,
        fetchedAt: new Date().toISOString(),
      }
    : null;

  const environment = extractEnvironmentFeatures({ venueId }, mockWeather);

  const derived = computeDerived(
    home.eloRating, away.eloRating,
    home.offensiveRating, away.offensiveRating,
    home.defensiveRating, away.defensiveRating,
    home.recentForm, away.recentForm,
    home.injuryImpact, away.injuryImpact,
    home.restDays, away.restDays,
  );

  return {
    meta: buildMeta(game.id, missing, 0),
    home,
    away,
    homePlayers,
    awayPlayers,
    environment,
    derived,
  };
}

// ── Live enrichment entry point ────────────────────────────────────────────────

export async function extractFeaturesLive(
  game: Game,
  providers: DataProviders,
): Promise<GameFeatureVector> {
  const base = extractFeatures(game); // start from mock baseline
  const missing: string[] = [...base.meta.missingFields];

  try {
    // Live injuries
    const [homeInjuries, awayInjuries] = await Promise.all([
      providers.sports.getInjuries(game.homeTeam.id),
      providers.sports.getInjuries(game.awayTeam.id),
    ]);

    const homeCtx: TeamContextInput = {
      restDays: base.home.restDays,
      isHome: true,
      travelDistanceKm: 0,
      timezoneDeltaHours: 0,
      opponentElo: game.awayTeam.eloRating,
    };
    const awayCtx: TeamContextInput = {
      restDays: base.away.restDays,
      isHome: false,
      travelDistanceKm: base.away.travelDistanceKm,
      timezoneDeltaHours: base.away.timezoneDeltaHours,
      opponentElo: game.homeTeam.eloRating,
    };

    const homeTeamFeatures = extractTeamFeatures(
      game.homeTeam, homeCtx, null, homeInjuries,
    );
    const awayTeamFeatures = extractTeamFeatures(
      game.awayTeam, awayCtx, null, awayInjuries,
    );

    // Live weather
    const venueId = venueIdFromString(game.venue);
    const weather = await providers.weather.getVenueWeather(venueId, game.date);
    if (!weather) missing.push('weather');

    const environment = extractEnvironmentFeatures({ venueId }, weather);

    const derived = computeDerived(
      homeTeamFeatures.eloRating, awayTeamFeatures.eloRating,
      homeTeamFeatures.offensiveRating, awayTeamFeatures.offensiveRating,
      homeTeamFeatures.defensiveRating, awayTeamFeatures.defensiveRating,
      homeTeamFeatures.recentForm, awayTeamFeatures.recentForm,
      homeTeamFeatures.injuryImpact, awayTeamFeatures.injuryImpact,
      homeTeamFeatures.restDays, awayTeamFeatures.restDays,
    );

    return {
      meta: buildMeta(game.id, missing, 0),
      home: homeTeamFeatures,
      away: awayTeamFeatures,
      homePlayers: homeInjuries.map(extractPlayerFeaturesFromInjury),
      awayPlayers: awayInjuries.map(extractPlayerFeaturesFromInjury),
      environment,
      derived,
    };
  } catch {
    // Fall back to mock-based features if live fetch fails
    missing.push('live_data_fetch_failed');
    return { ...base, meta: buildMeta(game.id, missing, 99999) };
  }
}
