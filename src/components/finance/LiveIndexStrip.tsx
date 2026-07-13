'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import type { IndexQuote, MarketMover, SectorPerf } from '@/lib/finance/types';
import { SectorHeatmap } from './SectorHeatmap';
import { MarketMoverTable } from './MarketMoverTable';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface LiveIndexStripProps {
  initialIndices: IndexQuote[];
  initialMarketState: string;
}

export function LiveIndexStrip({ initialIndices, initialMarketState }: LiveIndexStripProps) {
  const [indices, setIndices]           = useState(initialIndices);
  const [marketState, setMarketState]   = useState(initialMarketState);
  const [updatedAt, setUpdatedAt]       = useState<Date | null>(null);
  const [refreshing, setRefreshing]     = useState(false);

  const MAJOR = ['^GSPC', '^DJI', '^IXIC', '^RUT', '^VIX'];

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const r = await fetch('/api/finance/markets');
      const d = await r.json();
      if (d.ok && d.overview) {
        setIndices(d.overview.indices ?? []);
        setMarketState(d.overview.marketState ?? 'CLOSED');
        setUpdatedAt(new Date());
      }
    } catch { /* silent */ } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const id = setInterval(refresh, 60_000);
    return () => clearInterval(id);
  }, [refresh]);

  const major = indices.filter(i => MAJOR.includes(i.symbol));

  return (
    <div
      className="flex gap-4 overflow-x-auto no-scrollbar py-3 px-4 rounded-xl"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
    >
      <div className="flex items-center gap-1.5 shrink-0 pr-4" style={{ borderRight: '1px solid var(--border-subtle)' }}>
        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: marketState === 'REGULAR' ? 'var(--success)' : 'var(--danger)' }} />
        <span className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>
          {marketState === 'REGULAR' ? 'Markets Open' : 'Markets Closed'}
        </span>
        <RefreshCw
          size={8}
          className={refreshing ? 'animate-spin' : ''}
          style={{ color: 'var(--text-muted)', opacity: 0.5, marginLeft: 2 }}
        />
      </div>

      {major.map(idx => {
        const pos = idx.changePct >= 0;
        return (
          <div key={idx.symbol} className="flex items-center gap-2 shrink-0">
            <div>
              <div className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>{idx.name}</div>
              <div className="text-sm font-bold font-mono" style={{ color: 'var(--text-primary)' }}>
                {idx.symbol === '^VIX' ? idx.price.toFixed(2) : idx.price.toLocaleString('en-US', { maximumFractionDigits: 2 })}
              </div>
            </div>
            <span className="text-xs font-semibold font-mono" style={{ color: pos ? 'var(--success)' : 'var(--danger)' }}>
              {pos ? '+' : ''}{idx.changePct.toFixed(2)}%
            </span>
          </div>
        );
      })}

      {updatedAt && (
        <div className="ml-auto shrink-0 flex items-center">
          <span className="text-[9px]" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
            {updatedAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
          </span>
        </div>
      )}
    </div>
  );
}

interface LiveMoversProps {
  initialGainers: MarketMover[];
  initialLosers: MarketMover[];
  initialActives: MarketMover[];
}

export function LiveMovers({ initialGainers, initialLosers, initialActives }: LiveMoversProps) {
  const [gainers, setGainers]   = useState(initialGainers);
  const [losers, setLosers]     = useState(initialLosers);
  const [actives, setActives]   = useState(initialActives);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const r = await fetch('/api/finance/markets');
      const d = await r.json();
      if (d.ok && d.overview) {
        setGainers(d.overview.gainers ?? []);
        setLosers(d.overview.losers ?? []);
        setActives(d.overview.actives ?? []);
      }
    } catch { /* silent */ } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const id = setInterval(refresh, 60_000);
    return () => clearInterval(id);
  }, [refresh]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {[
        { label: 'Top Gainers',  Icon: TrendingUp,   color: 'var(--success)', movers: gainers },
        { label: 'Top Losers',   Icon: TrendingDown, color: 'var(--danger)',  movers: losers },
        { label: 'Most Active',  Icon: Activity,     color: 'var(--info)',    movers: actives },
      ].map(({ label, Icon, color, movers }) => (
        <div key={label} className="rounded-2xl p-4 space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
          <div className="flex items-center gap-2">
            <Icon size={13} style={{ color }} />
            <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>{label}</span>
            {refreshing && <RefreshCw size={9} className="animate-spin ml-auto" style={{ color: 'var(--text-muted)', opacity: 0.5 }} />}
          </div>
          <MarketMoverTable movers={movers} title="" />
        </div>
      ))}
    </div>
  );
}

interface LiveSectorProps {
  initialSectors: SectorPerf[];
}

export function LiveSector({ initialSectors }: LiveSectorProps) {
  const [sectors, setSectors] = useState(initialSectors);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch('/api/finance/markets');
      const d = await r.json();
      if (d.ok && d.overview?.sectors) setSectors(d.overview.sectors);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    const id = setInterval(refresh, 60_000);
    return () => clearInterval(id);
  }, [refresh]);

  return <SectorHeatmap sectors={sectors} />;
}
