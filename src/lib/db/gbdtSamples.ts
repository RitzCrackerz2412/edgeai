/**
 * DB operations for GBDT training samples.
 * All functions are no-ops when DATABASE_URL is not set — falls back to
 * the in-memory store in learning.ts.
 */

import { getDb } from './client';
import type { GBDTTrainingSample } from '../engine/gbdt';

export async function persistGBDTSample(
  features: number[],
  outcome: 0 | 1,
  gameId?: string,
  sport?: string,
  source: 'live' | 'backfill' = 'live',
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    await db.gBDTSample.create({ data: { gameId, sport, features, outcome, source } });
  } catch (e) {
    console.error('[DB] persistGBDTSample failed:', e);
  }
}

export async function loadGBDTSamplesFromDb(): Promise<GBDTTrainingSample[]> {
  const db = await getDb();
  if (!db) return [];
  try {
    const rows = await db.gBDTSample.findMany({
      orderBy: { createdAt: 'asc' },
      select: { features: true, outcome: true },
    });
    return rows.map((r: { features: number[]; outcome: number }) => ({
      features: r.features,
      outcome: r.outcome,
    }));
  } catch {
    return [];
  }
}

export async function countGBDTSamples(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  try {
    return await db.gBDTSample.count();
  } catch {
    return 0;
  }
}

export async function backfillSamplesExist(): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  try {
    const count = await db.gBDTSample.count({ where: { source: 'backfill' } });
    return count > 0;
  } catch {
    return false;
  }
}
