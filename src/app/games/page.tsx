import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { getUpcomingGames } from '@/lib/api';
import type { Game } from '@/lib/types';
import { isoDateInTZ } from '@/lib/utils';

export const revalidate = 60;

// ── Bucket classification ─────────────────────────────────────────────────────

type Bucket = 'live' | 'today' | 'tomorrow' | 'week' | 'later' | 'finished';

function classify(game: Game): Bucket {
  if (game.status === 'Live' || game.status === 'Halftime' || game.status === 'Pregame') return 'live';
  if (game.status === 'Final' || game.status === 'Final/OT' || game.status === 'Final/SO') return 'finished';
  if (game.status === 'Postponed' || game.status === 'Cancelled') return 'finished';

  const now  = new Date();
  const d0   = isoDateInTZ(now, 'America/New_York');
  const d1   = isoDateInTZ(new Date(now.getTime() + 86_400_000), 'America/New_York');
  const d7   = isoDateInTZ(new Date(now.getTime() + 7 * 86_400_000), 'America/New_York');
  const date = game.date.slice(0, 10);

  if (date === d0) return 'today';
  if (date === d1) return 'tomorrow';
  if (date <= d7)  return 'week';
  return 'later';
}

// ── Status helpers ────────────────────────────────────────────────────────────

function isFinal(s: Game['status']) { return s === 'Final' || s === 'Final/OT' || s === 'Final/SO'; }
function isLive(s: Game['status'])  { return s === 'Live' || s === 'Halftime'; }
function hasScore(g: Game)          { return (isFinal(g.status) || isLive(g.status)) && g.homeScore !== undefined && g.awayScore !== undefined; }

// ── Sport colors ──────────────────────────────────────────────────────────────

const SPORT_COLOR: Record<string, string> = {
  NFL: 'var(--sport-nfl)',   NBA: 'var(--sport-nba)',   MLB: 'var(--sport-mlb)',
  NHL: 'var(--sport-nhl)',   Soccer: 'var(--sport-soccer)', 'NCAA Football': 'var(--sport-ncaaf)',
  'NCAA Basketball': 'var(--sport-ncaab)', UFC: 'var(--sport-ufc)', Boxing: 'var(--sport-boxing)',
  Tennis: 'var(--sport-tennis)', 'Formula 1': 'var(--sport-f1)', Cricket: 'var(--sport-cricket)',
  Esports: 'var(--sport-esports)',
};

// ── Sorting + grouping ────────────────────────────────────────────────────────

function sortGames(arr: Game[]) {
  return [...arr].sort((a, b) => (a.scheduledAt ?? a.date).localeCompare(b.scheduledAt ?? b.date));
}

// League priority — high-profile leagues first
const LEAGUE_PRIORITY: Record<string, number> = {
  'World Cup': 0, 'Club World Cup': 1, 'Champions League': 2, 'Europa League': 3,
  NFL: 5, NBA: 6, MLB: 7, NHL: 8,
  'Copa Libertadores': 10, 'Nations League': 11,
};

function groupByLeague(games: Game[]): { league: string; sport: string; games: Game[] }[] {
  const map = new Map<string, { sport: string; games: Game[] }>();
  for (const g of games) {
    if (!map.has(g.league)) map.set(g.league, { sport: g.sport, games: [] });
    map.get(g.league)!.games.push(g);
  }
  return Array.from(map.entries())
    .map(([league, { sport, games }]) => ({ league, sport, games: sortGames(games) }))
    .sort((a, b) => (LEAGUE_PRIORITY[a.league] ?? 50) - (LEAGUE_PRIORITY[b.league] ?? 50));
}

// ── Time formatting ───────────────────────────────────────────────────────────

function fmtTime(g: Game): string {
  if (g.scheduledAt) {
    return new Date(g.scheduledAt).toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/New_York',
    }) + ' ET';
  }
  return g.time ?? '';
}

function fmtDate(g: Game): string {
  const ref = g.scheduledAt ?? (g.date + 'T00:00:00');
  return new Date(ref).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', timeZone: 'America/New_York',
  });
}

// ── Prediction outcome ────────────────────────────────────────────────────────

function outcome(g: Game): 'correct' | 'incorrect' | null {
  if (!isFinal(g.status) || g.homeScore === undefined || g.awayScore === undefined) return null;
  const actual = g.homeScore >= g.awayScore ? g.homeTeam.name : g.awayTeam.name;
  return actual === g.prediction.winner ? 'correct' : 'incorrect';
}

// ── Live Scoreboard Card ──────────────────────────────────────────────────────

function LiveScoreCard({ game: g }: { game: Game }) {
  const scoreAvail = hasScore(g);
  const homeLeads  = scoreAvail && g.homeScore! > g.awayScore!;
  const awayLeads  = scoreAvail && g.awayScore! > g.homeScore!;
  const winHome    = g.prediction.winner === g.homeTeam.name;
  const homeWin    = winHome ? g.prediction.winProbability : 100 - g.prediction.winProbability;

  return (
    <Link href={`/game/${g.id}`} className="live-card">
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ fontSize:'0.5625rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color: SPORT_COLOR[g.sport] ?? 'var(--accent-light)' }}>
          {g.league}
        </span>
        <div style={{ display:'flex', alignItems:'center', gap:'0.3125rem' }}>
          <span className="live-dot-sm" />
          <span style={{ fontSize:'0.5625rem', fontWeight:700, color:'#ef4444' }}>
            {g.status === 'Halftime' ? 'HT' : g.clock ? g.clock : 'LIVE'}
            {g.status !== 'Halftime' && g.period ? ` · P${g.period}` : ''}
          </span>
        </div>
      </div>

      {/* Teams + scores */}
      <div style={{ display:'flex', flexDirection:'column', gap:'0.375rem' }}>
        {[
          { team: g.homeTeam, score: g.homeScore, leads: homeLeads, predicted: winHome },
          { team: g.awayTeam, score: g.awayScore, leads: awayLeads, predicted: !winHome },
        ].map(({ team, score, leads, predicted }) => (
          <div key={team.id} style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
            <span style={{ width:7, height:7, borderRadius:'50%', background:team.color, flexShrink:0, display:'inline-block' }} />
            <span style={{ fontSize:'0.8125rem', fontWeight:leads ? 700 : 400, color:leads ? 'var(--text-primary)' : 'var(--text-secondary)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {team.name.split(' ').slice(-1)[0]}
            </span>
            {scoreAvail && (
              <span className="text-score" style={{ fontSize:'1.25rem', color:leads ? team.color : 'var(--text-primary)' }}>
                {score ?? 0}
              </span>
            )}
            {!scoreAvail && predicted && (
              <span style={{ fontSize:'0.5625rem', fontWeight:700, color:'var(--accent-light)' }}>●</span>
            )}
          </div>
        ))}
      </div>

      {/* Win probability */}
      <div>
        <div style={{ height:2, borderRadius:1, overflow:'hidden', display:'flex', background:'var(--bg-surface)' }}>
          <div style={{ height:'100%', width:`${homeWin}%`, background:g.homeTeam.color, transition:'width 0.4s' }} />
          <div style={{ height:'100%', flex:1, background:g.awayTeam.color }} />
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:'0.25rem' }}>
          <span style={{ fontSize:'0.5625rem', color:'var(--text-muted)', fontVariantNumeric:'tabular-nums' }}>{homeWin.toFixed(0)}%</span>
          {g.venue && <span style={{ fontSize:'0.5625rem', color:'var(--text-muted)', overflow:'hidden', textOverflow:'ellipsis', maxWidth:'8rem', whiteSpace:'nowrap', textAlign:'center' }}>{g.venue.split(',')[0]}</span>}
          <span style={{ fontSize:'0.5625rem', color:'var(--text-muted)', fontVariantNumeric:'tabular-nums' }}>{(100-homeWin).toFixed(0)}%</span>
        </div>
      </div>
    </Link>
  );
}

// ── Fixture Row ───────────────────────────────────────────────────────────────

function FixtureRow({ game: g }: { game: Game }) {
  const scored    = hasScore(g);
  const homeLeads = scored && g.homeScore! > g.awayScore!;
  const awayLeads = scored && g.awayScore! > g.homeScore!;
  const result    = outcome(g);
  const winHome   = g.prediction.winner === g.homeTeam.name;
  const homePct   = winHome ? g.prediction.winProbability : 100 - g.prediction.winProbability;
  const awayPct   = 100 - homePct;
  const leadSide  = homePct >= awayPct ? 'home' : 'away';

  return (
    <Link href={`/game/${g.id}`} className="fixture-row">
      {/* Home team */}
      <div style={{ display:'flex', alignItems:'center', gap:'0.4375rem', minWidth:0, overflow:'hidden' }}>
        <span style={{ width:7, height:7, borderRadius:'50%', background:g.homeTeam.color, flexShrink:0, display:'inline-block' }} />
        <span style={{
          fontSize:'0.8125rem',
          fontWeight: (homeLeads || (!scored && winHome)) ? 600 : 400,
          color:      (homeLeads || (!scored && winHome)) ? 'var(--text-primary)' : 'var(--text-secondary)',
          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
        }}>
          {g.homeTeam.name}
        </span>
      </div>

      {/* Center: score / time / status */}
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'0.0625rem' }}>
        {scored ? (
          <span className="text-score" style={{ fontSize:'0.9375rem', color:'var(--text-primary)', letterSpacing:'-0.02em' }}>
            <span style={{ color:homeLeads ? g.homeTeam.color : 'var(--text-primary)' }}>{g.homeScore}</span>
            <span style={{ color:'var(--text-muted)', margin:'0 3px' }}>–</span>
            <span style={{ color:awayLeads ? g.awayTeam.color : 'var(--text-primary)' }}>{g.awayScore}</span>
          </span>
        ) : isLive(g.status) ? (
          <span style={{ fontSize:'0.625rem', fontWeight:700, color:'#ef4444' }}>
            {g.clock ? g.clock : 'LIVE'}{g.period ? ` P${g.period}` : ''}
          </span>
        ) : (
          <span style={{ fontSize:'0.6875rem', color:'var(--text-muted)', whiteSpace:'nowrap', fontVariantNumeric:'tabular-nums' }}>
            {fmtTime(g)}
          </span>
        )}
        {isFinal(g.status) && (
          <span style={{ fontSize:'0.5rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em' }}>FT</span>
        )}
        {g.status === 'Halftime' && (
          <span style={{ fontSize:'0.5rem', fontWeight:700, color:'#f59e0b', textTransform:'uppercase', letterSpacing:'0.08em' }}>HT</span>
        )}
        {(g.status === 'Postponed' || g.status === 'Cancelled') && (
          <span style={{ fontSize:'0.5rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em' }}>{g.status.toUpperCase()}</span>
        )}
      </div>

      {/* Away team */}
      <div style={{ display:'flex', alignItems:'center', gap:'0.4375rem', minWidth:0, overflow:'hidden', justifyContent:'flex-end' }}>
        <span style={{
          fontSize:'0.8125rem',
          fontWeight: (awayLeads || (!scored && !winHome)) ? 600 : 400,
          color:      (awayLeads || (!scored && !winHome)) ? 'var(--text-primary)' : 'var(--text-secondary)',
          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', textAlign:'right',
        }}>
          {g.awayTeam.name}
        </span>
        <span style={{ width:7, height:7, borderRadius:'50%', background:g.awayTeam.color, flexShrink:0, display:'inline-block' }} />
      </div>

      {/* Prediction */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end' }}>
        {result === 'correct' && (
          <span style={{ fontSize:'0.5625rem', fontWeight:700, padding:'0.125rem 0.375rem', borderRadius:3, background:'rgba(16,185,129,0.1)', color:'#10b981' }}>✓</span>
        )}
        {result === 'incorrect' && (
          <span style={{ fontSize:'0.5625rem', fontWeight:700, padding:'0.125rem 0.375rem', borderRadius:3, background:'rgba(239,68,68,0.08)', color:'#ef4444' }}>✗</span>
        )}
        {result === null && !isLive(g.status) && (
          <span style={{ fontSize:'0.6875rem', fontWeight:600, color:'var(--text-muted)', whiteSpace:'nowrap', fontVariantNumeric:'tabular-nums' }}>
            {leadSide === 'home' ? g.homeTeam.abbreviation : g.awayTeam.abbreviation} {Math.max(homePct, awayPct).toFixed(0)}%
          </span>
        )}
        {isLive(g.status) && (
          <span className="live-dot-sm" />
        )}
      </div>

      {/* Arrow */}
      <ChevronRight size={13} style={{ color:'var(--text-muted)', flexShrink:0 }} />
    </Link>
  );
}

// ── League group ──────────────────────────────────────────────────────────────

function LeagueGroup({ league, sport, games }: { league: string; sport: string; games: Game[] }) {
  const color = SPORT_COLOR[sport] ?? 'var(--accent-light)';
  return (
    <>
      <div className="fixture-league-hdr">
        <span style={{ width:8, height:8, borderRadius:2, background:color, display:'inline-block', flexShrink:0 }} />
        <span style={{ fontSize:'0.5625rem', fontWeight:700, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.09em' }}>
          {league}
        </span>
        <span style={{ marginLeft:'auto', fontSize:'0.5625rem', color:'var(--text-muted)', fontVariantNumeric:'tabular-nums' }}>
          {games.length}
        </span>
      </div>
      {games.map(g => <FixtureRow key={g.id} game={g} />)}
    </>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────

function FixtureSection({
  label, games, sectionDate, isLiveSection,
}: {
  label: string; games: Game[]; sectionDate?: string; isLiveSection?: boolean;
}) {
  const leagues = groupByLeague(games);

  return (
    <section style={{ marginBottom:'1.75rem' }}>
      {/* Section header */}
      <div className="section-label">
        {isLiveSection && <span className="live-dot" />}
        <span className="section-label-text" style={{ color: isLiveSection ? '#ef4444' : undefined }}>
          {label}
        </span>
        {sectionDate && <span style={{ fontSize:'0.625rem', color:'var(--text-muted)' }}>· {sectionDate}</span>}
        <span className="section-count">{games.length}</span>
      </div>

      {isLiveSection ? (
        /* Live section: horizontal scroll of scoreboard cards */
        <div className="scroll-ribbon">
          {sortGames(games).map(g => <LiveScoreCard key={g.id} game={g} />)}
        </div>
      ) : (
        /* Non-live: flat fixture list grouped by league */
        <div className="fixture-section">
          {leagues.map(({ league, sport, games: lg }) => (
            <LeagueGroup key={league} league={league} sport={sport} games={lg} />
          ))}
        </div>
      )}
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function GamesPage() {
  const games = await getUpcomingGames({ includeRecent: true });

  const buckets: Record<Bucket, Game[]> = { live:[], today:[], tomorrow:[], week:[], later:[], finished:[] };
  for (const g of games) buckets[classify(g)].push(g);

  const liveCount  = buckets.live.length;
  const todayDate  = new Date().toLocaleDateString('en-US', {
    weekday:'long', month:'long', day:'numeric', timeZone:'America/New_York',
  });

  const SECTIONS = [
    { key: 'today'    as Bucket, label: 'Today' },
    { key: 'tomorrow' as Bucket, label: 'Tomorrow' },
    { key: 'week'     as Bucket, label: 'This Week' },
    { key: 'later'    as Bucket, label: 'Upcoming' },
    { key: 'finished' as Bucket, label: 'Recent Results' },
  ].filter(s => buckets[s.key].length > 0);

  return (
    <main style={{ maxWidth:'56rem', margin:'0 auto' }}>

      {/* Page header */}
      <div className="page-header">
        <h1 className="page-title">Games</h1>
        {liveCount > 0 && (
          <span style={{
            display:'inline-flex', alignItems:'center', gap:'0.375rem',
            fontSize:'0.5625rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.09em',
            padding:'0.1875rem 0.625rem', borderRadius:100,
            background:'rgba(239,68,68,0.1)', color:'#ef4444',
            border:'1px solid rgba(239,68,68,0.2)',
          }}>
            <span className="live-dot-sm" />{liveCount} Live
          </span>
        )}
        <span style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginLeft:'auto' }}>
          {todayDate} · ET
        </span>
      </div>

      {/* Live section */}
      {liveCount > 0 && (
        <FixtureSection
          label="Live Now"
          games={buckets.live}
          isLiveSection
        />
      )}

      {/* Time-bucketed sections */}
      {SECTIONS.map(({ key, label }) => {
        const sg = sortGames(buckets[key]);
        const firstDate = sg[0] ? fmtDate(sg[0]) : undefined;
        return (
          <FixtureSection
            key={key}
            label={label}
            games={sg}
            sectionDate={key !== 'today' ? firstDate : undefined}
          />
        );
      })}

      {games.length === 0 && (
        <div style={{ textAlign:'center', padding:'5rem 1rem', color:'var(--text-muted)' }}>
          <div style={{ fontSize:'2.5rem', marginBottom:'0.75rem' }}>🏆</div>
          <p style={{ fontWeight:600, color:'var(--text-secondary)' }}>No games right now</p>
          <p style={{ fontSize:'0.8125rem', marginTop:'0.25rem' }}>Live data refreshes every 60 s</p>
        </div>
      )}
    </main>
  );
}
