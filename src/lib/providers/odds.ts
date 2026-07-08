/**
 * The Odds API adapter — multi-book betting lines and market consensus.
 *
 * Requires ODDS_API_KEY in .env.local — sign up at https://the-odds-api.com/
 * Free tier: 500 requests/month; paid tiers start at $50/mo.
 */

import type { RawOdds, OddsProvider } from './types';
import type { Sport } from '../types';

const BASE = 'https://api.the-odds-api.com/v4';
const KEY = process.env.ODDS_API_KEY ?? '';

// Map sport → default Odds API sport key (fallback when no league hint)
const SPORT_KEYS: Partial<Record<Sport, string>> = {
  NFL:              'americanfootball_nfl',
  NBA:              'basketball_nba',
  MLB:              'baseball_mlb',
  NHL:              'icehockey_nhl',
  Soccer:           'soccer_epl',
  'NCAA Football':  'americanfootball_ncaaf',
  'NCAA Basketball':'basketball_ncaab',
  UFC:              'mma_mixed_martial_arts',
};

// ESPN league name → exact Odds API sport key (avoids multi-request soccer loops)
const LEAGUE_TO_ODDS_KEY: Record<string, string> = {
  'NFL':              'americanfootball_nfl',
  'NBA':              'basketball_nba',
  'MLB':              'baseball_mlb',
  'NHL':              'icehockey_nhl',
  'NCAA Football':    'americanfootball_ncaaf',
  'NCAA Basketball':  'basketball_ncaab',
  'EPL':              'soccer_epl',
  'World Cup':        'soccer_fifa_world_cup',
  'La Liga':          'soccer_spain_la_liga',
  'Bundesliga':       'soccer_germany_bundesliga',
  'Serie A':          'soccer_italy_serie_a',
  'Ligue 1':          'soccer_france_ligue_one',
  'MLS':              'soccer_usa_mls',
  'Liga MX':          'soccer_mexico_ligamx',
  'Eredivisie':       'soccer_netherlands_eredivisie',
  'Champions League': 'soccer_uefa_champs_league',
  'Europa League':    'soccer_uefa_europa',
  'Copa Libertadores':'soccer_conmebol_copa_libertadores',
  'Copa Sudamericana':'soccer_conmebol_copa_sudamericana',
  'UFC':              'mma_mixed_martial_arts',
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

// ── Internal extended type with team names for matching ───────────────────────

interface RawOddsWithTeams extends RawOdds {
  homeTeamName: string;
  awayTeamName: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalize(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function teamsMatch(apiHome: string, apiAway: string, queryHome: string, queryAway: string): boolean {
  const ah = normalize(apiHome), aa = normalize(apiAway);
  const qh = normalize(queryHome), qa = normalize(queryAway);
  const homeMatch = ah === qh || ah.includes(qh) || qh.includes(ah);
  const awayMatch = aa === qa || aa.includes(qa) || qa.includes(aa);
  return homeMatch && awayMatch;
}

function buildConsensus(gameId: string, forGame: RawOddsWithTeams[]): RawOdds {
  const n = forGame.length;
  const avg = (fn: (o: RawOdds) => number) =>
    forGame.reduce((s, o) => s + fn(o), 0) / n;
  return {
    gameId,
    bookmaker: 'consensus',
    homeMoneyline: Math.round(avg(o => o.homeMoneyline)),
    awayMoneyline: Math.round(avg(o => o.awayMoneyline)),
    drawMoneyline: forGame.some(o => o.drawMoneyline)
      ? Math.round(avg(o => o.drawMoneyline ?? 0)) : undefined,
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

// One cached fetch per sport key — Next.js dedupes and revalidates after 1 hour
async function fetchOddsForKey(sportKey: string): Promise<RawOddsWithTeams[]> {
  const url = `${BASE}/sports/${sportKey}/odds?apiKey=${KEY}&regions=us&markets=h2h,spreads,totals`;
  let data: OddsAPIGame[];
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    data = await res.json();
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];

  const results: RawOddsWithTeams[] = [];
  for (const game of data) {
    for (const book of game.bookmakers) {
      const m = parseMarket(book);
      results.push({
        gameId: game.id,
        bookmaker: book.title,
        homeTeamName: game.home_team,
        awayTeamName: game.away_team,
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

// ── Adapter implementation ────────────────────────────────────────────────────

export class OddsAPIProvider implements OddsProvider {
  readonly name = 'TheOddsAPI';

  async getOdds(sport: Sport, _gameId: string): Promise<RawOdds[]> {
    if (!KEY) return [];
    const sportKey = SPORT_KEYS[sport];
    if (!sportKey) return [];
    return fetchOddsForKey(sportKey);
  }

  async getConsensusOdds(sport: Sport, gameId: string): Promise<RawOdds | null> {
    const all = await this.getOdds(sport, gameId) as RawOddsWithTeams[];
    const forGame = all.filter(o => o.gameId === gameId);
    if (forGame.length === 0) return null;
    return buildConsensus(gameId, forGame);
  }

  async findGameOdds(sport: Sport, homeTeam: string, awayTeam: string, league?: string): Promise<RawOdds | null> {
    if (!KEY) return null;
    // Use the precise league key if known — avoids extra API calls
    const sportKey = (league && LEAGUE_TO_ODDS_KEY[league]) ?? SPORT_KEYS[sport];
    if (!sportKey) return null;
    const all = await fetchOddsForKey(sportKey);
    const forGame = all.filter(o => teamsMatch(o.homeTeamName, o.awayTeamName, homeTeam, awayTeam));
    if (forGame.length === 0) return null;
    return buildConsensus(`${homeTeam}-${awayTeam}`, forGame);
  }
}
