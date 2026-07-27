import type { SubModelResult } from '@/lib/submodels';
import { AlertTriangle, Info } from 'lucide-react';

interface Props {
  ensemble: SubModelResult;
  homeTeam: string;
  awayTeam: string;
}

interface SubModelCardProps {
  label: string;
  modelName: string;
  score: number;
  dataLabel: string;
  homeTeam: string;
  color: string;
}

function SubModelCard({ label, modelName, score, dataLabel, homeTeam, color }: SubModelCardProps) {
  const pct = Math.round(score);
  return (
    <div
      className="rounded-xl p-3 space-y-2"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
          {label}
        </span>
        <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
          {modelName}
        </span>
      </div>

      {/* Score bar */}
      <div>
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{ background: 'var(--border-muted)' }}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, background: color }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{homeTeam.split(' ').slice(-1)[0]}</span>
          <span className="text-sm font-bold font-mono" style={{ color }}>{pct}%</span>
        </div>
      </div>

      {/* Data source label */}
      <p className="text-[10px] leading-tight" style={{ color: 'var(--text-muted)' }}>{dataLabel}</p>
    </div>
  );
}

export function EnsembleBreakdown({ ensemble, homeTeam, awayTeam }: Props) {
  const { scoreA, scoreB, scoreC, labelA, labelB, labelC, ensembleAvg, disagreementPct, highUncertainty } = ensemble;

  const avgColor = ensembleAvg >= 65 ? '#22c55e' : ensembleAvg >= 52 ? '#f59e0b' : '#ef4444';

  return (
    <div className="space-y-3">

      {/* High Uncertainty banner */}
      {highUncertainty && (
        <div
          className="flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs"
          style={{
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.25)',
            color: '#f59e0b',
          }}
        >
          <AlertTriangle size={13} className="mt-0.5 shrink-0" />
          <div>
            <span className="font-bold">High Uncertainty</span>
            <span className="ml-1 font-normal" style={{ color: 'var(--text-secondary)' }}>
              — models disagree by {disagreementPct.toFixed(1)} pp. Signals conflict; treat prediction with caution.
            </span>
          </div>
          <div className="ml-auto shrink-0 relative group">
            <Info size={13} className="cursor-help" />
            <div
              className="absolute right-0 top-5 w-64 rounded-lg px-3 py-2 text-xs leading-snug z-10 hidden group-hover:block"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}
            >
              When three independent models disagree by more than 12 percentage points (std dev), the game has fewer reliable signals. Historical upsets and line movements tend to cluster in high-disagreement games.
            </div>
          </div>
        </div>
      )}

      {/* Sub-model cards */}
      <div className="grid grid-cols-3 gap-2">
        <SubModelCard
          label="Recency"
          modelName="Last 5 H2H"
          score={scoreA}
          dataLabel={labelA}
          homeTeam={homeTeam}
          color="#3b82f6"
        />
        <SubModelCard
          label="Season-long"
          modelName="ELO Rating"
          score={scoreB}
          dataLabel={labelB}
          homeTeam={homeTeam}
          color="#8b5cf6"
        />
        <SubModelCard
          label="Historical"
          modelName="All-time H2H"
          score={scoreC}
          dataLabel={labelC}
          homeTeam={homeTeam}
          color="#06b6d4"
        />
      </div>

      {/* Ensemble average */}
      <div
        className="rounded-xl p-3 flex items-center justify-between"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
      >
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            Ensemble Average
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {homeTeam.split(' ').slice(-1)[0]} win probability · mean of 3 models
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black font-mono" style={{ color: avgColor }}>
            {ensembleAvg.toFixed(1)}%
          </p>
          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            ±{disagreementPct.toFixed(1)} pp spread
          </p>
        </div>
      </div>

      <p className="text-[10px] leading-snug" style={{ color: 'var(--text-muted)' }}>
        Three independently computed signals: recent H2H form, ELO-based win probability, and all-time head-to-head record. Ensemble is their unweighted mean. vs. {awayTeam.split(' ').slice(-1)[0]}.
      </p>
    </div>
  );
}
