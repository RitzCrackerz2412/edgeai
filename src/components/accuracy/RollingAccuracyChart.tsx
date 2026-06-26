'use client';

import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer,
} from 'recharts';

// Simulated rolling 13-week accuracy.
// Replaced with real DB time-series when DATABASE_URL is configured.
const BASE_DATA = [
  { week: 'W1',  accuracy: 62.1 },
  { week: 'W2',  accuracy: 64.8 },
  { week: 'W3',  accuracy: 63.4 },
  { week: 'W4',  accuracy: 66.2 },
  { week: 'W5',  accuracy: 65.7 },
  { week: 'W6',  accuracy: 68.1 },
  { week: 'W7',  accuracy: 67.4 },
  { week: 'W8',  accuracy: 70.3 },
  { week: 'W9',  accuracy: 69.1 },
  { week: 'W10', accuracy: 71.8 },
  { week: 'W11', accuracy: 70.2 },
  { week: 'W12', accuracy: 72.4 },
  { week: 'W13', accuracy: 71.2 },
];

// Small per-sport offsets to differentiate the simulated chart
const SPORT_OFFSET: Record<string, number> = {
  NBA: +3.2, NFL: +1.4, MLB: -7.0, NHL: -3.1, Soccer: -0.6, UFC: +2.8,
};

interface Props {
  sport: string;
}

// Seeded pseudo-random for stable chart values — same output every render
function seededNoise(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x); // 0..1
}

export function RollingAccuracyChart({ sport }: Props) {
  const offset = SPORT_OFFSET[sport] ?? 0;
  // useMemo ensures stable data across re-renders (no flicker)
  const data = useMemo(() => BASE_DATA.map((d, i) => ({
    ...d,
    accuracy: Math.min(95, Math.max(40, d.accuracy + offset + (seededNoise(i) - 0.5) * 0.4)),
  })), [offset]);

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-muted)" />
        <XAxis
          dataKey="week"
          tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[50, 85]}
          tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => `${v}%`}
        />
        <Tooltip
          contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-muted)', borderRadius: 8, fontSize: 12 }}
          formatter={(v) => [typeof v === 'number' ? `${v.toFixed(1)}%` : String(v), 'Accuracy']}
        />
        <ReferenceLine y={68.4} stroke="#3b82f6" strokeDasharray="4 2" strokeOpacity={0.5}
          label={{ value: 'Baseline', fill: '#3b82f6', fontSize: 9, position: 'right' }} />
        <Line
          type="monotone"
          dataKey="accuracy"
          stroke="#22c55e"
          strokeWidth={2}
          dot={{ r: 3, fill: '#22c55e', strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
