'use client';

/**
 * LiveDataProvider — React context that polls /api/sync/status every 60 seconds
 * and /api/live scores every 30 seconds for active in-game views.
 *
 * Wrap the root layout (or any subtree) with this provider to get real-time
 * data access throughout the component tree.
 *
 * Usage:
 *   const { liveGames, syncMeta, refresh } = useLiveData();
 */

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface SyncMetaEntry {
  lastSyncAt:   string | null;
  gamesUpdated: number;
  errorsCount:  number;
}

interface GameSummary {
  sport:    string;
  live:     number;
  upcoming: number;
  final:    number;
}

interface ProviderStatus {
  name:          string;
  state:         'closed' | 'open' | 'half-open';
  failures:      number;
  lastFailureAt: string | null;
}

export interface LiveDataState {
  // Sync metadata
  syncMeta: Record<string, SyncMetaEntry | null>;
  // Game counts
  totalLive:     number;
  totalUpcoming: number;
  bySport:       GameSummary[];
  // Queue
  queue: { pending: number; running: number; completed: number; failed: number; dead: number };
  // Providers
  providers: ProviderStatus[];
  // Cache
  cache: { hitRate: number; hits: number; misses: number };
  // Recent events
  recentEvents: { event: string; payload: unknown; at: string }[];
  // Meta
  lastFetched: string | null;
  isLoading:   boolean;
  hasError:    boolean;
}

interface LiveDataContextValue extends LiveDataState {
  refresh: () => void;
}

// ── Context ───────────────────────────────────────────────────────────────────

const LiveDataContext = createContext<LiveDataContextValue>({
  syncMeta: {}, totalLive: 0, totalUpcoming: 0, bySport: [],
  queue: { pending: 0, running: 0, completed: 0, failed: 0, dead: 0 },
  providers: [], cache: { hitRate: 0, hits: 0, misses: 0 }, recentEvents: [],
  lastFetched: null, isLoading: false, hasError: false,
  refresh: () => {},
});

// ── Provider ──────────────────────────────────────────────────────────────────

const STATUS_INTERVAL_MS = 60_000;  // 60s polling for sync status
const LIVE_INTERVAL_MS   = 30_000;  // 30s polling when live games are active

export function LiveDataProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<LiveDataState>({
    syncMeta: {}, totalLive: 0, totalUpcoming: 0, bySport: [],
    queue: { pending: 0, running: 0, completed: 0, failed: 0, dead: 0 },
    providers: [], cache: { hitRate: 0, hits: 0, misses: 0 }, recentEvents: [],
    lastFetched: null, isLoading: false, hasError: false,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const res  = await fetch('/api/sync/status', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      setState({
        syncMeta:      data.sync ?? {},
        totalLive:     data.games?.live ?? 0,
        totalUpcoming: data.games?.upcoming ?? 0,
        bySport:       data.games?.bySport ?? [],
        queue:         data.queue ?? { pending: 0, running: 0, completed: 0, failed: 0, dead: 0 },
        providers:     data.providers ?? [],
        cache:         data.cache ?? { hitRate: 0, hits: 0, misses: 0 },
        recentEvents:  data.recentEvents ?? [],
        lastFetched:   data.reportedAt ?? new Date().toISOString(),
        isLoading:     false,
        hasError:      false,
      });
    } catch {
      setState(prev => ({ ...prev, isLoading: false, hasError: true }));
    }
  }, []);

  // Start polling; accelerate to LIVE_INTERVAL_MS when there are live games
  useEffect(() => {
    fetchStatus();

    function schedule() {
      const interval = state.totalLive > 0 ? LIVE_INTERVAL_MS : STATUS_INTERVAL_MS;
      intervalRef.current = setTimeout(async () => {
        await fetchStatus();
        schedule();
      }, interval);
    }

    schedule();
    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = useCallback(() => { fetchStatus(); }, [fetchStatus]);

  return (
    <LiveDataContext.Provider value={{ ...state, refresh }}>
      {children}
    </LiveDataContext.Provider>
  );
}

// ── Hooks ──────────────────────────────────────────────────────────────────────

export function useLiveData() {
  return useContext(LiveDataContext);
}

/** Lightweight hook — just the live game count, for navbar badges etc. */
export function useLiveGameCount(): number {
  return useContext(LiveDataContext).totalLive;
}

/** Sync status for a specific data type (e.g. 'live', 'injuries') */
export function useSyncMeta(type: string): SyncMetaEntry | null {
  return useContext(LiveDataContext).syncMeta[type] ?? null;
}

/** Provider circuit-breaker statuses */
export function useProviderHealth(): ProviderStatus[] {
  return useContext(LiveDataContext).providers;
}
