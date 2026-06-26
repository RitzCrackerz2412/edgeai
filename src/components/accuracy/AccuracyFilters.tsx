'use client';

import { useRouter, useSearchParams } from 'next/navigation';

const SPORTS = ['NFL', 'NBA', 'MLB', 'NHL', 'Soccer', 'UFC'];
const PERIODS = [
  { value: '7d',  label: 'Last 7 Days'  },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: 'all', label: 'All Time'     },
];

interface Props {
  sport:  string;
  period: string;
}

export function AccuracyFilters({ sport, period }: Props) {
  const router     = useRouter();
  const params     = useSearchParams();

  function update(key: string, val: string) {
    const p = new URLSearchParams(params.toString());
    p.set(key, val);
    router.push(`/accuracy?${p.toString()}`);
  }

  const selectStyle = {
    background:   'var(--bg-card)',
    border:       '1px solid var(--border-muted)',
    color:        'var(--text-primary)',
    borderRadius: 8,
    padding:      '6px 10px',
    fontSize:     13,
    cursor:       'pointer',
    outline:      'none',
  } as const;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <select value={sport} onChange={e => update('sport', e.target.value)} style={selectStyle}>
        <option value="all">All Sports</option>
        {SPORTS.map(s => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      <select value={period} onChange={e => update('period', e.target.value)} style={selectStyle}>
        {PERIODS.map(p => (
          <option key={p.value} value={p.value}>{p.label}</option>
        ))}
      </select>
    </div>
  );
}
