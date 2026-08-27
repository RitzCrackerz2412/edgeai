import type { ScorerProjection } from '@/lib/topPlayers';

// Confidence colour: green above 85, amber 70-84, red below
function confColor(conf: number) {
  if (conf >= 85) return '#10b981';
  if (conf >= 70) return '#f59e0b';
  return '#ef4444';
}

const SPORT_DOT_COLOR: Record<string, string> = {
  NBA:    'var(--sport-nba)',
  NFL:    'var(--sport-nfl)',
  NHL:    'var(--sport-nhl)',
  MLB:    'var(--sport-mlb)',
  Soccer: 'var(--sport-soccer)',
};

function ScorerCard({ p }: { p: ScorerProjection }) {
  const cc = confColor(p.confidence);

  return (
    <div style={{
      minWidth: '9.5rem',
      maxWidth: '9.5rem',
      background: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 10,
      padding: '0.75rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.4375rem',
      flexShrink: 0,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Team color accent stripe */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: p.teamColor, opacity: 0.8,
      }} />

      {/* Sport + position badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3125rem' }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: SPORT_DOT_COLOR[p.sport] ?? p.teamColor,
          flexShrink: 0, display: 'inline-block',
        }} />
        <span style={{
          fontSize: '0.5rem', fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.09em', color: 'var(--text-muted)',
        }}>{p.sport}</span>
        <span style={{
          marginLeft: 'auto',
          fontSize: '0.5rem', fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.06em',
          padding: '0.0625rem 0.3125rem', borderRadius: 3,
          background: 'var(--bg-surface)',
          color: 'var(--text-muted)',
        }}>{p.position}</span>
      </div>

      {/* Player name */}
      <div style={{
        fontSize: '0.75rem', fontWeight: 700,
        color: 'var(--text-primary)',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        lineHeight: 1.2,
      }}>
        {p.name.split(' ').slice(-1)[0]}
        <span style={{ fontSize: '0.625rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: 4 }}>
          {p.name.split(' ').slice(0, -1).join(' ')}
        </span>
      </div>

      {/* Team */}
      <div style={{
        fontSize: '0.5625rem', color: 'var(--text-muted)',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {p.teamName}
      </div>

      {/* Projected stat — the headline number */}
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: '0.1875rem',
        marginTop: '0.125rem',
      }}>
        <span style={{
          fontSize: '1.0625rem', fontWeight: 800,
          color: p.teamColor,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}>{p.statValue}</span>
        <span style={{ fontSize: '0.5625rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          {p.statLabel}{p.statUnit}
        </span>
      </div>

      {/* Season avg context */}
      {p.seasonAvg && (
        <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
          {p.seasonAvg}
        </div>
      )}

      {/* Confidence bar */}
      <div style={{ marginTop: '0.125rem' }}>
        <div style={{
          height: 2, borderRadius: 1,
          background: 'var(--bg-surface)',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', width: `${p.confidence}%`,
            background: cc,
            transition: 'width 0.4s',
          }} />
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          marginTop: '0.1875rem',
        }}>
          <span style={{ fontSize: '0.4375rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Confidence
          </span>
          <span style={{ fontSize: '0.4375rem', fontWeight: 700, color: cc, fontVariantNumeric: 'tabular-nums' }}>
            {p.confidence}%
          </span>
        </div>
      </div>
    </div>
  );
}

export function TopScorerPanel({ scorers }: { scorers: ScorerProjection[] }) {
  if (!scorers.length) return null;

  return (
    <section style={{ marginBottom: '1.75rem' }}>
      <div className="section-label">
        <span className="section-label-text">Top Projected Scorers</span>
        <span style={{ fontSize: '0.5625rem', color: 'var(--text-muted)' }}>
          · from today&apos;s matchups
        </span>
        <span className="section-count">{scorers.length}</span>
      </div>

      <div className="scroll-ribbon" style={{ paddingBottom: '0.5rem' }}>
        {scorers.map(p => <ScorerCard key={p.id} p={p} />)}
      </div>
    </section>
  );
}
