'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { PeriodScore, GameSummaryData } from '@/lib/providers/gameSummary';
import type { Team } from '@/lib/types';

interface Props {
  homeTeam: Team;
  awayTeam: Team;
  /** The ELO win probability for the actual winner — < 50 means upset */
  winnerProbability: number;
  /** Name of the actual winner */
  actualWinner: string;
  summary: GameSummaryData | null;
}

interface TooltipPayload {
  name: string;
  value: number;
  fill: string;
}

function PeriodTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { payload: PeriodScore; name: string; value: number; fill: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="text-xs rounded-lg px-3 py-2 shadow-lg space-y-1"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}
    >
      <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{label}</p>
      {(payload as TooltipPayload[]).map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.fill }} />
          <span style={{ color: 'var(--text-secondary)' }}>{p.name}: <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{p.value}</span></span>
        </div>
      ))}
    </div>
  );
}

export function MatchReview({ homeTeam, awayTeam, winnerProbability, actualWinner, summary }: Props) {
  const correctPick = winnerProbability >= 50;

  return (
    <div className="space-y-5">
      {/* Prediction result banner */}
      <div
        className="flex items-center gap-3 rounded-xl px-4 py-3"
        style={{
          background: correctPick ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
          border: `1px solid ${correctPick ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
        }}
      >
        <span className="text-xl">{correctPick ? '✓' : '✗'}</span>
        <div>
          <p className="font-semibold text-sm" style={{ color: correctPick ? 'var(--success)' : 'var(--danger)' }}>
            {correctPick ? 'Prediction Correct' : 'Prediction Incorrect (Upset)'}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {actualWinner} won with {winnerProbability.toFixed(0)}% ELO probability
            {!correctPick && ' — the underdog prevailed'}
          </p>
        </div>
      </div>

      {/* Final score */}
      {summary && (
        <div className="flex items-center justify-center gap-6 py-2">
          <div className="text-center">
            <div className="text-3xl font-black" style={{ color: homeTeam.color }}>{summary.homeScore}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{homeTeam.abbreviation}</div>
          </div>
          <div className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>FINAL</div>
          <div className="text-center">
            <div className="text-3xl font-black" style={{ color: awayTeam.color }}>{summary.awayScore}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{awayTeam.abbreviation}</div>
          </div>
        </div>
      )}

      {/* Period-by-period chart */}
      {summary && summary.periods.length > 0 && (
        <div>
          <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>
            SCORING BY PERIOD
          </p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart
              data={summary.periods}
              barCategoryGap="28%"
              margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
            >
              <XAxis
                dataKey="period"
                tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<PeriodTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="home" name={homeTeam.abbreviation} radius={[3, 3, 0, 0]}>
                {summary.periods.map((_, i) => (
                  <Cell key={i} fill={homeTeam.color} />
                ))}
              </Bar>
              <Bar dataKey="away" name={awayTeam.abbreviation} radius={[3, 3, 0, 0]}>
                {summary.periods.map((_, i) => (
                  <Cell key={i} fill={awayTeam.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="flex items-center justify-center gap-5 mt-1">
            {[homeTeam, awayTeam].map(t => (
              <div key={t.id} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: t.color }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.abbreviation}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Period breakdown table — only if we have period data */}
      {summary && summary.periods.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <th className="text-left py-1.5 pr-3 font-semibold" style={{ color: 'var(--text-muted)' }}>Team</th>
                {summary.periods.map(p => (
                  <th key={p.period} className="text-center py-1.5 px-2 font-semibold" style={{ color: 'var(--text-muted)' }}>
                    {p.period}
                  </th>
                ))}
                <th className="text-center py-1.5 px-2 font-bold" style={{ color: 'var(--text-primary)' }}>T</th>
              </tr>
            </thead>
            <tbody>
              {[
                { team: homeTeam, key: 'home' as const },
                { team: awayTeam, key: 'away' as const },
              ].map(({ team, key }) => (
                <tr key={team.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td className="py-2 pr-3">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full inline-block" style={{ background: team.color }} />
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{team.abbreviation}</span>
                    </div>
                  </td>
                  {summary.periods.map(p => (
                    <td key={p.period} className="text-center py-2 px-2" style={{ color: 'var(--text-secondary)' }}>
                      {p[key]}
                    </td>
                  ))}
                  <td className="text-center py-2 px-2 font-bold" style={{ color: 'var(--text-primary)' }}>
                    {key === 'home' ? summary.homeScore : summary.awayScore}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {summary?.attendance && (
        <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
          Attendance: {summary.attendance.toLocaleString()}
        </p>
      )}
    </div>
  );
}
