/**
 * Client-side search engine with fuzzy matching.
 *
 * Supports searching across:
 *  - Teams (name, abbreviation, sport, league)
 *  - Players (name, position, team)
 *  - Games (matchup, date, venue)
 *  - Sports
 *  - Leagues
 *  - Venues
 *
 * Fuzzy matching: trigram overlap (fast, no dep) — production upgrade: Fuse.js or Algolia.
 */

import type { Sport } from '../types';

export type SearchEntityType = 'team' | 'player' | 'game' | 'sport' | 'league' | 'venue';

export interface SearchResult {
  id: string;
  type: SearchEntityType;
  title: string;
  subtitle: string;
  sport?: Sport;
  url: string;
  score: number;   // [0, 1] — relevance
  metadata?: Record<string, unknown>;
}

// ── Trigram similarity ────────────────────────────────────────────────────────

function trigrams(s: string): Set<string> {
  const padded = `  ${s.toLowerCase()}  `;
  const tg = new Set<string>();
  for (let i = 0; i < padded.length - 2; i++) {
    tg.add(padded.slice(i, i + 3));
  }
  return tg;
}

export function trigramSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const tA = trigrams(a);
  const tB = trigrams(b);
  let intersection = 0;
  for (const t of tA) { if (tB.has(t)) intersection++; }
  return (2 * intersection) / (tA.size + tB.size);
}

// ── Searchable index entry ────────────────────────────────────────────────────

interface IndexEntry {
  result: Omit<SearchResult, 'score'>;
  /** All text fields to search against, pre-lowercased */
  searchText: string;
}

// ── Search index ──────────────────────────────────────────────────────────────

class SearchIndex {
  private entries: IndexEntry[] = [];

  add(result: Omit<SearchResult, 'score'>, additionalTerms: string[] = []): void {
    const text = [result.title, result.subtitle, result.sport ?? '', ...additionalTerms]
      .join(' ')
      .toLowerCase();
    this.entries.push({ result, searchText: text });
  }

  addAll(results: Array<Omit<SearchResult, 'score'> & { terms?: string[] }>): void {
    for (const r of results) {
      const { terms, ...rest } = r;
      this.add(rest, terms ?? []);
    }
  }

  search(query: string, opts: { maxResults?: number; minScore?: number; type?: SearchEntityType } = {}): SearchResult[] {
    if (!query.trim()) return [];

    const q = query.toLowerCase().trim();
    const maxResults = opts.maxResults ?? 20;
    const minScore   = opts.minScore ?? 0.1;

    const scored: SearchResult[] = [];

    for (const entry of this.entries) {
      if (opts.type && entry.result.type !== opts.type) continue;

      // Exact prefix match scores highest
      const exactPrefix = entry.searchText.includes(q);
      const similarity  = trigramSimilarity(q, entry.searchText);

      const score = exactPrefix
        ? Math.max(0.6, similarity)
        : similarity;

      if (score >= minScore) {
        scored.push({ ...entry.result, score });
      }
    }

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);
  }

  clear(): void { this.entries = []; }
  get size(): number { return this.entries.length; }
}

export const searchIndex = new SearchIndex();

// ── Populate index from mock data ─────────────────────────────────────────────
// Called lazily on first search request.

let indexed = false;

export async function ensureIndexed(): Promise<void> {
  if (indexed) return;
  indexed = true;

  // Import all data lazily to avoid circular deps
  const { ALL_TEAMS }      = await import('@/lib/data/teams/index');
  const { PLAYER_DETAILS } = await import('@/lib/playerData');
  const { ALL_SPORTS, SPORT_CONFIGS } = await import('@/lib/data/sports');
  const { ALL_LEAGUES }    = await import('@/lib/data/leagues');

  // Teams — all 500+ from every league
  for (const team of ALL_TEAMS) {
    searchIndex.add({
      id:       team.id,
      type:     'team',
      title:    team.name,
      subtitle: `${team.sport} · ${team.league}`,
      sport:    team.sport as Sport,
      url:      `/team/${team.id}`,
    }, [team.abbreviation]);
  }

  // Players from detailed profiles
  for (const player of Object.values(PLAYER_DETAILS)) {
    searchIndex.add({
      id:       player.id,
      type:     'player',
      title:    player.name,
      subtitle: `${player.position} · ${player.teamId}`,
      url:      `/player/${player.id}`,
    });
  }

  // Leagues
  for (const league of ALL_LEAGUES) {
    searchIndex.add({
      id:       `league-${league.id}`,
      type:     'league',
      title:    league.name,
      subtitle: `${league.sport} · ${league.country}`,
      sport:    league.sport as Sport,
      url:      `/league/${league.id}`,
    }, [league.shortName]);
  }

  // Sports
  for (const sport of ALL_SPORTS) {
    const cfg = SPORT_CONFIGS[sport];
    if (!cfg) continue;
    searchIndex.add({
      id:       sport,
      type:     'sport',
      title:    cfg.displayName,
      subtitle: `${cfg.leagues.length} league(s)`,
      sport,
      url:      `/?sport=${sport}`,
    }, [cfg.shortName]);
  }
}
