/**
 * Derives per-game scoring projections from player data for the games page panel.
 * Uses aiProjection.projectedStats (per-game for NBA; season totals for others)
 * and seasonStats to normalise everything to a per-game label.
 */
import { PLAYER_DETAILS } from './playerData';
import type { PlayerDetail } from './playerData';
import type { Game } from './types';

export interface ScorerProjection {
  id: string;
  name: string;
  position: string;
  teamId: string;
  teamName: string;
  teamColor: string;
  sport: string;
  confidence: number;
  statLabel: string;   // e.g. "Points", "Goals", "TDs", "Saves"
  statValue: string;   // e.g. "28-32", "0.8-1.1", "2-3"
  statUnit: string;    // e.g. "/gm", "/szn", ""
  seasonAvg: string;   // e.g. "30.1 PPG" — quick context line
}

/** Which projectedStats entry to use as the primary scoring stat per sport */
const SCORE_STAT_INDEX: Record<string, number> = {
  NBA: 0,   // Points
  NFL: 1,   // TDs (index 1; index 0 is Pass Yds for QBs — not "scoring")
  NHL: 0,   // Goals or Points
  MLB: 0,   // H or HR depending on position
  Soccer: 0, // Goals
};

/** Short stat label overrides so the card reads clearly */
const SCORE_LABEL: Record<string, string> = {
  NBA: 'Pts',
  Soccer: 'Goals',
  NHL: 'Pts',
  MLB: 'H',
};

/** Unit suffix per sport */
const SCORE_UNIT: Record<string, string> = {
  NBA: '/gm',
  Soccer: '/szn',
  NHL: '/gm',
  MLB: '/gm',
  NFL: '/szn',
};

function seasonAvgLine(p: PlayerDetail): string {
  const s = p.seasonStats;
  if (!s.length) return '';
  // Pick the most informative single stat for the subtitle
  const map = new Map(s.map(x => [x.label, String(x.value)]));
  if (p.sport === 'NBA')    return `${map.get('PPG') ?? ''} PPG · ${map.get('APG') ?? ''} APG`;
  if (p.sport === 'Soccer') return `${map.get('Goals') ?? ''} G · ${map.get('Assists') ?? ''} A`;
  if (p.sport === 'NHL')    return `${map.get('Goals') ?? ''} G · ${map.get('Assists') ?? ''} A`;
  if (p.sport === 'NFL')    return `${map.get('TDs') ?? ''} TD`;
  if (p.sport === 'MLB')    return `${map.get('HR') ?? map.get('SV') ?? ''} ${map.has('HR') ? 'HR' : map.has('SV') ? 'SV' : ''}`;
  return String(s[0]?.value ?? '');
}

function pickScoringProj(p: PlayerDetail): { label: string; value: string; unit: string } | null {
  const proj = p.aiProjection.projectedStats;
  if (!proj.length) return null;

  const sport = p.sport;
  const idx = SCORE_STAT_INDEX[sport] ?? 0;

  // For QBs in NFL, index 1 is TDs; for skill positions index 0 might be Rec Yds —
  // fallback to first stat labelled "TDs" or "Goals" if the index overshoots
  let entry = proj[Math.min(idx, proj.length - 1)];

  // NFL: only players with a touchdown projection belong on a scorers panel
  // (excludes linemen/defenders whose stats are pressures, tackles, etc.)
  if (sport === 'NFL') {
    const tdEntry = proj.find(x => x.label === 'TDs' || x.label.includes('TD'));
    if (!tdEntry) return null;
    entry = tdEntry;
  }

  const label = SCORE_LABEL[sport] ?? entry.label;
  const unit  = SCORE_UNIT[sport] ?? '';
  return { label, value: entry.value, unit };
}

/** Return top scorers whose team plays in one of the provided games, sorted by confidence. */
export function getTopScorers(games: Game[], limit = 12): ScorerProjection[] {
  // Collect all team IDs from the games
  const teamIds = new Set<string>();
  for (const g of games) {
    teamIds.add(g.homeTeam.id);
    teamIds.add(g.awayTeam.id);
  }

  const results: ScorerProjection[] = [];

  for (const p of Object.values(PLAYER_DETAILS)) {
    if (!teamIds.has(p.teamId)) continue;
    if (p.status === 'Out') continue;

    const proj = pickScoringProj(p);
    if (!proj) continue;

    results.push({
      id:          p.id,
      name:        p.name,
      position:    p.position,
      teamId:      p.teamId,
      teamName:    p.teamName,
      teamColor:   p.teamColor,
      sport:       p.sport,
      confidence:  p.aiProjection.confidence,
      statLabel:   proj.label,
      statValue:   proj.value,
      statUnit:    proj.unit,
      seasonAvg:   seasonAvgLine(p),
    });
  }

  // Sort by confidence desc, then deduplicate so each team contributes at most 2 players
  const teamCount = new Map<string, number>();
  return results
    .sort((a, b) => b.confidence - a.confidence)
    .filter(p => {
      const c = teamCount.get(p.teamId) ?? 0;
      if (c >= 2) return false;
      teamCount.set(p.teamId, c + 1);
      return true;
    })
    .slice(0, limit);
}
