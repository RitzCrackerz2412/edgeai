import type { Team } from '../../types';

const S = 'MLB' as const;
const mk = (id: string, nm: string, ab: string, lg: string, w: number, l: number, pr: number, or_: number, dr: number, el: number, cl: string): Team => {
  const wp = parseFloat((w / (w + l)).toFixed(3));
  return {
    id, name: nm, abbreviation: ab, logo: '', sport: S, league: lg,
    record: `${w}-${l}`, winPct: wp,
    powerRanking: pr, offensiveRating: or_, defensiveRating: dr,
    netRating: parseFloat((or_ - dr).toFixed(1)), eloRating: el,
    momentum: Math.min(99, Math.max(1, Math.round(50 + (wp - 0.5) * 80))),
    homeRecord: `${Math.round(w * 0.56)}-${Math.round(l * 0.44)}`,
    awayRecord: `${Math.round(w * 0.44)}-${Math.round(l * 0.56)}`,
    last5: ['W', 'W', 'L', 'W', 'L'] as ('W' | 'L')[],
    injuries: [], color: cl,
  };
};

export const MLB_TEAMS: Record<string, Team> = {
  // AL East
  'bal-orioles':   mk('bal-orioles',   'Baltimore Orioles',       'BAL', 'AL East',   41,40,  14, 4.7, 4.4, 1620, '#DF4601'),
  'bos-redsox':    mk('bos-redsox',    'Boston Red Sox',          'BOS', 'AL East',   46,35,   8, 5.1, 4.6, 1660, '#BD3039'),
  'nyy-yankees':   mk('nyy-yankees',   'New York Yankees',        'NYY', 'AL East',   50,31,   3, 5.4, 3.8, 1730, '#003087'),
  'tb-rays':       mk('tb-rays',       'Tampa Bay Rays',          'TB',  'AL East',   43,38,  12, 4.8, 4.3, 1640, '#092C5C'),
  'tor-bluejays':  mk('tor-bluejays',  'Toronto Blue Jays',       'TOR', 'AL East',   40,41,  16, 4.7, 4.8, 1610, '#134A8E'),
  // AL Central
  'chi-whitesox':  mk('chi-whitesox',  'Chicago White Sox',       'CWS', 'AL Central',23,58,  29, 3.6, 5.4, 1390, '#27251F'),
  'cle-guardians': mk('cle-guardians', 'Cleveland Guardians',     'CLE', 'AL Central',48,33,   5, 5.0, 4.0, 1680, '#E31937'),
  'det-tigers':    mk('det-tigers',    'Detroit Tigers',          'DET', 'AL Central',42,39,  13, 4.8, 4.5, 1630, '#0C2340'),
  'kc-royals':     mk('kc-royals',     'Kansas City Royals',      'KC',  'AL Central',44,37,  10, 4.9, 4.4, 1650, '#004687'),
  'min-twins':     mk('min-twins',     'Minnesota Twins',         'MIN', 'AL Central',40,41,  15, 4.7, 4.8, 1610, '#002B5C'),
  // AL West
  'hou-astros':    mk('hou-astros',    'Houston Astros',          'HOU', 'AL West',   47,34,   6, 5.1, 4.1, 1690, '#002D62'),
  'laa-angels':    mk('laa-angels',    'Los Angeles Angels',      'LAA', 'AL West',   38,43,  18, 4.6, 4.9, 1580, '#BA0021'),
  'oak-athletics': mk('oak-athletics', 'Oakland Athletics',       'OAK', 'AL West',   24,57,  28, 3.7, 5.3, 1400, '#003831'),
  'sea-mariners':  mk('sea-mariners',  'Seattle Mariners',        'SEA', 'AL West',   43,38,  11, 4.8, 4.2, 1640, '#0C2C56'),
  'tex-rangers':   mk('tex-rangers',   'Texas Rangers',           'TEX', 'AL West',   44,37,   9, 4.9, 4.3, 1660, '#003278'),
  // NL East
  'atl-braves':    mk('atl-braves',    'Atlanta Braves',          'ATL', 'NL East',   53,28,   2, 5.8, 3.6, 1760, '#CE1141'),
  'mia-marlins':   mk('mia-marlins',   'Miami Marlins',           'MIA', 'NL East',   25,56,  27, 3.6, 5.2, 1420, '#00A3E0'),
  'nym-mets':      mk('nym-mets',      'New York Mets',           'NYM', 'NL East',   47,34,   7, 5.0, 4.2, 1680, '#002D72'),
  'phi-phillies':  mk('phi-phillies',  'Philadelphia Phillies',   'PHI', 'NL East',   49,32,   4, 5.2, 4.0, 1710, '#E81828'),
  'wsn-nationals': mk('wsn-nationals', 'Washington Nationals',    'WSN', 'NL East',   28,53,  25, 3.9, 5.1, 1440, '#AB0003'),
  // NL Central
  'chi-cubs':      mk('chi-cubs',      'Chicago Cubs',            'CHC', 'NL Central',46,35,   9, 4.9, 4.2, 1670, '#0E3386'),
  'cin-reds':      mk('cin-reds',      'Cincinnati Reds',         'CIN', 'NL Central',40,41,  15, 4.7, 4.8, 1610, '#C6011F'),
  'mil-brewers':   mk('mil-brewers',   'Milwaukee Brewers',       'MIL', 'NL Central',47,34,   8, 5.0, 4.1, 1690, '#FFC52F'),
  'pit-pirates':   mk('pit-pirates',   'Pittsburgh Pirates',      'PIT', 'NL Central',34,47,  20, 4.3, 5.0, 1560, '#27251F'),
  'stl-cardinals': mk('stl-cardinals', 'St. Louis Cardinals',     'STL', 'NL Central',44,37,  10, 4.9, 4.4, 1650, '#C41E3A'),
  // NL West
  'ari-diamondbacks':mk('ari-diamondbacks','Arizona Diamondbacks','ARI', 'NL West',   42,39,  13, 4.8, 4.6, 1630, '#A71930'),
  'col-rockies':   mk('col-rockies',   'Colorado Rockies',        'COL', 'NL West',   22,59,  30, 3.5, 5.6, 1370, '#33006F'),
  'lad-dodgers':   mk('lad-dodgers',   'Los Angeles Dodgers',     'LAD', 'NL West',   56,25,   1, 5.8, 3.4, 1780, '#005A9C'),
  'sd-padres':     mk('sd-padres',     'San Diego Padres',        'SD',  'NL West',   47,34,   7, 5.1, 4.2, 1690, '#2F241D'),
  'sf-giants':     mk('sf-giants',     'San Francisco Giants',    'SF',  'NL West',   44,37,  11, 4.8, 4.4, 1660, '#FD5A1E'),
};
