/**
 * Player profiles for player detail and comparison pages.
 * Live data source: Sportradar / FantasyData API (set SPORTS_DATA_IO_API_KEY).
 */

export interface GameLogEntry {
  date: string;
  opponent: string;
  home: boolean;
  result: 'W' | 'L';
  stats: Record<string, number | string>;
  performance: 'Elite' | 'Good' | 'Average' | 'Poor';
}

export interface PlayerDetail {
  id: string;
  name: string;
  position: string;
  number: string;
  teamId: string;
  teamName: string;
  teamColor: string;
  sport: string;
  age: number;
  height: string;
  weight: string;
  birthplace: string;
  college: string;
  draftYear: number;
  draftPick: string;
  experience: number;
  status: 'Active' | 'Questionable' | 'Doubtful' | 'Out';
  injuryNote?: string;
  bio: string;

  careerStats:  { label: string; value: string | number }[];
  seasonStats:  { label: string; value: string | number; rank?: number }[];
  advancedStats: { label: string; value: string | number; percentile: number; description: string }[];

  gameLog: GameLogEntry[];
  trendData: { game: string; primary: number; secondary?: number }[];

  radarData: { metric: string; value: number; avg: number }[];

  aiProjection: {
    nextGame: string;
    projectedStats: { label: string; value: string }[];
    confidence: number;
    factors: string[];
    risks: string[];
  };

  comparisonNote: string;
}

export const PLAYER_DETAILS: Record<string, PlayerDetail> = {
  'pm-15': {
    id: 'pm-15',
    name: 'Patrick Mahomes',
    position: 'QB',
    number: '15',
    teamId: 'kc-chiefs',
    teamName: 'Kansas City Chiefs',
    teamColor: '#E31837',
    sport: 'NFL',
    age: 30,
    height: "6'2\"",
    weight: '230 lbs',
    birthplace: 'Tyler, TX',
    college: 'Texas Tech',
    draftYear: 2017,
    draftPick: '10th overall',
    experience: 8,
    status: 'Active',
    bio: 'Patrick Mahomes is widely considered one of the greatest quarterbacks in NFL history. His combination of arm talent, mobility, and clutch performance has produced 4 Super Bowl victories and 2 MVP awards in his first 8 seasons. His off-platform throws and ability to manufacture plays under pressure are unmatched in the modern era.',

    careerStats: [
      { label: 'Games',       value: 118 },
      { label: 'Pass Yards',  value: '33,821' },
      { label: 'Touchdowns',  value: 282 },
      { label: 'Interceptions', value: 74 },
      { label: 'Passer Rating', value: 105.2 },
      { label: 'Rush Yards',  value: '2,841' },
      { label: 'Super Bowls', value: 4 },
      { label: 'MVP Awards',  value: 2 },
    ],

    seasonStats: [
      { label: 'Pass Yards', value: '4,312', rank: 3 },
      { label: 'Touchdowns', value: 38,     rank: 1 },
      { label: 'Interceptions', value: 9,   rank: 8 },
      { label: 'Passer Rating', value: 112.4, rank: 1 },
      { label: 'Comp %',     value: '67.8%', rank: 4 },
      { label: 'YPA',        value: 8.4,    rank: 2 },
      { label: 'EPA/Play',   value: '+0.24', rank: 1 },
      { label: 'CPOE',       value: '+3.8%', rank: 1 },
    ],

    advancedStats: [
      { label: 'PFF Grade',         value: 92.4, percentile: 97, description: 'Pro Football Focus overall grade' },
      { label: 'EPA/Dropback',      value: 0.24, percentile: 99, description: 'Expected points added per dropback' },
      { label: 'CPOE',              value: '+3.8%', percentile: 98, description: 'Completion % over expectation' },
      { label: '4th Quarter Win %', value: '74%', percentile: 99, description: 'Win rate when tied/trailing in Q4' },
      { label: 'Air Yards/Att',     value: 9.2,  percentile: 87, description: 'Average air yards per attempt' },
      { label: 'Under Pressure',    value: '72.1%', percentile: 94, description: 'Accuracy when pressured' },
    ],

    gameLog: [
      { date: '2026-06-22', opponent: 'CIN', home: true,  result: 'W', stats: { Yds: 312, TDs: 3, INTs: 0, Rate: 118.4 }, performance: 'Elite' },
      { date: '2026-06-15', opponent: 'DEN', home: false, result: 'L', stats: { Yds: 224, TDs: 1, INTs: 2, Rate: 72.1  }, performance: 'Poor' },
      { date: '2026-06-08', opponent: 'LV',  home: true,  result: 'W', stats: { Yds: 388, TDs: 4, INTs: 0, Rate: 142.8 }, performance: 'Elite' },
      { date: '2026-06-01', opponent: 'BUF', home: false, result: 'W', stats: { Yds: 298, TDs: 2, INTs: 1, Rate: 98.2  }, performance: 'Good' },
      { date: '2026-05-25', opponent: 'CHI', home: true,  result: 'W', stats: { Yds: 341, TDs: 3, INTs: 0, Rate: 124.1 }, performance: 'Elite' },
    ],

    trendData: [
      { game: 'G1', primary: 98.2,  secondary: 2 },
      { game: 'G2', primary: 112.4, secondary: 3 },
      { game: 'G3', primary: 88.4,  secondary: 1 },
      { game: 'G4', primary: 72.1,  secondary: 1 },
      { game: 'G5', primary: 142.8, secondary: 4 },
      { game: 'G6', primary: 118.4, secondary: 3 },
      { game: 'G7', primary: 104.2, secondary: 2 },
      { game: 'G8', primary: 128.8, secondary: 4 },
    ],

    radarData: [
      { metric: 'Accuracy',  value: 94, avg: 72 },
      { metric: 'Arm Strength', value: 98, avg: 75 },
      { metric: 'Mobility',  value: 84, avg: 65 },
      { metric: 'Clutch',    value: 99, avg: 70 },
      { metric: 'IQ',        value: 97, avg: 78 },
      { metric: 'Durability', value: 88, avg: 82 },
    ],

    aiProjection: {
      nextGame: 'vs BUF (AFC Championship)',
      projectedStats: [
        { label: 'Pass Yards', value: '285–320' },
        { label: 'Touchdowns', value: '2–3' },
        { label: 'Interceptions', value: '0–1' },
        { label: 'Passer Rating', value: '102–118' },
        { label: 'Rush Yards', value: '25–45' },
      ],
      confidence: 79,
      factors: [
        'Historically dominant in home playoff games (14-2)',
        'Buffalo defense ranks 4th in sack rate — pressure risk',
        'Cold weather plays to BUF advantage historically',
        'Pacheco questionable; reduced run game increases pass volume',
      ],
      risks: [
        'Josh Allen\'s pressure disrupts timing',
        'Interception rate spikes in cold below-35°F games',
        'KC OL ranked 24th in pass protection',
      ],
    },

    comparisonNote: 'Compare with any NFL quarterback on the Compare Players page.',
  },

  'jt-0': {
    id: 'jt-0',
    name: 'Jayson Tatum',
    position: 'SF',
    number: '0',
    teamId: 'bos-celtics',
    teamName: 'Boston Celtics',
    teamColor: '#007A33',
    sport: 'NBA',
    age: 28,
    height: "6'8\"",
    weight: '210 lbs',
    birthplace: 'St. Louis, MO',
    college: 'Duke',
    draftYear: 2017,
    draftPick: '3rd overall',
    experience: 8,
    status: 'Active',
    bio: 'Jayson Tatum is the cornerstone of the Boston Celtics dynasty, delivering elite two-way play across both ends of the floor. A 5× All-Star and NBA Champion, Tatum has evolved from a dynamic scorer to a complete player with genuine DPOY-caliber moments. His shot creation off the dribble and ability to draw fouls make him unguardable in isolation.',

    careerStats: [
      { label: 'Games',   value: 556 },
      { label: 'PPG',     value: 24.1 },
      { label: 'RPG',     value: 7.8 },
      { label: 'APG',     value: 4.2 },
      { label: '3P%',     value: '.376' },
      { label: 'TS%',     value: '.588' },
      { label: 'All-Stars', value: 5 },
      { label: 'Rings',   value: 1 },
    ],

    seasonStats: [
      { label: 'PPG',     value: 28.4, rank: 3 },
      { label: 'RPG',     value: 8.2,  rank: 12 },
      { label: 'APG',     value: 4.8,  rank: 28 },
      { label: '3P%',     value: '.389', rank: 8 },
      { label: 'TS%',     value: '.618', rank: 5 },
      { label: 'USG%',    value: '31.2%', rank: 7 },
      { label: 'BPG',     value: 0.8,  rank: 24 },
      { label: '+/-',     value: '+9.4', rank: 2 },
    ],

    advancedStats: [
      { label: 'BPM',  value: '+7.8', percentile: 97, description: 'Box Plus/Minus — overall impact per 100 possessions' },
      { label: 'VORP', value: 8.4,   percentile: 96, description: 'Value Over Replacement Player' },
      { label: 'WS/48',value: '.202', percentile: 94, description: 'Win Shares per 48 minutes' },
      { label: 'PIPM', value: '+8.4', percentile: 95, description: 'Player Impact Plus/Minus' },
      { label: 'Clutch PPG', value: 31.2, percentile: 97, description: 'PPG in clutch situations (score ≤5, last 5 min)' },
      { label: 'Create FGA%', value: '58.4%', percentile: 89, description: 'Shot attempts created off own dribble' },
    ],

    gameLog: [
      { date: '2026-06-24', opponent: 'NYK', home: true,  result: 'W', stats: { Pts: 34, Reb: 9, Ast: 5, PM: '+18' }, performance: 'Elite' },
      { date: '2026-06-22', opponent: 'MIL', home: true,  result: 'W', stats: { Pts: 28, Reb: 7, Ast: 4, PM: '+14' }, performance: 'Good' },
      { date: '2026-06-20', opponent: 'PHI', home: false, result: 'W', stats: { Pts: 32, Reb: 10, Ast: 6, PM: '+8'  }, performance: 'Elite' },
      { date: '2026-06-18', opponent: 'MIA', home: true,  result: 'W', stats: { Pts: 22, Reb: 6, Ast: 3, PM: '+12' }, performance: 'Average' },
      { date: '2026-06-14', opponent: 'ORL', home: false, result: 'L', stats: { Pts: 18, Reb: 5, Ast: 2, PM: '-6'  }, performance: 'Poor' },
    ],

    trendData: [
      { game: 'G1', primary: 18, secondary: 5 },
      { game: 'G2', primary: 34, secondary: 9 },
      { game: 'G3', primary: 24, secondary: 7 },
      { game: 'G4', primary: 38, secondary: 11 },
      { game: 'G5', primary: 22, secondary: 6 },
      { game: 'G6', primary: 32, secondary: 10 },
      { game: 'G7', primary: 28, secondary: 7 },
      { game: 'G8', primary: 34, secondary: 9 },
    ],

    radarData: [
      { metric: 'Scoring',  value: 96, avg: 70 },
      { metric: 'Rebounding', value: 82, avg: 68 },
      { metric: 'Playmaking', value: 74, avg: 65 },
      { metric: 'Defense',  value: 88, avg: 72 },
      { metric: 'Clutch',   value: 97, avg: 68 },
      { metric: '3PT',      value: 84, avg: 64 },
    ],

    aiProjection: {
      nextGame: 'vs LAL (TD Garden)',
      projectedStats: [
        { label: 'Points',   value: '28–34' },
        { label: 'Rebounds', value: '7–10' },
        { label: 'Assists',  value: '4–6' },
        { label: '3-Pointers', value: '2–4' },
        { label: '+/-',      value: '+8 to +18' },
      ],
      confidence: 84,
      factors: [
        'Tatum averages 31.2 PPG vs LAL in last 5 meetings',
        'TD Garden: Boston 18-4 this season',
        'LAL perimeter defense ranks 22nd — exploitable matchup',
        'Back-to-back for Boston — minutes may be managed',
      ],
      risks: [
        'Back-to-back game (BOS played yesterday)',
        'LeBron elevation factor in marquee matchups',
        'Porzingis likely out — more defensive attention on Tatum',
      ],
    },

    comparisonNote: 'Compare with any NBA forward on the Compare Players page.',
  },
};

export const PLAYER_LIST = Object.values(PLAYER_DETAILS).map(p => ({
  id: p.id,
  name: p.name,
  position: p.position,
  number: p.number,
  teamId: p.teamId,
  teamName: p.teamName,
  teamColor: p.teamColor,
  sport: p.sport,
  age: p.age,
  status: p.status,
  primaryStat: p.seasonStats[0],
}));
