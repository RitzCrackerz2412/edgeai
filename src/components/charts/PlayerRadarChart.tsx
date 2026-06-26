'use client';

import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Tooltip,
  Legend,
} from 'recharts';

interface RadarPoint {
  metric: string;
  value: number;
  avg: number;
}

export function PlayerRadarChart({ data }: { data: RadarPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
        <PolarGrid stroke="rgba(255,255,255,0.06)" />
        <PolarAngleAxis
          dataKey="metric"
          tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 500 }}
        />
        <Tooltip
          contentStyle={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-strong)',
            borderRadius: '8px',
            fontSize: '12px',
            color: 'var(--text-primary)',
          }}
        />
        <Legend
          iconType="circle"
          iconSize={6}
          wrapperStyle={{ fontSize: '11px', color: 'var(--text-secondary)', paddingTop: '8px' }}
        />
        <Radar
          name="Player"
          dataKey="value"
          stroke="#6366f1"
          fill="#6366f1"
          fillOpacity={0.2}
          strokeWidth={2}
        />
        <Radar
          name="League Avg"
          dataKey="avg"
          stroke="#f59e0b"
          fill="#f59e0b"
          fillOpacity={0.1}
          strokeWidth={1.5}
          strokeDasharray="4 2"
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
