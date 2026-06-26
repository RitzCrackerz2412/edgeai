/**
 * Live win probability engine.
 *
 * Simulates an in-progress game play-by-play, updating:
 *  - Score
 *  - Time remaining
 *  - Possession
 *  - Win probability (real-time Bayesian update)
 *  - Win probability history for the chart
 */

import type { Sport } from '@/lib/types';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LivePlay {
  time: string;       // game time label, e.g. "Q3 7:42"
  description: string;
  homeScoreChange: number;
  awayScoreChange: number;
  homeWinProb: number;
}

export interface LiveGameState {
  gameId: string;
  sport: Sport;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  period: number;     // quarter/period/inning
  timeLabel: string;  // "Q3 7:42" or "3rd Period 8:14" etc.
  timeRemainingFraction: number;  // [0, 1] — 1 = full game, 0 = final
  possession: 'home' | 'away';
  homeTimeouts: number;
  awayTimeouts: number;
  homeWinProbability: number;
  momentum: 'home' | 'away' | 'neutral';
  lastPlay: string;
  isRedZone: boolean;
  probHistory: { tick: number; homeProb: number; label: string }[];
  plays: LivePlay[];
  isOver: boolean;
}

// ── Sport configurations ──────────────────────────────────────────────────────

interface SportConfig {
  periods: number;
  periodLabel: string;
  periodMinutes: number;
  scoreSD: number;    // SD of final score differential (for win prob)
  timeouts: number;
  events: EventDef[];
}

interface EventDef {
  weight: number;
  desc: (home: string, away: string, possession: 'home' | 'away') => string;
  homeScoreChange: number;
  awayScoreChange: number;
  switchPossession: boolean;
  probShift: number;  // raw shift to homeWinProb before time-adjustment
  momentum: 'current' | 'switch' | 'neutral';
}

const NFL_EVENTS: EventDef[] = [
  { weight: 25, desc: (h, a, p) => `${p === 'home' ? h : a} runs for 4 yards`, homeScoreChange: 0, awayScoreChange: 0, switchPossession: false, probShift: 0.01, momentum: 'neutral' },
  { weight: 22, desc: (h, a, p) => `${p === 'home' ? h : a} pass incomplete`, homeScoreChange: 0, awayScoreChange: 0, switchPossession: false, probShift: -0.005, momentum: 'neutral' },
  { weight: 18, desc: (h, a, p) => `${p === 'home' ? h : a} pass complete, 12 yards`, homeScoreChange: 0, awayScoreChange: 0, switchPossession: false, probShift: 0.015, momentum: 'current' },
  { weight: 10, desc: (h, a, p) => `${p === 'home' ? h : a} drive stalls, punts`, homeScoreChange: 0, awayScoreChange: 0, switchPossession: true, probShift: -0.02, momentum: 'switch' },
  { weight: 8,  desc: (h, a, p) => `${p === 'home' ? h : a} TOUCHDOWN!`, homeScoreChange: 0, awayScoreChange: 0, switchPossession: true, probShift: 0.12, momentum: 'current' },
  { weight: 6,  desc: (h, a, p) => `${p === 'home' ? h : a} field goal — GOOD`, homeScoreChange: 0, awayScoreChange: 0, switchPossession: true, probShift: 0.06, momentum: 'current' },
  { weight: 5,  desc: (h, a, p) => `TURNOVER — ${p === 'home' ? a : h} takes over`, homeScoreChange: 0, awayScoreChange: 0, switchPossession: true, probShift: -0.09, momentum: 'switch' },
  { weight: 4,  desc: (h, a, p) => `INTERCEPTION — ${p === 'home' ? a : h} ball`, homeScoreChange: 0, awayScoreChange: 0, switchPossession: true, probShift: -0.11, momentum: 'switch' },
  { weight: 2,  desc: (h, a, p) => `SACK — ${p === 'home' ? h : a} loses 8 yards`, homeScoreChange: 0, awayScoreChange: 0, switchPossession: false, probShift: -0.03, momentum: 'switch' },
];

// Assign scores based on possession + event type after construction
function assignScores(events: EventDef[]): EventDef[] {
  return events.map((e, i) => {
    // TD events (index 4)
    if (i === 4) return {
      ...e,
      desc: (h, a, p) => `${p === 'home' ? h : a} — TOUCHDOWN! (PAT good) ${p === 'home' ? h : a} scores 7`,
      homeScoreChange: 7,   // will be adjusted at runtime based on possession
      awayScoreChange: 0,
    };
    // FG events (index 5)
    if (i === 5) return { ...e, homeScoreChange: 3, awayScoreChange: 0 };
    return e;
  });
}

const NFL_CFG: SportConfig = {
  periods: 4, periodLabel: 'Q', periodMinutes: 15,
  scoreSD: 14, timeouts: 3,
  events: assignScores(NFL_EVENTS),
};

const NBA_EVENTS: EventDef[] = [
  { weight: 28, desc: (h, a, p) => `${p === 'home' ? h : a} jumper — GOOD (2pts)`, homeScoreChange: 2, awayScoreChange: 0, switchPossession: true, probShift: 0.03, momentum: 'current' },
  { weight: 16, desc: (h, a, p) => `${p === 'home' ? h : a} 3-pointer — GOOD`, homeScoreChange: 3, awayScoreChange: 0, switchPossession: true, probShift: 0.05, momentum: 'current' },
  { weight: 14, desc: (h, a, p) => `${p === 'home' ? h : a} missed shot, rebounds`, homeScoreChange: 0, awayScoreChange: 0, switchPossession: true, probShift: -0.01, momentum: 'switch' },
  { weight: 10, desc: (h, a, p) => `${p === 'home' ? h : a} drive, 2 free throws — both good`, homeScoreChange: 2, awayScoreChange: 0, switchPossession: true, probShift: 0.02, momentum: 'current' },
  { weight: 8,  desc: (h, a, p) => `TURNOVER — ${p === 'home' ? a : h} ball`, homeScoreChange: 0, awayScoreChange: 0, switchPossession: true, probShift: -0.04, momentum: 'switch' },
  { weight: 6,  desc: (h, a, p) => `Fast break — ${p === 'home' ? h : a} layup (2pts)`, homeScoreChange: 2, awayScoreChange: 0, switchPossession: true, probShift: 0.04, momentum: 'current' },
  { weight: 4,  desc: (h, a, p) => `${p === 'home' ? h : a} AND-1! 3pts total`, homeScoreChange: 3, awayScoreChange: 0, switchPossession: true, probShift: 0.07, momentum: 'current' },
];

const NBA_CFG: SportConfig = {
  periods: 4, periodLabel: 'Q', periodMinutes: 12,
  scoreSD: 13, timeouts: 7,
  events: NBA_EVENTS,
};

const MLB_EVENTS: EventDef[] = [
  { weight: 30, desc: (h, a, p) => `${p === 'home' ? h : a} batter strikes out swinging`, homeScoreChange: 0, awayScoreChange: 0, switchPossession: false, probShift: -0.01, momentum: 'neutral' },
  { weight: 22, desc: (h, a, p) => `${p === 'home' ? h : a} ground out`, homeScoreChange: 0, awayScoreChange: 0, switchPossession: false, probShift: -0.005, momentum: 'neutral' },
  { weight: 15, desc: (h, a, p) => `${p === 'home' ? h : a} single — runner on first`, homeScoreChange: 0, awayScoreChange: 0, switchPossession: false, probShift: 0.02, momentum: 'current' },
  { weight: 10, desc: (h, a, p) => `${p === 'home' ? h : a} walks — base loaded`, homeScoreChange: 0, awayScoreChange: 0, switchPossession: false, probShift: 0.015, momentum: 'current' },
  { weight: 8,  desc: (h, a, p) => `THREE OUTS — half inning over`, homeScoreChange: 0, awayScoreChange: 0, switchPossession: true, probShift: -0.02, momentum: 'switch' },
  { weight: 7,  desc: (h, a, p) => `HOME RUN! ${p === 'home' ? h : a} scores`, homeScoreChange: 1, awayScoreChange: 0, switchPossession: false, probShift: 0.1, momentum: 'current' },
  { weight: 5,  desc: (h, a, p) => `RBI single — run scores!`, homeScoreChange: 1, awayScoreChange: 0, switchPossession: false, probShift: 0.08, momentum: 'current' },
  { weight: 3,  desc: (h, a, p) => `Double play — inning over`, homeScoreChange: 0, awayScoreChange: 0, switchPossession: true, probShift: -0.04, momentum: 'switch' },
];

const MLB_CFG: SportConfig = {
  periods: 9, periodLabel: 'Inn', periodMinutes: 0, // innings-based
  scoreSD: 4, timeouts: 0,
  events: MLB_EVENTS,
};

const NHL_EVENTS: EventDef[] = [
  { weight: 35, desc: (h, a, p) => `${p === 'home' ? h : a} shot on goal — saved`, homeScoreChange: 0, awayScoreChange: 0, switchPossession: false, probShift: 0.005, momentum: 'neutral' },
  { weight: 20, desc: (h, a, p) => `${p === 'home' ? h : a} icing called`, homeScoreChange: 0, awayScoreChange: 0, switchPossession: false, probShift: -0.01, momentum: 'neutral' },
  { weight: 15, desc: (h, a, p) => `${p === 'home' ? h : a} GOAL!`, homeScoreChange: 1, awayScoreChange: 0, switchPossession: true, probShift: 0.12, momentum: 'current' },
  { weight: 10, desc: (h, a, p) => `Penalty — ${p === 'home' ? a : h} on power play`, homeScoreChange: 0, awayScoreChange: 0, switchPossession: false, probShift: -0.05, momentum: 'switch' },
  { weight: 8,  desc: (h, a, p) => `Power play GOAL — ${p === 'home' ? h : a}!`, homeScoreChange: 1, awayScoreChange: 0, switchPossession: true, probShift: 0.15, momentum: 'current' },
  { weight: 7,  desc: (h, a, p) => `Breakaway — saved by goalie`, homeScoreChange: 0, awayScoreChange: 0, switchPossession: true, probShift: -0.03, momentum: 'switch' },
  { weight: 5,  desc: (h, a, p) => `Missed wide open — possession changes`, homeScoreChange: 0, awayScoreChange: 0, switchPossession: true, probShift: -0.04, momentum: 'switch' },
];

const NHL_CFG: SportConfig = {
  periods: 3, periodLabel: 'P', periodMinutes: 20,
  scoreSD: 5, timeouts: 1,
  events: NHL_EVENTS,
};

const SPORT_CONFIGS: Partial<Record<Sport, SportConfig>> = {
  NFL: NFL_CFG,
  NBA: NBA_CFG,
  MLB: MLB_CFG,
  NHL: NHL_CFG,
};

const DEFAULT_CFG: SportConfig = NFL_CFG;

// ── Win probability formula ───────────────────────────────────────────────────

function normalCDF(x: number): number {
  // Hart approximation — accurate to ~1e-5
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const poly = t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  const phi = 1 - (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x) * poly;
  return x >= 0 ? phi : 1 - phi;
}

function calcWinProb(
  scoreDiff: number,       // home - away
  priorEdge: number,       // pre-game projected score diff (home-positive)
  timeRemaining: number,   // [0, 1]
  sportSD: number,
): number {
  if (timeRemaining <= 0) {
    if (scoreDiff > 0) return 1;
    if (scoreDiff < 0) return 0;
    return 0.5;
  }
  const totalEdge = scoreDiff + priorEdge * timeRemaining;
  const remainingSD = sportSD * Math.sqrt(timeRemaining);
  return Math.min(0.995, Math.max(0.005, normalCDF(totalEdge / remainingSD)));
}

// ── Seeded PRNG ───────────────────────────────────────────────────────────────

function mulberry32(seed: number): () => number {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ── Event selection ───────────────────────────────────────────────────────────

function selectEvent(events: EventDef[], rng: () => number): EventDef {
  const total = events.reduce((s, e) => s + e.weight, 0);
  let r = rng() * total;
  for (const e of events) {
    r -= e.weight;
    if (r <= 0) return e;
  }
  return events[events.length - 1];
}

// ── State builders ────────────────────────────────────────────────────────────

export function initLiveGame(
  gameId: string,
  sport: Sport,
  homeTeam: string,
  awayTeam: string,
  preGameHomeWinProb: number,  // [0, 1]
  predictedHomeScore: number,
  predictedAwayScore: number,
): LiveGameState {
  const cfg = SPORT_CONFIGS[sport] ?? DEFAULT_CFG;
  const priorEdge = predictedHomeScore - predictedAwayScore;

  return {
    gameId, sport, homeTeam, awayTeam,
    homeScore: 0, awayScore: 0,
    period: 1,
    timeLabel: `${cfg.periodLabel}1 ${cfg.periodMinutes}:00`,
    timeRemainingFraction: 1,
    possession: 'home',
    homeTimeouts: cfg.timeouts,
    awayTimeouts: cfg.timeouts,
    homeWinProbability: preGameHomeWinProb,
    momentum: 'neutral',
    lastPlay: 'Kickoff — game underway',
    isRedZone: false,
    probHistory: [{ tick: 0, homeProb: preGameHomeWinProb, label: 'Start' }],
    plays: [],
    isOver: false,
  };
}

function timeLabel(cfg: SportConfig, period: number, secsInPeriod: number): string {
  if (cfg.periodLabel === 'Inn') return `Inn ${period}`;
  const remaining = cfg.periodMinutes * 60 - secsInPeriod;
  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  return `${cfg.periodLabel}${period} ${m}:${s.toString().padStart(2, '0')}`;
}

export function tick(state: LiveGameState, seed: number): LiveGameState {
  if (state.isOver) return state;

  const cfg = SPORT_CONFIGS[state.sport] ?? DEFAULT_CFG;
  const rng = mulberry32(seed);

  const event = selectEvent(cfg.events, rng);

  // Determine which team scored
  const possession = state.possession;
  const homeScoredChange = possession === 'home' ? event.homeScoreChange : event.awayScoreChange;
  const awayScoredChange = possession === 'home' ? event.awayScoreChange : event.homeScoreChange;

  // Handle NFL TD possession distinction
  let actualHomeChange = homeScoredChange;
  let actualAwayChange = awayScoredChange;
  if (state.sport === 'NFL' && event.homeScoreChange === 7) {
    actualHomeChange = possession === 'home' ? 7 : 0;
    actualAwayChange = possession === 'home' ? 0 : 7;
  }
  if (state.sport === 'NFL' && event.homeScoreChange === 3) {
    actualHomeChange = possession === 'home' ? 3 : 0;
    actualAwayChange = possession === 'home' ? 0 : 3;
  }
  // MLB/NHL/NBA - score applies to possession holder
  if ((state.sport === 'MLB' || state.sport === 'NHL') && event.homeScoreChange === 1) {
    actualHomeChange = possession === 'home' ? 1 : 0;
    actualAwayChange = possession === 'home' ? 0 : 1;
  }
  if (state.sport === 'NBA' && event.homeScoreChange > 0) {
    actualHomeChange = possession === 'home' ? event.homeScoreChange : 0;
    actualAwayChange = possession === 'home' ? 0 : event.homeScoreChange;
  }

  const newHomeScore = state.homeScore + actualHomeChange;
  const newAwayScore = state.awayScore + actualAwayChange;

  // Update time
  const totalTicks = cfg.periods * (cfg.periodMinutes > 0 ? (cfg.periodMinutes * 60 / 35) : 27);
  const ticksUsed = state.plays.length + 1;
  const newTimeRemaining = Math.max(0, 1 - ticksUsed / totalTicks);

  // Advance period
  const periodFraction = 1 / cfg.periods;
  const newPeriod = Math.min(cfg.periods, Math.floor((1 - newTimeRemaining) / periodFraction) + 1);
  const secsInPeriod = cfg.periodMinutes > 0
    ? Math.floor(((1 - newTimeRemaining - (newPeriod - 1) * periodFraction) / periodFraction) * cfg.periodMinutes * 60)
    : 0;

  // Update win probability
  const priorEdge = 0; // stored elsewhere but we'll use a simplified update
  const scoreDiff = newHomeScore - newAwayScore;
  const rawProbShift = possession === 'home' ? event.probShift : -event.probShift;
  const timeWeight = Math.sqrt(newTimeRemaining);
  const probAdjustment = rawProbShift * (0.5 + 0.5 * timeWeight);

  // Blend: 70% time-adjusted model, 30% current trajectory
  const modelProb = calcWinProb(scoreDiff, 0, newTimeRemaining, cfg.scoreSD);
  const trajectoryProb = Math.min(0.995, Math.max(0.005, state.homeWinProbability + probAdjustment));
  const newProb = 0.7 * modelProb + 0.3 * trajectoryProb;
  const clampedProb = Math.min(0.995, Math.max(0.005, newProb));

  // Momentum
  let momentum: 'home' | 'away' | 'neutral' = 'neutral';
  if (event.momentum === 'current') momentum = possession;
  else if (event.momentum === 'switch') momentum = possession === 'home' ? 'away' : 'home';

  // New possession
  const newPossession = event.switchPossession
    ? (state.possession === 'home' ? 'away' : 'home')
    : state.possession;

  const desc = event.desc(state.homeTeam, state.awayTeam, possession);
  const label = cfg.periodLabel === 'Inn' ? `Inn ${newPeriod}` : timeLabel(cfg, newPeriod, secsInPeriod);

  const play: LivePlay = {
    time: label,
    description: desc,
    homeScoreChange: actualHomeChange,
    awayScoreChange: actualAwayChange,
    homeWinProb: clampedProb,
  };

  const isOver = newTimeRemaining <= 0;

  return {
    ...state,
    homeScore: newHomeScore,
    awayScore: newAwayScore,
    period: newPeriod,
    timeLabel: label,
    timeRemainingFraction: newTimeRemaining,
    possession: isOver ? state.possession : newPossession,
    homeWinProbability: isOver
      ? (newHomeScore > newAwayScore ? 1 : newHomeScore < newAwayScore ? 0 : 0.5)
      : clampedProb,
    momentum: isOver ? 'neutral' : momentum,
    lastPlay: desc,
    isRedZone: rng() < 0.15,
    probHistory: [
      ...state.probHistory.slice(-49),
      { tick: ticksUsed, homeProb: clampedProb, label },
    ],
    plays: [play, ...state.plays].slice(0, 20),
    isOver,
  };
}
