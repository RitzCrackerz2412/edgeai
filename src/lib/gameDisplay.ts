/**
 * Display helpers for live game phase labels and compact team names.
 * Shared by the games page, dashboard ticker, and live cards so every
 * surface renders the same, sport-correct wording.
 */
import type { Game, Team } from './types';

type PhaseInput = Pick<Game, 'sport' | 'status' | 'clock' | 'period' | 'statusDetail'>;

/**
 * Human label for where a live game stands.
 * Prefers the provider's own phrase ("Top 8th", "HT", "End of 3rd");
 * falls back to sport-correct period naming. Never shows a meaningless
 * "0:00" clock (baseball/soccer have no countdown clock).
 */
export function livePhase(g: PhaseInput): string {
  if (g.status === 'Halftime') return 'HT';

  const detail = g.statusDetail?.trim();
  if (detail) return detail;

  const clock = g.clock && g.clock !== '0:00' ? g.clock : '';
  const p = g.period;

  switch (g.sport) {
    case 'MLB':
      return p ? `Inning ${p}` : 'Live';
    case 'NFL':
    case 'NCAA Football':
      return p ? `Q${p}${clock ? ` · ${clock}` : ''}` : clock || 'Live';
    case 'NBA':
    case 'NCAA Basketball':
      return p ? `Q${p}${clock ? ` · ${clock}` : ''}` : clock || 'Live';
    case 'NHL':
      return p ? `P${p}${clock ? ` · ${clock}` : ''}` : clock || 'Live';
    case 'Soccer':
      // Soccer clocks are minute counts ("45'+2'") — show as-is
      return clock || (p ? `H${Math.min(p, 2)}` : 'Live');
    default:
      return clock || (p ? `P${p}` : 'Live');
  }
}

/**
 * Compact team name for tight rows. The old `name.split(' ').pop()`
 * produced "05" for "Mainz 05" and "04" for "Schalke 04" — prefer the
 * abbreviation, else the last word that isn't purely numeric.
 */
export function shortTeamName(t: Pick<Team, 'name' | 'abbreviation'>): string {
  if (t.abbreviation && t.abbreviation.length <= 4 && t.abbreviation !== '???') {
    return t.abbreviation;
  }
  const words = t.name.split(' ').filter(w => w.length > 0);
  for (let i = words.length - 1; i >= 0; i--) {
    if (!/^\d+$/.test(words[i])) return words[i];
  }
  return t.name;
}
