/**
 * Environment feature extractor.
 *
 * Converts venue + weather data into an EnvironmentFeatureVector.
 * For indoor venues, weather effects are zeroed out.
 */

import type { RawWeather, RawVenue } from '../providers/types';
import type { EnvironmentFeatureVector } from './types';
import { weatherScore, altitudePenalty, clamp } from './normalize';

// ── Static venue metadata (fallback when provider unavailable) ───────────────
// Static fallback — replace with SportsDataIO Stadium endpoint when API key is set

interface VenueDefaults {
  altitudeFeet: number;
  isIndoor: boolean;
  capacity: number;
  latitude: number;
  longitude: number;
}

const VENUE_DEFAULTS: Record<string, VenueDefaults> = {
  'arrowhead-stadium':    { altitudeFeet: 930,   isIndoor: false, capacity: 76416, latitude: 39.0489, longitude: -94.4839 },
  'td-garden':            { altitudeFeet: 20,    isIndoor: true,  capacity: 19156, latitude: 42.3662, longitude: -71.0621 },
  'yankee-stadium':       { altitudeFeet: 55,    isIndoor: false, capacity: 54251, latitude: 40.8296, longitude: -73.9262 },
  'ball-arena':           { altitudeFeet: 5280,  isIndoor: true,  capacity: 19099, latitude: 39.7487, longitude: -105.0076 },
  'etihad-stadium':       { altitudeFeet: 120,   isIndoor: false, capacity: 53400, latitude: 53.4831, longitude: -2.2004 },
  't-mobile-arena':       { altitudeFeet: 2001,  isIndoor: true,  capacity: 20000, latitude: 36.1028, longitude: -115.1784 },
};

const SEA_LEVEL_FT = 0; // reference altitude for away teams from sea-level cities

// ── Haversine distance (km) between two lat/lon points ───────────────────────

export function haversineKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Timezone offset estimation from longitude ─────────────────────────────────

function longitudeToTimezoneHours(lon: number): number {
  return lon / 15;
}

// ── Main extractor ────────────────────────────────────────────────────────────

export interface EnvironmentInput {
  venueId: string;
  awayTeamHomeLat?: number;
  awayTeamHomeLon?: number;
  awayTeamHomeAltitudeFeet?: number;
}

export function extractEnvironmentFeatures(
  input: EnvironmentInput,
  weather?: RawWeather | null,
  venue?: RawVenue | null,
): EnvironmentFeatureVector {
  const defaults = VENUE_DEFAULTS[input.venueId.toLowerCase()];

  const altitudeFt     = venue?.altitudeFeet ?? defaults?.altitudeFeet ?? 0;
  const isIndoor       = venue?.isIndoor     ?? defaults?.isIndoor     ?? false;
  const capacity       = venue?.capacity     ?? defaults?.capacity     ?? 20000;
  const venueLat       = venue?.latitude     ?? defaults?.latitude     ?? 39.0;
  const venueLon       = venue?.longitude    ?? defaults?.longitude    ?? -95.0;

  // Away team's home altitude (sea-level default for unknown)
  const awayHomeFt = input.awayTeamHomeAltitudeFeet ?? SEA_LEVEL_FT;
  const altitudeDelta  = altitudeFt - awayHomeFt;

  // Travel distance
  const awayLat = input.awayTeamHomeLat ?? venueLat;
  const awayLon = input.awayTeamHomeLon ?? venueLon;
  const travelKm = haversineKm(awayLat, awayLon, venueLat, venueLon);

  // Timezone shift (east→west = positive, causes early-morning wake-ups for travelers)
  const venueTimezone = longitudeToTimezoneHours(venueLon);
  const awayTimezone  = longitudeToTimezoneHours(awayLon);
  const timezoneDelta = Math.round(awayTimezone - venueTimezone);

  // Weather
  const tempF     = weather?.temperature    ?? 70;
  const windMph   = weather?.windSpeed      ?? 0;
  const precipMm  = weather?.precipitationMm ?? 0;
  const wScore    = weatherScore(tempF, windMph, precipMm, isIndoor);

  // Crowd advantage — estimated from capacity utilization (proxy: always near-full for important games)
  const crowdAdv = clamp(capacity / 80_000, 0, 1); // normalized to largest stadiums

  return {
    venueId: input.venueId,
    altitudeFeet: altitudeFt,
    altitudeDeltaFeet: altitudeDelta,
    isIndoor,
    temperatureFahrenheit: isIndoor ? 70 : tempF,
    windSpeedMph: isIndoor ? 0 : windMph,
    precipitationMm: isIndoor ? 0 : precipMm,
    weatherScore: wScore,
    crowdAdvantage: crowdAdv,
    awayTravelKm: travelKm,
    awayTimezoneDelta: timezoneDelta,
  };
}
