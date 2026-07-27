'use client';

import { useRouter } from 'next/navigation';

interface Props {
  active: boolean;
}

export function DisagreementSortControl({ active }: Props) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(active ? '/games' : '/games?sort=disagreement')}
      title={active ? 'Clear sort — back to default order' : 'Sort by model disagreement — surfaces most uncertain games first'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        fontSize: '0.5625rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.09em',
        padding: '0.1875rem 0.625rem',
        borderRadius: 100,
        background: active ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.06)',
        color: '#f59e0b',
        border: `1px solid ${active ? 'rgba(245,158,11,0.4)' : 'rgba(245,158,11,0.2)'}`,
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {active ? '✕ ' : ''}⚠ Disagreement
    </button>
  );
}
