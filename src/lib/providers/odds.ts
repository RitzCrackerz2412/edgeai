/**
 * The Odds API adapter — multi-book betting lines and market consensus.
 *
 * Requires ODDS_API_KEY in .env.local — sign up at https://the-odds-api.com/
 * Free tier: 500 requests/month; paid tiers start at $50/mo.
 */

import { apiFetch } from './client';
import type { RawOdds, OddsProvider } from './types';
import type { Sport } from '../types';

const BASE = 'https://api.the-odds-api.com/v4';
const KEY = process.env.ODDS_API_KEY ?? '';

// Map our Sport names to The Odds API sport keys
const SPORT_KEYS: Partial<Record<Sport, string>> = {
  NFL: 'americanfootball_nfl',
  NBA: 'basketball_nba',
  MLB: 'baseball_mlb',
  NHL: 'icehockey_nhl',
  Soccer: 'soccer_epl',
  'NCAA Football': 'americanfootball_ncaaf',
  'NCAA Basketball': 'basketball_ncaab',
  UFC: 'mma_mixed_martial_arts',
};

// ── Raw Odds API response shapes ─────────────────────────────────────────────

interface OddsAPIOutcome {
  name: string;
  price: number; // decimal odds
}

interface OddsAPIMarket {
  key: string; // 'h2h', 'spreads', 'totals'
  outcomes: OddsAPIOutcome[];
}

interface OddsAPIBookmaker {
  key: string;
  title: string;
  last_update: string;
  markets: OddsAPIMarket[];
}

interface OddsAPIGame {
  id: string;
  sport_key: string;
  home_team: string;
  away_team: string;
  commence_time: string;
  bookmakers: OddsAPIBookmaker[];
}

// ── Conversion helpers ────────────────────────────────────────────────────────

/** Decimal odds → American odds */
function decimalToAmerican(decimal: number): number {
  if (decimal >= 2) return Math.round((decimal - 1) * 100);
  return Math.round(-100 / (decimal - 1));
}

function parseMarket(bookmaker: OddsAPIBookmaker): {
  homeML?: number; awayML?: number; drawML?: number;
  homeSpread?: number; awaySpread?: number;
  total?: number;
} {
  const result: {
    homeML?: number; awayML?: number; drawML?: number;
    homeSpread?: number; awaySpread?: number;
    total?: number;
  } = {};

  for (const market of bookmaker.markets) {
    if (market.key === 'h2h') {
      for (const o of market.outcomes) {
        if (o.name === 'Draw') result.drawML = decimalToAmerican(o.price);
        else if (market.outcomes.indexOf(o) === 0) result.homeML = decimalToAmerican(o.price);
        else result.awayML = decimalToAmerican(o.price);
      }
    } else if (market.key === 'spreads') {
      const homeOutcome = market.outcomes[0];
      const awayOutcome = market.outcomes[1];
      if (homeOutcome) result.homeSpread = homeOutcome.price;
      if (awayOutcome) result.awaySpread = awayOutcome.price;
    } else if (market.key === 'totals') {
      result.total = market.outcomes[0]?.price;
    }
  }

  return result;
}

// ── Adapter implementation ────────────────────────────────────────────────────

export class OddsAPIProvider implements OddsProvider {
  readonly name = 'TheOddsAPI';

  async getOdds(sport: Sport, _gameId: string): Promise<RawOdds[]> {
    if (!KEY) {
      console.warn('[OddsAPI] No API key configured — returning empty odds');
      return [];
    }

    const sportKey = SPORT_KEYS[sport];
    if (!sportKey) return [];

    const games = await apiFetch<OddsAPIGame[]>(
      `${BASE}/sports/${sportKey}/odds?apiKey=${KEY}&regions=us&markets=h2h,spreads,totals`,
      { rateLimitKey: 'odds' },
    );

    const results: RawOdds[] = [];

    for (const game of games) {
      for (const book of game.bookmakers) {
        const m = parseMarket(book);
        results.push({
          gameId: game.id,
          bookmaker: book.title,
          homeMoneyline: m.homeML ?? 0,
          awayMoneyline: m.awayML ?? 0,
          drawMoneyline: m.drawML,
          homeSpread: m.homeSpread ?? 0,
          awaySpread: m.awaySpread ?? 0,
          homeSpreadOdds: -110,
          awaySpreadOdds: -110,
          overUnder: m.total ?? 0,
          overOdds: -110,
          underOdds: -110,
          updatedAt: book.last_update,
        });
      }
    }

    return results;
  }

  async getConsensusOdds(sport: Sport, gameId: string): Promise<RawOdds | null> {
    const allOdds = await this.getOdds(sport, gameId);
    const forGame = allOdds.filter(o => o.gameId === gameId);
    if (forGame.length === 0) return null;

    // Average across bookmakers for consensus
    const n = forGame.length;
    const avg = (fn: (o: RawOdds) => number) =>
      forGame.reduce((s, o) => s + fn(o), 0) / n;

    return {
      gameId,
      bookmaker: 'consensus',
      homeMoneyline: Math.round(avg(o => o.homeMoneyline)),
      awayMoneyline: Math.round(avg(o => o.awayMoneyline)),
      homeSpread: avg(o => o.homeSpread),
      awaySpread: avg(o => o.awaySpread),
      homeSpreadOdds: -110,
      awaySpreadOdds: -110,
      overUnder: avg(o => o.overUnder),
      overOdds: -110,
      underOdds: -110,
      updatedAt: new Date().toISOString(),
    };
  }
}
