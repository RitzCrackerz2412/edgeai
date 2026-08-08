/**
 * Dashboard data: activity feed, extended prediction history, trending.
 * Live replacement: sports API feeds + predictions table query.
 */

export interface ActivityItem {
  id: string;
  type: 'correct' | 'wrong' | 'upset' | 'high_conf' | 'streak' | 'model';
  sport: string;
  title: string;
  detail: string;
  confidence?: number;
  timestamp: string;
}

// ISO timestamps so relative-time labels stay accurate on each render
const T = (daysAgo: number, hoursAgo = 0) =>
  new Date(Date.now() - (daysAgo * 86_400_000 + hoursAgo * 3_600_000)).toISOString();

export const ACTIVITY_FEED: ActivityItem[] = [
  { id: 'a1', type: 'correct',   sport: 'NBA',    title: 'Correct pick',        detail: 'Boston Celtics beat NYK 124-109 · Predicted 88%',      confidence: 88, timestamp: T(0, 2)  },
  { id: 'a2', type: 'correct',   sport: 'NFL',    title: 'Correct pick',        detail: 'KC Chiefs beat CIN 28-21 · Predicted 81%',             confidence: 81, timestamp: T(0, 5)  },
  { id: 'a3', type: 'wrong',     sport: 'MLB',    title: 'Incorrect pick',      detail: 'NYY lost to HOU 3-4 · Predicted Yankees at 61%',        confidence: 61, timestamp: T(1)     },
  { id: 'a4', type: 'upset',     sport: 'NHL',    title: 'Upset alert',         detail: 'Toronto Maple Leafs have 35% upset chance vs COL',      confidence: 35, timestamp: T(1)     },
  { id: 'a5', type: 'correct',   sport: 'Soccer', title: 'Correct pick',        detail: 'Manchester City beat Arsenal 2-1 · Predicted 77%',      confidence: 77, timestamp: T(2)     },
  { id: 'a6', type: 'high_conf', sport: 'UFC',    title: 'High-confidence pick',detail: 'Jon Jones vs Stipe Miocic — 85% confidence tonight',    confidence: 85, timestamp: T(2)     },
  { id: 'a7', type: 'streak',    sport: 'NBA',    title: 'Win streak',          detail: 'Boston Celtics: 4-game win streak · Momentum +91',      timestamp: T(3)     },
  { id: 'a8', type: 'correct',   sport: 'NHL',    title: 'Correct pick',        detail: 'Colorado Avalanche beat TOR 4-2 · Predicted 76%',       confidence: 76, timestamp: T(3)     },
  { id: 'a9', type: 'model',     sport: 'ALL',    title: 'Model update',        detail: 'Accuracy improved to 71.2% over last 30 days (↑2.8%)',  timestamp: T(4)     },
  { id: 'a10',type: 'wrong',     sport: 'Soccer', title: 'Incorrect pick',      detail: 'Arsenal drew vs Brighton 1-1 · Predicted Arsenal 72%',  confidence: 72, timestamp: T(5)     },
];

export interface TrendingTeam {
  id: string;
  name: string;
  abbreviation: string;
  sport: string;
  color: string;
  direction: 'hot' | 'cold';
  streak: string;
  momentum: number;
  change: number; // momentum change last 7 days
}

export const TRENDING_TEAMS: TrendingTeam[] = [
  { id: 'bos-celtics',   name: 'Boston Celtics',      abbreviation: 'BOS', sport: 'NBA',    color: '#007A33', direction: 'hot',  streak: 'W4',  momentum: 91, change: +8  },
  { id: 'man-city',      name: 'Manchester City',     abbreviation: 'MCI', sport: 'Soccer', color: '#6CABDD', direction: 'hot',  streak: 'W4',  momentum: 88, change: +6  },
  { id: 'kc-chiefs',     name: 'Kansas City Chiefs',  abbreviation: 'KC',  sport: 'NFL',    color: '#E31837', direction: 'hot',  streak: 'W2',  momentum: 87, change: +3  },
  { id: 'col-avalanche', name: 'Colorado Avalanche',  abbreviation: 'COL', sport: 'NHL',    color: '#6F263D', direction: 'hot',  streak: 'W3',  momentum: 82, change: +5  },
  { id: 'buf-bills',     name: 'Buffalo Bills',       abbreviation: 'BUF', sport: 'NFL',    color: '#00338D', direction: 'cold', streak: 'L2',  momentum: 72, change: -4  },
  { id: 'lal-lakers',    name: 'Los Angeles Lakers',  abbreviation: 'LAL', sport: 'NBA',    color: '#552583', direction: 'cold', streak: 'L1',  momentum: 65, change: -7  },
];

// Extended prediction history for history page
export const EXTENDED_HISTORY = [
  // June 2026
  { id: 'h01', sport: 'NBA',    homeTeam: 'Boston Celtics',     awayTeam: 'NY Knicks',         prediction: 'Boston Celtics',     actual: 'Boston Celtics',     correct: true,  confidence: 88, date: '2026-06-24', score: '124-109', margin: 15 },
  { id: 'h02', sport: 'NFL',    homeTeam: 'KC Chiefs',          awayTeam: 'Cincinnati Bengals', prediction: 'KC Chiefs',          actual: 'KC Chiefs',          correct: true,  confidence: 81, date: '2026-06-22', score: '28-21',  margin: 7  },
  { id: 'h03', sport: 'MLB',    homeTeam: 'NY Yankees',         awayTeam: 'Houston Astros',    prediction: 'NY Yankees',         actual: 'Houston Astros',     correct: false, confidence: 61, date: '2026-06-18', score: '3-4',   margin: -1 },
  { id: 'h04', sport: 'NHL',    homeTeam: 'Colorado Avalanche', awayTeam: 'Toronto Maple Leafs',prediction: 'Colorado Avalanche', actual: 'Colorado Avalanche', correct: true,  confidence: 76, date: '2026-06-20', score: '4-2',   margin: 2  },
  { id: 'h05', sport: 'Soccer', homeTeam: 'Manchester City',     awayTeam: 'Brentford',         prediction: 'Manchester City',    actual: 'Manchester City',    correct: true,  confidence: 77, date: '2026-06-17', score: '3-1',   margin: 2  },
  { id: 'h06', sport: 'NBA',    homeTeam: 'Boston Celtics',     awayTeam: 'Milwaukee Bucks',   prediction: 'Boston Celtics',     actual: 'Boston Celtics',     correct: true,  confidence: 83, date: '2026-06-22', score: '129-112', margin: 17},
  { id: 'h07', sport: 'NBA',    homeTeam: 'Boston Celtics',     awayTeam: 'Philadelphia 76ers',prediction: 'Boston Celtics',     actual: 'Boston Celtics',     correct: true,  confidence: 79, date: '2026-06-20', score: '118-114', margin: 4 },
  { id: 'h08', sport: 'NBA',    homeTeam: 'LA Lakers',          awayTeam: 'Orlando Magic',     prediction: 'LA Lakers',          actual: 'Orlando Magic',      correct: false, confidence: 58, date: '2026-06-14', score: '104-112', margin: -8},
  { id: 'h09', sport: 'NFL',    homeTeam: 'KC Chiefs',          awayTeam: 'Las Vegas Raiders', prediction: 'KC Chiefs',          actual: 'KC Chiefs',          correct: true,  confidence: 88, date: '2026-06-08', score: '35-14', margin: 21},
  { id: 'h10', sport: 'NFL',    homeTeam: 'Denver Broncos',     awayTeam: 'KC Chiefs',         prediction: 'KC Chiefs',          actual: 'Denver Broncos',     correct: false, confidence: 71, date: '2026-06-15', score: '17-24', margin: -7},
  { id: 'h11', sport: 'Soccer', homeTeam: 'Arsenal',            awayTeam: 'Brighton',          prediction: 'Arsenal',            actual: 'Draw',               correct: false, confidence: 72, date: '2026-06-12', score: '1-1',   margin: 0  },
  { id: 'h12', sport: 'UFC',    homeTeam: 'Jon Jones',          awayTeam: 'Ciryl Gane',        prediction: 'Jon Jones',          actual: 'Jon Jones',          correct: true,  confidence: 83, date: '2026-06-05', score: 'TKO R3', margin: 0 },
  { id: 'h13', sport: 'NHL',    homeTeam: 'Colorado Avalanche', awayTeam: 'Minnesota Wild',    prediction: 'Colorado Avalanche', actual: 'Colorado Avalanche', correct: true,  confidence: 80, date: '2026-06-10', score: '5-3',   margin: 2  },
  { id: 'h14', sport: 'MLB',    homeTeam: 'NY Yankees',         awayTeam: 'Baltimore Orioles', prediction: 'NY Yankees',         actual: 'NY Yankees',         correct: true,  confidence: 68, date: '2026-06-08', score: '4-2',   margin: 2  },
  { id: 'h15', sport: 'NBA',    homeTeam: 'Denver Nuggets',     awayTeam: 'LA Lakers',         prediction: 'Denver Nuggets',     actual: 'Denver Nuggets',     correct: true,  confidence: 74, date: '2026-06-09', score: '115-108', margin: 7},
  // May 2026
  { id: 'h16', sport: 'Soccer', homeTeam: 'Liverpool',          awayTeam: 'Chelsea',           prediction: 'Liverpool',          actual: 'Liverpool',          correct: true,  confidence: 69, date: '2026-05-28', score: '2-0',   margin: 2  },
  { id: 'h17', sport: 'NBA',    homeTeam: 'Golden State Warriors',awayTeam:'Phoenix Suns',     prediction: 'Golden State Warriors',actual:'Golden State Warriors',correct:true, confidence: 65, date: '2026-05-25', score: '108-99',  margin: 9  },
  { id: 'h18', sport: 'NFL',    homeTeam: 'Buffalo Bills',      awayTeam: 'NY Jets',           prediction: 'Buffalo Bills',      actual: 'Buffalo Bills',      correct: true,  confidence: 82, date: '2026-05-22', score: '31-14', margin: 17},
  { id: 'h19', sport: 'MLB',    homeTeam: 'NY Yankees',         awayTeam: 'Houston Astros',    prediction: 'NY Yankees',         actual: 'NY Yankees',         correct: true,  confidence: 63, date: '2026-05-19', score: '4-2',   margin: 2  },
  { id: 'h20', sport: 'UFC',    homeTeam: 'Israel Adesanya',    awayTeam: 'Alex Pereira',      prediction: 'Israel Adesanya',    actual: 'Alex Pereira',       correct: false, confidence: 51, date: '2026-05-15', score: 'KO R4', margin: 0  },
  { id: 'h21', sport: 'NHL',    homeTeam: 'Boston Bruins',      awayTeam: 'Toronto Maple Leafs',prediction: 'Boston Bruins',     actual: 'Toronto Maple Leafs',correct: false, confidence: 67, date: '2026-05-12', score: '2-3 OT', margin: -1},
  { id: 'h22', sport: 'Soccer', homeTeam: 'Manchester City',     awayTeam: 'Arsenal',           prediction: 'Manchester City',    actual: 'Manchester City',    correct: true,  confidence: 71, date: '2026-05-10', score: '3-1',   margin: 2  },
  { id: 'h23', sport: 'NBA',    homeTeam: 'Boston Celtics',     awayTeam: 'Indiana Pacers',    prediction: 'Boston Celtics',     actual: 'Boston Celtics',     correct: true,  confidence: 86, date: '2026-05-08', score: '127-110', margin: 17},
  { id: 'h24', sport: 'NFL',    homeTeam: 'KC Chiefs',          awayTeam: 'Philadelphia Eagles',prediction: 'KC Chiefs',         actual: 'KC Chiefs',          correct: true,  confidence: 73, date: '2026-05-05', score: '24-17', margin: 7 },
  { id: 'h25', sport: 'MLB',    homeTeam: 'Houston Astros',     awayTeam: 'LA Dodgers',        prediction: 'LA Dodgers',         actual: 'Houston Astros',     correct: false, confidence: 64, date: '2026-05-02', score: '3-5',   margin: -2 },
];

// ── Derived helpers ────────────────────────────────────────────────────────────

const TEAM_COLORS: Record<string, string> = {
  'Boston Celtics': '#007A33', 'NY Knicks': '#006BB6', 'Milwaukee Bucks': '#00471B',
  'Philadelphia 76ers': '#006BB6', 'Indiana Pacers': '#002D62', 'LA Lakers': '#552583',
  'Los Angeles Lakers': '#552583', 'Denver Nuggets': '#0E2240', 'Orlando Magic': '#0077C0',
  'Golden State Warriors': '#1D428A', 'Phoenix Suns': '#1D1160', 'LA Clippers': '#1D428A',
  'KC Chiefs': '#E31837', 'Kansas City Chiefs': '#E31837', 'Cincinnati Bengals': '#FB4F14',
  'Denver Broncos': '#FB4F14', 'Las Vegas Raiders': '#A5ACAF', 'Buffalo Bills': '#00338D',
  'NY Jets': '#125740', 'Philadelphia Eagles': '#004C54',
  'NY Yankees': '#003087', 'New York Yankees': '#003087', 'Houston Astros': '#002D62',
  'Baltimore Orioles': '#DF4601', 'LA Dodgers': '#005A9C',
  'Colorado Avalanche': '#6F263D', 'Toronto Maple Leafs': '#00205B',
  'Boston Bruins': '#FFB81C', 'Minnesota Wild': '#154734',
  'Manchester City': '#6CABDD', 'Man City': '#6CABDD',
  'Arsenal': '#EF0107', 'Liverpool': '#C8102E', 'Chelsea': '#034694', 'Brighton': '#0057B8',
  'Jon Jones': '#dc2626', 'Ciryl Gane': '#6366f1',
  'Israel Adesanya': '#dc2626', 'Alex Pereira': '#b45309',
};

const TEAM_ABBREVIATIONS: Record<string, string> = {
  'Boston Celtics': 'BOS', 'NY Knicks': 'NYK', 'Milwaukee Bucks': 'MIL',
  'Philadelphia 76ers': '76S', 'Indiana Pacers': 'IND', 'LA Lakers': 'LAL',
  'Los Angeles Lakers': 'LAL', 'Denver Nuggets': 'DEN', 'Orlando Magic': 'ORL',
  'Golden State Warriors': 'GSW', 'Phoenix Suns': 'PHX',
  'KC Chiefs': 'KC', 'Kansas City Chiefs': 'KC', 'Cincinnati Bengals': 'CIN',
  'Denver Broncos': 'DEN', 'Las Vegas Raiders': 'LVR', 'Buffalo Bills': 'BUF',
  'NY Jets': 'NYJ', 'Philadelphia Eagles': 'PHI',
  'NY Yankees': 'NYY', 'New York Yankees': 'NYY', 'Houston Astros': 'HOU',
  'Baltimore Orioles': 'BAL', 'LA Dodgers': 'LAD',
  'Colorado Avalanche': 'COL', 'Toronto Maple Leafs': 'TOR',
  'Boston Bruins': 'BOS', 'Minnesota Wild': 'MIN',
  'Manchester City': 'MCI', 'Man City': 'MCI',
  'Arsenal': 'ARS', 'Liverpool': 'LIV', 'Chelsea': 'CHE', 'Brighton': 'BHA',
};

/** Last `count` resolved predictions from history, newest first. */
export function getRecentPredictions(count = 7) {
  return [...EXTENDED_HISTORY]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, count);
}

/** Teams with a 2+ win/loss streak derived from EXTENDED_HISTORY, hottest first. */
export function getTrendingTeams(limit = 6): TrendingTeam[] {
  const teamRecords: Record<string, { date: string; won: boolean; sport: string }[]> = {};

  for (const game of EXTENDED_HISTORY) {
    const entries = [
      { name: game.homeTeam, won: game.actual === game.homeTeam, sport: game.sport },
      { name: game.awayTeam, won: game.actual === game.awayTeam, sport: game.sport },
    ];
    for (const { name, won, sport } of entries) {
      if (!teamRecords[name]) teamRecords[name] = [];
      teamRecords[name].push({ date: game.date, won, sport });
    }
  }

  const results: TrendingTeam[] = [];
  for (const [teamName, records] of Object.entries(teamRecords)) {
    const sorted = records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (sorted.length < 2) continue;

    const latestWon = sorted[0].won;
    let streak = 0;
    for (const r of sorted) {
      if (r.won === latestWon) streak++;
      else break;
    }
    if (streak < 2) continue;

    const direction: 'hot' | 'cold' = latestWon ? 'hot' : 'cold';
    const sport = sorted[0].sport;
    const abbr = TEAM_ABBREVIATIONS[teamName] ?? teamName.split(' ').slice(-1)[0].slice(0, 3).toUpperCase();
    const color = TEAM_COLORS[teamName] ?? '#888888';
    const winPct = sorted.filter(r => r.won).length / sorted.length;
    const momentum = direction === 'hot'
      ? Math.round(Math.min(50 + streak * 8 + winPct * 25, 99))
      : Math.round(Math.max(50 - streak * 8 - (1 - winPct) * 25, 1));

    results.push({
      id: teamName.toLowerCase().replace(/\s+/g, '-'),
      name: teamName,
      abbreviation: abbr,
      sport,
      color,
      direction,
      streak: `${direction === 'hot' ? 'W' : 'L'}${streak}`,
      momentum,
      change: direction === 'hot' ? streak * 2 : -(streak * 2),
    });
  }

  return results
    .sort((a, b) => {
      if (a.direction !== b.direction) return a.direction === 'hot' ? -1 : 1;
      return b.momentum - a.momentum;
    })
    .slice(0, limit);
}

export const CONFIDENCE_DISTRIBUTION = [
  { tier: '50–59%', accuracy: 54.2, count: 1876, color: '#ef4444' },
  { tier: '60–69%', accuracy: 61.7, count: 2104, color: '#f59e0b' },
  { tier: '70–79%', accuracy: 68.4, count: 1432, color: '#eab308' },
  { tier: '80–89%', accuracy: 76.8, count: 891,  color: '#22c55e' },
  { tier: '90–100%',accuracy: 84.2, count: 247,  color: '#6366f1' },
];
