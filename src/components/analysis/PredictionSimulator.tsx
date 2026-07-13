'use client';

import { useState, useMemo } from 'react';
import type { GameSimConfig, SimVariable } from '@/lib/simulatorData';
import { Sliders, RotateCcw, Zap } from 'lucide-react';

interface SimState {
  toggles: Record<string, boolean>;
  sliders: Record<string, number>;
}

function computeProbability(config: GameSimConfig, state: SimState): number {
  let delta = 0;
  for (const v of config.variables) {
    if (v.type === 'toggle') {
      if (state.toggles[v.id]) delta += v.effectDelta ?? 0;
    } else {
      const current = state.sliders[v.id] ?? v.sliderDefault ?? 50;
      const def = v.sliderDefault ?? 50;
      delta += (v.sliderEffectPerUnit ?? 0) * (current - def);
    }
  }
  return Math.max(5, Math.min(95, config.baseHomeWinProb + delta));
}

function defaultState(config: GameSimConfig): SimState {
  const toggles: Record<string, boolean> = {};
  const sliders: Record<string, number> = {};
  config.variables.forEach(v => {
    if (v.type === 'toggle') toggles[v.id] = v.defaultEnabled ?? false;
    else sliders[v.id] = v.sliderDefault ?? 50;
  });
  return { toggles, sliders };
}

const CATEGORY_COLOR: Record<SimVariable['category'], string> = {
  player:      'var(--accent)',
  environment: 'var(--info)',
  tactical:    'var(--warning)',
  fatigue:     'var(--text-secondary)',
};

const CATEGORY_LABEL: Record<SimVariable['category'], string> = {
  player:      'Player',
  environment: 'Environment',
  tactical:    'Tactical',
  fatigue:     'Fatigue',
};

export function PredictionSimulator({ config }: { config: GameSimConfig }) {
  const [state, setState] = useState<SimState>(() => defaultState(config));

  const currentProb = useMemo(() => computeProbability(config, state), [config, state]);
  const delta = currentProb - config.baseHomeWinProb;
  const winner = currentProb >= 50 ? config.homeTeamName : config.awayTeamName;
  const displayProb = currentProb >= 50 ? currentProb : 100 - currentProb;

  const toggleVar = (id: string) =>
    setState(s => ({ ...s, toggles: { ...s.toggles, [id]: !s.toggles[id] } }));

  const setSlider = (id: string, value: number) =>
    setState(s => ({ ...s, sliders: { ...s.sliders, [id]: value } }));

  const reset = () => setState(defaultState(config));

  const isModified = useMemo(() => {
    const def = defaultState(config);
    return JSON.stringify(state) !== JSON.stringify(def);
  }, [config, state]);

  const toggleVars = config.variables.filter(v => v.type === 'toggle');
  const sliderVars = config.variables.filter(v => v.type === 'slider');

  return (
    <div className="space-y-5">
      {/* Result banner */}
      <div
        className="rounded-xl p-4"
        style={{
          background: isModified ? 'var(--accent-dim)' : 'var(--bg-elevated)',
          border: `1px solid ${isModified ? 'rgba(99,102,241,0.4)' : 'var(--border-default)'}`,
          transition: 'all 0.2s',
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Zap size={14} style={{ color: 'var(--accent-light)' }} />
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Simulated Outcome
            </span>
          </div>
          {isModified && (
            <button
              onClick={reset}
              className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg transition-all"
              style={{ color: 'var(--text-muted)', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
            >
              <RotateCcw size={11} />
              Reset
            </button>
          )}
        </div>

        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-2xl font-bold text-mono" style={{ color: 'var(--text-primary)' }}>
            {winner}
          </span>
          <span className="text-lg font-bold text-mono" style={{ color: 'var(--accent-light)' }}>
            {displayProb.toFixed(1)}%
          </span>
          {isModified && (
            <span className="text-sm font-semibold text-mono" style={{ color: delta >= 0 ? 'var(--success)' : 'var(--danger)' }}>
              ({delta >= 0 ? '+' : ''}{delta.toFixed(1)}pp vs baseline)
            </span>
          )}
        </div>

        {/* Probability bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
            <span>{config.homeTeamName}: {currentProb.toFixed(1)}%</span>
            <span>{config.awayTeamName}: {(100 - currentProb).toFixed(1)}%</span>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--border-default)' }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${currentProb}%`,
                background: 'var(--accent)',
                transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Toggle variables */}
      {toggleVars.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
            Scenario Toggles
          </h4>
          <div className="space-y-2">
            {toggleVars.map(v => {
              const enabled = state.toggles[v.id];
              return (
                <button
                  key={v.id}
                  onClick={() => toggleVar(v.id)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all"
                  style={{
                    background: enabled ? `${CATEGORY_COLOR[v.category]}18` : 'var(--bg-elevated)',
                    border: `1px solid ${enabled ? CATEGORY_COLOR[v.category] + '50' : 'var(--border-subtle)'}`,
                    cursor: 'pointer',
                  }}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full mt-1 shrink-0"
                      style={{ background: CATEGORY_COLOR[v.category] }}
                    />
                    <div>
                      <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{v.label}</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{v.description}</div>
                      <div className="text-[10px] mt-0.5 font-semibold uppercase" style={{ color: CATEGORY_COLOR[v.category] }}>
                        {CATEGORY_LABEL[v.category]} · {v.effectDelta! >= 0 ? '+' : ''}{v.effectDelta!.toFixed(1)}pp
                      </div>
                    </div>
                  </div>
                  {/* Toggle pill */}
                  <div
                    className="w-9 h-5 rounded-full relative ml-3 shrink-0 transition-colors"
                    style={{ background: enabled ? 'var(--accent)' : 'var(--border-default)' }}
                  >
                    <div
                      className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
                      style={{ left: '2px', transform: enabled ? 'translateX(16px)' : 'translateX(0)' }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Slider variables */}
      {sliderVars.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
            <Sliders size={12} className="inline mr-1" />
            Variable Adjustments
          </h4>
          <div className="space-y-4">
            {sliderVars.map(v => {
              const val = state.sliders[v.id] ?? v.sliderDefault ?? 50;
              const min = v.sliderMin ?? 0, max = v.sliderMax ?? 100, def = v.sliderDefault ?? 50;
              const pct = ((val - min) / (max - min)) * 100;
              const deltaEffect = (v.sliderEffectPerUnit ?? 0) * (val - def);
              return (
                <div key={v.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div>
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{v.label}</span>
                      <span
                        className="ml-2 text-xs font-semibold text-mono"
                        style={{ color: deltaEffect >= 0 ? 'var(--success)' : 'var(--danger)' }}
                      >
                        {deltaEffect >= 0 ? '+' : ''}{deltaEffect.toFixed(1)}pp
                      </span>
                    </div>
                    <span className="text-sm font-bold text-mono" style={{ color: 'var(--text-primary)' }}>
                      {val}{v.sliderLabel ? ` ${v.sliderLabel}` : ''}
                    </span>
                  </div>
                  <div className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>{v.description}</div>
                  <input
                    type="range"
                    min={min}
                    max={max}
                    step={1}
                    value={val}
                    onChange={e => setSlider(v.id, Number(e.target.value))}
                    className="w-full"
                    style={{
                      appearance: 'none',
                      height: '4px',
                      borderRadius: '2px',
                      background: `linear-gradient(90deg, var(--accent) ${pct}%, var(--border-default) ${pct}%)`,
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  />
                  <div className="flex justify-between text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                    <span>{min}</span>
                    <span>Default: {def}</span>
                    <span>{max}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ML backend note */}
      <div
        className="rounded-xl px-4 py-3 text-xs flex items-center gap-2"
        style={{ background: 'var(--accent-dim)', border: '1px solid rgba(99,102,241,0.2)', color: 'var(--text-muted)' }}
      >
        <Zap size={12} style={{ color: 'var(--accent-light)', flexShrink: 0 }} />
        Currently using approximation formulas · Will use ML re-inference once model API is connected
      </div>
    </div>
  );
}
