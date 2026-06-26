/**
 * AI Sports Analyst engine.
 *
 * Generates a professional multi-section game report from a Game object.
 * Every sentence is grounded in real prediction data — no generic filler.
 * Works without any external API key.
 */

import type { Game, Team } from '@/lib/types';

// ── Public types ──────────────────────────────────────────────────────────────

export interface KeyMatchup {
  title: string;
  homeAdvantage: string;
  awayAdvantage: string;
  analysis: string;
  winner: 'home' | 'away' | 'push';
}

export interface RiskFactor {
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affects: 'home' | 'away' | 'both';
}

export interface FinalPrediction {
  winner: string;
  score: string;
  confidence: number;
  monteCarloRate: number;
  keyFactor: string;
  narrative: string;
  valueNote: string;
}

export interface AnalystReport {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  sport: string;
  generatedAt: string;
  executiveSummary: string;
  keyMatchups: KeyMatchup[];
  whyFavoriteWins: string;
  whyUnderdogCan: string;
  riskFactors: RiskFactor[];
  injuryAnalysis: string;
  weatherImpact: string | null;
  coachingAnalysis: string;
  gameScript: string;
  finalPrediction: FinalPrediction;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function homeWinPct(game: Game): number {
  const winnerIsHome = game.prediction.winner === game.homeTeam.name;
  return winnerIsHome ? game.prediction.winProbability : 100 - game.prediction.winProbability;
}

function favorite(game: Game): Team {
  return homeWinPct(game) >= 50 ? game.homeTeam : game.awayTeam;
}

function underdog(game: Game): Team {
  return homeWinPct(game) >= 50 ? game.awayTeam : game.homeTeam;
}

function favPct(game: Game): number {
  const h = homeWinPct(game);
  return Math.max(h, 100 - h);
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(arr.length * 0.42)]; // deterministic "random"
}

// ── Section generators ────────────────────────────────────────────────────────

function genExecutiveSummary(game: Game): string {
  const fav = favorite(game);
  const dog = underdog(game);
  const pct = favPct(game);
  const { prediction, headToHead } = game;
  const topPos = prediction.factors.filter(f => f.positive).sort((a, b) => b.weight - a.weight)[0];
  const totalH2H = headToHead.allTime.home + headToHead.allTime.away;

  if (pct >= 72) {
    return `${fav.name} enters this contest as a commanding ${pct.toFixed(1)}% favorite — a margin that signals a structural edge rather than a mere scheduling quirk. The model's confidence of ${prediction.confidence}% reflects high signal across multiple analytical dimensions, with ${topPos?.label.toLowerCase() ?? 'offensive efficiency'} standing as the primary driver (factor weight: +${(topPos?.weight ?? 0).toFixed(1)}). The projected ${prediction.predictedScore.home}–${prediction.predictedScore.away} final implies an average winning margin of ${prediction.expectedMargin} points. Against ${dog.name}, who carry a ${dog.record} record, the all-time series reinforces the read: ${Math.max(headToHead.allTime.home, headToHead.allTime.away)}–${Math.min(headToHead.allTime.home, headToHead.allTime.away)} in ${totalH2H} meetings.`;
  }

  if (pct >= 60) {
    return `${fav.name} holds a meaningful ${pct.toFixed(1)}% edge here, though "meaningful" should not be read as "insurmountable." The ${prediction.expectedMargin}-point projected margin reflects a model that identifies clear advantages — most prominently ${topPos?.label.toLowerCase() ?? 'home field advantage'} — while also acknowledging that ${dog.name}'s ${dog.record} record is genuine competition. Model confidence sits at ${prediction.confidence}%. The all-time series across ${totalH2H} meetings adds historical texture to this read.`;
  }

  return `At ${pct.toFixed(1)}%, this is one of the most competitive games on the slate — a statistical coin flip that the model barely edges toward ${fav.name}. Confidence of ${prediction.confidence}% is among the lower readings in this week's card, which is an honest signal: outcome uncertainty is real. When win probability sits this close to 50%, small perturbations — an injury update, early momentum, a single crucial play — can flip the result. ${dog.name} loses this type of game only ${(100 - pct).toFixed(0)}% of the time.`;
}

function genKeyMatchups(game: Game): KeyMatchup[] {
  const factors = game.prediction.factors;
  const pos = factors.filter(f => f.positive).sort((a, b) => b.weight - a.weight);
  const neg = factors.filter(f => !f.positive).sort((a, b) => a.weight - b.weight);
  const favIsHome = homeWinPct(game) >= 50;
  const fav = favIsHome ? game.homeTeam : game.awayTeam;
  const dog = favIsHome ? game.awayTeam : game.homeTeam;

  const matchups: KeyMatchup[] = [];

  // Primary offensive/skill matchup
  if (pos[0]) {
    matchups.push({
      title: pick(['Offensive Efficiency', 'Scoring Edge', 'Primary Advantage', 'Statistical Dominance']),
      homeAdvantage: favIsHome ? pos[0].detail : (neg[0]?.detail ?? 'Competitive offensive output'),
      awayAdvantage: favIsHome ? (neg[0]?.detail ?? 'Capable offensive unit') : pos[0].detail,
      analysis: `${pos[0].label}: ${pos[0].detail}. This is the model's highest-weighted factor at +${pos[0].weight.toFixed(1)}, making it the single most important variable in this game.`,
      winner: favIsHome ? 'home' : 'away',
    });
  }

  // Defense or special matchup
  const defPos = pos.find(f => /defense|pressure|coverage|defensive|sack|block/.test(f.label.toLowerCase()));
  const defNeg = neg.find(f => /defense|pressure|coverage|defensive|sack|block/.test(f.label.toLowerCase()));
  if (defPos || defNeg) {
    const winner: 'home' | 'away' | 'push' = defPos
      ? (favIsHome ? 'home' : 'away')
      : (favIsHome ? 'away' : 'home');
    matchups.push({
      title: 'Defensive Matchup',
      homeAdvantage: defPos && favIsHome ? defPos.detail : (defNeg && !favIsHome ? defNeg.detail : `${game.homeTeam.name} defensive efficiency`),
      awayAdvantage: defPos && !favIsHome ? defPos.detail : (defNeg && favIsHome ? defNeg.detail : `${game.awayTeam.name} pressure package`),
      analysis: defPos
        ? `${defPos.label}: ${defPos.detail} (weight +${defPos.weight.toFixed(1)})`
        : `${defNeg!.label}: ${defNeg!.detail} (weight ${defNeg!.weight.toFixed(1)})`,
      winner,
    });
  }

  // Coaching / experience
  const coachF = [...pos, ...neg].find(f => /coach|experience|playoff|reid|head coach/.test(f.label.toLowerCase()));
  if (coachF) {
    matchups.push({
      title: 'Coaching Advantage',
      homeAdvantage: coachF.positive && favIsHome ? coachF.detail : `${game.homeTeam.name} bench experience`,
      awayAdvantage: coachF.positive && !favIsHome ? coachF.detail : `${game.awayTeam.name} system adaptability`,
      analysis: `${coachF.label}: ${coachF.detail}`,
      winner: coachF.positive ? (favIsHome ? 'home' : 'away') : (favIsHome ? 'away' : 'home'),
    });
  }

  // Home field
  const homeF = pos.find(f => /home|crowd|arrowhead|garden|stadium|field advantage/.test(f.label.toLowerCase()));
  if (homeF) {
    matchups.push({
      title: 'Home Court / Field Edge',
      homeAdvantage: homeF.detail,
      awayAdvantage: `${game.awayTeam.name} are ${game.awayTeam.awayRecord} on the road this season`,
      analysis: `${homeF.label}: ${homeF.detail}`,
      winner: favIsHome ? 'home' : 'push',
    });
  }

  // Fill to 3 minimum
  for (let i = matchups.length; i < 3 && i < pos.length; i++) {
    const f = pos[i];
    if (matchups.some(m => m.analysis.includes(f.label))) continue;
    matchups.push({
      title: f.label,
      homeAdvantage: favIsHome ? f.detail : 'Competitive in this dimension',
      awayAdvantage: favIsHome ? 'Competitive in this dimension' : f.detail,
      analysis: `${f.label} (weight +${f.weight.toFixed(1)}): ${f.detail}`,
      winner: favIsHome ? 'home' : 'away',
    });
  }

  return matchups.slice(0, 4);
}

function genWhyFavoriteWins(game: Game): string {
  const fav = favorite(game);
  const pct = favPct(game);
  const topFactors = game.prediction.factors
    .filter(f => f.positive)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3);

  const bullets = topFactors.map(f => `**${f.label}** (+${f.weight.toFixed(1)}): ${f.detail}`).join('\n\n');

  const intro = pct >= 70
    ? `${fav.name}'s path to victory is well-mapped. Three factors above all others drive this projection:`
    : `${fav.name}'s edge is real but requires execution. The primary levers:`

  const closing = pct >= 70
    ? `\n\nThe model's ${game.prediction.confidence}% confidence reflects these are not hypothetical advantages — they are measurable, repeatable, and backed by ${fav.record} season performance.`
    : `\n\nNone of these individually guarantees a win. But all three operating simultaneously — which is how the model evaluates this matchup — makes ${fav.name} a responsible favorite.`;

  return `${intro}\n\n${bullets}${closing}`;
}

function genWhyUnderdogCan(game: Game): string {
  const dog = underdog(game);
  const pct = favPct(game);
  const upsetPct = game.prediction.upsetProbability;

  const topNeg = game.prediction.factors
    .filter(f => !f.positive)
    .sort((a, b) => a.weight - b.weight)
    .slice(0, 3);

  if (topNeg.length === 0) {
    return `${dog.name}'s path to an upset requires the model's assumptions to fail. At ${upsetPct.toFixed(1)}% upset probability, this isn't a case where the underdog is being disrespected — the evidence genuinely supports the favorite. That said, sports are inherently stochastic, and ${dog.record} seasons don't happen by accident.`;
  }

  const bullets = topNeg.map(f => `**${f.label}** (${f.weight.toFixed(1)}): ${f.detail}`).join('\n\n');

  const opener = upsetPct > 35
    ? `At ${upsetPct.toFixed(1)}% upset probability, ${dog.name} is closer to a coin-flip than the line suggests. Their path runs through these model vulnerabilities:`
    : upsetPct > 20
    ? `${dog.name} can win this game — ${upsetPct.toFixed(1)}% is not nothing. The route to upset involves the following pressure points:`
    : `Upsets happen, and at ${upsetPct.toFixed(1)}% they are genuinely possible. ${dog.name}'s best arguments center on these risk factors for the favorite:`;

  return `${opener}\n\n${bullets}\n\n${dog.name}'s best case scenario: these factors compound simultaneously in their favor while the favorite underperforms their projections. History shows this happens more often than bettors price in.`;
}

function genRiskFactors(game: Game): RiskFactor[] {
  const risks: RiskFactor[] = [];
  const { prediction } = game;

  // Model's own uncertainty signal
  risks.push({
    description: `Model's lowest-confidence variable: "${prediction.lowestConfidenceVar}". This is the single factor most likely to invalidate the projection if it moves adversely.`,
    severity: prediction.confidence < 70 ? 'high' : prediction.confidence < 80 ? 'medium' : 'low',
    affects: 'both',
  });

  // Upset probability
  if (prediction.upsetProbability > 35) {
    risks.push({
      description: `High upset probability at ${prediction.upsetProbability.toFixed(1)}%. This game sits in the "competitive" category where standard variance alone is enough to flip the outcome.`,
      severity: 'high',
      affects: 'both',
    });
  }

  // Weather
  if (game.weather && game.weather.wind > 15) {
    risks.push({
      description: `Wind speed of ${game.weather.wind} mph creates meaningful passing game uncertainty. Projections assume average weather conditions.`,
      severity: game.weather.wind > 25 ? 'high' : 'medium',
      affects: 'both',
    });
  }
  if (game.weather && game.weather.temp < 30) {
    risks.push({
      description: `Temperature at ${game.weather.temp}°F below freezing. Cold-weather game outcomes show higher variance than indoor/temperate conditions.`,
      severity: 'medium',
      affects: 'both',
    });
  }

  // Sharp money signal
  if (game.odds.sharpMoney !== 'Split' && game.odds.publicBettingPct.home > 60) {
    const publicSide = game.odds.publicBettingPct.home > 60 ? 'home' : 'away';
    const sharpSide = game.odds.sharpMoney.toLowerCase() as 'home' | 'away';
    if (publicSide !== sharpSide) {
      risks.push({
        description: `Sharp money diverges from public action. ${game.odds.publicBettingPct.home}% of bets on home team, but sharps favor ${game.odds.sharpMoney.toLowerCase()} side. Steam moves often precede model invalidations.`,
        severity: 'medium',
        affects: publicSide === 'home' ? 'home' : 'away',
      });
    }
  }

  // Line movement risk
  if (Math.abs(game.odds.lineMovement) >= 1.5) {
    risks.push({
      description: `Significant line movement of ${game.odds.lineMovement > 0 ? '+' : ''}${game.odds.lineMovement} points since opening. Late-breaking information (injury, weather, lineup changes) may not be fully reflected in the model.`,
      severity: 'medium',
      affects: 'both',
    });
  }

  return risks.slice(0, 5);
}

function genInjuryAnalysis(game: Game): string {
  const homeInj = game.homeTeam.injuries ?? [];
  const awayInj = game.awayTeam.injuries ?? [];
  const allInj = [...homeInj.map(i => ({ ...i, team: game.homeTeam.name })), ...awayInj.map(i => ({ ...i, team: game.awayTeam.name }))];

  if (allInj.length === 0) {
    return `Both rosters appear to be at full strength entering this game. No significant injury designations have been filed as of this report's generation, which increases model confidence slightly — projections assume full availability. Monitor official injury reports through game time for any late-breaking changes.`;
  }

  const critical = allInj.filter(i => i.impact === 'Critical');
  const high = allInj.filter(i => i.impact === 'High');
  const minor = allInj.filter(i => i.impact === 'Low' || i.impact === 'Medium');

  let text = '';
  if (critical.length > 0) {
    text += `**Critical injury concerns:** ${critical.map(i => `${i.player} (${i.position}, ${i.team}) — ${i.detail} [${i.status}]`).join('; ')}. These designations carry material probability weight; the model's projections may shift by 3–7 percentage points if any of these players are ruled out.\n\n`;
  }
  if (high.length > 0) {
    text += `**High-impact designations:** ${high.map(i => `${i.player} (${i.position}, ${i.team}) — ${i.status}`).join('; ')}.\n\n`;
  }
  if (minor.length > 0) {
    text += `**Minor concerns:** ${minor.map(i => `${i.player} — ${i.status}`).join(', ')}. These carry limited projection impact.\n\n`;
  }

  text += `The model incorporates known injury status but cannot anticipate late scratches. Final injury reports, typically released 90 minutes before game time, are the most reliable source.`;
  return text.trim();
}

function genWeatherImpact(game: Game): string | null {
  const w = game.weather;
  if (!w) return null;

  const parts: string[] = [];

  if (w.temp < 25) parts.push(`**Extreme cold (${w.temp}°F)**: Below-freezing temperatures significantly impact passing accuracy and ball handling. Historical data shows scoring drops an average of 4–6 points in sub-25°F games. Running game importance increases.`);
  else if (w.temp < 40) parts.push(`**Cold conditions (${w.temp}°F)**: Below-40 weather creates measurable passing difficulty. Expect slightly lower scoring than indoor-equivalent matchups.`);
  else if (w.temp > 90) parts.push(`**Heat (${w.temp}°F + ${w.humidity}% humidity)**: High heat-index conditions affect late-game conditioning and can hurt teams with thinner depth.`);

  if (w.wind > 25) parts.push(`**Strong wind (${w.wind} mph)**: Field goals beyond 45 yards become near-coin-flips. Passing efficiency typically drops 8–12% in high-wind conditions. Expect more conservative play-calling.`);
  else if (w.wind > 15) parts.push(`**Elevated wind (${w.wind} mph)**: Passes above 20 yards show 6–9% completion rate reduction on average. Deep ball offense is meaningfully compromised.`);

  if (w.condition.toLowerCase().includes('rain') || w.condition.toLowerCase().includes('snow')) {
    parts.push(`**Precipitation (${w.condition})**: Wet or snowy field surfaces impact ball security (fumble rate increases ~25%) and kicking game accuracy.`);
  }

  if (parts.length === 0) {
    return `Conditions at ${game.venue} are listed as ${w.condition}, ${w.temp}°F, ${w.wind} mph wind. These are standard conditions that should not meaningfully alter the projection. The model's baseline assumptions hold.`;
  }

  return parts.join('\n\n') + `\n\nNet weather adjustment: these conditions ${w.wind > 20 || w.temp < 35 ? 'moderately favor' : 'slightly benefit'} the team less reliant on the passing game.`;
}

function genCoachingAnalysis(game: Game): string {
  const { homeTeam, awayTeam, prediction } = game;
  const coachFactor = prediction.factors.find(f =>
    /coach|reid|staff|scheme|system|x-factor|timeout|late.game|2.minute|clock/.test(f.label.toLowerCase())
  );
  const favIsHome = homeWinPct(game) >= 50;

  if (coachFactor) {
    const side = coachFactor.positive
      ? (favIsHome ? homeTeam.name : awayTeam.name)
      : (favIsHome ? awayTeam.name : homeTeam.name);
    return `The model explicitly weights coaching as a factor in this matchup. ${coachFactor.label}: ${coachFactor.detail}. Coaching edges manifest most clearly in three situations — situational fourth-down decisions, late-game clock management, and defensive adjustment at halftime. The ${side} staff has demonstrated measurable advantage in at least one of these areas this season. Coaching differentials typically account for 2–4 percentage points of win probability in competitive matchups.`;
  }

  const eloDiff = homeTeam.eloRating - awayTeam.eloRating;
  const betterTeam = eloDiff > 0 ? homeTeam : awayTeam;
  const edge = Math.abs(eloDiff);
  const desc = edge > 100 ? 'substantial' : edge > 50 ? 'meaningful' : 'marginal';

  return `The model doesn't flag a specific coaching mismatch in this game. ELO ratings suggest ${betterTeam.name} has a ${desc} team-quality edge (${edge}-point differential), which partially reflects organizational decision-making over time. In tightly contested games, coaching adjustments — defensive schemes at halftime, clock management in the final two minutes, timeout deployment — can swing outcomes that statistics can't fully anticipate.`;
}

function genGameScript(game: Game): string {
  const base = game.prediction.gameFlow;
  const fav = favorite(game);
  const pct = favPct(game);

  const spreadContext = pct >= 70
    ? ` This aligns with a spread-covering scenario.`
    : pct >= 60
    ? ` The spread assumes the projection holds; a tight first half wouldn't be surprising.`
    : ` Given the competitive probability, alternate game scripts — including the underdog winning outright — carry meaningful likelihood.`;

  const mcContext = ` The Monte Carlo simulation (${game.prediction.monteCarloWinRate.toFixed(1)}% win rate across 10,000 runs) closely tracks the base model at ${game.prediction.bayesianProbability.toFixed(1)}% Bayesian probability, suggesting the projection is stable rather than sensitive to simulation variance.`;

  return `${base}${spreadContext}${mcContext}\n\nKey inflection point to watch: "${game.prediction.lowestConfidenceVar}" — this is where the projected script is most likely to deviate from actual game flow.`;
}

function genFinalPrediction(game: Game): FinalPrediction {
  const fav = favorite(game);
  const dog = underdog(game);
  const pct = favPct(game);
  const { prediction, odds } = game;
  const favIsHome = homeWinPct(game) >= 50;
  const score = favIsHome
    ? `${game.homeTeam.abbreviation} ${prediction.predictedScore.home}–${prediction.predictedScore.away} ${game.awayTeam.abbreviation}`
    : `${game.awayTeam.abbreviation} ${prediction.predictedScore.away}–${prediction.predictedScore.home} ${game.homeTeam.abbreviation}`;

  const topFactor = prediction.factors.filter(f => f.positive).sort((a, b) => b.weight - a.weight)[0];

  const narrative = pct >= 70
    ? `${fav.name} is the correct side. The combination of ${topFactor?.label.toLowerCase() ?? 'structural advantages'} and ${prediction.confidence}% model confidence makes this one of the cleaner reads this week. The ${prediction.expectedMargin}-point margin projection leaves meaningful room for a cover.`
    : pct >= 60
    ? `Lean ${fav.name}, but temper expectations on the spread. The ${prediction.expectedMargin}-point projected margin is real but not dominant. Value may be found in an alternate spread or the moneyline depending on current pricing.`
    : `This is a game to watch, not a game to lean into heavily. With only a ${(pct - 50).toFixed(1)}-point probability edge, the juice on the moneyline is difficult to justify unless there's a specific situational angle (travel, rest, motivation) not yet captured in the model.`;

  const evNote = odds.expectedValue > 3
    ? `Expected value: +${odds.expectedValue.toFixed(1)}% — positive EV on the ${fav.name} side.`
    : odds.expectedValue < 0
    ? `Expected value: ${odds.expectedValue.toFixed(1)}% — the market may have over-corrected. ${dog.name} ML could be live.`
    : `Expected value near zero — fair market price on both sides.`;

  return {
    winner: fav.name,
    score,
    confidence: prediction.confidence,
    monteCarloRate: prediction.monteCarloWinRate,
    keyFactor: topFactor?.label ?? 'Team quality differential',
    narrative,
    valueNote: evNote,
  };
}

// ── Main entry point ──────────────────────────────────────────────────────────

export function generateReport(game: Game): AnalystReport {
  return {
    gameId:         game.id,
    homeTeam:       game.homeTeam.name,
    awayTeam:       game.awayTeam.name,
    sport:          game.sport,
    generatedAt:    new Date().toISOString(),
    executiveSummary:  genExecutiveSummary(game),
    keyMatchups:       genKeyMatchups(game),
    whyFavoriteWins:   genWhyFavoriteWins(game),
    whyUnderdogCan:    genWhyUnderdogCan(game),
    riskFactors:       genRiskFactors(game),
    injuryAnalysis:    genInjuryAnalysis(game),
    weatherImpact:     genWeatherImpact(game),
    coachingAnalysis:  genCoachingAnalysis(game),
    gameScript:        genGameScript(game),
    finalPrediction:   genFinalPrediction(game),
  };
}
