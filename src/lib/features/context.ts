/**
 * Contextual signal computation for the prediction engine.
 *
 * Covers four categories not captured by ELO or logistic features:
 *   1. Psychology   — rivalry intensity, playoff pressure, revenge games, primetime
 *   2. Officiating  — sport-level referee home-call bias; crew-specific when available
 *   3. Late moves   — warmup injuries (< 2 h), day-of lineup changes (< 24 h)
 *   4. Roster moves — trades / signings within 24 h of tip-off
 *
 * All outputs are expressed as home-team win-probability deltas so they can be
 * added directly to either model's adjusted probability.
 */

import type { Game } from '../types';
import type { RawInjury } from '../providers/types';
import type {
  PsychologyContext,
  OfficiatingContext,
  LateMoveSignal,
  GameContextSignals,
} from './types';
import { clamp } from './normalize';

// ─────────────────────────────────────────────────────────────────────────────
// 1. PSYCHOLOGY
// ─────────────────────────────────────────────────────────────────────────────

/** Known rivalries — [teamIdA, teamIdB] order-insensitive. */
const RIVALRIES: Record<string, string[][]> = {
  NBA: [
    ['bos-celtics',   'lal-lakers'],
    ['bos-celtics',   'phi-76ers'],
    ['gsw-warriors',  'okc-thunder'],
    ['gsw-warriors',  'cle-cavaliers'],
    ['lal-lakers',    'lac-clippers'],
    ['chi-bulls',     'det-pistons'],
    ['mia-heat',      'bos-celtics'],
    ['nyknicks',      'bkn-nets'],
    ['den-nuggets',   'gsw-warriors'],
  ],
  NFL: [
    ['ne-patriots',   'nyj-jets'],
    ['ne-patriots',   'buf-bills'],
    ['pit-steelers',  'bal-ravens'],
    ['pit-steelers',  'cle-browns'],
    ['dal-cowboys',   'nyg-giants'],
    ['dal-cowboys',   'phi-eagles'],
    ['gb-packers',    'chi-bears'],
    ['sf-49ers',      'sea-seahawks'],
    ['kc-chiefs',     'lac-chargers'],
    ['kc-chiefs',     'lvr-raiders'],
  ],
  MLB: [
    ['nyy-yankees',   'bos-redsox'],
    ['nyy-yankees',   'nymet-mets'],
    ['la-dodgers',    'sf-giants'],
    ['chi-cubs',      'stl-cardinals'],
    ['atl-braves',    'nymet-mets'],
  ],
  NHL: [
    ['mon-canadiens', 'tor-mapleleafs'],
    ['bos-bruins',    'mon-canadiens'],
    ['nyran-rangers', 'phi-flyers'],
    ['chi-blackhawks','det-redwings'],
    ['pit-penguins',  'phi-flyers'],
  ],
  Soccer: [
    ['epl-arsenal',       'epl-tottenham'],
    ['epl-manchester-city','epl-manchester-united'],
    ['epl-liverpool',     'epl-everton'],
    ['epl-chelsea',       'epl-arsenal'],
    ['laliga-realmadrid', 'laliga-barcelona'],
  ],
  'NCAA Basketball': [
    ['duke-bluede',   'unc-tarheels'],
    ['kansas-jay',    'kansas-state'],
    ['kentucky-wild', 'louisville-cards'],
  ],
  'NCAA Football': [
    ['ohio-state',    'michigan-wolverines'],
    ['alabama-tide',  'auburn-tigers'],
    ['oklahoma-soon', 'texas-longhorns'],
  ],
};

function isRivalry(homeId: string, awayId: string, sport: string): number {
  const pairs = RIVALRIES[sport] ?? [];
  for (const pair of pairs) {
    const [a, b] = pair as string[];
    if ((homeId === a && awayId === b) || (homeId === b && awayId === a)) return 1.0;
    // Partial match — same franchise city prefix (e.g. both NYC teams)
    if (a && b && homeId.split('-')[0] === awayId.split('-')[0]) return 0.4;
  }
  return 0.0;
}

/** Teams on the playoff bubble (win rate 0.42–0.62) face the highest pressure. */
function playoffPressure(homeWinPct: number, awayWinPct: number): number {
  const bubble = (wp: number) => (wp >= 0.42 && wp <= 0.62) ? 1 : 0;
  return Math.max(bubble(homeWinPct), bubble(awayWinPct));
}

/**
 * Revenge factor for the home team.
 * Positive → home team was beaten badly recently and is motivated.
 * Negative → away team is on a losing streak vs home and is due for a win.
 */
function revengeFactorHome(last5: { home: number; away: number }): number {
  const total = last5.home + last5.away;
  if (total === 0) return 0;
  const homeWinRate = last5.home / total;
  if (homeWinRate < 0.25) return 0.5;   // home team dominated recently: away seeks revenge
  if (homeWinRate > 0.75) return -0.3;  // away team dominated: home seeks revenge (negative for home prob)
  return 0;
}

function isPrimetime(time: string): boolean {
  // Matches "7:30 PM ET", "8:00 PM ET", "9:00 PM ET", etc.
  const match = time.match(/^(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return false;
  const [, h, , ampm] = match;
  const hour = parseInt(h, 10);
  return ampm.toUpperCase() === 'PM' && (hour >= 7 || hour === 12);
}

export function computePsychology(game: Game): PsychologyContext {
  const rivalry  = isRivalry(game.homeTeam.id, game.awayTeam.id, game.sport);
  const pressure = playoffPressure(game.homeTeam.winPct, game.awayTeam.winPct);
  const revenge  = revengeFactorHome(game.headToHead.last5);
  const primetime = isPrimetime(game.time);

  // Rivalry → slight home crowd boost; revenge → directional; primetime → small boost
  const mod = clamp(
    rivalry   * 0.015   // rivalry games: home crowd is louder, atmosphere matters more
    + revenge * 0.020   // revenge motivation
    + pressure * 0.008  // playoff stakes amplify home advantage
    + (primetime ? 0.008 : 0),
    -0.05, 0.05,
  );

  return { rivalryIntensity: rivalry, playoffPressure: pressure, revengeFactorHome: revenge, isPrimetime: primetime, mod };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. OFFICIATING
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sport-level home-call bias (home-team win-prob delta).
 *
 * Sources:
 *  NBA  — Moskowitz & Wertheim "Scorecasting" (2011); replicated in multiple studies
 *  NFL  — Burke, Advanced Football Analytics; home teams get ~0.5 more favorable PI/holding calls
 *  MLB  — Parsons et al. (2011) PNAS: umpires call more strikes for home batters
 *  NHL  — Weston et al: home teams average ~0.5 fewer penalty minutes/game
 *  Soccer — Nevill, Balmer, Williams (2002): referee awards significantly more stoppage time at home
 */
const SPORT_OFFICIATING_HOME_BIAS: Record<string, number> = {
  NBA:               0.018,
  NFL:               0.008,
  MLB:               0.012,
  NHL:               0.010,
  Soccer:            0.016,
  'NCAA Basketball': 0.020, // home crowd effect on student officials is more pronounced
  'NCAA Football':   0.010,
  UFC:               0.005, // judges occasionally lean toward louder crowd
  Tennis:            0.004,
  default:           0.010,
};

/**
 * High-foul-tendency adjustment.
 * Some officials call games tight → advantages teams that play physically.
 * Expressed as 0-1 (0 = passive, 1 = whistle-happy); neutral in probability terms
 * unless one team has a structural foul-drawing advantage.
 * When crew IDs are unavailable we default to the sport baseline only.
 */
export function computeOfficiating(
  sport: string,
  crewIds?: string[],  // when available from live ESPN feed
): OfficiatingContext {
  const baseline = SPORT_OFFICIATING_HOME_BIAS[sport] ?? SPORT_OFFICIATING_HOME_BIAS.default;

  // Crew-specific lookup placeholder — requires a referee bias database.
  // When crewIds are supplied by the live pipeline, this would query per-referee
  // historical home/away call splits. Defaults to 0 (neutral) until that data exists.
  const crewBias    = crewIds && crewIds.length > 0 ? 0 : 0; // extend here with DB lookup
  const foulTendency = 0.5; // neutral default; 0=passive, 1=whistle-heavy

  const bias = clamp(baseline + crewBias, 0, 0.04);

  return { sportBaselineBias: baseline, crewBias, foulTendency, bias };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3 & 4. LATE MOVES (warmup injuries + 24-h roster moves)
// ─────────────────────────────────────────────────────────────────────────────

const IMPACT_WIN_PROB_PENALTY: Record<string, number> = {
  Critical: 0.12,  // franchise cornerstone (e.g. star PG scratched at warmup)
  High:     0.06,
  Medium:   0.025,
  Low:      0.005,
};

/**
 * Determines how "late" an injury update is relative to game time.
 * Returns one of: 'warmup' (< 2 h), 'day-of' (2–24 h), 'known' (> 24 h).
 */
function injuryLateness(updatedAt: string, gameDate: string): 'warmup' | 'day-of' | 'known' {
  try {
    // Use gameDate as a proxy for game time (assume noon ET if no time available).
    const gameDateMs = new Date(gameDate).getTime();
    const updatedMs  = new Date(updatedAt).getTime();
    const hoursAgo   = (gameDateMs - updatedMs) / 3_600_000;
    if (hoursAgo < 2)  return 'warmup';
    if (hoursAgo < 24) return 'day-of';
    return 'known';
  } catch {
    return 'known';
  }
}

/**
 * Win-probability penalty from a single injury depending on lateness.
 * Warmup scratches are most damaging (no time to adjust scheme).
 */
function singleInjuryPenalty(
  impact: string,
  lateness: 'warmup' | 'day-of' | 'known',
): number {
  const base = IMPACT_WIN_PROB_PENALTY[impact] ?? 0;
  switch (lateness) {
    case 'warmup': return base * 1.4;  // no time to adjust at all
    case 'day-of': return base * 1.0;
    case 'known':  return 0;           // already priced into existing injury features
  }
}

export function computeLateMoves(
  homeInjuries: RawInjury[],
  awayInjuries:  RawInjury[],
  game: Game,
  // Roster move signals — pass from live provider when available
  homeRosterMoves: RosterMoveSignal[] = [],
  awayRosterMoves:  RosterMoveSignal[] = [],
): LateMoveSignal {
  const gameDate = game.date;

  // Late injury penalties
  let homeLatePenalty = 0;
  let awayLatePenalty = 0;
  let hasWarmup = false;
  let hasLastMinute = false;

  for (const inj of homeInjuries) {
    const lateness = injuryLateness(inj.updatedAt, gameDate);
    if (lateness !== 'known') {
      homeLatePenalty += singleInjuryPenalty(inj.impactLevel, lateness);
      if (lateness === 'warmup') hasWarmup = true;
      hasLastMinute = true;
    }
  }

  for (const inj of awayInjuries) {
    const lateness = injuryLateness(inj.updatedAt, gameDate);
    if (lateness !== 'known') {
      awayLatePenalty += singleInjuryPenalty(inj.impactLevel, lateness);
      if (lateness === 'warmup') hasWarmup = true;
      hasLastMinute = true;
    }
  }

  // Roster-move impact (trade / signing disruption)
  // A freshly acquired player has not yet learned the playbook → slight drag on cohesion
  const homeMoveImpact = homeRosterMoves.reduce((s, m) => s + m.disruptionScore, 0);
  const awayMoveImpact  = awayRosterMoves.reduce((s, m)  => s + m.disruptionScore,  0);

  return {
    hasWarmupScratch:      hasWarmup,
    hasLastMinuteMove:     hasLastMinute || homeRosterMoves.length > 0 || awayRosterMoves.length > 0,
    homeLateScratchDelta:  -clamp(homeLatePenalty, 0, 0.20),
    awayLateScratchDelta:  -clamp(awayLatePenalty,  0, 0.20),
    homeRosterMoveDelta:   -clamp(homeMoveImpact, 0, 0.05),
    awayRosterMoveDelta:   -clamp(awayMoveImpact,  0, 0.05),
    // Net effect expressed from home team's perspective:
    // away penalties improve home team's chances; home penalties hurt home team
    netHomeInjuryDelta: clamp(awayLatePenalty - homeLatePenalty, -0.20, 0.20),
    netHomeRosterDelta: clamp(awayMoveImpact  - homeMoveImpact,  -0.05, 0.05),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Roster move type (populated by live providers)
// ─────────────────────────────────────────────────────────────────────────────

export interface RosterMoveSignal {
  /** Player acquired */
  playerName: string;
  /** Trade or free-agent signing */
  moveType: 'trade' | 'signing' | 'waiver';
  /** Hours before game the move was completed */
  hoursBeforeGame: number;
  /**
   * Disruption score: probability drag on cohesion (0–0.05).
   * Higher when the player is a starter, the move was very recent,
   * or the team runs a complex system.
   */
  disruptionScore: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Assembler
// ─────────────────────────────────────────────────────────────────────────────

export function computeGameContext(
  game: Game,
  homeInjuries: RawInjury[] = [],
  awayInjuries:  RawInjury[]  = [],
  homeRosterMoves: RosterMoveSignal[] = [],
  awayRosterMoves:  RosterMoveSignal[]  = [],
  crewIds?: string[],
): GameContextSignals {
  return {
    psychology:  computePsychology(game),
    officiating: computeOfficiating(game.sport, crewIds),
    lateMoves:   computeLateMoves(homeInjuries, awayInjuries, game, homeRosterMoves, awayRosterMoves),
  };
}

export type { GameContextSignals } from './types';
