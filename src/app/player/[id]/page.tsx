import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPlayerById } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { GameLogTable } from '@/components/players/GameLogTable';
import { PlayerRadarChart } from '@/components/charts/PlayerRadarChart';
import { TrendChart } from '@/components/charts/TrendChart';
import {
  ArrowLeft, Brain, AlertCircle, CheckCircle, ChevronRight, BarChart2,
} from 'lucide-react';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const player = await getPlayerById(id);
  if (!player) return { title: 'Player Not Found' };
  return { title: `${player.name}` };
}

function PercentileBar({ value }: { value: number }) {
  const color = value >= 90 ? 'var(--accent)' : value >= 75 ? 'var(--success)' : value >= 50 ? 'var(--warning)' : 'var(--text-muted)';
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'var(--border-default)' }}>
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="text-[10px] w-8 text-right text-mono" style={{ color: 'var(--text-muted)' }}>p{value}</span>
    </div>
  );
}

const statusVariant = (s: string) => {
  if (s === 'Active')       return 'green'  as const;
  if (s === 'Questionable') return 'yellow' as const;
  if (s === 'Doubtful')     return 'yellow' as const;
  return 'red' as const;
};

export default async function PlayerDetailPage({ params }: Props) {
  const { id } = await params;
  const player = await getPlayerById(id);

  if (!player) notFound();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 anim-fade-in">
      {/* Back nav */}
      <Link
        href="/player"
        className="inline-flex items-center gap-1.5 text-sm transition-colors"
        style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
      >
        <ArrowLeft size={14} />
        All Players
      </Link>

      {/* Player hero */}
      <div
        className="rounded-2xl p-6"
        style={{
          background: `linear-gradient(135deg, ${player.teamColor}18, var(--bg-card))`,
          border: `1px solid ${player.teamColor}30`,
        }}
      >
        <div className="flex flex-wrap items-start gap-5">
          {/* Jersey */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white shrink-0"
            style={{ background: player.teamColor, boxShadow: `0 0 24px ${player.teamColor}40` }}
          >
            {player.number}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-h1" style={{ color: 'var(--text-primary)' }}>{player.name}</h1>
              <Badge variant={statusVariant(player.status)}>{player.status}</Badge>
              {player.injuryNote && (
                <span className="text-xs" style={{ color: 'var(--warning)' }}>{player.injuryNote}</span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm" style={{ color: 'var(--text-muted)' }}>
              <span>{player.position}</span>
              <span>·</span>
              <Link href={`/team/${player.teamId}`} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }} className="hover:underline">
                {player.teamName}
              </Link>
              <span>·</span>
              <span>{player.sport}</span>
              <span>·</span>
              <span>Age {player.age}</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
              {player.bio}
            </p>
          </div>

          {/* Quick bio info */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
            {[
              { label: 'Height', value: player.height },
              { label: 'Weight', value: player.weight },
              { label: 'Birthplace', value: player.birthplace },
              { label: 'College', value: player.college },
              { label: 'Draft', value: `${player.draftYear} (${player.draftPick})` },
              { label: 'Experience', value: `${player.experience} yrs` },
            ].map(row => (
              <div key={row.label}>
                <span style={{ color: 'var(--text-muted)' }}>{row.label} </span>
                <span style={{ color: 'var(--text-primary)' }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Career stats */}
        <Card title="Career Stats">
          <div className="grid grid-cols-2 gap-3">
            {player.careerStats.map(s => (
              <div key={s.label} className="rounded-xl p-3" style={{ background: 'var(--bg-elevated)' }}>
                <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
                <div className="font-bold text-mono" style={{ color: 'var(--text-primary)' }}>{s.value}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Season stats */}
        <Card title="This Season">
          <div className="space-y-2.5">
            {player.seasonStats.map(s => (
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

        {/* Advanced stats */}
        <Card title="Advanced Stats">
          <div className="space-y-4">
            {player.advancedStats.map(s => (
              <div key={s.label}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{s.label}</div>
                    <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{s.description}</div>
                  </div>
                  <span className="font-bold text-mono" style={{ color: 'var(--accent-light)' }}>{s.value}</span>
                </div>
                <PercentileBar value={s.percentile} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Radar + trend side by side */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Attribute Radar">
          <PlayerRadarChart data={player.radarData} />
        </Card>

        <Card title="Performance Trend">
          <TrendChart
            data={player.trendData}
            primaryLabel={player.sport === 'NFL' ? 'Passer Rating' : 'Points'}
            secondaryLabel={player.sport === 'NFL' ? 'TDs' : 'Rebounds'}
            primaryColor="#6366f1"
            secondaryColor="#22c55e"
          />
        </Card>
      </div>

      {/* AI Projection */}
      <Card title="AI Game Projection" elevated>
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Brain size={14} style={{ color: 'var(--accent-light)' }} />
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {player.aiProjection.nextGame}
              </span>
              <div
                className="ml-auto px-2 py-0.5 rounded text-xs font-semibold"
                style={{ background: 'var(--accent-dim)', color: 'var(--accent-light)' }}
              >
                {player.aiProjection.confidence}% confidence
              </div>
            </div>

            {/* Projected stat ranges */}
            <div className="grid grid-cols-2 gap-2">
              {player.aiProjection.projectedStats.map(s => (
                <div key={s.label} className="rounded-xl p-3" style={{ background: 'var(--bg-elevated)' }}>
                  <div className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
                  <div className="font-bold text-mono" style={{ color: 'var(--accent-light)' }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {/* Factors */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <CheckCircle size={13} style={{ color: 'var(--success)' }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--success)' }}>Key Factors</span>
              </div>
              <ul className="space-y-1.5">
                {player.aiProjection.factors.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <ChevronRight size={12} className="mt-0.5 shrink-0" style={{ color: 'var(--success)' }} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            <div className="divider" />

            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <AlertCircle size={13} style={{ color: 'var(--warning)' }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--warning)' }}>Risk Factors</span>
              </div>
              <ul className="space-y-1.5">
                {player.aiProjection.risks.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <ChevronRight size={12} className="mt-0.5 shrink-0" style={{ color: 'var(--warning)' }} />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Card>

      {/* Game log */}
      <Card title="Recent Game Log" noPad>
        <GameLogTable log={player.gameLog} />
      </Card>

      {/* Comparison placeholder */}
      <div
        className="rounded-2xl p-6 text-center"
        style={{ background: 'var(--bg-card)', border: '1px dashed var(--border-default)' }}
      >
        <BarChart2 size={28} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
        <div className="font-semibold" style={{ color: 'var(--text-secondary)' }}>Player Comparison</div>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{player.comparisonNote}</p>
      </div>
    </div>
  );
}
