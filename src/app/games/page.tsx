import Link from 'next/link';
import { getUpcomingGames, getLeagues } from '@/lib/api';
import type { Game, LeagueFixture } from '@/lib/types';
import { sportIcon } from '@/lib/utils';

function todayStr()    { return new Date().toISOString().split('T')[0]; }
function tomorrowStr() { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; }
function weekEndStr()  { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().split('T')[0]; }

function classify(dateStr: string): 'today' | 'tomorrow' | 'week' | 'later' {
  const day = dateStr.slice(0, 10);
  if (day === todayStr())    return 'today';
  if (day === tomorrowStr()) return 'tomorrow';
  if (day <= weekEndStr())   return 'week';
  return 'later';
}

interface DisplayGame {
  id: string;
  home: string; homeAbbr: string; homeColor: string;
  away: string; awayAbbr: string; awayColor: string;
  sport: string; league: string;
  date: string; time?: string;
  confidence?: number; predictedWinner?: string;
  type: 'prediction' | 'fixture';
  href?: string;
}

export default async function GamesPage() {
  const [mockGames, leagues] = await Promise.all([
    getUpcomingGames(),
    getLeagues(),
  ]);

  const display: DisplayGame[] = [];

  for (const g of mockGames) {
    display.push({
      id: g.id,
      home: g.homeTeam.name, homeAbbr: g.homeTeam.abbreviation, homeColor: g.homeTeam.color,
      away: g.awayTeam.name, awayAbbr: g.awayTeam.abbreviation, awayColor: g.awayTeam.color,
      sport: g.sport, league: g.league,
      date: g.date, time: g.time,
      confidence: g.prediction.confidence,
      predictedWinner: g.prediction.winner,
      type: 'prediction',
      href: `/game/${g.id}`,
    });
  }

  for (const league of leagues) {
    for (const f of league.fixtures.filter(fx => fx.status === 'Upcoming').slice(0, 3)) {
      display.push({
        id: `${league.id}-${f.date}-${f.homeAbbr}`,
        home: f.home, homeAbbr: f.homeAbbr, homeColor: f.homeColor,
        away: f.away, awayAbbr: f.awayAbbr, awayColor: f.awayColor,
        sport: league.sport, league: league.shortName,
        date: f.date,
        type: 'fixture',
      });
    }
  }

  display.sort((a, b) => a.date.localeCompare(b.date));

  const buckets: Record<string, DisplayGame[]> = { today: [], tomorrow: [], week: [], later: [] };
  for (const g of display) buckets[classify(g.date)].push(g);

  const tabs: { key: string; label: string; count: number }[] = [
    { key: 'today',    label: 'Today',     count: buckets.today.length },
    { key: 'tomorrow', label: 'Tomorrow',  count: buckets.tomorrow.length },
    { key: 'week',     label: 'This Week', count: buckets.week.length },
    { key: 'later',    label: 'Upcoming',  count: buckets.later.length },
  ].filter(t => t.count > 0);

  const allBySport = groupBySport(display);

  return (
    <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8 space-y-10">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Games
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Upcoming fixtures and predictions across all leagues
        </p>
      </header>

      {/* By date bucket */}
      {tabs.map(tab => (
        <section key={tab.key} className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              {tab.label}
            </h2>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
            >
              {tab.count}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {buckets[tab.key].map(g => <GameCard key={g.id} g={g} />)}
          </div>
        </section>
      ))}

      {/* By sport */}
      {display.length === 0 && (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No upcoming games found.</p>
      )}

      {allBySport.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>By Sport</h2>
          {allBySport.map(({ sport, games }) => (
            <div key={sport} className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                <span>{sportIcon(sport as never)}</span>
                <span className="uppercase tracking-widest text-[10px]">{sport}</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {games.map(g => <GameCard key={g.id} g={g} compact />)}
              </div>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}

function groupBySport(games: DisplayGame[]) {
  const map: Record<string, DisplayGame[]> = {};
  for (const g of games) {
    if (!map[g.sport]) map[g.sport] = [];
    map[g.sport].push(g);
  }
  return Object.entries(map).map(([sport, games]) => ({ sport, games }));
}

function GameCard({ g, compact = false }: { g: DisplayGame; compact?: boolean }) {
  const date = new Date(g.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const isPrediction = g.type === 'prediction';

  const inner = (
    <div
      className={`rounded-xl p-4 space-y-3 h-full transition-colors ${g.href ? 'cursor-pointer' : ''}`}
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold truncate" style={{ color: 'var(--text-muted)' }}>
          {g.league}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{date}</span>
          {isPrediction && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
              style={{ background: 'var(--accent-dim)', color: 'var(--accent-light)' }}
            >
              AI
            </span>
          )}
        </div>
      </div>

      {/* Teams */}
      <div className="space-y-1.5">
        <TeamRow name={g.home} abbr={g.homeAbbr} color={g.homeColor}
          isWinner={isPrediction && g.predictedWinner === g.home} />
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>vs</span>
          <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
        </div>
        <TeamRow name={g.away} abbr={g.awayAbbr} color={g.awayColor}
          isWinner={isPrediction && g.predictedWinner === g.away} />
      </div>

      {/* Confidence */}
      {!compact && isPrediction && g.confidence !== undefined && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Confidence</span>
            <span className="text-[10px] font-semibold" style={{ color: 'var(--text-primary)' }}>{g.confidence}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-surface)' }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${g.confidence}%`, background: 'var(--accent)' }}
            />
          </div>
        </div>
      )}
    </div>
  );

  return g.href ? <Link href={g.href} className="block h-full">{inner}</Link> : inner;
}

function TeamRow({ name, abbr, color, isWinner }: { name: string; abbr: string; color: string; isWinner: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
      <span
        className="text-sm truncate"
        style={{ color: isWinner ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: isWinner ? 600 : 400 }}
      >
        {name}
      </span>
      {isWinner && (
        <span className="text-[10px] ml-auto font-bold" style={{ color: 'var(--accent-light)' }}>★</span>
      )}
    </div>
  );
}
