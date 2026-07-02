/**
 * Results store — persists real game outcomes and accumulates per-team stats.
 *
 * Writes to data/game-results.json at the project root so results survive
 * server restarts without requiring a database.
 *
 * Per-team stats tracked:
 *   - Rolling offensiveRating  (avg points scored, last 20 games)
 *   - Rolling defensiveRating  (avg points allowed, last 20 games)
 *   - Home/away splits
 *   - Win/loss record and momentum
 *   - ELO rating (updated via FiveThirtyEight formula)
 */

import * as fs from 'fs';
import * as path from 'path';

// ── File path ─────────────────────────────────────────────────────────────────

const DATA_FILE = path.join(process.cwd(), 'data', 'game-results.json');

// ── Types ─────────────────────────────────────────────────────────────────────

export interface StoredGame {
  gameId:     string;
  sport:      string;
  league:     string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore:  number;
  awayScore:  number;
  date:       string;
  status:     string;
  recordedAt: string;
}

export interface TeamAccumulatedStats {
  teamId:             string;
  sport:              string;
  gamesPlayed:        number;
  wins:               number;
  losses:             number;
  homeGames:          number;
  homeWins:           number;
  homeLosses:         number;
  awayGames:          number;
  awayWins:           number;
  awayLosses:         number;
  totalFor:           number;
  totalAgainst:       number;
  homeFor:            number;
  homeAgainst:        number;
  awayFor:            number;
  awayAgainst:        number;
  // Rolling windows for recency-weighted ratings
  recentScoresFor:    number[];  // last 20 scores (own points)
  recentScoresAgainst: number[]; // last 20 scores (opponent points)
  recentResults:      ('W' | 'L' | 'D')[]; // last 10 game outcomes
  eloRating:          number;
  offRatingRolling:   number;    // weighted avg of recent scores
  defRatingRolling:   number;
  lastUpdated:        string;
}

interface ResultsData {
  version:     number;
  lastUpdated: string;
  games:       StoredGame[];
  teamStats:   Record<string, TeamAccumulatedStats>;
}

// ── Defaults ──────────────────────────────────────────────────────────────────

function emptyTeamStats(teamId: string, sport: string, baseElo = 1500): TeamAccumulatedStats {
  return {
    teamId, sport,
    gamesPlayed: 0, wins: 0, losses: 0,
    homeGames: 0, homeWins: 0, homeLosses: 0,
    awayGames: 0, awayWins: 0, awayLosses: 0,
    totalFor: 0, totalAgainst: 0,
    homeFor: 0, homeAgainst: 0,
    awayFor: 0, awayAgainst: 0,
    recentScoresFor: [], recentScoresAgainst: [],
    recentResults: [],
    eloRating: baseElo,
    offRatingRolling: 0,
    defRatingRolling: 0,
    lastUpdated: new Date().toISOString(),
  };
}

// ── Store class ───────────────────────────────────────────────────────────────

class ResultsStore {
  private data: ResultsData = { version: 1, lastUpdated: '', games: [], teamStats: {} };
  private loaded = false;

  private load(): void {
    if (this.loaded) return;
    try {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      this.data = JSON.parse(raw);
    } catch {
      this.data = { version: 1, lastUpdated: '', games: [], teamStats: {} };
    }
    this.loaded = true;
  }

  private save(): void {
    try {
      const dir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      this.data.lastUpdated = new Date().toISOString();
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[ResultsStore] Failed to save:', err);
    }
  }

  /** Returns true if this exact game was already recorded */
  hasGame(gameId: string): boolean {
    this.load();
    return this.data.games.some(g => g.gameId === gameId);
  }

  /** Record a completed game and update both teams' rolling stats */
  recordGame(game: StoredGame, homeBaseElo: number, awayBaseElo: number): void {
    this.load();

    if (this.hasGame(game.gameId)) return; // idempotent

    this.data.games.push(game);

    // Cap stored game history to most recent 500
    if (this.data.games.length > 500) {
      this.data.games = this.data.games.slice(-500);
    }

    this.updateTeamStats(game.homeTeamId, game.sport, true,  game.homeScore, game.awayScore, homeBaseElo);
    this.updateTeamStats(game.awayTeamId, game.sport, false, game.awayScore, game.homeScore, awayBaseElo);

    this.save();
  }

  private updateTeamStats(
    teamId: string,
    sport: string,
    isHome: boolean,
    pointsFor: number,
    pointsAgainst: number,
    baseElo: number,
  ): void {
    if (!this.data.teamStats[teamId]) {
      this.data.teamStats[teamId] = emptyTeamStats(teamId, sport, baseElo);
    }
    const s = this.data.teamStats[teamId];
    const won = pointsFor > pointsAgainst;
    const draw = pointsFor === pointsAgainst;

    s.gamesPlayed++;
    s.totalFor     += pointsFor;
    s.totalAgainst += pointsAgainst;

    if (won) s.wins++; else if (!draw) s.losses++;
    if (isHome) {
      s.homeGames++;
      s.homeFor     += pointsFor;
      s.homeAgainst += pointsAgainst;
      if (won) s.homeWins++; else if (!draw) s.homeLosses++;
    } else {
      s.awayGames++;
      s.awayFor     += pointsFor;
      s.awayAgainst += pointsAgainst;
      if (won) s.awayWins++; else if (!draw) s.awayLosses++;
    }

    // Rolling windows (last 20 games, most recent appended at end)
    const WINDOW = 20;
    s.recentScoresFor.push(pointsFor);
    s.recentScoresAgainst.push(pointsAgainst);
    if (s.recentScoresFor.length > WINDOW) s.recentScoresFor.shift();
    if (s.recentScoresAgainst.length > WINDOW) s.recentScoresAgainst.shift();

    // Recent results (last 10)
    s.recentResults.push(won ? 'W' : draw ? 'D' : 'L');
    if (s.recentResults.length > 10) s.recentResults.shift();

    // ELO update (FiveThirtyEight formula, K=20 per result)
    const K = 20;
    const expected = 1 / (1 + Math.pow(10, (this.getOpponentElo(sport) - s.eloRating) / 400));
    const actual = won ? 1 : draw ? 0.5 : 0;
    s.eloRating = Math.round(s.eloRating + K * (actual - expected));

    // Recency-weighted rolling ratings: more recent games count double
    const weights = s.recentScoresFor.map((_, i) => 1 + i / s.recentScoresFor.length);
    const wTotal = weights.reduce((a, b) => a + b, 0);
    s.offRatingRolling = parseFloat(
      (s.recentScoresFor.reduce((sum, v, i) => sum + v * weights[i], 0) / wTotal).toFixed(2)
    );
    s.defRatingRolling = parseFloat(
      (s.recentScoresAgainst.reduce((sum, v, i) => sum + v * weights[i], 0) / wTotal).toFixed(2)
    );

    s.lastUpdated = new Date().toISOString();
  }

  // Placeholder opponent ELO for ELO delta when we don't have the opponent's updated rating yet
  private getOpponentElo(sport: string): number {
    const defaults: Record<string, number> = { NFL: 1500, NBA: 1500, MLB: 1500, NHL: 1500, Soccer: 1500 };
    return defaults[sport] ?? 1500;
  }

  getTeamStats(teamId: string): TeamAccumulatedStats | null {
    this.load();
    return this.data.teamStats[teamId] ?? null;
  }

  getAllStats(): Record<string, TeamAccumulatedStats> {
    this.load();
    return this.data.teamStats;
  }

  getRecentGames(limit = 50): StoredGame[] {
    this.load();
    return this.data.games.slice(-limit);
  }

  getSummary(): { totalGames: number; totalTeams: number; lastUpdated: string } {
    this.load();
    return {
      totalGames: this.data.games.length,
      totalTeams: Object.keys(this.data.teamStats).length,
      lastUpdated: this.data.lastUpdated,
    };
  }
}

export const resultsStore = new ResultsStore();
