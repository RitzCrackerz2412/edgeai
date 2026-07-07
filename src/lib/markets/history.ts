/**
 * Market accuracy history — tracks EdgeAI vs market consensus over time.
 *
 * For every completed game where we had both a model prediction and market
 * odds, records whether EdgeAI outperformed, matched, or underperformed
 * the market-implied pick.
 *
 * Stored in data/market-history.json alongside game-results.json.
 */

import * as fs   from 'fs';
import * as path from 'path';
import type { MarketAccuracyRecord, MarketPerformanceStats, MarketEdge } from './types';

const DATA_FILE = path.join(process.cwd(), 'data', 'market-history.json');

interface HistoryData {
  version:     number;
  lastUpdated: string;
  records:     MarketAccuracyRecord[];
}

class MarketHistoryStore {
  private data: HistoryData = { version: 1, lastUpdated: '', records: [] };
  private loaded = false;

  private load(): void {
    if (this.loaded) return;
    try {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      this.data = JSON.parse(raw);
    } catch {
      this.data = { version: 1, lastUpdated: '', records: [] };
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
      console.error('[MarketHistory] Save failed:', err);
    }
  }

  record(entry: MarketAccuracyRecord): void {
    this.load();
    if (this.data.records.some(r => r.gameId === entry.gameId)) return; // idempotent
    this.data.records.push(entry);
    if (this.data.records.length > 1000) this.data.records = this.data.records.slice(-1000);
    this.save();
  }

  getStats(sport?: string): MarketPerformanceStats {
    this.load();
    let records = this.data.records;
    if (sport && sport !== 'all') records = records.filter(r => r.sport === sport);

    const n = records.length;
    if (n === 0) {
      return {
        totalGames: 0, modelVsMarketWinRate: 0, agreeAccuracy: 0,
        disagreeAccuracy: 0, strongEdgeAccuracy: 0, avgEdge: 0,
        byClassification: buildEmptyByClass(),
      };
    }

    const agree    = records.filter(r => r.edgeClassification === 'agreement');
    const disagree = records.filter(r => r.edgeClassification !== 'agreement');
    const strong   = records.filter(r => r.edgeClassification === 'strong-model');

    const acc = (arr: MarketAccuracyRecord[]) =>
      arr.length === 0 ? 0 : parseFloat(((arr.filter(r => r.modelCorrect).length / arr.length) * 100).toFixed(1));

    const byClass = buildEmptyByClass();
    for (const r of records) {
      byClass[r.edgeClassification].games++;
      if (r.modelCorrect) byClass[r.edgeClassification].accuracy++;
    }
    for (const k of Object.keys(byClass) as MarketEdge[]) {
      const g = byClass[k].games;
      byClass[k].accuracy = g > 0 ? parseFloat(((byClass[k].accuracy / g) * 100).toFixed(1)) : 0;
    }

    // "Model vs Market" = games where model was right and market pick would have been wrong
    const modelRightMarketWrong = records.filter(r => r.modelCorrect && !r.marketCorrect).length;

    return {
      totalGames:          n,
      modelVsMarketWinRate: parseFloat(((modelRightMarketWrong / Math.max(disagree.length, 1)) * 100).toFixed(1)),
      agreeAccuracy:       acc(agree),
      disagreeAccuracy:    acc(disagree),
      strongEdgeAccuracy:  acc(strong),
      avgEdge:             parseFloat((records.reduce((s, r) => s + Math.abs(r.homeEdge), 0) / n).toFixed(1)),
      byClassification:    byClass,
    };
  }

  getRecent(limit = 20): MarketAccuracyRecord[] {
    this.load();
    return this.data.records.slice(-limit).reverse();
  }
}

function buildEmptyByClass(): Record<MarketEdge, { games: number; accuracy: number }> {
  return {
    'strong-model':    { games: 0, accuracy: 0 },
    'moderate-model':  { games: 0, accuracy: 0 },
    'agreement':       { games: 0, accuracy: 0 },
    'moderate-market': { games: 0, accuracy: 0 },
    'strong-market':   { games: 0, accuracy: 0 },
  };
}

export const marketHistory = new MarketHistoryStore();
