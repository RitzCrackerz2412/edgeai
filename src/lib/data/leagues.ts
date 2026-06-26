import type { LeagueData, LeagueStanding, LeagueFixture } from '../types';

// ── Helper ────────────────────────────────────────────────────────────────────
// st(rank, teamId, teamName, abbr, color, gp, w, d, l, pts, gf, ga, last5, streak)
const st = (
  rank: number, teamId: string, teamName: string, abbr: string, color: string,
  gp: number, w: number, d: number, l: number, pts: number, gf: number, ga: number,
  last5: ('W'|'L'|'D')[], streak: string,
): LeagueStanding => ({
  rank, teamId, teamName, abbreviation: abbr, color,
  gp, w, d, l, pts, gf, ga, gd: gf - ga,
  winPct: parseFloat(((w + d * 0.5) / gp).toFixed(3)),
  last5, streak,
});

// Fixture helper: fx(home, ha, hc, away, aa, ac, date, hs?, as?, status)
const fx = (
  home: string, ha: string, hc: string,
  away: string, aa: string, ac: string,
  date: string,
  hs?: number, as_?: number,
  status: 'Upcoming'|'Final' = 'Upcoming',
): LeagueFixture => ({ home, homeAbbr: ha, homeColor: hc, away, awayAbbr: aa, awayColor: ac,
  homeScore: hs, awayScore: as_, date, status });

// ── Premier League ────────────────────────────────────────────────────────────
const eplStandings: LeagueStanding[] = [
  st( 1,'epl-arsenal',       'Arsenal',             'ARS','#EF0107',  38,27, 5, 6, 86,78,38,['W','W','W','W','W'],'W5'),
  st( 2,'epl-liverpool',     'Liverpool',           'LIV','#C8102E',  38,26, 5, 7, 83,82,34,['W','W','D','W','W'],'W4'),
  st( 3,'epl-chelsea',       'Chelsea',             'CHE','#034694',  38,24, 4,10, 76,74,28,['W','W','L','W','W'],'W2'),
  st( 4,'epl-tottenham',     'Tottenham Hotspur',   'TOT','#132257',  38,22, 6,10, 72,68,22,['W','D','W','L','W'],'W1'),
  st( 5,'epl-mancity',       'Manchester City',     'MCI','#6CABDD',  38,22, 5,11, 71,64,18,['L','W','W','W','W'],'W3'),
  st( 6,'epl-newcastle',     'Newcastle United',    'NEW','#241F20',  38,20, 8,10, 68,58,20,['W','W','D','W','L'],'L1'),
  st( 7,'epl-manutd',        'Manchester United',   'MUN','#DA291C',  38,20, 5,13, 65,58,14,['W','D','W','L','W'],'W1'),
  st( 8,'epl-astonvilla',    'Aston Villa',         'AVL','#670E36',  38,18, 8,12, 62,56,10,['L','W','W','D','W'],'W2'),
  st( 9,'epl-westham',       'West Ham United',     'WHU','#7A263A',  38,17, 7,14, 58,52, 8,['W','L','D','W','L'],'L1'),
  st(10,'epl-brighton',      'Brighton',            'BHA','#0057B8',  38,16, 8,14, 56,51,10,['D','W','D','W','D'],'D1'),
  st(11,'epl-fulham',        'Fulham',              'FUL','#CC0000',  38,16, 6,16, 54,48, 4,['W','L','W','W','L'],'L1'),
  st(12,'epl-nottmforest',   "Nottingham Forest",   'NFO','#DD0000',  38,13, 8,17, 47,42,10,['D','L','W','D','W'],'W1'),
  st(13,'epl-crystalpalace', 'Crystal Palace',      'CRY','#1B458F',  38,14, 8,16, 50,44, 4,['L','L','W','W','D'],'D1'),
  st(14,'epl-bournemouth',   'AFC Bournemouth',     'BOU','#DA291C',  38,11, 8,19, 41,41,-8,['W','L','D','L','L'],'L2'),
  st(15,'epl-brentford',     'Brentford',           'BRE','#E30613',  38,14, 6,18, 48,48, 0,['W','D','L','W','L'],'L1'),
  st(16,'epl-everton',       'Everton',             'EVE','#003399',  38,11,10,17, 43,40,-4,['D','L','W','D','D'],'D1'),
  st(17,'epl-wolves',        'Wolverhampton',       'WOL','#FDB913',  38,11, 9,18, 42,38,-8,['L','W','D','L','W'],'W1'),
  st(18,'epl-leicester',     'Leicester City',      'LEI','#003090',  38, 9, 9,20, 36,34,-18,['L','D','L','L','W'],'W1'),
  st(19,'epl-ipswich',       'Ipswich Town',        'IPS','#3A64A3',  38, 8, 9,21, 33,32,-22,['L','L','D','L','L'],'L3'),
  st(20,'epl-southampton',   'Southampton',         'SOU','#D71920',  38, 6, 6,26, 24,22,-34,['L','L','L','D','L'],'L3'),
];

const eplFixtures: LeagueFixture[] = [
  fx('Arsenal','ARS','#EF0107','Tottenham Hotspur','TOT','#132257','2026-07-05'),
  fx('Liverpool','LIV','#C8102E','Chelsea','CHE','#034694','2026-07-05'),
  fx('Manchester City','MCI','#6CABDD','Newcastle United','NEW','#241F20','2026-07-06'),
  fx('Manchester United','MUN','#DA291C','Brighton','BHA','#0057B8','2026-07-06'),
  fx('Aston Villa','AVL','#670E36','West Ham United','WHU','#7A263A','2026-07-07'),
  // Recent
  fx('Arsenal','ARS','#EF0107','Manchester City','MCI','#6CABDD','2026-06-22',2,0,'Final'),
  fx('Liverpool','LIV','#C8102E','Tottenham Hotspur','TOT','#132257','2026-06-21',3,1,'Final'),
  fx('Chelsea','CHE','#034694','Newcastle United','NEW','#241F20','2026-06-21',1,1,'Final'),
];

// ── La Liga ───────────────────────────────────────────────────────────────────
const laligaStandings: LeagueStanding[] = [
  st( 1,'lla-realmadrid', 'Real Madrid',      'RMA','#FEBE10',38,28, 0,10, 84,88,28,['W','W','W','W','W'],'W8'),
  st( 2,'lla-barcelona',  'Barcelona',        'FCB','#A50044',38,27, 1,10, 82,86,30,['W','W','W','D','W'],'W3'),
  st( 3,'lla-atletico',   'Atletico Madrid',  'ATM','#CB3524',38,25, 0,13, 75,72,22,['W','W','L','W','W'],'W2'),
  st( 4,'lla-athletic',   'Athletic Bilbao',  'ATH','#EE2523',38,23, 1,14, 70,64,18,['W','D','W','L','W'],'W1'),
  st( 5,'lla-sociedad',   'Real Sociedad',    'RSO','#0067B1',38,22, 1,15, 67,58,14,['D','W','W','W','L'],'L1'),
  st( 6,'lla-villarreal', 'Villarreal',       'VIL','#FFD700',38,20, 5,13, 65,58,12,['W','W','D','W','D'],'D1'),
  st( 7,'lla-sevilla',    'Sevilla',          'SEV','#D40511',38,19, 3,16, 60,52, 4,['L','W','W','L','W'],'W1'),
  st( 8,'lla-valencia',   'Valencia',         'VAL','#FF6900',38,18, 1,19, 55,48,-2,['W','L','D','W','L'],'L1'),
  st( 9,'lla-betis',      'Real Betis',       'BET','#1A7F37',38,17, 3,18, 54,47,-2,['W','W','D','L','W'],'W1'),
  st(10,'lla-girona',     'Girona',           'GIR','#CD1414',38,16, 4,18, 52,48,-4,['D','W','L','W','D'],'D1'),
  st(11,'lla-celtavigo',  'Celta Vigo',       'CEL','#7BBAD6',38,15, 5,18, 50,44,-6,['L','W','D','W','W'],'W2'),
  st(12,'lla-rayo',       'Rayo Vallecano',   'RAY','#E63027',38,14, 6,18, 48,42,-8,['D','L','W','W','D'],'D1'),
  st(13,'lla-espanyol',   'Espanyol',         'ESP','#0070B8',38,14, 3,21, 45,38,-12,['W','L','L','W','L'],'L1'),
  st(14,'lla-laspalmas',  'Las Palmas',       'LPM','#FFD700',38,13, 3,22, 42,34,-16,['L','W','D','L','L'],'L2'),
  st(15,'lla-getafe',     'Getafe',           'GET','#003DA5',38,12, 4,22, 40,32,-18,['D','L','W','D','L'],'L1'),
  st(16,'lla-mallorca',   'Mallorca',         'MLL','#DA000D',38,12, 3,23, 39,30,-18,['L','W','D','L','D'],'D1'),
  st(17,'lla-osasuna',    'Osasuna',          'OSA','#D4021D',38,11, 5,22, 38,28,-20,['L','D','L','W','L'],'L1'),
  st(18,'lla-leganes',    'Leganes',          'LEG','#004B8D',38,10, 5,23, 35,26,-24,['D','L','L','D','L'],'L2'),
  st(19,'lla-alaves',     'Alaves',           'ALA','#0056A5',38,10, 4,24, 34,24,-26,['L','D','L','L','D'],'D1'),
  st(20,'lla-valladolid', 'Valladolid',       'VLD','#711C8B',38, 8, 6,24, 30,20,-30,['L','L','D','L','L'],'L3'),
];

const laligaFixtures: LeagueFixture[] = [
  fx('Real Madrid','RMA','#FEBE10','Barcelona','FCB','#A50044','2026-07-04'),
  fx('Atletico Madrid','ATM','#CB3524','Athletic Bilbao','ATH','#EE2523','2026-07-04'),
  fx('Real Sociedad','RSO','#0067B1','Villarreal','VIL','#FFD700','2026-07-05'),
  fx('Barcelona','FCB','#A50044','Sevilla','SEV','#D40511','2026-07-05'),
  fx('Real Madrid','RMA','#FEBE10','Atletico Madrid','ATM','#CB3524','2026-06-20',3,1,'Final'),
  fx('Barcelona','FCB','#A50044','Real Sociedad','RSO','#0067B1','2026-06-21',4,0,'Final'),
];

// ── Bundesliga ────────────────────────────────────────────────────────────────
const bundesligaStandings: LeagueStanding[] = [
  st( 1,'bun-bayernmunich', 'Bayern Munich',      'BAY','#DC052D',34,26, 4, 4, 82,96,22,['W','W','W','W','W'],'W6'),
  st( 2,'bun-leverkusen',   'Bayer Leverkusen',   'B04','#E32221',34,24, 5, 5, 77,88,20,['W','W','D','W','W'],'W3'),
  st( 3,'bun-leipzig',      'RB Leipzig',         'RBL','#DD0741',34,22, 4, 8, 70,76,18,['W','W','L','W','D'],'D1'),
  st( 4,'bun-dortmund',     'Borussia Dortmund',  'BVB','#FDE100',34,21, 1,12, 64,72,14,['L','W','W','W','L'],'L1'),
  st( 5,'bun-frankfurt',    'Eintracht Frankfurt','SGE','#E1000F',34,20, 2,12, 62,66,12,['W','D','W','L','W'],'W1'),
  st( 6,'bun-freiburg',     'SC Freiburg',        'SCF','#E30012',34,18, 4,12, 58,58, 8,['W','W','D','W','L'],'L1'),
  st( 7,'bun-wolfsburg',    'Wolfsburg',          'WOB','#64A139',34,17, 4,13, 55,54, 4,['D','W','W','L','W'],'W1'),
  st( 8,'bun-hoffenheim',   'Hoffenheim',         'TSG','#1463AF',34,16, 3,15, 51,52, 2,['W','L','D','W','L'],'L1'),
  st( 9,'bun-gladbach',     "Borussia M'gladbach",'BMG','#000000',34,15, 5,14, 50,50, 0,['D','W','D','L','W'],'W1'),
  st(10,'bun-unionberlin',  'Union Berlin',       'UNB','#EB1923',34,14, 6,14, 48,48,-2,['L','D','W','W','D'],'D1'),
  st(11,'bun-mainz',        'Mainz 05',           'M05','#C3002F',34,14, 5,15, 47,46,-2,['W','L','D','D','W'],'W1'),
  st(12,'bun-augsburg',     'Augsburg',           'FCA','#BA3733',34,13, 5,16, 44,44,-4,['D','W','L','L','D'],'D1'),
  st(13,'bun-werderbremen', 'Werder Bremen',      'SVW','#1D9053',34,12, 7,15, 43,42,-4,['L','D','W','D','L'],'L1'),
  st(14,'bun-stuttgart',    'VfB Stuttgart',      'VFB','#E32219',34,12, 6,16, 42,40,-6,['W','L','D','L','W'],'W1'),
  st(15,'bun-bochum',       'VfL Bochum',         'BOC','#005CAB',34,11, 7,16, 40,38,-8,['D','L','W','D','L'],'L1'),
  st(16,'bun-heidenheim',   'Heidenheim',         'HEI','#CC231A',34,10, 8,16, 38,36,-10,['L','D','D','W','L'],'L1'),
  st(17,'bun-cologne',      'Cologne',            'KOE','#ED1C24',34, 9, 8,17, 35,32,-14,['D','L','L','D','W'],'W1'),
  st(18,'bun-kiel',         'Holstein Kiel',      'KSV','#004B9D',34, 7, 9,18, 30,28,-20,['L','D','L','L','D'],'D1'),
];

const bundesligaFixtures: LeagueFixture[] = [
  fx('Bayern Munich','BAY','#DC052D','Bayer Leverkusen','B04','#E32221','2026-07-04'),
  fx('Borussia Dortmund','BVB','#FDE100','RB Leipzig','RBL','#DD0741','2026-07-05'),
  fx('Bayern Munich','BAY','#DC052D','Borussia Dortmund','BVB','#FDE100','2026-06-21',3,2,'Final'),
  fx('Bayer Leverkusen','B04','#E32221','Eintracht Frankfurt','SGE','#E1000F','2026-06-22',2,0,'Final'),
];

// ── Serie A ───────────────────────────────────────────────────────────────────
const serieaStandings: LeagueStanding[] = [
  st( 1,'sea-inter',      'Inter Milan',   'INT','#0C1A80',38,29, 6, 3, 93,88,52,['W','W','W','D','W'],'W3'),
  st( 2,'sea-napoli',     'Napoli',        'NAP','#12A0C7',38,27, 4, 7, 85,82,40,['W','W','L','W','W'],'W2'),
  st( 3,'sea-juventus',   'Juventus',      'JUV','#000000',38,25, 6, 7, 81,74,36,['D','W','W','W','L'],'L1'),
  st( 4,'sea-milan',      'AC Milan',      'MIL','#FB090B',38,24, 6, 8, 78,70,28,['W','W','D','W','W'],'W3'),
  st( 5,'sea-atalanta',   'Atalanta',      'ATA','#1C50A0',38,23, 6, 9, 75,72,26,['W','W','W','L','D'],'D1'),
  st( 6,'sea-roma',       'Roma',          'ROM','#8B1B1B',38,21, 5,12, 68,62,14,['L','W','W','W','W'],'W4'),
  st( 7,'sea-lazio',      'Lazio',         'LAZ','#87D8F7',38,20, 5,13, 65,58,10,['W','D','L','W','W'],'W2'),
  st( 8,'sea-fiorentina', 'Fiorentina',    'FIO','#5D2A8C',38,18, 8,12, 62,54, 8,['D','W','D','W','L'],'L1'),
  st( 9,'sea-torino',     'Torino',        'TOR','#780000',38,17, 4,17, 55,48, 2,['W','L','W','D','L'],'L1'),
  st(10,'sea-bologna',    'Bologna',       'BOL','#1A2A6C',38,16, 6,16, 54,46, 2,['D','W','L','W','D'],'D1'),
  st(11,'sea-genoa',      'Genoa',         'GEN','#003DA5',38,15, 6,17, 51,42,-2,['W','L','D','W','L'],'L1'),
  st(12,'sea-udinese',    'Udinese',       'UDI','#000000',38,14, 6,18, 48,38,-6,['L','D','W','L','W'],'W1'),
  st(13,'sea-lecce',      'Lecce',         'LEC','#FFCC00',38,13, 6,19, 45,34,-8,['D','L','W','D','L'],'L1'),
  st(14,'sea-verona',     'Verona',        'VER','#004B9D',38,12, 6,20, 42,30,-12,['L','W','D','L','D'],'D1'),
  st(15,'sea-cagliari',   'Cagliari',      'CAG','#1D1160',38,11, 8,19, 41,28,-10,['W','D','L','D','L'],'L1'),
  st(16,'sea-empoli',     'Empoli',        'EMP','#0BA3DC',38,11, 7,20, 40,26,-12,['L','D','W','L','D'],'D1'),
  st(17,'sea-monza',      'Monza',         'MON','#ED1C24',38,10, 8,20, 38,24,-14,['D','L','D','W','L'],'L1'),
  st(18,'sea-venezia',    'Venezia',       'VEN','#000000',38, 9, 9,20, 36,22,-14,['L','D','L','D','W'],'W1'),
  st(19,'sea-parma',      'Parma',         'PAR','#FFDD00',38, 9, 7,22, 34,20,-18,['L','L','D','L','W'],'W1'),
  st(20,'sea-como',       'Como',          'COM','#004B8D',38, 8, 9,21, 33,18,-18,['D','L','D','L','L'],'L2'),
];

const serieaFixtures: LeagueFixture[] = [
  fx('Inter Milan','INT','#0C1A80','Napoli','NAP','#12A0C7','2026-07-05'),
  fx('Juventus','JUV','#000000','AC Milan','MIL','#FB090B','2026-07-05'),
  fx('Inter Milan','INT','#0C1A80','AC Milan','MIL','#FB090B','2026-06-22',2,1,'Final'),
  fx('Napoli','NAP','#12A0C7','Roma','ROM','#8B1B1B','2026-06-21',3,0,'Final'),
];

// ── Ligue 1 ───────────────────────────────────────────────────────────────────
const ligue1Standings: LeagueStanding[] = [
  st( 1,'lg1-psg',         'Paris Saint-Germain','PSG','#004170',34,27, 5, 2, 86,98,54,['W','W','W','W','W'],'W9'),
  st( 2,'lg1-monaco',      'Monaco',             'MON','#BD0020',34,23, 5, 6, 74,76,30,['W','W','D','W','L'],'L1'),
  st( 3,'lg1-marseille',   'Marseille',          'MAR','#2FAEE0',34,22, 4, 8, 70,68,24,['W','W','W','L','W'],'W2'),
  st( 4,'lg1-lyon',        'Lyon',               'LYN','#CC0000',34,20, 6, 8, 66,62,18,['D','W','W','W','L'],'L1'),
  st( 5,'lg1-lens',        'Lens',               'LEN','#FFCC00',34,19, 5,10, 62,58,14,['W','W','D','L','W'],'W1'),
  st( 6,'lg1-rennes',      'Rennes',             'REN','#DA291C',34,18, 5,11, 59,54,10,['L','W','W','D','W'],'W2'),
  st( 7,'lg1-brest',       'Brest',              'BRE','#E2001A',34,17, 6,11, 57,50, 8,['W','D','W','W','L'],'L1'),
  st( 8,'lg1-lille',       'Lille',              'LIL','#E8000A',34,16, 7,11, 55,46, 6,['D','W','D','W','W'],'W2'),
  st( 9,'lg1-nice',        'Nice',               'NIC','#E21A1A',34,16, 6,12, 54,44, 4,['W','L','W','D','W'],'W1'),
  st(10,'lg1-nantes',      'Nantes',             'NAN','#F6C906',34,14, 8,12, 50,40, 0,['D','W','L','D','W'],'W1'),
  st(11,'lg1-toulouse',    'Toulouse',           'TLS','#542188',34,14, 6,14, 48,38,-2,['W','L','D','W','L'],'L1'),
  st(12,'lg1-montpellier', 'Montpellier',        'MPL','#F47920',34,13, 6,15, 45,34,-4,['L','W','D','L','W'],'W1'),
  st(13,'lg1-reims',       'Reims',              'REI','#DA291C',34,12, 8,14, 44,32,-4,['D','D','W','L','D'],'D1'),
  st(14,'lg1-strasbourg',  'Strasbourg',         'STR','#1C3B7A',34,12, 6,16, 42,30,-8,['L','W','D','L','W'],'W1'),
  st(15,'lg1-saintetienne','Saint-Etienne',      'STE','#007931',34,11, 7,16, 40,28,-10,['D','L','W','D','L'],'L1'),
  st(16,'lg1-lorient',     'Lorient',            'FCL','#F47920',34,10, 7,17, 37,24,-12,['L','D','L','W','D'],'D1'),
  st(17,'lg1-metz',        'Metz',               'FCM','#820A14',34, 9, 7,18, 34,22,-14,['L','L','D','L','W'],'W1'),
  st(18,'lg1-auxerre',     'Auxerre',            'AUX','#E2001A',34, 8, 6,20, 30,18,-18,['L','D','L','L','D'],'D1'),
];

const ligue1Fixtures: LeagueFixture[] = [
  fx('Paris Saint-Germain','PSG','#004170','Monaco','MON','#BD0020','2026-07-05'),
  fx('Marseille','MAR','#2FAEE0','Lyon','LYN','#CC0000','2026-07-04'),
  fx('PSG','PSG','#004170','Monaco','MON','#BD0020','2026-06-22',3,1,'Final'),
];

// ── MLS Eastern Conference ────────────────────────────────────────────────────
const mlsEastStandings: LeagueStanding[] = [
  st( 1,'mls-intermiami',   'Inter Miami CF',       'MIA','#F7B5CD',34,22, 6, 6, 72,68,22,['W','W','W','D','W'],'W3'),
  st( 2,'mls-columbus',     'Columbus Crew',        'CLB','#FFF200',34,19, 7, 8, 64,58,14,['W','D','W','L','W'],'W1'),
  st( 3,'mls-atlanta',      'Atlanta United',       'ATL','#80000A',34,18, 7, 9, 61,54,10,['W','W','L','D','W'],'W1'),
  st( 4,'mls-philly',       'Philadelphia Union',   'PHI','#071B3A',34,17, 8, 9, 59,50, 8,['D','W','W','W','L'],'L1'),
  st( 5,'mls-nycfc',        'New York City FC',     'NYC','#6CACE4',34,17, 7,10, 58,48, 8,['W','L','D','W','W'],'W2'),
  st( 6,'mls-nashville',    'Nashville SC',         'NSH','#ECE83A',34,16, 8,10, 56,46, 6,['D','W','W','L','D'],'D1'),
  st( 7,'mls-newengland',   'New England Revolution','NE','#C63323',34,15, 8,11, 53,42, 4,['W','D','L','W','W'],'W2'),
  st( 8,'mls-toronto',      'Toronto FC',           'TOR','#B81137',34,14, 9,11, 51,38, 2,['L','W','D','W','D'],'D1'),
  st( 9,'mls-fccincinnati', 'FC Cincinnati',        'CIN','#F05323',34,14, 8,12, 50,36, 0,['W','L','W','D','L'],'L1'),
  st(10,'mls-charlotte',    'Charlotte FC',         'CLT','#1A85C8',34,13, 9,12, 48,34,-2,['D','W','L','D','W'],'W1'),
  st(11,'mls-nyredbulls',   'New York Red Bulls',   'RBY','#ED1F26',34,13, 8,13, 47,32,-4,['L','D','W','W','L'],'L1'),
  st(12,'mls-chicago',      'Chicago Fire',         'CHI','#9A1724',34,12, 9,13, 45,30,-6,['W','D','D','L','W'],'W1'),
  st(13,'mls-dcunited',     'DC United',            'DCU','#000000',34,11, 9,14, 42,28,-8,['D','L','W','D','L'],'L1'),
  st(14,'mls-orlando',      'Orlando City',         'ORL','#633492',34,11, 8,15, 41,26,-10,['L','W','D','L','D'],'D1'),
  st(15,'mls-montreal',     'CF Montreal',          'MTL','#003DA5',34,10, 8,16, 38,22,-12,['L','D','L','W','L'],'L2'),
];

const mlsWestStandings: LeagueStanding[] = [
  st( 1,'mls-lafc',         'LAFC',                 'LAFC','#C39E6D',34,21, 8, 5, 71,68,24,['W','W','D','W','W'],'W3'),
  st( 2,'mls-lagalaxy',     'LA Galaxy',            'LAG','#00245D',34,20, 7, 7, 67,62,20,['W','D','W','L','W'],'W1'),
  st( 3,'mls-seattle',      'Seattle Sounders',     'SEA','#5D9741',34,19, 8, 7, 65,58,18,['D','W','W','W','D'],'D1'),
  st( 4,'mls-rsl',          'Real Salt Lake',       'RSL','#B30838',34,18, 8, 8, 62,54,14,['W','W','D','L','W'],'W1'),
  st( 5,'mls-colorado',     'Colorado Rapids',      'COL','#862633',34,17, 8, 9, 59,50,12,['D','W','W','W','L'],'L1'),
  st( 6,'mls-portland',     'Portland Timbers',     'POR','#004812',34,16, 9, 9, 57,46,10,['W','D','W','D','W'],'W2'),
  st( 7,'mls-vancouver',    'Vancouver Whitecaps',  'VAN','#001C54',34,16, 7,11, 55,42, 8,['L','W','D','W','W'],'W2'),
  st( 8,'mls-sportingkc',   'Sporting Kansas City', 'SKC','#93B3D3',34,15, 8,11, 53,40, 6,['W','D','L','W','D'],'D1'),
  st( 9,'mls-minnesota',    'Minnesota United',     'MIN','#231F20',34,14, 9,11, 51,38, 4,['D','W','D','L','W'],'W1'),
  st(10,'mls-houston',      'Houston Dynamo',       'HOU','#F4811F',34,14, 8,12, 50,36, 2,['L','D','W','W','D'],'D1'),
  st(11,'mls-austin',       'Austin FC',            'ATX','#00B140',34,13, 9,12, 48,34, 0,['W','L','D','D','W'],'W1'),
  st(12,'mls-fcdallas',     'FC Dallas',            'DAL','#E82229',34,13, 7,14, 46,32,-2,['D','W','L','L','W'],'W1'),
  st(13,'mls-stlouis',      'St. Louis City SC',    'STL','#A40028',34,12, 8,14, 44,30,-4,['L','D','W','D','L'],'L1'),
  st(14,'mls-sanjose',      'San Jose Earthquakes', 'SJE','#0D4C92',34,11, 8,15, 41,26,-8,['D','L','L','W','D'],'D1'),
  st(15,'mls-sandiego',     'San Diego FC',         'SDF','#00B0CA',34, 8, 9,17, 33,18,-18,['L','D','L','L','W'],'W1'),
];

const mlsFixtures: LeagueFixture[] = [
  fx('Inter Miami CF','MIA','#F7B5CD','Columbus Crew','CLB','#FFF200','2026-07-05'),
  fx('LAFC','LAFC','#C39E6D','LA Galaxy','LAG','#00245D','2026-07-05'),
  fx('Seattle Sounders','SEA','#5D9741','Portland Timbers','POR','#004812','2026-07-04'),
  fx('Inter Miami CF','MIA','#F7B5CD','Atlanta United','ATL','#80000A','2026-06-21',2,1,'Final'),
  fx('LAFC','LAFC','#C39E6D','Seattle Sounders','SEA','#5D9741','2026-06-22',1,0,'Final'),
];

// ── NFL ───────────────────────────────────────────────────────────────────────
const nflStandings: LeagueStanding[] = [
  st( 1,'kc-chiefs',    'Kansas City Chiefs',     'KC', '#E31837',17,14,0, 3,42,30.2,17.1,['W','W','W','W','W'],'W3'),
  st( 2,'det-lions',    'Detroit Lions',          'DET','#0076B6',17,14,0, 3,42,30.4,17.8,['W','W','W','L','W'],'W2'),
  st( 3,'phi-eagles',   'Philadelphia Eagles',    'PHI','#004C54',17,13,0, 4,39,28.9,18.4,['W','W','L','W','W'],'W2'),
  st( 4,'bal-ravens',   'Baltimore Ravens',       'BAL','#241773',17,13,0, 4,39,29.4,18.8,['W','L','W','W','W'],'W3'),
  st( 5,'min-vikings',  'Minnesota Vikings',      'MIN','#4F2683',17,12,0, 5,36,27.2,20.8,['W','W','D','W','L'],'L1'),
  st( 6,'buf-bills',    'Buffalo Bills',          'BUF','#00338D',17,12,0, 5,36,27.8,20.1,['W','W','W','L','W'],'W1'),
  st( 7,'gb-packers',   'Green Bay Packers',      'GB', '#203731',17,11,0, 6,33,25.8,20.4,['L','W','W','W','L'],'L1'),
  st( 8,'sf-49ers',     'San Francisco 49ers',    'SF', '#AA0000',17,10,0, 7,30,26.4,20.8,['W','W','L','W','W'],'W2'),
  st( 9,'cin-bengals',  'Cincinnati Bengals',     'CIN','#FB4F14',17,10,0, 7,30,26.2,22.4,['L','W','W','L','W'],'W1'),
  st(10,'tb-buccaneers','Tampa Bay Buccaneers',   'TB', '#D50A0A',17,10,0, 7,30,26.8,21.4,['W','W','D','W','L'],'L1'),
];

const nflFixtures: LeagueFixture[] = [
  fx('Kansas City Chiefs','KC','#E31837','Buffalo Bills','BUF','#00338D','2026-09-10'),
  fx('Philadelphia Eagles','PHI','#004C54','Detroit Lions','DET','#0076B6','2026-09-11'),
  fx('Kansas City Chiefs','KC','#E31837','Buffalo Bills','BUF','#00338D','2026-01-18',27,21,'Final'),
  fx('Philadelphia Eagles','PHI','#004C54','Minnesota Vikings','MIN','#4F2683','2026-01-19',34,28,'Final'),
];

// ── NBA ───────────────────────────────────────────────────────────────────────
const nbaStandings: LeagueStanding[] = [
  st( 1,'okc-thunder',   'Oklahoma City Thunder',  'OKC','#007AC1',82,65,0,17,195,122.1,105.8,['W','W','W','W','W'],'W8'),
  st( 2,'bos-celtics',   'Boston Celtics',         'BOS','#007A33',82,59,0,23,177,120.4,107.2,['W','W','W','L','W'],'W2'),
  st( 3,'den-nuggets',   'Denver Nuggets',         'DEN','#0E2240',82,57,0,25,171,119.8,108.2,['W','L','W','W','W'],'W3'),
  st( 4,'min-wolves',    'Minnesota Timberwolves', 'MIN','#0C2340',82,54,0,28,162,118.4,109.4,['W','W','L','W','L'],'L1'),
  st( 5,'cle-cavaliers', 'Cleveland Cavaliers',    'CLE','#860038',82,56,0,26,168,118.2,108.4,['W','W','W','W','L'],'L1'),
  st( 6,'dal-mavericks', 'Dallas Mavericks',       'DAL','#00538C',82,50,0,32,150,117.2,111.4,['L','W','W','W','W'],'W4'),
  st( 7,'lac-clippers',  'LA Clippers',            'LAC','#C8102E',82,49,0,33,147,116.8,111.8,['W','L','W','W','L'],'L1'),
  st( 8,'nyknicks',      'New York Knicks',        'NYK','#006BB6',82,52,0,30,156,116.2,110.4,['W','W','W','L','W'],'W1'),
  st( 9,'ind-pacers',    'Indiana Pacers',         'IND','#002D62',82,51,0,31,153,117.4,111.2,['D','W','W','L','W'],'W1'),
  st(10,'gsw-warriors',  'Golden State Warriors',  'GSW','#1D428A',82,47,0,35,141,115.8,113.2,['L','W','L','W','W'],'W2'),
];

const nbaFixtures: LeagueFixture[] = [
  fx('Oklahoma City Thunder','OKC','#007AC1','Denver Nuggets','DEN','#0E2240','2026-10-22'),
  fx('Boston Celtics','BOS','#007A33','Cleveland Cavaliers','CLE','#860038','2026-10-22'),
  fx('OKC Thunder','OKC','#007AC1','Boston Celtics','BOS','#007A33','2026-06-15',118,106,'Final'),
  fx('Denver Nuggets','DEN','#0E2240','Minnesota Timberwolves','MIN','#0C2340','2026-06-12',108,104,'Final'),
];

// ── NHL ───────────────────────────────────────────────────────────────────────
const nhlStandings: LeagueStanding[] = [
  st( 1,'wpg-jets',        'Winnipeg Jets',        'WPG','#041E42',82,56,6,20,118,3.54,2.44,['W','W','W','W','W'],'W7'),
  st( 2,'wsh-capitals',    'Washington Capitals',  'WSH','#C8102E',82,54,8,20,116,3.48,2.50,['W','W','W','L','W'],'W2'),
  st( 3,'dal-stars',       'Dallas Stars',         'DAL','#006847',82,52,10,20,114,3.44,2.52,['W','W','L','W','W'],'W3'),
  st( 4,'fla-panthers',    'Florida Panthers',     'FLA','#C8102E',82,52,10,20,114,3.42,2.54,['L','W','W','W','L'],'L1'),
  st( 5,'car-hurricanes',  'Carolina Hurricanes',  'CAR','#CC0000',82,51,11,20,113,3.40,2.54,['W','D','W','W','W'],'W3'),
  st( 6,'tor-mapleleafs',  'Toronto Maple Leafs',  'TOR','#00205B',82,50,12,20,112,3.38,2.56,['W','W','L','W','W'],'W2'),
  st( 7,'col-avalanche',   'Colorado Avalanche',   'COL','#6F263D',82,50,12,20,112,3.38,2.56,['W','L','W','W','L'],'L1'),
  st( 8,'nyr-rangers',     'New York Rangers',     'NYR','#0038A8',82,50,12,20,112,3.36,2.56,['W','W','W','D','L'],'L1'),
  st( 9,'edm-oilers',      'Edmonton Oilers',      'EDM','#FF4C00',82,50,12,20,112,3.38,2.58,['L','W','W','W','W'],'W4'),
  st(10,'van-canucks',     'Vancouver Canucks',    'VAN','#00205B',82,52,10,20,114,3.42,2.52,['W','W','W','L','W'],'W1'),
];

const nhlFixtures: LeagueFixture[] = [
  fx('Winnipeg Jets','WPG','#041E42','Colorado Avalanche','COL','#6F263D','2026-10-11'),
  fx('Toronto Maple Leafs','TOR','#00205B','Florida Panthers','FLA','#C8102E','2026-10-11'),
  fx('Florida Panthers','FLA','#C8102E','Edmonton Oilers','EDM','#FF4C00','2026-06-12',4,3,'Final'),
  fx('Colorado Avalanche','COL','#6F263D','Dallas Stars','DAL','#006847','2026-06-10',5,4,'Final'),
];

// ── MLB ───────────────────────────────────────────────────────────────────────
const mlbStandings: LeagueStanding[] = [
  st( 1,'lad-dodgers',    'Los Angeles Dodgers',   'LAD','#005A9C',81,56,0,25,168,5.8,3.4,['W','W','W','W','L'],'L1'),
  st( 2,'atl-braves',     'Atlanta Braves',        'ATL','#CE1141',81,53,0,28,159,5.8,3.6,['W','W','L','W','W'],'W3'),
  st( 3,'nyy-yankees',    'New York Yankees',      'NYY','#003087',81,50,0,31,150,5.4,3.8,['W','L','W','W','W'],'W2'),
  st( 4,'phi-phillies',   'Philadelphia Phillies', 'PHI','#E81828',81,49,0,32,147,5.2,4.0,['L','W','W','W','W'],'W4'),
  st( 5,'cle-guardians',  'Cleveland Guardians',   'CLE','#E31937',81,48,0,33,144,5.0,4.0,['W','W','L','W','L'],'L1'),
  st( 6,'nym-mets',       'New York Mets',         'NYM','#002D72',81,47,0,34,141,5.0,4.2,['W','L','W','W','W'],'W3'),
  st( 7,'hou-astros',     'Houston Astros',        'HOU','#002D62',81,47,0,34,141,5.1,4.1,['L','W','W','L','W'],'W1'),
  st( 8,'mil-brewers',    'Milwaukee Brewers',     'MIL','#FFC52F',81,47,0,34,141,5.0,4.1,['W','W','W','D','L'],'L1'),
  st( 9,'kc-royals',      'Kansas City Royals',    'KC', '#004687',81,44,0,37,132,4.9,4.4,['L','W','W','W','L'],'L1'),
  st(10,'sd-padres',      'San Diego Padres',      'SD', '#2F241D',81,47,0,34,141,5.1,4.2,['W','W','L','W','W'],'W2'),
];

const mlbFixtures: LeagueFixture[] = [
  fx('Los Angeles Dodgers','LAD','#005A9C','San Diego Padres','SD','#2F241D','2026-07-04'),
  fx('New York Yankees','NYY','#003087','Boston Red Sox','BOS','#BD3039','2026-07-04'),
  fx('Atlanta Braves','ATL','#CE1141','Philadelphia Phillies','PHI','#E81828','2026-07-05'),
  fx('Los Angeles Dodgers','LAD','#005A9C','San Francisco Giants','SF','#FD5A1E','2026-06-22',6,2,'Final'),
  fx('New York Mets','NYM','#002D72','Atlanta Braves','ATL','#CE1141','2026-06-22',3,4,'Final'),
];

// ── League registry ───────────────────────────────────────────────────────────
export const LEAGUES: Record<string, LeagueData> = {
  epl: {
    id: 'epl', name: 'English Premier League', shortName: 'Premier League',
    sport: 'Soccer', country: 'England', season: '2025–26',
    tier: 'major', standings: eplStandings, fixtures: eplFixtures,
  },
  laliga: {
    id: 'laliga', name: 'La Liga', shortName: 'La Liga',
    sport: 'Soccer', country: 'Spain', season: '2025–26',
    tier: 'major', standings: laligaStandings, fixtures: laligaFixtures,
  },
  bundesliga: {
    id: 'bundesliga', name: 'Bundesliga', shortName: 'Bundesliga',
    sport: 'Soccer', country: 'Germany', season: '2025–26',
    tier: 'major', standings: bundesligaStandings, fixtures: bundesligaFixtures,
  },
  seriea: {
    id: 'seriea', name: 'Serie A', shortName: 'Serie A',
    sport: 'Soccer', country: 'Italy', season: '2025–26',
    tier: 'major', standings: serieaStandings, fixtures: serieaFixtures,
  },
  ligue1: {
    id: 'ligue1', name: 'Ligue 1', shortName: 'Ligue 1',
    sport: 'Soccer', country: 'France', season: '2025–26',
    tier: 'major', standings: ligue1Standings, fixtures: ligue1Fixtures,
  },
  'mls-east': {
    id: 'mls-east', name: 'MLS Eastern Conference', shortName: 'MLS East',
    sport: 'Soccer', country: 'USA', season: '2026',
    tier: 'major', standings: mlsEastStandings, fixtures: mlsFixtures,
  },
  'mls-west': {
    id: 'mls-west', name: 'MLS Western Conference', shortName: 'MLS West',
    sport: 'Soccer', country: 'USA', season: '2026',
    tier: 'major', standings: mlsWestStandings, fixtures: mlsFixtures,
  },
  nfl: {
    id: 'nfl', name: 'National Football League', shortName: 'NFL',
    sport: 'NFL', country: 'USA', season: '2025',
    tier: 'major', standings: nflStandings, fixtures: nflFixtures,
  },
  nba: {
    id: 'nba', name: 'National Basketball Association', shortName: 'NBA',
    sport: 'NBA', country: 'USA', season: '2025–26',
    tier: 'major', standings: nbaStandings, fixtures: nbaFixtures,
  },
  nhl: {
    id: 'nhl', name: 'National Hockey League', shortName: 'NHL',
    sport: 'NHL', country: 'USA/Canada', season: '2025–26',
    tier: 'major', standings: nhlStandings, fixtures: nhlFixtures,
  },
  mlb: {
    id: 'mlb', name: 'Major League Baseball', shortName: 'MLB',
    sport: 'MLB', country: 'USA', season: '2026',
    tier: 'major', standings: mlbStandings, fixtures: mlbFixtures,
  },
};

export const ALL_LEAGUES = Object.values(LEAGUES);
