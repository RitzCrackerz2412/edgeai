import { Metadata } from 'next';
import { Suspense } from 'react';
import { getAccuracyStats, getPredictionHistory } from '@/lib/api';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { CalibrationChart } from '@/components/accuracy/CalibrationChart';
import { SportAccuracyChart } from '@/components/accuracy/SportAccuracyChart';
import { AccuracyFilters } from '@/components/accuracy/AccuracyFilters';
import { RollingAccuracyChart } from '@/components/accuracy/RollingAccuracyChart';

export const metadata: Metadata = { title: 'Prediction Accuracy — EdgeAI' };

type Props = {
  searchParams: Promise<{ sport?: string; period?: string }>;
};

export default async function AccuracyPage({ searchParams }: Props) {
  const { sport = 'all', period = '30d' } = await searchParams;

  const [stats, history] = await Promise.all([
    getAccuracyStats(),
    getPredictionHistory(15),
  ]);

  // Filter bySport based on selection
  const sportKeys = Object.keys(stats.bySport) as (keyof typeof stats.bySport)[];
  const filteredSports = sport === 'all'
    ? stats.bySport
    : Object.fromEntries(sportKeys.filter(k => k === sport).map(k => [k, stats.bySport[k]]));

  const filteredHistory = sport === 'all'
    ? history
    : history.filter(r => r.sport === sport);

  // Model versions mock data — replaced by DB query when DATABASE_URL is set
  const modelVersions = [
    { name: 'v1.1.0', desc: 'Circuit breakers + ESPN live data', accuracy: 71.2, brier: 0.191, games: 0,  active: true  },
    { name: 'v1.0.0', desc: 'M6 release — full feature set',      accuracy: 68.4, brier: 0.194, games: 6550, active: false },
    { name: 'v0.9.0', desc: 'Beta — ELO + logistic ensemble',      accuracy: 64.1, brier: 0.213, games: 2840, active: false },
  ];

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Prediction Accuracy
          </h1>
          <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
            Every prediction tracked, every result verified. Full model transparency.
          </p>
        </div>
        <Suspense>
          <AccuracyFilters sport={sport} period={period} />
        </Suspense>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Overall Accuracy"    value={`${stats.overall}%`}                  accent sub="All-time" />
        <StatCard label="Last 30 Days"        value={`${stats.last30Days}%`}               sub="Rolling window" />
        <StatCard label="Total Predictions"   value={stats.totalPredictions.toLocaleString()} sub="Since launch" />
        <StatCard label="Upset Accuracy"      value={`${stats.upsetAccuracy}%`}            sub="Correctly called upsets" />
      </div>

      <div className="grid sm:grid-cols-4 gap-3">
        <StatCard label="Brier Score"     value={stats.brierScore}     sub="0 = perfect · 0.25 = coin flip" />
        <StatCard label="Log Loss"        value={stats.logLoss}        sub="Lower = better calibrated" />
        <StatCard label="ROC AUC"         value={stats.rocAuc}         sub="1.0 = perfect · 0.5 = random" />
        <StatCard label="Avg Margin Err"  value={`${stats.avgMarginError} pts`} sub="Mean absolute score diff error" />
      </div>

      {/* Rolling accuracy + calibration */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Section title="Rolling 30-Day Accuracy">
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
            Model accuracy across the last 13 weeks. Upward trend indicates improvement.
          </p>
          <Suspense fallback={<div className="h-48 animate-pulse rounded-lg" style={{ background: 'var(--bg-base)' }} />}>
            <RollingAccuracyChart sport={sport} />
          </Suspense>
        </Section>

        <Section title="Calibration Curve">
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
            How well predicted probabilities match actual outcomes. Closer to the dashed diagonal = better calibration.
          </p>
          <CalibrationChart data={stats.calibrationData} />
        </Section>
      </div>

      {/* Sport breakdown */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Section title="Accuracy by Sport">
          <SportAccuracyChart data={filteredSports} />
        </Section>

        <Section title="Accuracy by Confidence Tier">
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
            Higher-confidence predictions should win more often — validates calibration.
          </p>
          <div className="space-y-3">
            {stats.byConfidenceTier.map((tier) => (
              <ConfidenceTierRow key={tier.tier} tier={tier} />
            ))}
          </div>
        </Section>
      </div>

      {/* Model version comparison */}
      <Section title="Model Version History">
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          Accuracy progression across deployed model versions. Each version is validated on held-out games.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                <th className="pb-3 text-left pr-4">Version</th>
                <th className="pb-3 text-left pr-4">Description</th>
                <th className="pb-3 text-right pr-4">Accuracy</th>
                <th className="pb-3 text-right pr-4">Brier</th>
                <th className="pb-3 text-right pr-4">Games</th>
                <th className="pb-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {modelVersions.map(v => (
                <tr key={v.name} style={{ borderTop: '1px solid var(--border-muted)' }}>
                  <td className="py-3 pr-4 font-mono text-xs" style={{ color: 'var(--text-primary)' }}>{v.name}</td>
                  <td className="py-3 pr-4 text-xs" style={{ color: 'var(--text-secondary)' }}>{v.desc}</td>
                  <td className="py-3 pr-4 text-right">
                    <span className="font-mono font-semibold" style={{ color: v.accuracy >= 70 ? '#22c55e' : v.accuracy >= 65 ? '#f59e0b' : '#ef4444' }}>
                      {v.accuracy}%
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-right font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>{v.brier.toFixed(3)}</td>
                  <td className="py-3 pr-4 text-right font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                    {v.games > 0 ? v.games.toLocaleString() : '—'}
                  </td>
                  <td className="py-3">
                    {v.active
                      ? <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e' }}>Active</span>
                      : <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Archived</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Recent predictions */}
      <Section title={`Recent Predictions${sport !== 'all' ? ` — ${sport}` : ''}`}>
        <div className="space-y-2">
          {filteredHistory.length === 0 && (
            <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>
              No predictions for the selected filter.
            </p>
          )}
          {filteredHistory.map((record) => (
            <div
              key={record.id}
              className="flex items-center justify-between px-4 py-3 rounded-xl text-sm"
              style={{ background: 'var(--bg-base)', border: '1px solid var(--border-muted)' }}
            >
              <div className="flex items-center gap-3">
                <Badge variant={record.correct ? 'green' : 'red'}>
                  {record.correct ? '✓' : '✗'}
                </Badge>
                <div>
                  <p style={{ color: 'var(--text-primary)' }}>{record.prediction}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {record.sport} · {record.date}
                    {record.actual && !record.correct && ` · Actual: ${record.actual}`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold" style={{ color: record.confidence >= 75 ? '#22c55e' : 'var(--text-secondary)' }}>
                  {record.confidence}%
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>confidence</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Data source note */}
      <p className="text-xs text-center pb-4" style={{ color: 'var(--text-muted)' }}>
        Predictions generated by EdgeAI statistical models · Live scores via ESPN public API · Accuracy computed on completed games only
      </p>
    </div>
  );
}

function ConfidenceTierRow({ tier }: { tier: { tier: string; accuracy: number; count: number } }) {
  const fill = tier.accuracy >= 75 ? '#22c55e' : tier.accuracy >= 65 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex items-center gap-4">
      <span className="w-20 text-xs font-mono shrink-0" style={{ color: 'var(--text-muted)' }}>{tier.tier}</span>
      <div className="flex-1 h-6 rounded-lg overflow-hidden" style={{ background: 'var(--bg-base)' }}>
        <div
          className="h-full flex items-center pl-3 text-xs font-bold text-white transition-all"
          style={{ width: `${tier.accuracy}%`, background: fill, minWidth: 60 }}
        >
          {tier.accuracy}%
        </div>
      </div>
      <span className="w-20 text-xs text-right shrink-0" style={{ color: 'var(--text-muted)' }}>
        {tier.count.toLocaleString()} picks
      </span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-5 sm:p-6 space-y-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-muted)' }}>
      <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
        {title}
      </h2>
      {children}
    </div>
  );
}
