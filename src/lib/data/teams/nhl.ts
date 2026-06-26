import type { Team } from '../../types';

const S = 'NHL' as const;
// record format: W-OTL-L  (winPct = (W*2 + OTL) / (GP*2))
const mk = (id: string, nm: string, ab: string, lg: string, w: number, otl: number, l: number, pr: number, or_: number, dr: number, el: number, cl: string): Team => {
  const gp = w + otl + l;
  const wp = parseFloat(((w * 2 + otl) / (gp * 2)).toFixed(3));
  return {
    id, name: nm, abbreviation: ab, logo: '', sport: S, league: lg,
    record: `${w}-${otl}-${l}`, winPct: wp,
    powerRanking: pr, offensiveRating: or_, defensiveRating: dr,
    netRating: parseFloat((or_ - dr).toFixed(2)), eloRating: el,
    momentum: Math.min(99, Math.max(1, Math.round(50 + (wp - 0.5) * 80))),
    homeRecord: `${Math.round(w * 0.57)}-${Math.round(otl * 0.5)}-${Math.round(l * 0.43)}`,
    awayRecord: `${Math.round(w * 0.43)}-${Math.round(otl * 0.5)}-${Math.round(l * 0.57)}`,
    last5: ['W', 'W', 'L', 'W', 'L'] as ('W' | 'L')[],
    injuries: [], color: cl,
  };
};

export const NHL_TEAMS: Record<string, Team> = {
  // Atlantic Division
  'bos-bruins':     mk('bos-bruins',     'Boston Bruins',           'BOS', 'Atlantic',  48,10,24,  7, 3.18, 2.64, 1710, '#FFB81C'),
  'buf-sabres':     mk('buf-sabres',     'Buffalo Sabres',          'BUF', 'Atlantic',  39,13,30, 15, 3.04, 2.82, 1620, '#003087'),
  'det-redwings':   mk('det-redwings',   'Detroit Red Wings',       'DET', 'Atlantic',  36,14,32, 18, 2.98, 2.94, 1580, '#CE1126'),
  'fla-panthers':   mk('fla-panthers',   'Florida Panthers',        'FLA', 'Atlantic',  52,10,20,  4, 3.42, 2.54, 1760, '#C8102E'),
  'mtl-canadiens':  mk('mtl-canadiens',  'Montreal Canadiens',      'MTL', 'Atlantic',  38,14,30, 16, 2.96, 2.92, 1600, '#AF1E2D'),
  'ott-senators':   mk('ott-senators',   'Ottawa Senators',         'OTT', 'Atlantic',  42,10,30, 12, 3.08, 2.74, 1650, '#E31837'),
  'tbl-lightning':  mk('tbl-lightning',  'Tampa Bay Lightning',     'TBL', 'Atlantic',  46,16,20,  8, 3.28, 2.60, 1720, '#002868'),
  'tor-mapleleafs': mk('tor-mapleleafs', 'Toronto Maple Leafs',     'TOR', 'Atlantic',  50,12,20,  5, 3.38, 2.56, 1750, '#00205B'),
  // Metropolitan Division
  'car-hurricanes': mk('car-hurricanes', 'Carolina Hurricanes',     'CAR', 'Metropolitan',51,11,20,  5, 3.40, 2.54, 1755, '#CC0000'),
  'cbj-bluejackets':mk('cbj-bluejackets','Columbus Blue Jackets',   'CBJ', 'Metropolitan',24, 8,50, 31, 2.62, 3.18, 1380, '#002654'),
  'njd-devils':     mk('njd-devils',     'New Jersey Devils',       'NJD', 'Metropolitan',46,16,20,  9, 3.24, 2.62, 1720, '#CE1126'),
  'nyr-rangers':    mk('nyr-rangers',    'New York Rangers',        'NYR', 'Metropolitan',50,12,20,  6, 3.36, 2.56, 1748, '#0038A8'),
  'nyi-islanders':  mk('nyi-islanders',  'New York Islanders',      'NYI', 'Metropolitan',37,14,31, 17, 2.98, 2.88, 1580, '#003087'),
  'phi-flyers':     mk('phi-flyers',     'Philadelphia Flyers',     'PHI', 'Metropolitan',43, 8,31, 11, 3.10, 2.72, 1640, '#F74902'),
  'pit-penguins':   mk('pit-penguins',   'Pittsburgh Penguins',     'PIT', 'Metropolitan',40,12,30, 14, 3.04, 2.80, 1620, '#FCB514'),
  'wsh-capitals':   mk('wsh-capitals',   'Washington Capitals',     'WSH', 'Metropolitan',54, 8,20,  3, 3.48, 2.50, 1775, '#C8102E'),
  // Central Division
  'chi-blackhawks': mk('chi-blackhawks', 'Chicago Blackhawks',      'CHI', 'Central',   22,10,50, 32, 2.56, 3.24, 1360, '#CF0A2C'),
  'col-avalanche':  mk('col-avalanche',  'Colorado Avalanche',      'COL', 'Central',   50,12,20,  6, 3.38, 2.56, 1750, '#6F263D'),
  'dal-stars':      mk('dal-stars',      'Dallas Stars',            'DAL', 'Central',   52,10,20,  4, 3.44, 2.52, 1762, '#006847'),
  'min-wild':       mk('min-wild',       'Minnesota Wild',          'MIN', 'Central',   45, 8,29, 10, 3.24, 2.68, 1700, '#154734'),
  'nsh-predators':  mk('nsh-predators',  'Nashville Predators',     'NSH', 'Central',   38,14,30, 16, 3.00, 2.88, 1600, '#FFB81C'),
  'stl-blues':      mk('stl-blues',      'St. Louis Blues',         'STL', 'Central',   44, 8,30, 11, 3.14, 2.72, 1660, '#002F87'),
  'uta-hockeyclub': mk('uta-hockeyclub', 'Utah Hockey Club',        'UTA', 'Central',   40,12,30, 14, 3.04, 2.80, 1620, '#6CACE4'),
  'wpg-jets':       mk('wpg-jets',       'Winnipeg Jets',           'WPG', 'Central',   56, 6,20,  2, 3.54, 2.44, 1790, '#041E42'),
  // Pacific Division
  'ana-ducks':      mk('ana-ducks',      'Anaheim Ducks',           'ANA', 'Pacific',   28,12,42, 27, 2.76, 3.12, 1430, '#FC4C02'),
  'cgy-flames':     mk('cgy-flames',     'Calgary Flames',          'CGY', 'Pacific',   42,10,30, 12, 3.10, 2.76, 1640, '#C8102E'),
  'edm-oilers':     mk('edm-oilers',     'Edmonton Oilers',         'EDM', 'Pacific',   50,12,20,  7, 3.38, 2.58, 1745, '#FF4C00'),
  'lak-kings':      mk('lak-kings',      'Los Angeles Kings',       'LAK', 'Pacific',   46,16,20,  9, 3.24, 2.64, 1715, '#111111'),
  'sjs-sharks':     mk('sjs-sharks',     'San Jose Sharks',         'SJS', 'Pacific',   20,12,50, 33, 2.52, 3.28, 1340, '#006D75'),
  'sea-kraken':     mk('sea-kraken',     'Seattle Kraken',          'SEA', 'Pacific',   44, 8,30, 11, 3.14, 2.72, 1658, '#99D9D9'),
  'van-canucks':    mk('van-canucks',    'Vancouver Canucks',       'VAN', 'Pacific',   52,10,20,  4, 3.42, 2.52, 1762, '#00205B'),
  'vgk-goldenknights':mk('vgk-goldenknights','Vegas Golden Knights','VGK','Pacific',   48,14,20,  8, 3.32, 2.60, 1730, '#B4975A'),
};
