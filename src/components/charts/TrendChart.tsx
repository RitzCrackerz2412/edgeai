'use client';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

interface TrendPoint {
  game: string;
  primary: number;
  secondary?: number;
}

interface TrendChartProps {
  data: TrendPoint[];
  primaryLabel?: string;
  secondaryLabel?: string;
  primaryColor?: string;
  secondaryColor?: string;
  height?: number;
}

export function TrendChart({
  data,
  primaryLabel = 'Primary',
  secondaryLabel = 'Secondary',
  primaryColor = '#6366f1',
  secondaryColor = '#22c55e',
  height = 180,
}: TrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="gradPrimary" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={primaryColor}   stopOpacity={0.3} />
            <stop offset="95%" stopColor={primaryColor}   stopOpacity={0}   />
          </linearGradient>
          <linearGradient id="gradSecondary" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={secondaryColor} stopOpacity={0.25} />
            <stop offset="95%" stopColor={secondaryColor} stopOpacity={0}    />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis
          dataKey="game"
          tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-strong)',
            borderRadius: '8px',
            fontSize: '12px',
            color: 'var(--text-primary)',
          }}
          labelStyle={{ color: 'var(--text-secondary)' }}
        />
        <Area
          type="monotone"
          dataKey="primary"
          name={primaryLabel}
          stroke={primaryColor}
          strokeWidth={2}
          fill="url(#gradPrimary)"
          dot={false}
          activeDot={{ r: 4, fill: primaryColor, stroke: 'var(--bg-base)', strokeWidth: 2 }}
        />
        {data[0]?.secondary !== undefined && (
          <Area
            type="monotone"
            dataKey="secondary"
            name={secondaryLabel}
            stroke={secondaryColor}
            strokeWidth={2}
            fill="url(#gradSecondary)"
            dot={false}
            activeDot={{ r: 4, fill: secondaryColor, stroke: 'var(--bg-base)', strokeWidth: 2 }}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}
