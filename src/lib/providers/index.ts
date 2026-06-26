/**
 * Provider registry with failover.
 *
 * Sports: ESPN (free, no key) → SportsDataIO (paid, key optional)
 * Weather: Open-Meteo (free, no key) → OpenWeatherMap (key optional)
 * Odds: The Odds API (free tier, key optional)
 *
 * All providers fail silently — callers get empty arrays / null, never throws.
 */

import { ESPNProvider }            from './espn';
import { SportsDataIOProvider }    from './sportsdata';
import { OddsAPIProvider }         from './odds';
import { OpenWeatherMapProvider }  from './weather';
import { OpenMeteoProvider }       from './openmeteo';
import { breakers }                from './circuit-breaker';
import type {
  DataProviders, SportsDataProvider, OddsProvider, WeatherProvider,
  RawGame, RawTeamStats, RawInjury, RawPlayerStats, RawVenue, RawWeather,
} from './types';
import type { Sport } from '../types';

// ── Composite sports provider ─────────────────────────────────────────────────

class CompositeSportsProvider implements SportsDataProvider {
  readonly name = 'Composite (ESPN → SportsDataIO)';
  private espn   = new ESPNProvider();
  private sdio   = new SportsDataIOProvider();

  async getGames(sport: Sport, date: string): Promise<RawGame[]> {
    try {
      const games = await breakers.espn.execute(() => this.espn.getGames(sport, date));
      if (games.length > 0) return games;
    } catch {
      console.warn(`[Sports] ESPN circuit open for ${sport} — falling back to SportsDataIO`);
    }
    try {
      return await breakers.sportsdata.execute(() => this.sdio.getGames(sport, date));
    } catch {
      return [];
    }
  }

  async getTeamStats(teamId: string, season?: string): Promise<RawTeamStats | null> {
    try {
      return await breakers.sportsdata.execute(() => this.sdio.getTeamStats(teamId, season));
    } catch { return null; }
  }

  async getInjuries(teamId: string): Promise<RawInjury[]> {
    try {
      return await breakers.sportsdata.execute(() => this.sdio.getInjuries(teamId));
    } catch { return []; }
  }

  async getPlayerStats(playerId: string, season?: string): Promise<RawPlayerStats | null> {
    try {
      return await breakers.sportsdata.execute(() => this.sdio.getPlayerStats(playerId, season));
    } catch { return null; }
  }

  async getVenue(venueId: string): Promise<RawVenue | null> {
    try {
      return await breakers.sportsdata.execute(() => this.sdio.getVenue(venueId));
    } catch { return null; }
  }
}

// ── Composite weather provider ────────────────────────────────────────────────

class CompositeWeatherProvider implements WeatherProvider {
  readonly name = 'Composite (OpenMeteo → OpenWeatherMap)';
  private openMeteo = new OpenMeteoProvider();
  private owm       = new OpenWeatherMapProvider();

  async getVenueWeather(venueId: string, gameTime: string): Promise<RawWeather | null> {
    try {
      const w = await breakers.openmeteo.execute(
        () => this.openMeteo.getVenueWeather(venueId, gameTime),
      );
      if (w) return w;
    } catch {
      console.warn('[Weather] OpenMeteo circuit open — falling back to OpenWeatherMap');
    }
    try {
      return await breakers.weather.execute(
        () => this.owm.getVenueWeather(venueId, gameTime),
      );
    } catch { return null; }
  }
}

// ── Singleton registry ────────────────────────────────────────────────────────

let _providers: DataProviders | null = null;

export function getProviders(): DataProviders {
  if (!_providers) {
    _providers = {
      sports:  new CompositeSportsProvider(),
      odds:    new OddsAPIProvider(),
      weather: new CompositeWeatherProvider(),
    };
  }
  return _providers;
}

export { breakers, getAllBreakerStatuses } from './circuit-breaker';
export type { DataProviders, SportsDataProvider, OddsProvider, WeatherProvider } from './types';
export type {
  RawGame, RawTeamStats, RawInjury, RawPlayerStats, RawOdds, RawWeather, RawVenue,
} from './types';
