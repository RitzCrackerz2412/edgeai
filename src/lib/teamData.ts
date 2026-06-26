/**
 * Detailed team profiles for team pages.
 * Live data source: Sportradar / SportsDataIO API (set SPORTS_DATA_IO_API_KEY).
 */

export interface RosterPlayer {
  id: string;
  name: string;
  position: string;
  number: string;
  age: number;
  height: string;
  weight: string;
  status: 'Active' | 'Questionable' | 'Doubtful' | 'Out';
  stats: Record<string, number | string>;
  impact: number; // 0–100
}

export interface ScheduleGame {
  date: string;
  opponent: string;
  home: boolean;
  result?: 'W' | 'L';
  score?: string;
  upcoming?: boolean;
}

export interface TeamInjury {
  player: string;
  position: string;
  injury: string;
  status: 'Questionable' | 'Doubtful' | 'Out';
  estimatedReturn: string;
  impact: 'Low' | 'Medium' | 'High' | 'Critical';
}

export interface TeamDetail {
  id: string;
  name: string;
  abbreviation: string;
  sport: string;
  league: string;
  conference: string;
  division: string;
  founded: number;
  championships: number;
  color: string;
  secondaryColor: string;
  record: string;
  homeRecord: string;
  awayRecord: string;
  last10: string;
  streak: string;
  // Season stats — keys vary by sport, generic record here
  seasonStats: { label: string; value: string | number; rank?: number }[];
  advancedMetrics: { label: string; value: string | number; percentile?: number; positive?: boolean }[];
  roster: RosterPlayer[];
  schedule: ScheduleGame[];
  injuries: TeamInjury[];
  aiAnalysis: {
    strengths: string[];
    weaknesses: string[];
    outlook: string;
    keyMatchupFactor: string;
  };
  trendData: { week: string; offRating: number; defRating: number; netRating: number }[];
  powerRanking: number;
  eloRating: number;
  momentum: number;
  offensiveRating: number;
  defensiveRating: number;
}

export const TEAM_DETAILS: Record<string, TeamDetail> = {
  'kc-chiefs': {
    id: 'kc-chiefs',
    name: 'Kansas City Chiefs',
    abbreviation: 'KC',
    sport: 'NFL',
    league: 'NFL',
    conference: 'AFC',
    division: 'AFC West',
    founded: 1960,
    championships: 4,
    color: '#E31837',
    secondaryColor: '#FFB81C',
    record: '11-4',
    homeRecord: '7-1',
    awayRecord: '4-3',
    last10: '7-3',
    streak: 'W2',
    powerRanking: 1,
    eloRating: 1820,
    momentum: 87,
    offensiveRating: 28.4,
    defensiveRating: 18.2,
    seasonStats: [
      { label: 'Points/Game',   value: 28.4, rank: 1 },
      { label: 'Pts Allowed',   value: 18.2, rank: 3 },
      { label: 'Total Yards',   value: 381.2, rank: 4 },
      { label: 'Yards Allowed', value: 302.8, rank: 2 },
      { label: 'Turnovers',     value: 12,   rank: 5 },
      { label: 'Sacks',         value: 42,   rank: 8 },
      { label: '3rd Down %',    value: '44.2%', rank: 3 },
      { label: 'Red Zone %',    value: '72.4%', rank: 1 },
    ],
    advancedMetrics: [
      { label: 'DVOA Offense',   value: '+24.3%', percentile: 97, positive: true },
      { label: 'DVOA Defense',   value: '+18.7%', percentile: 93, positive: true },
      { label: 'EPA/Play',       value: '+0.18',  percentile: 95, positive: true },
      { label: 'Pass DVOA',      value: '+28.1%', percentile: 98, positive: true },
      { label: 'Rush DVOA',      value: '+8.2%',  percentile: 72, positive: true },
      { label: 'Pressure Rate',  value: '23.4%',  percentile: 62, positive: false },
      { label: 'Coverage Grade', value: 88.2,     percentile: 89, positive: true },
      { label: 'Special Teams',  value: '+4.1%',  percentile: 78, positive: true },
    ],
    trendData: [
      { week: 'Wk 1',  offRating: 24.1, defRating: 21.2, netRating: 2.9 },
      { week: 'Wk 2',  offRating: 26.3, defRating: 20.1, netRating: 6.2 },
      { week: 'Wk 3',  offRating: 28.9, defRating: 18.4, netRating: 10.5 },
      { week: 'Wk 4',  offRating: 27.2, defRating: 19.8, netRating: 7.4 },
      { week: 'Wk 5',  offRating: 31.4, defRating: 16.2, netRating: 15.2 },
      { week: 'Wk 6',  offRating: 29.8, defRating: 17.9, netRating: 11.9 },
      { week: 'Wk 7',  offRating: 28.1, defRating: 18.6, netRating: 9.5 },
      { week: 'Wk 8',  offRating: 30.2, defRating: 17.1, netRating: 13.1 },
      { week: 'Wk 9',  offRating: 32.4, defRating: 15.8, netRating: 16.6 },
      { week: 'Wk 10', offRating: 28.7, defRating: 18.9, netRating: 9.8 },
    ],
    roster: [
      { id: 'pm-15',  name: 'Patrick Mahomes',  position: 'QB', number: '15', age: 30, height: "6'2\"", weight: '230', status: 'Active',     impact: 98, stats: { PaYds: 4312, TDs: 38, INTs: 9, QBR: 112.4 } },
      { id: 'tk-87',  name: 'Travis Kelce',      position: 'TE', number: '87', age: 35, height: "6'5\"", weight: '245', status: 'Active',     impact: 91, stats: { Rec: 78, Yds: 934, TDs: 8, Avg: 12.0 } },
      { id: 'jw-11',  name: 'Juju Smith-Schuster',position: 'WR', number: '11', age: 28, height: "5'11\"", weight: '215', status: 'Active',   impact: 74, stats: { Rec: 62, Yds: 718, TDs: 5 } },
      { id: 'ij-28',  name: 'Isiah Pacheco',     position: 'RB', number: '10', age: 26, height: "5'10\"", weight: '216', status: 'Questionable', impact: 80, stats: { Att: 182, Yds: 872, TDs: 9, Avg: 4.8 } },
      { id: 'ct-93',  name: 'Chris Jones',        position: 'DT', number: '95', age: 30, height: "6'3\"", weight: '285', status: 'Active',     impact: 89, stats: { Sacks: 14.5, TFL: 18, QBH: 22 } },
    ],
    schedule: [
      { date: '2026-06-01', opponent: 'BUF', home: false, result: 'W', score: '31-24' },
      { date: '2026-06-08', opponent: 'LV',  home: true,  result: 'W', score: '35-14' },
      { date: '2026-06-15', opponent: 'DEN', home: false, result: 'L', score: '17-24' },
      { date: '2026-06-22', opponent: 'CIN', home: true,  result: 'W', score: '28-21' },
      { date: '2026-06-29', opponent: 'BUF', home: true,  upcoming: true },
    ],
    injuries: [
      { player: 'Isiah Pacheco', position: 'RB', injury: 'Ankle sprain', status: 'Questionable', estimatedReturn: 'Week 16', impact: 'High' },
      { player: 'Mecole Hardman', position: 'WR', injury: 'Hamstring', status: 'Doubtful', estimatedReturn: 'Week 17', impact: 'Medium' },
    ],
    aiAnalysis: {
      strengths: [
        'Elite QB play — Mahomes top-3 all-time in playoff wins',
        '#1 offensive DVOA in the NFL (+24.3%)',
        'Red zone efficiency league-best at 72.4%',
        'Andy Reid play-calling creates structural mismatches',
        'Proven pressure-game pedigree (4 Super Bowl appearances)',
      ],
      weaknesses: [
        'Offensive line pass protection graded 24th in league',
        'Depth at receiver behind Kelce is thin',
        'Run defense susceptible to zone-read quarterbacks',
        'Pacheco questionable — limits two-back attack',
      ],
      outlook: 'Kansas City remains the AFC standard. Their offense is historically efficient and Mahomes elevates every possession. The biggest risk is the offensive line — if Mahomes is under pressure consistently, the entire system degrades. Watch Pacheco\'s status; his availability determines whether KC can control the clock.',
      keyMatchupFactor: 'How quickly the defense can get Mahomes off the field with 3-and-outs',
    },
  },

  'bos-celtics': {
    id: 'bos-celtics',
    name: 'Boston Celtics',
    abbreviation: 'BOS',
    sport: 'NBA',
    league: 'NBA',
    conference: 'Eastern',
    division: 'Atlantic',
    founded: 1946,
    championships: 18,
    color: '#007A33',
    secondaryColor: '#BA9653',
    record: '47-18',
    homeRecord: '25-7',
    awayRecord: '22-11',
    last10: '8-2',
    streak: 'W4',
    powerRanking: 1,
    eloRating: 1780,
    momentum: 91,
    offensiveRating: 120.1,
    defensiveRating: 108.4,
    seasonStats: [
      { label: 'Off Rating',  value: 120.1, rank: 1 },
      { label: 'Def Rating',  value: 108.4, rank: 1 },
      { label: 'Net Rating',  value: '+11.7', rank: 1 },
      { label: 'Pace',        value: 98.2,  rank: 14 },
      { label: '3P%',         value: '42.1%', rank: 1 },
      { label: 'PPG',         value: 121.4, rank: 2 },
      { label: 'Opp PPG',     value: 109.7, rank: 1 },
      { label: 'Reb/G',       value: 46.2,  rank: 4 },
    ],
    advancedMetrics: [
      { label: 'ORtg (adj)',     value: 120.1, percentile: 99, positive: true },
      { label: 'DRtg (adj)',     value: 108.4, percentile: 99, positive: true },
      { label: 'EFG%',          value: '57.8%', percentile: 96, positive: true },
      { label: 'TOV%',          value: '11.2%', percentile: 88, positive: true },
      { label: '3PT Attempt Rate', value: '47.3%', percentile: 97, positive: true },
      { label: 'Opp 3PT%',     value: '33.8%',  percentile: 91, positive: true },
      { label: 'PIPM',         value: '+8.4',   percentile: 95, positive: true },
      { label: 'Second Chance Pts', value: 12.4, percentile: 62, positive: false },
    ],
    trendData: [
      { week: 'Nov', offRating: 116.2, defRating: 112.1, netRating: 4.1 },
      { week: 'Dec', offRating: 118.4, defRating: 110.8, netRating: 7.6 },
      { week: 'Jan', offRating: 119.8, defRating: 109.2, netRating: 10.6 },
      { week: 'Feb', offRating: 121.2, defRating: 108.1, netRating: 13.1 },
      { week: 'Mar', offRating: 122.4, defRating: 107.4, netRating: 15.0 },
      { week: 'Apr', offRating: 120.1, defRating: 108.4, netRating: 11.7 },
    ],
    roster: [
      { id: 'jt-0',  name: 'Jayson Tatum',    position: 'SF', number: '0',  age: 28, height: "6'8\"",  weight: '210', status: 'Active', impact: 96, stats: { PPG: 28.4, RPG: 8.2, APG: 4.8, '3P%': '.389', TS: '.618' } },
      { id: 'jb-7',  name: 'Jaylen Brown',    position: 'SG', number: '7',  age: 30, height: "6'6\"",  weight: '220', status: 'Active', impact: 88, stats: { PPG: 22.1, RPG: 5.4, APG: 3.8, '3P%': '.372', TS: '.594' } },
      { id: 'kp-11', name: 'Kristaps Porzingis', position: 'C', number: '8', age: 29, height: "7'2\"", weight: '240', status: 'Active', impact: 82, stats: { PPG: 18.2, RPG: 7.2, BPG: 1.9, '3P%': '.384' } },
      { id: 'jh-30', name: 'Jrue Holiday',   position: 'PG', number: '4',  age: 36, height: "6'4\"",  weight: '205', status: 'Active', impact: 79, stats: { PPG: 12.8, APG: 5.2, SPG: 1.4, '3P%': '.368' } },
      { id: 'ah-42', name: 'Al Horford',     position: 'C',  number: '42', age: 38, height: "6'9\"",  weight: '240', status: 'Active', impact: 70, stats: { PPG: 9.4,  RPG: 6.8, BPG: 1.2, '3P%': '.418' } },
    ],
    schedule: [
      { date: '2026-06-18', opponent: 'MIA', home: true,  result: 'W', score: '121-108' },
      { date: '2026-06-20', opponent: 'PHI', home: false, result: 'W', score: '118-114' },
      { date: '2026-06-22', opponent: 'MIL', home: true,  result: 'W', score: '129-112' },
      { date: '2026-06-24', opponent: 'NYK', home: true,  result: 'W', score: '124-109' },
      { date: '2026-06-26', opponent: 'LAL', home: true,  upcoming: true },
    ],
    injuries: [
      { player: 'Kristaps Porzingis', position: 'C', injury: 'Load management', status: 'Questionable', estimatedReturn: 'Next game', impact: 'Medium' },
    ],
    aiAnalysis: {
      strengths: [
        'Best net rating in the NBA (+11.7) by a wide margin',
        '#1 ranked offense AND defense simultaneously — rare',
        '3-point shooting depth (6 players shooting 37%+)',
        'Tatum delivers 30+ PPG in clutch situations',
        'Defensive versatility — can guard every position',
      ],
      weaknesses: [
        'Porzingis health a recurring concern',
        'Pace is league-average — susceptible to slow-down teams',
        'Second chance points are a relative weakness (rank 22nd)',
        'Holiday aging — minutes load management late in season',
      ],
      outlook: 'The Celtics are the class of the NBA. Their combination of elite offense and historically strong defense is unprecedented in the modern 3-point era. The only real vulnerability is injuries — when healthy, they are the odds-on championship favorite by a significant margin.',
      keyMatchupFactor: 'Whether opponents can disrupt Boston\'s 3-point attempts — they live and die by volume 3s',
    },
  },
};

// Convenience list for team browser page
export const TEAM_LIST = Object.values(TEAM_DETAILS).map(t => ({
  id: t.id,
  name: t.name,
  abbreviation: t.abbreviation,
  sport: t.sport,
  league: t.league,
  record: t.record,
  color: t.color,
  powerRanking: t.powerRanking,
  eloRating: t.eloRating,
  momentum: t.momentum,
  last10: t.last10,
  streak: t.streak,
}));
