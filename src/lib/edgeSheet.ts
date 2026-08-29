/**
 * The Edge Sheet — daily analyst briefing derived entirely from data already
 * on Game objects. No extra I/O: upset radar, ELO stakes, model civil wars,
 * and a momentum board, all computed from getUpcomingGames output.
 */
import type { Game, Team } from './types';
import { computeSubModels } from './submodels';

// Mirrors SPORT_ELO_CONFIG in engine/elo.ts (k + home advantage only)
const ELO_K: Record<string, { k: number; homeAdv: number }> = {
  NFL:               { k: 20, homeAdv: 65 },
  NBA:               { k: 32, homeAdv: 100 },
  MLB:               { k: 20, homeAdv: 25 },
  NHL:               { k: 24, homeAdv: 60 },
  Soccer:            { k: 20, homeAdv: 90 },
  'NCAA Football':   { k: 24, homeAdv: 70 },
  'NCAA Basketball': { k: 32, homeAdv: 100 },
  UFC:               { k: 40, homeAdv: 0 },
  Boxing:            { k: 40, homeAdv: 0 },
  Tennis:            { k: 32, homeAdv: 30 },
};
const DEFAULT_K = { k: 25, homeAdv: 50 };

function eloWinProb(homeElo: number, awayElo: number): number {
  return 1 / (1 + Math.pow(10, (awayElo - homeElo) / 400));
}

function isPending(g: Game): boolean {
  return g.status === 'Upcoming' || g.status === 'Pregame';
}

// Fallback data can produce degenerate fixtures where both sides resolve to the same team
function isValidMatch(g: Game): boolean {
  return g.homeTeam.id !== g.awayTeam.id && g.homeTeam.name !== g.awayTeam.name;
}

// ── Upset Radar ───────────────────────────────────────────────────────────────

export interface UpsetAlert {
  game: Game;
  underdog: Team;
  favorite: Team;
  upsetProb: number;      // model's upset probability (0-100)
  underdogHeat: number;   // wins in underdog's last 5
  eloGap: number;         // favorite elo − underdog elo
  upsetScore: number;     // composite ranking score
}

function last5Wins(t: Team): number {
  return t.last5.reduce((s, r) => s + (r === 'W' ? 1 : r === 'D' ? 0.5 : 0), 0);
}

export function getUpsetRadar(games: Game[], limit = 6): UpsetAlert[] {
  const alerts: UpsetAlert[] = [];
  const seenPairs = new Set<string>();

  for (const g of games) {
    if (!isPending(g) || !isValidMatch(g)) continue;
    const favIsHome = g.prediction.winner === g.homeTeam.name;
    const favorite  = favIsHome ? g.homeTeam : g.awayTeam;
    const underdog  = favIsHome ? g.awayTeam : g.homeTeam;

    const upsetProb = g.prediction.upsetProbability;
    if (upsetProb < 15) continue;

    const heat   = last5Wins(underdog);
    const eloGap = favorite.eloRating - underdog.eloRating;

    // Composite: raw upset prob, boosted when the dog is hot and the gap is small
    const upsetScore = upsetProb + heat * 3 - Math.max(0, eloGap) / 25;

    alerts.push({ game: g, underdog, favorite, upsetProb, underdogHeat: heat, eloGap, upsetScore });
  }

  // One appearance per underdog so the radar spans the slate
  return alerts
    .sort((a, b) => b.upsetScore - a.upsetScore)
    .filter(a => {
      if (seenPairs.has(a.underdog.id)) return false;
      seenPairs.add(a.underdog.id);
      return true;
    })
    .slice(0, limit);
}

// ── ELO Stakes ────────────────────────────────────────────────────────────────

export interface EloStake {
  game: Game;
  favorite: Team;
  underdog: Team;
  favWinProb: number;     // ELO-implied favorite win prob (0-100)
  swingIfUpset: number;   // ELO points that transfer if the favorite loses
  swingIfChalk: number;   // ELO points that transfer if the favorite wins
}

export function getEloStakes(games: Game[], limit = 6): EloStake[] {
  const stakes: EloStake[] = [];

  for (const g of games) {
    if (!isPending(g) || !isValidMatch(g)) continue;
    const cfg = ELO_K[g.sport] ?? DEFAULT_K;
    const pHome = eloWinProb(g.homeTeam.eloRating + cfg.homeAdv, g.awayTeam.eloRating);

    const favIsHome = pHome >= 0.5;
    const favorite  = favIsHome ? g.homeTeam : g.awayTeam;
    const underdog  = favIsHome ? g.awayTeam : g.homeTeam;
    const pFav      = favIsHome ? pHome : 1 - pHome;

    stakes.push({
      game: g,
      favorite,
      underdog,
      favWinProb:   pFav * 100,
      swingIfUpset: cfg.k * pFav,
      swingIfChalk: cfg.k * (1 - pFav),
    });
  }

  return stakes.sort((a, b) => b.swingIfUpset - a.swingIfUpset).slice(0, limit);
}

// ── Model Civil Wars ──────────────────────────────────────────────────────────

export interface CivilWar {
  game: Game;
  disagreementPct: number;
  scoreA: number;  // recency model (home win %)
  scoreB: number;  // ELO model
  scoreC: number;  // historical model
  activeModels: number;
}

export function getCivilWars(games: Game[], limit = 5): CivilWar[] {
  const wars: CivilWar[] = [];

  for (const g of games) {
    if (!isPending(g) || !isValidMatch(g)) continue;
    const e = computeSubModels(g);
    if (e.activeModels < 2) continue;
    wars.push({
      game: g,
      disagreementPct: e.disagreementPct,
      scoreA: e.scoreA, scoreB: e.scoreB, scoreC: e.scoreC,
      activeModels: e.activeModels,
    });
  }

  return wars.sort((a, b) => b.disagreementPct - a.disagreementPct).slice(0, limit);
}

// ── Momentum Board ────────────────────────────────────────────────────────────

export interface MomentumEntry {
  team: Team;
  sport: string;
  heat: number;        // 0-5 from last5 (D = 0.5)
  record5: string;     // e.g. "4-1" over last 5
  streak: string;      // e.g. "W4", "L2"
  nextOpponent: string;
  nextGameId: string;
}

function streakOf(t: Team): string {
  const l5 = t.last5;
  if (!l5.length) return '—';
  const last = l5[l5.length - 1];
  let n = 0;
  for (let i = l5.length - 1; i >= 0 && l5[i] === last; i--) n++;
  return `${last}${n}`;
}

export function getMomentumBoard(games: Game[], limit = 5): { hot: MomentumEntry[]; cold: MomentumEntry[] } {
  const seen = new Set<string>();
  const entries: MomentumEntry[] = [];

  for (const g of games) {
    if (!isPending(g) || !isValidMatch(g)) continue;
    for (const [team, opp] of [[g.homeTeam, g.awayTeam], [g.awayTeam, g.homeTeam]] as [Team, Team][]) {
      if (seen.has(team.id) || !team.last5.length) continue;
      seen.add(team.id);
      const w = team.last5.filter(r => r === 'W').length;
      entries.push({
        team,
        sport: g.sport,
        heat: last5Wins(team),
        record5: `${w}-${team.last5.length - w}`,
        streak: streakOf(team),
        nextOpponent: opp.name,
        nextGameId: g.id,
      });
    }
  }

  const sorted = [...entries].sort((a, b) => b.heat - a.heat || b.team.momentum - a.team.momentum);
  return {
    hot:  sorted.filter(e => e.heat >= 3.5).slice(0, limit),
    cold: sorted.filter(e => e.heat <= 1.5).slice(-limit).reverse(),
  };
}

// ── Headliners ────────────────────────────────────────────────────────────────

export interface Headliners {
  lock: Game | null;        // highest-confidence pending pick
  upset: UpsetAlert | null; // top of the upset radar
  civilWar: CivilWar | null;
}

export function getHeadliners(games: Game[], radar: UpsetAlert[], wars: CivilWar[]): Headliners {
  const pending = games.filter(isPending);
  const lock = pending.length
    ? pending.reduce((best, g) => (g.prediction.confidence > best.prediction.confidence ? g : best))
    : null;

  return {
    lock,
    upset: radar[0] ?? null,
    civilWar: wars[0] ?? null,
  };
}
