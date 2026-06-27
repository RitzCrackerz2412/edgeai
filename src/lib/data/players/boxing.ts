import { mkp } from './builder';
import type { PlayerDetail } from '@/lib/playerData';

export const BOXING_PLAYERS: Record<string, PlayerDetail> = {
'box-usyk': mkp('box-usyk','Oleksandr Usyk','HW','','boxing-hw','Heavyweight','#0057B7',
  'Boxing',38,14,'Undisputed Heavyweight champion — masterful boxer who outpointed Fury and AJ twice.',
  [['Record','22-0'],['KOs',14],['Decisions',8],['Titles','WBA/WBC/IBF/WBO'],['Knockdowns Given',3]],
  [['Last Fight','May 2024'],['Opponent','Fury'],['Result','Win-MD'],['Punches Landed','234'],['Jabs','116'],['Body','88']],
  [['Boxing IQ',99],['Footwork',97],['Jab',92],['Body Work',94],['Chin',88],['Defense',90]],90,
  [['Win Prob','78-88%'],['Method','Decision'],['Punches Landed/R','28-36'],['Jabs/R','12-18']]),

'box-fury': mkp('box-fury','Tyson Fury','HW','','boxing-hw','Heavyweight','#C8102E',
  'Boxing',37,17,'Gypsy King — 6\'9\" heavyweight with elite movement and one of boxing\'s great minds.',
  [['Record','34-1-1'],['KOs',24],['Decisions',10],['Titles','WBC (former)'],['Knockdowns Given',6]],
  [['Last Fight','May 2024'],['Opponent','Usyk'],['Result','Loss-MD'],['Height','6\'9\"'],['Reach','85 in'],['Punches','198/fight']],
  [['Size',99],['Movement',88],['IQ',92],['Jab',88],['Power',84],['Mental',90]],78,
  [['Win Prob','50-64%'],['Method','Decision or KO'],['Punches Landed/R','20-30'],['KO Prob','35%']]),

'box-crawford': mkp('box-crawford','Terence Crawford','WW','','boxing-ww','Welterweight','#00205B',
  'Boxing',37,16,'Undisputed at 140 and 147 — pound-for-pound elite, best switchhitter in boxing.',
  [['Record','40-0'],['KOs',31],['Decisions',9],['Undisputed Titles',2],['Knockdowns Given',18]],
  [['Last Fight','Jul 2023'],['Opponent','Spence Jr.'],['Result','Win-TKO9'],['KD Scored',1],['Punches','188/fight'],['Accuracy%','38%']],
  [['Boxing IQ',97],['Switch Hitting',99],['Power',92],['Footwork',88],['Chin',88],['Defense',90]],88,
  [['Win Prob','78-88%'],['Method','TKO or Decision'],['KO in fight','65%'],['Punches Landed/R','20-28']]),

'box-canelo': mkp('box-canelo','Saúl "Canelo" Álvarez','SMW','','boxing-smw','Super Middleweight','#006847',
  'Boxing',35,20,'Mexico\'s greatest boxer — undisputed SMW champion with elite body work and timing.',
  [['Record','61-2-2'],['KOs',39],['Decisions',22],['Undisputed Titles',1],['Weight Classes',4]],
  [['Last Fight','Sep 2024'],['Opponent','Berlanga'],['Result','Win-UD'],['Body Shots/Fight',42],['Punches','182/fight'],['KD',1]],
  [['Counter Punching',96],['Body Work',97],['Chin',92],['Power',90],['Defense',88],['Experience',96]],82,
  [['Win Prob','72-82%'],['Method','Decision or TKO'],['Body Shots/R','5-9'],['KO Prob','45%']]),

'box-beterbiev': mkp('box-beterbiev','Artur Beterbiev','LHW','','boxing-lhw','Light Heavyweight','#C8102E',
  'Boxing',39,14,'Only active champion with 100% KO rate — devastating puncher with elite boxing skill.',
  [['Record','20-0'],['KOs',20],['KO Rate','100%'],['Titles','IBF/WBC/WBO'],['Knockdowns Given',24]],
  [['Last Fight','Oct 2024'],['Opponent','Bivol'],['Result','Win-MD'],['KD Scored',3],['Power Punches','68%'],['Pressure','Elite']],
  [['Power',99],['Pressure',96],['Aggression',94],['Jab',84],['Defense',78],['Chin',86]],88,
  [['Win Prob','72-82%'],['Method','KO/TKO'],['KO Prob','75%'],['Knockdowns/fight','1.5-3.0']]),

'box-bivol': mkp('box-bivol','Dmitry Bivol','LHW','','boxing-lhw','Light Heavyweight','#C8102E',
  'Boxing',33,13,'WBA LHW champion — the man who beat Canelo, elite technical boxer with no weaknesses.',
  [['Record','23-1'],['KOs',11],['Decisions',12],['Titles','WBA'],['Knockdowns Given',4]],
  [['Last Fight','Oct 2024'],['Opponent','Beterbiev'],['Result','Loss-MD'],['Jabs/Round','14'],['Defense%','64%'],['Punches','196/fight']],
  [['Boxing IQ',94],['Footwork',92],['Jab',94],['Defense',90],['Power',80],['Ring Craft',94]],80,
  [['Win Prob','58-70%'],['Method','Decision'],['Punches Landed/R','22-30'],['Jabs/R','12-16']]),

'box-joshua': mkp('box-joshua','Anthony Joshua','HW','','boxing-hw','Heavyweight','#C8102E',
  'Boxing',35,13,'2× World Heavyweight champion — elite physique, thunderous power, constantly improving.',
  [['Record','28-4'],['KOs',25],['Decisions',3],['World Titles',3],['Knockdowns Given',12]],
  [['Last Fight','Sep 2024'],['Opponent','Dubois'],['Result','Loss-KO5'],['Height','6\'6\"'],['Reach','82 in'],['KO Rate','89%']],
  [['Power',97],['Physique',98],['Jab',84],['Defense',74],['Chin',72],['Athleticism',90]],66,
  [['Win Prob','52-64%'],['Method','KO or TKO'],['KO Prob','55%'],['Punches Landed/R','18-26']]),

'box-garcia': mkp('box-garcia','Ryan Garcia','LW/SLW','','boxing-slw','Super Lightweight','#C8102E',
  'Boxing',26,9,'KingRy — spectacular left hook KO artist with the fastest hands in boxing.',
  [['Record','24-1'],['KOs',20],['KO Rate','83%'],['Speed','Elite'],['Knockdowns Given',16]],
  [['Last Fight','Apr 2024'],['Opponent','Haney'],['Result','Win-TKO7'],['Hand Speed','Elite'],['KD Scored',3],['Punches','168/fight']],
  [['Speed',99],['Left Hook',98],['Power',90],['Defense',78],['Chin',78],['Entertainment',96]],76,
  [['Win Prob','60-72%'],['Method','KO/TKO'],['KO Prob','65%'],['Knockdowns/fight','1.2-2.4']]),

'box-inoue': mkp('box-inoue','Naoya Inoue','BW','','boxing-bw','Bantamweight','#BC002D',
  'Boxing',31,12,'The Monster — undisputed at BW, most feared P4P puncher regardless of weight class.',
  [['Record','27-0'],['KOs',24],['KO Rate','89%'],['Undisputed Titles',1],['Knockdowns Given',22]],
  [['Last Fight','Sep 2024'],['Opponent','TJ Doheny'],['Result','Win-KO2'],['KD Scored',4],['Punches/Fight',148],['Accuracy%','52%']],
  [['Power',99],['Accuracy',96],['Speed',90],['Chin',88],['Defense',84],['Adaptability',88]],92,
  [['Win Prob','82-92%'],['Method','KO/TKO'],['KO Prob','80%'],['Knockdowns/fight','1.8-3.2']]),

'box-tank': mkp('box-tank','Gervonta Davis','LW','','boxing-lw','Lightweight','#C8102E',
  'Boxing',30,12,'Tank — two-division champion with the most lethal left hook in boxing today.',
  [['Record','30-0'],['KOs',28],['KO Rate','93%'],['Titles',3],['Knockdowns Given',20]],
  [['Last Fight','Jun 2024'],['Opponent','Frank Martin'],['Result','Win-KO8'],['KD Scored',2],['Power%','68%'],['Accuracy','48%']],
  [['Power',99],['Left Hook',98],['Speed',88],['Defense',82],['Chin',84],['Entertainment',96]],86,
  [['Win Prob','72-82%'],['Method','KO/TKO'],['KO Prob','78%'],['Knockdowns/fight','1.5-2.5']]),
};
