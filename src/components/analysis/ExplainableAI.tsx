import type { Game } from '@/lib/types';
import { ExplainableAIChart } from './ExplainableAIChart';
import { Brain, AlertTriangle, Shuffle } from 'lucide-react';

interface Scenario {
  label: string;
  winner: string;
  probability: number;
}

// Derive mock alternative scenarios from the game factors
function buildScenarios(game: Game): Scenario[] {
  const { homeTeam, awayTeam, prediction } = game;
  const base = prediction.winProbability;
  const topNeg = prediction.factors.filter(f => !f.positive).sort((a, b) => b.weight - a.weight).slice(0, 2);
  const topPos = prediction.factors.filter(f => f.positive).sort((a, b) => b.weight - a.weight)[0];

  const scenarios: Scenario[] = [];

  if (topNeg[0]) {
    const adj = Math.max(5, Math.min(95, base + topNeg[0].weight * 2.5));
    const winner = adj >= 50 ? prediction.winner : (prediction.winner === homeTeam.name ? awayTeam.name : homeTeam.name);
    scenarios.push({ label: `If ${topNeg[0].label.toLowerCase().replace(/\(.*\)/, '').trim()} intensifies`, winner, probability: adj });
  }
  if (topNeg[1]) {
    const adj = Math.max(5, Math.min(95, base + topNeg[1].weight * 2.5));
    const winner = adj >= 50 ? prediction.winner : (prediction.winner === homeTeam.name ? awayTeam.name : homeTeam.name);
    scenarios.push({ label: `If ${topNeg[1].label.toLowerCase().replace(/\(.*\)/, '').trim()} materialises`, winner, probability: adj });
  }
  if (topPos) {
    const adj = Math.min(95, base + topPos.weight);
    scenarios.push({ label: `If ${topPos.label.toLowerCase().replace(/\(.*\)/, '').trim()} holds`, winner: prediction.winner, probability: adj });
  }

  return scenarios;
}

// Derive confidence categories from factors
function buildCategories(game: Game) {
  const total = game.prediction.factors.reduce((s, f) => s + Math.abs(f.weight), 0);
  if (total === 0) return [];
  const cats: Record<string, number> = {};
  game.prediction.factors.forEach(f => {
    const cat = f.label.toLowerCase().includes('player') || f.label.toLowerCase().includes('mahomes') ||
      f.label.toLowerCase().includes('lebron') || f.label.toLowerCase().includes('haaland') ||
      f.label.toLowerCase().includes('jones') || f.label.toLowerCase().includes('cole') ||
      f.label.toLowerCase().includes('mackinnon') || f.label.toLowerCase().includes('tatum') ||
      f.label.toLowerCase().includes('stipe') ? 'Player' :
      f.label.toLowerCase().includes('weather') || f.label.toLowerCase().includes('cold') ||
      f.label.toLowerCase().includes('altitude') || f.label.toLowerCase().includes('venue') ? 'Environment' :
      f.label.toLowerCase().includes('home') || f.label.toLowerCase().includes('away') ||
      f.label.toLowerCase().includes('record') || f.label.toLowerCase().includes('split') ? 'Home/Away' :
      'Team Performance';
    cats[cat] = (cats[cat] ?? 0) + Math.abs(f.weight);
  });
  return Object.entries(cats).map(([label, v]) => ({ label, pct: Math.round((v / total) * 100) })).sort((a, b) => b.pct - a.pct);
}

export function ExplainableAI({ game }: { game: Game }) {
  const scenarios = buildScenarios(game);
  const categories = buildCategories(game);

  return (
    <div className="space-y-6">
      {/* Factor Importance */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Brain size={13} style={{ color: 'var(--accent-light)' }} />
          <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Factor Importance (model weights)
          </h4>
        </div>
        <ExplainableAIChart factors={game.prediction.factors} />
      </div>

      {/* Confidence contribution */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Confidence Contribution by Category
          </span>
        </div>
        <div className="space-y-2.5">
          {categories.map(cat => (
            <div key={cat.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{cat.label}</span>
                <span className="text-sm font-semibold text-mono" style={{ color: 'var(--text-primary)' }}>{cat.pct}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-default)' }}>
                <div className="h-full rounded-full" style={{ width: `${cat.pct}%`, background: 'var(--accent)' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upset risk */}
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl"
        style={{
          background: game.prediction.upsetProbability >= 35 ? 'var(--danger-dim)' : 'var(--warning-dim)',
          border: `1px solid ${game.prediction.upsetProbability >= 35 ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}`,
        }}
      >
        <AlertTriangle size={16} style={{ color: game.prediction.upsetProbability >= 35 ? 'var(--danger)' : 'var(--warning)', flexShrink: 0 }} />
        <div>
          <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Upset probability: {game.prediction.upsetProbability.toFixed(1)}%
          </div>
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {game.prediction.upsetProbability >= 35
              ? 'High upset risk — significant uncertainty in this matchup'
              : game.prediction.upsetProbability >= 25
              ? 'Moderate upset risk — outcome not guaranteed'
              : 'Low upset risk — prediction is well-supported'}
          </div>
        </div>
      </div>

      {/* Alternative scenarios */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Shuffle size={13} style={{ color: 'var(--info)' }} />
          <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Alternative Scenarios
          </h4>
        </div>
        <div className="space-y-2">
          {scenarios.map((s, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{s.label}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>→ {s.winner} wins</div>
              </div>
              <div
                className="ml-3 text-sm font-bold text-mono px-2 py-0.5 rounded shrink-0"
                style={{
                  background: s.probability >= 60 ? 'var(--success-dim)' : s.probability >= 40 ? 'var(--accent-dim)' : 'var(--danger-dim)',
                  color: s.probability >= 60 ? 'var(--success)' : s.probability >= 40 ? 'var(--accent-light)' : 'var(--danger)',
                }}
              >
                {s.probability.toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
