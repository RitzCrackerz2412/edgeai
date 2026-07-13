'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';

interface SearchResult { ticker: string; name: string; exchange: string; type: string }

export function FinanceSearchBar({ placeholder = 'Search stocks, ETFs, funds…' }: { placeholder?: string }) {
  const [q, setQ]            = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset on empty query
    if (!q.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/finance/search?q=${encodeURIComponent(q)}`);
        const d = await r.json();
        setResults(d.results ?? []);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const go = (ticker: string) => {
    setOpen(false);
    setQ('');
    router.push(`/finance/${ticker}`);
  };

  return (
    <div ref={ref} className="relative">
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-xl"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
      >
        <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <input
          type="text"
          value={q}
          onChange={e => setQ(e.target.value)}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: 'var(--text-primary)', caretColor: 'var(--accent)' }}
        />
        {loading && <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" style={{ color: 'var(--text-muted)' }} />}
        {q && !loading && (
          <button onClick={() => { setQ(''); setResults([]); }} style={{ color: 'var(--text-muted)' }}>
            <X size={12} />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div
          className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-50"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', boxShadow: 'var(--shadow-lg)' }}
        >
          {results.slice(0, 8).map(r => (
            <button
              key={r.ticker}
              onClick={() => go(r.ticker)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-all"
              style={{ borderBottom: '1px solid var(--border-subtle)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[9px] font-bold shrink-0"
                style={{ background: 'var(--accent-dim)', color: 'var(--accent-light)' }}
              >
                {r.ticker.slice(0, 4)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{r.ticker}</div>
                <div className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>{r.name}</div>
              </div>
              <div className="text-[10px] shrink-0" style={{ color: 'var(--text-muted)' }}>{r.exchange}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
