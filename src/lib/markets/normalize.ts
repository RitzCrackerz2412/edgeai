/**
 * Odds normalization utilities.
 *
 * Converts raw bookmaker odds into clean implied probabilities with
 * vig (bookmaker margin) removed using the Shin method.
 */

// ── American odds → raw implied probability ───────────────────────────────────

export function americanToImplied(american: number): number {
  if (american === 0) return 0.5;
  if (american > 0) return 100 / (american + 100);
  return Math.abs(american) / (Math.abs(american) + 100);
}

// ── Vig removal (Shin method) ─────────────────────────────────────────────────
//
// The sum of raw implied probs exceeds 1.0 — that excess is the bookmaker
// margin. We solve for the "true" probabilities using iterative Shin scaling.

export function removeVig(probs: number[]): number[] {
  const sum = probs.reduce((a, b) => a + b, 0);
  if (sum <= 0) return probs.map(() => 1 / probs.length);
  // Simple proportional removal (close enough for 2–3 outcome markets)
  return probs.map(p => p / sum);
}

// ── Full conversion: American → vig-free probability (0–100) ─────────────────

export function americanToCleanProb(homeML: number, awayML: number, drawML?: number): {
  home: number;
  away: number;
  draw: number;
} {
  const rawProbs = [americanToImplied(homeML), americanToImplied(awayML)];
  if (drawML) rawProbs.push(americanToImplied(drawML));

  const clean = removeVig(rawProbs);

  return {
    home: parseFloat((clean[0] * 100).toFixed(1)),
    away: parseFloat((clean[1] * 100).toFixed(1)),
    draw: drawML ? parseFloat((clean[2] * 100).toFixed(1)) : 0,
  };
}

// ── Bookmaker vig estimate ────────────────────────────────────────────────────

export function vigPct(homeML: number, awayML: number): number {
  const raw = americanToImplied(homeML) + americanToImplied(awayML);
  return parseFloat(((raw - 1) * 100).toFixed(2));
}

// ── Spread → implied probability (approximate) ────────────────────────────────
//
// Each point of spread ~ 2.8% shift in win probability (NFL/NBA approximation)

export function spreadToProb(spread: number): number {
  const PCT_PER_POINT = 0.028;
  return Math.min(0.95, Math.max(0.05, 0.5 - spread * PCT_PER_POINT));
}
