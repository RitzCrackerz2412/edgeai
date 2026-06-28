/**
 * Sync event bus — lightweight typed event emitter for data change notifications.
 *
 * Consumers (prediction refresh, SSE broadcaster, cache invalidator) subscribe
 * to events. Producers (sync jobs) emit when data changes.
 *
 * In production this can be replaced with Redis Pub/Sub or BullMQ events
 * for multi-process deployments — the interface stays the same.
 */

type Listener<T = unknown> = (payload: T) => void;

// ── Event catalog ─────────────────────────────────────────────────────────────

export interface SyncEvents {
  // Live game data
  'live:score':         { gameId: string; score: import('./store').LiveScore };
  'game:final':         { gameId: string; score: import('./store').LiveScore };
  // Schedules
  'schedule:updated':   { sport: string; date: string; count: number };
  // Roster / player changes
  'injuries:changed':   { sport: string; changed: import('../providers/types').RawInjury[] };
  'player:traded':      { playerId: string; fromTeam: string; toTeam: string };
  'player:stats-updated': { playerId: string };
  // Team
  'team:stats-updated': { teamId: string };
  // Standings / rankings
  'standings:updated':  { sport: string };
  'rankings:updated':   { sport: string };
  // Odds
  'odds:line-moved':    { gameId: string; prev: import('../providers/types').RawOdds; current: import('../providers/types').RawOdds };
}

export type SyncEventName = keyof SyncEvents;

// ── Bus implementation ────────────────────────────────────────────────────────

class SyncEventBus {
  private listeners = new Map<string, Set<Listener>>();
  private history: { event: string; payload: unknown; at: string }[] = [];
  private readonly maxHistory = 200;

  on<E extends SyncEventName>(event: E, listener: Listener<SyncEvents[E]>): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(listener as Listener);
    // Return unsubscribe function
    return () => this.off(event, listener);
  }

  off<E extends SyncEventName>(event: E, listener: Listener<SyncEvents[E]>): void {
    this.listeners.get(event)?.delete(listener as Listener);
  }

  emit<E extends SyncEventName>(event: E, payload: SyncEvents[E]): void {
    // Record in history ring buffer
    this.history.push({ event, payload, at: new Date().toISOString() });
    if (this.history.length > this.maxHistory) this.history.shift();

    const listeners = this.listeners.get(event);
    if (!listeners?.size) return;
    for (const fn of listeners) {
      try { fn(payload); } catch { /* never crash the bus */ }
    }
  }

  /** Last N events — used by the SSE broadcaster and monitoring dashboard */
  getRecent(n = 50): typeof this.history {
    return this.history.slice(-n);
  }

  listenerCount(event: SyncEventName): number {
    return this.listeners.get(event)?.size ?? 0;
  }
}

export const syncBus = new SyncEventBus();

// ── Prediction refresh wiring ─────────────────────────────────────────────────
// When injury status, line movement, or a final score arrives, trigger a
// prediction refresh for affected games.

syncBus.on('injuries:changed', ({ sport, changed }) => {
  if (changed.length === 0) return;
  // Deferred import avoids circular dependency
  import('./prediction-refresh')
    .then(m => m.refreshPredictionsForSport(sport as import('../types').Sport))
    .catch(() => {});
});

syncBus.on('odds:line-moved', ({ gameId }) => {
  import('./prediction-refresh')
    .then(m => m.refreshPredictionForGame(gameId))
    .catch(() => {});
});

syncBus.on('game:final', ({ gameId }) => {
  // Invalidate prediction cache so next fetch is fresh
  import('../cache')
    .then(({ getCache }) => getCache().del(`prediction:${gameId}`))
    .catch(() => {});
});
