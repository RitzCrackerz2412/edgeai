import type { Team } from '../../types';

const S = 'NBA' as const;
const mk = (id: string, nm: string, ab: string, lg: string, w: number, l: number, pr: number, or_: number, dr: number, el: number, cl: string): Team => {
  const wp = parseFloat((w / (w + l)).toFixed(3));
  return {
    id, name: nm, abbreviation: ab, logo: '', sport: S, league: lg,
    record: `${w}-${l}`, winPct: wp,
    powerRanking: pr, offensiveRating: or_, defensiveRating: dr,
    netRating: parseFloat((or_ - dr).toFixed(1)), eloRating: el,
    momentum: Math.min(99, Math.max(1, Math.round(50 + (wp - 0.5) * 80))),
    homeRecord: `${Math.round(w * 0.57)}-${Math.round(l * 0.43)}`,
    awayRecord: `${Math.round(w * 0.43)}-${Math.round(l * 0.57)}`,
    last5: ['W', 'W', 'L', 'W', 'L'] as ('W' | 'L')[],
    injuries: [], color: cl,
  };
};

export const NBA_TEAMS: Record<string, Team> = {
  // Atlantic
  'bos-celtics':   mk('bos-celtics',   'Boston Celtics',          'BOS', 'Atlantic',   59,23,  1, 120.4, 107.2, 1812, '#007A33'),
  'bkn-nets':      mk('bkn-nets',      'Brooklyn Nets',           'BKN', 'Atlantic',   26,56, 27, 110.8, 118.4, 1420, '#000000'),
  'nyknicks':      mk('nyknicks',      'New York Knicks',         'NYK', 'Atlantic',   52,30,  5, 116.2, 110.4, 1750, '#006BB6'),
  'phi-76ers':     mk('phi-76ers',     'Philadelphia 76ers',      'PHI', 'Atlantic',   41,41, 13, 113.8, 114.2, 1620, '#006BB6'),
  'tor-raptors':   mk('tor-raptors',   'Toronto Raptors',         'TOR', 'Atlantic',   32,50, 23, 111.4, 116.8, 1530, '#CE1141'),
  // Central
  'chi-bulls':     mk('chi-bulls',     'Chicago Bulls',           'CHI', 'Central',    39,43, 16, 113.2, 114.8, 1600, '#CE1141'),
  'cle-cavaliers': mk('cle-cavaliers', 'Cleveland Cavaliers',     'CLE', 'Central',    56,26,  3, 118.2, 108.4, 1790, '#860038'),
  'det-pistons':   mk('det-pistons',   'Detroit Pistons',         'DET', 'Central',    31,51, 24, 110.2, 117.8, 1510, '#C8102E'),
  'ind-pacers':    mk('ind-pacers',    'Indiana Pacers',          'IND', 'Central',    51,31,  6, 117.4, 111.2, 1740, '#002D62'),
  'mil-bucks':     mk('mil-bucks',     'Milwaukee Bucks',         'MIL', 'Central',    45,37, 11, 114.8, 112.4, 1660, '#00471B'),
  // Southeast
  'atl-hawks':     mk('atl-hawks',     'Atlanta Hawks',           'ATL', 'Southeast',  37,45, 17, 112.4, 115.2, 1570, '#E03A3E'),
  'cha-hornets':   mk('cha-hornets',   'Charlotte Hornets',       'CHA', 'Southeast',  19,63, 29, 107.8, 120.4, 1380, '#1D1160'),
  'mia-heat':      mk('mia-heat',      'Miami Heat',              'MIA', 'Southeast',  47,35,  9, 115.2, 112.8, 1680, '#98002E'),
  'orl-magic':     mk('orl-magic',     'Orlando Magic',           'ORL', 'Southeast',  46,36, 10, 114.4, 112.2, 1670, '#0077C0'),
  'was-wizards':   mk('was-wizards',   'Washington Wizards',      'WAS', 'Southeast',  15,67, 30, 106.2, 121.8, 1320, '#002B5C'),
  // Northwest
  'den-nuggets':   mk('den-nuggets',   'Denver Nuggets',          'DEN', 'Northwest',  57,25,  2, 119.8, 108.2, 1800, '#0E2240'),
  'min-wolves':    mk('min-wolves',    'Minnesota Timberwolves',  'MIN', 'Northwest',  54,28,  4, 118.4, 109.4, 1770, '#0C2340'),
  'okc-thunder':   mk('okc-thunder',   'Oklahoma City Thunder',   'OKC', 'Northwest',  65,17,  1, 122.1, 105.8, 1862, '#007AC1'),
  'por-blazers':   mk('por-blazers',   'Portland Trail Blazers',  'POR', 'Northwest',  27,55, 26, 110.4, 118.2, 1430, '#E03A3E'),
  'uta-jazz':      mk('uta-jazz',      'Utah Jazz',               'UTA', 'Northwest',  22,60, 28, 108.2, 120.8, 1370, '#002B5C'),
  // Pacific
  'gsw-warriors':  mk('gsw-warriors',  'Golden State Warriors',   'GSW', 'Pacific',    47,35, 10, 115.8, 113.2, 1670, '#1D428A'),
  'lac-clippers':  mk('lac-clippers',  'LA Clippers',             'LAC', 'Pacific',    49,33,  7, 116.8, 111.8, 1710, '#C8102E'),
  'lal-lakers':    mk('lal-lakers',    'Los Angeles Lakers',      'LAL', 'Pacific',    43,39, 12, 114.2, 113.4, 1630, '#552583'),
  'phx-suns':      mk('phx-suns',      'Phoenix Suns',            'PHX', 'Pacific',    45,37, 11, 115.4, 112.6, 1650, '#1D1160'),
  'sac-kings':     mk('sac-kings',     'Sacramento Kings',        'SAC', 'Pacific',    40,42, 15, 113.4, 115.2, 1600, '#5A2D81'),
  // Southwest
  'dal-mavericks': mk('dal-mavericks', 'Dallas Mavericks',        'DAL', 'Southwest',  50,32,  8, 117.2, 111.4, 1720, '#00538C'),
  'hou-rockets':   mk('hou-rockets',   'Houston Rockets',         'HOU', 'Southwest',  44,38, 14, 114.8, 113.8, 1650, '#CE1141'),
  'mem-grizzlies': mk('mem-grizzlies', 'Memphis Grizzlies',       'MEM', 'Southwest',  36,46, 18, 112.2, 115.8, 1560, '#5D76A9'),
  'nop-pelicans':  mk('nop-pelicans',  'New Orleans Pelicans',    'NOP', 'Southwest',  38,44, 16, 112.8, 115.4, 1580, '#0C2340'),
  'sas-spurs':     mk('sas-spurs',     'San Antonio Spurs',       'SAS', 'Southwest',  29,53, 25, 110.4, 118.2, 1440, '#C4CED4'),
};
