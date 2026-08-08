import type { SubModelResult } from '@/lib/submodels';
import { AlertTriangle, Info, DatabaseZap } from 'lucide-react';

interface Props {
  ensemble: SubModelResult;
  homeTeam: string;
  awayTeam: string;
}

interface SubModelRowProps {
  label: string;
  modelName: string;
  score: number;
  dataLabel: string;
  homeTeam: string;
  color: string;
  hasData: boolean;
}

function SubModelRow({ label, modelName, score, dataLabel, homeTeam, color, hasData }: SubModelRowProps) {
  const pct = Math.round(score);
  return (
    <div
      className="rounded-xl px-3 py-2.5 flex items-center gap-3"
      style={{
        background: 'var(--bg-elevated)',
        border: `1px solid ${hasData ? 'var(--border-subtle)' : 'var(--border-muted)'}`,
        opacity: hasData ? 1 : 0.5,
      }}
    >
      {/* Left: labels */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            {label}
          </span>
          {!hasData && (
            <span className="text-[9px] font-bold px-1 py-px rounded" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
              NO DATA
            </span>
          )}
        </div>
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{ background: 'var(--border-muted)' }}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, background: hasData ? color : 'var(--text-muted)' }}
          />
        </div>
        <p className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{dataLabel}</p>
      </div>

      {/* Right: score + model name */}
      <div className="text-right shrink-0">
        <p className="text-base font-black font-mono" style={{ color: hasData ? color : 'var(--text-muted)' }}>
          {hasData ? `${pct}%` : '—'}
        </p>
        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{modelName}</p>
      </div>
    </div>
  );
}

export function EnsembleBreakdown({ ensemble, homeTeam, awayTeam }: Props) {
  const {
    scoreA, scoreB, scoreC,
    labelA, labelB, labelC,
    hasDataA, hasDataC,
    activeModels,
    ensembleAvg, disagreementPct, highUncertainty,
  } = ensemble;

  const missingH2H = !hasDataA || !hasDataC;
  const avgColor = ensembleAvg >= 65 ? '#22c55e' : ensembleAvg >= 52 ? '#f59e0b' : '#ef4444';

  const ensembleLabel = activeModels === 3
    ? `mean of 3 models`
    : `based on ${activeModels} of 3 models — insufficient H2H data`;

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

      {/* Insufficient data banner */}
      {missingH2H && !highUncertainty && (
        <div
          className="flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs"
          style={{
            background: 'rgba(100,116,139,0.08)',
            border: '1px solid rgba(100,116,139,0.2)',
            color: 'var(--text-secondary)',
          }}
        >
          <DatabaseZap size={13} className="mt-0.5 shrink-0" style={{ color: 'var(--text-muted)' }} />
          <span>
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              {activeModels} of 3 sub-models active.
            </span>
            {' '}H2H models excluded from ensemble — these teams have not met enough times to build a reliable head-to-head record.
          </span>
        </div>
      )}

      {/* Sub-model rows — stacked so they never overflow the column */}
      <div className="space-y-2">
        <SubModelRow
          label="Recency"
          modelName="Last 5 H2H"
          score={scoreA}
          dataLabel={labelA}
          homeTeam={homeTeam}
          color="#3b82f6"
          hasData={hasDataA}
        />
        <SubModelRow
          label="Season-long"
          modelName="ELO Rating"
          score={scoreB}
          dataLabel={labelB}
          homeTeam={homeTeam}
          color="#8b5cf6"
          hasData={true}
        />
        <SubModelRow
          label="Historical"
          modelName="All-time H2H"
          score={scoreC}
          dataLabel={labelC}
          homeTeam={homeTeam}
          color="#06b6d4"
          hasData={hasDataC}
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
            {homeTeam.split(' ').slice(-1)[0]} win probability · {ensembleLabel}
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
        Three independently computed signals: recent H2H form, ELO-based win probability, and all-time head-to-head record.
        {activeModels < 3 && ' Greyed-out models are excluded from the average due to insufficient H2H history.'}
        {' '}vs. {awayTeam.split(' ').slice(-1)[0]}.
      </p>
    </div>
  );
}
