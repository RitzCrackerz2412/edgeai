'use client';

interface ConfidenceGaugeProps {
  confidence: number;
  winProbability: number;
  label?: string;
}

export function ConfidenceGauge({ confidence, winProbability, label }: ConfidenceGaugeProps) {
  const color = confidence >= 80 ? '#22c55e' : confidence >= 65 ? '#f59e0b' : '#f97316';
  const r = 54;
  const circumference = 2 * Math.PI * r;
  const winDash = (winProbability / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-40 h-40">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          {/* Track */}
          <circle cx="60" cy="60" r={r} fill="none" stroke="var(--border)" strokeWidth="8" />
          {/* Win probability (outer, faint) */}
          <circle
            cx="60" cy="60" r={r}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeOpacity="0.25"
            strokeDasharray={`${winDash} ${circumference - winDash}`}
            strokeLinecap="round"
          />
          {/* Confidence (inner arc, solid) */}
          <circle
            cx="60" cy="60" r={r - 10}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeDasharray={`${(confidence / 100) * 2 * Math.PI * (r - 10)} ${2 * Math.PI * (r - 10)}`}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold" style={{ color }}>
            {confidence}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>confidence</span>
        </div>
      </div>
      {label && (
        <span className="text-sm font-semibold text-center" style={{ color: 'var(--text-primary)' }}>
          {label}
        </span>
      )}
    </div>
  );
}
