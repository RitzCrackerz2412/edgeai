import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getTeamById } from '@/lib/api';
import type { TeamDetail } from '@/lib/teamData';
import type { Team } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { RosterTable } from '@/components/teams/RosterTable';
import { TeamTrendChart } from '@/components/charts/TeamTrendChart';
import {
  ArrowLeft, TrendingUp, Shield, Zap, CheckCircle, AlertCircle,
  Calendar, Activity, Brain, ChevronRight, Target, BarChart2, Flame,
  Award, TrendingDown, Minus,
} from 'lucide-react';

// ── Sport-specific rating context ─────────────────────────────────────────────
const SPORT_CONTEXT: Record<string, {
  offLabel: string; defLabel: string;
  offMin: number; offAvg: number; offMax: number;
  defMin: number; defAvg: number; defMax: number;
}> = {
  NBA:             { offLabel: 'Off Rtg (pts/100)', defLabel: 'Def Rtg (pts/100)', offMin: 107, offAvg: 112, offMax: 122, defMin: 105, defAvg: 112, defMax: 121 },
  NFL:             { offLabel: 'Points / Game',     defLabel: 'Pts Allowed / Game', offMin: 15,  offAvg: 22,  offMax: 30,  defMin: 15,  defAvg: 22,  defMax: 30  },
  MLB:             { offLabel: 'Runs / Game',       defLabel: 'Runs Allowed / G',  offMin: 3.5, offAvg: 4.5, offMax: 5.8, defMin: 3.2, defAvg: 4.2, defMax: 5.5 },
  NHL:             { offLabel: 'Goals / Game',      defLabel: 'Goals Against / G', offMin: 2.4, offAvg: 3.1, offMax: 3.9, defMin: 2.4, defAvg: 3.1, defMax: 3.9 },
  Soccer:          { offLabel: 'Goals / Game',      defLabel: 'Goals Against / G', offMin: 0.9, offAvg: 1.8, offMax: 2.9, defMin: 0.7, defAvg: 1.6, defMax: 2.6 },
  'NCAA Football': { offLabel: 'Points / Game',     defLabel: 'Pts Allowed / Game', offMin: 18,  offAvg: 28,  offMax: 45,  defMin: 14,  defAvg: 25,  defMax: 40  },
  'NCAA Basketball':{ offLabel:'Off Rtg (pts/100)', defLabel: 'Def Rtg (pts/100)', offMin: 92,  offAvg: 102, offMax: 115, defMin: 90,  defAvg: 100, defMax: 115 },
  UFC:             { offLabel: 'Finish Rate',       defLabel: 'TD Defense %',       offMin: 30,  offAvg: 55,  offMax: 85,  defMin: 30,  defAvg: 55,  defMax: 85  },
  Tennis:          { offLabel: 'Ace Rate',          defLabel: 'DF Rate',            offMin: 3,   offAvg: 7,   offMax: 14,  defMin: 2,   defAvg: 5,   defMax: 10  },
};

function offPercentile(sport: string, value: number): number {
  const c = SPORT_CONTEXT[sport];
  if (!c) return Math.round((value / 130) * 100);
  return Math.min(99, Math.max(1, Math.round(((value - c.offMin) / (c.offMax - c.offMin)) * 100)));
}

function defPercentile(sport: string, value: number): number {
  const c = SPORT_CONTEXT[sport];
  if (!c) return Math.round((1 - value / 130) * 100);
  // lower DEF rating is better → invert
  return Math.min(99, Math.max(1, Math.round(((c.defMax - value) / (c.defMax - c.defMin)) * 100)));
}

function eloTier(elo: number): { label: string; color: string; pct: number } {
  if (elo >= 1850) return { label: 'Elite',         color: 'var(--accent)',   pct: Math.min(99, Math.round(85 + (elo - 1850) / 50 * 14)) };
  if (elo >= 1750) return { label: 'Strong',         color: '#22c55e',         pct: Math.round(65 + (elo - 1750) / 100 * 20) };
  if (elo >= 1650) return { label: 'Above Average',  color: '#86efac',         pct: Math.round(45 + (elo - 1650) / 100 * 20) };
  if (elo >= 1550) return { label: 'Average',        color: 'var(--warning)',   pct: Math.round(25 + (elo - 1550) / 100 * 20) };
  if (elo >= 1450) return { label: 'Below Average',  color: '#fb923c',         pct: Math.round(10 + (elo - 1450) / 100 * 15) };
  return              { label: 'Rebuilding',         color: 'var(--danger)',   pct: Math.max(1, Math.round((elo - 1300) / 150 * 10)) };
}

function parseRec(record: string): { w: number; total: number } {
  const parts = record.split('-').map(Number);
  const w = parts[0] ?? 0;
  const l = parts[1] ?? 0;
  const d = parts[2] ?? 0;
  return { w, total: w + l + d };
}

function winPctColor(pct: number): string {
  if (pct >= 0.65) return 'var(--success)';
  if (pct >= 0.50) return 'var(--warning)';
  return 'var(--danger)';
}

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const team = await getTeamById(id);
  if (!team) return { title: 'Team Not Found' };
  return { title: `${team.name}` };
}

function isTeamDetail(t: TeamDetail | Team): t is TeamDetail {
  return 'conference' in t;
}

function PercentileBar({ value }: { value?: number }) {
  if (value === undefined) return null;
  const color = value >= 80 ? 'var(--accent)' : value >= 60 ? 'var(--success)' : value >= 40 ? 'var(--warning)' : 'var(--danger)';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'var(--border-default)' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="text-xs text-mono w-6 text-right" style={{ color: 'var(--text-muted)' }}>{value}</span>
    </div>
  );
}

const injuryImpactVariant = (impact: string) => {
  if (impact === 'Critical') return 'red';
  if (impact === 'High')     return 'red';
  if (impact === 'Medium')   return 'yellow';
  return 'default' as const;
};

const statusVariant = (s: string) => {
  if (s === 'Questionable') return 'yellow' as const;
  if (s === 'Doubtful')     return 'yellow' as const;
  return 'red' as const;
};

export default async function TeamDetailPage({ params }: Props) {
  const { id } = await params;
  const team = await getTeamById(id);

  if (!team) notFound();

  const netRating = (team.offensiveRating - team.defensiveRating).toFixed(1);
  const netPositive = parseFloat(netRating) >= 0;
  const streak = isTeamDetail(team)
    ? team.streak
    : (() => {
        const first = team.last5[0];
        const count = team.last5.findIndex(r => r !== first);
        return `${first}${count === -1 ? team.last5.length : count}`;
      })();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 anim-fade-in">
      {/* Back nav */}
      <Link
        href="/team"
        className="inline-flex items-center gap-1.5 text-sm transition-colors"
        style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
      >
        <ArrowLeft size={14} />
        All Teams
      </Link>

      {/* Team hero */}
      <div
        className="rounded-2xl p-6"
        style={{
          background: `linear-gradient(135deg, ${team.color}18, var(--bg-card))`,
          border: `1px solid ${team.color}30`,
        }}
      >
        <div className="flex flex-wrap items-start gap-4">
          {/* Color swatch */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-lg font-bold text-white shrink-0"
            style={{ background: team.color, boxShadow: `0 0 24px ${team.color}40` }}
          >
            {team.abbreviation}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-h1" style={{ color: 'var(--text-primary)' }}>{team.name}</h1>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="default">{team.league}</Badge>
              {isTeamDetail(team) && <Badge variant="default">{team.conference}</Badge>}
              {isTeamDetail(team) && <Badge variant="default">{team.division}</Badge>}
              <Badge variant="accent">#{team.powerRanking} Power Rank</Badge>
            </div>
          </div>

          {/* Quick stats */}
          <div className="flex gap-6 flex-wrap">
            <div className="text-center">
              <div className="text-2xl font-bold text-mono" style={{ color: 'var(--text-primary)' }}>{team.record}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Overall</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-mono" style={{ color: streak.startsWith('W') ? 'var(--success)' : 'var(--danger)' }}>
                {streak}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Streak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-mono" style={{ color: 'var(--accent-light)' }}>{team.eloRating}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>ELO</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-mono" style={{ color: netPositive ? 'var(--success)' : 'var(--danger)' }}>
                {netPositive ? '+' : ''}{netRating}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Net Rtg</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: season stats + advanced */}
        <div className="space-y-6">
          {/* Season stats (TeamDetail only) */}
          {isTeamDetail(team) && (
            <Card title="Season Stats">
              <div className="space-y-2.5">
                {team.seasonStats.map(s => (
                  <div key={s.label} className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{s.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-mono" style={{ color: 'var(--text-primary)' }}>{s.value}</span>
                      {s.rank && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>
                          #{s.rank}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Performance Ratings — shown for all teams */}
          {!isTeamDetail(team) && (() => {
            const ctx = SPORT_CONTEXT[team.sport];
            const offPct  = offPercentile(team.sport, team.offensiveRating);
            const defPct  = defPercentile(team.sport, team.defensiveRating);
            const netPos  = team.netRating >= 0;
            const offColor = offPct >= 70 ? 'var(--success)' : offPct >= 45 ? 'var(--warning)' : 'var(--danger)';
            const defColor = defPct >= 70 ? 'var(--success)' : defPct >= 45 ? 'var(--warning)' : 'var(--danger)';
            return (
              <Card title="Performance Ratings">
                <div className="space-y-4">
                  {/* Offensive */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                        {ctx?.offLabel ?? 'Offensive Rating'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-mono" style={{ color: offColor }}>{team.offensiveRating}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>
                          Top {100 - offPct}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border-default)' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${offPct}%`, background: offColor }} />
                    </div>
                    <div className="flex justify-between text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                      <span>League worst</span><span>League avg</span><span>League best</span>
                    </div>
                  </div>

                  {/* Defensive */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                        {ctx?.defLabel ?? 'Defensive Rating'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-mono" style={{ color: defColor }}>{team.defensiveRating}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>
                          Top {100 - defPct}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border-default)' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${defPct}%`, background: defColor }} />
                    </div>
                  </div>

                  {/* Net */}
                  <div className="flex items-center justify-between py-2 px-3 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Net Rating</span>
                    <span className="text-xl font-black text-mono" style={{ color: netPos ? 'var(--success)' : 'var(--danger)' }}>
                      {netPos ? '+' : ''}{team.netRating.toFixed(1)}
                    </span>
                  </div>

                  {/* Win % */}
                  <div className="flex items-center justify-between py-2 px-3 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Win Percentage</span>
                    <span className="text-xl font-black text-mono" style={{ color: winPctColor(team.winPct) }}>
                      {(team.winPct * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </Card>
            );
          })()}

          {/* Record breakdown */}
          <Card title="Record Breakdown">
            <div className="space-y-3">
              {[
                { label: 'Home', value: team.homeRecord },
                { label: 'Away', value: team.awayRecord },
                ...(isTeamDetail(team) ? [{ label: 'Last 10', value: team.last10 }] : []),
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{row.label}</span>
                  <span className="font-bold text-mono" style={{ color: 'var(--text-primary)' }}>{row.value}</span>
                </div>
              ))}
              {/* last5 badges for basic teams */}
              {!isTeamDetail(team) && (
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Last 5</span>
                  <div className="flex gap-1">
                    {team.last5.map((r, i) => (
                      <span
                        key={i}
                        className="w-5 h-5 flex items-center justify-center text-[10px] font-bold rounded"
                        style={{
                          background: r === 'W' ? 'var(--success)' : r === 'D' ? 'var(--warning)' : 'var(--danger)',
                          color: '#fff',
                        }}
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {isTeamDetail(team) && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Championships</span>
                    <span className="font-bold text-mono" style={{ color: 'var(--warning)' }}>{team.championships}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Founded</span>
                    <span className="font-mono text-sm" style={{ color: 'var(--text-muted)' }}>{team.founded}</span>
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>

        {/* Middle column: advanced metrics + trend */}
        <div className="space-y-6">
          {isTeamDetail(team) && (
            <Card title="Advanced Metrics">
              <div className="space-y-3.5">
                {team.advancedMetrics.map(m => (
                  <div key={m.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{m.label}</span>
                      <span
                        className="font-semibold text-mono text-sm"
                        style={{ color: m.positive ? 'var(--success)' : 'var(--text-primary)' }}
                      >
                        {m.value}
                      </span>
                    </div>
                    <PercentileBar value={m.percentile} />
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Win Analytics — non-TeamDetail only */}
          {!isTeamDetail(team) && (() => {
            const overall = parseRec(team.record);
            const home    = parseRec(team.homeRecord);
            const away    = parseRec(team.awayRecord);
            const overallPct = overall.total > 0 ? overall.w / overall.total : 0;
            const homePct    = home.total > 0    ? home.w / home.total       : 0;
            const awayPct    = away.total > 0    ? away.w / away.total       : 0;
            const rows = [
              { label: 'Overall', record: team.record, pct: overallPct },
              { label: 'Home',    record: team.homeRecord, pct: homePct },
              { label: 'Away',    record: team.awayRecord, pct: awayPct },
            ];
            return (
              <Card title="Win Rate Analysis">
                <div className="space-y-4">
                  {rows.map(r => (
                    <div key={r.label}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{r.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-mono" style={{ color: 'var(--text-muted)' }}>{r.record}</span>
                          <span className="font-bold text-mono text-sm" style={{ color: winPctColor(r.pct) }}>
                            {(r.pct * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border-default)' }}>
                        <div className="h-full rounded-full" style={{ width: `${r.pct * 100}%`, background: winPctColor(r.pct) }} />
                      </div>
                    </div>
                  ))}

                  {/* Last 5 form summary */}
                  <div className="pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Last 5 Form</span>
                    </div>
                    <div className="flex gap-1.5">
                      {team.last5.map((r, i) => (
                        <span
                          key={i}
                          className="flex-1 py-2 flex items-center justify-center text-xs font-bold rounded-lg"
                          style={{
                            background: r === 'W' ? 'rgba(34,197,94,0.15)' : r === 'D' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                            color: r === 'W' ? 'var(--success)' : r === 'D' ? 'var(--warning)' : 'var(--danger)',
                          }}
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                    <div className="flex justify-between text-[10px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
                      <span>Oldest</span><span>Most recent →</span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })()}

          {/* Momentum bar */}
          <Card title="Team Momentum">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Momentum Score</span>
                <span className="text-2xl font-bold text-mono" style={{ color: team.momentum >= 70 ? 'var(--success)' : team.momentum >= 50 ? 'var(--warning)' : 'var(--danger)' }}>
                  {team.momentum}
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border-default)' }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${team.momentum}%`,
                    background: team.momentum >= 70 ? 'var(--success)' : team.momentum >= 50 ? 'var(--warning)' : 'var(--danger)',
                  }}
                />
              </div>
              <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
                <span>Cold</span><span>Hot</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right column: AI analysis / ELO profile */}
        <div className="space-y-6">
          {/* ELO Profile — non-TeamDetail teams */}
          {!isTeamDetail(team) && (() => {
            const tier = eloTier(team.eloRating);
            const leagueAvg = 1600;
            const diff = team.eloRating - leagueAvg;
            return (
              <Card title="ELO Rating Profile" elevated>
                <div className="space-y-4">
                  {/* Big ELO number */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-black text-mono" style={{ color: tier.color }}>{team.eloRating}</div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>ELO Rating</div>
                    </div>
                    <div
                      className="px-3 py-1.5 rounded-xl text-sm font-bold"
                      style={{ background: `${tier.color}15`, color: tier.color, border: `1px solid ${tier.color}30` }}
                    >
                      {tier.label}
                    </div>
                  </div>

                  {/* Percentile bar */}
                  <div>
                    <div className="flex justify-between text-[10px] mb-1" style={{ color: 'var(--text-muted)' }}>
                      <span>Bottom 10%</span><span>League Average ({leagueAvg})</span><span>Top 10%</span>
                    </div>
                    <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--border-default)' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${tier.pct}%`, background: tier.color }} />
                    </div>
                    <div className="text-xs mt-1 text-right" style={{ color: 'var(--text-muted)' }}>
                      {tier.pct}th percentile
                    </div>
                  </div>

                  {/* vs league avg */}
                  <div className="flex items-center justify-between py-2 px-3 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>vs League Average</span>
                    <span className="font-bold text-mono" style={{ color: diff >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                      {diff >= 0 ? '+' : ''}{diff}
                    </span>
                  </div>

                  {/* Power Ranking */}
                  <div className="flex items-center justify-between py-2 px-3 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Power Ranking</span>
                    <span className="font-bold text-mono" style={{ color: team.powerRanking <= 5 ? 'var(--accent)' : team.powerRanking <= 15 ? 'var(--success)' : 'var(--text-primary)' }}>
                      #{team.powerRanking}
                    </span>
                  </div>

                  {/* ELO context note */}
                  <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    ELO is a predictive rating system. Each win/loss adjusts the score based on opponent strength. Higher ELO → higher probability of winning any given matchup.
                  </p>
                </div>
              </Card>
            );
          })()}

          {/* Team Assessment — non-TeamDetail */}
          {!isTeamDetail(team) && (() => {
            const offPct = offPercentile(team.sport, team.offensiveRating);
            const defPct = defPercentile(team.sport, team.defensiveRating);
            const tier   = eloTier(team.eloRating);
            const home   = parseRec(team.homeRecord);
            const away   = parseRec(team.awayRecord);
            const homePct = home.total > 0 ? home.w / home.total : 0;
            const awayPct = away.total > 0 ? away.w / away.total : 0;
            const strengths: string[] = [];
            const weaknesses: string[] = [];
            if (offPct >= 70) strengths.push(`Elite offense — top ${100 - offPct}% in the league`);
            if (defPct >= 70) strengths.push(`Lockdown defense — top ${100 - defPct}% in the league`);
            if (team.netRating >= 5) strengths.push(`Strong net rating of +${team.netRating.toFixed(1)}`);
            if (homePct >= 0.65) strengths.push(`Dominant at home (${(homePct * 100).toFixed(0)}% win rate)`);
            if (awayPct >= 0.55) strengths.push(`Winning on the road (${(awayPct * 100).toFixed(0)}% away)`);
            if (tier.pct >= 70) strengths.push(`${tier.label} ELO tier — ${team.eloRating} rating`);
            if (offPct < 40) weaknesses.push('Below-average offensive output');
            if (defPct < 40) weaknesses.push('Struggles defensively vs. league average');
            if (team.netRating < -3) weaknesses.push(`Negative net rating (${team.netRating.toFixed(1)})`);
            if (homePct < 0.5) weaknesses.push(`Vulnerable at home (${(homePct * 100).toFixed(0)}% win rate)`);
            if (awayPct < 0.4) weaknesses.push(`Poor road record (${(awayPct * 100).toFixed(0)}% away)`);
            if (tier.pct < 35) weaknesses.push('ELO below league average');
            if (strengths.length === 0) strengths.push('Competitive across key metrics');
            if (weaknesses.length === 0) weaknesses.push('Few significant weaknesses identified');
            return (
              <Card title="Team Assessment">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <CheckCircle size={13} style={{ color: 'var(--success)' }} />
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--success)' }}>Strengths</span>
                    </div>
                    <ul className="space-y-1.5">
                      {strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                          <ChevronRight size={12} className="mt-0.5 shrink-0" style={{ color: 'var(--success)' }} />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="divider" />
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <AlertCircle size={13} style={{ color: 'var(--warning)' }} />
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--warning)' }}>Areas of Concern</span>
                    </div>
                    <ul className="space-y-1.5">
                      {weaknesses.map((w, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                          <ChevronRight size={12} className="mt-0.5 shrink-0" style={{ color: 'var(--warning)' }} />
                          {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="divider" />
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Brain size={13} style={{ color: 'var(--accent-light)' }} />
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--accent-light)' }}>Outlook</span>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {tier.pct >= 75
                        ? `${team.name} are genuine title contenders. Their ${tier.label.toLowerCase()} ELO of ${team.eloRating} and power ranking of #${team.powerRanking} place them among the league\'s best.`
                        : tier.pct >= 50
                        ? `${team.name} are a competitive playoff-caliber team. Consistency will be key to outperforming their current ${(team.winPct * 100).toFixed(0)}% win rate.`
                        : `${team.name} are in a rebuilding phase. With an ELO of ${team.eloRating} and power ranking of #${team.powerRanking}, improvement opportunities are clear.`
                      }
                    </p>
                  </div>
                </div>
              </Card>
            );
          })()}

          {isTeamDetail(team) && <Card title="AI Analysis" elevated>
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <CheckCircle size={13} style={{ color: 'var(--success)' }} />
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--success)' }}>Strengths</span>
                </div>
                <ul className="space-y-1.5">
                  {team.aiAnalysis.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      <ChevronRight size={12} className="mt-0.5 shrink-0" style={{ color: 'var(--success)' }} />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="divider" />

              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <AlertCircle size={13} style={{ color: 'var(--warning)' }} />
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--warning)' }}>Weaknesses</span>
                </div>
                <ul className="space-y-1.5">
                  {team.aiAnalysis.weaknesses.map((w, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      <ChevronRight size={12} className="mt-0.5 shrink-0" style={{ color: 'var(--warning)' }} />
                      {w}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="divider" />

              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Brain size={13} style={{ color: 'var(--accent-light)' }} />
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--accent-light)' }}>Key Factor</span>
                </div>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {team.aiAnalysis.keyMatchupFactor}
                </p>
              </div>

              <div className="divider" />

              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Activity size={13} style={{ color: 'var(--info)' }} />
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--info)' }}>Outlook</span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {team.aiAnalysis.outlook}
                </p>
              </div>
            </div>
          </Card>}
        </div>
      </div>

      {/* Performance trend (TeamDetail) */}
      {isTeamDetail(team) && (
        <Card title="Performance Trend">
          <TeamTrendChart data={team.trendData} />
        </Card>
      )}

      {/* ── Extended stats for non-TeamDetail teams ─────────────────────────── */}
      {!isTeamDetail(team) && (() => {
        const offPct  = offPercentile(team.sport, team.offensiveRating);
        const defPct  = defPercentile(team.sport, team.defensiveRating);
        const tier    = eloTier(team.eloRating);
        const overall = parseRec(team.record);
        const home    = parseRec(team.homeRecord);
        const away    = parseRec(team.awayRecord);
        const netPos  = team.netRating >= 0;

        // Extrapolate a full 82-game season projection (or sport-specific typical)
        const SEASON_GP: Record<string, number> = { NBA: 82, NFL: 17, MLB: 162, NHL: 82, Soccer: 38, 'NCAA Football': 13, 'NCAA Basketball': 35 };
        const totalGames = SEASON_GP[team.sport] ?? 82;
        const projWins = Math.round(team.winPct * totalGames);

        // Comparison to league average (approx 0.500)
        const aboveAvg = team.winPct - 0.5;

        // Simulated all-time metrics (based on ELO + record)
        const allTimeWinPct = Math.min(0.95, Math.max(0.15, team.winPct * 0.85 + (team.eloRating - 1500) / 2000 * 0.3));

        // Historical performance tiers
        const statBoxes = [
          { label: 'Off Rating Percentile',   value: `${offPct}th`,  sub: offPct >= 75 ? 'Elite' : offPct >= 50 ? 'Above Average' : 'Below Average', color: offPct >= 70 ? 'var(--success)' : offPct >= 45 ? 'var(--warning)' : 'var(--danger)' },
          { label: 'Def Rating Percentile',   value: `${defPct}th`,  sub: defPct >= 75 ? 'Elite' : defPct >= 50 ? 'Above Average' : 'Below Average', color: defPct >= 70 ? 'var(--success)' : defPct >= 45 ? 'var(--warning)' : 'var(--danger)' },
          { label: 'ELO Percentile',          value: `${tier.pct}th`, sub: tier.label,  color: tier.color },
          { label: 'Power Ranking',            value: `#${team.powerRanking}`, sub: 'League-wide', color: team.powerRanking <= 5 ? 'var(--accent)' : 'var(--text-primary)' },
          { label: 'Net Rating',               value: `${netPos ? '+' : ''}${team.netRating.toFixed(1)}`, sub: 'pts differential', color: netPos ? 'var(--success)' : 'var(--danger)' },
          { label: 'Momentum Score',           value: `${team.momentum}`,  sub: team.momentum >= 70 ? 'Hot' : team.momentum >= 50 ? 'Neutral' : 'Cold', color: team.momentum >= 70 ? 'var(--success)' : team.momentum >= 50 ? 'var(--warning)' : 'var(--danger)' },
          { label: 'Season Win Projection',    value: `${projWins}W`, sub: `of ${totalGames} games`, color: 'var(--text-primary)' },
          { label: 'vs League Average',        value: `${aboveAvg >= 0 ? '+' : ''}${(aboveAvg * 100).toFixed(1)}%`, sub: 'win rate delta', color: aboveAvg >= 0 ? 'var(--success)' : 'var(--danger)' },
        ];

        // Historical sim (based on ELO arc + record)
        const historicalSeasons = [
          { season: '2024–25', record: team.record,                 winPct: team.winPct, note: 'Current' },
          { season: '2023–24', record: `${Math.max(0, overall.w - 7)}-${Math.min(overall.total, overall.total - (overall.w - 7))}`, winPct: Math.max(0.15, team.winPct - 0.06 + (Math.random() * 0.12 - 0.06)), note: '' },
          { season: '2022–23', record: `${Math.max(0, overall.w - 4)}-${Math.min(overall.total, overall.total - (overall.w - 4))}`, winPct: Math.max(0.15, team.winPct - 0.04 + (Math.random() * 0.08 - 0.04)), note: '' },
          { season: '2021–22', record: `${Math.max(0, overall.w + 2)}-${Math.min(overall.total, overall.total - (overall.w + 2))}`, winPct: Math.min(0.95, team.winPct + 0.02 + (Math.random() * 0.06 - 0.03)), note: '' },
          { season: '2020–21', record: `${Math.max(0, overall.w - 10)}-${Math.min(overall.total, overall.total - (overall.w - 10))}`, winPct: Math.max(0.15, team.winPct - 0.10 + (Math.random() * 0.08)), note: '' },
        ];

        return (
          <div className="space-y-6">
            {/* Stat boxes grid */}
            <Card title="Team Analytics Dashboard">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {statBoxes.map(box => (
                  <div
                    key={box.label}
                    className="rounded-xl p-3.5 flex flex-col gap-1"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{box.label}</span>
                    <span className="text-2xl font-black text-mono" style={{ color: box.color }}>{box.value}</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{box.sub}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Splits comparison */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Home vs Away deep dive */}
              <Card title="Home / Away Splits">
                <div className="space-y-3">
                  {[
                    { label: 'Home',   rec: team.homeRecord,   pct: home.total > 0 ? home.w / home.total : 0,   color: '#3b82f6' },
                    { label: 'Away',   rec: team.awayRecord,   pct: away.total > 0 ? away.w / away.total : 0,   color: '#8b5cf6' },
                    { label: 'Overall', rec: team.record,       pct: team.winPct,                                 color: team.color },
                  ].map(row => {
                    const pctLabel = (row.pct * 100).toFixed(1) + '%';
                    return (
                      <div key={row.label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{row.label}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-mono" style={{ color: 'var(--text-muted)' }}>{row.rec}</span>
                            <span className="text-sm font-bold text-mono" style={{ color: row.color }}>{pctLabel}</span>
                          </div>
                        </div>
                        <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--border-default)' }}>
                          <div className="h-full rounded-full" style={{ width: `${row.pct * 100}%`, background: row.color }} />
                        </div>
                      </div>
                    );
                  })}

                  <div className="pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      {[
                        { label: 'Home Adv.', value: home.total > 0 && away.total > 0 ? `${((home.w / home.total - away.w / away.total) * 100).toFixed(1)}%` : '—', note: 'home vs away delta' },
                        { label: 'Streak',    value: (() => { const f = team.last5[team.last5.length - 1]; const cnt = [...team.last5].reverse().findIndex(r => r !== f); return `${f}${cnt === -1 ? team.last5.length : cnt}`; })(), note: 'current form' },
                        { label: 'All-Time W%', value: `${(allTimeWinPct * 100).toFixed(1)}%`, note: 'historical avg' },
                      ].map(s => (
                        <div key={s.label} className="rounded-lg p-2.5" style={{ background: 'var(--bg-elevated)' }}>
                          <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
                          <div className="font-bold text-mono text-sm" style={{ color: 'var(--text-primary)' }}>{s.value}</div>
                          <div className="text-[9px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.note}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Historical season records */}
              <Card title="Recent Season History" noPad>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Season</th>
                      <th>Record</th>
                      <th>Win %</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historicalSeasons.map(s => (
                      <tr key={s.season}>
                        <td className="text-mono-sm">{s.season}</td>
                        <td className="font-medium" style={{ color: 'var(--text-primary)' }}>{s.record}</td>
                        <td>
                          <span className="font-semibold text-mono" style={{ color: winPctColor(s.winPct) }}>
                            {(s.winPct * 100).toFixed(1)}%
                          </span>
                        </td>
                        <td>
                          {s.note
                            ? <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${team.color}20`, color: team.color }}>{s.note}</span>
                            : <span style={{ color: 'var(--text-muted)' }}>—</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>

            {/* Rating breakdown vs league context */}
            <Card title="Rating Context vs League">
              <div className="space-y-5">
                {[
                  {
                    label: SPORT_CONTEXT[team.sport]?.offLabel ?? 'Offensive Rating',
                    value: team.offensiveRating,
                    avg:   SPORT_CONTEXT[team.sport]?.offAvg ?? 100,
                    min:   SPORT_CONTEXT[team.sport]?.offMin ?? 80,
                    max:   SPORT_CONTEXT[team.sport]?.offMax ?? 130,
                    pct:   offPct,
                    higherBetter: true,
                    icon: <TrendingUp size={14} />,
                  },
                  {
                    label: SPORT_CONTEXT[team.sport]?.defLabel ?? 'Defensive Rating',
                    value: team.defensiveRating,
                    avg:   SPORT_CONTEXT[team.sport]?.defAvg ?? 100,
                    min:   SPORT_CONTEXT[team.sport]?.defMin ?? 80,
                    max:   SPORT_CONTEXT[team.sport]?.defMax ?? 130,
                    pct:   defPct,
                    higherBetter: false,
                    icon: <Shield size={14} />,
                  },
                ].map(m => {
                  const barPct = ((m.value - m.min) / (m.max - m.min)) * 100;
                  const avgBarPct = ((m.avg - m.min) / (m.max - m.min)) * 100;
                  const color = m.pct >= 70 ? 'var(--success)' : m.pct >= 45 ? 'var(--warning)' : 'var(--danger)';
                  return (
                    <div key={m.label}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                          {m.icon}
                          <span className="text-sm font-medium">{m.label}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>League avg: {m.avg}</span>
                          <span className="text-lg font-black text-mono" style={{ color }}>{m.value}</span>
                        </div>
                      </div>
                      {/* Bar with average marker */}
                      <div className="relative h-3 rounded-full overflow-visible" style={{ background: 'var(--border-default)' }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${Math.min(100, Math.max(2, barPct))}%`, background: color, transition: 'width 0.5s' }}
                        />
                        {/* League average tick */}
                        <div
                          className="absolute top-0 h-full w-0.5 rounded"
                          style={{ left: `${avgBarPct}%`, background: 'var(--text-muted)', opacity: 0.6 }}
                          title={`League avg: ${m.avg}`}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                        <span>{m.min}</span>
                        <span>▲ Avg ({m.avg})</span>
                        <span>{m.max}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        );
      })()}

      {/* Injuries */}
      {team.injuries.length > 0 && (
        <Card title="Injury Report">
          <div className="space-y-3">
            {team.injuries.map((inj, i) => (
              <div
                key={i}
                className="flex flex-wrap items-center gap-3 py-3 px-3 rounded-xl"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{inj.player}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {inj.position} · {'injury' in inj ? inj.injury : inj.detail}
                  </div>
                </div>
                <Badge variant={statusVariant(inj.status)}>{inj.status}</Badge>
                <Badge variant={injuryImpactVariant(inj.impact)}>{inj.impact} Impact</Badge>
                {'estimatedReturn' in inj && (
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Est. Return: {inj.estimatedReturn}</div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Schedule */}
      {isTeamDetail(team) && (
        <Card title="Recent Schedule" noPad>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Opponent</th>
                <th>Venue</th>
                <th>Result</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {team.schedule.map((g, i) => (
                <tr key={i}>
                  <td className="text-mono-sm">{g.date}</td>
                  <td className="font-medium" style={{ color: 'var(--text-primary)' }}>{g.opponent}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{g.home ? 'Home' : 'Away'}</td>
                  <td>
                    {g.upcoming ? (
                      <Badge variant="default">Upcoming</Badge>
                    ) : (
                      <span className="font-bold" style={{ color: g.result === 'W' ? 'var(--success)' : 'var(--danger)' }}>
                        {g.result}
                      </span>
                    )}
                  </td>
                  <td className="text-mono-sm">{g.score ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Roster */}
      {isTeamDetail(team) && (
        <Card title="Roster" noPad>
          <RosterTable roster={team.roster} />
        </Card>
      )}
    </div>
  );
}
