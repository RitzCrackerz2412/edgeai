'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { SportConfig } from '@/lib/sports/config';
import { PLAYER_DETAILS } from '@/lib/playerData';

export default function SportPlayers({ config }: { config: SportConfig }) {
  const all = useMemo(
    () => Object.values(PLAYER_DETAILS).filter(p => p.sport === config.sport),
    [config.sport],
  );
  const [search, setSearch] = useState('');
  const [pos, setPos] = useState('All');

  const positions = useMemo(() => ['All', ...new Set(all.map(p => p.position))], [all]);

  const filtered = useMemo(() => {
    let p = [...all];
    if (search) p = p.filter(pl => pl.name.toLowerCase().includes(search.toLowerCase()) || pl.teamName.toLowerCase().includes(search.toLowerCase()));
    if (pos !== 'All') p = p.filter(pl => pl.position === pos);
    return p;
  }, [all, search, pos]);

  if (all.length === 0) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-12 text-center">
        <span className="text-5xl">{config.emoji}</span>
        <h2 className="text-lg font-bold mt-4" style={{ color: 'var(--text-primary)' }}>
          Player Database — {config.name}
        </h2>
        <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
          Player profiles for {config.fullName} will appear here once data is loaded.
          Live data provider integration delivers complete active rosters automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{config.name} Players</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {all.length} players · Full career & season statistics
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3">
        <input type="text" placeholder="Search name or team…" value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-sm outline-none"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', minWidth: 200 }}
        />
        <div className="flex flex-wrap gap-1.5">
          {positions.slice(0, 10).map(p => (
            <button key={p} onClick={() => setPos(p)}
              className="px-2.5 py-1 rounded-full text-xs cursor-pointer"
              style={{
                background: pos === p ? config.color : 'var(--bg-card)',
                color: pos === p ? '#fff' : 'var(--text-muted)',
                border: `1px solid ${pos === p ? config.color : 'var(--border-default)'}`,
              }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Player grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(p => (
          <Link href={`/player/${p.id}`} key={p.id}>
            <div className="rounded-xl p-4 hover:opacity-90 transition-opacity cursor-pointer"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
              {/* Player header */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ background: `${p.teamColor}22`, color: p.teamColor }}>
                  {p.number !== '—' ? p.number : p.position.slice(0, 1)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{p.name}</p>
                  <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
                    {p.position} · {p.teamName}
                  </p>
                </div>
              </div>

              {/* Season stats */}
              <div className="grid grid-cols-2 gap-1.5">
                {p.seasonStats.slice(0, 4).map(s => (
                  <div key={s.label} className="rounded-lg px-2 py-1.5" style={{ background: 'var(--bg-elevated)' }}>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
                    <p className="text-xs font-bold font-mono" style={{ color: 'var(--text-primary)' }}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* AI confidence */}
              <div className="mt-3 flex items-center justify-between">
                <div className="flex-1 h-1 rounded-full overflow-hidden mr-2" style={{ background: 'var(--bg-base)' }}>
                  <div className="h-full rounded-full" style={{ width: `${p.aiProjection.confidence}%`, background: config.color }} />
                </div>
                <span className="text-[10px]" style={{ color: config.color }}>
                  {p.aiProjection.confidence}% AI confidence
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
