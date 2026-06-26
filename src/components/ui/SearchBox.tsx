'use client';

/**
 * Global search box with autocomplete dropdown and keyboard navigation.
 * Used in AppShell topbar.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { SearchResult, SearchEntityType } from '@/lib/search/engine';

const TYPE_ICONS: Record<SearchEntityType, string> = {
  team:   '🏟',
  player: '👤',
  game:   '📅',
  sport:  '🏆',
  league: '🏅',
  venue:  '📍',
};

const TYPE_LABELS: Record<SearchEntityType, string> = {
  team:   'Team',
  player: 'Player',
  game:   'Game',
  sport:  'Sport',
  league: 'League',
  venue:  'Venue',
};

interface Props {
  placeholder?: string;
  className?: string;
}

export default function SearchBox({ placeholder = 'Search teams, players…', className = '' }: Props) {
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open,    setOpen]    = useState(false);
  const [active,  setActive]  = useState(-1);
  const [loading, setLoading] = useState(false);

  const inputRef    = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounce    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router      = useRouter();

  // Debounced autocomplete fetch
  const fetchResults = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/search/autocomplete?q=${encodeURIComponent(q)}&limit=8`);
      if (res.ok) {
        const { results: r } = await res.json() as { results: SearchResult[] };
        setResults(r);
        setOpen(r.length > 0);
        setActive(-1);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setQuery(q);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => fetchResults(q), 200);
  }

  function navigate(result: SearchResult) {
    router.push(result.url);
    setOpen(false);
    setQuery('');
    setResults([]);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive(a => Math.min(a + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(a => Math.max(a - 1, -1));
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault();
      navigate(results[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!dropdownRef.current?.contains(e.target as Node) && !inputRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className={`relative ${className}`} style={{ zIndex: 50 }}>
      <div className="relative">
        {/* Search icon */}
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
          style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={inputRef}
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          className="w-full pl-9 pr-4 py-2 text-sm rounded-lg outline-none focus:ring-2 focus:ring-blue-500/50"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-muted)',
            color: 'var(--text-primary)',
          }}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-3.5 h-3.5 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--text-muted)', borderTopColor: 'transparent' }} />
          </div>
        )}
      </div>

      {open && results.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute mt-1.5 w-full min-w-[280px] rounded-xl py-1.5 shadow-2xl"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-muted)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}
        >
          {results.map((r, i) => (
            <button
              key={r.id}
              onMouseEnter={() => setActive(i)}
              onClick={() => navigate(r)}
              className="w-full flex items-center gap-3 px-3 py-2 text-left transition-colors cursor-pointer"
              style={{ background: i === active ? 'var(--bg-hover)' : 'transparent' }}
            >
              <span className="text-base w-6 flex-shrink-0 text-center">{TYPE_ICONS[r.type]}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{r.title}</p>
                <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{r.subtitle}</p>
              </div>
              <span className="text-xs flex-shrink-0 px-1.5 py-0.5 rounded-md"
                style={{ background: 'var(--bg-base)', color: 'var(--text-muted)', border: '1px solid var(--border-muted)' }}>
                {TYPE_LABELS[r.type]}
              </span>
            </button>
          ))}
          <div className="px-3 pt-1 pb-0.5">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              ↑↓ navigate · Enter select · Esc close
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
