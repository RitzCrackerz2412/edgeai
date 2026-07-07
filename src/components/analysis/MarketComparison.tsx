'use client';

import type { Game } from '@/lib/types';
import type { MarketAnalysis, MarketEdge } from '@/lib/markets/types';
import { formatOdds } from '@/lib/utils';

interface Props { game: Game }

// ── Edge badge colors ─────────────────────────────────────────────────────────

const EDGE_STYLE: Record<MarketEdge, { bg: string; color: string; dot: string }> = {
  'strong-model':    { bg: 'rgba(34,197,94,0.12)',  color: '#22c55e', dot: '#22c55e' },
  'moderate-model':  { bg: 'rgba(34,197,94,0.08)',  color: '#86efac', dot: '#86efac' },
  'agreement':       { bg: 'rgba(99,102,241,0.10)', color: '#818cf8', dot: '#818cf8' },
  'moderate-market': { bg: 'rgba(251,191,36,0.10)', color: '#fbbf24', dot: '#fbbf24' },
  'strong-market':   { bg: 'rgba(239,68,68,0.10)',  color: '#f87171', dot: '#f87171' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function ProbBar({ homeProb, awayProb, homeColor, awayColor, homeLabel, awayLabel }: {
  homeProb: number; awayProb: number;
  homeColor: string; awayColor: string;
  homeLabel: string; awayLabel: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex h-6 rounded-lg overflow-hidden" style={{ gap: 2 }}>
        <div
          className="flex items-center justify-start pl-2 text-[11px] font-bold"
          style={{ width: `${homeProb}%`, background: homeColor, color: '#fff', minWidth: 30 }}
        >
          {homeProb.toFixed(0)}%
        </div>
        <div
          className="flex items-center justify-end pr-2 text-[11px] font-bold"
          style={{ width: `${awayProb}%`, background: awayColor, color: '#fff', minWidth: 30 }}
        >
          {awayProb.toFixed(0)}%
        </div>
      </div>
      <div className="flex justify-between text-[10px]" style={{ color: 'var(--text-muted)' }}>
        <span>{homeLabel}</span>
        <span>{awayLabel}</span>
      </div>
    </div>
  );
}

function Row({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <div className="text-right">
        <span className="text-xs font-semibold font-mono" style={{ color: accent ?? 'var(--text-primary)' }}>{value}</span>
        {sub && <span className="text-[10px] ml-1.5" style={{ color: 'var(--text-muted)' }}>{sub}</span>}
      </div>
    </div>
  );
}

function MovementSignalBadge({ signal }: { signal: MarketAnalysis['movementSignal'] }) {
  const MAP = {
    'sharp-money':  { label: 'Sharp Money',  color: '#f59e0b' },
    'injury-news':  { label: 'Injury Alert', color: '#ef4444' },
    'public-heavy': { label: 'Public Action',color: '#6366f1' },
    'neutral':      { label: 'Stable',       color: 'var(--text-muted)' },
  };
  const { label, color } = MAP[signal];
  return (
    <span
      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: `${color}18`, color }}
    >
      {label}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function MarketComparison({ game }: Props) {
  const { homeTeam, awayTeam, prediction } = game;
  const ma: MarketAnalysis | undefined = prediction.marketAnalysis;

  if (!ma) {
    return (
      <p className="text-sm py-4 text-center" style={{ color: 'var(--text-muted)' }}>
        Market analysis not available.
      </p>
    );
  }

  const style  = EDGE_STYLE[ma.edgeClassification];
  const edgePP = ma.homeEdge;
  const edgeSign = edgePP > 0 ? '+' : '';

  return (
    <div className="space-y-5">

      {/* Disclaimer */}
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        Market data is one input among many. EdgeAI generates independent statistical predictions — odds never override the model.
      </p>

      {/* Edge classification badge */}
      <div
        className="flex items-center gap-3 rounded-xl px-4 py-3"
        style={{ background: style.bg, border: `1px solid ${style.color}30` }}
      >
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: style.dot }} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold" style={{ color: style.color }}>{ma.edgeLabel}</p>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            {ma.hasLiveOdds
              ? `EdgeAI ${edgeSign}${Math.abs(edgePP).toFixed(1)}pp vs market on ${homeTeam.abbreviation}`
              : 'Configure ODDS_API_KEY to enable live market comparison'}
          </p>
        </div>
        {ma.hasLiveOdds && (
          <div className="text-right">
            <p className="text-xl font-black font-mono" style={{ color: style.color }}>
              {edgeSign}{edgePP.toFixed(1)}
            </p>
            <p className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>pp edge</p>
          </div>
        )}
      </div>

      {/* Probability comparison */}
      <div className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Win Probability
        </p>
        <div className="space-y-2.5">
          <div>
            <p className="text-[10px] mb-1" style={{ color: 'var(--text-muted)' }}>EdgeAI Model</p>
            <ProbBar
              homeProb={ma.modelHomeProb} awayProb={ma.modelAwayProb}
              homeColor={homeTeam.color} awayColor={awayTeam.color}
              homeLabel={homeTeam.abbreviation} awayLabel={awayTeam.abbreviation}
            />
          </div>
          {ma.hasLiveOdds && (
            <div>
              <p className="text-[10px] mb-1" style={{ color: 'var(--text-muted)' }}>Market Implied</p>
              <ProbBar
                homeProb={ma.marketHomeProb} awayProb={ma.marketAwayProb}
                homeColor={`${homeTeam.color}99`} awayColor={`${awayTeam.color}99`}
                homeLabel={homeTeam.abbreviation} awayLabel={awayTeam.abbreviation}
              />
            </div>
          )}
        </div>
      </div>

      {/* Odds grid */}
      {ma.hasLiveOdds && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Moneyline', home: formatOdds(ma.homeMoneyline), away: formatOdds(ma.awayMoneyline) },
            { label: 'Opening',   home: formatOdds(ma.openingHomeMoneyline), away: formatOdds(ma.openingAwayMoneyline) },
            { label: 'Spread / O-U', home: ma.spread > 0 ? `+${ma.spread}` : `${ma.spread}`, away: ma.overUnder ? `${ma.overUnder}` : '—' },
          ].map(c => (
            <div
              key={c.label}
              className="rounded-lg p-2.5 text-center"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
            >
              <p className="text-[9px] uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>{c.label}</p>
              <p className="text-xs font-mono font-bold" style={{ color: homeTeam.color }}>{c.home}</p>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>vs</p>
              <p className="text-xs font-mono font-bold" style={{ color: awayTeam.color }}>{c.away}</p>
            </div>
          ))}
        </div>
      )}

      {/* Line movement */}
      {ma.hasLiveOdds && (
        <div className="rounded-xl p-3 space-y-2" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>Line Movement</p>
            <MovementSignalBadge signal={ma.movementSignal} />
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>ML Move</p>
              <p className="font-mono font-bold" style={{ color: ma.moneylineMovement === 0 ? 'var(--text-muted)' : ma.moneylineMovement < 0 ? '#22c55e' : '#ef4444' }}>
                {ma.moneylineMovement === 0 ? '—' : `${ma.moneylineMovement > 0 ? '+' : ''}${ma.moneylineMovement}`}
              </p>
            </div>
            <div>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Spread Move</p>
              <p className="font-mono font-bold" style={{ color: ma.spreadMovement === 0 ? 'var(--text-muted)' : '#f59e0b' }}>
                {ma.spreadMovement === 0 ? 'Stable' : `${ma.spreadMovement > 0 ? '+' : ''}${ma.spreadMovement.toFixed(1)}`}
              </p>
            </div>
          </div>
          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{ma.movementExplanation}</p>
        </div>
      )}

      {/* Public vs sharp */}
      {ma.hasLiveOdds && (
        <div>
          <Row
            label="Public betting"
            value={`${homeTeam.abbreviation} ${ma.publicBettingPctHome}% · ${awayTeam.abbreviation} ${ma.publicBettingPctAway}%`}
          />
          <Row
            label="Sharp money"
            value={ma.sharpMoneyDirection === 'split' ? 'Split' : ma.sharpMoneyDirection === 'home' ? homeTeam.name : awayTeam.name}
            accent={ma.sharpMoneyDirection === 'split' ? undefined : style.color}
          />
        </div>
      )}

      {/* Confidence impact */}
      <div className="rounded-xl p-3 space-y-1" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>Confidence Impact</p>
          <span
            className="text-xs font-mono font-bold"
            style={{ color: ma.confidenceAdjustment >= 0 ? '#22c55e' : '#f87171' }}
          >
            {ma.confidenceAdjustment >= 0 ? '+' : ''}{ma.confidenceAdjustment}pp
          </span>
        </div>
        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{ma.confidenceReason}</p>
      </div>

      {/* AI explanation */}
      <div className="rounded-xl p-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
        <p className="text-[11px] font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Market Analysis</p>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {ma.marketExplanation}
        </p>
      </div>
    </div>
  );
}
