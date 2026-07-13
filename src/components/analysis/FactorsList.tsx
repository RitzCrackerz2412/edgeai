import { PredictionFactor } from '@/lib/types';
import { CheckCircle, XCircle } from 'lucide-react';

export function FactorsList({ factors }: { factors: PredictionFactor[] }) {
  const positive = factors.filter(f => f.positive).sort((a, b) => b.weight - a.weight);
  const negative = factors.filter(f => !f.positive).sort((a, b) => b.weight - a.weight);

  return (
    <div className="grid sm:grid-cols-2 gap-6">
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--success)' }}>
          Supporting Factors
        </h3>
        {positive.map((f, i) => <FactorRow key={i} factor={f} />)}
      </div>
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--danger)' }}>
          Risk Factors
        </h3>
        {negative.map((f, i) => <FactorRow key={i} factor={f} />)}
      </div>
    </div>
  );
}

function FactorRow({ factor }: { factor: PredictionFactor }) {
  const color = factor.positive ? 'var(--success)' : 'var(--danger)';
  const barWidth = Math.min(100, (Math.abs(factor.weight) / 10) * 100);
  const Icon = factor.positive ? CheckCircle : XCircle;

  return (
    <div className="space-y-1">
      <div className="flex items-start gap-2">
        <Icon size={14} className="mt-0.5 shrink-0" style={{ color }} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-snug" style={{ color: 'var(--text-primary)' }}>{factor.label}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{factor.detail}</p>
        </div>
        <span className="text-xs font-mono shrink-0" style={{ color: 'var(--text-muted)' }}>
          {factor.positive ? '+' : '-'}{factor.weight.toFixed(1)}
        </span>
      </div>
      <div className="ml-5 h-0.5 rounded-full" style={{ background: 'var(--border-default)' }}>
        <div className="h-full rounded-full" style={{ width: `${barWidth}%`, background: color, opacity: 0.6 }} />
      </div>
    </div>
  );
}
