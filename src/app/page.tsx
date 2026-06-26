import { Metadata } from 'next';
import { getUpcomingGames, getAccuracyStats } from '@/lib/api';
import { ACTIVITY_FEED, TRENDING_TEAMS } from '@/lib/dashboardData';
import { Card } from '@/components/ui/Card';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { HeroGames } from '@/components/home/HeroGames';
import { ConfidenceDistribution } from '@/components/home/ConfidenceDistribution';
import { TopPicks } from '@/components/home/TopPicks';
import { UpsetAlerts } from '@/components/home/UpsetAlerts';
import { ActivityFeed } from '@/components/home/ActivityFeed';
import { TrendingSection } from '@/components/home/TrendingSection';
import Link from 'next/link';
import { ArrowRight, TrendingUp, Target, Zap, Brain } from 'lucide-react';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function HomePage() {
  const [games, accuracy] = await Promise.all([getUpcomingGames(), getAccuracyStats()]);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="p-6 max-w-screen-2xl mx-auto space-y-8 anim-fade-in">

      {/* ── Dashboard Header ──────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-h1" style={{ color: 'var(--text-primary)' }}>Sports Intelligence</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {today} · {games.length} upcoming games · AI predictions with transparent reasoning
          </p>
        </div>
        <Link
          href="/search"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
          style={{
            background: 'var(--accent)',
            color: '#fff',
            textDecoration: 'none',
          }}
        >
          <Zap size={14} />
          Find any game
        </Link>
      </div>

      {/* ── Model Performance ────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Overall Accuracy',  value: accuracy.overall,    suffix: '%',  decimals: 1, sub: 'All-time · all sports',            icon: Target,    accent: true  },
          { label: 'Last 30 Days',      value: accuracy.last30Days, suffix: '%',  decimals: 1, sub: '↑2.8% from prior 30',               icon: TrendingUp, accent: false },
          { label: 'Total Predictions', value: accuracy.totalPredictions, suffix:'', decimals:0, sub: 'Across 13 sports',                icon: Brain,     accent: false },
          { label: 'ROC AUC',           value: accuracy.rocAuc,     suffix: '',   decimals: 3, sub: `Brier score ${accuracy.brierScore}`, icon: Zap,       accent: false },
        ].map(({ label, value, suffix, decimals, sub, icon: Icon, accent }) => (
          <div
            key={label}
            className="rounded-2xl p-4 flex flex-col gap-1"
            style={{
              background: accent ? 'var(--accent-dim)' : 'var(--bg-card)',
              border: `1px solid ${accent ? 'rgba(99,102,241,0.3)' : 'var(--border-default)'}`,
            }}
          >
            <div className="flex items-center gap-1.5">
              <Icon size={12} style={{ color: accent ? 'var(--accent-light)' : 'var(--text-muted)' }} />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                {label}
              </span>
            </div>
            <div className="text-2xl font-bold text-mono" style={{ color: accent ? 'var(--accent-light)' : 'var(--text-primary)' }}>
              <AnimatedCounter value={value} decimals={decimals} suffix={suffix} />
            </div>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{sub}</span>
          </div>
        ))}
      </div>

      {/* ── Featured Games (Hero) ─────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-h3" style={{ color: 'var(--text-primary)' }}>Featured Games</h2>
          <Link href="/" className="text-sm flex items-center gap-1" style={{ color: 'var(--accent-light)', textDecoration: 'none' }}>
            See all <ArrowRight size={13} />
          </Link>
        </div>
        <HeroGames games={games} />
      </section>

      {/* ── Two-column: Top Picks + Confidence Distribution ──────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Top Picks Tonight" action={
          <Link href="/" className="text-xs flex items-center gap-1" style={{ color: 'var(--accent-light)', textDecoration: 'none' }}>
            All games <ArrowRight size={11} />
          </Link>
        }>
          <TopPicks games={games} />
        </Card>

        <Card title="Confidence Distribution">
          <ConfidenceDistribution />
        </Card>
      </div>

      {/* ── Two-column: Upset Alerts + Sport Accuracy ────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Upset Alerts">
          <UpsetAlerts games={games} />
        </Card>

        <Card title="Sport-by-Sport Accuracy">
          <div className="space-y-2.5">
            {Object.entries(accuracy.bySport)
              .sort(([, a], [, b]) => b - a)
              .map(([sport, acc]) => (
                <div key={sport} className="flex items-center gap-3">
                  <span className="w-20 text-sm shrink-0" style={{ color: 'var(--text-secondary)' }}>{sport}</span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--border-default)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${acc}%`,
                        background: acc >= 70 ? 'var(--success)' : acc >= 65 ? 'var(--accent)' : 'var(--warning)',
                      }}
                    />
                  </div>
                  <span className="w-12 text-right text-sm font-semibold text-mono" style={{ color: 'var(--text-primary)' }}>
                    {acc}%
                  </span>
                </div>
              ))}
          </div>
        </Card>
      </div>

      {/* ── Two-column: Activity Feed + Trending ─────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Recent Activity">
          <ActivityFeed items={ACTIVITY_FEED.slice(0, 7)} />
          <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <Link href="/history" className="text-xs flex items-center gap-1" style={{ color: 'var(--accent-light)', textDecoration: 'none' }}>
              View full prediction history <ArrowRight size={11} />
            </Link>
          </div>
        </Card>

        <Card title="Trending Teams">
          <TrendingSection teams={TRENDING_TEAMS} />
        </Card>
      </div>

      {/* ── Quick links row ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: '/accuracy', label: 'Model Accuracy', sub: 'Calibration & ROC curves' },
          { href: '/team',     label: 'Team Profiles',  sub: `${2} teams tracked` },
          { href: '/player',   label: 'Player Stats',   sub: 'AI game projections' },
          { href: '/history',  label: 'Prediction Log', sub: 'Search & filter history' },
        ].map(({ href, label, sub }) => (
          <Link
            key={href}
            href={href}
            className="card-link"
          >
            <div className="font-semibold text-sm mb-0.5" style={{ color: 'var(--text-primary)' }}>{label}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{sub}</div>
            <ArrowRight size={13} className="mt-2" style={{ color: 'var(--accent-light)' }} />
          </Link>
        ))}
      </div>
    </div>
  );
}
