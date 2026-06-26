'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function SearchBox({ initialQuery }: { initialQuery?: string }) {
  const router = useRouter();
  const [q, setQ] = useState(initialQuery ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search teams, sports, leagues…"
        aria-label="Search games, teams, and players"
        className="flex-1 rounded-xl px-4 py-3 text-sm outline-none"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          color: 'var(--text-primary)',
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
      />
      <button
        type="submit"
        className="px-6 py-3 rounded-xl text-sm font-medium text-white"
        style={{ background: 'var(--accent)' }}
      >
        Search
      </button>
    </form>
  );
}
