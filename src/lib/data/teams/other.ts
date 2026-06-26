import type { Team } from '../../types';

// ── Formula 1 Drivers ────────────────────────────────────────────────────────
// offensiveRating = avg qualifying position (inverted: 21 - avg_pos, higher is better)
// defensiveRating = DNF rate inverse (10 = never DNFs, 1 = frequent DNFs)
// record = season wins - podiums (non-win)
const mkF1 = (id: string, nm: string, ab: string, team: string, w: number, p: number, pr: number, q: number, dnf: number, pts: number, cl: string): Team => {
  const gp = 24; // 2026 F1 season races
  const wp = parseFloat((w / gp).toFixed(3));
  return {
    id, name: nm, abbreviation: ab, logo: '', sport: 'F1', league: team,
    record: `${w}-${p}`, winPct: wp,
    powerRanking: pr, offensiveRating: parseFloat((21 - q).toFixed(1)), defensiveRating: parseFloat((10 - dnf).toFixed(1)),
    netRating: parseFloat(((21 - q) - (10 - dnf)).toFixed(1)), eloRating: pts * 5 + 1400,
    momentum: Math.min(99, Math.max(1, Math.round(50 + (wp - 0.1) * 200))),
    homeRecord: `${w}-0`, awayRecord: `${p}-0`,
    last5: ['W', 'P', 'W', 'P', 'W'].slice(0, 5).map(r => r === 'W' ? 'W' : 'L') as ('W' | 'L')[],
    injuries: [], color: cl,
  };
};

// ── UFC Fighters ─────────────────────────────────────────────────────────────
const mkUFC = (id: string, nm: string, ab: string, wc: string, w: number, l: number, nc: number, pr: number, str: number, def: number, el: number, cl: string): Team => {
  const gp = w + l + (nc > 0 ? nc : 0);
  const wp = parseFloat((w / (w + l)).toFixed(3));
  return {
    id, name: nm, abbreviation: ab, logo: '', sport: 'UFC', league: wc,
    record: nc > 0 ? `${w}-${l}-${nc}` : `${w}-${l}`, winPct: wp,
    powerRanking: pr, offensiveRating: str, defensiveRating: def,
    netRating: parseFloat((str - def).toFixed(1)), eloRating: el,
    momentum: Math.min(99, Math.max(1, Math.round(50 + (wp - 0.5) * 80))),
    homeRecord: `${w}-0`, awayRecord: `${l}-0`,
    last5: ['W', 'W', 'W', 'L', 'W'] as ('W' | 'L')[],
    injuries: [], color: cl,
  };
};

// ── Tennis Players ───────────────────────────────────────────────────────────
const mkTennis = (id: string, nm: string, ab: string, tour: string, w: number, l: number, pr: number, srv: number, ret: number, el: number, cl: string): Team => {
  const wp = parseFloat((w / (w + l)).toFixed(3));
  return {
    id, name: nm, abbreviation: ab, logo: '', sport: 'Tennis', league: tour,
    record: `${w}-${l}`, winPct: wp,
    powerRanking: pr, offensiveRating: srv, defensiveRating: ret,
    netRating: parseFloat((srv - ret).toFixed(1)), eloRating: el,
    momentum: Math.min(99, Math.max(1, Math.round(50 + (wp - 0.5) * 80))),
    homeRecord: `${Math.round(w * 0.55)}-${Math.round(l * 0.45)}`,
    awayRecord: `${Math.round(w * 0.45)}-${Math.round(l * 0.55)}`,
    last5: ['W', 'W', 'L', 'W', 'W'] as ('W' | 'L')[],
    injuries: [], color: cl,
  };
};

// ── NCAA Football (Top 25) ───────────────────────────────────────────────────
const mkNCAA_FB = (id: string, nm: string, ab: string, conf: string, w: number, l: number, pr: number, or_: number, dr: number, el: number, cl: string): Team => {
  const wp = parseFloat((w / (w + l)).toFixed(3));
  return {
    id, name: nm, abbreviation: ab, logo: '', sport: 'NCAA Football', league: conf,
    record: `${w}-${l}`, winPct: wp,
    powerRanking: pr, offensiveRating: or_, defensiveRating: dr,
    netRating: parseFloat((or_ - dr).toFixed(1)), eloRating: el,
    momentum: Math.min(99, Math.max(1, Math.round(50 + (wp - 0.5) * 80))),
    homeRecord: `${Math.round(w * 0.65)}-${Math.round(l * 0.35)}`,
    awayRecord: `${Math.round(w * 0.35)}-${Math.round(l * 0.65)}`,
    last5: ['W', 'W', 'W', 'L', 'W'] as ('W' | 'L')[],
    injuries: [], color: cl,
  };
};

// ── NCAA Basketball (Top 32) ─────────────────────────────────────────────────
const mkNCAA_BB = (id: string, nm: string, ab: string, conf: string, w: number, l: number, pr: number, or_: number, dr: number, el: number, cl: string): Team => {
  const wp = parseFloat((w / (w + l)).toFixed(3));
  return {
    id, name: nm, abbreviation: ab, logo: '', sport: 'NCAA Basketball', league: conf,
    record: `${w}-${l}`, winPct: wp,
    powerRanking: pr, offensiveRating: or_, defensiveRating: dr,
    netRating: parseFloat((or_ - dr).toFixed(1)), eloRating: el,
    momentum: Math.min(99, Math.max(1, Math.round(50 + (wp - 0.5) * 80))),
    homeRecord: `${Math.round(w * 0.65)}-${Math.round(l * 0.35)}`,
    awayRecord: `${Math.round(w * 0.35)}-${Math.round(l * 0.65)}`,
    last5: ['W', 'W', 'W', 'L', 'W'] as ('W' | 'L')[],
    injuries: [], color: cl,
  };
};

export const F1_DRIVERS: Record<string, Team> = {
  'f1-max-verstappen':   mkF1('f1-max-verstappen',   'Max Verstappen',    'VER', 'Red Bull',       8,10, 1, 1.2, 1, 312, '#1E41FF'),
  'f1-lewis-hamilton':   mkF1('f1-lewis-hamilton',   'Lewis Hamilton',    'HAM', 'Ferrari',        5,11, 4, 2.1, 0, 248, '#DC0000'),
  'f1-charles-leclerc':  mkF1('f1-charles-leclerc',  'Charles Leclerc',   'LEC', 'Ferrari',        4,12, 5, 2.4, 1, 224, '#DC0000'),
  'f1-lando-norris':     mkF1('f1-lando-norris',     'Lando Norris',      'NOR', 'McLaren',        7,10, 2, 1.8, 0, 294, '#FF8000'),
  'f1-carlos-sainz':     mkF1('f1-carlos-sainz',     'Carlos Sainz',      'SAI', 'Williams',       3,12, 6, 3.1, 1, 198, '#005AFF'),
  'f1-george-russell':   mkF1('f1-george-russell',   'George Russell',    'RUS', 'Mercedes',       4,11, 7, 2.8, 1, 216, '#27F4D2'),
  'f1-oscar-piastri':    mkF1('f1-oscar-piastri',    'Oscar Piastri',     'PIA', 'McLaren',        6,10, 3, 2.2, 0, 278, '#FF8000'),
  'f1-fernando-alonso':  mkF1('f1-fernando-alonso',  'Fernando Alonso',   'ALO', 'Aston Martin',   1,14, 9, 3.8, 2, 142, '#358C75'),
  'f1-lance-stroll':     mkF1('f1-lance-stroll',     'Lance Stroll',      'STR', 'Aston Martin',   0,16,14, 6.2, 1,  58, '#358C75'),
  'f1-nico-hulkenberg':  mkF1('f1-nico-hulkenberg',  'Nico Hulkenberg',   'HUL', 'Haas',           0,15,13, 5.8, 1,  72, '#B6BABD'),
  'f1-kimi-antonelli':   mkF1('f1-kimi-antonelli',   'Kimi Antonelli',    'ANT', 'Mercedes',       2,12, 8, 3.2, 2, 168, '#27F4D2'),
  'f1-yuki-tsunoda':     mkF1('f1-yuki-tsunoda',     'Yuki Tsunoda',      'TSU', 'Red Bull',       1,13,10, 4.1, 1, 118, '#1E41FF'),
  'f1-esteban-ocon':     mkF1('f1-esteban-ocon',     'Esteban Ocon',      'OCO', 'Alpine',         0,14,12, 5.4, 2,  88, '#0090FF'),
  'f1-pierre-gasly':     mkF1('f1-pierre-gasly',     'Pierre Gasly',      'GAS', 'Alpine',         0,15,15, 5.9, 2,  64, '#0090FF'),
  'f1-kevin-magnussen':  mkF1('f1-kevin-magnussen',  'Kevin Magnussen',   'MAG', 'Haas',           0,16,16, 6.8, 3,  42, '#B6BABD'),
  'f1-valtteri-bottas':  mkF1('f1-valtteri-bottas',  'Valtteri Bottas',   'BOT', 'Kick Sauber',    0,17,18, 7.2, 1,  28, '#52E252'),
  'f1-guanyu-zhou':      mkF1('f1-guanyu-zhou',      'Zhou Guanyu',       'ZHO', 'Kick Sauber',    0,18,19, 8.1, 1,  12, '#52E252'),
  'f1-alex-albon':       mkF1('f1-alex-albon',       'Alex Albon',        'ALB', 'Williams',       0,15,11, 5.2, 1,  96, '#005AFF'),
  'f1-oliver-bearman':   mkF1('f1-oliver-bearman',   'Oliver Bearman',    'BEA', 'Haas',           0,16,17, 7.4, 1,  38, '#B6BABD'),
  'f1-isack-hadjar':     mkF1('f1-isack-hadjar',     'Isack Hadjar',      'HAD', 'Red Bull',       0,17,20, 7.8, 2,  18, '#1E41FF'),
};

export const UFC_FIGHTERS: Record<string, Team> = {
  // Heavyweight
  'ufc-jon-jones':        mkUFC('ufc-jon-jones',        'Jon Jones',         'JJ',  'Heavyweight',    27, 1, 1, 1, 92,41,1950,'#C8A951'),
  'ufc-stipe-miocic':     mkUFC('ufc-stipe-miocic',     'Stipe Miocic',      'SM',  'Heavyweight',    20, 4, 0, 3, 80,62,1760,'#1A1A2E'),
  'ufc-ciryl-gane':       mkUFC('ufc-ciryl-gane',       'Ciryl Gane',        'CG',  'Heavyweight',    13, 2, 0, 2, 86,58,1820,'#E63946'),
  'ufc-tom-aspinall':     mkUFC('ufc-tom-aspinall',     'Tom Aspinall',      'TA',  'Heavyweight',    15, 3, 0, 2, 88,54,1850,'#264653'),
  // Light Heavyweight
  'ufc-alex-pereira':     mkUFC('ufc-alex-pereira',     'Alex Pereira',      'AP',  'Light Heavyweight',12,2,0, 1, 94,38,1900,'#E9C46A'),
  'ufc-jamahal-hill':     mkUFC('ufc-jamahal-hill',     'Jamahal Hill',      'JH',  'Light Heavyweight',12,3,0, 3, 88,52,1820,'#F4A261'),
  // Middleweight
  'ufc-dricus-duplessis': mkUFC('ufc-dricus-duplessis', 'Dricus Du Plessis', 'DD',  'Middleweight',   22, 2, 0, 1, 90,44,1880,'#2A9D8F'),
  'ufc-israel-adesanya':  mkUFC('ufc-israel-adesanya',  'Israel Adesanya',   'IA',  'Middleweight',   24, 4, 0, 2, 88,46,1860,'#E76F51'),
  'ufc-sean-strickland':  mkUFC('ufc-sean-strickland',  'Sean Strickland',   'SS',  'Middleweight',   29, 5, 0, 3, 80,56,1780,'#457B9D'),
  // Welterweight
  'ufc-leon-edwards':     mkUFC('ufc-leon-edwards',     'Leon Edwards',      'LE',  'Welterweight',   21, 3, 0, 1, 86,50,1850,'#1D3557'),
  'ufc-colby-covington':  mkUFC('ufc-colby-covington',  'Colby Covington',   'CC',  'Welterweight',   18, 4, 0, 2, 82,56,1800,'#E63946'),
  // Lightweight
  'ufc-islam-makhachev':  mkUFC('ufc-islam-makhachev',  'Islam Makhachev',   'IM',  'Lightweight',    26, 1, 0, 1, 92,36,1940,'#023E8A'),
  'ufc-charles-oliveira': mkUFC('ufc-charles-oliveira', 'Charles Oliveira',  'CO',  'Lightweight',    34, 9, 0, 2, 90,48,1900,'#2DC653'),
  'ufc-dustin-poirier':   mkUFC('ufc-dustin-poirier',   'Dustin Poirier',    'DP',  'Lightweight',    30, 8, 0, 3, 84,54,1850,'#E9C46A'),
  // Featherweight
  'ufc-ilia-topuria':     mkUFC('ufc-ilia-topuria',     'Ilia Topuria',      'IT',  'Featherweight',  16, 0, 0, 1, 94,32,1960,'#E63946'),
  'ufc-max-holloway':     mkUFC('ufc-max-holloway',     'Max Holloway',      'MH',  'Featherweight',  26, 7, 0, 2, 90,44,1890,'#1E90FF'),
  // Bantamweight
  'ufc-merab-dvalishvili':mkUFC('ufc-merab-dvalishvili','Merab Dvalishvili', 'MD',  'Bantamweight',   18, 4, 0, 1, 88,48,1860,'#CC0000'),
  'ufc-petr-yan':         mkUFC('ufc-petr-yan',         'Petr Yan',          'PY',  'Bantamweight',   17, 4, 0, 2, 86,52,1840,'#FF6600'),
  // Flyweight
  'ufc-alexandre-pantoja': mkUFC('ufc-alexandre-pantoja','Alexandre Pantoja','APJ', 'Flyweight',      30, 5, 0, 1, 88,42,1870,'#009C3B'),
  // Womens
  'ufc-zhang-weili':      mkUFC('ufc-zhang-weili',      'Zhang Weili',       'ZW',  "Women's Strawweight",24,4,0, 1, 90,40,1890,'#DE2910'),
  'ufc-amanda-nunes':     mkUFC('ufc-amanda-nunes',     'Amanda Nunes',      'AN',  "Women's Bantamweight",22,5,0, 1, 88,44,1860,'#009C3B'),
};

export const ATP_PLAYERS: Record<string, Team> = {
  'atp-carlos-alcaraz':   mkTennis('atp-carlos-alcaraz',   'Carlos Alcaraz',   'ALC', 'ATP', 58,14, 1, 82,76,1920,'#E74C3C'),
  'atp-jannik-sinner':    mkTennis('atp-jannik-sinner',    'Jannik Sinner',    'SIN', 'ATP', 62,10, 2, 84,78,1950,'#2ECC71'),
  'atp-novak-djokovic':   mkTennis('atp-novak-djokovic',   'Novak Djokovic',   'DJO', 'ATP', 55,18, 3, 80,74,1900,'#3498DB'),
  'atp-daniil-medvedev':  mkTennis('atp-daniil-medvedev',  'Daniil Medvedev',  'MED', 'ATP', 48,22, 4, 78,72,1850,'#95A5A6'),
  'atp-alexander-zverev': mkTennis('atp-alexander-zverev', 'Alexander Zverev', 'ZVE', 'ATP', 50,20, 5, 80,70,1870,'#F39C12'),
  'atp-holger-rune':      mkTennis('atp-holger-rune',      'Holger Rune',      'RUN', 'ATP', 42,28, 6, 76,68,1800,'#E91E63'),
  'atp-casper-ruud':      mkTennis('atp-casper-ruud',      'Casper Ruud',      'RUD', 'ATP', 44,24, 7, 74,70,1810,'#009900'),
  'atp-andrey-rublev':    mkTennis('atp-andrey-rublev',    'Andrey Rublev',    'RBL', 'ATP', 46,22, 8, 76,68,1820,'#CC0000'),
  'atp-stefanos-tsitsipas':mkTennis('atp-stefanos-tsitsipas','Stefanos Tsitsipas','TSI','ATP',48,20, 9, 78,70,1840,'#0D47A1'),
  'atp-taylor-fritz':     mkTennis('atp-taylor-fritz',     'Taylor Fritz',     'FRI', 'ATP', 42,26,10, 74,68,1800,'#B22222'),
};

export const WTA_PLAYERS: Record<string, Team> = {
  'wta-aryna-sabalenka':  mkTennis('wta-aryna-sabalenka',  'Aryna Sabalenka',  'SAB', 'WTA', 60,12, 1, 86,78,1940,'#CC0000'),
  'wta-iga-swiatek':      mkTennis('wta-iga-swiatek',      'Iga Swiatek',      'SWI', 'WTA', 65, 8, 2, 88,80,1970,'#E91E63'),
  'wta-coco-gauff':       mkTennis('wta-coco-gauff',       'Coco Gauff',       'GAU', 'WTA', 54,16, 3, 82,74,1890,'#003399'),
  'wta-jessica-pegula':   mkTennis('wta-jessica-pegula',   'Jessica Pegula',   'PEG', 'WTA', 48,20, 4, 78,70,1840,'#0000CC'),
  'wta-elena-rybakina':   mkTennis('wta-elena-rybakina',   'Elena Rybakina',   'RYB', 'WTA', 52,18, 5, 82,72,1870,'#009900'),
  'wta-qinwen-zheng':     mkTennis('wta-qinwen-zheng',     'Qinwen Zheng',     'ZHQ', 'WTA', 46,22, 6, 78,70,1820,'#DE2910'),
  'wta-barbora-krejcikova':mkTennis('wta-barbora-krejcikova','Barbora Krejcikova','KRE','WTA',44,24, 7, 76,70,1800,'#CC0000'),
  'wta-madison-keys':     mkTennis('wta-madison-keys',     'Madison Keys',     'KEY', 'WTA', 42,26, 8, 74,68,1790,'#B22222'),
  'wta-elena-ostapenko':  mkTennis('wta-elena-ostapenko',  'Elena Ostapenko',  'OST', 'WTA', 40,28, 9, 72,66,1760,'#8B0000'),
  'wta-jasmine-paolini':  mkTennis('wta-jasmine-paolini',  'Jasmine Paolini',  'PAO', 'WTA', 44,24,10, 76,68,1800,'#009246'),
};

export const NCAAF_TEAMS: Record<string, Team> = {
  'ncaaf-georgia':         mkNCAA_FB('ncaaf-georgia',         'Georgia Bulldogs',     'UGA', 'SEC',          13,1, 1,38.2,14.8,1890,'#BA0C2F'),
  'ncaaf-ohio-state':      mkNCAA_FB('ncaaf-ohio-state',      'Ohio State Buckeyes',  'OSU', 'Big Ten',      12,2, 2,40.1,18.2,1870,'#BB0000'),
  'ncaaf-michigan':        mkNCAA_FB('ncaaf-michigan',        'Michigan Wolverines',  'MICH','Big Ten',      11,2, 3,34.8,17.4,1840,'#00274C'),
  'ncaaf-alabama':         mkNCAA_FB('ncaaf-alabama',         'Alabama Crimson Tide', 'ALA', 'SEC',          11,2, 4,36.4,16.8,1850,'#9E1B32'),
  'ncaaf-texas':           mkNCAA_FB('ncaaf-texas',           'Texas Longhorns',      'TEX', 'SEC',          12,1, 5,38.8,17.2,1860,'#BF5700'),
  'ncaaf-florida-state':   mkNCAA_FB('ncaaf-florida-state',   'Florida State Seminoles','FSU','ACC',         10,3, 6,32.4,18.8,1800,'#782F40'),
  'ncaaf-penn-state':      mkNCAA_FB('ncaaf-penn-state',      'Penn State Nittany Lions','PSU','Big Ten',    11,2, 7,34.2,17.8,1820,'#041E42'),
  'ncaaf-oregon':          mkNCAA_FB('ncaaf-oregon',          'Oregon Ducks',         'ORE', 'Big Ten',      12,1, 3,40.4,17.0,1860,'#154733'),
  'ncaaf-notre-dame':      mkNCAA_FB('ncaaf-notre-dame',      'Notre Dame Fighting Irish','ND','Independent',11,2, 8,33.8,18.2,1810,'#0C2340'),
  'ncaaf-lsu':             mkNCAA_FB('ncaaf-lsu',             'LSU Tigers',           'LSU', 'SEC',          10,3, 9,34.6,19.4,1790,'#461D7C'),
  'ncaaf-clemson':         mkNCAA_FB('ncaaf-clemson',         'Clemson Tigers',       'CLEM','ACC',          11,2,10,33.2,18.6,1800,'#F66733'),
  'ncaaf-byu':             mkNCAA_FB('ncaaf-byu',             'BYU Cougars',          'BYU', 'Big 12',       11,2,11,34.8,19.8,1790,'#002E5D'),
  'ncaaf-ole-miss':        mkNCAA_FB('ncaaf-ole-miss',        'Ole Miss Rebels',      'OM',  'SEC',          10,3,12,36.2,20.4,1780,'#CE1126'),
  'ncaaf-miami-fl':        mkNCAA_FB('ncaaf-miami-fl',        'Miami Hurricanes',     'UM',  'ACC',          10,3,13,34.4,20.8,1760,'#005030'),
  'ncaaf-indiana':         mkNCAA_FB('ncaaf-indiana',         'Indiana Hoosiers',     'IND', 'Big Ten',      11,2,14,32.8,18.4,1800,'#990000'),
  'ncaaf-iowa-state':      mkNCAA_FB('ncaaf-iowa-state',      'Iowa State Cyclones',  'ISU', 'Big 12',       10,3,15,30.4,20.2,1760,'#C8102E'),
  'ncaaf-kansas-state':    mkNCAA_FB('ncaaf-kansas-state',    'Kansas State Wildcats','KSU', 'Big 12',        9,4,16,28.8,21.4,1720,'#512888'),
  'ncaaf-tennessee':       mkNCAA_FB('ncaaf-tennessee',       'Tennessee Volunteers', 'TENN','SEC',           9,4,17,32.2,21.8,1710,'#FF8200'),
  'ncaaf-south-carolina':  mkNCAA_FB('ncaaf-south-carolina',  'South Carolina Gamecocks','USC','SEC',         8,5,18,28.4,23.2,1680,'#73000A'),
  'ncaaf-tulane':          mkNCAA_FB('ncaaf-tulane',          'Tulane Green Wave',    'TUL', 'AAC',           9,4,19,30.8,22.4,1700,'#006341'),
  'ncaaf-arizona-state':   mkNCAA_FB('ncaaf-arizona-state',   'Arizona State Sun Devils','ASU','Big 12',      9,4,20,28.6,22.8,1690,'#8C1D40'),
  'ncaaf-miami-oh':        mkNCAA_FB('ncaaf-miami-oh',        'Miami RedHawks (OH)',  'MU',  'MAC',           9,4,21,26.8,21.4,1680,'#B61E2E'),
  'ncaaf-colorado':        mkNCAA_FB('ncaaf-colorado',        'Colorado Buffaloes',   'CU',  'Big 12',        9,4,22,30.2,23.4,1690,'#CFB87C'),
  'ncaaf-boise-state':     mkNCAA_FB('ncaaf-boise-state',     'Boise State Broncos',  'BSU', 'Mountain West',10,3,23,32.4,20.8,1720,'#0033A0'),
  'ncaaf-arkansas':        mkNCAA_FB('ncaaf-arkansas',        'Arkansas Razorbacks',  'ARK', 'SEC',           8,5,24,28.8,24.2,1660,'#9D2235'),
};

export const NCAAB_TEAMS: Record<string, Team> = {
  'ncaab-duke':            mkNCAA_BB('ncaab-duke',            'Duke Blue Devils',     'DUKE','ACC',           30,5, 1,86.4,64.2,1880,'#003087'),
  'ncaab-kentucky':        mkNCAA_BB('ncaab-kentucky',        'Kentucky Wildcats',    'UK',  'SEC',           28,7, 2,84.8,65.8,1860,'#0033A0'),
  'ncaab-kansas':          mkNCAA_BB('ncaab-kansas',          'Kansas Jayhawks',      'KU',  'Big 12',        29,6, 3,84.2,66.4,1850,'#0051A5'),
  'ncaab-north-carolina':  mkNCAA_BB('ncaab-north-carolina',  'North Carolina Tar Heels','UNC','ACC',         27,8, 4,82.8,67.2,1830,'#7BAFD4'),
  'ncaab-gonzaga':         mkNCAA_BB('ncaab-gonzaga',         'Gonzaga Bulldogs',     'GONZ','WCC',           30,4, 5,88.4,63.8,1890,'#002469'),
  'ncaab-uconn':           mkNCAA_BB('ncaab-uconn',           'UConn Huskies',        'CONN','Big East',      29,6, 6,84.6,65.4,1860,'#000E2F'),
  'ncaab-houston':         mkNCAA_BB('ncaab-houston',         'Houston Cougars',      'HOU', 'Big 12',        28,7, 7,82.4,66.8,1840,'#C8102E'),
  'ncaab-auburn':          mkNCAA_BB('ncaab-auburn',          'Auburn Tigers',        'AUB', 'SEC',           27,8, 8,80.8,67.4,1820,'#F26522'),
  'ncaab-purdue':          mkNCAA_BB('ncaab-purdue',          'Purdue Boilermakers',  'PUR', 'Big Ten',       27,8, 9,82.2,68.2,1820,'#CEB888'),
  'ncaab-tennessee':       mkNCAA_BB('ncaab-tennessee',       'Tennessee Volunteers', 'TENN','SEC',           26,9,10,80.4,68.8,1800,'#FF8200'),
  'ncaab-iowa-state':      mkNCAA_BB('ncaab-iowa-state',      'Iowa State Cyclones',  'ISU', 'Big 12',        26,9,11,82.8,69.2,1810,'#C8102E'),
  'ncaab-marquette':       mkNCAA_BB('ncaab-marquette',       'Marquette Golden Eagles','MU','Big East',      25,10,12,80.2,70.4,1790,'#003366'),
  'ncaab-baylor':          mkNCAA_BB('ncaab-baylor',          'Baylor Bears',         'BAY', 'Big 12',        24,11,13,78.8,70.8,1770,'#003015'),
  'ncaab-michigan-state':  mkNCAA_BB('ncaab-michigan-state',  'Michigan State Spartans','MSU','Big Ten',      24,11,14,78.4,71.2,1760,'#18453B'),
  'ncaab-arizona':         mkNCAA_BB('ncaab-arizona',         'Arizona Wildcats',     'ARIZ','Big 12',        24,11,15,80.4,71.4,1770,'#CC0033'),
  'ncaab-creighton':       mkNCAA_BB('ncaab-creighton',       'Creighton Bluejays',   'CRE', 'Big East',      24,11,16,80.8,71.8,1770,'#005CA9'),
  'ncaab-illinois':        mkNCAA_BB('ncaab-illinois',        'Illinois Fighting Illini','ILL','Big Ten',     23,12,17,78.2,71.6,1750,'#E84A27'),
  'ncaab-ucla':            mkNCAA_BB('ncaab-ucla',            'UCLA Bruins',          'UCLA','Big Ten',       23,12,18,78.8,72.2,1750,'#2D68C4'),
  'ncaab-wisconsin':       mkNCAA_BB('ncaab-wisconsin',       'Wisconsin Badgers',    'WIS', 'Big Ten',       22,13,19,76.4,72.8,1720,'#C5050C'),
  'ncaab-st-johns':        mkNCAA_BB('ncaab-st-johns',        "St. John's Red Storm", 'SJU', 'Big East',      23,12,20,78.4,72.4,1740,'#BA0C2F'),
  'ncaab-cincinnati':      mkNCAA_BB('ncaab-cincinnati',      'Cincinnati Bearcats',  'CIN', 'Big 12',        22,13,21,76.8,73.2,1720,'#E00122'),
  'ncaab-mississippi-state':mkNCAA_BB('ncaab-mississippi-state','Mississippi State Bulldogs','MST','SEC',    21,14,22,76.2,73.8,1700,'#660000'),
  'ncaab-memphis':         mkNCAA_BB('ncaab-memphis',         'Memphis Tigers',       'MEM', 'AAC',           22,13,23,78.8,73.4,1720,'#003087'),
  'ncaab-sdsu':            mkNCAA_BB('ncaab-sdsu',            'San Diego State Aztecs','SDSU','Mountain West',21,14,24,74.8,74.2,1700,'#A6192E'),
  'ncaab-tcu':             mkNCAA_BB('ncaab-tcu',             'TCU Horned Frogs',     'TCU', 'Big 12',        20,15,25,76.4,74.8,1680,'#4D1979'),
  'ncaab-texas-tech':      mkNCAA_BB('ncaab-texas-tech',      'Texas Tech Red Raiders','TTU','Big 12',        20,15,26,74.2,74.6,1670,'#CC0000'),
  'ncaab-indiana':         mkNCAA_BB('ncaab-indiana',         'Indiana Hoosiers',     'IU',  'Big Ten',       19,16,27,74.8,75.4,1660,'#990000'),
  'ncaab-florida':         mkNCAA_BB('ncaab-florida',         'Florida Gators',       'FLA', 'SEC',           20,15,28,76.2,75.2,1670,'#0021A5'),
  'ncaab-utah-state':      mkNCAA_BB('ncaab-utah-state',      'Utah State Aggies',    'USU', 'Mountain West', 22,13,29,78.4,73.8,1720,'#00263A'),
  'ncaab-oregon':          mkNCAA_BB('ncaab-oregon',          'Oregon Ducks',         'ORE', 'Big Ten',       21,14,30,76.8,74.4,1700,'#154733'),
  'ncaab-villanova':       mkNCAA_BB('ncaab-villanova',       'Villanova Wildcats',   'VILL','Big East',      20,15,31,74.4,75.2,1670,'#00205B'),
  'ncaab-florida-atlantic':mkNCAA_BB('ncaab-florida-atlantic','Florida Atlantic Owls','FAU', 'AAC',           22,13,32,78.2,73.6,1720,'#003366'),
};
