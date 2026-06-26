'use client';

import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
} from 'recharts';
import { Team } from '@/lib/types';

interface TeamRadarProps {
  homeTeam: Team;
  awayTeam: Team;
}

export function TeamRadar({ homeTeam, awayTeam }: TeamRadarProps) {
  const data = [
    {
      metric: 'Offense',
      home: normalize(homeTeam.offensiveRating, 95, 130),
      away: normalize(awayTeam.offensiveRating, 95, 130),
    },
    {
      metric: 'Defense',
      home: normalize(120 - homeTeam.defensiveRating, 0, 30),
      away: normalize(120 - awayTeam.defensiveRating, 0, 30),
    },
    {
      metric: 'Momentum',
      home: homeTeam.momentum,
      away: awayTeam.momentum,
    },
    {
      metric: 'Win %',
      home: homeTeam.winPct * 100,
      away: awayTeam.winPct * 100,
    },
    {
      metric: 'ELO',
      home: normalize(homeTeam.eloRating, 1400, 2000),
      away: normalize(awayTeam.eloRating, 1400, 2000),
    },
    {
      metric: 'Power Rank',
      home: normalize(30 - homeTeam.powerRanking, 0, 30),
      away: normalize(30 - awayTeam.powerRanking, 0, 30),
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 rounded-full inline-block" style={{ background: homeTeam.color }} />
          {homeTeam.name}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 rounded-full inline-block" style={{ background: awayTeam.color }} />
          {awayTeam.name}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={data}>
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis
            dataKey="metric"
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
          />
          <Radar
            name={homeTeam.name}
            dataKey="home"
            stroke={homeTeam.color}
            fill={homeTeam.color}
            fillOpacity={0.15}
            strokeWidth={2}
          />
          <Radar
            name={awayTeam.name}
            dataKey="away"
            stroke={awayTeam.color}
            fill={awayTeam.color}
            fillOpacity={0.15}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

function normalize(value: number, min: number, max: number): number {
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
}
