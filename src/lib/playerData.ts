/**
 * Player profiles for player detail and comparison pages.
 * Live data source: Sportradar / FantasyData API (set SPORTS_DATA_IO_API_KEY).
 */
import { NBA_PLAYERS } from './data/players/nba';
import { MLB_PLAYERS } from './data/players/mlb';
import { NHL_PLAYERS } from './data/players/nhl';
import { SOCCER_PLAYERS } from './data/players/soccer';
import { UFC_PLAYERS } from './data/players/ufc';
import { BOXING_PLAYERS } from './data/players/boxing';
import { TENNIS_PLAYERS } from './data/players/tennis';
import { F1_PLAYERS } from './data/players/f1';
import { CRICKET_PLAYERS } from './data/players/cricket';
import { ESPORTS_PLAYERS } from './data/players/esports';
import { NCAA_PLAYERS } from './data/players/ncaa';

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

// ── Compact builder ───────────────────────────────────────────────────────────
function mk(
  id: string, name: string, pos: string, num: string,
  teamId: string, team: string, color: string, sport: string,
  age: number, ht: string, wt: string, place: string,
  college: string, draft: number, pick: string, exp: number, bio: string,
  career:  [string, string | number][],
  season:  [string, string | number][],
  adv:     [string, string | number, number, string][],
  radar:   [string, number][],
  proj:    { game: string; stats: [string, string][]; conf: number; factors?: string[]; risks?: string[] },
): PlayerDetail {
  return {
    id, name, position: pos, number: num,
    teamId, teamName: team, teamColor: color, sport,
    age, height: ht, weight: wt, birthplace: place,
    college, draftYear: draft, draftPick: pick, experience: exp,
    status: 'Active', bio,
    careerStats:   career.map(([label, value]) => ({ label, value })),
    seasonStats:   season.map(([label, value]) => ({ label, value })),
    advancedStats: adv.map(([label, value, percentile, description]) => ({ label, value, percentile, description })),
    gameLog:   [],
    trendData: [],
    radarData: radar.map(([metric, value]) => ({ metric, value, avg: 65 })),
    aiProjection: {
      nextGame: proj.game,
      projectedStats: proj.stats.map(([label, value]) => ({ label, value })),
      confidence: proj.conf,
      factors: proj.factors ?? ['Elite performance level', 'Current form', 'Historical consistency'],
      risks:   proj.risks   ?? ['Opponent adjustments', 'Variance', 'Injury risk'],
    },
    comparisonNote: `${name} is an elite ${sport} competitor.`,
  };
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

  // ── NFL ───────────────────────────────────────────────────────────────────
  'ja-17': mk('ja-17','Josh Allen','QB','17','buf-bills','Buffalo Bills','#00338D','NFL',
    28,"6'5\"",'237 lbs','Firebaugh, CA','Wyoming',2018,'7th overall',8,
    'Josh Allen is a generational dual-threat quarterback who combines elite arm talent with historic rushing production. A perennial MVP candidate, Allen leads the Bills with both his arm and legs, posting some of the highest touchdown totals in league history while elevating Buffalo to annual Super Bowl contention.',
    [['Games',112],['Pass Yards','27,821'],['TDs',238],['Rush TDs',58],['INT',82],['Rush Yards','5,280'],['Super Bowls',0],['Pro Bowls',5]],
    [['Pass Yards','4,544'],['TDs',42],['Comp%','65.4%'],['Rush Yards',692],['Passer Rating',101.2],['EPA/Play','+0.21'],['INT',11],['Sacks',32]],
    [['PFF Grade',90.1,95,'Pro Football Focus overall grade'],['EPA/Dropback',0.21,97,'Expected points added per dropback'],['Rush YPA',7.4,88,'Rush yards per attempt'],['Pressure Win%','68.2%',92,'Success rate when pressured']],
    [['Accuracy',88],['Arm Strength',99],['Mobility',95],['Clutch',94],['IQ',88],['Durability',92]],
    {game:'vs KC',stats:[['Pass Yds','285-330'],['TDs','2-4'],['Rush Yds','40-70'],['Passer Rating','95-115']],conf:76}),

  'lj-8': mk('lj-8','Lamar Jackson','QB','8','bal-ravens','Baltimore Ravens','#241773','NFL',
    28,"6'2\"",'212 lbs','Pompano Beach, FL','Louisville',2018,'32nd overall',8,
    'Lamar Jackson is the most dynamic quarterback in NFL history, combining elite passing with all-time rushing production for his position. A two-time unanimous MVP, Jackson has revolutionized the quarterback position and turned the Ravens into a perennial powerhouse with his transcendent athletic gifts.',
    [['Games',108],['Pass Yards','21,834'],['Pass TDs',186],['Rush TDs',58],['Rush Yards','6,824'],['Passer Rating',99.1],['MVPs',2],['Pro Bowls',5]],
    [['Pass Yards','3,786'],['TDs',39],['Rush Yards','1,022'],['Passer Rating',99.2],['Comp%','66.2%'],['EPA/Play','+0.24'],['Rush TD',9],['QB Rating',74.8]],
    [['PFF Grade',91.4,96,'Pro Football Focus overall grade'],['Rush EPA',0.42,99,'EPA per rush attempt'],['QBR',74.8,98,'ESPN Total QBR'],['CPOE','+2.1%',95,'Completion % over expectation']],
    [['Accuracy',85],['Arm Strength',92],['Mobility',99],['Clutch',92],['IQ',90],['Durability',88]],
    {game:'vs HOU',stats:[['Pass Yds','260-300'],['Rush Yds','80-110'],['TDs','3-4'],['Passer Rating','105-120']],conf:81}),

  'jh-1': mk('jh-1','Jalen Hurts','QB','1','phi-eagles','Philadelphia Eagles','#004C54','NFL',
    27,"6'1\"",'222 lbs','Houston, TX','Alabama/Oklahoma',2020,'53rd overall',6,
    'Jalen Hurts is the engine of the Philadelphia Eagles offense, delivering elite production as both a passer and rusher. A Super Bowl champion and multiple Pro Bowl selection, Hurts has emerged as one of the most efficient QBs in the league and the undisputed leader of a perennial contender.',
    [['Games',74],['Pass Yards','16,814'],['Pass TDs',148],['Rush TDs',38],['Rush Yards','3,688'],['Passer Rating',96.8],['Super Bowls',1],['Pro Bowls',3]],
    [['Pass Yards','3,858'],['TDs',35],['Rush Yards',680],['Comp%','68.2%'],['Passer Rating',96.8],['EPA/Play','+0.18'],['INT',8],['Rush TD',14]],
    [['PFF Grade',88.2,91,'Pro Football Focus overall grade'],['Rush TD%','7.2%',99,'Rush TD rate'],['EPA/Play',0.18,94,'Expected points added per play'],['3rd Conv%','48.2%',88,'3rd down conversion rate']],
    [['Accuracy',86],['Arm Strength',89],['Mobility',93],['Clutch',90],['IQ',91],['Durability',86]],
    {game:'vs DAL',stats:[['Pass Yds','275-315'],['Rush Yds','50-80'],['TDs','2-4'],['Passer Rating','98-112']],conf:78}),

  'cl-88': mk('cl-88','CeeDee Lamb','WR','88','dal-cowboys','Dallas Cowboys','#041E42','NFL',
    26,"6'0\"",'198 lbs','Opelousas, LA','Oklahoma',2020,'17th overall',6,
    'CeeDee Lamb is the premier wide receiver in the NFL, combining elite route running with extraordinary separation and yards after catch. A unanimous All-Pro selection, Lamb is the focal point of the Cowboys offense and one of the most dangerous skill players in football regardless of defensive scheme.',
    [['Games',98],['Receptions',558],['Rec Yards','7,831'],['TDs',48],['Targets',752],['YPR',14.0],['Pro Bowls',3],['All-Pros',1]],
    [['Receptions',135],['Rec Yards','1,749'],['TDs',12],['Targets',181],['Yards/Rec',13.0],['YAC','5.2'],['Target Share','30.2%'],['Drop%','3.1%']],
    [['PFF Grade',92.4,97,'Pro Football Focus grade'],['Separation',2.4,94,'Average separation at catch point (ft)'],['YAC/R',5.2,88,'Yards after catch per reception'],['Target Share','30.2%',98,'Share of team targets']],
    [['Accuracy',92],['Arm Strength',95],['Mobility',94],['Clutch',91],['IQ',88],['Durability',85]],
    {game:'vs PHI',stats:[['Receptions','8-11'],['Yards','100-130'],['TDs','1-2'],['Targets','12-15']],conf:74}),

  'tk-87': mk('tk-87','Travis Kelce','TE','87','kc-chiefs','Kansas City Chiefs','#E31837','NFL',
    35,"6'5\"",'245 lbs','Westlake, OH','Cincinnati',2013,'63rd overall',13,
    'Travis Kelce is the greatest tight end in NFL history, redefining the position with his unprecedented pass-catching ability and football IQ. A 4× Super Bowl champion and 8× Pro Bowl selection, Kelce\'s career receiving records for a tight end are a testament to his sustained excellence over more than a decade.',
    [['Games',182],['Receptions','1,021'],['Rec Yards','11,721'],['TDs',72],['Targets','1,294'],['Yards/Rec',11.5],['Super Bowls',4],['Pro Bowls',8]],
    [['Receptions',93],['Rec Yards',984],['TDs',8],['Targets',121],['Yards/Rec',10.6],['YAC','5.4'],['Red Zone TDs',6],['EPA/Rec','+0.48']],
    [['PFF Grade',89.1,92,'Pro Football Focus grade'],['Route Win Rate','72.1%',96,'Route win rate vs coverage'],['YAC/R',5.4,90,'Yards after catch per rec'],['Red Zone TDs',6,88,'Red zone touchdowns']],
    [['Accuracy',88],['Arm Strength',82],['Mobility',80],['Clutch',96],['IQ',97],['Durability',90]],
    {game:'vs BUF',stats:[['Receptions','6-9'],['Yards','75-100'],['TDs','0-1'],['Targets','9-12']],conf:71}),

  // ── NBA ───────────────────────────────────────────────────────────────────
  'lbj-23': mk('lbj-23','LeBron James','SF','23','lal-lakers','Los Angeles Lakers','#552583','NBA',
    41,"6'9\"",'250 lbs','Akron, OH','None (HS Draft)',2003,'1st overall',22,
    'LeBron James is the most complete player in NBA history — a 4× champion, 4× Finals MVP, and 4× league MVP who has sustained elite performance across four decades. His combination of vision, athleticism, basketball IQ, and leadership is unmatched, and his longevity at this level remains one of sport\'s greatest achievements.',
    [['Games','1,482'],['PPG',27.2],['RPG',7.5],['APG',7.4],['Rings',4],['MVPs',4],['All-Star',20],['Scoring Title',1]],
    [['PPG',24.4],['RPG',6.8],['APG',8.2],['TS%','.624'],['+/-','+6.2'],['USG%','30.8%'],['BPM','+8.4'],['WS/48','.224']],
    [['BPM',8.4,98,'Box Plus/Minus per 100 possessions'],['VORP',7.2,94,'Value Over Replacement Player'],['WS/48',0.224,96,'Win Shares per 48 minutes'],['PER',26.8,94,'Player Efficiency Rating']],
    [['Scoring',92],['Rebounding',80],['Playmaking',96],['Defense',86],['Clutch',95],['3PT',72]],
    {game:'@ BOS',stats:[['Points','26-32'],['Rebounds','6-9'],['Assists','7-10'],['3PM','1-3']],conf:78}),

  'sc-30': mk('sc-30','Stephen Curry','PG','30','gsw-warriors','Golden State Warriors','#1D428A','NBA',
    37,"6'2\"",'185 lbs','Charlotte, NC','Davidson',2009,'7th overall',16,
    'Stephen Curry is the greatest shooter in basketball history, permanently transforming the sport with his gravity-defying range and off-the-dribble marksmanship. A 4× NBA champion, 2× MVP, and unanimous MVP selection in 2016, Curry\'s three-point shooting records are marks that may stand for generations.',
    [['Games',912],['PPG',24.8],['RPG',4.8],['APG',6.4],['3PM','3,747'],['3P%','.428'],['Championships',4],['MVPs',2]],
    [['PPG',26.4],['APG',5.8],['3P%','42.8%'],['TS%','.648'],['+/-','+8.4'],['3PAr','52.4%'],['PER',28.4],['WS/48','.228']],
    [['BPM',8.1,97,'Box Plus/Minus per 100 possessions'],['VORP',7.8,95,'Value Over Replacement Player'],['WS/48',0.228,97,'Win Shares per 48 minutes'],['3PAr','52.4%',99,'3-point attempt rate']],
    [['Scoring',97],['Rebounding',60],['Playmaking',88],['Defense',72],['Clutch',96],['3PT',99]],
    {game:'vs LAL',stats:[['Points','28-35'],['Assists','5-8'],['3PM','3-6'],['TS%','.64-.68']],conf:82}),

  'nj-15': mk('nj-15','Nikola Jokic','C','15','den-nuggets','Denver Nuggets','#0E2240','NBA',
    30,"6'11\"",'284 lbs','Sombor, Serbia','None',2014,'41st overall',11,
    'Nikola Jokic is the most statistically dominant player in NBA history, capturing an unprecedented three MVP awards with a playmaking and scoring versatility that has never been seen from the center position. His basketball IQ and passing vision at 7 feet make him virtually unguardable and uncoachable against.',
    [['Games',554],['PPG',22.8],['RPG',11.4],['APG',8.2],['MVPs',3],['Championships',1],['All-Star',7],['WS/48','.262']],
    [['PPG',28.2],['RPG',12.4],['APG',10.1],['TS%','.644'],['+/-','+12.4'],['BPM','+12.8'],['PER',32.4],['VORP',11.4]],
    [['BPM',12.8,99,'Box Plus/Minus — all-time great territory'],['VORP',11.4,99,'Value Over Replacement Player'],['WS/48',0.262,99,'Win Shares per 48 minutes'],['PER',32.4,99,'Player Efficiency Rating']],
    [['Scoring',94],['Rebounding',97],['Playmaking',97],['Defense',80],['Clutch',96],['3PT',74]],
    {game:'vs MIN',stats:[['Points','26-34'],['Rebounds','11-14'],['Assists','9-12'],['TS%','.63-.68']],conf:88}),

  'ga-34': mk('ga-34','Giannis Antetokounmpo','PF','34','mil-bucks','Milwaukee Bucks','#00471B','NBA',
    30,"6'11\"",'243 lbs','Athens, Greece','None',2013,'15th overall',12,
    'Giannis Antetokounmpo is the most physically dominant force in modern basketball, combining an unmatched wingspan with elite athleticism to score, rebound, and defend at an All-NBA level. A 2× MVP, NBA champion, and Finals MVP, the Greek Freak has transformed Milwaukee into a championship franchise.',
    [['Games',766],['PPG',22.2],['RPG',9.8],['APG',5.0],['Rings',1],['MVPs',2],['DPOYs',1],['All-Star',9]],
    [['PPG',30.4],['RPG',11.4],['APG',6.2],['TS%','.640'],['+/-','+10.8'],['BPG',1.1],['BPM','+10.8'],['FTA/FGA','70.4%']],
    [['BPM',10.8,99,'Box Plus/Minus per 100 possessions'],['VORP',9.8,98,'Value Over Replacement Player'],['WS/48',0.248,98,'Win Shares per 48 minutes'],['FTA/FGA','70.4%',99,'Free throw attempt rate']],
    [['Scoring',96],['Rebounding',94],['Playmaking',82],['Defense',94],['Clutch',90],['3PT',62]],
    {game:'vs BOS',stats:[['Points','28-36'],['Rebounds','10-13'],['Assists','5-8'],['FTM','8-12']],conf:84}),

  'ld-77': mk('ld-77','Luka Doncic','PG','77','dal-mavericks','Dallas Mavericks','#00538C','NBA',
    27,"6'7\"",'230 lbs','Ljubljana, Slovenia','None',2018,'3rd overall',7,
    'Luka Doncic is the most creative offensive player of his generation, combining elite shot creation, playmaking, and clutch performance into a package that has led Dallas to the NBA Finals in just his sixth season. His ability to score from anywhere with either hand at any time of the game makes him impossible to game-plan against.',
    [['Games',388],['PPG',28.4],['RPG',8.8],['APG',8.4],['ROY',1],['All-Star',5],['Triple-Doubles',106],['Finals Apps',1]],
    [['PPG',32.4],['RPG',9.2],['APG',9.8],['TS%','.608'],['+/-','+4.2'],['USG%','36.8%'],['BPM','+10.4'],['VORP',9.2]],
    [['BPM',10.4,99,'Box Plus/Minus per 100 possessions'],['VORP',9.2,97,'Value Over Replacement Player'],['WS/48',0.214,95,'Win Shares per 48 minutes'],['3PAr','44.2%',96,'3-point attempt rate']],
    [['Scoring',98],['Rebounding',84],['Playmaking',96],['Defense',72],['Clutch',97],['3PT',86]],
    {game:'vs GSW',stats:[['Points','30-38'],['Rebounds','8-12'],['Assists','8-12'],['3PM','2-5']],conf:85}),

  // ── MLB ───────────────────────────────────────────────────────────────────
  'so-17': mk('so-17','Shohei Ohtani','DH/P','17','lad-dodgers','Los Angeles Dodgers','#005A9C','MLB',
    31,"6'4\"",'210 lbs','Oshu, Japan','None',2018,'Int\'l FA',7,
    'Shohei Ohtani is the most unique player in baseball history — an elite starter and a Silver Slugger-caliber hitter simultaneously. His two-way brilliance has produced back-to-back MVP awards and a $700M contract, making him the face of the sport and the most valuable player of his era.',
    [['Career AVG','.277'],['Home Runs',222],['RBI',611],['SB',117],['ERA (P)','3.01'],['K/9 (P)',11.4],['MVPs',2],['Silver Sluggers',4]],
    [['AVG','.310'],['HR',44],['RBI',96],['OPS','1.036'],['WAR',8.6],['wRC+',178],['SLG','.654'],['BB%','13.2%']],
    [['wRC+',178,99,'Weighted runs created plus (100 = average)'],['wOBA','.416',99,'Weighted on-base average'],['Exit Velo',95.2,98,'Average exit velocity (mph)'],['fWAR',8.6,99,'FanGraphs Wins Above Replacement']],
    [['Hitting',97],['Power',99],['Speed',88],['Defense',72],['Consistency',90],['Clutch',93]],
    {game:'vs SF',stats:[['AVG','.295-.325'],['HR','0-1 (projected)'],['OPS','0.98-1.05'],['RBI','0-2']],conf:85}),

  'aj-99': mk('aj-99','Aaron Judge','RF','99','nyy-yankees','New York Yankees','#0C2340','MLB',
    33,"6'7\"",'282 lbs','Linden, CA','Fresno State',2013,'32nd overall',9,
    'Aaron Judge is the most imposing power hitter in baseball, combining a massive frame with elite bat speed to produce historically dominant home run totals. His 2022 season — 62 HRs, a unanimous MVP — is one of the greatest offensive seasons ever recorded, cementing his place as the face of the New York Yankees.',
    [['Career AVG','.284'],['Home Runs',311],['RBI',748],['OPS','.985'],['WAR',48.8],['MVPs',1],['Gold Gloves',3],['Silver Sluggers',4]],
    [['AVG','.293'],['HR',58],['RBI',130],['OPS','1.048'],['WAR',10.2],['wRC+',184],['ISO','.302'],['BB%','14.2%']],
    [['wRC+',184,99,'Weighted runs created plus'],['ISO','.302',99,'Isolated power (SLG - AVG)'],['BB%','14.2%',94,'Walk rate'],['fWAR',10.2,99,'FanGraphs Wins Above Replacement']],
    [['Hitting',90],['Power',99],['Speed',72],['Defense',88],['Consistency',86],['Clutch',91]],
    {game:'vs BOS',stats:[['AVG','.278-.308'],['HR','0-1 (projected)'],['OPS','0.95-1.08'],['RBI','0-2']],conf:82}),

  'js-22': mk('js-22','Juan Soto','RF','22','nyy-yankees','New York Yankees','#0C2340','MLB',
    26,"6'1\"",'224 lbs','Santo Domingo, DR','None',2018,'Int\'l FA',8,
    'Juan Soto is the most disciplined hitter of his generation, combining an elite eye at the plate with plus power to post on-base percentages that rival the legends of baseball. His signature "Soto Shuffle" and unwillingness to chase bad pitches make him one of the most feared hitters in the American League.',
    [['Career AVG','.291'],['Home Runs',182],['RBI',528],['OBP','.418'],['OPS','.975'],['BB%','18.4%'],['wRC+',158],['fWAR',34.2]],
    [['AVG','.288'],['HR',35],['RBI',109],['OPS','.987'],['BB%','18.4%'],['wRC+',162],['wOBA','.404'],['OBP','.419']],
    [['wRC+',162,99,'Weighted runs created plus'],['BB%','18.4%',99,'Walk rate — elite plate discipline'],['wOBA','.404',98,'Weighted on-base average'],['fWAR',7.4,97,'FanGraphs Wins Above Replacement']],
    [['Hitting',95],['Power',88],['Speed',74],['Defense',82],['Consistency',93],['Clutch',90]],
    {game:'vs TB',stats:[['AVG','.280-.310'],['HR','0-1 (projected)'],['OPS','0.94-1.02'],['BB','0-2']],conf:80}),

  'mb-50': mk('mb-50','Mookie Betts','RF','50','lad-dodgers','Los Angeles Dodgers','#005A9C','MLB',
    32,"5'9\"",'180 lbs','Nashville, TN','None',2011,'5th round',12,
    'Mookie Betts is the most complete player in the game — an elite hitter, a Gold Glove right fielder, and a threat on the bases. A 2× World Series champion and former AL MVP, Betts has been the best position player in baseball for nearly a decade, combining all five tools at the highest level.',
    [['Career AVG','.298'],['Home Runs',228],['RBI',782],['SB',166],['Gold Gloves',6],['MVPs',1],['Silver Sluggers',4],['Rings',2]],
    [['AVG','.302'],['HR',34],['RBI',94],['OPS','.969'],['SB',18],['wRC+',148],['UZR',12.4],['fWAR',8.1]],
    [['wRC+',148,97,'Weighted runs created plus'],['UZR',12.4,99,'Ultimate Zone Rating (defense)'],['BsR',8.4,92,'Baserunning runs above average'],['fWAR',8.1,96,'FanGraphs Wins Above Replacement']],
    [['Hitting',94],['Power',84],['Speed',88],['Defense',96],['Consistency',91],['Clutch',88]],
    {game:'vs SD',stats:[['AVG','.290-.315'],['HR','0-1 (projected)'],['OPS','0.93-1.00'],['SB','0-1 attempt']],conf:79}),

  // ── NHL ───────────────────────────────────────────────────────────────────
  'cm-97': mk('cm-97','Connor McDavid','C','97','edm-oilers','Edmonton Oilers','#FF4C00','NHL',
    28,"6'1\"",'193 lbs','Richmond Hill, ON','None',2015,'1st overall',10,
    'Connor McDavid is the greatest skater in hockey history, combining blinding speed with elite playmaking to shatter single-season and career records. A 3× Hart Trophy winner, McDavid has been the best player in the NHL every season since his rookie year, and his ability to change a game in a single shift is unmatched.',
    [['Games',620],['Goals',312],['Assists',584],['Points',896],['Hart Trophies',3],['Art Ross Trophies',5],['Seasons 100+ pts',8],['PPG Avg',1.45]],
    [['Goals',64],['Assists',89],['Points',153],['+/-','+38'],['PPG',1.87],['PP Points',42],['GF% (5v5)','58.4%'],['CF%','55.8%']],
    [['Points/60',4.02,99,'Points per 60 minutes at 5v5'],['GF%','58.4%',98,'Goals for % on ice'],['HDA%','54.2%',97,'High-danger attempt share'],['CF%','55.8%',97,'Corsi For %']],
    [['Shooting',91],['Skating',99],['Playmaking',99],['Defense',82],['Physical',76],['Leadership',94]],
    {game:'vs VGK',stats:[['Goals','0-1'],['Assists','1-3'],['Points','1-4'],['+/-','+1 to +3']],conf:88}),

  'nm-29': mk('nm-29','Nathan MacKinnon','C','29','col-avalanche','Colorado Avalanche','#6F263D','NHL',
    29,"6'0\"",'205 lbs','Cole Harbour, NS','None',2013,'1st overall',12,
    'Nathan MacKinnon is the most complete center in the NHL — an elite skater, scorer, and two-way force who leads Colorado to championships. His 2022 Stanley Cup run and back-to-back Hart Trophy campaigns have established him as the co-GOAT of his generation alongside McDavid.',
    [['Games',754],['Goals',358],['Assists',624],['Points',982],['Hart Trophies',2],['Stanley Cups',1],['Norris nominated',2],['PPG Avg',1.30]],
    [['Goals',58],['Assists',94],['Points',152],['+/-','+42'],['PPG',1.85],['PP Points',44],['GF% (5v5)','57.8%'],['CF%','56.2%']],
    [['Points/60',3.98,99,'Points per 60 at 5v5'],['GF%','57.8%',98,'Goals for % on ice'],['xG%','56.4%',97,'Expected goals for %'],['CF%','56.2%',97,'Corsi For %']],
    [['Shooting',94],['Skating',97],['Playmaking',97],['Defense',84],['Physical',80],['Leadership',92]],
    {game:'vs DAL',stats:[['Goals','0-2'],['Assists','1-3'],['Points','1-4'],['+/-','+1 to +3']],conf:87}),

  'am-34': mk('am-34','Auston Matthews','C','34','tor-maple-leafs','Toronto Maple Leafs','#00205B','NHL',
    28,"6'3\"",'208 lbs','San Jose, CA','None',2016,'1st overall',9,
    'Auston Matthews is the most prolific goal scorer of his generation, becoming just the third player in NHL history to score 70 goals in a season. His lethal wrist shot, elite hands, and powerful frame make him the most dangerous pure scorer in the modern game.',
    [['Games',522],['Goals',358],['Assists',336],['Points',694],['Hart Trophies',1],['Rocket Richard',4],['All-Stars',6],['PPG Avg',1.33]],
    [['Goals',69],['Assists',42],['Points',111],['+/-','+24'],['Sh%','18.4%'],['PP Goals',18],['SCA/60',6.8],['Goals/60',1.94]],
    [['Goals/60',1.94,99,'Goals per 60 minutes at 5v5'],['xGoals',59.4,99,'Expected goals scored'],['Sh%','18.4%',98,'Shooting percentage'],['SCA/60',6.8,95,'Scoring chances per 60']],
    [['Shooting',99],['Skating',90],['Playmaking',82],['Defense',80],['Physical',78],['Leadership',88]],
    {game:'vs BOS',stats:[['Goals','0-2'],['Assists','0-2'],['Points','1-3'],['Sh%','18-22%']],conf:84}),

  'dp-88': mk('dp-88','David Pastrnak','RW','88','bos-bruins','Boston Bruins','#FFB81C','NHL',
    28,"6'1\"",'194 lbs','Havirov, Czech Republic','None',2014,'25th overall',11,
    'David Pastrnak is the most dynamic right wing in the Eastern Conference, combining an elite shot with elite hands and playmaking ability. He burst onto the scene as one of the most dangerous goal scorers in the league and has developed into a complete offensive weapon and face of the Boston franchise.',
    [['Games',682],['Goals',412],['Assists',416],['Points',828],['All-Stars',6],['50-goal seasons',3],['PPG Avg',1.21],['PP Goals',82]],
    [['Goals',54],['Assists',58],['Points',112],['+/-','+22'],['PP Goals',18],['Sh%','16.2%'],['Goals/60',1.62],['GF%','55.4%']],
    [['Goals/60',1.62,97,'Goals per 60 minutes at 5v5'],['PP Goals/60',2.84,98,'Power play goals per 60'],['Sh%','16.2%',96,'Shooting percentage'],['GF%','55.4%',96,'Goals for % on ice']],
    [['Shooting',97],['Skating',88],['Playmaking',86],['Defense',74],['Physical',76],['Leadership',84]],
    {game:'vs TOR',stats:[['Goals','0-1'],['Assists','0-2'],['Points','1-2'],['PP Goals','0-1']],conf:78}),

  // ── Soccer ────────────────────────────────────────────────────────────────
  'eh-9': mk('eh-9','Erling Haaland','ST','9','man-city','Manchester City','#6CABDD','Soccer',
    25,"6'4\"",'194 lbs','Leeds, England','None',2019,'Int\'l',6,
    'Erling Haaland is the most lethal striker in world football, combining extraordinary movement, finishing, and aerial dominance with a relentless engine. His record-breaking debut season at Manchester City — 52 goals in all competitions — announced him as a generational talent who could become the all-time greatest.',
    [['Club Goals',194],['Appearances',222],['Goals/Game',0.87],['League Goals',148],['Champions League Goals',50],['Hat-tricks',14],['Awards','Bundesliga, EPL'],['Nationality','Norwegian']],
    [['Goals',36],['Assists',8],['Shots/90',4.2],['xG',30.4],['Goals/90',1.04],['Aerial Win%','58.4%'],['xG/Shot','.212'],['Big Chances',28]],
    [['Goals/90',1.04,99,'Goals per 90 minutes'],['xG/Shot',0.212,99,'Expected goals per shot'],['Aerial Win%','58.4%',92,'Aerial duel win rate'],['Press%','22.4%',85,'Pressing intensity']],
    [['Pace',94],['Technique',88],['Physical',96],['Mentality',90],['Defending',54],['Attacking',99]],
    {game:'vs Arsenal',stats:[['Goals','0-2'],['Shots','3-5'],['xG','0.8-1.4'],['Aerials','3-5']],conf:78}),

  'km-7': mk('km-7','Kylian Mbappé','ST/LW','7','real-madrid','Real Madrid','#FEBE10','Soccer',
    26,"5'11\"",'181 lbs','Bondy, France','None',2016,'Youth',9,
    'Kylian Mbappé is the fastest and most explosive attacker in the world, combining elite pace with technical quality and a natural goalscoring instinct. A World Cup winner at 19, Mbappé\'s move to Real Madrid has only elevated his game, and he is the undisputed heir to the Messi-Ronaldo throne.',
    [['Club Goals',316],['Appearances',428],['Int\'l Goals',48],['Dribbles/Season','180+'],['League Titles',6],['UCL Finals',2],['World Cup',1],['Nationality','French']],
    [['Goals',34],['Assists',12],['Dribbles/90',3.8],['xG',28.2],['Goals/90',0.92],['Prog Carries/90',4.8],['xA/90',0.28],['Sprint Speed','37.4 km/h']],
    [['Goals/90',0.92,98,'Goals per 90 minutes'],['Dribble%','68.4%',97,'Dribble success rate'],['Prog Carries/90',4.8,96,'Progressive carries per 90'],['xA/90',0.28,94,'Expected assists per 90']],
    [['Pace',99],['Technique',94],['Physical',88],['Mentality',92],['Defending',62],['Attacking',97]],
    {game:'vs Atletico',stats:[['Goals','0-2'],['Assists','0-1'],['Dribbles','3-5'],['xG','0.7-1.2']],conf:80}),

  'vj-7': mk('vj-7','Vinicius Jr.','LW','7','real-madrid','Real Madrid','#FEBE10','Soccer',
    25,"5'9\"",'176 lbs','São Gonçalo, Brazil','None',2017,'Youth',8,
    'Vinicius Jr. is the most electric dribbler in world football, combining extraordinary balance and close control with devastating pace to leave defenders helpless. A Ballon d\'Or frontrunner and Champions League winner, Vinícius has transformed from a raw talent into the world\'s best left winger.',
    [['Club Goals',128],['Appearances',288],['Assists',92],['Dribbles/Season','180+'],['UCL Titles',2],['Awards','La Liga Best Player'],['Nationality','Brazilian'],['Ballon d\'Or Finalist','2024']],
    [['Goals',28],['Assists',18],['Dribbles/90',4.2],['xA/90',0.34],['Prog Carries/90',5.4],['Dribble%','72.4%'],['xG','20.4'],['Sprint Speed','36.8 km/h']],
    [['Dribble%','72.4%',99,'Dribble success rate'],['Prog Carries/90',5.4,99,'Progressive carries per 90'],['xA/90',0.34,96,'Expected assists per 90'],['Press%','24.8%',92,'Pressing intensity']],
    [['Pace',98],['Technique',96],['Physical',84],['Mentality',88],['Defending',58],['Attacking',95]],
    {game:'vs Atletico',stats:[['Goals','0-1'],['Assists','0-2'],['Dribbles','4-6'],['xG','0.5-0.9']],conf:75}),

  'lm-10': mk('lm-10','Lionel Messi','RW','10','inter-miami','Inter Miami CF','#F7B5CD','Soccer',
    38,"5'7\"",'159 lbs','Rosario, Argentina','None',2001,'Youth',24,
    'Lionel Messi is the greatest footballer of all time — 8× Ballon d\'Or winner, World Cup champion, and record-holder for goals and assists across all of European football. His combination of dribbling, passing, vision, and finishing has never been equaled, and his final chapter at Inter Miami gives American fans a glimpse of pure genius.',
    [['Career Goals','848+'],['Career Apps','1,082'],['Ballons d\'Or',8],['UCL Titles',4],['La Liga Titles',10],['World Cups',1],['Int\'l Goals',109],['Nationality','Argentine']],
    [['Goals',26],['Assists',18],['xG',18.4],['Chances Created',124],['xA/90',0.42],['Prog Passes/90',8.4],['Goals+Assists/90',0.94],['Dribbles/90',3.2]],
    [['xA/90',0.42,99,'Expected assists per 90 minutes'],['Chances Created/90',4.8,99,'Chances created per 90'],['G+A/90',0.94,98,'Goals + assists per 90'],['Prog Passes/90',8.4,96,'Progressive passes per 90']],
    [['Pace',78],['Technique',99],['Physical',74],['Mentality',99],['Defending',62],['Attacking',99]],
    {game:'vs Charlotte',stats:[['Goals','0-1'],['Assists','0-2'],['Chances','4-6'],['xG','0.4-0.8']],conf:72}),

  'jb-5': mk('jb-5','Jude Bellingham','CM','5','real-madrid','Real Madrid','#FEBE10','Soccer',
    22,"6'1\"",'183 lbs','Stourbridge, England','None',2019,'Youth',6,
    'Jude Bellingham is the most complete midfielder of his generation — a box-to-box dynamo who can score, assist, press, and lead in equal measure. His debut season at Real Madrid — 23 goals in La Liga — shattered records for a central midfielder and established him as one of football\'s greatest young talents.',
    [['Club Goals',72],['Appearances',312],['Assists',62],['Pressures/90',18.4],['Aerial Win%','54.2%'],['La Liga Goals (24/25)',24],['Nationality','English'],['Age',22]],
    [['Goals',24],['Assists',14],['Pressures/90',18.4],['xG+xA/90',0.64],['Goal Cont./90',0.78],['Prog Carries/90',3.8],['Aerial Win%','54.2%'],['Press%','28.4%']],
    [['G+A Cont./90',0.78,96,'Goal contribution per 90 minutes'],['Press%','28.4%',95,'Pressing intensity rate'],['Prog Carries/90',3.8,92,'Progressive carries per 90'],['Aerial Win%','54.2%',88,'Aerial duel win rate']],
    [['Pace',88],['Technique',90],['Physical',92],['Mentality',94],['Defending',84],['Attacking',92]],
    {game:'vs Atletico',stats:[['Goals','0-1'],['Assists','0-2'],['Pressures','15-20'],['xG+xA','0.6-1.0']],conf:77}),

  // ── NCAA Football ─────────────────────────────────────────────────────────
  'qe-3': mk('qe-3','Quinn Ewers','QB','3','texas-longhorns','Texas Longhorns','#BF5700','NCAA Football',
    22,"6'2\"",'214 lbs','Southlake, TX','Texas',2022,'RS Freshman',3,
    'Quinn Ewers is the most talented passer in college football, a 5-star recruit whose NFL-ready arm talent has produced elite production at Texas. His touch on deep balls and ability to work through progressions under pressure have made him one of the top quarterback prospects in the 2025 NFL Draft class.',
    [['Career Games',38],['Pass Yards','9,204'],['TDs',72],['Comp%','66.2%'],['INT',22],['Wins',28],['Bowl Games',3],['Draft Projection','Top 15']],
    [['Pass Yards','3,588'],['TDs',32],['Comp%','67.4%'],['INT',8],['QBR',72.4],['EPA/Dropback','+0.18'],['CPOE','+2.4%'],['3rd Conv%','46.8%']],
    [['PFF Grade',88.4,94,'Pro Football Focus grade'],['EPA/Dropback',0.18,92,'Expected points added per dropback'],['CPOE','+2.4%',90,'Completion % over expectation'],['3rd Conv%','46.8%',88,'3rd down conversion rate']],
    [['Athleticism',84],['Arm Talent',92],['Mobility',76],['Football IQ',86],['Leadership',84],['Upside',92]],
    {game:'vs Oklahoma',stats:[['Pass Yds','280-320'],['TDs','2-4'],['Comp%','64-70%'],['QBR','68-78']],conf:72}),

  'dg-8': mk('dg-8','Dillon Gabriel','QB','8','oregon-ducks','Oregon Ducks','#154733','NCAA Football',
    25,"6'0\"",'190 lbs','Mililani, HI','Oregon',2022,'5th year senior',5,
    'Dillon Gabriel is the most prolific passer in college football history, having transferred across four programs while continuing to post elite numbers. His football intelligence, quick release, and ability to extend plays make him a Heisman-caliber player who has redefined durability and consistency at the college level.',
    [['Career Games',58],['Career Pass Yards','17,800+'],['Career TDs',147],['Comp%','66.8%'],['INT',36],['Career Wins',40],['Heisman Finalist',1],['Programs',4]],
    [['Pass Yards','3,988'],['TDs',38],['Comp%','68.4%'],['INT',5],['QBR',78.2],['EPA/Dropback','+0.22'],['TD/INT Ratio',7.6],['3rd Conv%','48.4%']],
    [['PFF Grade',90.2,96,'Pro Football Focus grade'],['EPA/Dropback',0.22,94,'Expected points added per dropback'],['CPOE','+3.2%',93,'Completion % over expectation'],['TD/INT Ratio',7.6,97,'Touchdown to interception ratio']],
    [['Athleticism',82],['Arm Talent',88],['Mobility',80],['Football IQ',92],['Leadership',90],['Upside',86]],
    {game:'vs Penn State',stats:[['Pass Yds','295-335'],['TDs','3-5'],['Comp%','66-72%'],['QBR','74-82']],conf:74}),

  'th-12': mk('th-12','Travis Hunter','WR/CB','12','colorado-buffaloes','Colorado Buffaloes','#CFB87C','NCAA Football',
    21,"6'1\"",'185 lbs','Suwanee, GA','Colorado',2023,'Sophomore',2,
    'Travis Hunter is the most unique player in college football — a legitimate two-way starter who plays elite receiver AND elite cornerback in the same game. His Heisman Trophy win validated what scouts already knew: Hunter is a once-in-a-generation athlete who will be a top-5 NFL pick and could play either side of the ball professionally.',
    [['Career Receptions',148],['Career Rec Yards','2,184'],['Rec TDs',18],['Career INTs (CB)',4],['Career PBUs',22],['Heisman Winner',1],['All-American',1],['Draft Projection','Top 5']],
    [['Receptions',96],['Rec Yards','1,258'],['Rec TDs',15],['Targets',122],['PBUs (CB)',14],['INTs (CB)',2],['Route Win Rate','76.2%'],['CB PFF Grade',88.2]],
    [['WR PFF Grade',91.4,97,'Wide receiver PFF grade'],['Route Win Rate','76.2%',96,'Route win rate vs coverage'],['CB Grade',88.2,94,'Cornerback PFF grade'],['Target Share','28.4%',98,'Share of team targets at WR']],
    [['Athleticism',96],['Arm Talent',82],['Mobility',94],['Football IQ',88],['Leadership',86],['Upside',99]],
    {game:'vs Kansas',stats:[['Receptions','8-12'],['Yards','110-150'],['TDs','1-2'],['PBUs (CB)','1-3']],conf:76}),

  // ── NCAA Basketball ───────────────────────────────────────────────────────
  'cf-2': mk('cf-2','Cooper Flagg','PF/SF','2','duke-blue-devils','Duke Blue Devils','#003087','NCAA Basketball',
    18,"6'9\"",'210 lbs','Newport, ME','Duke',2024,'Freshman',1,
    'Cooper Flagg is the consensus #1 NBA Draft prospect, a 6\'9" wing who can do everything on both ends of the floor. His combination of basketball IQ, defensive versatility, playmaking, and scoring has drawn comparisons to Kevin Durant and Paul George, making him the most anticipated college player since Zion Williamson.',
    [['Season Games',38],['PPG',19.2],['RPG',8.1],['APG',4.2],['BPG',1.6],['TS%','.578'],['BPM','+12.4'],['Draft Proj.','#1 Overall']],
    [['PPG',19.2],['RPG',8.1],['APG',4.2],['BPG',1.6],['TS%','.578'],['BPM','+12.4'],['WS',8.4],['ORtg',118.4]],
    [['BPM',12.4,99,'Box Plus/Minus — elite college territory'],['Win Shares',8.4,99,'Wins contributed'],['ORtg',118.4,97,'Offensive Rating'],['DRtg',94.2,98,'Defensive Rating']],
    [['Scoring',88],['Playmaking',82],['Defense',92],['Athleticism',94],['Upside',99],['Consistency',84]],
    {game:'vs Kentucky',stats:[['Points','20-26'],['Rebounds','7-10'],['Assists','3-6'],['Blocks','1-2']],conf:82}),

  'ad-4': mk('ad-4','AJ Dybantsa','SF','4','byu-cougars','BYU Cougars','#002E5D','NCAA Basketball',
    18,"6'9\"",'200 lbs','Brockton, MA','BYU',2024,'Freshman',1,
    'AJ Dybantsa is the most explosive scorer in college basketball, a wiry 6\'9" wing with an elite first step, a reliable mid-range game, and a developing three-point shot. Rated the #1 recruit in the 2024 class, Dybantsa\'s combination of scoring and athletic upside has made him the projected top pick in the 2025 NBA Draft.',
    [['Season Games',34],['PPG',20.8],['RPG',7.4],['APG',3.2],['FG%','.484'],['TS%','.586'],['Draft Proj.','#1-2'],['Big 12 All-Star',1]],
    [['PPG',20.8],['RPG',7.4],['APG',3.2],['TS%','.586'],['BPM','+10.8'],['ORtg',116.2],['Scoring Rank','Big 12 Top 5'],['Draft Stock','#1']],
    [['BPM',10.8,98,'Box Plus/Minus'],['ORtg',116.2,95,'Offensive Rating'],['Scoring Range','Full court',92,'Scores at all three levels'],['Draft Projection','#1-2',99,'Projected NBA Draft position']],
    [['Scoring',90],['Playmaking',78],['Defense',84],['Athleticism',96],['Upside',99],['Consistency',82]],
    {game:'vs Kansas',stats:[['Points','20-28'],['Rebounds','6-9'],['Assists','2-4'],['TS%','.57-.62']],conf:80}),

  'dh-2': mk('dh-2','Dylan Harper','PG','2','rutgers-scarlet-knights','Rutgers Scarlet Knights','#CC0033','NCAA Basketball',
    19,"6'6\"",'209 lbs','Teaneck, NJ','Rutgers',2024,'Freshman',1,
    'Dylan Harper is the premier playmaking guard in the 2025 NBA Draft class, a 6\'6" point guard with exceptional vision, creation ability, and toughness. The son of NBA player Ron Harper, Dylan combines elite ball-handling with a high basketball IQ that projects him as a franchise point guard at the next level.',
    [['Season Games',35],['PPG',22.4],['RPG',4.8],['APG',5.8],['TS%','.568'],['BPM','+8.4'],['Ast%','32.4%'],['Draft Proj.','Top 3']],
    [['PPG',22.4],['RPG',4.8],['APG',5.8],['TS%','.568'],['BPM','+8.4'],['Ast%','32.4%'],['Creation%','68.4%'],['Big Ten All-Star',1]],
    [['BPM',8.4,97,'Box Plus/Minus'],['Ast%','32.4%',96,'Assist rate'],['Creation Rate','68.4%',94,'Shots created off own dribble'],['Draft Projection','Top 3',99,'Projected NBA Draft position']],
    [['Scoring',88],['Playmaking',90],['Defense',80],['Athleticism',92],['Upside',96],['Consistency',80]],
    {game:'vs Purdue',stats:[['Points','20-28'],['Assists','5-8'],['Rebounds','4-6'],['3PM','1-3']],conf:78}),

  // ── UFC ───────────────────────────────────────────────────────────────────
  'jj-4': mk('jj-4','Jon Jones','HW','N/A','ufc-heavyweight','UFC Heavyweight','#D20A0A','UFC',
    37,"6'4\"",'240 lbs','Rochester, NY','None',2008,'UFC debut',16,
    'Jon Jones is widely regarded as the greatest MMA fighter of all time, dominating two weight classes and never losing a sanctioned bout. His unmatched combination of wrestling, strikes, reach, and ring IQ has produced 17 years of elite competition, and his move to heavyweight has only extended a legendary career.',
    [['Pro Fights',28],['Wins',27],['Losses',1],['KO/TKO',11],['Submissions',5],['Win Streak','8+'],['Title Defenses',11],['Weight Classes',2]],
    [['Current Streak','W8+'],['Last 5','5-0'],['Sig. Strikes/min',4.8],['Str. Def%','64.2%'],['TD%','42.8%'],['Sub Def%','88.4%'],['Finish Rate','59.3%'],['Age-Performance','Top 5 ever']],
    [['Sig. Strikes/min',4.8,94,'Significant strikes per minute'],['Str. Def%','64.2%',97,'Striking defense percentage'],['TD%','42.8%',92,'Takedown accuracy'],['Win Streak','8+',98,'Active win streak']],
    [['Striking',95],['Wrestling',90],['Submissions',86],['Defense',96],['Cardio',88],['Explosiveness',88]],
    {game:'vs Stipe',stats:[['Sig. Str/rd','45-65'],['TD Acc%','40-55%'],['KO Prob','35%'],['Decision Prob','55%']],conf:80}),

  'im-24': mk('im-24','Islam Makhachev','LW','N/A','ufc-lightweight','UFC Lightweight','#1A3A6E','UFC',
    33,"5'10\"",'155 lbs','Makhachkala, Russia','None',2015,'UFC debut',11,
    'Islam Makhachev is the most dominant lightweight champion in UFC history, combining Khabib Nurmagomedov\'s wrestling system with an improved striking game and elite submission arsenal. Undefeated in his last 15 fights, Makhachev\'s control and ability to neutralize any opponent makes him the most complete champion in MMA.',
    [['Pro Fights',27],['Wins',26],['Losses',1],['Submissions',8],['KO/TKO',4],['Win Streak',15],['Title Defenses',4],['P4P Ranking',1]],
    [['Current Streak','W15'],['Last 5','5-0'],['TD Acc%','58.4%'],['Sub Rate','30.8%'],['Str. Def%','66.8%'],['CF%','72.4%'],['Control Time/rd','2:48'],['Finish Rate','46.2%']],
    [['TD Acc%','58.4%',97,'Takedown accuracy'],['Sub Rate','30.8%',97,'Submission finish rate'],['Str. Def%','66.8%',99,'Striking defense'],['CF%','72.4%',96,'Control fighting %']],
    [['Striking',86],['Wrestling',96],['Submissions',98],['Defense',96],['Cardio',90],['Explosiveness',84]],
    {game:'vs Poirier',stats:[['Takedowns/rd','3-5'],['Sub Attempts/rd','1-2'],['Str. Def%','65-70%'],['KO Prob','15%']],conf:84}),

  'ap-8': mk('ap-8','Alex Pereira','LHW','N/A','ufc-light-heavyweight','UFC Light Heavyweight','#B8860B','UFC',
    37,"6'4\"",'205 lbs','Contagem, Brazil','None',2021,'UFC debut',5,
    'Alex Pereira is the hardest hitter in MMA history, a former kickboxing world champion who has transferred his knockout power to a 4-division title run across two combat sports organizations. His chin-checking left hook and devastating high kicks have produced some of the most spectacular finishes in UFC history.',
    [['MMA Fights',12],['Wins',10],['Losses',2],['KOs',7],['Title Defenses',4],['Weight Classes','2 (MMA)'],['K1 Titles',2],['KO%','58.3%']],
    [['Current Streak','W5'],['Last 5','5-0'],['KO%','58.3%'],['Sig. Str/min',6.2],['Str. Acc%','48.4%'],['Reaction Time','Elite'],['Title Defenses',4],['Finish Rate','70%']],
    [['KO Power','98th pct',98,'Knockout power rating'],['Sig. Str/min',6.2,98,'Significant strikes per minute'],['KO%','58.3%',95,'KO finish rate'],['Reaction Time','Elite',94,'Elite reaction speed']],
    [['Striking',99],['Wrestling',68],['Submissions',62],['Defense',84],['Cardio',86],['Explosiveness',96]],
    {game:'vs Rakic',stats:[['Sig. Str/rd','60-85'],['KO Prob','55%'],['TKO Prob','20%'],['Decision Prob','25%']],conf:79}),

  'it-37': mk('it-37','Ilia Topuria','FW','N/A','ufc-featherweight','UFC Featherweight','#2E8B57','UFC',
    28,"5'7\"",'145 lbs','Tbilisi, Georgia','None',2019,'UFC debut',7,
    'Ilia Topuria is the most exciting undefeated champion in the UFC, a fearless competitor whose devastating power belies his compact frame. His KO of Alexander Volkanovski sent shockwaves through combat sports, and his flawless record, combined with a massive personality and elite finishing ability, make him must-watch TV.',
    [['Pro Fights',16],['Wins',16],['Losses',0],['KOs',9],['Submissions',4],['Win Streak',16],['Title Defenses',2],['KO%','56.3%']],
    [['Current Streak','W16'],['Last 5','5-0'],['KO%','56.3%'],['Str. Acc%','52.8%'],['Sig. Str/min',5.8],['Power Punches','Top 5%'],['Sub Finishes',4],['Finish Rate','81.3%']],
    [['Str. Acc%','52.8%',96,'Striking accuracy'],['Sig. Str/min',5.8,94,'Significant strikes per minute'],['KO Power','Elite',96,'Punching power rating'],['Unbeaten','16-0',99,'Perfect professional record']],
    [['Striking',96],['Wrestling',82],['Submissions',84],['Defense',88],['Cardio',88],['Explosiveness',96]],
    {game:'vs Holloway',stats:[['Sig. Str/rd','55-80'],['KO Prob','48%'],['Sub Prob','15%'],['Decision Prob','37%']],conf:77}),

  // ── Boxing ────────────────────────────────────────────────────────────────
  'ca-174': mk('ca-174','Canelo Alvarez','Super Middleweight','N/A','boxing-canelo','Team Canelo','#C0392B','Boxing',
    35,"5'11\"",'168 lbs','Guadalajara, Mexico','None',2004,'Pro debut',21,
    'Saúl "Canelo" Álvarez is the greatest Mexican boxer of all time and the undisputed super middleweight champion. A four-division world champion who has unified every major title at 168 lbs, Canelo\'s masterful combination of power, movement, and ring IQ has allowed him to defeat every elite challenger he has faced.',
    [['Pro Fights',65],['Wins',61],['Losses',2],['Draws',2],['KOs',39],['World Titles','4 divisions'],['Def. Rank','#1 P4P'],['Nationality','Mexican']],
    [['Win Streak',4],['KO%','63.9%'],['Punch Acc%','52.4%'],['Counter Punch%','64.2%'],['Ring Gen.','Elite'],['Titles Unified',4],['PPV Buys','15M+'],['Revenue','$250M+']],
    [['Power Rating','94th pct',94,'Punching power percentile'],['Counter Punch%','64.2%',96,'Counter punching percentage'],['Punch Acc%','52.4%',94,'Punch accuracy'],['Ring Gen.','Elite',97,'Ring generalship rating']],
    [['Power',92],['Speed',88],['Defense',92],['Footwork',90],['Chin',95],['Ring IQ',96]],
    {game:'vs Benavidez',stats:[['Punch Acc%','50-56%'],['KO Prob','38%'],['Counter Punches/rd','12-18'],['Decision Prob','54%']],conf:78}),

  'ou-1': mk('ou-1','Oleksandr Usyk','Heavyweight','N/A','boxing-usyk','Usyk Team','#0057B7','Boxing',
    38,"6'3\"",'220 lbs','Simferopol, Ukraine','None',2013,'Pro debut',12,
    'Oleksandr Usyk is the undisputed heavyweight champion and a boxing technician without peer in the modern era. His unbeaten record, his cruiserweight clean sweep, and his two decisive victories over Anthony Joshua culminating in the 2024 win over Tyson Fury have cemented his place among the all-time greats.',
    [['Pro Fights',23],['Wins',23],['Losses',0],['KOs',14],['Weight Classes',2],['Undisputed Titles',2],['Olympic Gold',1],['Nationality','Ukrainian']],
    [['Win Streak',23],['KO%','60.9%'],['Punch Vol/rd',58.4],['Combination Rate','42.4%'],['Movement','99th pct'],['Titles','Undisputed HW'],['Joshua record','2-0'],['Fury record','1-0']],
    [['Box IQ','Elite',99,'Boxing intelligence rating'],['Punch Vol/rd',58.4,96,'Punches thrown per round'],['Combination Rate','42.4%',95,'Combination punch rate'],['Movement','99th pct',99,'Footwork and movement rating']],
    [['Power',82],['Speed',92],['Defense',94],['Footwork',98],['Chin',92],['Ring IQ',98]],
    {game:'vs Fury II',stats:[['Punch Vol/rd','55-65'],['KO Prob','22%'],['Points Prob','72%'],['Knockdown Prob','28%']],conf:82}),

  'ni-1': mk('ni-1','Naoya Inoue','Super Bantamweight','N/A','boxing-inoue','Inoue Boxing','#C0392B','Boxing',
    32,"5'5\"",'122 lbs','Zama, Japan','None',2012,'Pro debut',13,
    'Naoya "The Monster" Inoue is the most feared puncher in pound-for-pound boxing, owning a 89% KO rate and multiple undisputed titles across three weight classes. His combination of explosive power with elite technical skill has drawn comparisons to Manny Pacquiao and Naoya Inoue at his age.',
    [['Pro Fights',28],['Wins',28],['Losses',0],['KOs',25],['KO%','89.3%'],['Weight Classes',3],['Undisputed Titles',2],['P4P Ranking','Top 3']],
    [['Win Streak',28],['KO%','89.3%'],['Punch Acc%','56.2%'],['Str. Def%','72.4%'],['Power Rating','Elite'],['Title Defenses',8],['Japan Record','28-0'],['KO in 1st','6']],
    [['KO%','89.3%',99,'Knockout finish rate'],['Punch Acc%','56.2%',99,'Punch accuracy'],['Str. Def%','72.4%',99,'Defense rate'],['Power Rating','Elite',98,'Punching power assessment']],
    [['Power',98],['Speed',95],['Defense',90],['Footwork',88],['Chin',88],['Ring IQ',94]],
    {game:'vs Nery',stats:[['Punch Acc%','54-60%'],['KO Prob','68%'],['Points Prob','30%'],['Est. KO Round','4-6']],conf:82}),

  'gd-4': mk('gd-4','Gervonta Davis','Super Featherweight','N/A','boxing-davis','Davis Boxing','#1A1A2E','Boxing',
    31,"5'5\"",'130 lbs','Baltimore, MD','None',2013,'Pro debut',12,
    'Gervonta "Tank" Davis is the most devastating finisher in the sport, owning a 93% KO rate and multiple world titles across two weight classes. His explosive left hook to the body has become one of boxing\'s signature weapons, and his combination of elite power with defensive craftiness makes him a pay-per-view superstar.',
    [['Pro Fights',30],['Wins',30],['Losses',0],['KOs',28],['KO%','93.3%'],['Weight Classes',2],['World Titles',3],['PPV Appeal','Superstar']],
    [['Win Streak',30],['KO%','93.3%'],['Power Rating','96th pct'],['Punch Acc%','50.2%'],['Body KO%','32%'],['Title Defenses',6],['PPV Record','3.2M vs Garcia'],['Nationality','American']],
    [['KO%','93.3%',99,'Knockout finish rate'],['Power Rating','96th pct',96,'Punching power rating'],['Punch Acc%','50.2%',91,'Punch accuracy'],['Body KO Spec.','Expert',94,'Body punch KO specialist']],
    [['Power',96],['Speed',94],['Defense',84],['Footwork',84],['Chin',86],['Ring IQ',88]],
    {game:'vs Haney',stats:[['Punch Acc%','48-56%'],['Body Punches/rd','18-28%'],['KO Prob','62%'],['Decision Prob','35%']],conf:76}),

  // ── Tennis ────────────────────────────────────────────────────────────────
  'ca-3': mk('ca-3','Carlos Alcaraz','G','3','atp-tour','ATP Tour','#FF5733','Tennis',
    22,"6'1\"",'185 lbs','El Palmar, Spain','None',2018,'ATP debut',7,
    'Carlos Alcaraz is the most gifted all-court player of his generation, a 4× Grand Slam champion at just 22 who has already won on all three surfaces. His combination of aggressive baseline play, an elite drop shot, and supreme fitness has made him the face of the next generation and the co-world number one.',
    [['Career Titles',18],['Grand Slams',4],['Peak Ranking','#1'],['Win%','79.8%'],['Hard Win%','68%'],['Clay Win%','84%'],['Grass Win%','76%'],['Nationality','Spanish']],
    [['Season Titles',6],['W-L','62-12'],['3rd Set W%','84.2%'],['1st Serve Win%','74.2%'],['Return Win%','52.4%'],['Break Conv%','34.8%'],['ATP Elo',2180],['Ace/Match',8.4]],
    [['Return Win%','52.4%',96,'Return games won percentage'],['1st Serve Win%','74.2%',92,'First serve points won'],['Break Conv%','34.8%',96,'Break point conversion'],['ATP Elo',2180,98,'ATP Elo rating']],
    [['Serving',92],['Returning',94],['Baseline',97],['Net Play',90],['Mentality',94],['Movement',97]],
    {game:'vs Sinner (Slam SF)',stats:[['1st Serve%','64-70%'],['Winners','38-52'],['UE','18-26'],['Break Conv','3-5']],conf:82}),

  'js-1': mk('js-1','Jannik Sinner','G','1','atp-tour','ATP Tour','#228B22','Tennis',
    24,"6'2\"",'175 lbs','San Candido, Italy','None',2018,'ATP debut',7,
    'Jannik Sinner is the world number one and a 3× Grand Slam champion, a relentless baseline grinder whose elite return game and physical conditioning make him nearly impossible to outlast. His breakthrough in 2023-24 produced back-to-back Australian Open titles and established him as the sport\'s dominant force.',
    [['Career Titles',22],['Grand Slams',3],['Peak Ranking','#1'],['Win%','80.4%'],['Hard Win%','82%'],['Return Pts Won','40.2%'],['ATP Elo',2200],['Nationality','Italian']],
    [['Season Titles',7],['W-L','65-10'],['1st Serve Win%','76.4%'],['Return Win%','54.2%'],['Break Conv%','34.2%'],['ATP Elo',2200],['Hard Court Titles',5],['Ace/Match',9.2]],
    [['Return Win%','54.2%',98,'Return games won — elite'],['1st Serve Win%','76.4%',95,'First serve points won'],['ROS Pts%','40.2%',99,'Return of serve points won'],['ATP Elo',2200,99,'ATP Elo rating — world #1']],
    [['Serving',94],['Returning',97],['Baseline',96],['Net Play',84],['Mentality',96],['Movement',92]],
    {game:'vs Alcaraz (Slam SF)',stats:[['1st Serve%','66-72%'],['Winners','40-54'],['UE','16-24'],['Break Conv','3-6']],conf:84}),

  'nd-1': mk('nd-1','Novak Djokovic','G','1','atp-tour','ATP Tour','#1E3A8A','Tennis',
    38,"6'2\"",'170 lbs','Belgrade, Serbia','None',2003,'ATP debut',22,
    'Novak Djokovic is statistically the greatest tennis player of all time — 24 Grand Slam titles, 400+ weeks at world number one, and the Calendar Golden Slam. His otherworldly flexibility, mental fortitude, and return game redefined what was possible in tennis, and even at 38 he remains competitive at the highest level.',
    [['Career Titles',99],['Grand Slams',24],['Weeks at #1','400+'],['Peak Ranking','#1'],['Olympic Gold',1],['Cal. Year Slams',1],['Nationality','Serbian'],['Win%','83.1%']],
    [['Season Titles',3],['W-L','52-14'],['Slam Focus','Yes'],['1st Serve Win%','73.8%'],['Return Win%','50.4%'],['Break Conv%','30.2%'],['Career Slam W%','88.4%'],['Age-Adjusted','Top 3']],
    [['Return Win%','50.4%',93,'Return games won'],['1st Serve Win%','73.8%',90,'First serve points won'],['Slam Title%','30.2%',99,'Grand Slam title rate'],['ATP Elo',2120,96,'ATP Elo rating']],
    [['Serving',88],['Returning',97],['Baseline',96],['Net Play',86],['Mentality',99],['Movement',90]],
    {game:'vs Zverev (Slam QF)',stats:[['1st Serve%','62-68%'],['Winners','34-48'],['UE','14-22'],['Break Conv','3-5']],conf:76}),

  'as-1': mk('as-1','Aryna Sabalenka','G','1','wta-tour','WTA Tour','#DC143C','Tennis',
    27,"6'0\"",'163 lbs','Minsk, Belarus','None',2016,'WTA debut',9,
    'Aryna Sabalenka is the most powerful ball striker on the WTA Tour, a 3× Grand Slam champion whose aggressive baseline game and elite serve have made her the dominant force in women\'s tennis. Her mental transformation — from double-fault-prone to clutch performer — is one of sport\'s great evolution stories.',
    [['Career Titles',22],['Grand Slams',3],['Peak Ranking','#1'],['Win%','76.2%'],['Hard Win%','82%'],['Serve+1 Win%','64.2%'],['Nationality','Belarusian'],['ATP Elo',2120]],
    [['Season Titles',5],['W-L','58-14'],['1st Serve Win%','72.4%'],['Break Conv%','30.4%'],['Ace/Match',5.8],['Winning Streak','15'],['Hard Court W%','82%'],['Slam W%','78.4%']],
    [['1st Serve Win%','72.4%',97,'First serve points won'],['Baseline Power','98th pct',98,'Baseline power rating'],['Break Conv%','30.4%',94,'Break point conversion'],['WTA Elo',2120,96,'WTA Elo rating']],
    [['Serving',94],['Returning',88],['Baseline',98],['Net Play',80],['Mentality',90],['Movement',86]],
    {game:'vs Swiatek (Slam Final)',stats:[['1st Serve%','62-68%'],['Winners','36-50'],['Aces','4-8'],['UE','18-26']],conf:80}),

  'is-2': mk('is-2','Iga Swiatek','G','2','wta-tour','WTA Tour','#FF69B4','Tennis',
    24,"5'9\"",'145 lbs','Warsaw, Poland','None',2016,'WTA debut',8,
    'Iga Swiatek is the most dominant clay court player since Rafael Nadal, with 4 consecutive Roland Garros titles and an 18-month stretch as world number one that included one of the longest winning streaks in modern tennis. Her heavy topspin, elite return game, and mental strength make her the defining player of her era.',
    [['Career Titles',24],['Grand Slams',5],['Peak Ranking','#1'],['Win%','78.4%'],['Clay Win%','92.4%'],['Roland Garros',4],['Nationality','Polish'],['WTA Elo',2140]],
    [['Season Titles',4],['W-L','60-16'],['Clay W%','92.4%'],['Return Win%','52.8%'],['Break Conv%','34.2%'],['WTA Elo',2140],['RG Winning Streak','49 matches'],['Topspin RPM','3,200+']],
    [['Clay Win%','92.4%',99,'Clay court win percentage'],['Return Win%','52.8%',97,'Return games won percentage'],['Break Conv%','34.2%',96,'Break point conversion'],['Mental Fortitude','99th pct',99,'Clutch performance rating']],
    [['Serving',84],['Returning',96],['Baseline',96],['Net Play',78],['Mentality',98],['Movement',94]],
    {game:'vs Sabalenka (Slam Final)',stats:[['Clay 1st Serve%','60-66%'],['Winners','36-50'],['Break Conv','3-5'],['UE','14-22']],conf:82}),

  // ── Formula 1 ─────────────────────────────────────────────────────────────
  'mv-1': mk('mv-1','Max Verstappen','Driver','1','red-bull','Red Bull Racing','#3671C6','Formula 1',
    27,'N/A','N/A','Hasselt, Belgium','None',2015,'F1 debut',10,
    'Max Verstappen is the most dominant Formula 1 driver of his era, winning four consecutive World Championships with a combination of blistering pace, exceptional racecraft, and flawless car management. His record-breaking 2023 season — 19 wins from 22 races — is the greatest single-season performance in F1 history.',
    [['F1 Wins',63],['Poles',40],['Championships',4],['Podiums',102],['Fastest Laps',32],['2023 Wins',19],['Constructor Titles (RB)',4],['Nationality','Dutch/Belgian']],
    [['Season Wins',9],['Poles',14],['Championship Points',440],['Fastest Laps',8],['Win%','54.2%'],['Quali Avg','P1.8'],['Race Pace','+0.4s'],['DNF',2]],
    [['Quali Pace','+0.4s advantage',99,'Qualifying pace vs field'],['Race Win%','54.2%',99,'Race win percentage'],['Overtakes/Race',4.2,94,'Average overtakes per race'],['Tire Deg','Best in field',97,'Tire degradation management']],
    [['Race Pace',99],['Racecraft',96],['Wet Weather',98],['Overtaking',92],['Tire Mgmt',96],['Qualifying',99]],
    {game:'Next Grand Prix',stats:[['Quali Position','P1-P2 (72%)'],['Race Position','P1-P2 (68%)'],['Fastest Lap','Likely attempt'],['DNF Risk','4%']],conf:86}),

  'lh-44': mk('lh-44','Lewis Hamilton','Driver','44','ferrari','Ferrari','#DC0000','Formula 1',
    41,'N/A','N/A','Stevenage, England','None',2007,'F1 debut',18,
    'Lewis Hamilton is the most decorated Formula 1 driver in history — 7 World Championships, 104 race wins, and 104 pole positions, all records. His 2025 move to Ferrari was the blockbuster signing of the decade, and Hamilton\'s extraordinary wet-weather skills and racecraft continue to make him competitive in his late 30s.',
    [['F1 Wins',104],['Poles',104],['Championships',7],['Podiums',201],['Career Points',4726],['Wet Wins',12],['Ferrari (2025)','Ongoing'],['Nationality','British']],
    [['Season Wins',2],['Podiums',8],['Championship Points',282],['Wet Win%','64.2%'],['Quali vs Leclerc','-0.2s avg'],['Overtakes/Race',3.8],['Strategy Reads','+2 pos avg'],['Age Handicap','-3%']],
    [['Wet Win%','64.2%',99,'Wet race win percentage — all-time best'],['Quali Pace','-0.2s avg',96,'Qualifying pace vs Verstappen'],['Career Longevity','18 seasons',99,'Elite-level longevity'],['Overtakes/Race',3.8,91,'Average overtakes per race']],
    [['Race Pace',90],['Racecraft',98],['Wet Weather',99],['Overtaking',94],['Tire Mgmt',90],['Qualifying',94]],
    {game:'Next Grand Prix',stats:[['Quali Position','P3-P6 (54%)'],['Race Position','P2-P5 (54%)'],['Wet Bonus','+18% win probability'],['Fastest Lap','Unlikely']],conf:78}),

  'cl-16': mk('cl-16','Charles Leclerc','Driver','16','ferrari','Ferrari','#DC0000','Formula 1',
    27,'N/A','N/A','Monte Carlo, Monaco','None',2018,'F1 debut',7,
    'Charles Leclerc is the fastest qualifier on the Formula 1 grid and Ferrari\'s most talented driver in a generation. A Monaco native who inexplicably waited until 2024 to win his home race, Leclerc\'s natural speed and street circuit mastery have made him the best hope for Ferrari\'s first title since 2007.',
    [['F1 Wins',12],['Poles',26],['Championships',0],['Best Season','P2 (2024)'],['Circuit Records','Multiple'],['Monaco Wins',1],['Nationality','Monegasque'],['Ferrari Seasons',7]],
    [['Season Wins',4],['Poles',8],['Championship Points',310],['Street Circuit W%','48.4%'],['Quali Pace','-0.1s vs MAX'],['Monaco Specialist','Yes'],['Race Improvement','+12%'],['DNF Rate','6%']],
    [['Quali Lap Records','Multiple',97,'Circuit lap records in qualifying'],['Street Circuit W%','48.4%',98,'Street circuit win rate'],['Quali Pace','-0.1s below MAX',97,'Close to Verstappen in qualifying'],['Race Pace Improv.','+12%',94,'Season-over-season race pace improvement']],
    [['Race Pace',90],['Racecraft',86],['Wet Weather',84],['Overtaking',84],['Tire Mgmt',84],['Qualifying',96]],
    {game:'Next Grand Prix',stats:[['Quali Position','P1-P3 (58%)'],['Race Position','P2-P5 (58%)'],['Street Circuit Bonus','+22%'],['DNF Risk','6%']],conf:79}),

  'ln-4': mk('ln-4','Lando Norris','Driver','4','mclaren','McLaren','#FF8000','Formula 1',
    25,'N/A','N/A','Bristol, England','None',2019,'F1 debut',6,
    'Lando Norris has transformed from a fan favorite to a genuine World Championship contender, winning his first race in 2023 and pushing Verstappen all the way in 2024. His fearless overtaking, elite qualifying pace, and ability to extract maximum performance from the McLaren have made him the sport\'s most exciting young talent.',
    [['F1 Wins',6],['Poles',8],['Best Season','P2 (2024)'],['WDC Contender','2024'],['Overtake Success','78.4%'],['Fan Votes','#1 3 years'],['Nationality','British'],['McLaren Seasons',6]],
    [['Season Wins',6],['Poles',6],['Championship Points',374],['Overtake Success%','78.4%'],['Car Extraction','+4.2%'],['Quali Consistency','99th pct'],['Tire Management','Top 5'],['Team Radio Wins','Legendary']],
    [['Quali Consistency','99th pct',99,'Qualifying lap consistency'],['Overtake Success%','78.4%',96,'Overtake attempt success rate'],['Car Extraction','+4.2%',96,'Performance above car\'s expected pace'],['Racecraft Improvement','98th pct',98,'Year-over-year racecraft improvement']],
    [['Race Pace',90],['Racecraft',88],['Wet Weather',86],['Overtaking',86],['Tire Mgmt',88],['Qualifying',92]],
    {game:'Next Grand Prix',stats:[['Quali Position','P2-P4 (58%)'],['Race Position','P1-P4 (62%)'],['WDC Contender Prob','42%'],['DNF Risk','5%']],conf:80}),

  // ── Cricket ───────────────────────────────────────────────────────────────
  'vk-18': mk('vk-18','Virat Kohli','Batter','18','india-cricket','India Cricket','#003366','Cricket',
    36,'N/A','N/A','Delhi, India','None',2008,'Int\'l debut',18,
    'Virat Kohli is the greatest run-chaser and one of the most consistent batters in cricket history, with 80+ international centuries and a world record for successful chases. His ferocious intensity, immaculate technique, and insatiable hunger for runs have produced a body of work that challenges the legends of any era.',
    [['Int\'l Runs','27,064+'],['Centuries',80],['Average',49.6],['Formats',3],['T20 WC Wins',1],['Chases Won','World record'],['Nationality','Indian'],['Team','India / RCB']],
    [['Runs (all formats)','1,848'],['Average',52.8],['Centuries',6],['SR (ODI/T20)',87.4],['Fifties',14],['Chase Avg',68.4],['Away Avg',48.2],['Consistency%','74.2%']],
    [['Chase Success Rate','78.4%',99,'Success rate as chase batter'],['Pressure Innings','Elite',96,'Performance in high-pressure innings'],['Consistency Rating','96th pct',96,'Scoring consistency across conditions'],['Away Average',48.2,96,'Batting average in away conditions']],
    [['Batting',97],['Bowling',32],['Fielding',88],['Consistency',96],['Big Match',99],['Leadership',94]],
    {game:'vs Australia (Test)',stats:[['Runs','42-75'],['SR','84-92'],['100 Probability','18%'],['50+ Probability','52%']],conf:80}),

  'jr-66': mk('jr-66','Joe Root','Batter','66','england-cricket','England Cricket','#003366','Cricket',
    34,'N/A','N/A','Sheffield, England','None',2012,'Int\'l debut',13,
    'Joe Root is the greatest Test match batsman of his generation and England\'s all-time leading run-scorer. His extraordinary consistency, technical mastery against both pace and spin, and ability to score heavily in all conditions have produced over 13,500 Test runs and counting, establishing him as a certain future Hall of Famer.',
    [['Test Runs','13,500+'],['Test Centuries',35],['Test Average',50.1],['Tests Played',152],['WC Wins',1],['Ranking','#1 Test batter'],['Nationality','English'],['Team','England / Yorkshire']],
    [['Test Runs',1488],['Test Average',52.4],['Centuries',5],['SR',57.8],['Fifties',8],['vs Quality Pace Avg',48.4],['Spin Avg',54.2],['Away Avg',49.8]],
    [['Test Average',50.1,97,'Career Test batting average'],['Consecutive 50+ Innings','96th pct',96,'Consistency of scoring 50+'],['vs Quality Pace',48.4,94,'Average vs elite fast bowling'],['Away Average',49.8,95,'Average in away conditions']],
    [['Batting',96],['Bowling',62],['Fielding',90],['Consistency',94],['Big Match',92],['Leadership',88]],
    {game:'vs India (Test)',stats:[['Runs','38-72'],['SR','54-62'],['100 Probability','16%'],['50+ Probability','48%']],conf:78}),

  'ss-49': mk('ss-49','Steve Smith','Batter','49','australia-cricket','Australia Cricket','#FFCD00','Cricket',
    36,'N/A','N/A','Kogarah, Australia','None',2010,'Int\'l debut',15,
    'Steve Smith is the most technically prolific Test batter of the modern era, with a career average of 58.9 that ranks third all-time. His unorthodox technique, extraordinary concentration, and particular mastery against spin have produced centuries in virtually every major cricket nation, establishing him as the benchmark batter of his generation.',
    [['Test Runs','10,000+'],['Test Centuries',33],['Test Average',58.9],['World Cups',1],['No. 1 Ranking','Multiple years'],['vs Spin Avg',67.4],['Nationality','Australian'],['Team','Australia / NSW']],
    [['Test Runs',1124],['Test Average',56.2],['Centuries',4],['vs Spin Avg',67.4],['vs Pace Avg',52.8],['Fifties',6],['Away Avg',54.2],['Consistency%','72.4%']],
    [['Career Average',58.9,99,'Career Test batting average — 3rd all-time'],['vs Spin Average',67.4,99,'Average vs spin bowling'],['Unorthodox Success','99th pct',99,'Non-traditional technique effectiveness'],['Concentration Span','Elite',96,'Ability to bat long innings']],
    [['Batting',98],['Bowling',42],['Fielding',82],['Consistency',94],['Big Match',95],['Leadership',88]],
    {game:'vs England (Test)',stats:[['Runs','45-82'],['SR','58-66'],['100 Probability','22%'],['50+ Probability','56%']],conf:81}),

  'bs-55': mk('bs-55','Ben Stokes','All-Rounder','55','england-cricket','England Cricket','#003366','Cricket',
    34,'N/A','N/A','Christchurch, New Zealand','None',2011,'Int\'l debut',14,
    'Ben Stokes is the greatest match-winner in Test cricket, an all-rounder whose extraordinary clutch performances — Headingley 2019, IPL 2016, multiple rescues — have redefined what is possible in pressure situations. As England captain he has transformed Test cricket itself with his Bazball philosophy, turning a struggling team into champions.',
    [['Test Runs','7,500+'],['Test Wickets',196],['Centuries',13],['Man of Match',42],['Ashes Wins',1],['World Cup Wins',1],['England Captain','2022-'],['Nationality','British']],
    [['Test Runs',924],['Test Avg',38.5],['Wickets',24],['Bowl Avg',30.2],['All-Round Index','#1 world'],['Clutch Innings',8],['Bazball Win%','78.4%'],['Match Win Contrib','99th pct']],
    [['Match Win Contrib','99th pct',99,'Contribution to match victories'],['Bowling Average',30.2,92,'Career bowling average'],['Clutch Innings','99th pct',99,'Performance in decisive moments'],['Bazball Architecture','Unique',96,'Creator/executor of Bazball philosophy']],
    [['Batting',84],['Bowling',86],['Fielding',92],['Consistency',82],['Big Match',99],['Leadership',98]],
    {game:'vs Australia (Ashes)',stats:[['Runs','32-64 OR wickets 2-4'],['Match Impact','High'],['KW Type','All-round'],['Win Contrib Prob','62%']],conf:76}),

  'jb-93': mk('jb-93','Jasprit Bumrah','Bowler','93','india-cricket','India Cricket','#003366','Cricket',
    31,'N/A','N/A','Ahmedabad, India','None',2016,'Int\'l debut',9,
    'Jasprit Bumrah is the #1 ranked bowler across all formats and the most valuable player in world cricket outside of batting superstars. His uniquely unorthodox action, ability to swing old and new ball, devastating yorkers, and elite death bowling have produced averages and economy rates that no comparable bowler has matched.',
    [['Int\'l Wickets','470+'],['Test Average',19.8],['ODI Average',24.2],['Formats',3],['Ranking','#1 Test Bowler'],['Death Economy',7.2],['Yorkers/Match','8.4'],['Nationality','Indian']],
    [['Wickets (all formats)',68],['Average',18.4],['Economy',4.1],['SR',22.8],['5-Wicket Hauls',8],['Death Economy',7.2],['Bounce Rate','Elite'],['Swing Both Ways','Yes']],
    [['Test Average',19.8,99,'Career Test bowling average'],['Death Economy',7.2,96,'Death overs economy rate'],['Swing Mastery','Both ways',99,'Ability to swing both in and out'],['Bounce Rate','Elite',96,'Use of effective short ball']],
    [['Batting',18],['Bowling',99],['Fielding',80],['Consistency',94],['Big Match',98],['Leadership',78]],
    {game:'vs England (Test)',stats:[['Wickets','2-4'],['Economy','3.8-4.6'],['Maiden Overs','2-4'],['5-for Prob','12%']],conf:82}),

  // ── Esports ───────────────────────────────────────────────────────────────
  'faker-mid': mk('faker-mid','Faker','Mid','N/A','t1-esports','T1','#C8AA6E','Esports',
    29,'N/A','N/A','Seoul, South Korea','None',2013,'Pro debut',12,
    'Faker (Lee Sang-hyeok) is the greatest esports player of all time — 4× World Champion, 3× MSI winner, and the face of League of Legends for over a decade. His technical mastery, game sense, and consistent excellence across multiple metas have made him the undisputed GOAT of competitive gaming.',
    [['World Championships',4],['MSI Titles',3],['LCK Titles',12],['Career Wins',1200],['Signature Champs','Orianna, Azir, LeBlanc'],['Peak KDA',9.4],['Pro Career','2013-present'],['Nationality','Korean']],
    [['KDA',6.8],['CS@15',178],['Kill Participation','72.4%'],['Vision Score',28.4],['Damage Share','30.2%'],['Win Rate','68.4%'],['Impact Rating',9.4],['Champ Pool',12]],
    [['KDA',6.8,99,'Kill/Death/Assist ratio'],['Impact Rating',9.4,99,'Overall game impact rating'],['Win Rate','68.4%',99,'Career win rate'],['Meta Adapt.','99th pct',99,'Adaptation across meta changes']],
    [['Aim',88],['Game Sense',99],['Team Play',94],['Mechanics',99],['Adaptability',98],['Mental Game',99]],
    {game:'vs Gen.G (Worlds)',stats:[['KDA Target','7.0+'],['CS Advantage','+20 at 15'],['Champ Pool','12+ champs'],['Win Probability','62%']],conf:86}),

  'zywo-26': mk('zywo-26','ZywOo','Rifler','26','vitality-esports','Team Vitality','#FFDD00','Esports',
    23,'N/A','N/A','Paris, France','None',2018,'Pro debut',7,
    'Mathieu "ZywOo" Herbaut is the best Counter-Strike player in the world, having claimed the HLTV world #1 ranking four consecutive years. His extraordinary aim, intelligent positioning, and ability to carry his team in crucial rounds make him the most impactful player in CS2 and the frontrunner for GOAT status in the game.',
    [['HLTV #1 Years',4],['Rating 2.0 Career',1.29],['Majors Won',2],['ADR Career',84.2],['Impact Career',1.48],['Clutch Rate','52.4%'],['Team Vitality','2019-present'],['Nationality','French']],
    [['Rating 2.0',1.28],['ADR',84.2],['KAST%','74.8%'],['Impact',1.48],['Headshot%','44.2%'],['Clutch%','52.4%'],['Opening Kills','3.8/map'],['Win Rate','64.8%']],
    [['Rating 2.0',1.28,99,'HLTV Rating 2.0 — best metric in CS'],['ADR',84.2,97,'Average damage per round'],['Impact',1.48,99,'Round impact rating'],['Clutch Rate','52.4%',98,'Clutch round win rate (1vX)']],
    [['Aim',99],['Game Sense',96],['Team Play',88],['Mechanics',97],['Adaptability',94],['Mental Game',94]],
    {game:'vs NAVI (Major)',stats:[['Rating','1.2-1.4'],['ADR','80-90'],['Clutch Wins','1-2'],['KAST%','72-78%']],conf:84}),

  's1mple-navi': mk('s1mple-navi','s1mple','Rifler/AWPer','N/A','natus-vincere','Natus Vincere','#F5A800','Esports',
    28,'N/A','N/A','Kyiv, Ukraine','None',2014,'Pro debut',11,
    'Oleksandr "s1mple" Kostyliev is considered the greatest Counter-Strike player of all time — four consecutive HLTV world #1 rankings, a 1.38 peak Rating 2.0 that remains the all-time record, and the most awe-inspiring AWP skills ever witnessed at the professional level. His clutch gene and competitive fire are without equal.',
    [['HLTV #1 Years',4],['Peak Rating',1.38],['Majors Won',1],['ADR Career',87.2],['AWP Kills%','42.4%'],['Clutch Rate','56.2%'],['All-time Rating Record','1.38'],['Nationality','Ukrainian']],
    [['Rating 2.0',1.25],['ADR',86.4],['KAST%','73.2%'],['AWP Kill%','42.4%'],['Clutch%','56.2%'],['Opening Duels','4.2/map'],['Impact',1.42],['Win Rate','62.4%']],
    [['Peak Rating',1.38,99,'All-time record Rating 2.0'],['ADR',87.2,99,'Average damage per round — career best'],['AWP Kill%','42.4%',99,'Percentage of kills with AWP'],['Clutch Rate','56.2%',99,'1vX clutch win rate']],
    [['Aim',99],['Game Sense',97],['Team Play',84],['Mechanics',98],['Adaptability',92],['Mental Game',96]],
    {game:'vs Vitality (Major)',stats:[['Rating','1.18-1.36'],['ADR','82-92'],['AWP Kills/map','8-14'],['KAST%','70-76%']],conf:80}),

  'niko-g2': mk('niko-g2','NiKo','Rifler','N/A','g2-esports','G2 Esports','#000000','Esports',
    27,'N/A','N/A','Gracanica, Bosnia','None',2012,'Pro debut',13,
    'Nikola "NiKo" Kovač is one of the most technically gifted riflers in Counter-Strike history, a 13-year veteran whose mechanical excellence and opening kill ability have carried teams to multiple Major finals. As G2\'s IGL and star player, NiKo has evolved from a pure fragger into a complete leader.',
    [['Pro Career','13 years'],['Rating 2.0 Career',1.28],['Majors Won',1],['ADR Career',82.4],['Opening Kill%','44.2%'],['HLTV Top 5 Years',6],['IGL Ability','Rare'],['Nationality','Bosnian']],
    [['Rating 2.0',1.21],['ADR',82.4],['KAST%','72.4%'],['Opening Kill%','44.2%'],['Rifler Rating',1.24],['IGL Win Rate','62.4%'],['Impact',1.32],['Clutch%','48.4%']],
    [['Opening Kill%','44.2%',97,'Opening kill percentage'],['Rifler Rating',1.24,97,'Rating 2.0 as pure rifler'],['IGL Ability','Rare',95,'Combined IGL + star player'],['HLTV Impact',1.32,95,'HLTV impact rating']],
    [['Aim',97],['Game Sense',92],['Team Play',88],['Mechanics',96],['Adaptability',90],['Mental Game',90]],
    {game:'vs NAVI (Major SF)',stats:[['Rating','1.15-1.32'],['ADR','78-88'],['Opening Kills/map','3-6'],['KAST%','70-76%']],conf:79}),

  'bugha-fort': mk('bugha-fort','Bugha','Builder','N/A','sentinels','Sentinels','#D22027','Esports',
    22,'N/A','N/A','Pottsgrove, PA','None',2019,'Pro debut',6,
    'Kyle "Bugha" Giersdorf is the greatest Fortnite player of all time, having won the inaugural $3 million Fortnite World Cup Solo at age 16. His elite build speed, editing precision, and in-game decision-making have made him the benchmark by which all Fortnite professionals are measured.',
    [['World Cup Solo Win',1],['Career Earnings','$4.2M+'],['FNCS Wins',3],['Tournament Wins',18],['Edit Speed','Sub-0.1s'],['Avg Placement',4.2],['Elims/Match',5.8],['Nationality','American']],
    [['Avg Placement',4.2],['Elims/Match',5.8],['Tournament Earnings','$2.8M'],['Build Pace','Elite'],['Edit Speed','Top 1%'],['Placement Top 5%','64%'],['Consistency','97th pct'],['Win Rate','22%']],
    [['Placement Avg',4.2,97,'Average tournament placement'],['Build Pace','Elite',98,'Build speed and efficiency'],['Edit Speed','Top 1%',99,'Editing speed percentile'],['Tournament IQ','95th pct',95,'Tournament meta-game decision making']],
    [['Aim',95],['Game Sense',96],['Team Play',84],['Mechanics',98],['Adaptability',92],['Mental Game',94]],
    {game:'FNCS Grand Finals',stats:[['Top 5 Prob','64%'],['Elims','4-8'],['Avg Placement','3-6'],['Victory Prob','22%']],conf:78}),
};

// Merge all sport-specific player databases
Object.assign(PLAYER_DETAILS,
  NBA_PLAYERS, MLB_PLAYERS, NHL_PLAYERS,
  SOCCER_PLAYERS, UFC_PLAYERS, BOXING_PLAYERS,
  TENNIS_PLAYERS, F1_PLAYERS, CRICKET_PLAYERS,
  ESPORTS_PLAYERS, NCAA_PLAYERS,
);

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
