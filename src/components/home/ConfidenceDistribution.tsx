'use client';

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { CONFIDENCE_DISTRIBUTION } from '@/lib/dashboardData';

export function ConfidenceDistribution() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Accuracy by confidence tier · {CONFIDENCE_DISTRIBUTION.reduce((s, d) => s + d.count, 0).toLocaleString()} total predictions
        </p>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={CONFIDENCE_DISTRIBUTION} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="tier"
            tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            domain={[40, 90]}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-strong)',
              borderRadius: '8px',
              fontSize: '12px',
              color: 'var(--text-primary)',
            }}
            formatter={(v) => [`${v}%`, 'Accuracy']}
            labelFormatter={(l) => `Confidence: ${l}`}
          />
          <Bar dataKey="accuracy" radius={[4, 4, 0, 0]}>
            {CONFIDENCE_DISTRIBUTION.map((d, i) => (
              <Cell key={i} fill={d.color} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {/* Count breakdown */}
      <div className="flex gap-2 flex-wrap">
        {CONFIDENCE_DISTRIBUTION.map(d => (
          <div key={d.tier} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{d.tier}: {d.count.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
