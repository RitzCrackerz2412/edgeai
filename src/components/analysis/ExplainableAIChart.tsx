'use client';

import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ReferenceLine,
} from 'recharts';
import type { PredictionFactor } from '@/lib/types';

export function ExplainableAIChart({ factors }: { factors: PredictionFactor[] }) {
  const sorted = [...factors].sort((a, b) => b.weight - a.weight);
  const data = sorted.map(f => ({
    label: f.label.length > 30 ? f.label.slice(0, 28) + '…' : f.label,
    weight: f.positive ? f.weight : -Math.abs(f.weight),
    positive: f.positive,
  }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 36)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 40, left: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
        <XAxis
          type="number"
          domain={[-12, 12]}
          tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => (v > 0 ? `+${v}` : `${v}`)}
        />
        <YAxis
          dataKey="label"
          type="category"
          width={200}
          tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-strong)',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          formatter={(v) => {
            const n = Number(v);
            return [`${n > 0 ? '+' : ''}${n.toFixed(1)} pts`, 'Impact Weight'];
          }}
        />
        <ReferenceLine x={0} stroke="var(--border-default)" strokeWidth={1} />
        <Bar dataKey="weight" radius={[0, 3, 3, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.positive ? 'var(--success)' : 'var(--danger)'} fillOpacity={0.75} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
