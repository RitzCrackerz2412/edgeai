// ── Normalization utilities ───────────────────────────────────────────────────
//
// All models expect features in [0, 1] or [-1, +1] ranges. These helpers
// convert raw domain values to normalized feature scalars.

/** Clamp x to [min, max] */
export function clamp(x: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, x));
}

/** Linear min-max normalization → [0, 1] */
export function minMax(x: number, min: number, max: number): number {
  if (max === min) return 0.5;
  return clamp((x - min) / (max - min), 0, 1);
}

/** Z-score normalization, then clamp to [-3, 3] and rescale to [0, 1] */
export function zScore(x: number, mean: number, std: number): number {
  if (std === 0) return 0.5;
  const z = clamp((x - mean) / std, -3, 3);
  return (z + 3) / 6; // map [-3,3] → [0,1]
}

/** Convert a W/L sequence to a momentum score in [0, 1].
 *  Recent wins are weighted more strongly (geometric decay). */
export function momentumFromSequence(results: ('W' | 'L' | 'D')[], decayRate = 0.8): number {
  if (results.length === 0) return 0.5;
  let score = 0;
  let totalWeight = 0;
  for (let i = 0; i < results.length; i++) {
    // Most-recent result is index 0; draws count as 0.5
    const weight = Math.pow(decayRate, i);
    score += (results[i] === 'W' ? 1 : results[i] === 'D' ? 0.5 : 0) * weight;
    totalWeight += weight;
  }
  return score / totalWeight;
}

/** Signed streak: +5 for W5, -3 for L3, in [-1, +1] when divided by maxStreak */
export function streakValue(results: ('W' | 'L' | 'D')[], maxStreak = 10): number {
  if (results.length === 0) return 0;
  let streak = 0;
  const first = results[0];
  const dir = first === 'W' ? 1 : first === 'D' ? 0 : -1;
  for (const r of results) {
    if (r === first) streak++;
    else break;
  }
  return clamp((dir * streak) / maxStreak, -1, 1);
}

/** Win-rate from a record string like "11-4" or "38-21-5" */
export function winRateFromRecord(record: string): number {
  const parts = record.split('-').map(Number);
  const wins = parts[0] ?? 0;
  const losses = parts[1] ?? 0;
  const draws = parts[2] ?? 0;
  const total = wins + losses + draws;
  if (total === 0) return 0.5;
  return (wins + 0.5 * draws) / total;
}

/** Rest fatigue: convert days-since-last-game to a fatigue score [0, 1].
 *  1 = fully rested (≥7 days), decays linearly to 0 at 0 rest days. */
export function restFatigueScore(restDays: number): number {
  return clamp(restDays / 7, 0, 1);
}

/** Travel fatigue: convert km traveled to a fatigue penalty [0, 1].
 *  Calibrated so 4 000 km ≈ 0.5 fatigue. */
export function travelFatigueScore(km: number): number {
  // Logistic curve: f(km) = 1 / (1 + exp(-(km - 2000) / 1000))
  // but rescaled so f(0) ≈ 0 and f(8000) ≈ 1
  if (km <= 0) return 0;
  return clamp(1 - Math.exp(-km / 3000), 0, 1);
}

/** Weather score: 1 = ideal, lower = worse conditions.
 *  Factors in temperature, wind, and precipitation.
 *  For indoor venues, always returns 1. */
export function weatherScore(
  tempF: number,
  windMph: number,
  precipMm: number,
  isIndoor: boolean,
): number {
  if (isIndoor) return 1;

  // Temperature component: ideal 60-75°F, drops off outside that range
  const tempScore = tempF >= 40 && tempF <= 90
    ? 1 - Math.abs(tempF - 67.5) / 60
    : 0.3;

  // Wind component: 0 mph ideal, 30+ mph severe
  const windScore = clamp(1 - windMph / 40, 0, 1);

  // Precipitation component: 0 mm ideal, 10+ mm severe
  const precipScore = clamp(1 - precipMm / 15, 0, 1);

  return clamp((tempScore + windScore + precipScore) / 3, 0, 1);
}

/** Altitude fatigue for away teams traveling to high altitude.
 *  Calibrated so Mile High (5280 ft) ≈ 0.08 penalty. */
export function altitudePenalty(altitudeDeltaFeet: number): number {
  if (altitudeDeltaFeet <= 0) return 0;
  return clamp(altitudeDeltaFeet / 60_000, 0, 0.25);
}

/** Injury impact: aggregate player availability into a team health score [0, 1].
 *  impactWeights maps position/role importance; default weights assume equal. */
export function injuryImpactScore(
  players: Array<{ availability: number; teamImpact: number }>,
): number {
  if (players.length === 0) return 1;
  const totalImpact = players.reduce((s, p) => s + p.teamImpact, 0);
  if (totalImpact === 0) return 1;
  const weightedAvail = players.reduce((s, p) => s + p.availability * p.teamImpact, 0);
  return clamp(weightedAvail / totalImpact, 0, 1);
}

/** Convert American moneyline odds to implied probability */
export function americanToImplied(odds: number): number {
  if (odds > 0) return 100 / (odds + 100);
  return -odds / (-odds + 100);
}

/** Remove vig from two-sided market and return fair probabilities */
export function devig(homeOdds: number, awayOdds: number): { home: number; away: number } {
  const rawHome = americanToImplied(homeOdds);
  const rawAway = americanToImplied(awayOdds);
  const total = rawHome + rawAway;
  return { home: rawHome / total, away: rawAway / total };
}

/** Normalize an ELO difference to the logistic probability scale */
export function eloDiffToProb(eloDiff: number): number {
  return 1 / (1 + Math.pow(10, -eloDiff / 400));
}
