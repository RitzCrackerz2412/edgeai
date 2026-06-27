'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import type { SportConfig } from '@/lib/sports/config';
import { getTeamsBySport } from '@/lib/data/teams';

export default function SportPredictions({ config }: { config: SportConfig }) {
  const teams = useMemo(() => getTeamsBySport(config.sport), [config.sport]);

  const matchups = useMemo(() => {
    const sorted = [...teams].sort((a, b) => b.eloRating - a.eloRating);
    const pairs = [];
    for (let i = 0; i < Math.min(8, sorted.length - 1); i += 2) {
      const home = sorted[i];
      const away = sorted[i + 1];
      const result = config.predict(home, away);
      pairs.push({ home, away, result });
    }
    return pairs;
  }, [teams, config]);

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{config.name} AI Predictions</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Sport-specific machine learning predictions for upcoming matchups
        </p>
      </div>

      {/* Model info banner */}
      <div className="rounded-xl p-4 flex flex-wrap gap-4 items-center"
        style={{ background: `${config.color}10`, border: `1px solid ${config.color}25` }}>
        <span className="text-3xl">{config.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            EdgeAI {config.name} Prediction Model v3.2
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Analyzes {config.matchupFactors.length} sport-specific factors: {config.matchupFactors.map(f => f.label).join(', ')}
          </p>
        </div>
        <div className="flex gap-4">
          <div className="text-center">
            <p className="text-lg font-bold font-mono" style={{ color: config.color }}>73%</p>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Season Accuracy</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold font-mono" style={{ color: config.color }}>{matchups.length}</p>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Predictions</p>
          </div>
        </div>
      </div>

      {/* Predictions grid */}
      {matchups.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Not enough {config.competitorLabel.toLowerCase()}s for predictions. Add more teams to get AI forecasts.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {matchups.map(({ home, away, result }) => {
            const hp = Math.round(result.homeWinProb * 100);
            const dp = result.drawProb ? Math.round(result.drawProb * 100) : 0;
            const ap = 100 - hp - dp;
            const favorite = hp > ap ? home : away;
            const favProb = hp > ap ? hp : ap;
            return (
              <div key={`${home.id}-${away.id}`}
                className="rounded-xl p-4 space-y-3"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
                {/* Teams header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold"
                      style={{ background: `${home.color}22`, color: home.color }}>
                      {home.abbreviation?.slice(0, 3) ?? home.name.slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{home.name}</p>
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{home.record}</p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded"
                    style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>vs</span>
                  <div className="flex items-center gap-2 flex-row-reverse">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold"
                      style={{ background: `${away.color}22`, color: away.color }}>
                      {away.abbreviation?.slice(0, 3) ?? away.name.slice(0, 2)}
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{away.name}</p>
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{away.record}</p>
                    </div>
                  </div>
                </div>

                {/* Win probability bar */}
                <div className="space-y-1">
                  <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
                    <div style={{ width: `${hp}%`, background: home.color }} />
                    {dp > 0 && <div style={{ width: `${dp}%`, background: '#94a3b8' }} />}
                    <div style={{ width: `${ap}%`, background: away.color }} />
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span style={{ color: home.color }}>{hp}%</span>
                    {dp > 0 && <span style={{ color: '#94a3b8' }}>Draw {dp}%</span>}
                    <span style={{ color: away.color }}>{ap}%</span>
                  </div>
                </div>

                {/* Projected score */}
                {result.projectedScore && (
                  <div className="flex justify-center gap-4 py-1">
                    <span className="text-base font-bold font-mono" style={{ color: home.color }}>
                      {result.projectedScore.home}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>–</span>
                    <span className="text-base font-bold font-mono" style={{ color: away.color }}>
                      {result.projectedScore.away}
                    </span>
                  </div>
                )}

                {/* AI verdict */}
                <div className="rounded-lg p-2.5" style={{ background: 'var(--bg-elevated)' }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                      EdgeAI Pick
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded"
                      style={{ background: `${config.color}20`, color: config.color }}>
                      {result.confidence}% confidence
                    </span>
                  </div>
                  <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                    {favorite.name} to win · {favProb}%
                  </p>
                  <p className="text-[11px] mt-1 leading-5" style={{ color: 'var(--text-muted)' }}>
                    {result.keyFactors[0]?.label}: {result.keyFactors[0]?.detail}
                  </p>
                </div>

                <Link href={`/${config.slug}/matchup`}
                  className="block text-center text-xs py-1.5 rounded-lg font-medium transition-opacity hover:opacity-80"
                  style={{ background: `${config.color}15`, color: config.color }}>
                  Full Matchup Analysis →
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
