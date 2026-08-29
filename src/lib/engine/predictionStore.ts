/**
 * Stores predictions at the time they're made so the cron result-poller
 * can match completed ESPN games back to our stored predictions and
 * trigger processPostGame automatically.
 *
 * Keyed by our internal gameId. When DATABASE_URL is set, also persisted
 * to StoredPredictionRecord so it survives server restarts.
 */

import { getDb } from '../db/client';

export interface PersistedPrediction {
  gameId: string;
  sport: string;
  modelName: string;
  homeTeamName: string;
  awayTeamName: string;
  gameDate: string;           // YYYY-MM-DD
  homeWinProbability: number; // 0-1, calibrated
  predictedHomeScore?: number;
  predictedAwayScore?: number;
  gbdtFeatures: number[];
  predictedAt: string;        // ISO
  /**
   * Per-sub-model calibrated home win probabilities (e.g. {ELO: 0.61,
   * LogisticRegression: 0.64}). Lets validation score each model on its
   * own output so dynamic weights diverge meaningfully. In-memory only —
   * absent for predictions reloaded from the DB after a restart.
   */
  modelProbs?: Record<string, number>;
}

// In-memory cache — warm on startup from DB if available
const store = new Map<string, PersistedPrediction>();
let dbLoaded = false;

async function ensureLoaded(): Promise<void> {
  if (dbLoaded) return;
  dbLoaded = true;
  const db = await getDb();
  if (!db) return;
  try {
    const rows = await db.storedPredictionRecord.findMany({
      where: { resolvedAt: null },
      orderBy: { predictedAt: 'desc' },
      take: 500,
    });
    for (const r of rows) {
      store.set(r.gameId, {
        gameId:              r.gameId,
        sport:               r.sport,
        modelName:           r.modelName,
        homeTeamName:        r.homeTeamName,
        awayTeamName:        r.awayTeamName,
        gameDate:            r.gameDate,
        homeWinProbability:  r.homeWinProbability,
        predictedHomeScore:  r.predictedHomeScore ?? undefined,
        predictedAwayScore:  r.predictedAwayScore ?? undefined,
        gbdtFeatures:        r.gbdtFeatures,
        predictedAt:         r.predictedAt.toISOString(),
      });
    }
  } catch {
    // DB unavailable — continue with empty in-memory store
  }
}

export async function storePrediction(p: PersistedPrediction): Promise<void> {
  await ensureLoaded();
  store.set(p.gameId, p);

  const db = await getDb();
  if (!db) return;
  try {
    await db.storedPredictionRecord.upsert({
      where: { gameId: p.gameId },
      update: {
        homeWinProbability: p.homeWinProbability,
        predictedHomeScore: p.predictedHomeScore,
        predictedAwayScore: p.predictedAwayScore,
        gbdtFeatures: p.gbdtFeatures,
      },
      create: {
        gameId:             p.gameId,
        sport:              p.sport,
        modelName:          p.modelName,
        homeTeamName:       p.homeTeamName,
        awayTeamName:       p.awayTeamName,
        gameDate:           p.gameDate,
        homeWinProbability: p.homeWinProbability,
        predictedHomeScore: p.predictedHomeScore,
        predictedAwayScore: p.predictedAwayScore,
        gbdtFeatures:       p.gbdtFeatures,
      },
    });
  } catch { /* non-fatal */ }
}

export async function getPrediction(gameId: string): Promise<PersistedPrediction | null> {
  await ensureLoaded();
  return store.get(gameId) ?? null;
}

/**
 * Find a stored prediction by fuzzy-matching team names and date.
 * Used by the result cron when ESPN game IDs don't match our internal IDs.
 */
export async function findPredictionByTeams(
  homeTeamName: string,
  awayTeamName: string,
  gameDate: string,
  sport: string,
): Promise<PersistedPrediction | null> {
  await ensureLoaded();
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
  const hn = normalize(homeTeamName);
  const an = normalize(awayTeamName);

  for (const p of store.values()) {
    if (p.sport !== sport) continue;
    if (p.gameDate !== gameDate) continue;
    if (normalize(p.homeTeamName).includes(hn) || hn.includes(normalize(p.homeTeamName))) {
      if (normalize(p.awayTeamName).includes(an) || an.includes(normalize(p.awayTeamName))) {
        return p;
      }
    }
  }
  return null;
}

export async function markResolved(gameId: string): Promise<void> {
  store.delete(gameId);
  const db = await getDb();
  if (!db) return;
  try {
    await db.storedPredictionRecord.updateMany({
      where: { gameId },
      data: { resolvedAt: new Date() },
    });
  } catch { /* non-fatal */ }
}

export function getAllPendingPredictions(): PersistedPrediction[] {
  return Array.from(store.values());
}
