'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import type { EarningsQuarter } from '@/lib/finance/types';

export function EarningsChart({ quarters }: { quarters: EarningsQuarter[] }) {
  if (quarters.length === 0) {
    return <div className="text-xs text-center py-8" style={{ color: 'var(--text-muted)' }}>No earnings data available</div>;
  }

  const data = quarters.map(q => ({
    period:   q.period,
    actual:   q.actual,
    estimate: q.estimate,
    beat:     q.surprise != null && q.surprise > 0,
  }));

  return (
    <div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis
            dataKey="period"
            tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
            axisLine={false} tickLine={false}
          />
          <YAxis
            tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
            axisLine={false} tickLine={false}
            tickFormatter={v => `$${v.toFixed(2)}`}
          />
          <Tooltip
            contentStyle={{ background: '#1C1C1C', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, fontSize: 12 }}
            formatter={(v: unknown, name: unknown) => [`$${(v as number)?.toFixed(2) ?? '—'}`, name === 'actual' ? 'Actual EPS' : 'Estimated EPS']}
          />
          <Legend
            iconType="circle" iconSize={8}
            wrapperStyle={{ fontSize: 10, color: 'var(--text-muted)' }}
          />
          <Bar dataKey="estimate" name="Estimate" fill="rgba(148,163,184,0.3)" radius={[2, 2, 0, 0]} />
          <Bar dataKey="actual" name="Actual" radius={[2, 2, 0, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.beat ? '#22c55e' : '#ef4444'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-6 mt-2 text-[10px]" style={{ color: 'var(--text-muted)' }}>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500" /> Beat Estimate</div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500" /> Missed Estimate</div>
      </div>
    </div>
  );
}
