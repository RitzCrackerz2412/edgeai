'use client';

import { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import type { PricePoint } from '@/lib/finance/types';

const RANGES = ['1D', '5D', '1M', '3M', '1Y', '5Y'] as const;
type Range = typeof RANGES[number];

const RANGE_PARAM: Record<Range, string> = {
  '1D': '1d', '5D': '5d', '1M': '1mo', '3M': '3mo', '1Y': '1y', '5Y': '5y',
};

interface PriceChartProps {
  ticker: string;
  currentPrice: number;
  positive: boolean;
}

function fmt(d: string, range: Range): string {
  const date = new Date(d);
  if (range === '1D' || range === '5D') {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function PriceChart({ ticker, currentPrice, positive }: PriceChartProps) {
  const [range, setRange] = useState<Range>('1Y');
  const [data, setData] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard data-fetch pattern
    setLoading(true);
    fetch(`/api/finance/history/${ticker}?range=${RANGE_PARAM[range]}`)
      .then(r => r.json())
      .then(d => { if (d.ok) setData(d.history ?? []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [ticker, range]);

  const color  = positive ? '#22c55e' : '#ef4444';
  const first  = data[0]?.close ?? currentPrice;
  const chartData = data.map(p => ({ ...p, date: p.date }));

  const minClose = Math.min(...data.map(d => d.low  || d.close)) * 0.995;
  const maxClose = Math.max(...data.map(d => d.high || d.close)) * 1.005;

  return (
    <div>
      {/* Range selector */}
      <div className="flex items-center gap-1 mb-3">
        {RANGES.map(r => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className="px-2.5 py-0.5 rounded text-xs font-medium transition-all cursor-pointer"
            style={{
              background: range === r ? color : 'var(--bg-elevated)',
              color:      range === r ? '#fff' : 'var(--text-muted)',
              border:     `1px solid ${range === r ? color : 'var(--border-default)'}`,
            }}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div style={{ height: 240, position: 'relative' }}>
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Loading…</div>
          </div>
        ) : data.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>No data available</div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={color} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="date" tickFormatter={d => fmt(d, range)}
                tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                axisLine={false} tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[minClose, maxClose]}
                tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                axisLine={false} tickLine={false}
                width={60}
                tickFormatter={v => `$${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v.toFixed(0)}`}
              />
              <Tooltip
                contentStyle={{ background: '#1C1C1C', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, fontSize: 12, padding: '8px 12px' }}
                labelStyle={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 4 }}
                formatter={(v: unknown) => [`$${(v as number).toFixed(2)}`, 'Price']}
                labelFormatter={d => fmt(d, range)}
              />
              <ReferenceLine y={first} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
              <Area
                type="monotone" dataKey="close" stroke={color}
                strokeWidth={1.5} fill="url(#chartGrad)"
                dot={false} activeDot={{ r: 3, fill: color }}
                animationDuration={500}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
