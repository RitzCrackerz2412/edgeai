import { mkp } from './builder';
import type { PlayerDetail } from '@/lib/playerData';

export const ESPORTS_PLAYERS: Record<string, PlayerDetail> = {
'es-faker': mkp('es-faker','Lee "Faker" Sang-hyeok','Mid','1','t1-t1','T1','#C6202C',
  'Esports',28,12,'4× World Champion — the greatest League of Legends player ever, "The Unkillable Demon King".',
  [['Worlds Titles',4],['LCK Titles',13],['KDA','5.2'],['CS/Min','9.1'],['DMG Share','27%'],['Pentakills',42]],
  [['2024 Season','Worlds Runner-Up'],['Games',68],['KDA','5.8'],['CS/Min','9.4'],['Gold/Min','482'],['VSVP',4]],
  [['Mechanics',99],['Game IQ',99],['Champion Pool',96],['Clutch',98],['Leadership',98],['Consistency',96]],92,
  [['KDA','5-7'],['CS/Min','9.0-9.6'],['DMG/Min','680-760'],['Win Rate','62-72%']]),

'es-zywo': mkp('es-zywo','Zywoo','AWP','26','vit-vitality','Team Vitality','#FFFF00',
  'Esports',23,5,'Consistent #1 CS2 player in the world — superhuman AWP accuracy and clutch performance.',
  [['Rating','1.28'],['HLTV Rank',1],['Clutch%','64%'],['HS%','38%'],['KAST','74%'],['Opening Kills/Map','0.88']],
  [['2024 Rating','1.26'],['2024 MVPs',4],['HLTV Rank',1],['K/D','1.28'],['ADR','89.4'],['Impact','1.56']],
  [['AWP',99],['Clutch',96],['Consistency',96],['Positioning',92],['Mechanics',94],['IQ',92]],90,
  [['Rating','1.20-1.32'],['K/D','1.18-1.36'],['ADR','86-96'],['Clutch%','58-70%']]),

'es-s1mple': mkp('es-s1mple','Oleksandr "s1mple" Kostyliev','AWP','1','navi-navi','Natus Vincere','#F4CA00',
  'Esports',27,11,'Highest all-time peak in CS:GO history — retired from active play, #1 player 2016-2022.',
  [['Career Rating','1.33'],['HLTV Rank',1],['Majors',1],['MVPs',9],['Clutch%','68%'],['Consistency','Legendary']],
  [['Status','Inactive'],['Last Active','2023'],['Peak Rating','1.42'],['Career KD','1.37'],['HS%','44%'],['Legacy','All-Time']],
  [['AWP',99],['Mechanics',99],['Clutch',98],['Aggression',96],['IQ',94],['Legacy',99]],0,
  [['Status','Retired/Inactive'],['Peak Rating','1.33-1.42'],['Career Legacy','All-Time #1']]),

'es-niko': mkp('es-niko','Nikola "NiKo" Kovač','Rifler','7','g2-g2-esports','G2 Esports','#101A1F',
  'Esports',27,9,'Most mechanical rifler in CS2 — world-class aim with captaincy aspirations.',
  [['Rating','1.23'],['HLTV Rank',3],['HS%','48%'],['KAST','72%'],['ADR','86.2'],['Opening Kills/Map','0.72']],
  [['2024 Rating','1.22'],['2024 MVPs',2],['K/D','1.20'],['ADR','84.8'],['KAST','70%'],['Clutch%','54%']],
  [['Aim',99],['Rifles',96],['Entry Frag',84],['Clutch',84],['IQ',86],['Consistency',84]],82,
  [['Rating','1.16-1.28'],['K/D','1.14-1.26'],['ADR','82-92'],['Opening Kill%','44-54%']]),

'es-donk': mkp('es-donk','Danil "donk" Kryshkovets','Rifler','21','spi-spirit','Team Spirit','#1B4B9A',
  'Esports',19,2,'Youngest major winner ever — explosive raw talent that outclassed veterans at world events.',
  [['Rating','1.30'],['HLTV Rank',2],['Majors',1],['Age','19 (youngest ever)'],['HS%','52%'],['Impact','1.78']],
  [['2024 Rating','1.34'],['2024 MVPs',3],['HLTV Rank',2],['K/D','1.32'],['ADR','92.4'],['KAST','74%']],
  [['Mechanics',96],['Raw Aim',98],['Aggression',92],['Clutch',88],['IQ',82],['Upside',99]],88,
  [['Rating','1.24-1.38'],['K/D','1.22-1.38'],['ADR','88-98'],['Clutch%','52-64%']]),

'es-bugha': mkp('es-bugha','Kyle "Bugha" Giersdorf','Builder/Aim','0','sen-sentinels','Sentinels','#4CAF50',
  'Esports',22,5,'2019 Fortnite World Champion ($3M prize) — elite builder-fighter hybrid gameplay.',
  [['World Cup',1],['FNCS Wins',3],['Earnings','$4.2M'],['Placements',1],['Kill Avg','7.8'],['Win Rate','28%']],
  [['2024 Events',12],['Top 10%','68%'],['Elims/Match','8.2'],['Win Rate','24%'],['FNCS Finals',3],['Points','4200']],
  [['Building',96],['Aim',92],['IQ',90],['Clutch',88],['Consistency',86],['Adaptability',84]],80,
  [['Top 10%','62-74%'],['Elims/Match','6-10'],['FNCS Finals','2-4'],['Win Rate','20-30%']]),

'es-crit-tenz': mkp('es-crit-tenz','Tyson "TenZ" Ngo','Entry/Duelist','10','sen-sentinels','Sentinels','#4CAF50',
  'Esports',24,5,'Most mechanically gifted Valorant player — Jett specialist with superhuman flick shots.',
  [['VCT Titles',1],['Rating','1.22'],['ACS Avg',248],['KD','1.24'],['FK%','28%'],['Clutch%','44%']],
  [['2024 Season','VCT Americas'],['ACS','224'],['KD','1.18'],['HS%','32%'],['FK Avg','1.2/map'],['Rating','1.18']],
  [['Mechanics',99],['Dueling',96],['Entry',90],['Clutch',84],['Consistency',80],['Leadership',74]],77,
  [['ACS','215-250'],['KD','1.10-1.30'],['FK%','24-34%'],['Win Rate','55-68%']]),

'es-aspas': mkp('es-aspas','Kévin "Aspas" Rabier','Duelist','4','kru-kru-esports','KRU Esports','#1A1A2E',
  'Esports',28,7,'Best Valorant player in EMEA — consistent performer with elite mechanics and game sense.',
  [['VCT EMEA Titles',1],['Rating','1.28'],['ACS Avg',252],['KD','1.30'],['MVPs',6],['Top Fragger %','72%']],
  [['2024 Rating','1.26'],['ACS','246'],['KD','1.28'],['HS%','30%'],['FK Avg','1.4/map'],['Clutch%','48%']],
  [['Mechanics',96],['Dueling',94],['Game Sense',92],['Clutch',86],['Consistency',90],['Leadership',80]],83,
  [['ACS','234-256'],['KD','1.20-1.38'],['FK%','26-36%'],['Win Rate','58-70%']]),

'es-miracle': mkp('es-miracle','Amer "Miracle-" Al-Barkawi','Carry','12','nig-nigma','Nigma Galaxy','#FF6600',
  'Esports',28,10,'All-time great Dota 2 carry — mechanical wizard who can win games single-handedly.',
  [['TI Top4',2],['Tournament Wins',12],['GPM Avg',712],['KDA','6.8'],['XPM',714],['Last Hits/Min','8.6']],
  [['2024 Season','Dota Pro Circuit'],['GPM','722'],['KDA','6.4'],['Win Rate','58%'],['Hero Pool',42],['Carry Win Rate','64%']],
  [['Mechanics',98],['Last Hitting',96],['Farming',96],['IQ',90],['Hero Pool',92],['Clutch',88]],80,
  [['GPM','680-740'],['KDA','5.5-7.5'],['Carry Win Rate','55-68%'],['Tournament Wins per year','2-5']]),

'es-caps': mkp('es-caps','Rasmus "Caps" Winther','Mid','22','g2-g2-esports','G2 Esports','#101A1F',
  'Esports',25,7,'Best Western LoL player — aggressive style that earned the nickname "Baby Faker".',
  [['Worlds Finals',2],['LEC Titles',8],['KDA','4.6'],['CS/Min','8.6'],['Win Rate','57%'],['MVPs',6]],
  [['2024 Season','LEC Split 1'],['Games',44],['KDA','4.8'],['CS/Min','8.8'],['Gold/Min','468'],['DPM','614']],
  [['Aggression',94],['Mechanics',92],['Champion Pool',90],['Clutch',90],['IQ',88],['Leadership',86]],82,
  [['KDA','4.0-5.6'],['CS/Min','8.4-9.0'],['Win Rate','54-64%'],['DPM','580-660']]),
};
