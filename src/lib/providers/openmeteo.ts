/**
 * Open-Meteo weather adapter — completely free, no API key required.
 * Used as primary weather source; OpenWeatherMap (keyed) as fallback.
 *
 * Docs: https://open-meteo.com/en/docs
 * Free tier: unlimited requests, no rate limits for non-commercial use.
 */

import { apiFetch } from './client';
import type { RawWeather, WeatherProvider } from './types';

const BASE = 'https://api.open-meteo.com/v1';

function wmoDescription(code: number): string {
  if (code === 0)             return 'Clear sky';
  if (code <= 3)              return 'Partly cloudy';
  if (code <= 48)             return 'Foggy';
  if (code <= 55)             return 'Drizzle';
  if (code <= 65)             return 'Rainy';
  if (code <= 75)             return 'Snowy';
  if (code <= 82)             return 'Rain showers';
  if (code <= 99)             return 'Thunderstorm';
  return 'Unknown';
}

// Venue lat/lon table — shared with OpenWeatherMap adapter
export const VENUE_COORDS: Record<string, { lat: number; lon: number; isIndoor: boolean }> = {
  'arrowhead-stadium':   { lat: 39.0489,  lon: -94.4839,   isIndoor: false },
  'td-garden':           { lat: 42.3662,  lon: -71.0621,   isIndoor: true  },
  'yankee-stadium':      { lat: 40.8296,  lon: -73.9262,   isIndoor: false },
  'ball-arena':          { lat: 39.7487,  lon: -105.0076,  isIndoor: true  },
  't-mobile-arena':      { lat: 36.1028,  lon: -115.1784,  isIndoor: true  },
  'lambeau-field':       { lat: 44.5013,  lon: -88.0622,   isIndoor: false },
  'sofi-stadium':        { lat: 33.9535,  lon: -118.3388,  isIndoor: false },
  'metlife-stadium':     { lat: 40.8135,  lon: -74.0745,   isIndoor: false },
  'gillette-stadium':    { lat: 42.0909,  lon: -71.2643,   isIndoor: false },
  'wrigley-field':       { lat: 41.9484,  lon: -87.6553,   isIndoor: false },
  'fenway-park':         { lat: 42.3467,  lon: -71.0972,   isIndoor: false },
  'oracle-park':         { lat: 37.7786,  lon: -122.3893,  isIndoor: false },
  'dodger-stadium':      { lat: 34.0739,  lon: -118.2400,  isIndoor: false },
  'camden-yards':        { lat: 39.2838,  lon: -76.6216,   isIndoor: false },
  'coors-field':         { lat: 39.7559,  lon: -104.9942,  isIndoor: false },
  'truist-park':         { lat: 33.8908,  lon: -84.4677,   isIndoor: false },
  'petco-park':          { lat: 32.7076,  lon: -117.1570,  isIndoor: false },
  'great-american-ball-park': { lat: 39.0974, lon: -84.5082, isIndoor: false },
};

interface OpenMeteoResponse {
  current: {
    temperature_2m:  number;   // °F (requested in fahrenheit)
    wind_speed_10m:  number;   // mph (requested in mph)
    precipitation:   number;   // mm
    weather_code:    number;   // WMO weather interpretation code
  };
}

export class OpenMeteoProvider implements WeatherProvider {
  readonly name = 'OpenMeteo';

  async getVenueWeather(venueId: string, _gameTime: string): Promise<RawWeather | null> {
    const key = venueId.toLowerCase().replace(/\s+/g, '-');
    const coords = VENUE_COORDS[key];
    if (!coords) return null;

    if (coords.isIndoor) {
      return {
        venueId,
        temperature:    70,
        feelsLike:      70,
        humidity:       40,
        windSpeed:       0,
        windDirection:   0,
        precipitationMm: 0,
        condition:      'Indoor (climate controlled)',
        isIndoor:       true,
        fetchedAt:      new Date().toISOString(),
      };
    }

    try {
      const data = await apiFetch<OpenMeteoResponse>(
        `${BASE}/forecast` +
        `?latitude=${coords.lat}&longitude=${coords.lon}` +
        `&current=temperature_2m,wind_speed_10m,precipitation,weather_code` +
        `&temperature_unit=fahrenheit&wind_speed_unit=mph`,
        { rateLimitKey: 'openmeteo', timeoutMs: 6_000, retries: 1 },
      );

      return {
        venueId,
        temperature:    Math.round(data.current.temperature_2m),
        feelsLike:      Math.round(data.current.temperature_2m),
        humidity:       50,  // requires hourly endpoint
        windSpeed:      Math.round(data.current.wind_speed_10m),
        windDirection:  0,
        precipitationMm: data.current.precipitation,
        condition:      wmoDescription(data.current.weather_code),
        isIndoor:       false,
        fetchedAt:      new Date().toISOString(),
      };
    } catch {
      return null;
    }
  }
}
