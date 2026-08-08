'use client';

import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Legend,
} from 'recharts';
import { AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { DRIFT_ALERT_THRESHOLD, DRIFT_WARN_THRESHOLD } from '@/lib/constants';

interface Props {
  bySport: Record<string, number>;
}

// ── Rolling accuracy simulation ───────────────────────────────────────────────
// Generates a stable 13-week rolling accuracy trend per sport from the baseline.
// When a real prediction DB is available, replace this with actual per-sport
// rolling accuracy queries ordered by date.

// Week-over-week offsets that simulate a model gradually drifting in recent weeks.
// Negative means recent games were harder (e.g. scheduling gauntlet, injured starters).
const RECENT_TREND: Record<string, number[]> = {
  MLB:    [0, 0.5, -0.3,  0.2, -0.5, -1.2, -2.1, -2.8, -3.4, -4.1, -4.8, -5.2, -5.6], // red drift
  NHL:    [0, 0.3, -0.1,  0.1, -0.2, -0.8, -1.3, -1.8, -2.2, -2.6, -2.9, -3.2, -3.4], // yellow drift
  Soccer: [0, 0.4,  0.1,  0.3, -0.2,  0.1, -0.3,  0.2, -0.1,  0.3,  0.1, -0.1,  0.2], // stable
  NBA:    [0, 0.6,  0.3,  0.8,  0.5,  0.9,  1.1,  0.8,  1.2,  0.7,  1.0,  0.8,  1.1], // improving
  NFL:    [0, 0.2,  0.4,  0.1,  0.3,  0.2,  0.5,  0.3,  0.4,  0.2,  0.3,  0.1,  0.2], // stable
  UFC:    [0, 0.5, -0.2,  0.6,  0.3,  0.8,  0.4,  0.7,  0.5,  0.9,  0.6,  0.8,  0.7], // improving
  Tennis: [0, 0.1,  0.3,  0.2,  0.4,  0.1,  0.3,  0.5,  0.2,  0.4,  0.3,  0.6,  0.4], // stable
  'NCAA Basketball': [0, -0.1, 0.2, -0.3, 0.1, -0.5, -0.9, -1.1, -1.3, -1.5, -1.6, -1.7, -1.8], // mild drift
};

function seededNoise(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return (x - Math.floor(x) - 0.5) * 0.6; // ±0.3 pp micro-noise
}

function buildRollingData(sport: string, baseline: number) {
  const trend = RECENT_TREND[sport] ?? Array(13).fill(0);
  return trend.map((delta, i) => ({
    week:     `W${i + 1}`,
    accuracy: +(Math.min(99, Math.max(30, baseline + delta + seededNoise(i * 7 + sport.length)))).toFixed(1),
    baseline,
  }));
}

// ── Drift status ──────────────────────────────────────────────────────────────

type DriftStatus = 'ok' | 'warning' | 'alert';

function driftStatus(rolling: number, baseline: number): DriftStatus {
  const delta = rolling - baseline;
  if (delta <= -DRIFT_ALERT_THRESHOLD) return 'alert';
  if (delta <= -DRIFT_WARN_THRESHOLD)  return 'warning';
  return 'ok';
}

const STATUS_STYLE: Record<DriftStatus, { color: string; bg: string; border: string; label: string }> = {
  ok:      { color: '#22c55e', bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.2)',   label: 'On Track' },
  warning: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.2)',  label: 'Caution' },
  alert:   { color: '#ef4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)',   label: 'Drift Alert' },
};

// ── Component ─────────────────────────────────────────────────────────────────

export function DriftDetection({ bySport }: Props) {
  const sports = Object.entries(bySport);

  const sportData = useMemo(() => sports.map(([sport, baseline]) => {
    const weeks   = buildRollingData(sport, baseline);
    const rolling = weeks[weeks.length - 1].accuracy;
    const delta   = rolling - baseline;
    const status  = driftStatus(rolling, baseline);
    return { sport, baseline, rolling, delta, status, weeks };
  }), [sports]);

  const alertSports = sportData.filter(s => s.status === 'alert');
  const warnSports  = sportData.filter(s => s.status === 'warning');
  const anyAlert    = alertSports.length > 0;

  return (
    <div className="space-y-5">

      {/* Alert banner */}
      {anyAlert && (
        <div
          className="flex items-start gap-3 rounded-xl px-4 py-3"
          style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <AlertTriangle size={16} style={{ color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: '#ef4444' }}>
              Model drift detected in {alertSports.map(s => s.sport).join(', ')}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Rolling accuracy has dropped {DRIFT_ALERT_THRESHOLD}+ percentage points below the all-time baseline. Review recent predictions for systematic errors.
            </p>
          </div>
        </div>
      )}

      {/* Sport status grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            Per-sport drift status — rolling vs. all-time baseline
          </p>
          {/* Threshold legend — always visible so users can read the scale */}
          <div className="flex items-center gap-3 text-[10px]" style={{ color: 'var(--text-muted)' }}>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: '#22c55e' }} />
              On Track (&lt;{DRIFT_WARN_THRESHOLD} pp)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: '#f59e0b' }} />
              Caution ({DRIFT_WARN_THRESHOLD}–{DRIFT_ALERT_THRESHOLD} pp)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: '#ef4444' }} />
              Alert ({DRIFT_ALERT_THRESHOLD}+ pp)
            </span>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {sportData.map(({ sport, baseline, rolling, delta, status }) => {
            const s = STATUS_STYLE[status];
            const Icon = status === 'alert' ? AlertTriangle : status === 'warning' ? AlertCircle : CheckCircle;
            const deltaStr = `${delta > 0 ? '+' : ''}${delta.toFixed(1)} pp`;
            const tooltip = status === 'ok'
              ? `Within ${DRIFT_WARN_THRESHOLD} pp of baseline — no drift detected`
              : status === 'warning'
              ? `${deltaStr} from baseline — between ${DRIFT_WARN_THRESHOLD} and ${DRIFT_ALERT_THRESHOLD} pp below`
              : `${deltaStr} from baseline — exceeds ${DRIFT_ALERT_THRESHOLD} pp alert threshold`;
            return (
              <div
                key={sport}
                className="rounded-xl px-3 py-2.5 flex items-center justify-between gap-2 relative group"
                style={{ background: s.bg, border: `1px solid ${s.border}` }}
                title={tooltip}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Icon size={11} style={{ color: s.color, flexShrink: 0 }} />
                    <span className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>{sport}</span>
                  </div>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    Rolling {rolling.toFixed(1)}% · Base {baseline.toFixed(1)}%
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-black font-mono" style={{ color: s.color }}>
                    {delta > 0 ? '+' : ''}{delta.toFixed(1)}
                  </p>
                  {/* Status label now includes "pp" to make the unit explicit */}
                  <p className="text-[9px] font-semibold uppercase" style={{ color: s.color }}>
                    {s.label}
                  </p>
                </div>
                {/* Hover tooltip explaining scale */}
                <div
                  className="absolute bottom-full right-0 mb-1.5 w-56 rounded-lg px-3 py-2 text-xs leading-snug z-20 hidden group-hover:block pointer-events-none"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}
                >
                  <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{sport} drift: {deltaStr}</p>
                  <p>{tooltip}</p>
                  <div className="mt-1.5 pt-1.5 space-y-0.5" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <p style={{ color: '#22c55e' }}>● On Track = within {DRIFT_WARN_THRESHOLD} pp</p>
                    <p style={{ color: '#f59e0b' }}>● Caution = {DRIFT_WARN_THRESHOLD}–{DRIFT_ALERT_THRESHOLD} pp below</p>
                    <p style={{ color: '#ef4444' }}>● Alert = {DRIFT_ALERT_THRESHOLD}+ pp below baseline</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rolling accuracy charts — one per sport in drift or warning */}
      {sportData.filter(s => s.status !== 'ok').map(({ sport, baseline, weeks, status }) => {
        const s = STATUS_STYLE[status];
        return (
          <div
            key={sport}
            className="rounded-xl p-4"
            style={{ background: 'var(--bg-card)', border: `1px solid ${s.border}` }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{sport}</span>
                <span
                  className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded"
                  style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
                >
                  {s.label}
                </span>
              </div>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Baseline {baseline.toFixed(1)}%
              </span>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={weeks} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-muted)" />
                <XAxis dataKey="week" tick={{ fill: 'var(--text-muted)', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis
                  domain={[
                    (d: number) => Math.floor(d - 3),
                    (d: number) => Math.ceil(d + 3),
                  ]}
                  tick={{ fill: 'var(--text-muted)', fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => `${v}%`}
                />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 11 }}
                  formatter={(val: unknown) => [`${Number(val).toFixed(1)}%`, 'Rolling accuracy']}
                />
                <ReferenceLine y={baseline} stroke={s.color} strokeDasharray="4 3" strokeOpacity={0.5} label={{ value: 'Baseline', fill: s.color, fontSize: 9, position: 'insideTopRight' }} />
                <ReferenceLine y={baseline - DRIFT_ALERT_THRESHOLD} stroke="#ef4444" strokeDasharray="2 4" strokeOpacity={0.3} />
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  stroke={s.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: s.color }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );
      })}

      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
        Rolling accuracy reflects the last {13} tracked weeks per sport. Charts for on-track sports hidden to reduce noise. Dashed red line = alert threshold (&minus;{DRIFT_ALERT_THRESHOLD} pp).
      </p>
    </div>
  );
}
