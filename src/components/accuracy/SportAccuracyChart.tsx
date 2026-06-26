'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer,
} from 'recharts';

interface SportAccuracyChartProps {
  data: Record<string, number>;
}

export function SportAccuracyChart({ data }: SportAccuracyChartProps) {
  const chartData = Object.entries(data)
    .map(([sport, acc]) => ({ sport, accuracy: acc }))
    .sort((a, b) => b.accuracy - a.accuracy);

  const getColor = (acc: number) => {
    if (acc >= 70) return '#22c55e';
    if (acc >= 65) return '#84cc16';
    if (acc >= 60) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 16, left: 40, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis
          type="number"
          domain={[50, 80]}
          tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
          tickFormatter={(v) => `${v}%`}
        />
        <YAxis
          type="category"
          dataKey="sport"
          tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
          width={80}
        />
        <Tooltip
          contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }}
          itemStyle={{ color: 'var(--text-primary)' }}
          formatter={(v) => [`${v}%`, 'Accuracy']}
        />
        <Bar dataKey="accuracy" radius={[0, 4, 4, 0]}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={getColor(entry.accuracy)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
