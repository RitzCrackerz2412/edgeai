/**
 * The Odds API — player props fetcher.
 *
 * Fetches Over/Under player prop lines from multiple sportsbooks,
 * then passes through the EV engine to produce PropEVAnalysis[].
 */

import type { PlayerProp, PropEVAnalysis, PropMarket, BookLine } from './types';
import { MARKET_LABELS } from './types';
import { analyzeProp } from './ev';
import type { Sport } from '../types';

const BASE    = 'https://api.the-odds-api.com/v4';
const API_KEY = process.env.ODDS_API_KEY ?? '';

// ── Sport → Odds API sport key ────────────────────────────────────────────────

const SPORT_KEYS: Partial<Record<Sport, string>> = {
  NBA:              'basketball_nba',
  NFL:              'americanfootball_nfl',
  MLB:              'baseball_mlb',
  NHL:              'icehockey_nhl',
  'NCAA Basketball':'basketball_ncaab',
  'NCAA Football':  'americanfootball_ncaaf',
};

// ── Default prop markets per sport ───────────────────────────────────────────

const SPORT_MARKETS: Partial<Record<Sport, PropMarket[]>> = {
  NBA: ['player_points', 'player_rebounds', 'player_assists', 'player_threes'],
  NFL: ['player_pass_yds', 'player_rush_yds', 'player_reception_yds', 'player_receptions', 'player_tds'],
  MLB: ['pitcher_strikeouts', 'batter_hits', 'batter_home_runs', 'batter_rbis'],
  NHL: ['player_points', 'player_goals', 'player_assists'] as PropMarket[],
  'NCAA Basketball': ['player_points', 'player_rebounds', 'player_assists'],
};

// ── Odds API response shapes ──────────────────────────────────────────────────

interface OddsAPIOutcome {
  name:        string;
  description: string; // player name
  price:       number; // decimal odds
  point:       number; // prop line value
}

interface OddsAPIMarket {
  key:      string;
  outcomes: OddsAPIOutcome[];
}

interface OddsAPIBookmaker {
  key:         string;
  title:       string;
  last_update: string;
  markets:     OddsAPIMarket[];
}

interface OddsAPIEvent {
  id:             string;
  sport_key:      string;
  home_team:      string;
  away_team:      string;
  commence_time:  string;
  bookmakers:     OddsAPIBookmaker[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function decimalToAmerican(d: number): number {
  if (d >= 2) return Math.round((d - 1) * 100);
  return Math.round(-100 / (d - 1));
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// ── Fetch events list ─────────────────────────────────────────────────────────

async function fetchEvents(sportKey: string): Promise<{ id: string; home: string; away: string; time: string }[]> {
  const url = `${BASE}/sports/${sportKey}/events?apiKey=${API_KEY}`;
  try {
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) return [];
    const data: { id: string; home_team: string; away_team: string; commence_time: string }[] = await res.json();
    return data.map(e => ({ id: e.id, home: e.home_team, away: e.away_team, time: e.commence_time }));
  } catch {
    return [];
  }
}

// ── Fetch player props for a specific event ────────────────────────────────────

async function fetchEventProps(
  sportKey: string,
  eventId: string,
  markets: PropMarket[],
): Promise<OddsAPIEvent | null> {
  const marketsParam = markets.join(',');
  const url = `${BASE}/sports/${sportKey}/events/${eventId}/odds?apiKey=${API_KEY}&regions=us&markets=${marketsParam}&oddsFormat=decimal`;
  try {
    const res = await fetch(url, { next: { revalidate: 900 } }); // 15 min cache
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ── Parse event props into PlayerProp[] ──────────────────────────────────────

function parseEventProps(event: OddsAPIEvent): PlayerProp[] {
  // Group by player + market
  const propMap = new Map<string, {
    player: string; team: string; line: number; market: PropMarket;
    overLines: BookLine[];
  }>();

  for (const book of event.bookmakers) {
    for (const market of book.markets) {
      const marketKey = market.key as PropMarket;
      if (!(marketKey in MARKET_LABELS)) continue;

      // Group outcomes by player + point
      const byPlayer = new Map<string, { over?: OddsAPIOutcome; under?: OddsAPIOutcome }>();
      for (const o of market.outcomes) {
        const key = `${o.description}::${o.point}`;
        if (!byPlayer.has(key)) byPlayer.set(key, {});
        const entry = byPlayer.get(key)!;
        if (o.name === 'Over')  entry.over  = o;
        if (o.name === 'Under') entry.under = o;
      }

      for (const [playerKey, sides] of byPlayer) {
        if (!sides.over || !sides.under) continue;
        const player = sides.over.description;
        const line   = sides.over.point;
        const mapKey = `${player}::${marketKey}::${line}`;

        if (!propMap.has(mapKey)) {
          propMap.set(mapKey, {
            player, team: '', line, market: marketKey,
            overLines: [],
          });
        }

        const entry = propMap.get(mapKey)!;
        entry.overLines.push({ book: book.title, overOdds: decimalToAmerican(sides.over.price), underOdds: decimalToAmerican(sides.under.price) });
      }
    }
  }

  const props: PlayerProp[] = [];
  for (const entry of propMap.values()) {
    if (entry.overLines.length === 0) continue;
    // Consensus: average over/under odds across books
    const avgOver  = entry.overLines.reduce((s, b) => s + b.overOdds, 0)  / entry.overLines.length;
    const avgUnder = entry.overLines.reduce((s, b) => s + b.underOdds, 0) / entry.overLines.length;

    props.push({
      player:      entry.player,
      team:        entry.team,
      market:      entry.market,
      marketLabel: MARKET_LABELS[entry.market],
      line:        entry.line,
      overOdds:    Math.round(avgOver),
      underOdds:   Math.round(avgUnder),
      bookLines:   entry.overLines,
      booksCount:  entry.overLines.length,
    });
  }
  return props;
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface FetchedGame {
  eventId: string;
  home:    string;
  away:    string;
  time:    string;
  props:   PropEVAnalysis[];
}

/** Get all today's +EV props for a sport */
export async function getAllEVProps(sport: Sport, minEdge = 2): Promise<FetchedGame[]> {
  if (!API_KEY) return getMockEVProps(sport);

  const sportKey = SPORT_KEYS[sport];
  if (!sportKey) return [];

  const markets = SPORT_MARKETS[sport] ?? ['player_points'] as PropMarket[];
  const events  = await fetchEvents(sportKey);

  const results: FetchedGame[] = [];
  for (const event of events.slice(0, 8)) { // limit API calls
    const data = await fetchEventProps(sportKey, event.id, markets);
    if (!data) continue;

    const rawProps = parseEventProps(data);
    const analyzed = rawProps.map(analyzeProp).filter(p => p.bestEdgePct >= minEdge);
    analyzed.sort((a, b) => b.bestEdgePct - a.bestEdgePct);

    results.push({ eventId: event.id, home: event.home, away: event.away, time: event.time, props: analyzed });
  }
  return results;
}

/** Get props for a specific game by matching team names */
export async function getGameEVProps(
  sport: Sport,
  homeTeam: string,
  awayTeam: string,
): Promise<PropEVAnalysis[]> {
  if (!API_KEY) return getMockGameProps(homeTeam, awayTeam);

  const sportKey = SPORT_KEYS[sport];
  if (!sportKey) return [];

  const markets = SPORT_MARKETS[sport] ?? ['player_points'] as PropMarket[];
  const events  = await fetchEvents(sportKey);

  const match = events.find(e =>
    (normalize(e.home).includes(normalize(homeTeam)) || normalize(homeTeam).includes(normalize(e.home))) &&
    (normalize(e.away).includes(normalize(awayTeam)) || normalize(awayTeam).includes(normalize(e.away))),
  );
  if (!match) return [];

  const data = await fetchEventProps(sportKey, match.id, markets);
  if (!data) return [];

  return parseEventProps(data).map(analyzeProp).sort((a, b) => b.bestEdgePct - a.bestEdgePct);
}

// ── Mock data (no API key) ────────────────────────────────────────────────────

function getMockGameProps(home: string, away: string): PropEVAnalysis[] {
  const homeName = home.split(' ').pop() ?? home;
  const awayName = away.split(' ').pop() ?? away;

  const raw: PlayerProp[] = [
    {
      player: `${homeName} Star`,
      team: home,
      market: 'player_points',
      marketLabel: 'Points',
      line: 24.5,
      overOdds: -130,
      underOdds: +110,
      bookLines: [
        { book: 'DraftKings', overOdds: -130, underOdds: +108 },
        { book: 'FanDuel',    overOdds: -132, underOdds: +112 },
        { book: 'BetMGM',     overOdds: -128, underOdds: +108 },
      ],
      booksCount: 3,
    },
    {
      player: `${awayName} Guard`,
      team: away,
      market: 'player_assists',
      marketLabel: 'Assists',
      line: 7.5,
      overOdds: -115,
      underOdds: -105,
      bookLines: [
        { book: 'DraftKings', overOdds: -118, underOdds: -102 },
        { book: 'FanDuel',    overOdds: -112, underOdds: -108 },
      ],
      booksCount: 2,
    },
    {
      player: `${homeName} Forward`,
      team: home,
      market: 'player_rebounds',
      marketLabel: 'Rebounds',
      line: 8.5,
      overOdds: +105,
      underOdds: -125,
      bookLines: [
        { book: 'DraftKings', overOdds: +102, underOdds: -122 },
        { book: 'FanDuel',    overOdds: +108, underOdds: -128 },
      ],
      booksCount: 2,
    },
    {
      player: `${awayName} Center`,
      team: away,
      market: 'player_threes',
      marketLabel: '3-Pointers',
      line: 2.5,
      overOdds: -140,
      underOdds: +118,
      bookLines: [
        { book: 'DraftKings', overOdds: -138, underOdds: +116 },
        { book: 'FanDuel',    overOdds: -142, underOdds: +120 },
      ],
      booksCount: 2,
    },
  ];

  return raw.map(analyzeProp).sort((a, b) => b.bestEdgePct - a.bestEdgePct);
}

function getMockEVProps(sport: Sport): FetchedGame[] {
  const games = sport === 'NBA'
    ? [
        { home: 'Boston Celtics',  away: 'Miami Heat',         time: new Date().toISOString() },
        { home: 'LA Lakers',       away: 'Golden State Warriors', time: new Date().toISOString() },
        { home: 'Denver Nuggets',  away: 'Phoenix Suns',       time: new Date().toISOString() },
      ]
    : [
        { home: 'Kansas City Chiefs', away: 'San Francisco 49ers', time: new Date().toISOString() },
        { home: 'Dallas Cowboys',     away: 'Philadelphia Eagles', time: new Date().toISOString() },
      ];

  return games.map((g, i) => ({
    eventId: `mock-${i}`,
    home: g.home,
    away: g.away,
    time: g.time,
    props: getMockGameProps(g.home, g.away),
  }));
}
