import type { PlayerDetail } from '@/lib/playerData';

/** Compact builder for static player profiles. */
export function mkp(
  id: string, name: string, pos: string, num: string,
  teamId: string, team: string, color: string, sport: string,
  age: number, exp: number, bio: string,
  career:  [string, string | number][],
  season:  [string, string | number][],
  radar:   [string, number][],
  conf:    number,
  projStats: [string, string][],
): PlayerDetail {
  return {
    id, name, position: pos, number: num,
    teamId, teamName: team, teamColor: color, sport,
    age, height: '—', weight: '—', birthplace: '—',
    college: '—', draftYear: 0, draftPick: '—', experience: exp,
    status: 'Active', bio,
    careerStats:   career.map(([label, value]) => ({ label, value })),
    seasonStats:   season.map(([label, value]) => ({ label, value })),
    advancedStats: radar.map(([metric, value]) => ({
      label: metric,
      value: value.toFixed(0),
      percentile: Math.min(99, Math.round(value)),
      description: `${metric} vs. league average`,
    })),
    gameLog: [],
    trendData: [],
    radarData: radar.map(([metric, value]) => ({ metric, value, avg: 65 })),
    aiProjection: {
      nextGame: 'Next Game',
      projectedStats: projStats.map(([label, value]) => ({ label, value })),
      confidence: conf,
      factors: ['Current form', 'Historical performance', 'Matchup analysis'],
      risks: ['Opponent strength', 'Variance', 'Injury risk'],
    },
    comparisonNote: `${name} is an elite ${sport} competitor.`,
  };
}
