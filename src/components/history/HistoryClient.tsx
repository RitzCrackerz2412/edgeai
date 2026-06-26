'use client';

import { useState, useMemo } from 'react';
import type { EXTENDED_HISTORY } from '@/lib/dashboardData';
import { Badge } from '@/components/ui/Badge';
import { Search, Download, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';

type HistoryRow = typeof EXTENDED_HISTORY[number];

const SPORTS = ['All', 'NBA', 'NFL', 'MLB', 'NHL', 'Soccer', 'UFC'];
const OUTCOMES = ['All', 'Correct', 'Incorrect'];
const CONF_TIERS = ['All', '90–100%', '80–89%', '70–79%', '60–69%', '50–59%'];
const PAGE_SIZE = 10;

function confTierMatch(conf: number, tier: string): boolean {
  if (tier === 'All') return true;
  if (tier === '90–100%') return conf >= 90;
  if (tier === '80–89%')  return conf >= 80 && conf < 90;
  if (tier === '70–79%')  return conf >= 70 && conf < 80;
  if (tier === '60–69%')  return conf >= 60 && conf < 70;
  if (tier === '50–59%')  return conf < 60;
  return true;
}

export function HistoryClient({ rows }: { rows: HistoryRow[] }) {
  const [q, setQ] = useState('');
  const [sport, setSport] = useState('All');
  const [outcome, setOutcome] = useState('All');
  const [confTier, setConfTier] = useState('All');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const qLower = q.toLowerCase();
    return rows.filter(r =>
      (sport === 'All' || r.sport === sport) &&
      (outcome === 'All' || (outcome === 'Correct' ? r.correct : !r.correct)) &&
      confTierMatch(r.confidence, confTier) &&
      (q === '' || r.homeTeam.toLowerCase().includes(qLower) || r.awayTeam.toLowerCase().includes(qLower) || r.prediction.toLowerCase().includes(qLower))
    );
  }, [rows, q, sport, outcome, confTier]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const accuracy = filtered.length > 0
    ? Math.round((filtered.filter(r => r.correct).length / filtered.length) * 100)
    : 0;

  const handleFilter = (fn: () => void) => { fn(); setPage(1); };

  return (
    <div className="space-y-5">
      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Filtered Results', value: filtered.length },
          { label: 'Correct',          value: filtered.filter(r => r.correct).length, color: 'var(--success)' },
          { label: 'Incorrect',        value: filtered.filter(r => !r.correct).length, color: 'var(--danger)' },
          { label: 'Accuracy',         value: `${accuracy}%`, color: accuracy >= 70 ? 'var(--success)' : 'var(--warning)' },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-3" style={{ background: 'var(--bg-elevated)' }}>
            <div className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
            <div className="text-xl font-bold text-mono" style={{ color: s.color ?? 'var(--text-primary)' }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Search + filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={q}
            onChange={e => handleFilter(() => setQ(e.target.value))}
            placeholder="Search teams or predictions…"
            className="w-full h-9 pl-8 pr-3 rounded-lg text-sm outline-none"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onBlur={e  => (e.currentTarget.style.borderColor = 'var(--border-default)')}
          />
        </div>

        <FilterSelect label="Sport"    value={sport}    options={SPORTS}    onChange={v => handleFilter(() => setSport(v))} />
        <FilterSelect label="Outcome"  value={outcome}  options={OUTCOMES}  onChange={v => handleFilter(() => setOutcome(v))} />
        <FilterSelect label="Conf."    value={confTier} options={CONF_TIERS} onChange={v => handleFilter(() => setConfTier(v))} />

        {/* CSV export placeholder */}
        <button
          className="flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm transition-all"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-muted)' }}
          title="Export to CSV (coming soon)"
        >
          <Download size={13} />
          <span className="hidden sm:inline">Export</span>
        </button>
      </div>

      {/* Table */}
      {paginated.length > 0 ? (
        <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--border-default)' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Sport</th>
                <th>Matchup</th>
                <th>Prediction</th>
                <th>Actual</th>
                <th>Conf.</th>
                <th>Result</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(row => (
                <tr key={row.id}>
                  <td className="text-mono-sm">{row.date}</td>
                  <td>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>
                      {row.sport}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-primary)' }}>
                    <span>{row.homeTeam}</span>
                    <span style={{ color: 'var(--text-muted)' }}> vs </span>
                    <span>{row.awayTeam}</span>
                  </td>
                  <td style={{ color: 'var(--text-primary)' }}>{row.prediction}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{row.actual}</td>
                  <td>
                    <span
                      className="text-xs font-bold text-mono px-1.5 py-0.5 rounded"
                      style={{
                        background: row.confidence >= 80 ? 'var(--success-dim)' : row.confidence >= 70 ? 'var(--accent-dim)' : 'var(--warning-dim)',
                        color: row.confidence >= 80 ? 'var(--success)' : row.confidence >= 70 ? 'var(--accent-light)' : 'var(--warning)',
                      }}
                    >
                      {row.confidence}%
                    </span>
                  </td>
                  <td>
                    <Badge variant={row.correct ? 'green' : 'red'}>
                      {row.correct ? 'Correct' : 'Wrong'}
                    </Badge>
                  </td>
                  <td className="text-mono-sm">{row.score ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-12 text-center" style={{ color: 'var(--text-muted)' }}>
          <SlidersHorizontal size={28} className="mx-auto mb-3" />
          <p>No predictions match your filters.</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <PagBtn onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronLeft size={14} />
            </PagBtn>
            {Array.from({ length: totalPages }, (_, i) => (
              <PagBtn key={i} onClick={() => setPage(i + 1)} active={page === i + 1}>
                {i + 1}
              </PagBtn>
            ))}
            <PagBtn onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              <ChevronRight size={14} />
            </PagBtn>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="h-9 px-2.5 rounded-lg text-sm outline-none"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', cursor: 'pointer' }}
    >
      {options.map(o => <option key={o} value={o}>{o === 'All' ? `${label}: All` : o}</option>)}
    </select>
  );
}

function PagBtn({ children, onClick, disabled, active }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-all"
      style={{
        background: active ? 'var(--accent)' : 'var(--bg-elevated)',
        color: active ? '#fff' : disabled ? 'var(--text-muted)' : 'var(--text-secondary)',
        border: '1px solid var(--border-default)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {children}
    </button>
  );
}
