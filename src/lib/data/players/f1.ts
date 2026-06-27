import { mkp } from './builder';
import type { PlayerDetail } from '@/lib/playerData';

export const F1_PLAYERS: Record<string, PlayerDetail> = {
'f1-verstappen': mkp('f1-verstappen','Max Verstappen','Driver','1','rbr-red-bull','Red Bull Racing','#3671C6',
  'F1',28,10,'4× World Champion — arguably the greatest driver of his era, dominant 2023 with 19 wins.',
  [['Championships',4],['Wins',62],['Poles',40],['Podiums',108],['Points',2889],['Fastest Laps',32]],
  [['2024 Pos',1],['2024 Wins',9],['2024 Pts',437],['Poles',4],['Fastest Laps',10],['DNFs',2]],
  [['Pace',99],['Racecraft',98],['Wet Weather',97],['Qualifying',96],['Tire Management',88],['Consistency',94]],90,
  [['Championship Prob','65-80%'],['Race Wins','8-14'],['Poles','6-12'],['Points','400-450']]),

'f1-hamilton': mkp('f1-hamilton','Lewis Hamilton','Driver','44','fer-ferrari','Ferrari','#E8002D',
  'F1',40,19,'7× World Champion (record) — moved to Ferrari for 2025, one final title push.',
  [['Championships',7],['Wins',103],['Poles',103],['Podiums',197],['Points',4639],['Fastest Laps',65]],
  [['2024 Pos',3],['2024 Wins',2],['2024 Pts',347],['Poles',2],['Fastest Laps',6],['Podiums',12]],
  [['Race Craft',97],['Qualifying',94],['Consistency',92],['Wet Weather',96],['Tire Mgt',90],['Experience',99]],82,
  [['Championship Prob','20-35%'],['Race Wins','3-8'],['Poles','3-8'],['Points','280-360']]),

'f1-leclerc': mkp('f1-leclerc','Charles Leclerc','Driver','16','fer-ferrari','Ferrari','#E8002D',
  'F1',28,7,'Ferrari\'s star — supreme qualifier with multiple pole positions and race victories.',
  [['Championships',0],['Wins',8],['Poles',25],['Podiums',40],['Points',1359],['Fastest Laps',8]],
  [['2024 Pos',3],['2024 Wins',3],['2024 Pts',341],['Poles',6],['Podiums',12],['DNFs',3]],
  [['Qualifying',98],['Race Pace',88],['Wet Weather',88],['Tire Mgt',80],['Racecraft',86],['Clutch',84]],80,
  [['Championship Prob','22-34%'],['Race Wins','3-7'],['Poles','5-10'],['Points','280-360']]),

'f1-norris': mkp('f1-norris','Lando Norris','Driver','4','mcl-mclaren','McLaren','#FF8000',
  'F1',25,6,'2024 breakout star — McLaren\'s leader, multiple wins, fighting for the title.',
  [['Championships',0],['Wins',5],['Poles',6],['Podiums',28],['Points',879],['Fastest Laps',7]],
  [['2024 Pos',2],['2024 Wins',4],['2024 Pts',374],['Poles',5],['Podiums',16],['DNFs',1]],
  [['Pace',94],['Qualifying',90],['Racecraft',88],['Tire Mgt',86],['Consistency',88],['Clutch',86]],84,
  [['Championship Prob','28-42%'],['Race Wins','4-8'],['Poles','4-8'],['Points','320-400']]),

'f1-piastri': mkp('f1-piastri','Oscar Piastri','Driver','81','mcl-mclaren','McLaren','#FF8000',
  'F1',24,2,'McLaren\'s rapid #2 turned #1 — 2024 multiple wins, exceptional racecraft for a rookie-ish driver.',
  [['Championships',0],['Wins',4],['Poles',2],['Podiums',14],['Points',593],['Fastest Laps',3]],
  [['2024 Pos',5],['2024 Wins',3],['2024 Pts',292],['Poles',2],['Podiums',12],['DNFs',2]],
  [['Pace',90],['Racecraft',88],['Qualifying',86],['Tire Mgt',84],['Consistency',88],['Upside',94]],82,
  [['Championship Prob','20-32%'],['Race Wins','3-7'],['Poles','2-5'],['Points','260-340']]),

'f1-sainz': mkp('f1-sainz','Carlos Sainz','Driver','55','wil-williams','Williams','#37BEDD',
  'F1',31,10,'Smooth operator — one consistent top performer despite constructor struggles.',
  [['Championships',0],['Wins',4],['Poles',5],['Podiums',23],['Points',1166],['Fastest Laps',4]],
  [['2024 Pos',5],['2024 Wins',1],['2024 Pts',290],['Team','Ferrari→Williams'],['Podiums',5],['DNFs',3]],
  [['Consistency',90],['Racecraft',88],['Tire Mgt',90],['Qualifying',84],['Adaptability',88],['Leadership',86]],72,
  [['Championship Prob','8-16%'],['Race Wins','0-2'],['Poles','0-2'],['Points','160-240']]),

'f1-russell': mkp('f1-russell','George Russell','Driver','63','mer-mercedes','Mercedes','#27F4D2',
  'F1',27,6,'Mr. Saturday — exceptional qualifier who won his debut race; Mercedes\' future leader.',
  [['Championships',0],['Wins',2],['Poles',3],['Podiums',14],['Points',701],['Fastest Laps',6]],
  [['2024 Pos',6],['2024 Wins',1],['2024 Pts',245],['Poles',2],['Podiums',8],['DNFs',2]],
  [['Qualifying',92],['Racecraft',86],['Consistency',86],['Tire Mgt',82],['Leadership',84],['Upside',88]],74,
  [['Championship Prob','12-22%'],['Race Wins','1-3'],['Poles','2-5'],['Points','200-280']]),

'f1-alonso': mkp('f1-alonso','Fernando Alonso','Driver','14','amr-aston-martin','Aston Martin','#358C75',
  'F1',43,24,'2× World Champion — greatest F1 driver who never retired, still elite at 43.',
  [['Championships',2],['Wins',32],['Poles',22],['Podiums',106],['Points',2267],['Seasons',22]],
  [['2024 Pos',8],['2024 Wins',0],['2024 Pts',162],['Podiums',2],['Experience','Unmatched'],['DNFs',3]],
  [['Racecraft',99],['Overtaking',98],['Strategy',96],['Tire Mgt',96],['Qualifying',88],['Experience',99]],75,
  [['Championship Prob','4-10%'],['Race Wins','0-1'],['Podiums','1-4'],['Points','120-200']]),

'f1-perez': mkp('f1-perez','Sergio Pérez','Driver','11','rbr-red-bull','Red Bull Racing','#3671C6',
  'F1',35,14,'Checo — elite tire manager and brilliant in middle-stint racing, supporting Verstappen\'s titles.',
  [['Championships',0],['Wins',6],['Poles',3],['Podiums',36],['Points',1356],['Fastest Laps',4]],
  [['2024 Pos',8],['2024 Wins',0],['2024 Pts',152],['Podiums',3],['Tire Mgt','Elite'],['DNFs',4]],
  [['Tire Mgt',96],['Race Pace',82],['Qualifying',80],['Teamwork',92],['Consistency',78],['Adaptability',80]],64,
  [['Championship Prob','2-6%'],['Race Wins','0-2'],['Podiums','2-6'],['Points','120-180']]),

'f1-gasly': mkp('f1-gasly','Pierre Gasly','Driver','10','alp-alpine','Alpine','#FF87BC',
  'F1',29,8,'2021 Italian GP winner — underrated racer with excellent racecraft in midfield.',
  [['Championships',0],['Wins',1],['Poles',0],['Podiums',4],['Points',512],['Fastest Laps',2]],
  [['2024 Pos',12],['2024 Wins',0],['2024 Pts',42],['Podiums',0],['Team','Alpine'],['DNFs',4]],
  [['Racecraft',86],['Race Pace',82],['Consistency',80],['Qualifying',80],['Overtaking',82],['Resilience',88]],66,
  [['Championship Prob','0-2%'],['Race Wins','0'],['Podiums','0-1'],['Points','40-80']]),
};
