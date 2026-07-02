/**
 * Enriches a static Team object with real accumulated game results.
 *
 * When a team has 5+ recorded results, we blend their rolling stats
 * (from actual ESPN final scores) into the base static values.
 *
 * Blend weight increases with sample count:
 *   5 games  → 25% live, 75% static
 *   10 games → 50% live, 50% static
 *   20+ games → 90% live, 10% static
 *
 * This prevents noisy early-season data from overriding good baseline
 * ratings, while fully switching to live stats when enough data exists.
 */

import type { Team } from '../types';
import { resultsStore } from './store';

const MIN_GAMES = 5;  // minimum results before blending kicks in

function blendWeight(gamesPlayed: number): number {
  if (gamesPlayed < MIN_GAMES) return 0;
  // Saturates to 0.90 at 20+ games; never fully drops the static baseline
  return Math.min(0.90, (gamesPlayed - MIN_GAMES + 1) / (20 - MIN_GAMES + 1) * 0.90);
}

function blend(live: number, base: number, weight: number): number {
  return live * weight + base * (1 - weight);
}

export function enrichTeam(team: Team): Team {
  const stats = resultsStore.getTeamStats(team.id);
  if (!stats || stats.gamesPlayed < MIN_GAMES) return team;

  const w = blendWeight(stats.gamesPlayed);

  // Rolling offense/defense ratings from actual scores
  const offRating = blend(stats.offRatingRolling, team.offensiveRating, w);
  const defRating = blend(stats.defRatingRolling, team.defensiveRating, w);

  // Win percentage from real results
  const winPct = stats.gamesPlayed > 0
    ? blend(stats.wins / stats.gamesPlayed, team.winPct, w)
    : team.winPct;

  // Momentum from last 10 real results (W=1, D=0.5, L=0)
  const recent = stats.recentResults;
  const liveMomentum = recent.length > 0
    ? Math.round((recent.reduce((s, r) => s + (r === 'W' ? 1 : r === 'D' ? 0.5 : 0), 0) / recent.length) * 99)
    : team.momentum;
  const momentum = Math.round(blend(liveMomentum, team.momentum, w));

  // ELO from accumulated results
  const eloRating = Math.round(blend(stats.eloRating, team.eloRating, w));

  // Record string from live W/L
  const record = stats.gamesPlayed >= MIN_GAMES
    ? `${stats.wins}-${stats.losses}`
    : team.record;

  // Home/away records
  const homeRecord = stats.homeGames >= 3
    ? `${stats.homeWins}-${stats.homeLosses}`
    : team.homeRecord;
  const awayRecord = stats.awayGames >= 3
    ? `${stats.awayWins}-${stats.awayLosses}`
    : team.awayRecord;

  // Last 5 from real results
  const last5 = recent.length >= 5
    ? (recent.slice(-5) as Team['last5'])
    : team.last5;

  return {
    ...team,
    offensiveRating: parseFloat(offRating.toFixed(2)),
    defensiveRating: parseFloat(defRating.toFixed(2)),
    winPct:          parseFloat(winPct.toFixed(3)),
    eloRating,
    momentum,
    record,
    homeRecord,
    awayRecord,
    last5,
    netRating: parseFloat((offRating - defRating).toFixed(2)),
  };
}
