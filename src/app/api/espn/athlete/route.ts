import { NextRequest, NextResponse } from 'next/server';
import type { PlayerDetail } from '@/lib/playerData';

export const dynamic = 'force-dynamic';

// sports.core.api.espn.com path per sport
const CORE_PATH: Record<string, string> = {
  NFL: 'football/leagues/nfl',
  NBA: 'basketball/leagues/nba',
  MLB: 'baseball/leagues/mlb',
  NHL: 'hockey/leagues/nhl',
};

const CORE_BASE = 'https://sports.core.api.espn.com/v2/sports';

async function espnGet(url: string) {
  try {
    const r = await fetch(url, { next: { revalidate: 3600 } });
    if (!r.ok) return null;
    return r.json();
  } catch { return null; }
}

function g(stats: Record<string, number>, ...keys: string[]): number {
  for (const k of keys) if (stats[k] != null) return stats[k];
  return 0;
}

function fmt(n: number, dec = 1): string {
  return n.toFixed(dec);
}

type Category = { name?: string; stats?: { name: string; value?: number; displayValue?: string }[] };

function extractStats(categories: Category[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const cat of categories ?? []) {
    for (const s of cat.stats ?? []) {
      if (!s.name) continue;
      const v = s.value ?? parseFloat(s.displayValue ?? '');
      out[s.name] = isNaN(v) ? 0 : v;
    }
  }
  return out;
}

// ── Sport-specific stat builders ──────────────────────────────────────────────

function nflBuild(pos: string, career: Record<string, number>, season: Record<string, number>) {
  const isQB = pos === 'QB';
  const isRB = ['RB', 'FB'].includes(pos);
  const isWR = ['WR', 'TE'].includes(pos);

  if (isQB) {
    const cAtt = g(career, 'passingAttempts') || 1;
    const cComp = g(career, 'completions');
    const cCompPct = career['completionPct'] ?? (cComp / cAtt * 100);
    const sAtt = g(season, 'passingAttempts') || 1;
    const sComp = g(season, 'completions');
    const sCompPct = season['completionPct'] ?? (sComp / sAtt * 100);
    const qbr = g(career, 'QBRating', 'quarterbackRating');
    const sQbr = g(season, 'QBRating', 'quarterbackRating');

    return {
      career: [
        { label: 'Games', value: g(career, 'gamesPlayed') },
        { label: 'Completions', value: g(career, 'completions') },
        { label: 'Attempts', value: g(career, 'passingAttempts') },
        { label: 'Comp%', value: fmt(cCompPct) + '%' },
        { label: 'Pass Yards', value: Math.round(g(career, 'passingYards')).toLocaleString() },
        { label: 'Yards/Att', value: fmt(g(career, 'yardsPerPassAttempt')) },
        { label: 'Touchdowns', value: g(career, 'passingTouchdowns') },
        { label: 'Interceptions', value: g(career, 'interceptions') },
        { label: 'TD/INT Ratio', value: fmt(g(career, 'passingTouchdowns') / Math.max(1, g(career, 'interceptions'))) },
        { label: 'Passer Rating', value: fmt(qbr) },
        { label: 'Rush Yards', value: Math.round(g(career, 'rushingYards')) },
        { label: 'Rush TDs', value: g(career, 'rushingTouchdowns') },
        { label: 'Sacks Taken', value: g(career, 'sacks') },
      ],
      season: [
        { label: 'Games', value: g(season, 'gamesPlayed') },
        { label: 'Completions', value: g(season, 'completions') },
        { label: 'Attempts', value: g(season, 'passingAttempts') },
        { label: 'Comp%', value: fmt(sCompPct) + '%' },
        { label: 'Pass Yards', value: Math.round(g(season, 'passingYards')) },
        { label: 'Yards/Att', value: fmt(g(season, 'yardsPerPassAttempt')) },
        { label: 'Touchdowns', value: g(season, 'passingTouchdowns') },
        { label: 'Interceptions', value: g(season, 'interceptions') },
        { label: 'Passer Rating', value: fmt(sQbr) },
        { label: 'Sacks', value: g(season, 'sacks') },
        { label: 'Rush Yards', value: Math.round(g(season, 'rushingYards')) },
      ],
      radar: [
        { metric: 'Accuracy', value: Math.min(100, cCompPct * 1.4), avg: 63 },
        { metric: 'Arm Strength', value: Math.min(100, g(career, 'yardsPerPassAttempt') * 11), avg: 77 },
        { metric: 'Mobility', value: Math.min(100, g(career, 'rushingYards') / Math.max(1, g(career, 'gamesPlayed')) * 5), avg: 40 },
        { metric: 'Clutch', value: Math.min(100, g(career, 'passingTouchdowns') / Math.max(1, g(career, 'interceptions')) * 12), avg: 60 },
        { metric: 'Football IQ', value: Math.min(100, qbr), avg: 72 },
        { metric: 'Durability', value: Math.min(100, g(career, 'gamesPlayed') / 1.7), avg: 75 },
      ],
    };
  }

  if (isRB) {
    const gp = Math.max(1, g(career, 'gamesPlayed'));
    return {
      career: [
        { label: 'Games', value: gp },
        { label: 'Carries', value: g(career, 'rushingAttempts') },
        { label: 'Rush Yards', value: Math.round(g(career, 'rushingYards')).toLocaleString() },
        { label: 'YPC', value: fmt(g(career, 'yardsPerRushAttempt')) },
        { label: 'Rush TDs', value: g(career, 'rushingTouchdowns') },
        { label: 'Receptions', value: g(career, 'receptions') },
        { label: 'Rec Yards', value: Math.round(g(career, 'receivingYards')) },
        { label: 'Rec TDs', value: g(career, 'receivingTouchdowns') },
        { label: 'Fumbles Lost', value: g(career, 'fumblesLost') },
      ],
      season: [
        { label: 'Games', value: g(season, 'gamesPlayed') },
        { label: 'Carries', value: g(season, 'rushingAttempts') },
        { label: 'Rush Yards', value: Math.round(g(season, 'rushingYards')) },
        { label: 'YPC', value: fmt(g(season, 'yardsPerRushAttempt')) },
        { label: 'Rush TDs', value: g(season, 'rushingTouchdowns') },
        { label: 'Receptions', value: g(season, 'receptions') },
        { label: 'Rec Yards', value: Math.round(g(season, 'receivingYards')) },
      ],
      radar: [
        { metric: 'Speed', value: Math.min(100, g(career, 'yardsPerRushAttempt') * 18), avg: 60 },
        { metric: 'Power', value: Math.min(100, g(career, 'rushingYards') / gp / 1.2), avg: 60 },
        { metric: 'Receiving', value: Math.min(100, g(career, 'receivingYards') / gp * 2), avg: 50 },
        { metric: 'Elusiveness', value: Math.min(100, g(career, 'rushingTouchdowns') / gp * 28), avg: 55 },
        { metric: 'Blocking', value: 65, avg: 65 },
        { metric: 'Durability', value: Math.min(100, gp / 1.5), avg: 70 },
      ],
    };
  }

  if (isWR) {
    const gp = Math.max(1, g(career, 'gamesPlayed'));
    const recs = g(career, 'receptions');
    const tgts = g(career, 'receivingTargets') || recs * 1.4;
    const catchPct = tgts > 0 ? recs / tgts * 100 : 65;
    return {
      career: [
        { label: 'Games', value: gp },
        { label: 'Receptions', value: recs },
        { label: 'Targets', value: Math.round(tgts) },
        { label: 'Rec Yards', value: Math.round(g(career, 'receivingYards')).toLocaleString() },
        { label: 'Y/R', value: fmt(g(career, 'yardsPerReception', 'yardsPerCatch')) },
        { label: 'Rec TDs', value: g(career, 'receivingTouchdowns') },
        { label: 'Catch%', value: fmt(catchPct) + '%' },
        { label: 'Yards After Catch', value: Math.round(g(career, 'receivingYardsAfterCatch', 'yardsAfterCatch')) },
      ],
      season: [
        { label: 'Games', value: g(season, 'gamesPlayed') },
        { label: 'Receptions', value: g(season, 'receptions') },
        { label: 'Rec Yards', value: Math.round(g(season, 'receivingYards')) },
        { label: 'Y/R', value: fmt(g(season, 'yardsPerReception', 'yardsPerCatch')) },
        { label: 'Rec TDs', value: g(season, 'receivingTouchdowns') },
        { label: 'Targets', value: Math.round(g(season, 'receivingTargets') || g(season, 'receptions') * 1.4) },
      ],
      radar: [
        { metric: 'Route Running', value: Math.min(100, g(career, 'receivingYards') / gp / 0.8), avg: 60 },
        { metric: 'Speed', value: Math.min(100, g(career, 'yardsPerReception', 'yardsPerCatch') * 7), avg: 60 },
        { metric: 'Hands', value: Math.min(100, catchPct), avg: 65 },
        { metric: 'YAC', value: Math.min(100, g(career, 'receivingYardsAfterCatch') / gp * 2), avg: 55 },
        { metric: 'Red Zone', value: Math.min(100, g(career, 'receivingTouchdowns') / gp * 25), avg: 50 },
        { metric: 'Durability', value: Math.min(100, gp / 1.5), avg: 70 },
      ],
    };
  }

  // Defensive or other
  const gp = Math.max(1, g(career, 'gamesPlayed'));
  return {
    career: [
      { label: 'Games', value: gp },
      { label: 'Tackles', value: Math.round(g(career, 'totalTackles', 'tackles')) },
      { label: 'Solo Tackles', value: Math.round(g(career, 'soloTackles')) },
      { label: 'Sacks', value: g(career, 'sacks') },
      { label: 'TFL', value: g(career, 'tacklesForLoss') },
      { label: 'INTs', value: g(career, 'interceptions') },
      { label: 'PDs', value: Math.round(g(career, 'passesDefended', 'passesBattedDown')) },
      { label: 'Forced Fumbles', value: g(career, 'forcedFumbles', 'fumblesForced') },
    ],
    season: [
      { label: 'Games', value: g(season, 'gamesPlayed') },
      { label: 'Tackles', value: Math.round(g(season, 'totalTackles', 'tackles')) },
      { label: 'Sacks', value: g(season, 'sacks') },
      { label: 'TFL', value: g(season, 'tacklesForLoss') },
      { label: 'INTs', value: g(season, 'interceptions') },
      { label: 'PDs', value: Math.round(g(season, 'passesDefended', 'passesBattedDown')) },
    ],
    radar: [
      { metric: 'Tackling', value: Math.min(100, g(career, 'totalTackles') / gp * 4), avg: 60 },
      { metric: 'Pass Rush', value: Math.min(100, g(career, 'sacks') / gp * 30), avg: 50 },
      { metric: 'Coverage', value: Math.min(100, (g(career, 'interceptions') + g(career, 'passesDefended', 'passesBattedDown')) / gp * 15), avg: 55 },
      { metric: 'Run Stop', value: Math.min(100, g(career, 'tacklesForLoss') / gp * 25), avg: 55 },
      { metric: 'Turnovers', value: Math.min(100, (g(career, 'interceptions') + g(career, 'fumblesRecovered')) / gp * 30), avg: 50 },
      { metric: 'Durability', value: Math.min(100, gp / 1.5), avg: 70 },
    ],
  };
}

function nbaBuild(career: Record<string, number>, season: Record<string, number>) {
  const gp = Math.max(1, g(career, 'gamesPlayed'));
  const sgp = Math.max(1, g(season, 'gamesPlayed'));

  // ESPN career totals — divide by games to get per-game
  const cPts = g(career, 'points');
  const cReb = g(career, 'totalRebounds', 'rebounds');
  const cAst = g(career, 'assists');
  const cStl = g(career, 'steals');
  const cBlk = g(career, 'blocks');
  const cFgPct = g(career, 'fieldGoalPct');
  const c3Pct = g(career, 'threePointFieldGoalPct', 'threePtPct');
  const cFtPct = g(career, 'freeThrowPct');
  const cTO = g(career, 'turnovers');

  const sPts = g(season, 'points');
  const sReb = g(season, 'totalRebounds', 'rebounds');
  const sAst = g(season, 'assists');
  const sFgPct = g(season, 'fieldGoalPct');
  const s3Pct = g(season, 'threePointFieldGoalPct', 'threePtPct');
  const sFtPct = g(season, 'freeThrowPct');

  const pctFmt = (v: number) => v > 1 ? fmt(v) + '%' : fmt(v * 100) + '%';

  return {
    career: [
      { label: 'Games', value: gp },
      { label: 'PPG', value: fmt(cPts / gp) },
      { label: 'RPG', value: fmt(cReb / gp) },
      { label: 'APG', value: fmt(cAst / gp) },
      { label: 'SPG', value: fmt(cStl / gp) },
      { label: 'BPG', value: fmt(cBlk / gp) },
      { label: 'FG%', value: pctFmt(cFgPct) },
      { label: '3P%', value: pctFmt(c3Pct) },
      { label: 'FT%', value: pctFmt(cFtPct) },
      { label: 'TO/G', value: fmt(cTO / gp) },
    ],
    season: [
      { label: 'Games', value: sgp },
      { label: 'PPG', value: fmt(sPts / sgp) },
      { label: 'RPG', value: fmt(sReb / sgp) },
      { label: 'APG', value: fmt(sAst / sgp) },
      { label: 'SPG', value: fmt(g(season, 'steals') / sgp) },
      { label: 'BPG', value: fmt(g(season, 'blocks') / sgp) },
      { label: 'FG%', value: pctFmt(sFgPct) },
      { label: '3P%', value: pctFmt(s3Pct) },
      { label: 'FT%', value: pctFmt(sFtPct) },
      { label: 'TO/G', value: fmt(g(season, 'turnovers') / sgp) },
      { label: 'Mins/G', value: fmt(g(season, 'minutes', 'minutesPlayed') / sgp) },
    ],
    radar: [
      { metric: 'Scoring', value: Math.min(100, cPts / gp * 3.3), avg: 60 },
      { metric: 'Rebounding', value: Math.min(100, cReb / gp * 8.5), avg: 55 },
      { metric: 'Playmaking', value: Math.min(100, cAst / gp * 13), avg: 50 },
      { metric: 'Defense', value: Math.min(100, (cStl + cBlk) / gp * 28), avg: 55 },
      { metric: 'Efficiency', value: Math.min(100, (cFgPct > 1 ? cFgPct : cFgPct * 100)), avg: 45 },
      { metric: '3-Point', value: Math.min(100, (c3Pct > 1 ? c3Pct : c3Pct * 100) * 1.2), avg: 35 },
    ],
  };
}

function mlbBuild(pos: string, career: Record<string, number>, season: Record<string, number>) {
  const isPitcher = ['P', 'SP', 'RP', 'CL', 'MR', 'LHP', 'RHP'].includes(pos);

  if (isPitcher) {
    const era = g(career, 'ERA', 'earnedRunAvg');
    const whip = g(career, 'WHIP');
    const ip = g(career, 'inningsPitched', 'innings');
    return {
      career: [
        { label: 'Games', value: g(career, 'gamesPlayed', 'appearances') },
        { label: 'Wins', value: g(career, 'wins') },
        { label: 'Losses', value: g(career, 'losses') },
        { label: 'ERA', value: fmt(era) },
        { label: 'WHIP', value: fmt(whip) },
        { label: 'IP', value: fmt(ip) },
        { label: 'Strikeouts', value: g(career, 'strikeouts', 'Ks') },
        { label: 'Walks', value: g(career, 'walks', 'baseOnBalls') },
        { label: 'K/9', value: fmt(g(career, 'strikeoutsPerNineInnings', 'kPerNine')) },
        { label: 'Saves', value: g(career, 'saves') },
      ],
      season: [
        { label: 'Games', value: g(season, 'gamesPlayed', 'appearances') },
        { label: 'Wins', value: g(season, 'wins') },
        { label: 'ERA', value: fmt(g(season, 'ERA', 'earnedRunAvg')) },
        { label: 'WHIP', value: fmt(g(season, 'WHIP')) },
        { label: 'IP', value: fmt(g(season, 'inningsPitched', 'innings')) },
        { label: 'Strikeouts', value: g(season, 'strikeouts', 'Ks') },
        { label: 'Saves', value: g(season, 'saves') },
      ],
      radar: [
        { metric: 'Velocity', value: 75, avg: 70 },
        { metric: 'Control', value: Math.min(100, Math.max(0, 100 - whip * 30)), avg: 60 },
        { metric: 'Strikeouts', value: Math.min(100, g(career, 'strikeoutsPerNineInnings') * 9), avg: 65 },
        { metric: 'ERA', value: Math.min(100, Math.max(0, 100 - era * 12)), avg: 60 },
        { metric: 'Durability', value: Math.min(100, ip / 20), avg: 65 },
        { metric: 'Clutch', value: Math.min(100, g(career, 'saves') / 2 + 50), avg: 60 },
      ],
    };
  }

  const avg = g(career, 'battingAvg', 'avg');
  const obp = g(career, 'onBasePercentage', 'OBP');
  const slg = g(career, 'sluggingPercentage', 'SLG');
  const gp = Math.max(1, g(career, 'gamesPlayed', 'games'));
  return {
    career: [
      { label: 'Games', value: gp },
      { label: 'AVG', value: avg.toFixed(3) },
      { label: 'OBP', value: obp.toFixed(3) },
      { label: 'SLG', value: slg.toFixed(3) },
      { label: 'OPS', value: (g(career, 'OPS') || obp + slg).toFixed(3) },
      { label: 'Home Runs', value: g(career, 'homeRuns', 'HR') },
      { label: 'RBIs', value: g(career, 'RBIs', 'battingRbi') },
      { label: 'Hits', value: g(career, 'hits') },
      { label: 'Stolen Bases', value: g(career, 'stolenBases') },
      { label: 'Strikeouts', value: g(career, 'strikeouts') },
      { label: 'Walks', value: g(career, 'walks', 'baseOnBalls') },
    ],
    season: [
      { label: 'Games', value: g(season, 'gamesPlayed', 'games') },
      { label: 'AVG', value: g(season, 'battingAvg', 'avg').toFixed(3) },
      { label: 'OBP', value: g(season, 'onBasePercentage', 'OBP').toFixed(3) },
      { label: 'SLG', value: g(season, 'sluggingPercentage', 'SLG').toFixed(3) },
      { label: 'Home Runs', value: g(season, 'homeRuns', 'HR') },
      { label: 'RBIs', value: g(season, 'RBIs', 'battingRbi') },
      { label: 'Stolen Bases', value: g(season, 'stolenBases') },
    ],
    radar: [
      { metric: 'Hitting', value: Math.min(100, avg * 330), avg: 55 },
      { metric: 'Power', value: Math.min(100, g(career, 'homeRuns') / gp * 35), avg: 50 },
      { metric: 'Speed', value: Math.min(100, g(career, 'stolenBases') / gp * 25), avg: 45 },
      { metric: 'On-Base', value: Math.min(100, obp * 280), avg: 58 },
      { metric: 'Slugging', value: Math.min(100, slg * 200), avg: 60 },
      { metric: 'Clutch', value: Math.min(100, g(career, 'RBIs') / gp * 20), avg: 55 },
    ],
  };
}

function nhlBuild(pos: string, career: Record<string, number>, season: Record<string, number>) {
  const isGoalie = pos === 'G' || pos === 'GK';
  const gp = Math.max(1, g(career, 'gamesPlayed', 'games'));

  if (isGoalie) {
    const svPct = g(career, 'savePercentage', 'svPct');
    const gaa = g(career, 'goalsAgainstAverage', 'GAA');
    return {
      career: [
        { label: 'Games', value: gp },
        { label: 'Wins', value: g(career, 'wins') },
        { label: 'Losses', value: g(career, 'losses') },
        { label: 'Save %', value: (svPct > 1 ? svPct / 100 : svPct).toFixed(3) },
        { label: 'GAA', value: fmt(gaa) },
        { label: 'Saves', value: g(career, 'saves') },
        { label: 'Shutouts', value: g(career, 'shutouts') },
      ],
      season: [
        { label: 'Games', value: g(season, 'gamesPlayed', 'games') },
        { label: 'Wins', value: g(season, 'wins') },
        { label: 'Save %', value: (g(season, 'savePercentage', 'svPct') > 1 ? (g(season, 'savePercentage', 'svPct') / 100) : g(season, 'savePercentage', 'svPct')).toFixed(3) },
        { label: 'GAA', value: fmt(g(season, 'goalsAgainstAverage', 'GAA')) },
        { label: 'Shutouts', value: g(season, 'shutouts') },
      ],
      radar: [
        { metric: 'Save %', value: Math.min(100, (svPct > 1 ? svPct : svPct * 100) * 1.1), avg: 90 },
        { metric: 'Positioning', value: 75, avg: 70 },
        { metric: 'Reflexes', value: Math.min(100, 100 - gaa * 15), avg: 70 },
        { metric: 'Rebound Control', value: 72, avg: 68 },
        { metric: 'Puck Handling', value: 68, avg: 62 },
        { metric: 'Clutch', value: Math.min(100, g(career, 'shutouts') / gp * 80 + 50), avg: 65 },
      ],
    };
  }

  const goals = g(career, 'goals');
  const assists = g(career, 'assists');
  return {
    career: [
      { label: 'Games', value: gp },
      { label: 'Goals', value: goals },
      { label: 'Assists', value: assists },
      { label: 'Points', value: g(career, 'points') || goals + assists },
      { label: '+/-', value: g(career, 'plusMinus') },
      { label: 'PIM', value: g(career, 'penaltyMinutes') },
      { label: 'Shots', value: g(career, 'shots') },
      { label: 'PP Goals', value: g(career, 'powerPlayGoals') },
      { label: 'GWG', value: g(career, 'gameWinningGoals') },
    ],
    season: [
      { label: 'Games', value: g(season, 'gamesPlayed', 'games') },
      { label: 'Goals', value: g(season, 'goals') },
      { label: 'Assists', value: g(season, 'assists') },
      { label: 'Points', value: g(season, 'points') || g(season, 'goals') + g(season, 'assists') },
      { label: '+/-', value: g(season, 'plusMinus') },
      { label: 'PP Goals', value: g(season, 'powerPlayGoals') },
      { label: 'Shots', value: g(season, 'shots') },
    ],
    radar: [
      { metric: 'Scoring', value: Math.min(100, goals / gp * 30), avg: 50 },
      { metric: 'Playmaking', value: Math.min(100, assists / gp * 20), avg: 50 },
      { metric: 'Speed', value: 70, avg: 65 },
      { metric: 'Defense', value: Math.min(100, Math.max(0, 70 + g(career, 'plusMinus') / 3)), avg: 60 },
      { metric: 'Physical', value: Math.min(100, g(career, 'penaltyMinutes') / gp * 15 + 45), avg: 55 },
      { metric: 'Durability', value: Math.min(100, gp / 0.9), avg: 70 },
    ],
  };
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  const sport = req.nextUrl.searchParams.get('sport') ?? '';
  const rosterTeamName = req.nextUrl.searchParams.get('teamName') ?? '';
  const rosterTeamColor = req.nextUrl.searchParams.get('teamColor') ?? '';

  const path = CORE_PATH[sport];
  if (!id || !path) {
    return NextResponse.json({ error: 'Missing id or sport' }, { status: 400 });
  }

  const athleteBase = `${CORE_BASE}/${path}/athletes/${id}`;

  // Fetch athlete bio, career stats, and season log in parallel
  const [athleteData, careerData, logData] = await Promise.all([
    espnGet(athleteBase),
    espnGet(`${athleteBase}/statistics`),
    espnGet(`${athleteBase}/statisticslog`),
  ]);

  if (!athleteData) {
    return NextResponse.json({ error: 'Athlete not found' }, { status: 404 });
  }

  // ── Fetch most recent season stats from log ────────────────────────────────
  let seasonData: { splits?: { categories?: Category[] } } | null = null;
  const logEntries: { season?: unknown; statistics?: { type?: string; statistics?: { $ref?: string } }[] }[] =
    logData?.entries ?? [];

  if (logEntries.length > 0) {
    const mostRecent = logEntries[0];
    const totalEntry = mostRecent.statistics?.find(
      (s) => s.type === 'total' && s.statistics?.$ref,
    );
    if (totalEntry?.statistics?.$ref) {
      const url = totalEntry.statistics.$ref.replace('http://', 'https://').replace('?lang=en&region=us', '');
      seasonData = await espnGet(url);
    }
  }

  // ── Extract athlete info ───────────────────────────────────────────────────
  const ath = athleteData;
  const color = rosterTeamColor || '#6366f1';
  const teamName = rosterTeamName || '—';
  const pos = ath.position?.abbreviation ?? '';
  const heightIn = ath.height ?? 72;
  const ft = Math.floor(heightIn / 12);
  const inches = Math.round(heightIn % 12);
  const height = `${ft}'${inches}"`;
  const weight = ath.displayWeight ?? (ath.weight ? `${Math.round(ath.weight)} lbs` : '—');
  const birthCity = ath.birthPlace?.city ?? '';
  const birthState = ath.birthPlace?.state ?? ath.birthPlace?.country ?? '';
  const birthplace = [birthCity, birthState].filter(Boolean).join(', ') || '—';

  // College: $ref-only, extract id
  const collegeRef = ath.college?.$ref ?? '';
  const college = ath.college?.name ?? ath.college?.displayName ?? (collegeRef ? 'College' : '—');

  const draftInfo = ath.draft ?? {};
  const draftYear = draftInfo.year ?? 0;
  const draftPick = draftInfo.displayText ? draftInfo.displayText.replace('Year: ', '').replace(' Round:', ' Rd.').replace(' Pick:', ' Pick') : '—';
  const experience = ath.experience?.years ?? 0;
  const birthDate = ath.dateOfBirth ? ath.dateOfBirth.split('T')[0] : '';
  const birthYear = birthDate ? parseInt(birthDate.split('-')[0]) : 1990;
  const age = birthDate ? (new Date().getFullYear() - birthYear) : 25;
  const statusName = ath.status?.name ?? ath.status?.type ?? 'Active';
  const status: PlayerDetail['status'] =
    statusName.toLowerCase().includes('question') ? 'Questionable' :
    statusName.toLowerCase().includes('doubt') ? 'Doubtful' :
    statusName.toLowerCase().includes('out') || statusName.toLowerCase().includes('injur') ? 'Out' : 'Active';

  // ── Extract stats ──────────────────────────────────────────────────────────
  const careerCats: Category[] = (careerData?.splits?.categories ?? []);
  const seasonCats: Category[] = (seasonData?.splits?.categories ?? []);

  const careerRaw = extractStats(careerCats);
  const seasonRaw = extractStats(seasonCats);

  // ── Build sport-specific stats ─────────────────────────────────────────────
  let built: {
    career: { label: string; value: string | number }[];
    season: { label: string; value: string | number }[];
    radar: { metric: string; value: number; avg: number }[];
  } = { career: [], season: [], radar: [] };

  if (sport === 'NFL')      built = nflBuild(pos, careerRaw, seasonRaw);
  else if (sport === 'NBA') built = nbaBuild(careerRaw, seasonRaw);
  else if (sport === 'MLB') built = mlbBuild(pos, careerRaw, seasonRaw);
  else if (sport === 'NHL') built = nhlBuild(pos, careerRaw, seasonRaw);

  // Fallback if nothing parsed
  if (built.career.length === 0) {
    built.career = Object.entries(careerRaw).slice(0, 12).map(([k, v]) => ({ label: k, value: fmt(v) }));
  }

  // ── Advanced stats (from radar) ────────────────────────────────────────────
  const advancedStats = built.radar.map(r => ({
    label: r.metric,
    value: r.value.toFixed(0),
    percentile: Math.min(99, Math.round(r.value)),
    description: `${r.metric} score vs. league average`,
  }));

  // ── AI projection from season stats ───────────────────────────────────────
  const projStats = built.season.slice(1, 5).map(s => ({
    label: s.label,
    value: String(s.value),
  }));
  const confidence = Math.min(92, Math.max(55, 68 + (experience * 1.5) + (status === 'Active' ? 5 : -10)));

  const player: PlayerDetail = {
    id: `espn-${id}`,
    name: ath.displayName ?? ath.fullName ?? 'Unknown',
    position: pos,
    number: ath.jersey ?? '—',
    teamId: '',
    teamName,
    teamColor: color,
    sport,
    age,
    height,
    weight,
    birthplace,
    college,
    draftYear,
    draftPick,
    experience,
    status,
    bio: `${ath.displayName ?? 'Player'} is a ${pos} for ${teamName}. ${experience > 0 ? `${experience}-year veteran` : 'Rookie'}${college && college !== '—' ? ` out of ${college}` : ''}${birthplace !== '—' ? `. Born in ${birthplace}` : ''}.`,
    careerStats: built.career,
    seasonStats: built.season,
    advancedStats,
    gameLog: [],
    trendData: [],
    radarData: built.radar,
    aiProjection: {
      nextGame: 'Next Game',
      projectedStats: projStats.length > 0 ? projStats : [{ label: 'Performance', value: '—' }],
      confidence: Math.round(confidence),
      factors: ['Current form', 'Matchup analysis', 'Historical trends'],
      risks: ['Opponent defense', 'Game conditions', 'Injury risk'],
    },
    comparisonNote: `${ath.displayName ?? 'Player'} is an elite ${sport} competitor at the ${pos} position.`,
  };

  return NextResponse.json({ player });
}
