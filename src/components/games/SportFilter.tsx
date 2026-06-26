'use client';

import { SPORTS } from '@/lib/mockData';
import { Sport } from '@/lib/types';
import { sportIcon } from '@/lib/utils';

interface SportFilterProps {
  selected: Sport | 'All';
  onChange: (sport: Sport | 'All') => void;
}

export function SportFilter({ selected, onChange }: SportFilterProps) {
  const all: (Sport | 'All')[] = ['All', ...SPORTS];

  return (
    <div className="flex gap-2 flex-wrap">
      {all.map((s) => {
        const active = s === selected;
        return (
          <button
            key={s}
            onClick={() => onChange(s)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all"
            style={{
              background: active ? 'var(--accent)' : 'var(--bg-card)',
              color: active ? '#fff' : 'var(--text-secondary)',
              border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
            }}
          >
            {s !== 'All' && <span>{sportIcon(s)}</span>}
            {s}
          </button>
        );
      })}
    </div>
  );
}
