'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Play, Pause, RotateCcw } from 'lucide-react';
import type { Game } from '@/lib/types';
import { initLiveGame, tick } from '@/lib/live/engine';
import type { LiveGameState } from '@/lib/live/engine';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts';

function WinProbBar({ homeProb, homeColor, awayColor, homeTeam, awayTeam }: {
  homeProb: number; homeColor: string; awayColor: string; homeTeam: string; awayTeam: string;
}) {
  const homePct = (homeProb * 100).toFixed(1);
  const awayPct = ((1 - homeProb) * 100).toFixed(1);
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
        <span style={{ color: homeColor }}>{homePct}%</span>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Win Probability</span>
        <span style={{ color: awayColor }}>{awayPct}%</span>
      </div>
      <div className="h-4 flex rounded-full overflow-hidden">
        <div style={{ width: `${homeProb * 100}%`, background: homeColor, transition: 'width 0.6s ease' }} />
        <div style={{ width: `${(1 - homeProb) * 100}%`, background: awayColor, transition: 'width 0.6s ease' }} />
      </div>
      <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
        <span>{homeTeam}</span>
        <span>{awayTeam}</span>
      </div>
    </div>
  );
}

export default function LiveGamePage() {
  const { gameId } = useParams<{ gameId: string }>();
  const [game, setGame] = useState<Game | null | undefined>(undefined); // undefined = loading

  useEffect(() => {
    fetch(`/api/game/${gameId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => setGame(data?.game ?? null))
      .catch(() => setGame(null));
  }, [gameId]);

  const [liveState, setLiveState] = useState<LiveGameState | null>(null);
  const [running, setRunning] = useState(false);
  const tickRef = useRef(0);

  const homeWinPct = game
    ? (game.prediction.winner === game.homeTeam.name
        ? game.prediction.winProbability / 100
        : 1 - game.prediction.winProbability / 100)
    : 0.5;

  const reset = useCallback(() => {
    if (!game) return;
    tickRef.current = 0;
    setLiveState(initLiveGame(
      game.id,
      game.sport,
      game.homeTeam.name,
      game.awayTeam.name,
      homeWinPct,
      game.prediction.predictedScore.home,
      game.prediction.predictedScore.away,
    ));
    setRunning(false);
  }, [game, homeWinPct]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reset();
  }, [reset]);

  useEffect(() => {
    if (!running || !liveState || liveState.isOver) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (liveState?.isOver) setRunning(false);
      return;
    }
    const t = setTimeout(() => {
      tickRef.current++;
      setLiveState(prev => prev ? tick(prev, tickRef.current * 999983 + 7) : prev);
    }, 1200);
    return () => clearTimeout(t);
  }, [running, liveState]);

  if (game === undefined) return (
    <div className="max-w-screen-xl mx-auto px-6 py-16 text-center" style={{ color: 'var(--text-muted)' }}>
      Loading game data…
    </div>
  );

  if (!game) return (
    <div className="max-w-screen-xl mx-auto px-6 py-16 text-center" style={{ color: 'var(--text-muted)' }}>
      Game not found. <Link href="/" className="underline">Back to dashboard</Link>
    </div>
  );

  if (!liveState) return null;

  const { homeTeam, awayTeam } = game;
  const homeColor = homeTeam.color;
  const awayColor = awayTeam.color;

  const chartData = liveState.probHistory.map(h => ({
    label: h.label,
    home: Math.round(h.homeProb * 1000) / 10,
  }));

  const momentumColor = liveState.momentum === 'home' ? homeColor : liveState.momentum === 'away' ? awayColor : 'var(--text-muted)';
  const momentumLabel = liveState.momentum === 'home' ? `${homeTeam.abbreviation} momentum` : liveState.momentum === 'away' ? `${awayTeam.abbreviation} momentum` : 'Even';

  return (
    <div className="max-w-screen-lg mx-auto px-4 sm:px-6 py-8 space-y-6" style={{ color: 'var(--text-primary)' }}>
      {/* Back */}
      <Link href={`/game/${gameId}`} className="inline-flex items-center gap-1.5 text-sm hover:opacity-75"
        style={{ color: 'var(--text-secondary)' }}>
        <ArrowLeft size={14} />
        Back to Preview
      </Link>

      {/* Scoreboard */}
      <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-muted)' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {!liveState.isOver ? (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium animate-pulse"
                style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                ● LIVE
              </span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                FINAL
              </span>
            )}
            <span className="text-sm font-mono font-medium" style={{ color: 'var(--text-secondary)' }}>
              {liveState.timeLabel}
            </span>
            {liveState.isRedZone && !liveState.isOver && (
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444' }}>
                Red Zone
              </span>
            )}
          </div>
          <span className="text-xs" style={{ color: momentumColor }}>
            {momentumLabel}
          </span>
        </div>

        {/* Score */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full flex-shrink-0" style={{ background: homeColor }} />
            <div>
              <p className="font-bold text-lg">{homeTeam.name}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{homeTeam.record}</p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-5xl font-black font-mono tabular-nums" style={{ color: 'var(--text-primary)', letterSpacing: '-2px' }}>
              <span style={{ color: homeColor }}>{liveState.homeScore}</span>
              <span className="mx-3" style={{ color: 'var(--text-muted)' }}>:</span>
              <span style={{ color: awayColor }}>{liveState.awayScore}</span>
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {liveState.isOver ? 'Final Score' : `Possession: ${liveState.possession === 'home' ? homeTeam.abbreviation : awayTeam.abbreviation} ●`}
            </p>
          </div>
          <div className="flex items-center gap-4 flex-row-reverse">
            <div className="w-10 h-10 rounded-full flex-shrink-0" style={{ background: awayColor }} />
            <div className="text-right">
              <p className="font-bold text-lg">{awayTeam.name}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{awayTeam.record}</p>
            </div>
          </div>
        </div>

        {/* Timeouts */}
        <div className="flex justify-between mt-4 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span>Timeouts: {Array.from({ length: liveState.homeTimeouts }).map((_, i) => (
            <span key={i} className="inline-block w-1.5 h-1.5 rounded-full mx-0.5" style={{ background: homeColor }} />
          ))}</span>
          <span>{Array.from({ length: liveState.awayTimeouts }).map((_, i) => (
            <span key={i} className="inline-block w-1.5 h-1.5 rounded-full mx-0.5" style={{ background: awayColor }} />
          ))} :Timeouts</span>
        </div>
      </div>

      {/* Win Probability */}
      <div className="rounded-xl p-5 space-y-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-muted)' }}>
        <WinProbBar
          homeProb={liveState.homeWinProbability}
          homeColor={homeColor} awayColor={awayColor}
          homeTeam={homeTeam.abbreviation} awayTeam={awayTeam.abbreviation}
        />

        {/* Probability Chart */}
        {chartData.length >= 2 && (
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-muted)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 9 }} interval={Math.floor(chartData.length / 5)} />
              <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickFormatter={v => `${v}%`} width={38} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-muted)', borderRadius: 8, fontSize: 11 }}
                formatter={(v: unknown) => [`${(v as number).toFixed(1)}%`, `${homeTeam.abbreviation} Win Prob`]}
              />
              <ReferenceLine y={50} stroke="var(--border-muted)" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="home" stroke={homeColor} strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Controls + Play Log */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="rounded-xl p-5 space-y-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-muted)' }}>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Game Controls</h3>
          <div className="flex gap-3">
            <button onClick={() => setRunning(r => !r)} disabled={liveState.isOver}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer disabled:opacity-40 transition-opacity hover:opacity-75"
              style={{ background: running ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)', color: running ? '#ef4444' : '#10b981', border: `1px solid ${running ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}` }}>
              {running ? <><Pause size={14} /> Pause</> : <><Play size={14} /> {liveState.plays.length === 0 ? 'Start' : 'Resume'}</>}
            </button>
            <button onClick={reset}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm cursor-pointer transition-opacity hover:opacity-75"
              style={{ background: 'var(--bg-base)', border: '1px solid var(--border-muted)', color: 'var(--text-secondary)' }}>
              <RotateCcw size={14} />
              Reset
            </button>
          </div>

          <div className="text-xs space-y-1.5" style={{ color: 'var(--text-muted)' }}>
            <p>Pre-game probability: <span style={{ color: homeColor }}>{homeTeam.abbreviation} {(homeWinPct * 100).toFixed(1)}%</span></p>
            <p>Predicted: {homeTeam.abbreviation} {game.prediction.predictedScore.home}–{game.prediction.predictedScore.away} {awayTeam.abbreviation}</p>
            <p>Game progressed: {((1 - liveState.timeRemainingFraction) * 100).toFixed(0)}%</p>
          </div>
        </div>

        {/* Play Log */}
        <div className="rounded-xl p-5 space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-muted)' }}>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Play Log</h3>
          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {liveState.plays.slice(0, 12).map((play, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span className="flex-shrink-0 font-mono" style={{ color: 'var(--text-muted)' }}>{play.time}</span>
                <span style={{ color: play.homeScoreChange > 0 || play.awayScoreChange > 0 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                  {play.description}
                  {(play.homeScoreChange > 0 || play.awayScoreChange > 0) && (
                    <span className="ml-1 font-bold" style={{ color: play.homeScoreChange > 0 ? homeColor : awayColor }}>
                      (+{play.homeScoreChange > 0 ? play.homeScoreChange : play.awayScoreChange})
                    </span>
                  )}
                </span>
              </div>
            ))}
            {liveState.plays.length === 0 && (
              <p style={{ color: 'var(--text-muted)' }}>Press Start to begin the simulation</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
