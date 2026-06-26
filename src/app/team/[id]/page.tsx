import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getTeamById } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { RosterTable } from '@/components/teams/RosterTable';
import { TeamTrendChart } from '@/components/charts/TeamTrendChart';
import {
  ArrowLeft, TrendingUp, Shield, Zap, CheckCircle, AlertCircle,
  Calendar, Activity, Brain, ChevronRight,
} from 'lucide-react';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const team = await getTeamById(id);
  if (!team) return { title: 'Team Not Found' };
  return { title: `${team.name}` };
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
              <Badge variant="default">{team.conference}</Badge>
              <Badge variant="default">{team.division}</Badge>
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
              <div className="text-2xl font-bold text-mono" style={{ color: team.streak.startsWith('W') ? 'var(--success)' : 'var(--danger)' }}>
                {team.streak}
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
          {/* Season stats */}
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

          {/* Home / Away record */}
          <Card title="Record Breakdown">
            <div className="space-y-3">
              {[
                { label: 'Home', value: team.homeRecord },
                { label: 'Away', value: team.awayRecord },
                { label: 'Last 10', value: team.last10 },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{row.label}</span>
                  <span className="font-bold text-mono" style={{ color: 'var(--text-primary)' }}>{row.value}</span>
                </div>
              ))}
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Championships</span>
                <span className="font-bold text-mono" style={{ color: 'var(--warning)' }}>{team.championships}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Founded</span>
                <span className="font-mono text-sm" style={{ color: 'var(--text-muted)' }}>{team.founded}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Middle column: advanced metrics + trend */}
        <div className="space-y-6">
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

        {/* Right column: AI analysis */}
        <div className="space-y-6">
          <Card title="AI Analysis" elevated>
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
          </Card>
        </div>
      </div>

      {/* Performance trend */}
      <Card title="Performance Trend">
        <TeamTrendChart data={team.trendData} />
      </Card>

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
                    {inj.position} · {inj.injury}
                  </div>
                </div>
                <Badge variant={statusVariant(inj.status)}>{inj.status}</Badge>
                <Badge variant={injuryImpactVariant(inj.impact)}>{inj.impact} Impact</Badge>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Est. Return: {inj.estimatedReturn}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Schedule */}
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

      {/* Roster */}
      <Card title="Roster" noPad>
        <RosterTable roster={team.roster} />
      </Card>
    </div>
  );
}
