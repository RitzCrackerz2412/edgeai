import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import { ArrowLeft, FileText } from 'lucide-react';
import { getGameById } from '@/lib/api';
import { generateReport } from '@/lib/analyst/engine';
import type { AnalystReport, KeyMatchup, RiskFactor } from '@/lib/analyst/engine';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const game = await getGameById(id);
  if (!game) return { title: 'Game Not Found' };
  return {
    title: `AI Analyst: ${game.homeTeam.abbreviation} vs ${game.awayTeam.abbreviation}`,
    description: `Professional AI-generated game analysis for ${game.homeTeam.name} vs ${game.awayTeam.name}.`,
  };
}

// ── Sub-components (server) ───────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>{title}</h2>
      <div className="text-sm leading-7" style={{ color: 'var(--text-secondary)' }}>{children}</div>
    </section>
  );
}

function Prose({ text }: { text: string }) {
  // Bold **text** markdown → <strong>
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <p className="text-sm leading-7" style={{ color: 'var(--text-secondary)' }}>
      {parts.map((p, i) =>
        p.startsWith('**') && p.endsWith('**')
          ? <strong key={i} style={{ color: 'var(--text-primary)' }}>{p.slice(2, -2)}</strong>
          : <span key={i}>{p}</span>
      )}
    </p>
  );
}

function MultiPara({ text }: { text: string }) {
  return (
    <div className="space-y-3">
      {text.split('\n\n').map((para, i) => <Prose key={i} text={para} />)}
    </div>
  );
}

function MatchupCard({ m }: { m: KeyMatchup }) {
  const winnerColor = m.winner === 'home'
    ? 'rgba(16,185,129,0.08)'
    : m.winner === 'away'
    ? 'rgba(239,68,68,0.08)'
    : 'rgba(245,158,11,0.08)';
  const badge = m.winner === 'home' ? 'Home Edge' : m.winner === 'away' ? 'Away Edge' : 'Even';
  const badgeColor = m.winner === 'home' ? '#10b981' : m.winner === 'away' ? '#ef4444' : '#f59e0b';

  return (
    <div className="rounded-xl p-4 space-y-2" style={{ background: winnerColor, border: '1px solid var(--border-muted)' }}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{m.title}</p>
        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ color: badgeColor, background: `${badgeColor}18` }}>{badge}</span>
      </div>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>{m.analysis}</p>
    </div>
  );
}

function RiskCard({ r }: { r: RiskFactor }) {
  const colors: Record<string, { bg: string; text: string }> = {
    low:      { bg: 'rgba(16,185,129,0.06)',  text: '#10b981' },
    medium:   { bg: 'rgba(245,158,11,0.06)',  text: '#f59e0b' },
    high:     { bg: 'rgba(239,68,68,0.06)',   text: '#ef4444' },
    critical: { bg: 'rgba(220,38,38,0.12)',   text: '#dc2626' },
  };
  const c = colors[r.severity];

  return (
    <div className="flex gap-3 rounded-xl px-4 py-3" style={{ background: c.bg, border: `1px solid ${c.text}28` }}>
      <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ background: c.text }} />
      <div className="min-w-0">
        <span className="text-xs font-medium uppercase tracking-wider mr-2" style={{ color: c.text }}>{r.severity}</span>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>({r.affects === 'both' ? 'both sides' : `${r.affects} team`})</span>
        <p className="text-sm mt-0.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{r.description}</p>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AnalystPage({ params }: Props) {
  const { id } = await params;
  const game = await getGameById(id);
  if (!game) notFound();

  const report: AnalystReport = generateReport(game);
  const { finalPrediction: fp } = report;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-10" style={{ color: 'var(--text-primary)' }}>

      {/* Breadcrumb */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link href={`/game/${id}`} className="inline-flex items-center gap-1.5 text-sm hover:opacity-75"
          style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft size={14} />
          Back to Game
        </Link>
        <span style={{ color: 'var(--text-muted)' }}>·</span>
        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>AI Analyst Report</span>
      </div>

      {/* Header */}
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <FileText size={16} style={{ color: 'var(--text-muted)' }} />
          <p className="text-xs uppercase tracking-widest font-medium" style={{ color: 'var(--text-muted)' }}>
            AI Sports Analyst · {game.sport} · {game.league}
          </p>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          {game.homeTeam.name} vs. {game.awayTeam.name}
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {game.date} · {game.time} · {game.venue}
        </p>
      </header>

      <hr style={{ borderColor: 'var(--border-muted)' }} />

      {/* Executive Summary */}
      <Section title="Executive Summary">
        <Prose text={report.executiveSummary} />
      </Section>

      {/* Key Matchups */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>Key Matchups</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {report.keyMatchups.map((m, i) => <MatchupCard key={i} m={m} />)}
        </div>
      </section>

      {/* Why Favorite Wins */}
      <Section title={`Why ${fp.winner} Wins`}>
        <MultiPara text={report.whyFavoriteWins} />
      </Section>

      {/* Why Underdog Can Win */}
      <Section title="The Underdog's Case">
        <MultiPara text={report.whyUnderdogCan} />
      </Section>

      {/* Risk Factors */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>Risk Factors</h2>
        <div className="space-y-2">
          {report.riskFactors.map((r, i) => <RiskCard key={i} r={r} />)}
        </div>
      </section>

      {/* Injury Analysis */}
      <Section title="Injury Analysis">
        <MultiPara text={report.injuryAnalysis} />
      </Section>

      {/* Weather Impact */}
      {report.weatherImpact && (
        <Section title="Weather Impact">
          <MultiPara text={report.weatherImpact} />
        </Section>
      )}

      {/* Coaching */}
      <Section title="Coaching & Scheme">
        <MultiPara text={report.coachingAnalysis} />
      </Section>

      {/* Game Script */}
      <Section title="Expected Game Script">
        <MultiPara text={report.gameScript} />
      </Section>

      {/* Final Prediction */}
      <section className="rounded-2xl p-6 space-y-4"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-muted)' }}>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Final Prediction</h2>

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{fp.winner}</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Projected score: {fp.score}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-mono font-bold" style={{ color: 'var(--accent-blue, #3b82f6)' }}>
              {fp.confidence}%
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>model confidence</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 pt-2">
          <div className="text-sm space-y-1">
            <p className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Key Factor</p>
            <p style={{ color: 'var(--text-secondary)' }}>{fp.keyFactor}</p>
          </div>
          <div className="text-sm space-y-1">
            <p className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Monte Carlo</p>
            <p style={{ color: 'var(--text-secondary)' }}>{fp.monteCarloRate.toFixed(1)}% across 10,000 simulations</p>
          </div>
        </div>

        <div className="pt-2 space-y-3">
          <MultiPara text={fp.narrative} />
          <p className="text-xs px-3 py-2 rounded-lg" style={{ background: 'var(--bg-base)', color: 'var(--text-muted)', border: '1px solid var(--border-muted)' }}>
            {fp.valueNote}
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-xs pb-4" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border-muted)', paddingTop: '1rem' }}>
        Report generated {new Date(report.generatedAt).toLocaleString()} by EdgeAI Sports Intelligence.
        This analysis is for informational purposes only and does not constitute betting advice.
        All probabilities reflect model estimates under uncertainty.
      </footer>
    </div>
  );
}
