'use client';

import { Team } from '@/lib/types';

interface WinProbabilityBarProps {
  homeTeam: Team;
  awayTeam: Team;
  homeWinPct: number;
  monteCarloHomeWinPct?: number;
  bayesianHomeWinPct?: number;
}

export function WinProbabilityBar({ homeTeam, awayTeam, homeWinPct, monteCarloHomeWinPct, bayesianHomeWinPct }: WinProbabilityBarProps) {
  const awayWinPct = 100 - homeWinPct;

  return (
    <div className="space-y-3">
      <div className="flex justify-between text-sm font-semibold">
        <span style={{ color: homeTeam.color }}>{homeTeam.name}</span>
        <span style={{ color: 'var(--text-muted)' }}>Win Probability</span>
        <span style={{ color: awayTeam.color }}>{awayTeam.name}</span>
      </div>
      <div className="relative h-8 rounded-lg overflow-hidden flex">
        <div
          className="h-full flex items-center justify-start pl-3 text-sm font-bold text-white transition-all duration-1000"
          style={{ width: `${homeWinPct}%`, background: homeTeam.color }}
        >
          {homeWinPct.toFixed(1)}%
        </div>
        <div
          className="h-full flex items-center justify-end pr-3 text-sm font-bold text-white transition-all duration-1000"
          style={{ width: `${awayWinPct}%`, background: awayTeam.color }}
        >
          {awayWinPct.toFixed(1)}%
        </div>
      </div>
      {(monteCarloHomeWinPct !== undefined || bayesianHomeWinPct !== undefined) && (
        <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
          {monteCarloHomeWinPct !== undefined && (
            <span>Monte Carlo: {monteCarloHomeWinPct.toFixed(1)}%</span>
          )}
          {bayesianHomeWinPct !== undefined && (
            <span>Bayesian: {bayesianHomeWinPct.toFixed(1)}%</span>
          )}
        </div>
      )}
    </div>
  );
}
