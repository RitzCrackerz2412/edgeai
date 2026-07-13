'use client';

import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

interface LivePriceHeaderProps {
  ticker: string;
  initialPrice: number;
  initialChange: number;
  initialChangePct: number;
  initialMarketState: string;
  initialPreMarketPrice: number | null;
  initialPreMarketChange: number | null;
  initialPostMarketPrice: number | null;
  initialPostMarketChange: number | null;
}

export function LivePriceHeader({
  ticker,
  initialPrice,
  initialChange,
  initialChangePct,
  initialMarketState,
  initialPreMarketPrice,
  initialPreMarketChange,
  initialPostMarketPrice,
  initialPostMarketChange,
}: LivePriceHeaderProps) {
  const [price, setPrice]               = useState(initialPrice);
  const [change, setChange]             = useState(initialChange);
  const [changePct, setChangePct]       = useState(initialChangePct);
  const [marketState, setMarketState]   = useState(initialMarketState);
  const [prePrice, setPrePrice]         = useState(initialPreMarketPrice);
  const [preChange, setPreChange]       = useState(initialPreMarketChange);
  const [postPrice, setPostPrice]       = useState(initialPostMarketPrice);
  const [postChange, setPostChange]     = useState(initialPostMarketChange);
  const [updatedAt, setUpdatedAt]       = useState<Date | null>(null);
  const [refreshing, setRefreshing]     = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const r = await fetch(`/api/finance/quote/${ticker}`);
      const d = await r.json();
      if (d.ok && d.quote) {
        const q = d.quote;
        setPrice(q.price);
        setChange(q.change);
        setChangePct(q.changePct);
        setMarketState(q.marketState);
        setPrePrice(q.preMarketPrice);
        setPreChange(q.preMarketChange);
        setPostPrice(q.postMarketPrice);
        setPostChange(q.postMarketChange);
        setUpdatedAt(new Date());
      }
    } catch { /* silent */ } finally {
      setRefreshing(false);
    }
  }, [ticker]);

  useEffect(() => {
    const id = setInterval(refresh, 30_000);
    return () => clearInterval(id);
  }, [refresh]);

  const pos = changePct >= 0;

  return (
    <div className="flex flex-col gap-1">
      {/* Price */}
      <div className="flex items-end gap-3 mt-2">
        <span className="text-4xl font-black font-mono" style={{ color: 'var(--text-primary)' }}>
          ${price.toFixed(2)}
        </span>
        <div className="flex items-center gap-1.5 mb-1">
          {pos
            ? <TrendingUp size={14} style={{ color: 'var(--success)' }} />
            : <TrendingDown size={14} style={{ color: 'var(--danger)' }} />}
          <span className="text-base font-semibold font-mono" style={{ color: pos ? 'var(--success)' : 'var(--danger)' }}>
            {pos ? '+' : ''}{change.toFixed(2)} ({pos ? '+' : ''}{changePct.toFixed(2)}%)
          </span>
        </div>
      </div>

      {/* Pre/post market */}
      {prePrice && (
        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Pre-market: ${prePrice.toFixed(2)}{' '}
          <span style={{ color: (preChange ?? 0) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            {(preChange ?? 0) >= 0 ? '+' : ''}{preChange?.toFixed(2)}%
          </span>
        </div>
      )}
      {postPrice && (
        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
          After-hours: ${postPrice.toFixed(2)}{' '}
          <span style={{ color: (postChange ?? 0) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            {(postChange ?? 0) >= 0 ? '+' : ''}{postChange?.toFixed(2)}%
          </span>
        </div>
      )}

      {/* Live indicator */}
      <div className="flex items-center gap-1.5 mt-1">
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: marketState === 'REGULAR' ? 'var(--success)' : 'var(--warning)' }}
        />
        <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
          {marketState === 'REGULAR' ? 'Market Open' : marketState === 'PRE' ? 'Pre-Market' : marketState === 'POST' ? 'After Hours' : 'Market Closed'}
        </span>
        <RefreshCw
          size={9}
          className={refreshing ? 'animate-spin' : ''}
          style={{ color: 'var(--text-muted)', opacity: 0.6 }}
        />
        {updatedAt && (
          <span className="text-[10px]" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
            · Updated {updatedAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
          </span>
        )}
      </div>
    </div>
  );
}
