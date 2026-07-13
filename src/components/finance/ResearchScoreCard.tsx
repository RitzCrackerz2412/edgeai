import type { ResearchReport } from '@/lib/finance/types';

const RATING_CONFIG: Record<ResearchReport['rating'], { color: string; bg: string; label: string }> = {
  'Strong Buy':  { color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   label: '▲▲ Strong Buy' },
  'Buy':         { color: '#4ade80', bg: 'rgba(74,222,128,0.10)',   label: '▲ Buy' },
  'Neutral':     { color: '#94a3b8', bg: 'rgba(148,163,184,0.10)',  label: '● Neutral' },
  'Sell':        { color: '#f87171', bg: 'rgba(248,113,113,0.10)',  label: '▼ Sell' },
  'Strong Sell': { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',    label: '▼▼ Strong Sell' },
};

function ScoreBar({ label, score, signal }: { label: string; score: number; signal: 'positive' | 'neutral' | 'negative' }) {
  const color = signal === 'positive' ? '#22c55e' : signal === 'negative' ? '#ef4444' : '#94a3b8';
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <span className="font-semibold font-mono" style={{ color }}>{score}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-default)' }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score}%`, background: color }} />
      </div>
    </div>
  );
}

export function ResearchScoreCard({ report }: { report: ResearchReport }) {
  const cfg = RATING_CONFIG[report.rating];

  return (
    <div className="rounded-2xl p-5 space-y-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>
            EdgeAI Research Rating
          </div>
          <div className="text-2xl font-bold" style={{ color: cfg.color }}>{cfg.label}</div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Confidence {report.confidence}% · {report.outlook}
          </div>
        </div>
        <div
          className="flex flex-col items-center justify-center rounded-xl shrink-0"
          style={{ width: 72, height: 72, background: cfg.bg, border: `1px solid ${cfg.color}30` }}
        >
          <span className="text-2xl font-black font-mono" style={{ color: cfg.color }}>{report.compositeScore}</span>
          <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: cfg.color }}>/ 100</span>
        </div>
      </div>

      {/* Price target */}
      {report.priceTarget && (
        <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
          <div>
            <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Analyst Price Target</div>
            <div className="text-lg font-bold font-mono" style={{ color: 'var(--text-primary)' }}>${report.priceTarget.toFixed(2)}</div>
          </div>
          {report.potentialUpside != null && (
            <div className="ml-auto text-right">
              <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Potential Return</div>
              <div
                className="text-lg font-bold font-mono"
                style={{ color: report.potentialUpside >= 0 ? 'var(--success)' : 'var(--danger)' }}
              >
                {report.potentialUpside >= 0 ? '+' : ''}{report.potentialUpside.toFixed(1)}%
              </div>
            </div>
          )}
        </div>
      )}

      {/* Score breakdown */}
      <div className="space-y-3">
        <div className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Score Breakdown</div>
        <ScoreBar label="Financial Health"  score={report.scores.financial.score}  signal={report.scores.financial.signal} />
        <ScoreBar label="Valuation"         score={report.scores.valuation.score}  signal={report.scores.valuation.signal} />
        <ScoreBar label="Price Momentum"    score={report.scores.momentum.score}   signal={report.scores.momentum.signal} />
        <ScoreBar label="Analyst Consensus" score={report.scores.analyst.score}    signal={report.scores.analyst.signal} />
        <ScoreBar label="Insider Activity"  score={report.scores.insider.score}    signal={report.scores.insider.signal} />
      </div>

      {/* Bull / Bear factors */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#4ade80' }}>Bull Factors</div>
          <div className="space-y-1.5">
            {report.bullFactors.slice(0, 3).map(f => (
              <div key={f.label} className="flex items-start gap-1.5">
                <span className="text-[10px] mt-0.5" style={{ color: '#4ade80' }}>▲</span>
                <div>
                  <div className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{f.label}</div>
                  <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{f.detail}</div>
                </div>
              </div>
            ))}
            {report.bullFactors.length === 0 && <div className="text-xs" style={{ color: 'var(--text-muted)' }}>No strong bull signals</div>}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#f87171' }}>Bear Factors</div>
          <div className="space-y-1.5">
            {report.bearFactors.slice(0, 3).map(f => (
              <div key={f.label} className="flex items-start gap-1.5">
                <span className="text-[10px] mt-0.5" style={{ color: '#f87171' }}>▼</span>
                <div>
                  <div className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{f.label}</div>
                  <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{f.detail}</div>
                </div>
              </div>
            ))}
            {report.bearFactors.length === 0 && <div className="text-xs" style={{ color: 'var(--text-muted)' }}>No significant bear signals</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
