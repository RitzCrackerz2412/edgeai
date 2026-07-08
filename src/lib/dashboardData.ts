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
  { id: 'h05', sport: 'Soccer', homeTeam: 'Man City',           awayTeam: 'Brentford',         prediction: 'Manchester City',    actual: 'Manchester City',    correct: true,  confidence: 77, date: '2026-06-17', score: '3-1',   margin: 2  },
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
  { id: 'h22', sport: 'Soccer', homeTeam: 'Man City',           awayTeam: 'Arsenal',           prediction: 'Manchester City',    actual: 'Manchester City',    correct: true,  confidence: 71, date: '2026-05-10', score: '3-1',   margin: 2  },
  { id: 'h23', sport: 'NBA',    homeTeam: 'Boston Celtics',     awayTeam: 'Indiana Pacers',    prediction: 'Boston Celtics',     actual: 'Boston Celtics',     correct: true,  confidence: 86, date: '2026-05-08', score: '127-110', margin: 17},
  { id: 'h24', sport: 'NFL',    homeTeam: 'KC Chiefs',          awayTeam: 'Philadelphia Eagles',prediction: 'KC Chiefs',         actual: 'KC Chiefs',          correct: true,  confidence: 73, date: '2026-05-05', score: '24-17', margin: 7 },
  { id: 'h25', sport: 'MLB',    homeTeam: 'Houston Astros',     awayTeam: 'LA Dodgers',        prediction: 'LA Dodgers',         actual: 'Houston Astros',     correct: false, confidence: 64, date: '2026-05-02', score: '3-5',   margin: -2 },
];

export const CONFIDENCE_DISTRIBUTION = [
  { tier: '50–59%', accuracy: 54.2, count: 1876, color: '#ef4444' },
  { tier: '60–69%', accuracy: 61.7, count: 2104, color: '#f59e0b' },
  { tier: '70–79%', accuracy: 68.4, count: 1432, color: '#eab308' },
  { tier: '80–89%', accuracy: 76.8, count: 891,  color: '#22c55e' },
  { tier: '90–100%',accuracy: 84.2, count: 247,  color: '#6366f1' },
];
