import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getGameById } from '@/lib/api';
import { GAME_SIM_CONFIGS } from '@/lib/simulatorData';
import { getEspnGameSummary } from '@/lib/providers/gameSummary';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import { ConfidenceGauge } from '@/components/analysis/ConfidenceGauge';
import { FactorsList } from '@/components/analysis/FactorsList';
import { WinProbabilityBar } from '@/components/analysis/WinProbabilityBar';
import { TeamRadar } from '@/components/analysis/TeamRadar';
import { BettingIntelligence } from '@/components/analysis/BettingIntelligence';
import { HeadToHead } from '@/components/analysis/HeadToHead';
import { ExplainableAI } from '@/components/analysis/ExplainableAI';
import { MatchupTable } from '@/components/analysis/MatchupTable';
import { GameContextCard } from '@/components/analysis/GameContextCard';
import { PredictionSimulator } from '@/components/analysis/PredictionSimulator';
import { MatchReview } from '@/components/analysis/MatchReview';
import { MarketComparison } from '@/components/analysis/MarketComparison';
import { PlayerPropsEV } from '@/components/analysis/PlayerPropsEV';
import { formatDate, sportIcon } from '@/lib/utils';
import { ArrowLeft, Calendar, MapPin, Wind, CheckCircle } from 'lucide-react';
import type { Team } from '@/lib/types';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const game = await getGameById(id);
  if (!game) return { title: 'Game Not Found' };
  return { title: `${game.homeTeam.abbreviation} vs ${game.awayTeam.abbreviation} · ${game.sport}` };
}

export default async function GamePage({ params }: Props) {
  const { id } = await params;
  const game = await getGameById(id);
  if (!game) notFound();

  const { homeTeam, awayTeam, prediction } = game;
  const winnerIsHome = prediction.winner === homeTeam.name;
  const homeWinPct = winnerIsHome ? prediction.winProbability : 100 - prediction.winProbability;
  const simConfig = GAME_SIM_CONFIGS[id] ?? null;

  // For Final ESPN games, fetch period-by-period breakdown
  const isFinal = game.status === 'Final' || game.status === 'Final/OT' || game.status === 'Final/SO';
  const rawIdPart = id.startsWith('espn-') ? id.slice(5) : '';
  const lastHyph = rawIdPart.lastIndexOf('-');
  const espnEventId = isFinal && lastHyph > 0 ? rawIdPart.slice(lastHyph + 1) : null;
  const gameSummary = espnEventId
    ? await getEspnGameSummary(espnEventId, game.sport, game.league)
    : null;

  return (
    <div className="p-6 max-w-screen-xl mx-auto space-y-6 anim-fade-in">

      {/* Back + V2 links */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
          <ArrowLeft size={14} />
          All Games
        </Link>
        <div className="flex items-center gap-2">
          <Link href={`/game/${id}/analyst`}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg cursor-pointer hover:opacity-75 transition-opacity"
            style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', color: '#3b82f6' }}>
            <CheckCircle size={12} />
            AI Analyst Report
          </Link>
          <Link href={`/live/${id}`}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg cursor-pointer hover:opacity-75 transition-opacity"
            style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
            ● Live Tracker
          </Link>
        </div>
      </div>

      {/* Game Hero */}
      <div
        className="rounded-2xl p-6"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}
      >
        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className="text-base">{sportIcon(game.sport)}</span>
          <Badge variant="accent">{game.league}</Badge>
          {game.status === 'Final' && (
            <span
              className="text-xs font-bold px-2 py-0.5 rounded"
              style={{ background: 'rgba(34,197,94,0.12)', color: 'var(--success)' }}
            >
              FINAL
            </span>
          )}
          {game.status === 'Live' && (
            <span
              className="text-xs font-bold px-2 py-0.5 rounded animate-pulse"
              style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}
            >
              ● LIVE
            </span>
          )}
          <div className="flex items-center gap-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            <Calendar size={12} />
            {formatDate(game.date)} · {game.time}
          </div>
          <div className="flex items-center gap-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            <MapPin size={12} />
            {game.venue}
          </div>
          {game.weather && (
            <div className="flex items-center gap-1 text-sm" style={{ color: 'var(--text-muted)' }}>
              <Wind size={12} />
              {game.weather.temp}°F · {game.weather.condition}
            </div>
          )}
        </div>

        {/* Teams + scores */}
        <div className="flex items-center gap-6 mb-6">
          <TeamBlock team={homeTeam} isHome label="Home" isWinner={winnerIsHome} />
          <div className="flex flex-col items-center flex-1 gap-1">
            {isFinal && game.homeScore !== undefined && game.awayScore !== undefined ? (
              <>
                {/* Final score */}
                <div className="flex items-baseline gap-2 text-4xl font-black font-mono">
                  <span style={{ color: homeTeam.color }}>{game.homeScore}</span>
                  <span className="text-xl" style={{ color: 'var(--text-muted)' }}>–</span>
                  <span style={{ color: awayTeam.color }}>{game.awayScore}</span>
                </div>
                <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Final score</span>
                {/* Predicted score comparison */}
                <div
                  className="mt-2 px-3 py-1.5 rounded-lg flex items-center gap-2"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
                >
                  <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>EdgeAI predicted</span>
                  <span className="text-sm font-bold font-mono" style={{ color: homeTeam.color }}>{prediction.predictedScore.home}</span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>–</span>
                  <span className="text-sm font-bold font-mono" style={{ color: awayTeam.color }}>{prediction.predictedScore.away}</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-baseline gap-2 text-4xl font-black font-mono">
                  <span style={{ color: homeTeam.color }}>{prediction.predictedScore.home}</span>
                  <span className="text-xl" style={{ color: 'var(--text-muted)' }}>–</span>
                  <span style={{ color: awayTeam.color }}>{prediction.predictedScore.away}</span>
                </div>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Predicted score</span>
              </>
            )}
          </div>
          <TeamBlock team={awayTeam} isHome={false} label="Away" isWinner={!winnerIsHome} />
        </div>

        <WinProbabilityBar
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          homeWinPct={homeWinPct}
          monteCarloHomeWinPct={winnerIsHome ? prediction.monteCarloWinRate : 100 - prediction.monteCarloWinRate}
          bayesianHomeWinPct={winnerIsHome ? prediction.bayesianProbability : 100 - prediction.bayesianProbability}
        />
      </div>

      {/* Match Review — shown for completed games */}
      {isFinal && (
        <Card title="Match Review">
          <MatchReview
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            winnerProbability={prediction.winProbability}
            actualWinner={prediction.winner}
            summary={gameSummary}
          />
        </Card>
      )}

      {/* Main 3-column grid */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Left col */}
        <div className="space-y-5">
          <Card title="AI Prediction">
            <div className="flex flex-col items-center gap-4">
              <ConfidenceGauge
                confidence={prediction.confidence}
                winProbability={prediction.winProbability}
                label={`${prediction.winner} wins`}
              />
              <div className="grid grid-cols-2 gap-3 w-full">
                <StatCard label="Upset prob." value={`${prediction.upsetProbability.toFixed(1)}%`} />
                <StatCard label="Margin"       value={`+${prediction.expectedMargin}`} sub="points" />
                <StatCard label="Monte Carlo"  value={`${prediction.monteCarloWinRate.toFixed(1)}%`} />
                <StatCard label="Bayesian"     value={`${prediction.bayesianProbability.toFixed(1)}%`} />
              </div>
            </div>
          </Card>

          <Card title="Key Players">
            <div className="space-y-2 text-sm">
              <InfoRow label="Player of match"  value={prediction.playerOfMatch} />
              <InfoRow label="Highest impact"   value={prediction.highestImpactPlayer} />
              <InfoRow label="Uncertainty var." value={prediction.lowestConfidenceVar} small />
            </div>
          </Card>

          <Card title="Game Context">
            <GameContextCard game={game} />
          </Card>
        </div>

        {/* Middle + right col */}
        <div className="lg:col-span-2 space-y-5">
          <Card title="Prediction Factors">
            <FactorsList factors={prediction.factors} />
          </Card>

          <Card title="Why This Prediction?" elevated>
            <ExplainableAI game={game} />
          </Card>

          <Card title="Game Flow Prediction">
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {prediction.gameFlow}
            </p>
          </Card>

          <Card title="Team Radar Comparison">
            <TeamRadar homeTeam={homeTeam} awayTeam={awayTeam} />
          </Card>
        </div>
      </div>

      {/* Full-width matchup table */}
      <Card title="Head-to-Head Stats">
        <MatchupTable homeTeam={homeTeam} awayTeam={awayTeam} />
      </Card>

      {/* H2H history + betting */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="Historical Matchup">
          <HeadToHead game={game} />
        </Card>
        <Card title="Betting Intelligence">
          <BettingIntelligence game={game} />
        </Card>
      </div>

      {/* PrizePicks +EV Player Props */}
      <Card title="PrizePicks +EV Player Props" elevated>
        <PlayerPropsEV
          sport={game.sport}
          homeTeam={homeTeam.name}
          awayTeam={awayTeam.name}
        />
      </Card>

      {/* Prediction Market Intelligence */}
      <Card title="Prediction Market Intelligence" elevated>
        <MarketComparison game={game} />
      </Card>

      {/* Prediction Simulator */}
      {simConfig ? (
        <Card title="What If? Prediction Simulator" elevated>
          <div className="mb-3 flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <CheckCircle size={13} style={{ color: 'var(--success)' }} />
            Adjust variables below and see how the predicted win probability changes instantly.
          </div>
          <PredictionSimulator config={simConfig} />
        </Card>
      ) : (
        <div
          className="rounded-2xl px-5 py-4 text-sm"
          style={{ background: 'var(--bg-card)', border: '1px dashed var(--border-default)', color: 'var(--text-muted)' }}
        >
          Prediction simulator config not available for this game yet.
        </div>
      )}
    </div>
  );
}

function TeamBlock({ team, isHome, label, isWinner }: { team: Team; isHome: boolean; label: string; isWinner: boolean }) {
  return (
    <div className={`flex flex-col gap-2 flex-1 ${isHome ? '' : 'items-end text-right'}`}>
      <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black text-white"
        style={{ background: team.color, boxShadow: isWinner ? `0 0 20px ${team.color}50` : 'none' }}
      >
        {team.abbreviation.slice(0, 3)}
      </div>
      <div>
        <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{team.name}</p>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{team.record} · #{team.powerRanking} Power</p>
      </div>
      <div className="flex gap-1.5" style={{ flexDirection: isHome ? 'row' : 'row-reverse' }}>
        {team.last5.map((r, i) => (
          <span
            key={i}
            className="w-5 h-5 rounded text-xs font-bold flex items-center justify-center"
            style={{
              background: r === 'W' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
              color: r === 'W' ? 'var(--success)' : 'var(--danger)',
            }}
          >
            {r}
          </span>
        ))}
      </div>
      {isWinner && (
        <div
          className="text-[10px] font-bold uppercase px-2 py-0.5 rounded"
          style={{ background: 'var(--success-dim)', color: 'var(--success)' }}
        >
          Pick
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="flex justify-between items-start gap-2 py-1.5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span
        className={`font-medium text-right ${small ? 'text-xs max-w-[140px]' : ''}`}
        style={{ color: value ? 'var(--text-primary)' : 'var(--text-muted)' }}
      >
        {value || '—'}
      </span>
    </div>
  );
}
