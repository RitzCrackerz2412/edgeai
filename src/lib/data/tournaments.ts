import type { Tournament, TournamentGroup, TournamentMatch, LeagueStanding } from '../types';

// ── Helpers ───────────────────────────────────────────────────────────────────
const tst = (
  rank: number, teamId: string, teamName: string, abbr: string, color: string,
  gp: number, w: number, d: number, l: number, pts: number, gf: number, ga: number,
  last5: ('W'|'L'|'D')[], streak: string,
): LeagueStanding => ({
  rank, teamId, teamName, abbreviation: abbr, color,
  gp, w, d, l, pts, gf, ga, gd: gf - ga,
  winPct: parseFloat(((w + d * 0.5) / gp).toFixed(3)),
  last5, streak,
});

const tm = (
  round: string,
  ht: string, ha: string, hc: string,
  at: string, aa: string, ac: string,
  date: string,
  hs?: number, as_?: number,
  status: 'Upcoming'|'Final' = 'Upcoming',
  venue?: string,
): TournamentMatch => ({ round, homeTeam: ht, homeAbbr: ha, homeColor: hc,
  awayTeam: at, awayAbbr: aa, awayColor: ac,
  homeScore: hs, awayScore: as_, date, status, venue });

// ── FIFA World Cup 2026 ───────────────────────────────────────────────────────
// 12 groups of 4; showing groups A–D in detail
const wcGroups: TournamentGroup[] = [
  {
    label: 'Group A',
    teams: [
      tst(1,'nat-france',    'France',       'FRA','#002395',3,2,1,0,7,6,2,['W','D','W'],'W1'),
      tst(2,'nat-argentina', 'Argentina',    'ARG','#74ACDF',3,2,0,1,6,5,3,['W','L','W'],'W1'),
      tst(3,'nat-australia', 'Australia',    'AUS','#FFCD00',3,1,0,2,3,3,4,['W','L','L'],'L2'),
      tst(4,'nat-drcongo',   'DR Congo',     'COD','#007FFF',3,0,1,2,1,1,6,['D','L','L'],'L2'),
    ],
  },
  {
    label: 'Group B',
    teams: [
      tst(1,'nat-spain',     'Spain',        'ESP','#AA151B',3,2,1,0,7,7,2,['W','D','W'],'W1'),
      tst(2,'nat-brazil',    'Brazil',       'BRA','#009C3B',3,2,0,1,6,6,3,['W','W','L'],'L1'),
      tst(3,'nat-mexico',    'Mexico',       'MEX','#006847',3,1,0,2,3,3,4,['W','L','L'],'L2'),
      tst(4,'nat-ghana',     'Ghana',        'GHA','#006B3F',3,0,1,2,1,2,9,['D','L','L'],'L2'),
    ],
  },
  {
    label: 'Group C',
    teams: [
      tst(1,'nat-england',   'England',      'ENG','#CF081F',3,2,1,0,7,5,1,['W','D','W'],'W1'),
      tst(2,'nat-colombia',  'Colombia',     'COL','#FCD116',3,1,2,0,5,4,2,['W','D','D'],'D1'),
      tst(3,'nat-senegal',   'Senegal',      'SEN','#00853F',3,1,0,2,3,3,5,['W','L','L'],'L2'),
      tst(4,'nat-canada',    'Canada',       'CAN','#FF0000',3,0,1,2,1,1,5,['D','L','L'],'L2'),
    ],
  },
  {
    label: 'Group D',
    teams: [
      tst(1,'nat-germany',   'Germany',      'GER','#000000',3,3,0,0,9,8,2,['W','W','W'],'W3'),
      tst(2,'nat-japan',     'Japan',        'JPN','#BC002D',3,2,0,1,6,5,3,['W','W','L'],'L1'),
      tst(3,'nat-usa',       'United States','USA','#B22234',3,1,0,2,3,4,6,['W','L','L'],'L2'),
      tst(4,'nat-indonesia', 'Indonesia',    'IDN','#CE1126',3,0,0,3,0,0,6,['L','L','L'],'L3'),
    ],
  },
  {
    label: 'Group E',
    teams: [
      tst(1,'nat-portugal',  'Portugal',     'POR','#006600',3,2,1,0,7,6,2,['W','D','W'],'W1'),
      tst(2,'nat-morocco',   'Morocco',      'MAR','#C1272D',3,1,2,0,5,3,1,['W','D','D'],'D1'),
      tst(3,'nat-uruguay',   'Uruguay',      'URU','#5EB6E4',3,1,0,2,3,3,5,['W','L','L'],'L2'),
      tst(4,'nat-ecuador',   'Ecuador',      'ECU','#FFDA00',3,0,1,2,1,1,5,['D','L','L'],'L2'),
    ],
  },
  {
    label: 'Group F',
    teams: [
      tst(1,'nat-netherlands','Netherlands', 'NED','#FF6600',3,2,1,0,7,5,1,['W','D','W'],'W1'),
      tst(2,'nat-italy',     'Italy',        'ITA','#009246',3,1,2,0,5,4,2,['D','D','W'],'W1'),
      tst(3,'nat-nigeria',   'Nigeria',      'NGA','#008751',3,1,0,2,3,3,5,['W','L','L'],'L2'),
      tst(4,'nat-costarica', 'Costa Rica',   'CRC','#D00000',3,0,1,2,1,1,5,['D','L','L'],'L2'),
    ],
  },
  {
    label: 'Group G',
    teams: [
      tst(1,'nat-belgium',   'Belgium',      'BEL','#ED2939',3,2,1,0,7,6,2,['W','W','D'],'D1'),
      tst(2,'nat-southkorea','South Korea',  'KOR','#003478',3,1,2,0,5,5,4,['D','D','W'],'W1'),
      tst(3,'nat-croatia',   'Croatia',      'CRO','#FF0000',3,1,0,2,3,3,5,['W','L','L'],'L2'),
      tst(4,'nat-saudiarabia','Saudi Arabia','KSA','#006C35',3,0,1,2,1,1,4,['D','L','L'],'L2'),
    ],
  },
  {
    label: 'Group H',
    teams: [
      tst(1,'nat-switzerland','Switzerland', 'SUI','#FF0000',3,2,1,0,7,4,1,['W','W','D'],'D1'),
      tst(2,'nat-denmark',   'Denmark',      'DEN','#C60C30',3,1,2,0,5,4,2,['D','W','D'],'D1'),
      tst(3,'nat-iran',      'Iran',         'IRN','#239F40',3,1,0,2,3,2,4,['W','L','L'],'L2'),
      tst(4,'nat-venezuela', 'Venezuela',    'VEN','#CF142B',3,0,1,2,1,1,4,['D','L','L'],'L2'),
    ],
  },
];

const wcKnockout: TournamentMatch[] = [
  // Round of 32 (first 8 shown)
  tm('Round of 32','France','FRA','#002395','Croatia','CRO','#FF0000','2026-07-01',2,0,'Final','Levi Stadium, San Francisco'),
  tm('Round of 32','Argentina','ARG','#74ACDF','South Korea','KOR','#003478','2026-07-01',3,1,'Final','Rose Bowl, Los Angeles'),
  tm('Round of 32','Spain','ESP','#AA151B','Denmark','DEN','#C60C30','2026-07-02',2,1,'Final','MetLife Stadium, New York'),
  tm('Round of 32','Brazil','BRA','#009C3B','Belgium','BEL','#ED2939','2026-07-02',2,1,'Final','AT&T Stadium, Dallas'),
  tm('Round of 32','England','ENG','#CF081F','Switzerland','SUI','#FF0000','2026-07-03',1,0,'Final','SoFi Stadium, Los Angeles'),
  tm('Round of 32','Colombia','COL','#FCD116','Netherlands','NED','#FF6600','2026-07-03',2,1,'Final','Hard Rock Stadium, Miami'),
  tm('Round of 32','Germany','GER','#000000','Italy','ITA','#009246','2026-07-04',2,1,'Final',"Caesar's Superdome, New Orleans"),
  tm('Round of 32','Portugal','POR','#006600','Morocco','MAR','#C1272D','2026-07-04',1,1,'Final','Arrowhead Stadium, Kansas City'),
  // Round of 16
  tm('Round of 16','France','FRA','#002395','Argentina','ARG','#74ACDF','2026-07-09',undefined,undefined,'Upcoming','Levi Stadium, San Francisco'),
  tm('Round of 16','Spain','ESP','#AA151B','Brazil','BRA','#009C3B','2026-07-09',undefined,undefined,'Upcoming','MetLife Stadium, New York'),
  tm('Round of 16','England','ENG','#CF081F','Colombia','COL','#FCD116','2026-07-10',undefined,undefined,'Upcoming','SoFi Stadium, Los Angeles'),
  tm('Round of 16','Germany','GER','#000000','Portugal','POR','#006600','2026-07-10',undefined,undefined,'Upcoming','AT&T Stadium, Dallas'),
  // Quarters (TBD)
  tm('Quarterfinal','TBD QF1','???','#666','TBD QF2','???','#666','2026-07-14',undefined,undefined,'Upcoming'),
  tm('Quarterfinal','TBD QF3','???','#666','TBD QF4','???','#666','2026-07-14',undefined,undefined,'Upcoming'),
  tm('Quarterfinal','TBD QF5','???','#666','TBD QF6','???','#666','2026-07-15',undefined,undefined,'Upcoming'),
  tm('Quarterfinal','TBD QF7','???','#666','TBD QF8','???','#666','2026-07-15',undefined,undefined,'Upcoming'),
  // Semis
  tm('Semifinal','TBD SF1','???','#666','TBD SF2','???','#666','2026-07-19',undefined,undefined,'Upcoming'),
  tm('Semifinal','TBD SF3','???','#666','TBD SF4','???','#666','2026-07-19',undefined,undefined,'Upcoming'),
  // Third place
  tm('Third Place','TBD','???','#666','TBD','???','#666','2026-07-22',undefined,undefined,'Upcoming','MetLife Stadium, New York'),
  // Final
  tm('Final','TBD','???','#666','TBD','???','#666','2026-07-26',undefined,undefined,'Upcoming','MetLife Stadium, New York'),
];

// ── UEFA Champions League 2025-26 ────────────────────────────────────────────
const uclGroups: TournamentGroup[] = [
  {
    label: 'Group A',
    teams: [
      tst(1,'epl-mancity',  'Manchester City',   'MCI','#6CABDD',6,4,1,1,13,14, 7,['W','W','D','L','W'],'W1'),
      tst(2,'sea-inter',    'Inter Milan',       'INT','#0C1A80',6,3,2,1,11,10, 6,['D','W','W','D','L'],'L1'),
      tst(3,'bun-leverkusen','Bayer Leverkusen', 'B04','#E32221',6,2,1,3, 7, 7, 9,['W','L','D','L','W'],'W1'),
      tst(4,'lg1-psg',      'Paris Saint-Germain','PSG','#004170',6,1,2,3, 5, 5,14,['L','D','L','W','D'],'D1'),
    ],
  },
  {
    label: 'Group B',
    teams: [
      tst(1,'lla-realmadrid','Real Madrid',      'RMA','#FEBE10',6,5,0,1,15,16, 5,['W','W','W','L','W'],'W2'),
      tst(2,'epl-arsenal',  'Arsenal',           'ARS','#EF0107',6,4,0,2,12,12, 8,['W','W','L','W','W'],'W3'),
      tst(3,'bun-dortmund', 'Borussia Dortmund', 'BVB','#FDE100',6,2,1,3, 7, 8,12,['D','L','W','L','W'],'W1'),
      tst(4,'sea-atalanta', 'Atalanta',          'ATA','#1C50A0',6,0,1,5, 1, 3,14,['L','L','D','L','L'],'L4'),
    ],
  },
  {
    label: 'Group C',
    teams: [
      tst(1,'lla-barcelona', 'Barcelona',        'FCB','#A50044',6,4,2,0,14,14, 6,['W','D','W','W','D'],'D1'),
      tst(2,'sea-napoli',   'Napoli',            'NAP','#12A0C7',6,3,2,1,11,10, 6,['W','D','D','W','L'],'L1'),
      tst(3,'epl-chelsea',  'Chelsea',           'CHE','#034694',6,2,1,3, 7, 8,11,['L','W','D','L','W'],'W1'),
      tst(4,'bun-bayernmunich','Bayern Munich',  'BAY','#DC052D',6,1,1,4, 4, 5,12,['L','D','L','W','L'],'L1'),
    ],
  },
  {
    label: 'Group D',
    teams: [
      tst(1,'epl-liverpool','Liverpool',         'LIV','#C8102E',6,5,1,0,16,15, 5,['W','W','W','D','W'],'W3'),
      tst(2,'lla-atletico', 'Atletico Madrid',   'ATM','#CB3524',6,3,1,2,10,10, 6,['W','D','L','W','W'],'W2'),
      tst(3,'sea-juventus', 'Juventus',          'JUV','#000000',6,2,0,4, 6, 7,13,['L','W','L','W','L'],'L1'),
      tst(4,'sea-milan',    'AC Milan',          'MIL','#FB090B',6,0,2,4, 2, 4,12,['D','L','D','L','L'],'L2'),
    ],
  },
];

const uclKnockout: TournamentMatch[] = [
  tm('Round of 16','Real Madrid','RMA','#FEBE10','Arsenal','ARS','#EF0107','2026-02-18',2,1,'Final','Santiago Bernabeu'),
  tm('Round of 16','Barcelona','FCB','#A50044','Liverpool','LIV','#C8102E','2026-02-18',1,2,'Final','Camp Nou'),
  tm('Round of 16','Manchester City','MCI','#6CABDD','Napoli','NAP','#12A0C7','2026-02-25',3,0,'Final','Etihad Stadium'),
  tm('Round of 16','Inter Milan','INT','#0C1A80','Atletico Madrid','ATM','#CB3524','2026-02-25',2,2,'Final','San Siro'),
  // QF
  tm('Quarterfinal','Real Madrid','RMA','#FEBE10','Manchester City','MCI','#6CABDD','2026-04-08',3,3,'Final','Santiago Bernabeu'),
  tm('Quarterfinal','Liverpool','LIV','#C8102E','Inter Milan','INT','#0C1A80','2026-04-09',2,1,'Final','Anfield'),
  // SF
  tm('Semifinal','Real Madrid','RMA','#FEBE10','Liverpool','LIV','#C8102E','2026-04-29',undefined,undefined,'Upcoming','Santiago Bernabeu'),
  tm('Semifinal','TBD','???','#666','TBD','???','#666','2026-04-30',undefined,undefined,'Upcoming'),
  // Final
  tm('Final','TBD','???','#666','TBD','???','#666','2026-05-30',undefined,undefined,'Upcoming','Allianz Arena, Munich'),
];

// ── Copa América 2024 (completed) ────────────────────────────────────────────
const copaGroups: TournamentGroup[] = [
  {
    label: 'Group A',
    teams: [
      tst(1,'copa-argentina','Argentina','ARG','#74ACDF',3,2,1,0,7,6,2,['W','D','W'],'W1'),
      tst(2,'copa-usa',     'United States','USA','#B22234',3,1,1,1,4,3,3,['D','W','L'],'L1'),
      tst(3,'copa-ecuador', 'Ecuador',    'ECU','#FFDA00',3,1,0,2,3,2,4,['W','L','L'],'L2'),
      tst(4,'copa-bolivia', 'Bolivia',    'BOL','#009A44',3,0,2,1,2,2,4,['D','D','L'],'L1'),
    ],
  },
  {
    label: 'Group B',
    teams: [
      tst(1,'copa-mexico',  'Mexico',     'MEX','#006847',3,2,0,1,6,4,2,['W','W','L'],'L1'),
      tst(2,'copa-venezuela','Venezuela', 'VEN','#CF142B',3,1,2,0,5,3,1,['D','W','D'],'D1'),
      tst(3,'copa-jamaica', 'Jamaica',    'JAM','#000000',3,1,0,2,3,3,4,['W','L','L'],'L2'),
      tst(4,'copa-costarica','Costa Rica','CRC','#D00000',3,0,2,1,2,1,3,['D','L','D'],'D1'),
    ],
  },
  {
    label: 'Group C',
    teams: [
      tst(1,'copa-uruguay', 'Uruguay',    'URU','#5EB6E4',3,2,1,0,7,5,2,['W','W','D'],'D1'),
      tst(2,'copa-panama',  'Panama',     'PAN','#CD1827',3,1,1,1,4,3,3,['D','W','L'],'L1'),
      tst(3,'copa-canada',  'Canada',     'CAN','#FF0000',3,1,0,2,3,2,4,['W','L','L'],'L2'),
      tst(4,'copa-chile',   'Chile',      'CHI','#D52B1E',3,0,2,1,2,1,3,['D','L','D'],'D1'),
    ],
  },
  {
    label: 'Group D',
    teams: [
      tst(1,'copa-brazil',  'Brazil',     'BRA','#009C3B',3,2,1,0,7,5,2,['W','W','D'],'D1'),
      tst(2,'copa-colombia','Colombia',   'COL','#FCD116',3,2,1,0,7,5,2,['W','D','W'],'W1'),
      tst(3,'copa-peru',    'Peru',       'PER','#D91023',3,1,0,2,3,2,4,['W','L','L'],'L2'),
      tst(4,'copa-paraguay','Paraguay',   'PAR','#D52B1E',3,0,0,3,0,0,4,['L','L','L'],'L3'),
    ],
  },
];

const copaKnockout: TournamentMatch[] = [
  tm('Quarterfinal','Argentina','ARG','#74ACDF','Venezuela','VEN','#CF142B','2026-07-04',2,1,'Final','AT&T Stadium, Arlington'),
  tm('Quarterfinal','Uruguay','URU','#5EB6E4','Mexico','MEX','#006847','2026-07-04',3,0,'Final','State Farm Stadium, Glendale'),
  tm('Quarterfinal','Colombia','COL','#FCD116','Panama','PAN','#CD1827','2026-07-05',5,0,'Final','Allegiant Stadium, Las Vegas'),
  tm('Quarterfinal','Brazil','BRA','#009C3B','USA','USA','#B22234','2026-07-06',4,1,'Final','Levi Stadium, San Francisco'),
  tm('Semifinal','Argentina','ARG','#74ACDF','Ecuador','ECU','#FFDA00','2026-07-09',4,3,'Final','MetLife Stadium, New York'),
  tm('Semifinal','Colombia','COL','#FCD116','Uruguay','URU','#5EB6E4','2026-07-10',1,1,'Final','Bank of America Stadium, Charlotte'),
  tm('Final','Argentina','ARG','#74ACDF','Colombia','COL','#FCD116','2026-07-14',1,0,'Final','Hard Rock Stadium, Miami'),
];

// ── UEFA Euro 2028 (Upcoming — hosted by UK & Ireland) ───────────────────────
const euroGroups: TournamentGroup[] = [
  {
    label: 'Group A',
    teams: [
      tst(1,'euro-spain',   'Spain',      'ESP','#AA151B',0,0,0,0,0,0,0,[],''),
      tst(2,'euro-croatia', 'Croatia',    'CRO','#FF0000',0,0,0,0,0,0,0,[],''),
      tst(3,'euro-albania', 'Albania',    'ALB','#E41E20',0,0,0,0,0,0,0,[],''),
      tst(4,'euro-ukraine', 'Ukraine',    'UKR','#005BBB',0,0,0,0,0,0,0,[],''),
    ],
  },
  {
    label: 'Group B',
    teams: [
      tst(1,'euro-england', 'England',    'ENG','#CF081F',0,0,0,0,0,0,0,[],''),
      tst(2,'euro-denmark', 'Denmark',    'DEN','#C60C30',0,0,0,0,0,0,0,[],''),
      tst(3,'euro-serbia',  'Serbia',     'SRB','#C6363C',0,0,0,0,0,0,0,[],''),
      tst(4,'euro-slovenia','Slovenia',   'SVN','#003DA5',0,0,0,0,0,0,0,[],''),
    ],
  },
  {
    label: 'Group C',
    teams: [
      tst(1,'euro-france',  'France',     'FRA','#002395',0,0,0,0,0,0,0,[],''),
      tst(2,'euro-netherlands','Netherlands','NED','#FF6600',0,0,0,0,0,0,0,[],''),
      tst(3,'euro-austria', 'Austria',    'AUT','#ED2939',0,0,0,0,0,0,0,[],''),
      tst(4,'euro-slovakia','Slovakia',   'SVK','#005BBB',0,0,0,0,0,0,0,[],''),
    ],
  },
  {
    label: 'Group D',
    teams: [
      tst(1,'euro-germany', 'Germany',    'GER','#000000',0,0,0,0,0,0,0,[],''),
      tst(2,'euro-portugal','Portugal',   'POR','#006600',0,0,0,0,0,0,0,[],''),
      tst(3,'euro-turkey',  'Turkey',     'TUR','#E30A17',0,0,0,0,0,0,0,[],''),
      tst(4,'euro-georgia', 'Georgia',    'GEO','#CC0000',0,0,0,0,0,0,0,[],''),
    ],
  },
  {
    label: 'Group E',
    teams: [
      tst(1,'euro-belgium', 'Belgium',    'BEL','#ED2939',0,0,0,0,0,0,0,[],''),
      tst(2,'euro-italy',   'Italy',      'ITA','#009246',0,0,0,0,0,0,0,[],''),
      tst(3,'euro-poland',  'Poland',     'POL','#DC143C',0,0,0,0,0,0,0,[],''),
      tst(4,'euro-romania', 'Romania',    'ROU','#002B7F',0,0,0,0,0,0,0,[],''),
    ],
  },
  {
    label: 'Group F',
    teams: [
      tst(1,'euro-scotland','Scotland',   'SCO','#005EB8',0,0,0,0,0,0,0,[],''),
      tst(2,'euro-switzerland','Switzerland','SUI','#FF0000',0,0,0,0,0,0,0,[],''),
      tst(3,'euro-hungary', 'Hungary',    'HUN','#CE2939',0,0,0,0,0,0,0,[],''),
      tst(4,'euro-czechrepublic','Czech Republic','CZE','#D7141A',0,0,0,0,0,0,0,[],''),
    ],
  },
];

const euroKnockout: TournamentMatch[] = [
  tm('Round of 16','TBD A1','???','#666','TBD B2','???','#666','2028-06-25',undefined,undefined,'Upcoming','Wembley Stadium, London'),
  tm('Round of 16','TBD B1','???','#666','TBD A2','???','#666','2028-06-26',undefined,undefined,'Upcoming','Hampden Park, Glasgow'),
  tm('Final','TBD','???','#666','TBD','???','#666','2028-07-14',undefined,undefined,'Upcoming','Wembley Stadium, London'),
];

// ── Tournament registry ───────────────────────────────────────────────────────
export const TOURNAMENTS: Record<string, Tournament> = {
  worldcup2026: {
    id: 'worldcup2026', name: 'FIFA World Cup 2026', shortName: 'World Cup 2026',
    sport: 'Soccer', country: 'USA / Mexico / Canada', season: '2026',
    startDate: '2026-06-11', endDate: '2026-07-26',
    status: 'Active',
    format: '48 teams — 12 groups of 4, Round of 32, Round of 16, Quarterfinals, Semifinals, Final',
    teamCount: 48,
    groups: wcGroups,
    knockoutMatches: wcKnockout,
    topScorer: { name: 'Kylian Mbappé', team: 'France', value: 4, stat: 'goals' },
  },
  ucl2526: {
    id: 'ucl2526', name: 'UEFA Champions League 2025-26', shortName: 'UCL',
    sport: 'Soccer', country: 'Europe', season: '2025-26',
    startDate: '2025-09-17', endDate: '2026-05-30',
    status: 'Active',
    format: '36 teams — League phase + knockout bracket',
    teamCount: 36,
    groups: uclGroups,
    knockoutMatches: uclKnockout,
    topScorer: { name: 'Erling Haaland', team: 'Manchester City', value: 8, stat: 'goals' },
  },
  copaamerica2024: {
    id: 'copaamerica2024', name: 'Copa América 2024', shortName: 'Copa América',
    sport: 'Soccer', country: 'USA', season: '2024',
    startDate: '2024-06-20', endDate: '2024-07-14',
    status: 'Completed',
    format: '16 teams — 4 groups of 4, knockout from quarterfinals',
    teamCount: 16,
    groups: copaGroups,
    knockoutMatches: copaKnockout,
    champion: 'Argentina',
    topScorer: { name: 'James Rodríguez', team: 'Colombia', value: 6, stat: 'goal contributions' },
  },
  euro2028: {
    id: 'euro2028', name: 'UEFA European Championship 2028', shortName: 'Euro 2028',
    sport: 'Soccer', country: 'UK & Ireland', season: '2028',
    startDate: '2028-06-09', endDate: '2028-07-14',
    status: 'Upcoming',
    format: '24 teams — 6 groups of 4, Round of 16, Quarterfinals, Semifinals, Final',
    teamCount: 24,
    groups: euroGroups,
    knockoutMatches: euroKnockout,
  },
};

export const ALL_TOURNAMENTS = Object.values(TOURNAMENTS);
