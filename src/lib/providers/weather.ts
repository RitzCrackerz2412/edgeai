/**
 * OpenWeatherMap adapter — venue weather at game time.
 *
 * Requires OPENWEATHERMAP_API_KEY in .env.local — sign up at https://openweathermap.org/api
 * Free tier: 60 calls/min, current + 5-day forecast.
 */

import { apiFetch } from './client';
import type { RawWeather, WeatherProvider } from './types';

const BASE = 'https://api.openweathermap.org/data/2.5';
const KEY = process.env.OPENWEATHERMAP_API_KEY ?? '';

// Static venue lat/lon table — replace with DB lookup or RawVenue coords from SportsDataIO when available.
const VENUE_COORDS: Record<string, { lat: number; lon: number; isIndoor: boolean }> = {
  'arrowhead-stadium':    { lat: 39.0489, lon: -94.4839, isIndoor: false },
  'td-garden':            { lat: 42.3662, lon: -71.0621, isIndoor: true  },
  'yankee-stadium':       { lat: 40.8296, lon: -73.9262, isIndoor: false },
  'ball-arena':           { lat: 39.7487, lon: -105.0076, isIndoor: true  },
  'etihad-stadium':       { lat: 53.4831, lon: -2.2004,  isIndoor: false },
  't-mobile-arena':       { lat: 36.1028, lon: -115.1784, isIndoor: true  },
};

// ── Raw OpenWeatherMap response shape (current weather) ──────────────────────

interface OWMWeather {
  main: {
    temp: number;          // Kelvin
    feels_like: number;
    humidity: number;      // 0-100
  };
  wind: {
    speed: number;         // m/s
    deg: number;
  };
  rain?: { '1h'?: number };
  snow?: { '1h'?: number };
  weather: Array<{ description: string }>;
}

// ── Conversion helpers ────────────────────────────────────────────────────────

function kelvinToFahrenheit(k: number): number {
  return (k - 273.15) * 9 / 5 + 32;
}

function msToMph(ms: number): number {
  return ms * 2.237;
}

// ── Adapter implementation ────────────────────────────────────────────────────

export class OpenWeatherMapProvider implements WeatherProvider {
  readonly name = 'OpenWeatherMap';

  async getVenueWeather(venueId: string, _gameTime: string): Promise<RawWeather | null> {
    if (!KEY) {
      console.warn('[OpenWeatherMap] No API key configured — returning null weather');
      return null;
    }

    const coords = VENUE_COORDS[venueId.toLowerCase()];
    if (!coords) {
      console.warn(`[OpenWeatherMap] Unknown venue "${venueId}" — no coordinates found`);
      return null;
    }

    if (coords.isIndoor) {
      return {
        venueId,
        temperature: 70,
        feelsLike: 70,
        humidity: 40,
        windSpeed: 0,
        windDirection: 0,
        precipitationMm: 0,
        condition: 'Indoor (controlled)',
        isIndoor: true,
        fetchedAt: new Date().toISOString(),
      };
    }

    // For future game times: use /forecast?lat={lat}&lon={lon}&appid={KEY}
    // Current endpoint is used as a proxy for now.
    const data = await apiFetch<OWMWeather>(
      `${BASE}/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${KEY}`,
      { rateLimitKey: 'weather' },
    );

    const precipMm = (data.rain?.['1h'] ?? 0) + (data.snow?.['1h'] ?? 0);

    return {
      venueId,
      temperature: Math.round(kelvinToFahrenheit(data.main.temp)),
      feelsLike: Math.round(kelvinToFahrenheit(data.main.feels_like)),
      humidity: data.main.humidity,
      windSpeed: Math.round(msToMph(data.wind.speed)),
      windDirection: data.wind.deg,
      precipitationMm: precipMm,
      condition: data.weather[0]?.description ?? 'unknown',
      isIndoor: false,
      fetchedAt: new Date().toISOString(),
    };
  }
}
