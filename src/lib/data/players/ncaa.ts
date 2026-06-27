import { mkp } from './builder';
import type { PlayerDetail } from '@/lib/playerData';

export const NCAA_PLAYERS: Record<string, PlayerDetail> = {
'ncaa-ward': mkp('ncaa-ward','Dillon Gabriel','QB','8','oregon-ducks','Oregon Ducks','#154733',
  'NCAA FB',22,4,'2024 Heisman Trophy runner-up — dual-threat QB with elite accuracy and leadership.',
  [['Games',51],['Completions',1102],['Yards','13,555'],['TDs',128],['INTs',21],['QBR',74.8]],
  [['Games',14],['Completions',285],['Yards','3,871'],['TDs',37],['INTs',6],['QBR',78.4]],
  [['Accuracy',90],['IQ',88],['Arm Strength',80],['Mobility',78],['Leadership',88],['Pocket Poise',84]],76,
  [['Completion%','68-74%'],['Yards','3500-4200'],['TDs','32-40'],['QBR','70-80']]),

'ncaa-nix': mkp('ncaa-nix','Shedeur Sanders','QB','2','col-buffaloes','Colorado Buffaloes','#CFB87C',
  'NCAA FB',23,4,'Coach Prime\'s son — elite accuracy and clutch performer with high NFL ceiling.',
  [['Games',46],['Completions',1112],['Yards','13,148'],['TDs',102],['INTs',22],['QBR',72.4]],
  [['Games',12],['Completions',282],['Yards','3,327'],['TDs',27],['INTs',8],['QBR',71.2]],
  [['Accuracy',88],['Composure',88],['IQ',84],['Arm Strength',82],['Mobility',72],['Branding',96]],74,
  [['Completion%','68-76%'],['Yards','3000-3800'],['TDs','26-34'],['INTs','6-12']]),

'ncaa-hunter': mkp('ncaa-hunter','Travis Hunter','WR/CB','12','col-buffaloes','Colorado Buffaloes','#CFB87C',
  'NCAA FB',21,2,'2024 Heisman Trophy winner — plays both ways (elite WR and elite CB) at elite level.',
  [['Games',26],['Receptions',133],['Yards','1,952'],['TDs',17],['PBUs',14],['INTs',4]],
  [['Games',12],['Receptions',96],['Yards','1,258'],['TDs',15],['PBUs',12],['INTs',4]],
  [['Route Running',94],['Hands',94],['Coverage',92],['Speed',90],['Versatility',99],['Clutch',90]],88,
  [['Receptions','80-100'],['Yards','1100-1400'],['TDs','12-18'],['PBUs','10-15']]),

'ncaa-ashford': mkp('ncaa-ashford','Cam Ward','QB','1','miami-hurricanes','Miami Hurricanes','#F47321',
  'NCAA FB',22,4,'2024 Heisman Trophy winner — exceptional arm talent and big-game performer.',
  [['Games',48],['Completions',1034],['Yards','13,208'],['TDs',103],['INTs',25],['QBR',70.2]],
  [['Games',13],['Completions',296],['Yards','4,313'],['TDs',39],['INTs',7],['QBR',76.8]],
  [['Arm Strength',92],['Accuracy',88],['IQ',86],['Pocket Poise',86],['Mobility',76],['Clutch',88]],82,
  [['Completion%','64-72%'],['Yards','3800-4600'],['TDs','34-44'],['QBR','70-82']]),

'ncaa-bb-edey': mkp('ncaa-bb-edey','Zach Edey','C','14','pur-boilermakers','Purdue Boilermakers','#CEB888',
  'NCAA BB',22,4,'2× Naismith Award — most dominant center in college basketball since Kareem.',
  [['Games',144],['PPG',18.4],['RPG',12.1],['BPG',2.8],['FG%',62.4],['PER',32.8]],
  [['Games',39],['PPG',25.2],['RPG',12.2],['BPG',2.1],['FG%',61.8],['ORtg',124.4]],
  [['Post Scoring',99],['Rebounding',96],['Blocking',84],['Defense',82],['Footwork',90],['Strength',96]],88,
  [['PPG','22-28'],['RPG','11-14'],['BPG','1.8-2.8'],['FG%','59-66%']]),

'ncaa-bb-clingan': mkp('ncaa-bb-clingan','Donovan Clingan','C','32','con-huskies','UConn Huskies','#000E2F',
  'NCAA BB',21,2,'Back-to-back national champion at UConn — rim protector with excellent defensive IQ.',
  [['Games',77],['PPG',13.8],['RPG',9.2],['BPG',3.6],['FG%',63.2],['Def Rating',88.4]],
  [['Games',40],['PPG',13.4],['RPG',9.8],['BPG',3.8],['FG%',64.2],['Def Rating',86.2]],
  [['Rim Protection',98],['Rebounding',90],['Defense',92],['Post Scoring',78],['Mobility',78],['IQ',88]],84,
  [['PPG','12-16'],['RPG','8-11'],['BPG','3-5'],['FG%','60-68%']]),

'ncaa-bb-cooper': mkp('ncaa-bb-cooper','Paige Bueckers','PG','5','con-huskies-w','UConn Huskies W','#000E2F',
  'NCAA BB',23,4,'Most celebrated women\'s college player — elite scorer and passer with NBA-level handle.',
  [['Games',121],['PPG',19.8],['APG',4.8],['RPG',5.2],['FG%',50.6],['Win%','78%']],
  [['Games',37],['PPG',22.2],['APG',5.4],['RPG',5.6],['FG%',52.8],['3P%','42.2']],
  [['Ball Handling',98],['Scoring',92],['Playmaking',90],['Defense',78],['Clutch',92],['Leadership',88]],86,
  [['PPG','20-26'],['APG','4-6'],['FG%','49-56%'],['Clutch Bucket%','High']]),

'ncaa-bb-kwatts': mkp('ncaa-bb-kwatts','Caitlin Clark','G','22','iow-hawkeyes-w','Iowa Hawkeyes W','#FFCD00',
  'NCAA BB',23,4,'All-time scoring leader in NCAA basketball — transcendent shooter who transformed the WNBA.',
  [['Games',148],['PPG',28.4],['APG',8.4],['RPG',7.1],['3P Made',548],['Pts Total',3951]],
  [['Games',38],['PPG',31.6],['APG',8.9],['RPG',7.4],['3P Made',178],['Points','1,200']],
  [['Shooting',99],['Range',99],['Playmaking',92],['Vision',88],['Defense',64],['Charisma',99]],88,
  [['PPG','24-34'],['APG','7-10'],['3P Made/Game','4-7'],['FG%','44-50%']]),

'ncaa-bb-cooper2': mkp('ncaa-bb-cooper2','Angel Reese','F/C','10','lsu-tigers-w','LSU Tigers W','#461D7C',
  'NCAA BB',22,3,'2023 National Champion — double-double machine and most physical presence in women\'s game.',
  [['Games',96],['PPG',19.6],['RPG',13.2],['BPG',1.4],['FG%',57.8],['DD Streak',25]],
  [['Games',36],['PPG',23.2],['RPG',15.4],['BPG',1.2],['FG%',60.2],['DD',32]],
  [['Rebounding',98],['Post Scoring',88],['Defense',82],['Physicality',94],['Work Rate',94],['Motor',98]],84,
  [['PPG','20-26'],['RPG','13-16'],['DD Games%','82-92%'],['FG%','56-64%']]),
};
