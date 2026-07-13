import type { SectorPerf } from '@/lib/finance/types';

function sectorColor(pct: number): string {
  if (pct >= 2)    return '#166534'; // deep green
  if (pct >= 1)    return '#15803d';
  if (pct >= 0.25) return '#16a34a';
  if (pct > -0.25) return '#374151'; // neutral gray
  if (pct > -1)    return '#9f1239';
  if (pct > -2)    return '#be123c';
  return '#881337';
}
function textColor(pct: number): string {
  return Math.abs(pct) >= 0.25 ? '#fff' : 'var(--text-secondary)';
}

export function SectorHeatmap({ sectors }: { sectors: SectorPerf[] }) {
  const sorted = [...sectors].sort((a, b) => b.changePct - a.changePct);

  if (sorted.length === 0) {
    return <div className="text-xs text-center py-6" style={{ color: 'var(--text-muted)' }}>Loading sector data…</div>;
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-1.5">
      {sorted.map(s => (
        <div
          key={s.sector}
          className="rounded-lg p-2.5 flex flex-col gap-0.5 transition-all"
          style={{ background: sectorColor(s.changePct), border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <span className="text-[10px] font-semibold leading-tight" style={{ color: textColor(s.changePct) }}>
            {s.sector}
          </span>
          <span className="text-sm font-bold font-mono" style={{ color: textColor(s.changePct) }}>
            {s.changePct >= 0 ? '+' : ''}{s.changePct.toFixed(2)}%
          </span>
        </div>
      ))}
    </div>
  );
}
