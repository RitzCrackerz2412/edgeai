/**
 * GET /api/cron/results
 *
 * Polls ESPN for completed games from the past 48 hours across all major
 * sports, matches them to stored predictions, and calls processPostGame
 * to update ELO ratings, calibration, and GBDT training data.
 *
 * Call this route on a schedule (Vercel Cron: every hour, or every 15 min
 * during peak game hours). Secure it with CRON_SECRET in production.
 *
 * Vercel cron config (vercel.json):
 *   { "crons": [{ "path": "/api/cron/results", "schedule": "0 * * * *" }] }
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/providers/client';
import { processPostGame } from '@/lib/engine/learning';
import { findPredictionByTeams, markResolved } from '@/lib/engine/predictionStore';
import type { Sport } from '@/lib/types';

const BASE = 'https://site.api.espn.com/apis/site/v2/sports';

const SPORT_PATHS: Array<{ sport: Sport; path: string }> = [
  { sport: 'NBA',     path: 'basketball/nba' },
  { sport: 'NFL',     path: 'football/nfl' },
  { sport: 'MLB',     path: 'baseball/mlb' },
  { sport: 'NHL',     path: 'hockey/nhl' },
  { sport: 'Soccer',  path: 'soccer/eng.1' },
  { sport: 'Soccer',  path: 'soccer/esp.1' },
  { sport: 'Soccer',  path: 'soccer/ger.1' },
  { sport: 'Soccer',  path: 'soccer/ita.1' },
  { sport: 'Soccer',  path: 'soccer/fra.1' },
  { sport: 'Soccer',  path: 'soccer/usa.1' },
  { sport: 'Soccer',  path: 'soccer/fifa.world' },
  { sport: 'Soccer',  path: 'soccer/uefa.champions' },
];

interface ESPNScoreEvent {
  id: string;
  date: string;
  status: { type: { name: string; completed: boolean } };
  competitions: Array<{
    competitors: Array<{
      homeAway: 'home' | 'away';
      score: string;
      team: { id: string; displayName: string };
    }>;
  }>;
}

function dateStr(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

async function fetchCompletedGames(sport: Sport, path: string, dateFormatted: string) {
  try {
    const data = await apiFetch<{ events?: ESPNScoreEvent[] }>(
      `${BASE}/${path}/scoreboard?dates=${dateFormatted}`,
      { rateLimitKey: `cron-${path}`, timeoutMs: 8_000, retries: 1, next: { revalidate: 0 } },
    );
    if (!data?.events) return [];

    return data.events
      .filter(ev => ev.status.type.completed)
      .map(ev => {
        const comp = ev.competitions[0];
        const home = comp?.competitors.find(c => c.homeAway === 'home');
        const away = comp?.competitors.find(c => c.homeAway === 'away');
        const homeScore = home?.score ? parseInt(home.score, 10) : NaN;
        const awayScore = away?.score ? parseInt(away.score, 10) : NaN;
        if (!home || !away || isNaN(homeScore) || isNaN(awayScore)) return null;
        return {
          espnId:       ev.id,
          sport,
          gameDate:     ev.date.slice(0, 10),
          homeTeamName: home.team.displayName,
          awayTeamName: away.team.displayName,
          homeTeamId:   home.team.id,
          awayTeamId:   away.team.id,
          homeScore,
          awayScore,
        };
      })
      .filter((g): g is NonNullable<typeof g> => g !== null);
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  // Verify cron secret in production
  const secret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret');
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const yesterday = new Date(now.getTime() - 86_400_000);

  // Fetch completed games for today and yesterday across all sports in parallel
  const batches = await Promise.all(
    SPORT_PATHS.flatMap(({ sport, path }) => [
      fetchCompletedGames(sport, path, dateStr(now)),
      fetchCompletedGames(sport, path, dateStr(yesterday)),
    ]),
  );
  const completed = batches.flat();

  const results: Array<{ gameId: string; matched: boolean; processed: boolean }> = [];

  for (const game of completed) {
    // Find a stored prediction for this game
    const stored = await findPredictionByTeams(
      game.homeTeamName,
      game.awayTeamName,
      game.gameDate,
      game.sport,
    );

    if (!stored) {
      results.push({ gameId: `${game.sport}-${game.espnId}`, matched: false, processed: false });
      continue;
    }

    try {
      processPostGame({
        gameId:    stored.gameId,
        sport:     stored.sport as Sport,
        homeTeamId: game.homeTeamId,
        awayTeamId: game.awayTeamId,
        homeScore:  game.homeScore,
        awayScore:  game.awayScore,
        storedPrediction: {
          gameId:                      stored.gameId,
          sport:                       stored.sport,
          modelName:                   stored.modelName,
          predictedHomeWinProbability: stored.homeWinProbability,
          predictedHomeScore:          stored.predictedHomeScore,
          predictedAwayScore:          stored.predictedAwayScore,
          actualHomeScore:             game.homeScore,
          actualAwayScore:             game.awayScore,
          homeWon:                     game.homeScore > game.awayScore,
          predictionCorrect:           (game.homeScore > game.awayScore) === (stored.homeWinProbability > 0.5),
          marginError:                 0,
          scoreMAE:                    0,
          brierContribution:           0,
          logLossContribution:         0,
          confidenceError:             0,
          predictedAt:                 stored.predictedAt,
          validatedAt:                 new Date().toISOString(),
          gbdtFeatures:                stored.gbdtFeatures,
        },
      });

      await markResolved(stored.gameId);
      results.push({ gameId: stored.gameId, matched: true, processed: true });
    } catch (e) {
      results.push({ gameId: stored.gameId, matched: true, processed: false });
      console.error('[cron/results] processPostGame failed:', e);
    }
  }

  const processed = results.filter(r => r.processed).length;
  const matched   = results.filter(r => r.matched).length;

  return NextResponse.json({
    checked:   completed.length,
    matched,
    processed,
    results,
    ranAt:     now.toISOString(),
  });
}
