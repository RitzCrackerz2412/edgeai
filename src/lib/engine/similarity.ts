/**
 * Historical similarity engine.
 *
 * Finds past matchups whose feature vectors are most similar to the
 * current game (cosine similarity on the 10-feature logistic vector).
 *
 * Used for the "Games like this" UI panel and as a sanity check
 * against the ensemble prediction.
 */

import type { GameFeatureVector } from '../features/types';

// ── Feature-vector extraction ─────────────────────────────────────────────────
// Mirrors the 10 features used in LogisticRegressionModel (logistic.ts)

function toVector(f: GameFeatureVector): number[] {
  const h = f.home;
  const a = f.away;
  const eloDiff = ((h.eloRating ?? 1500) - (a.eloRating ?? 1500)) / 800;
  return [
    eloDiff,
    f.home.isHome ? 1 : 0,
    h.momentumScore - a.momentumScore,
    (h.restDays - a.restDays) / 7,
    h.offensiveRating - a.offensiveRating,
    h.defensiveRating - a.defensiveRating,
    (h.injuryImpact ?? 0) - (a.injuryImpact ?? 0),
    (a.travelFatigue ?? 0) - (h.travelFatigue ?? 0),
    0, // SOS diff — not stored in feature vector currently
    h.recentForm - a.recentForm,
  ];
}

function magnitude(v: number[]): number {
  return Math.sqrt(v.reduce((s, x) => s + x * x, 0));
}

function dotProduct(a: number[], b: number[]): number {
  return a.reduce((s, x, i) => s + x * b[i], 0);
}

function cosineSimilarity(a: number[], b: number[]): number {
  const mag = magnitude(a) * magnitude(b);
  if (mag === 0) return 0;
  return dotProduct(a, b) / mag;
}

// ── Historical game record ────────────────────────────────────────────────────

export interface HistoricalGame {
  id: string;
  date: string;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  homeWon: boolean;
  predictedHomeWinProb: number;
  features: GameFeatureVector;
}

export interface SimilarGame {
  game: HistoricalGame;
  similarity: number;    // cosine similarity [0, 1]
  homeWon: boolean;
  correctPrediction: boolean;
}

export interface SimilarityResult {
  topMatches: SimilarGame[];
  historicalHomeWinRate: number;
  historicalAccuracy: number;
  averageSimilarity: number;
}

// ── Similarity engine ─────────────────────────────────────────────────────────

export class SimilarityEngine {
  private games: HistoricalGame[] = [];

  addGame(game: HistoricalGame): void {
    this.games.push(game);
  }

  addGames(games: HistoricalGame[]): void {
    this.games.push(...games);
  }

  get size(): number {
    return this.games.length;
  }

  /**
   * Find the top-K most similar historical games to the given feature vector.
   * Returns games sorted by similarity descending.
   */
  findSimilar(features: GameFeatureVector, topK = 5): SimilarityResult {
    if (this.games.length === 0) {
      return {
        topMatches: [],
        historicalHomeWinRate: 0.5,
        historicalAccuracy: 0.5,
        averageSimilarity: 0,
      };
    }

    const queryVec = toVector(features);

    const scored = this.games.map((game) => {
      const gameVec = toVector(game.features);
      const similarity = cosineSimilarity(queryVec, gameVec);
      const correctPrediction =
        (game.predictedHomeWinProb >= 0.5) === game.homeWon;
      return {
        game,
        similarity,
        homeWon: game.homeWon,
        correctPrediction,
      };
    });

    scored.sort((a, b) => b.similarity - a.similarity);
    const topMatches = scored.slice(0, topK);

    const homeWins = topMatches.filter((m) => m.homeWon).length;
    const correctPreds = topMatches.filter((m) => m.correctPrediction).length;
    const sumSim = topMatches.reduce((s, m) => s + m.similarity, 0);

    return {
      topMatches,
      historicalHomeWinRate: topMatches.length > 0 ? homeWins / topMatches.length : 0.5,
      historicalAccuracy: topMatches.length > 0 ? correctPreds / topMatches.length : 0.5,
      averageSimilarity: topMatches.length > 0 ? sumSim / topMatches.length : 0,
    };
  }
}

// ── Singleton + seed data ─────────────────────────────────────────────────────

export const similarityEngine = new SimilarityEngine();

/**
 * Seed the engine with mock historical games.
 * In production these would come from the database.
 */
export function seedMockHistory(games: HistoricalGame[]): void {
  similarityEngine.addGames(games);
}
