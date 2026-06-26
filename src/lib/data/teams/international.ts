import type { Team } from '../../types';

// National teams — used for World Cup, Copa América, Euros
const S = 'Soccer' as const;
const mk = (id: string, nm: string, ab: string, lg: string, w: number, d: number, l: number, pr: number, or_: number, dr: number, el: number, cl: string): Team => {
  const gp = w + d + l;
  const pts = w * 3 + d;
  const wp = parseFloat((pts / (gp * 3)).toFixed(3));
  return {
    id, name: nm, abbreviation: ab, logo: '', sport: S, league: lg,
    record: `${w}-${d}-${l}`, winPct: wp,
    powerRanking: pr, offensiveRating: or_, defensiveRating: dr,
    netRating: parseFloat((or_ - dr).toFixed(2)), eloRating: el,
    momentum: Math.min(99, Math.max(1, Math.round(50 + (wp - 0.333) * 120))),
    homeRecord: `${Math.round(w * 0.60)}-${Math.round(d * 0.50)}-${Math.round(l * 0.40)}`,
    awayRecord: `${Math.round(w * 0.40)}-${Math.round(d * 0.50)}-${Math.round(l * 0.60)}`,
    last5: ['W', 'W', 'D', 'W', 'L'] as ('W' | 'L' | 'D')[],
    injuries: [], color: cl,
  };
};

// ── FIFA World Cup 2026 — 48-team field ─────────────────────────────────────
// Group A
export const WC_TEAMS: Record<string, Team> = {
  // UEFA (16 teams)
  'nat-germany':     mk('nat-germany',    'Germany',          'GER', 'FIFA World Cup', 5,1,0,  4, 2.42, 0.98, 2010, '#000000'),
  'nat-spain':       mk('nat-spain',      'Spain',            'ESP', 'FIFA World Cup', 5,1,0,  2, 2.58, 0.82, 2060, '#AA151B'),
  'nat-england':     mk('nat-england',    'England',          'ENG', 'FIFA World Cup', 4,2,0,  5, 2.28, 1.12, 1980, '#CF081F'),
  'nat-france':      mk('nat-france',     'France',           'FRA', 'FIFA World Cup', 5,0,1,  1, 2.72, 0.78, 2080, '#002395'),
  'nat-italy':       mk('nat-italy',      'Italy',            'ITA', 'FIFA World Cup', 4,1,1,  6, 2.08, 1.28, 1940, '#009246'),
  'nat-netherlands': mk('nat-netherlands','Netherlands',      'NED', 'FIFA World Cup', 4,1,1,  7, 2.14, 1.18, 1950, '#FF6600'),
  'nat-portugal':    mk('nat-portugal',   'Portugal',         'POR', 'FIFA World Cup', 4,2,0,  3, 2.48, 0.92, 2000, '#006600'),
  'nat-belgium':     mk('nat-belgium',    'Belgium',          'BEL', 'FIFA World Cup', 4,0,2,  9, 2.04, 1.32, 1900, '#ED2939'),
  'nat-croatia':     mk('nat-croatia',    'Croatia',          'CRO', 'FIFA World Cup', 3,2,1, 11, 1.88, 1.42, 1860, '#FF0000'),
  'nat-denmark':     mk('nat-denmark',    'Denmark',          'DEN', 'FIFA World Cup', 3,1,2, 12, 1.82, 1.52, 1840, '#C60C30'),
  'nat-austria':     mk('nat-austria',    'Austria',          'AUT', 'FIFA World Cup', 3,1,2, 14, 1.78, 1.58, 1820, '#ED2939'),
  'nat-switzerland': mk('nat-switzerland','Switzerland',      'SUI', 'FIFA World Cup', 3,1,2, 13, 1.72, 1.62, 1800, '#FF0000'),
  'nat-poland':      mk('nat-poland',     'Poland',           'POL', 'FIFA World Cup', 2,3,1, 18, 1.58, 1.74, 1750, '#DC143C'),
  'nat-turkey':      mk('nat-turkey',     'Turkey',           'TUR', 'FIFA World Cup', 3,0,3, 16, 1.68, 1.82, 1760, '#E30A17'),
  'nat-scotland':    mk('nat-scotland',   'Scotland',         'SCO', 'FIFA World Cup', 2,2,2, 20, 1.52, 1.84, 1720, '#005EB8'),
  'nat-serbia':      mk('nat-serbia',     'Serbia',           'SRB', 'FIFA World Cup', 2,1,3, 21, 1.48, 1.92, 1700, '#C6363C'),
  // CONMEBOL (6 teams)
  'nat-brazil':      mk('nat-brazil',     'Brazil',           'BRA', 'FIFA World Cup', 5,1,0,  2, 2.64, 0.84, 2070, '#009C3B'),
  'nat-argentina':   mk('nat-argentina',  'Argentina',        'ARG', 'FIFA World Cup', 5,0,1,  3, 2.52, 0.92, 2040, '#74ACDF'),
  'nat-colombia':    mk('nat-colombia',   'Colombia',         'COL', 'FIFA World Cup', 4,1,1,  8, 2.12, 1.24, 1920, '#FCD116'),
  'nat-uruguay':     mk('nat-uruguay',    'Uruguay',          'URU', 'FIFA World Cup', 3,2,1, 10, 1.92, 1.38, 1880, '#5EB6E4'),
  'nat-ecuador':     mk('nat-ecuador',    'Ecuador',          'ECU', 'FIFA World Cup', 3,0,3, 22, 1.58, 1.88, 1720, '#FFDA00'),
  'nat-venezuela':   mk('nat-venezuela',  'Venezuela',        'VEN', 'FIFA World Cup', 2,2,2, 28, 1.42, 1.98, 1660, '#CF142B'),
  // CONCACAF (6 teams — includes hosts USA, Mexico, Canada)
  'nat-usa':         mk('nat-usa',        'United States',    'USA', 'FIFA World Cup', 3,2,1, 15, 1.78, 1.58, 1810, '#B22234'),
  'nat-mexico':      mk('nat-mexico',     'Mexico',           'MEX', 'FIFA World Cup', 3,1,2, 17, 1.68, 1.72, 1770, '#006847'),
  'nat-canada':      mk('nat-canada',     'Canada',           'CAN', 'FIFA World Cup', 3,0,3, 23, 1.52, 1.84, 1720, '#FF0000'),
  'nat-jamaica':     mk('nat-jamaica',    'Jamaica',          'JAM', 'FIFA World Cup', 2,1,3, 35, 1.28, 2.02, 1620, '#000000'),
  'nat-honduras':    mk('nat-honduras',   'Honduras',         'HON', 'FIFA World Cup', 1,2,3, 38, 1.18, 2.14, 1580, '#0073CF'),
  'nat-costarica':   mk('nat-costarica',  'Costa Rica',       'CRC', 'FIFA World Cup', 1,2,3, 37, 1.22, 2.08, 1600, '#D00000'),
  // AFC (8 teams)
  'nat-japan':       mk('nat-japan',      'Japan',            'JPN', 'FIFA World Cup', 4,1,1, 10, 2.04, 1.32, 1910, '#BC002D'),
  'nat-southkorea':  mk('nat-southkorea', 'South Korea',      'KOR', 'FIFA World Cup', 3,2,1, 15, 1.78, 1.58, 1820, '#003478'),
  'nat-iran':        mk('nat-iran',       'Iran',             'IRN', 'FIFA World Cup', 3,1,2, 24, 1.52, 1.78, 1730, '#239F40'),
  'nat-saudiarabia': mk('nat-saudiarabia','Saudi Arabia',     'KSA', 'FIFA World Cup', 2,2,2, 32, 1.38, 1.94, 1680, '#006C35'),
  'nat-australia':   mk('nat-australia',  'Australia',        'AUS', 'FIFA World Cup', 2,2,2, 33, 1.36, 1.96, 1670, '#FFCD00'),
  'nat-iraq':        mk('nat-iraq',       'Iraq',             'IRQ', 'FIFA World Cup', 2,1,3, 36, 1.28, 2.08, 1620, '#007A3D'),
  'nat-uzbekistan':  mk('nat-uzbekistan', 'Uzbekistan',       'UZB', 'FIFA World Cup', 1,3,2, 41, 1.12, 2.18, 1560, '#1EB53A'),
  'nat-jordan':      mk('nat-jordan',     'Jordan',           'JOR', 'FIFA World Cup', 1,2,3, 43, 1.08, 2.24, 1540, '#007A3D'),
  // CAF (9 teams)
  'nat-morocco':     mk('nat-morocco',    'Morocco',          'MAR', 'FIFA World Cup', 4,2,0,  9, 2.08, 1.18, 1940, '#C1272D'),
  'nat-nigeria':     mk('nat-nigeria',    'Nigeria',          'NGA', 'FIFA World Cup', 3,2,1, 18, 1.78, 1.62, 1820, '#008751'),
  'nat-senegal':     mk('nat-senegal',    'Senegal',          'SEN', 'FIFA World Cup', 3,1,2, 19, 1.72, 1.68, 1800, '#00853F'),
  'nat-egypt':       mk('nat-egypt',      'Egypt',            'EGY', 'FIFA World Cup', 3,0,3, 27, 1.52, 1.88, 1730, '#CC0001'),
  'nat-tunisia':     mk('nat-tunisia',    'Tunisia',          'TUN', 'FIFA World Cup', 2,2,2, 31, 1.42, 1.96, 1680, '#E70013'),
  'nat-cameroon':    mk('nat-cameroon',   'Cameroon',         'CMR', 'FIFA World Cup', 2,1,3, 34, 1.32, 2.04, 1640, '#007A5E'),
  'nat-ghana':       mk('nat-ghana',      'Ghana',            'GHA', 'FIFA World Cup', 2,1,3, 39, 1.24, 2.12, 1590, '#006B3F'),
  'nat-ivorycoast':  mk('nat-ivorycoast', 'Ivory Coast',      'CIV', 'FIFA World Cup', 2,2,2, 30, 1.38, 1.98, 1670, '#F77F00'),
  'nat-drcongo':     mk('nat-drcongo',    'DR Congo',         'COD', 'FIFA World Cup', 2,0,4, 42, 1.18, 2.18, 1550, '#007FFF'),
  // OFC + Interconfed
  'nat-newzealand':  mk('nat-newzealand', 'New Zealand',      'NZL', 'FIFA World Cup', 1,1,4, 46, 1.04, 2.28, 1490, '#000000'),
  'nat-chile':       mk('nat-chile',      'Chile',            'CHI', 'FIFA World Cup', 2,1,3, 29, 1.44, 1.96, 1690, '#D52B1E'),
  'nat-indonesia':   mk('nat-indonesia',  'Indonesia',        'IDN', 'FIFA World Cup', 0,2,4, 48, 0.88, 2.44, 1390, '#CE1126'),
};

// ── Copa América 2024 (current champions: Argentina) ────────────────────────
export const COPA_TEAMS: Record<string, Team> = {
  'copa-argentina':  mk('copa-argentina',  'Argentina',    'ARG', 'Copa América', 5,1,0, 1, 2.54, 0.88, 2040, '#74ACDF'),
  'copa-colombia':   mk('copa-colombia',   'Colombia',     'COL', 'Copa América', 5,1,0, 2, 2.18, 1.04, 1930, '#FCD116'),
  'copa-brazil':     mk('copa-brazil',     'Brazil',       'BRA', 'Copa América', 4,1,1, 3, 2.14, 1.08, 1960, '#009C3B'),
  'copa-uruguay':    mk('copa-uruguay',    'Uruguay',      'URU', 'Copa América', 4,0,2, 4, 1.98, 1.24, 1880, '#5EB6E4'),
  'copa-ecuador':    mk('copa-ecuador',    'Ecuador',      'ECU', 'Copa América', 3,1,2, 5, 1.74, 1.52, 1760, '#FFDA00'),
  'copa-venezuela':  mk('copa-venezuela',  'Venezuela',    'VEN', 'Copa América', 3,1,2, 6, 1.68, 1.58, 1740, '#CF142B'),
  'copa-chile':      mk('copa-chile',      'Chile',        'CHI', 'Copa América', 2,2,2, 7, 1.54, 1.72, 1700, '#D52B1E'),
  'copa-peru':       mk('copa-peru',       'Peru',         'PER', 'Copa América', 2,1,3, 8, 1.48, 1.82, 1670, '#D91023'),
  'copa-usa':        mk('copa-usa',        'United States','USA', 'Copa América', 3,0,3, 9, 1.62, 1.78, 1780, '#B22234'),
  'copa-mexico':     mk('copa-mexico',     'Mexico',       'MEX', 'Copa América', 2,2,2,10, 1.56, 1.82, 1750, '#006847'),
  'copa-canada':     mk('copa-canada',     'Canada',       'CAN', 'Copa América', 2,1,3,11, 1.44, 1.88, 1700, '#FF0000'),
  'copa-jamaica':    mk('copa-jamaica',    'Jamaica',      'JAM', 'Copa América', 1,2,3,12, 1.28, 2.04, 1610, '#000000'),
  'copa-panama':     mk('copa-panama',     'Panama',       'PAN', 'Copa América', 1,1,4,13, 1.18, 2.14, 1560, '#CD1827'),
  'copa-bolivia':    mk('copa-bolivia',    'Bolivia',      'BOL', 'Copa América', 1,1,4,14, 1.12, 2.22, 1530, '#009A44'),
  'copa-costarica':  mk('copa-costarica',  'Costa Rica',   'CRC', 'Copa América', 0,2,4,15, 0.98, 2.34, 1480, '#D00000'),
  'copa-paraguay':   mk('copa-paraguay',   'Paraguay',     'PAR', 'Copa América', 1,0,5,16, 1.08, 2.28, 1510, '#D52B1E'),
};

// ── UEFA Euro 2028 field (24 teams) ─────────────────────────────────────────
export const EURO_TEAMS: Record<string, Team> = {
  'euro-england':    mk('euro-england',    'England',      'ENG', 'UEFA Euro',  4,2,0, 3, 2.28, 1.08, 1980, '#CF081F'),
  'euro-france':     mk('euro-france',     'France',       'FRA', 'UEFA Euro',  5,0,1, 2, 2.68, 0.82, 2060, '#002395'),
  'euro-spain':      mk('euro-spain',      'Spain',        'ESP', 'UEFA Euro',  5,1,0, 1, 2.54, 0.86, 2050, '#AA151B'),
  'euro-germany':    mk('euro-germany',    'Germany',      'GER', 'UEFA Euro',  5,1,0, 4, 2.38, 0.98, 2000, '#000000'),
  'euro-portugal':   mk('euro-portugal',   'Portugal',     'POR', 'UEFA Euro',  4,2,0, 5, 2.42, 0.96, 1990, '#006600'),
  'euro-italy':      mk('euro-italy',      'Italy',        'ITA', 'UEFA Euro',  4,1,1, 6, 2.08, 1.24, 1940, '#009246'),
  'euro-netherlands':mk('euro-netherlands','Netherlands',  'NED', 'UEFA Euro',  4,1,1, 7, 2.12, 1.18, 1950, '#FF6600'),
  'euro-belgium':    mk('euro-belgium',    'Belgium',      'BEL', 'UEFA Euro',  4,0,2, 8, 2.02, 1.34, 1890, '#ED2939'),
  'euro-croatia':    mk('euro-croatia',    'Croatia',      'CRO', 'UEFA Euro',  3,2,1,10, 1.88, 1.44, 1850, '#FF0000'),
  'euro-denmark':    mk('euro-denmark',    'Denmark',      'DEN', 'UEFA Euro',  3,1,2,11, 1.82, 1.52, 1840, '#C60C30'),
  'euro-austria':    mk('euro-austria',    'Austria',      'AUT', 'UEFA Euro',  3,1,2,13, 1.78, 1.58, 1820, '#ED2939'),
  'euro-switzerland':mk('euro-switzerland','Switzerland',  'SUI', 'UEFA Euro',  3,1,2,12, 1.72, 1.62, 1800, '#FF0000'),
  'euro-turkey':     mk('euro-turkey',     'Turkey',       'TUR', 'UEFA Euro',  3,0,3,15, 1.68, 1.82, 1760, '#E30A17'),
  'euro-poland':     mk('euro-poland',     'Poland',       'POL', 'UEFA Euro',  2,3,1,17, 1.58, 1.74, 1750, '#DC143C'),
  'euro-scotland':   mk('euro-scotland',   'Scotland',     'SCO', 'UEFA Euro',  2,2,2,18, 1.52, 1.84, 1720, '#005EB8'),
  'euro-serbia':     mk('euro-serbia',     'Serbia',       'SRB', 'UEFA Euro',  2,1,3,20, 1.48, 1.92, 1700, '#C6363C'),
  'euro-ukraine':    mk('euro-ukraine',    'Ukraine',      'UKR', 'UEFA Euro',  2,2,2,16, 1.58, 1.78, 1740, '#005BBB'),
  'euro-hungary':    mk('euro-hungary',    'Hungary',      'HUN', 'UEFA Euro',  2,1,3,22, 1.42, 1.98, 1680, '#CE2939'),
  'euro-czechrepublic':mk('euro-czechrepublic','Czech Republic','CZE','UEFA Euro',2,1,3,21,1.44,1.96,1690,'#D7141A'),
  'euro-slovakia':   mk('euro-slovakia',   'Slovakia',     'SVK', 'UEFA Euro',  2,0,4,23, 1.32, 2.08, 1640, '#005BBB'),
  'euro-romania':    mk('euro-romania',    'Romania',      'ROU', 'UEFA Euro',  2,1,3,24, 1.28, 2.12, 1620, '#002B7F'),
  'euro-georgia':    mk('euro-georgia',    'Georgia',      'GEO', 'UEFA Euro',  2,0,4,25, 1.24, 2.18, 1590, '#CC0000'),
  'euro-albania':    mk('euro-albania',    'Albania',      'ALB', 'UEFA Euro',  1,1,4,26, 1.08, 2.28, 1540, '#E41E20'),
  'euro-slovenia':   mk('euro-slovenia',   'Slovenia',     'SVN', 'UEFA Euro',  1,2,3,27, 1.12, 2.22, 1560, '#003DA5'),
};
