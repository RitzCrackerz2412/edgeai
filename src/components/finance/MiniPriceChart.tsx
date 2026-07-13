'use client';

import { LineChart, Line, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts';

interface MiniPriceChartProps {
  data: { date: string; close: number }[];
  positive: boolean;
  height?: number;
}

export function MiniPriceChart({ data, positive, height = 48 }: MiniPriceChartProps) {
  const color = positive ? '#22c55e' : '#ef4444';
  if (data.length < 2) return <div style={{ height }} />;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`grad-${positive ? 'pos' : 'neg'}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <ReferenceLine y={data[0]?.close} stroke="rgba(255,255,255,0.06)" strokeDasharray="2 2" />
        <Tooltip
          contentStyle={{ background: '#1C1C1C', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, fontSize: 11, padding: '4px 8px' }}
          itemStyle={{ color: '#F0F0F0' }}
          formatter={(v: unknown) => [`$${(v as number).toFixed(2)}`, '']}
          labelFormatter={() => ''}
        />
        <Line
          type="monotone" dataKey="close" stroke={color}
          strokeWidth={1.5} dot={false} animationDuration={400}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
