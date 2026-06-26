import { describe, it, expect, beforeEach } from 'vitest';
import { EloModel } from '../elo';

describe('EloModel', () => {
  let model: EloModel;

  beforeEach(() => {
    model = new EloModel();
  });

  it('returns 0.5 for equal ratings', () => {
    const p = model.expectedScore(1500, 1500);
    expect(p).toBeCloseTo(0.5, 5);
  });

  it('returns > 0.5 for higher-rated team', () => {
    const p = model.expectedScore(1600, 1400);
    expect(p).toBeGreaterThan(0.5);
  });

  it('returns < 0.5 for lower-rated team', () => {
    const p = model.expectedScore(1400, 1600);
    expect(p).toBeLessThan(0.5);
  });

  it('expected scores are symmetric', () => {
    const pAB = model.expectedScore(1600, 1400);
    const pBA = model.expectedScore(1400, 1600);
    expect(pAB + pBA).toBeCloseTo(1.0, 5);
  });

  it('updates ratings after a result (winner gains, loser loses)', () => {
    // Use two different team IDs
    model['ratings'].set('alpha', 1500);
    model['ratings'].set('beta', 1500);
    model.updateFromResult('alpha', 'beta', 28, 14, 'NFL');
    const rAlpha = model['ratings'].get('alpha') ?? 1500;
    const rBeta = model['ratings'].get('beta') ?? 1500;
    expect(rAlpha).toBeGreaterThan(1500);
    expect(rBeta).toBeLessThan(1500);
  });

  it('total ELO is conserved after an update', () => {
    model['ratings'].set('home', 1500);
    model['ratings'].set('away', 1500);
    const before = (model['ratings'].get('home') ?? 0) + (model['ratings'].get('away') ?? 0);
    model.updateFromResult('home', 'away', 100, 95, 'NBA');
    const after = (model['ratings'].get('home') ?? 0) + (model['ratings'].get('away') ?? 0);
    expect(after).toBeCloseTo(before, 2);
  });

  it('regressToMean moves ratings closer to 1500', () => {
    model['ratings'].set('elite', 1700);
    model['ratings'].set('bad', 1300);
    model.regressToMean('NFL');
    const elite = model['ratings'].get('elite') ?? 0;
    const bad = model['ratings'].get('bad') ?? 0;
    expect(elite).toBeLessThan(1700);
    expect(bad).toBeGreaterThan(1300);
  });

  it('predict returns a ModelPrediction with correct shape', async () => {
    // Build a minimal feature vector
    const features = {
      home: {
        eloRating: 1600,
        winRate: 0.6,
        offensiveRating: 0.6,
        defensiveRating: 0.6,
        recentForm: 0.7,
        streakValue: 0.5,
        momentumScore: 0.6,
        restDays: 5,
        restFatigue: 0.9,
        travelDistanceKm: 0,
        travelFatigue: 0,
        injuryImpact: 0,
        h2hWinRate: 0.5,
        venueWinRate: 0.55,
        isHome: true,
      },
      away: {
        eloRating: 1500,
        winRate: 0.5,
        offensiveRating: 0.5,
        defensiveRating: 0.5,
        recentForm: 0.5,
        streakValue: 0.5,
        momentumScore: 0.5,
        restDays: 4,
        restFatigue: 0.85,
        travelDistanceKm: 800,
        travelFatigue: 0.2,
        injuryImpact: 0.1,
        h2hWinRate: 0.5,
        venueWinRate: 0.4,
        isHome: false,
      },
      game: {
        sport: 'NFL' as const,
        isNeutralVenue: false,
      },
      environment: {
        tempF: 65,
        windMph: 5,
        precipMm: 0,
        isIndoor: false,
        altitudeFt: 0,
        timezoneOffset: 0,
        weatherScore: 1,
        altitudePenalty: 0,
      },
      derived: {
        eloDiff: 100,
        formDiff: 0.2,
        restDiff: 1,
        injuryAdvantage: -0.1,
        travelPenalty: 0.2,
        sosDiff: 0,
        momentumDiff: 0.1,
        oddsImpliedHomeProb: undefined,
        marketLineGap: undefined,
      },
    };
    const pred = await model.predict(features as never);
    expect(pred.homeWinProbability).toBeGreaterThan(0);
    expect(pred.homeWinProbability).toBeLessThan(1);
    expect(pred.homeWinProbability + pred.awayWinProbability + pred.drawProbability).toBeCloseTo(1, 2);
    expect(pred.modelName).toBe('ELO');
  });
});
