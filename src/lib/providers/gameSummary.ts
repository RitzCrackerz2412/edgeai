import type { Sport } from '../types';

export interface PeriodScore {
  period: string;
  home: number;
  away: number;
}

export interface GameSummaryData {
  homeScore: number;
  awayScore: number;
  periods: PeriodScore[];
  attendance?: number;
}

function espnPath(sport: Sport, league: string): string | null {
  if (sport === 'NFL') return 'football/nfl';
  if (sport === 'NBA') return 'basketball/nba';
  if (sport === 'MLB') return 'baseball/mlb';
  if (sport === 'NHL') return 'hockey/nhl';
  if (sport === 'Soccer') {
    const m: Record<string, string> = {
      'EPL': 'soccer/eng.1', 'Premier League': 'soccer/eng.1',
      'La Liga': 'soccer/esp.1', 'Bundesliga': 'soccer/ger.1',
      'Serie A': 'soccer/ita.1', 'Ligue 1': 'soccer/fra.1',
      'MLS': 'soccer/usa.1', 'World Cup': 'soccer/fifa.world',
    };
    return m[league] ?? null;
  }
  return null;
}

function periodLabel(sport: Sport, num: number): string {
  if (sport === 'NFL' || sport === 'NBA') {
    if (num <= 4) return `Q${num}`;
    return num === 5 ? 'OT' : `OT${num - 4}`;
  }
  if (sport === 'MLB') return `${num}`;
  if (sport === 'NHL') {
    if (num <= 3) return `P${num}`;
    return 'OT';
  }
  if (sport === 'Soccer') {
    if (num === 1) return 'H1';
    if (num === 2) return 'H2';
    if (num === 3) return 'ET1';
    return 'ET2';
  }
  return `${num}`;
}

export async function getEspnGameSummary(
  espnId: string,
  sport: Sport,
  league: string,
): Promise<GameSummaryData | null> {
  const path = espnPath(sport, league);
  if (!path) return null;

  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/${path}/summary?event=${espnId}`;
    const r = await fetch(url, { next: { revalidate: 300 } });
    if (!r.ok) return null;
    const data = await r.json();

    const comp = data?.header?.competitions?.[0];
    if (!comp) return null;

    const competitors: {
      homeAway: string;
      score?: string;
      linescores?: { value: number; period?: { number: number } }[];
    }[] = comp.competitors ?? [];

    const home = competitors.find(c => c.homeAway === 'home');
    const away = competitors.find(c => c.homeAway === 'away');
    if (!home || !away) return null;

    const homeScore = parseInt(home.score ?? '0', 10);
    const awayScore = parseInt(away.score ?? '0', 10);

    const homeLines = home.linescores ?? [];
    const awayLines = away.linescores ?? [];

    const periods: PeriodScore[] = homeLines.map((ls, i) => ({
      period: periodLabel(sport, ls.period?.number ?? i + 1),
      home: ls.value ?? 0,
      away: awayLines[i]?.value ?? 0,
    }));

    return { homeScore, awayScore, periods, attendance: comp.attendance };
  } catch {
    return null;
  }
}
