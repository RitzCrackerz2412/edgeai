/**
 * ELO rating model — interpretable baseline prediction.
 *
 * Implementation follows FiveThirtyEight's NFL/NBA ELO methodology:
 *   https://fivethirtyeight.com/methodology/
 *
 * Key properties:
 *  - Each team starts at 1500 (league average)
 *  - Win probability: P(A wins) = 1 / (1 + 10^((R_B - R_A) / 400))
 *  - Ratings update after each game using a K-factor × MOV multiplier
 *  - Home field advantage is added to home team's rating when computing E_A
 *  - At season start, ratings regress 33% toward 1500 (roster turnover)
 */

import type { GameFeatureVector } from '../features/types';
import type { FeatureContribution, ModelPrediction, PredictionModel } from './types';
import { eloDiffToProb, clamp } from '../features/normalize';

// ── Sport-specific ELO configuration ─────────────────────────────────────────

interface EloConfig {
  k: number;             // base K-factor (rating update magnitude)
  homeAdvElo: number;    // ELO points added to home team rating
  regress: number;       // fraction to regress toward 1500 each off-season
  useMov: boolean;       // apply margin-of-victory multiplier?
}

const SPORT_ELO_CONFIG: Record<string, EloConfig> = {
  NFL:               { k: 20,  homeAdvElo: 65,  regress: 0.33, useMov: true  },
  NBA:               { k: 32,  homeAdvElo: 100, regress: 0.33, useMov: true  },
  MLB:               { k: 20,  homeAdvElo: 25,  regress: 0.33, useMov: false },
  NHL:               { k: 24,  homeAdvElo: 60,  regress: 0.33, useMov: false },
  Soccer:            { k: 20,  homeAdvElo: 90,  regress: 0.25, useMov: false },
  'NCAA Football':   { k: 24,  homeAdvElo: 70,  regress: 0.40, useMov: true  },
  'NCAA Basketball': { k: 32,  homeAdvElo: 100, regress: 0.40, useMov: true  },
  UFC:               { k: 40,  homeAdvElo: 0,   regress: 0.00, useMov: false },
  Boxing:            { k: 40,  homeAdvElo: 0,   regress: 0.00, useMov: false },
  Tennis:            { k: 32,  homeAdvElo: 30,  regress: 0.10, useMov: false },
  default:           { k: 25,  homeAdvElo: 50,  regress: 0.33, useMov: false },
};

function config(sport: string): EloConfig {
  return SPORT_ELO_CONFIG[sport] ?? SPORT_ELO_CONFIG.default;
}

// ── Margin-of-victory multiplier (FiveThirtyEight formula) ───────────────────
//
// Reward larger wins without letting them dominate small-sample matchups.
// The autocorrelation correction prevents inflating ratings when a strong
// team blows out a much weaker one.

function movMultiplier(margin: number, eloDiff: number): number {
  const absMargin = Math.abs(margin);
  if (absMargin === 0) return 1;
  // ln(margin + 1) * autocorrelation correction
  const autocorr = 2.2 / (eloDiff * 0.001 + 2.2);
  return Math.log(absMargin + 1) * autocorr;
}

// ── ELO model class ───────────────────────────────────────────────────────────

export class EloModel implements PredictionModel {
  readonly name = 'ELO';
  readonly version = '1.0.0';

  private readonly ratings = new Map<string, number>();

  /** Expected score for team A given ratings (0-1 = probability of winning) */
  expectedScore(ratingA: number, ratingB: number): number {
    return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  }

  getRating(teamId: string): number {
    return this.ratings.get(teamId) ?? 1500;
  }

  setRating(teamId: string, rating: number): void {
    this.ratings.set(teamId, clamp(rating, 500, 2500));
  }

  /** Seed ratings from existing team data (mock or database) */
  seed(teams: Array<{ id: string; eloRating: number }>): void {
    for (const t of teams) {
      this.setRating(t.id, t.eloRating);
    }
  }

  /** Update ratings after a completed game result */
  updateFromResult(
    homeTeamId: string,
    awayTeamId: string,
    homeScore: number,
    awayScore: number,
    sport: string,
  ): void {
    const cfg = config(sport);
    const homeRating = this.getRating(homeTeamId);
    const awayRating = this.getRating(awayTeamId);

    // Apply home advantage when computing expected
    const homeExpected = this.expectedScore(homeRating + cfg.homeAdvElo, awayRating);

    // Actual outcome: 1 = home win, 0 = away win, 0.5 = draw
    const margin = homeScore - awayScore;
    const homeActual = margin > 0 ? 1 : margin < 0 ? 0 : 0.5;

    // K-factor with optional MOV multiplier
    const eloDiff = homeRating - awayRating;
    const k = cfg.k * (cfg.useMov ? movMultiplier(margin, eloDiff) : 1);

    this.setRating(homeTeamId, homeRating + k * (homeActual - homeExpected));
    this.setRating(awayTeamId, awayRating + k * ((1 - homeActual) - (1 - homeExpected)));
  }

  /** Regress all known ratings toward 1500 at season start */
  regressToMean(sport: string): void {
    const { regress } = config(sport);
    for (const [teamId, rating] of this.ratings) {
      this.setRating(teamId, rating * (1 - regress) + 1500 * regress);
    }
  }

  // ── PredictionModel implementation ──────────────────────────────────────────

  async predict(features: GameFeatureVector): Promise<ModelPrediction> {
    const sport  = features.home.sport;
    const cfg    = config(sport);

    const homeElo = features.home.eloRating;
    const awayElo = features.away.eloRating;

    // ELO win probability with home advantage
    const adjustedHomeElo = homeElo + cfg.homeAdvElo;
    const rawHomeWinProb  = this.expectedScore(adjustedHomeElo, awayElo);

    // Apply contextual modifiers (small adjustments within ±8 pp)
    const restMod    = clamp((features.home.restFatigue - features.away.restFatigue) * 0.04, -0.04, 0.04);
    const travelMod  = clamp(-features.away.travelFatigue * 0.05, -0.05, 0);
    const injuryMod  = clamp((features.home.injuryImpact - features.away.injuryImpact) * 0.06, -0.06, 0.06);
    const weatherMod = clamp((1 - features.environment.weatherScore) * -0.03, -0.03, 0); // bad weather hurts home less (familiarity)

    const adjustedProb = clamp(rawHomeWinProb + restMod + travelMod + injuryMod + weatherMod, 0.05, 0.95);

    // Feature contributions for explainability
    const eloDiff    = homeElo - awayElo;
    const baseProb   = eloDiffToProb(eloDiff);
    const homeAdvProb = eloDiffToProb(eloDiff + cfg.homeAdvElo) - baseProb;

    const contributions: FeatureContribution[] = [
      {
        featureName: 'elo_diff',
        featureLabel: `ELO advantage (${homeElo > awayElo ? '+' : ''}${Math.round(eloDiff)} pts)`,
        featureValue: eloDiff,
        weight: 1 / 400,
        contribution: eloDiff / 400,
        probabilityDelta: baseProb - 0.5,
        direction: eloDiff > 0 ? 'positive' : 'negative',
        percentageOfTotal: 0, // filled in below
      },
      {
        featureName: 'home_advantage',
        featureLabel: `Home field advantage (+${cfg.homeAdvElo} ELO)`,
        featureValue: cfg.homeAdvElo,
        weight: 1 / 400,
        contribution: cfg.homeAdvElo / 400,
        probabilityDelta: homeAdvProb,
        direction: 'positive',
        percentageOfTotal: 0,
      },
      {
        featureName: 'rest_advantage',
        featureLabel: 'Rest & fatigue differential',
        featureValue: features.home.restDays - features.away.restDays,
        weight: 0.04,
        contribution: restMod,
        probabilityDelta: restMod,
        direction: restMod > 0 ? 'positive' : 'negative',
        percentageOfTotal: 0,
      },
      {
        featureName: 'travel_fatigue',
        featureLabel: 'Away team travel fatigue',
        featureValue: features.away.travelDistanceKm,
        weight: 0.05,
        contribution: travelMod,
        probabilityDelta: travelMod,
        direction: 'positive',
        percentageOfTotal: 0,
      },
      {
        featureName: 'injury_differential',
        featureLabel: 'Injury report differential',
        featureValue: features.home.injuryImpact - features.away.injuryImpact,
        weight: 0.06,
        contribution: injuryMod,
        probabilityDelta: injuryMod,
        direction: injuryMod > 0 ? 'positive' : 'negative',
        percentageOfTotal: 0,
      },
    ];

    // Compute percentage of total
    const totalAbs = contributions.reduce((s, c) => s + Math.abs(c.contribution), 0);
    for (const c of contributions) {
      c.percentageOfTotal = totalAbs > 0 ? (Math.abs(c.contribution) / totalAbs) * 100 : 0;
    }

    // Soccer draw probability (simplified: ~1/3 of away-win probability for close games)
    const drawProb = sport === 'Soccer'
      ? clamp((1 - Math.abs(adjustedProb - 0.5) * 2) * 0.3, 0, 0.35)
      : 0;

    const homeWinProb = drawProb > 0
      ? clamp(adjustedProb - drawProb / 2, 0.05, 0.90)
      : adjustedProb;
    const awayWinProb = clamp(1 - homeWinProb - drawProb, 0.05, 0.90);

    // Confidence: higher when ELO difference is large
    const confidence = clamp(Math.abs(adjustedProb - 0.5) * 2 * 0.85, 0.3, 0.95);

    return {
      homeWinProbability: homeWinProb,
      awayWinProbability: awayWinProb,
      drawProbability: drawProb,
      rawHomeWinProbability: rawHomeWinProb,
      confidence,
      featureContributions: contributions,
      modelName: this.name,
      modelVersion: this.version,
      computedAt: new Date().toISOString(),
    };
  }
}

export const eloModel = new EloModel();
