import { mkp } from './builder';
import type { PlayerDetail } from '@/lib/playerData';

export const CRICKET_PLAYERS: Record<string, PlayerDetail> = {
'cri-rohit': mkp('cri-rohit','Rohit Sharma','BAT','45','ind-india','India','#003580',
  'Cricket',38,17,'Indian captain and T20 World Cup winner — most double centuries in Test cricket.',
  [['Tests',67],['Test Avg','40.5'],['Test Runs',4301],['ODIs',264],['ODI Avg','49.0'],['T20I Runs',4231]],
  [['Recent Tests',4],['Recent Runs',180],['Recent Avg','45.0'],['T20Is 2024',14],['T20I Avg','27.4'],['Strike Rate','148']],
  [['Batting',88],['Power',90],['Consistency',82],['Big Innings',90],['T20',88],['Leadership',88]],78,
  [['Test Avg','35-50'],['ODI Avg','45-55'],['T20 SR','140-160'],['Sixes/Innings','2-4']]),

'cri-bumrah': mkp('cri-bumrah','Jasprit Bumrah','BOWL','93','ind-india','India','#003580',
  'Cricket',31,9,'World\'s #1 ranked Test bowler — uniquely destructive action, elite death bowler in all formats.',
  [['Tests',43],['Test Wkts',195],['Test Avg','20.2'],['ODI Wkts',155],['T20I Wkts',89],['IPL Wkts',170]],
  [['Tests 2024',7],['Wkts 2024',46],['Avg 2024','14.2'],['T20I 2024 Econ','6.4'],['Yorkers','Elite'],['WC 2024 Wkts',15]],
  [['Pace',92],['Swing',96],['Death Bowling',99],['Yorker',99],['Fitness',74],['Clutch',98]],88,
  [['Test Wkts/Match','4-7'],['ODI Econ','4.5-5.5'],['T20 Econ','6.0-7.2'],['WC Wkts','8-15']]),

'cri-cummins': mkp('cri-cummins','Pat Cummins','BOWL','30','aus-australia','Australia','#FFCD00',
  'Cricket',31,12,'Australian captain, ICC Test Player of Year — elite pace with exceptional tactical nous.',
  [['Tests',56],['Test Wkts',257],['Test Avg','21.6'],['ODI Wkts',105],['WC Titles',2],['Bat Avg','22.4']],
  [['Tests 2024',8],['Wkts 2024',38],['Avg 2024','22.4'],['Leadership','Elite'],['Win Rate','68%'],['Bat 2024','21.4']],
  [['Pace',90],['Seam',94],['Bounce',92],['Defense',78],['Leadership',92],['Fitness',84]],86,
  [['Test Wkts/Match','3-6'],['ODI Econ','5.0-6.0'],['Bat Avg','18-26'],['Win Rate','60-72%']]),

'cri-starc': mkp('cri-starc','Mitchell Starc','BOWL','56','aus-australia','Australia','#FFCD00',
  'Cricket',35,14,'Yorker king — most devastating left-arm pace bowler of his generation with swing.',
  [['Tests',82],['Test Wkts',342],['Test Avg','27.8'],['WC Wkts',50],['Swingiest','LHB Nemesis'],['Yorkers','Elite']],
  [['Tests 2024',6],['Wkts 2024',28],['Avg 2024','26.2'],['WC 2024 Wkts',22],['Economy','5.8'],['Swinging Deliveries','High']],
  [['Swing',98],['Pace',90],['Yorker',96],['LHB Threat',96],['Fitness',76],['Clutch',88]],82,
  [['Test Wkts/Match','3-6'],['WC Econ','5.5-6.8'],['Yorkers/Over','1.5-2.5'],['Bat Avg','10-18']]),

'cri-smith': mkp('cri-smith','Steve Smith','BAT','49','aus-australia','Australia','#FFCD00',
  'Cricket',35,16,'Unconventional genius — #1 Test batsman for years, Ashes destroyer.',
  [['Tests',110],['Test Avg','58.7'],['Test Runs',9532],['Centuries',33],['Ashes Avg','71.4'],['Runs Scored',9532]],
  [['Tests 2024',7],['Runs 2024',454],['Avg 2024','37.8'],['Centuries',0],['50s',4],['High Score',88]],
  [['Technique',98],['Mental',96],['Adaptability',90],['Clutch',94],['Power',68],['Consistency',92]],82,
  [['Test Avg','52-66'],['Centuries per Series','0-2'],['Ashes Avg','55-80'],['Runs/Match','60-100']]),

'cri-root': mkp('cri-root','Joe Root','BAT','66','eng-england','England','#003580',
  'Cricket',34,14,'England\'s greatest modern batsman — 12,000+ Test runs, extraordinary conversion rate.',
  [['Tests',144],['Test Avg','50.6'],['Test Runs',12726],['Centuries',34],['WC Titles',1],['Rank','Top 5 Ever']],
  [['Tests 2024',8],['Runs 2024',724],['Avg 2024','52.0'],['Centuries',2],['50s',4],['Balls Faced',12442]],
  [['Technique',96],['Consistency',96],['Off-Side',98],['Mental',88],['Adaptability',90],['Clutch',88]],86,
  [['Test Avg','46-60'],['Centuries/Year','2-4'],['Runs/Match','65-95'],['Conversion %','40-55%']]),

'cri-babar': mkp('cri-babar','Babar Azam','BAT','56','pak-pakistan','Pakistan','#009A44',
  'Cricket',30,10,'Pakistan captain — most elegant batter of his era, prolific across all formats.',
  [['Tests',54],['Test Avg','44.8'],['ODI Avg','59.4'],['ODI Runs',6238],['T20 Avg','40.2'],['WC 2022 Best','Player of Tournament']],
  [['Tests 2024',7],['Runs 2024',298],['Avg 2024','26.2'],['ODI 2024 Avg','38.4'],['T20 SR','132'],['Runs/Match','44']],
  [['Technique',94],['Elegance',98],['Off-Drive',98],['Consistency',88],['Clutch',78],['T20',84]],78,
  [['Test Avg','40-55'],['ODI Avg','50-65'],['T20 SR','128-148'],['Centuries/Year','3-6']]),

'cri-warner': mkp('cri-warner','David Warner','BAT','31','aus-australia','Australia','#FFCD00',
  'Cricket',38,16,'Opener extraordinaire — explosive start, Test average above 45, IPL legend.',
  [['Tests',112],['Test Avg','44.6'],['Test Runs',8786],['ODI Avg','45.3'],['T20I Runs',3277],['Sixes',300]],
  [['Tests 2024','Retired'],['IPL 2024',280],['T20WC 2024',192],['WC Final','45'],['Sixes/Innings','2.4'],['SR','143']],
  [['Power',94],['Aggression',94],['Technique',82],['Opening',92],['T20',88],['Big Game',90]],72,
  [['T20 SR','138-155'],['ODI Avg','38-50'],['Sixes/Match','2-4'],['Test Avg','40-52']]),

'cri-anderson': mkp('cri-anderson','James Anderson','BOWL','9','eng-england','England','#003580',
  'Cricket',42,22,'700 Test wickets — most by a pace bowler ever, supreme swing master.',
  [['Tests',187],['Test Wkts',700],['Test Avg','26.4'],['Swing','Master'],['Inswing','Elite'],['Experience','World Record']],
  [['Tests 2024',4],['Wkts 2024',18],['Avg 2024','28.4'],['Swing Conditions','Devastating'],['Fitness','68'],['Longevity','All-Time']],
  [['Swing',99],['Seam',98],['Accuracy',98],['Conditions Read',98],['Fitness',62],['Experience',99]],64,
  [['Test Wkts/Match','2-5'],['English Conditions Avg','18-24'],['Away Avg','28-38'],['Status','Near-Retirement']]),

'cri-kohli': mkp('cri-kohli','Virat Kohli','BAT','18','ind-india','India','#003580',
  'Cricket',36,16,'Run machine — 80 international centuries, greatest chaser in cricket history.',
  [['Tests',123],['Test Avg','48.7'],['Test Runs',9230],['ODI Avg','58.7'],['T20I Avg','52.7'],['Centuries',80]],
  [['Tests 2024',9],['Runs 2024',421],['Avg 2024','27.8'],['T20WC Runs',76],['ODI Avg 2024','55.4'],['Hundreds 2024',1]],
  [['Technique',96],['Chasing',99],['Mental',96],['Consistency',88],['Power',84],['Leadership',92]],80,
  [['Test Avg','42-55'],['ODI Avg','50-65'],['Chase Win%','74-84%'],['Centuries/Year','3-7']]),
};
