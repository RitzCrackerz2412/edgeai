'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { SPORT_CONFIGS, formatStat } from '@/lib/sports/config';
import { getTeamsBySport } from '@/lib/data/teams';
import { PLAYER_DETAILS } from '@/lib/playerData';

function WinBar({ prob, color }: { prob: number; color: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-8 text-right font-mono font-bold" style={{ color }}>{Math.round(prob * 100)}%</span>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-base)' }}>
        <div className="h-full rounded-full" style={{ width: `${prob * 100}%`, background: color }} />
      </div>
      <span className="w-8 font-mono" style={{ color: 'var(--text-muted)' }}>{Math.round((1 - prob) * 100)}%</span>
    </div>
  );
}

export default function SportHome({ sportId }: { sportId: string }) {
  const config = SPORT_CONFIGS[sportId as keyof typeof SPORT_CONFIGS];
  const teams = useMemo(() => getTeamsBySport(config.sport), [config.sport]);
  const players = useMemo(
    () => Object.values(PLAYER_DETAILS).filter(p => p.sport === config.sport),
    [config.sport],
  );

  const topTeams = useMemo(
    () => [...teams].sort((a, b) => b.eloRating - a.eloRating).slice(0, 6),
    [teams],
  );

  const featuredMatchups = useMemo(() => {
    if (teams.length < 4) return [];
    const sorted = [...teams].sort((a, b) => b.eloRating - a.eloRating);
    const pairs: { home: typeof sorted[0]; away: typeof sorted[0] }[] = [];
    for (let i = 0; i < Math.min(4, sorted.length - 1); i += 2) {
      pairs.push({ home: sorted[i], away: sorted[i + 1] });
    }
    return pairs;
  }, [teams]);

  const quickStats = [
    { label: config.isIndividual ? 'Competitors' : 'Teams', value: teams.length },
    { label: 'Players', value: players.length },
    { label: 'Predictions', value: Math.round(teams.length * 3.2) },
    { label: 'AI Accuracy', value: '73%' },
  ];

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Hero */}
      <div
        className="rounded-2xl p-6 sm:p-8 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${config.color}18 0%, var(--bg-card) 60%)`,
          border: `1px solid ${config.color}30`,
        }}
      >
        <div
          className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-5 -translate-y-1/2 translate-x-1/4"
          style={{ background: config.color }}
        />
        <div className="relative">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-4xl">{config.emoji}</span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {config.fullName}
              </h1>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{config.description}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mt-4">
            {config.subPages.filter(p => ['matchup', 'standings', 'leaderboard', 'predictions'].includes(p.slug)).map(p => (
              <Link
                key={p.slug}
                href={`/${config.slug}/${p.slug}`}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
                style={{ background: config.color, color: '#fff' }}
              >
                {p.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickStats.map(s => (
          <div key={s.label} className="rounded-xl p-4 text-center"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
            <p className="text-2xl font-bold font-mono" style={{ color: config.color }}>{s.value}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top teams/competitors */}
        <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
              Top {config.competitorLabel}s
            </h2>
            <Link href={`/${config.slug}/teams`} className="text-xs transition-opacity hover:opacity-80"
              style={{ color: config.color }}>View all →</Link>
          </div>
          <div className="space-y-2">
            {topTeams.map((t, i) => {
              const mainStat = config.teamStats[0];
              const val = mainStat.derive(t);
              return (
                <div key={t.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg transition-colors"
                  style={{ background: i === 0 ? `${config.color}10` : 'transparent' }}>
                  <span className="w-5 text-xs font-bold text-center" style={{ color: i < 3 ? config.color : 'var(--text-muted)' }}>
                    {i + 1}
                  </span>
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                    style={{ background: `${t.color}25`, color: t.color }}
                  >
                    {t.abbreviation?.slice(0, 3) ?? t.name.slice(0, 3)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{t.name}</p>
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{t.record}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono font-bold" style={{ color: 'var(--text-primary)' }}>
                      {formatStat(val, mainStat.format)}
                    </p>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{mainStat.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Featured matchups */}
        <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Featured Matchups</h2>
            <Link href={`/${config.slug}/matchup`} className="text-xs transition-opacity hover:opacity-80"
              style={{ color: config.color }}>Predictor →</Link>
          </div>
          {featuredMatchups.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>
              Not enough {config.competitorLabel.toLowerCase()}s for matchup preview
            </p>
          ) : (
            <div className="space-y-4">
              {featuredMatchups.map(({ home, away }) => {
                const result = config.predict(home, away);
                return (
                  <div key={`${home.id}-${away.id}`}
                    className="p-3 rounded-xl"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full" style={{ background: home.color }} />
                        <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{home.name}</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: `${config.color}15`, color: config.color }}>
                        vs
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{away.name}</span>
                        <div className="w-5 h-5 rounded-full" style={{ background: away.color }} />
                      </div>
                    </div>
                    <WinBar prob={result.homeWinProb} color={home.color} />
                    <p className="text-[10px] mt-1.5 truncate" style={{ color: 'var(--text-muted)' }}>
                      {result.keyFactors[0]?.label}: {result.keyFactors[0]?.side === 'home' ? home.name : result.keyFactors[0]?.side === 'away' ? away.name : 'Even'}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Players spotlight */}
      {players.length > 0 && (
        <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Player Spotlight</h2>
            <Link href={`/${config.slug}/players`} className="text-xs hover:opacity-80"
              style={{ color: config.color }}>All Players →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {players.slice(0, 8).map(p => (
              <div key={p.id}
                className="rounded-xl p-3"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: `${p.teamColor}22`, color: p.teamColor }}
                  >
                    {p.number !== '—' ? p.number : p.position.slice(0, 1)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>{p.name}</p>
                    <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>{p.position} · {p.teamName}</p>
                  </div>
                </div>
                {p.seasonStats[0] && (
                  <div>
                    <p className="text-lg font-bold font-mono" style={{ color: config.color }}>
                      {p.seasonStats[0].value}
                    </p>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{p.seasonStats[0].label}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team stats overview */}
      <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>Key Metrics Overview</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {config.teamStats.slice(0, 4).map(stat => {
            const vals = teams.map(t => stat.derive(t)).filter(v => typeof v === 'number') as number[];
            const avg = vals.length ? vals.reduce((a, b) => a + (b as number), 0) / vals.length : 0;
            const best = stat.higherBetter ? Math.max(...vals) : Math.min(...vals);
            const bestTeam = teams.find(t => stat.derive(t) === best);
            return (
              <div key={stat.key} className="space-y-1">
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
                <p className="text-sm font-bold font-mono" style={{ color: 'var(--text-primary)' }}>
                  League Avg: {formatStat(avg, stat.format)}
                </p>
                {bestTeam && (
                  <p className="text-[11px]" style={{ color: config.color }}>
                    Best: {bestTeam.abbreviation ?? bestTeam.name.slice(0, 3)} — {formatStat(best, stat.format)}
                  </p>
                )}
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{stat.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
