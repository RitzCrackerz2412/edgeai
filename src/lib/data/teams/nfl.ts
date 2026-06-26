import type { Team } from '../../types';

const S = 'NFL' as const;
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

export const NFL_TEAMS: Record<string, Team> = {
  // AFC East
  'buf-bills':    mk('buf-bills',    'Buffalo Bills',            'BUF', 'AFC East',  12, 5,  4, 27.8, 20.1, 1790, '#00338D'),
  'mia-dolphins': mk('mia-dolphins', 'Miami Dolphins',           'MIA', 'AFC East',   9, 8, 12, 24.6, 23.1, 1660, '#008E97'),
  'ne-patriots':  mk('ne-patriots',  'New England Patriots',     'NE',  'AFC East',   4,13, 29, 16.8, 27.4, 1420, '#002244'),
  'nyj-jets':     mk('nyj-jets',     'New York Jets',            'NYJ', 'AFC East',   6,11, 24, 19.2, 25.8, 1540, '#125740'),
  // AFC North
  'bal-ravens':   mk('bal-ravens',   'Baltimore Ravens',         'BAL', 'AFC North', 13, 4,  2, 29.4, 18.8, 1820, '#241773'),
  'cin-bengals':  mk('cin-bengals',  'Cincinnati Bengals',       'CIN', 'AFC North', 10, 7,  8, 26.2, 22.4, 1700, '#FB4F14'),
  'cle-browns':   mk('cle-browns',   'Cleveland Browns',         'CLE', 'AFC North',  6,11, 22, 19.4, 25.2, 1520, '#311D00'),
  'pit-steelers': mk('pit-steelers', 'Pittsburgh Steelers',      'PIT', 'AFC North',  7,10, 18, 21.8, 22.4, 1600, '#FFB612'),
  // AFC South
  'hou-texans':   mk('hou-texans',   'Houston Texans',           'HOU', 'AFC South',  9, 8, 11, 23.8, 22.1, 1650, '#03202F'),
  'ind-colts':    mk('ind-colts',    'Indianapolis Colts',       'IND', 'AFC South',  8, 9, 16, 22.4, 23.8, 1620, '#002C5F'),
  'jax-jaguars':  mk('jax-jaguars',  'Jacksonville Jaguars',     'JAX', 'AFC South',  7,10, 20, 21.2, 24.1, 1580, '#006778'),
  'ten-titans':   mk('ten-titans',   'Tennessee Titans',         'TEN', 'AFC South',  3,14, 31, 16.2, 29.8, 1380, '#4B92DB'),
  // AFC West
  'kc-chiefs':    mk('kc-chiefs',    'Kansas City Chiefs',       'KC',  'AFC West',  14, 3,  1, 30.2, 17.1, 1868, '#E31837'),
  'lac-chargers': mk('lac-chargers', 'Los Angeles Chargers',     'LAC', 'AFC West',  10, 7,  9, 25.4, 21.8, 1680, '#002A5E'),
  'lv-raiders':   mk('lv-raiders',   'Las Vegas Raiders',        'LV',  'AFC West',   4,13, 30, 17.1, 28.4, 1410, '#A5ACAF'),
  'den-broncos':  mk('den-broncos',  'Denver Broncos',           'DEN', 'AFC West',   8, 9, 15, 22.8, 23.4, 1630, '#FB4F14'),
  // NFC East
  'dal-cowboys':  mk('dal-cowboys',  'Dallas Cowboys',           'DAL', 'NFC East',   8, 9, 14, 23.1, 24.2, 1640, '#003594'),
  'nyg-giants':   mk('nyg-giants',   'New York Giants',          'NYG', 'NFC East',   5,12, 27, 18.4, 26.8, 1460, '#0B2265'),
  'phi-eagles':   mk('phi-eagles',   'Philadelphia Eagles',      'PHI', 'NFC East',  13, 4,  3, 28.9, 18.4, 1810, '#004C54'),
  'wsh-commanders':mk('wsh-commanders','Washington Commanders',  'WSH', 'NFC East',   9, 8, 13, 24.2, 22.8, 1670, '#773141'),
  // NFC North
  'chi-bears':    mk('chi-bears',    'Chicago Bears',            'CHI', 'NFC North',  6,11, 23, 19.8, 25.4, 1530, '#0B162A'),
  'det-lions':    mk('det-lions',    'Detroit Lions',            'DET', 'NFC North', 14, 3,  2, 30.4, 17.8, 1848, '#0076B6'),
  'gb-packers':   mk('gb-packers',   'Green Bay Packers',        'GB',  'NFC North', 11, 6,  7, 25.8, 20.4, 1740, '#203731'),
  'min-vikings':  mk('min-vikings',  'Minnesota Vikings',        'MIN', 'NFC North', 12, 5,  5, 27.2, 20.8, 1770, '#4F2683'),
  // NFC South
  'atl-falcons':  mk('atl-falcons',  'Atlanta Falcons',          'ATL', 'NFC South',  8, 9, 17, 22.4, 23.6, 1610, '#A71930'),
  'car-panthers': mk('car-panthers', 'Carolina Panthers',        'CAR', 'NFC South',  2,15, 32, 14.8, 30.2, 1340, '#0085CA'),
  'no-saints':    mk('no-saints',    'New Orleans Saints',       'NO',  'NFC South',  9, 8, 10, 24.8, 22.4, 1660, '#D3BC8D'),
  'tb-buccaneers':mk('tb-buccaneers','Tampa Bay Buccaneers',     'TB',  'NFC South', 10, 7,  8, 26.8, 21.4, 1710, '#D50A0A'),
  // NFC West
  'ari-cardinals':mk('ari-cardinals','Arizona Cardinals',        'ARI', 'NFC West',   5,12, 26, 18.8, 26.2, 1490, '#97233F'),
  'lar-rams':     mk('lar-rams',     'Los Angeles Rams',         'LAR', 'NFC West',   7,10, 19, 22.1, 23.4, 1590, '#003594'),
  'sf-49ers':     mk('sf-49ers',     'San Francisco 49ers',      'SF',  'NFC West',  10, 7,  6, 26.4, 20.8, 1720, '#AA0000'),
  'sea-seahawks': mk('sea-seahawks', 'Seattle Seahawks',         'SEA', 'NFC West',   9, 8, 10, 24.2, 22.8, 1660, '#002244'),
};
