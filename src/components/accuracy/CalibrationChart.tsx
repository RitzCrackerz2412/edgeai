'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';

interface CalibrationChartProps {
  data: { predicted: number; actual: number }[];
}

export function CalibrationChart({ data }: CalibrationChartProps) {
  const perfect = data.map((d) => ({ predicted: d.predicted, perfect: d.predicted, actual: d.actual }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={perfect} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="predicted"
          tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
          tickFormatter={(v) => `${v}%`}
        />
        <YAxis
          tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip
          contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }}
          labelStyle={{ color: 'var(--text-muted)' }}
          itemStyle={{ color: 'var(--text-primary)' }}
          formatter={(v) => [`${v}%`]}
          labelFormatter={(l) => `Predicted: ${l}%`}
        />
        <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-muted)' }} />
        <Line type="monotone" dataKey="perfect" stroke="var(--border-bright)" strokeDasharray="4 4" dot={false} name="Perfect calibration" />
        <Line type="monotone" dataKey="actual" stroke="var(--accent-bright)" strokeWidth={2} dot={{ fill: 'var(--accent-bright)', r: 3 }} name="EdgeAI model" />
      </LineChart>
    </ResponsiveContainer>
  );
}
