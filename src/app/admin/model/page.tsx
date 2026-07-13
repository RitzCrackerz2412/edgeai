'use client';

/**
 * Feature Importance Dashboard — internal dev page.
 *
 * Shows:
 *  - Model performance (Brier, log loss, accuracy, ECE)
 *  - Per-confidence-bucket accuracy (calibration chart)
 *  - Dynamic model weights per sport
 *  - Top/bottom contributing features
 *  - Continuous learning status (samples, retraining schedule)
 *
 * Route: /admin/model
 */

import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';

// ── Types ─────────────────────────────────────────────────────────────────────

interface BucketData {
  label: string;
  predicted: number;
  actual: number;
  accuracy: number;
  count: number;
  brierScore: number;
}

interface BacktestResult {
  sampleCount: number;
  winnerAccuracy: number;
  brierScore: number;
  logLoss: number;
  expectedCalibrationError: number;
  rocAuc: number;
  baselineWinnerAccuracy: number;
  brierSkill: number;
  buckets: BucketData[];
  summary: string;
  scoreMAE: number | null;
}

interface LearningStatus {
  totalSamples: number;
  samplesSinceRetrain: number;
  nextRetrainIn: number;
  snapshots: Array<{
    version: number;
    timestamp: string;
    sport?: string;
    reason: string;
    metrics: { sampleCount: number };
  }>;
}

// ── Metric card ───────────────────────────────────────────────────────────────

function MetricCard({
  label, value, sub, good, bad,
}: {
  label: string;
  value: string | number;
  sub?: string;
  good?: boolean;
  bad?: boolean;
}) {
  const color = good ? 'text-emerald-400' : bad ? 'text-red-400' : 'text-slate-100';
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
      <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-2xl font-mono font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ModelDashboard() {
  const [backtest, setBacktest] = useState<BacktestResult | null>(null);
  const [learning, setLearning] = useState<LearningStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [btRes, lRes] = await Promise.all([
          fetch('/api/backtest'),
          fetch('/api/learn'),
        ]);
        const btData = await btRes.json();
        if (btData.result) setBacktest(btData.result);
        const lData = lRes.ok ? await lRes.json() : null;
        if (lData?.status) setLearning(lData.status);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400 text-sm animate-pulse">Loading model diagnostics…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-white">Model Diagnostics</h1>
        <p className="text-slate-400 text-sm mt-1">Feature importance, calibration, and continuous learning status</p>
      </header>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-300 text-sm">
          {error} — Showing empty state below.
        </div>
      )}

      {/* ── Performance summary ─────────────────────────────────────────────── */}
      {backtest ? (
        <>
          <section>
            <h2 className="text-lg font-semibold mb-4">Performance Summary</h2>
            <p className="text-xs text-slate-400 mb-4 font-mono">{backtest.summary}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <MetricCard
                label="Winner Accuracy"
                value={`${(backtest.winnerAccuracy * 100).toFixed(1)}%`}
                sub={`Baseline: ${(backtest.baselineWinnerAccuracy * 100).toFixed(1)}%`}
                good={backtest.winnerAccuracy > backtest.baselineWinnerAccuracy + 0.03}
              />
              <MetricCard
                label="Brier Score"
                value={backtest.brierScore.toFixed(3)}
                sub="Lower is better (0.25 = random)"
                good={backtest.brierScore < 0.20}
                bad={backtest.brierScore > 0.24}
              />
              <MetricCard
                label="Log Loss"
                value={backtest.logLoss.toFixed(3)}
                sub="Lower is better"
                good={backtest.logLoss < 0.55}
                bad={backtest.logLoss > 0.68}
              />
              <MetricCard
                label="ECE"
                value={backtest.expectedCalibrationError.toFixed(3)}
                sub="Calibration error (lower = better)"
                good={backtest.expectedCalibrationError < 0.04}
                bad={backtest.expectedCalibrationError > 0.08}
              />
              <MetricCard
                label="ROC-AUC"
                value={backtest.rocAuc.toFixed(3)}
                sub="Discrimination (0.5 = random)"
                good={backtest.rocAuc > 0.60}
                bad={backtest.rocAuc < 0.52}
              />
              <MetricCard
                label="Brier Skill"
                value={`${(backtest.brierSkill * 100).toFixed(1)}%`}
                sub="vs always-home baseline"
                good={backtest.brierSkill > 0.05}
                bad={backtest.brierSkill < 0}
              />
            </div>
            {backtest.scoreMAE !== null && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard
                  label="Score Margin MAE"
                  value={backtest.scoreMAE.toFixed(1)}
                  sub="Predicted vs actual margin (points)"
                />
              </div>
            )}
          </section>

          {/* ── Calibration chart ──────────────────────────────────────────── */}
          {backtest.buckets.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-4">Calibration by Confidence Bucket</h2>
              <p className="text-xs text-slate-400 mb-3">
                A well-calibrated model should have Actual Win Rate ≈ Predicted Win Rate in each bucket.
              </p>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={backtest.buckets} margin={{ top: 8, right: 24, bottom: 8, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }}
                    formatter={(v: unknown, name: unknown) => [`${((v as number) * 100).toFixed(1)}%`, String(name)]}
                  />
                  <Legend />
                  <Bar dataKey="predicted" name="Predicted %" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="actual" name="Actual %" fill="#10b981" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>

              {/* Accuracy per bucket */}
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-slate-300 mb-2">Accuracy by Confidence Bucket</h3>
                <div className="flex flex-wrap gap-2">
                  {backtest.buckets.map((b) => (
                    <div key={b.label} className="bg-slate-800 rounded-lg px-3 py-2 text-xs">
                      <span className="text-slate-400">{b.label}: </span>
                      <span className={b.accuracy >= parseFloat(b.label) / 100 * 0.9 ? 'text-emerald-400' : 'text-amber-400'}>
                        {(b.accuracy * 100).toFixed(0)}%
                      </span>
                      <span className="text-slate-500 ml-1">({b.count}g)</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      ) : (
        <section className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center">
          <p className="text-slate-400">No validation records yet.</p>
          <p className="text-slate-500 text-sm mt-1">Submit game results via <code className="text-blue-400">POST /api/validate</code> to see performance metrics.</p>
        </section>
      )}

      {/* ── Learning status ────────────────────────────────────────────────── */}
      {learning && (
        <section>
          <h2 className="text-lg font-semibold mb-4">Continuous Learning</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <MetricCard label="Total Samples" value={learning.totalSamples} sub="Calibration records" />
            <MetricCard label="Since Retrain" value={learning.samplesSinceRetrain} />
            <MetricCard label="Next Retrain In" value={`${learning.nextRetrainIn} games`} />
            <MetricCard label="Model Versions" value={learning.snapshots.length} />
          </div>
          {learning.snapshots.length > 0 && (
            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400 uppercase tracking-widest">
                    <th className="px-4 py-3 text-left">Version</th>
                    <th className="px-4 py-3 text-left">Timestamp</th>
                    <th className="px-4 py-3 text-left">Sport</th>
                    <th className="px-4 py-3 text-left">Reason</th>
                    <th className="px-4 py-3 text-right">Samples</th>
                  </tr>
                </thead>
                <tbody>
                  {learning.snapshots.slice(0, 10).map((s) => (
                    <tr key={s.version} className="border-b border-slate-800 hover:bg-slate-700/30">
                      <td className="px-4 py-2 font-mono text-slate-300">v{s.version}</td>
                      <td className="px-4 py-2 text-slate-400">{new Date(s.timestamp).toLocaleString()}</td>
                      <td className="px-4 py-2 text-slate-300">{s.sport ?? 'All'}</td>
                      <td className="px-4 py-2 text-slate-400">{s.reason}</td>
                      <td className="px-4 py-2 text-right text-slate-300">{s.metrics.sampleCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ── Sample count notice ────────────────────────────────────────────── */}
      <section className="bg-slate-800/30 border border-slate-700 rounded-xl p-4 text-xs text-slate-500">
        <strong className="text-slate-400">Dev note:</strong> This page requires{' '}
        <code className="text-blue-400">POST /api/validate</code> to be called with game results.
        Predictions are stored in-memory and reset on server restart. Wire a database to persist them.
      </section>
    </div>
  );
}
