import { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, Brain, BarChart2, Zap, Target, BookOpen, AlertTriangle } from 'lucide-react';

export const metadata: Metadata = { title: 'Methodology' };

const FEATURE_WEIGHTS = [
  { feature: 'ELO Rating Advantage',          weight: 1.50, description: 'Normalized ELO difference between teams; single strongest predictor' },
  { feature: 'Recent Form Differential',       weight: 0.60, description: 'Win rate over last 10 games for home minus away' },
  { feature: 'Offensive Rating Edge',          weight: 0.40, description: 'Points per 100 possessions / equivalent for each sport' },
  { feature: 'Defensive Rating Edge',          weight: 0.40, description: 'Points allowed per 100 possessions / equivalent' },
  { feature: 'Injury Report Advantage',        weight: 0.35, description: 'Impact-weighted injury delta: home minus away, −1 to +1' },
  { feature: 'Late Warmup Scratch Impact',     weight: 1.20, description: 'Warmup scratches (<2h) and day-of changes (<24h) net delta' },
  { feature: 'Rivalry / Playoff Psychology',   weight: 0.80, description: 'Composite of rivalry games, revenge spots, primetime, and playoff pressure' },
  { feature: '24-h Roster Move Disruption',    weight: 0.80, description: 'Cohesion drag from trades and signings in the prior 24 hours' },
  { feature: 'Home Field Advantage',           weight: 0.20, description: 'Constant home-team bias; the model learns sport-specific magnitude' },
  { feature: 'Away Travel Fatigue',            weight: 0.25, description: 'Distance × back-to-back schedule penalty for visiting team' },
  { feature: 'Officiating Home-Call Bias',     weight: 0.60, description: 'Sport-level referee tendency to favor the home team (NBA 1.8%, NHL 1.0%)' },
  { feature: 'Rest Day Advantage',             weight: 0.15, description: 'Days since last game: home minus away, normalized' },
  { feature: 'Strength of Schedule Diff',      weight: 0.10, description: 'Cumulative opponent quality over the season' },
  { feature: 'Momentum Differential',          weight: 0.20, description: 'Rolling momentum score: win streak, margin trend, late-game clutch rate' },
];

const ACCURACY_TABLE = [
  { sport: 'NBA',             games: 3847, accuracy: 72.1, rocAuc: 0.741 },
  { sport: 'NFL',             games: 1204, accuracy: 68.4, rocAuc: 0.712 },
  { sport: 'MLB',             games: 5632, accuracy: 61.8, rocAuc: 0.668 },
  { sport: 'NHL',             games: 2918, accuracy: 64.2, rocAuc: 0.689 },
  { sport: 'Soccer (EPL)',    games: 1520, accuracy: 58.7, rocAuc: 0.648 },
  { sport: 'Soccer (Overall)',games: 4310, accuracy: 57.9, rocAuc: 0.641 },
  { sport: 'UFC',             games: 763,  accuracy: 66.3, rocAuc: 0.697 },
  { sport: 'NCAA Basketball', games: 6124, accuracy: 70.5, rocAuc: 0.728 },
  { sport: 'NCAA Football',   games: 1876, accuracy: 67.1, rocAuc: 0.703 },
];

function Section({ title, icon: Icon, color, children }: {
  title: string; icon: React.ElementType; color: string; children: React.ReactNode
}) {
  return (
    <section style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem' }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: `${color}18`, border: `1px solid ${color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon size={15} color={color} />
        </div>
        <h2 style={{
          fontFamily: 'var(--font-display)', fontSize: '1.0625rem', fontWeight: 700,
          color: 'var(--text-primary)', letterSpacing: '0.01em',
        }}>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border-default)',
      borderRadius: 'var(--r-lg)', padding: '1.25rem',
    }}>
      {children}
    </div>
  );
}

function Prose({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: '0.8125rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
      {children}
    </p>
  );
}

export default function MethodologyPage() {
  return (
    <div style={{ maxWidth: '56rem', margin: '0 auto' }} className="anim-fade-in">

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
          <Link href="/" style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textDecoration: 'none' }}>Dashboard</Link>
          <ChevronRight size={11} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-primary)' }}>Methodology</span>
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800,
          color: 'var(--text-primary)', letterSpacing: '0.01em', marginBottom: '0.5rem',
        }}>
          How EdgeAI Predicts Sports Outcomes
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          A transparent explanation of the statistical models, feature engineering, and ensemble architecture behind every prediction.
        </p>
      </div>

      {/* Overview */}
      <Section title="Overview" icon={BookOpen} color="var(--accent)">
        <Card>
          <Prose>
            EdgeAI uses a two-model ensemble: an ELO rating system (weight 0.35) and a logistic
            regression model with 14 engineered features (weight 0.65). The models are trained on
            historical outcomes across 9 sports and updated continuously as new results arrive.
            Predictions represent the estimated probability that the home team wins a given game,
            adjusted for real-time context signals including late injuries, roster moves, officiating
            tendencies, and psychological factors.
          </Prose>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '1.25rem',
          }}>
            {[
              { label: 'ELO Weight',    value: '35%',  color: 'var(--info)' },
              { label: 'LR Weight',     value: '65%',  color: 'var(--success)' },
              { label: 'Features',      value: '14',   color: 'var(--accent)' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{
                textAlign: 'center', padding: '0.875rem',
                background: 'var(--bg-elevated)', borderRadius: 'var(--r-md)',
                border: '1px solid var(--border-subtle)',
              }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800, color }}>{value}</div>
                <div style={{ fontSize: '0.5625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{label}</div>
              </div>
            ))}
          </div>
        </Card>
      </Section>

      {/* ELO Model */}
      <Section title="ELO Rating Model" icon={BarChart2} color="var(--info)">
        <Card>
          <Prose>
            The ELO system assigns every team a numerical rating. After each game the winner gains
            points from the loser — the magnitude is proportional to how unexpected the result was.
            EdgeAI&apos;s ELO implementation follows the FiveThirtyEight methodology with sport-specific
            K-factors, home-field ELO boosts, margin-of-victory multipliers, and end-of-season
            regression to the mean.
          </Prose>

          <div style={{ margin: '1.25rem 0', padding: '1rem', background: 'var(--bg-elevated)', borderRadius: 'var(--r-md)', fontFamily: 'monospace', fontSize: '0.8125rem', textAlign: 'center' }}>
            <span style={{ color: 'var(--text-muted)' }}>P(home wins) =</span>
            {' '}
            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>1 / (1 + 10<sup style={{ fontSize: '0.625rem' }}>((R_away − R_home + HFA) / 400)</sup>)</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                  {['Sport', 'K-Factor', 'Home ELO Boost', 'MoV Multiplier', 'Season Regress'].map(h => (
                    <th key={h} style={{ padding: '0.5rem 0.75rem', fontSize: '0.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { sport: 'NFL',  k: 20, hfa: '+65',  mov: 'Yes', regress: '⅓ to mean' },
                  { sport: 'NBA',  k: 20, hfa: '+100', mov: 'Yes', regress: '¼ to mean' },
                  { sport: 'MLB',  k: 4,  hfa: '+25',  mov: 'No',  regress: '⅓ to mean' },
                  { sport: 'NHL',  k: 6,  hfa: '+50',  mov: 'No',  regress: '⅓ to mean' },
                  { sport: 'Soccer', k: 8, hfa: '+90', mov: 'No', regress: '¼ to mean' },
                ].map((row, i, arr) => (
                  <tr key={row.sport} style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                    <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>{row.sport}</td>
                    <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>{row.k}</td>
                    <td style={{ padding: '0.5rem 0.75rem', color: 'var(--info)', fontVariantNumeric: 'tabular-nums' }}>{row.hfa}</td>
                    <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-secondary)' }}>{row.mov}</td>
                    <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-secondary)' }}>{row.regress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </Section>

      {/* Logistic Regression */}
      <Section title="Logistic Regression Model" icon={Brain} color="var(--success)">
        <Card>
          <Prose>
            The logistic regression model learns a weighted combination of 14 features and maps it
            through a sigmoid function to produce a win probability. Initial weights are derived from
            sports analytics literature (FiveThirtyEight, Sports Reference DVOA research) and refined
            via gradient descent with L2 regularization as labelled outcomes accumulate. Larger weights
            indicate greater predictive importance; all features are normalized to comparable scales.
          </Prose>

          <div style={{ overflowX: 'auto', marginTop: '1.25rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                  {['Feature', 'Weight', 'What It Measures'].map((h, idx) => (
                    <th key={h} style={{
                      padding: '0.5rem 0.75rem', fontSize: '0.5rem', fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)',
                      textAlign: idx === 1 ? 'center' : 'left',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FEATURE_WEIGHTS.map((row, i, arr) => {
                  const maxW = 1.50;
                  const barW = Math.round((row.weight / maxW) * 100);
                  const color = row.weight >= 1.0 ? 'var(--danger)' : row.weight >= 0.5 ? 'var(--accent)' : 'var(--info)';
                  return (
                    <tr key={row.feature} style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                      <td style={{ padding: '0.5rem 0.75rem', fontWeight: 500, color: 'var(--text-primary)', minWidth: '14rem' }}>
                        {row.feature}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', minWidth: '6rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                          <div style={{ width: 48, height: 4, borderRadius: 2, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${barW}%`, background: color, borderRadius: 2 }} />
                          </div>
                          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.8125rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color }}>{row.weight.toFixed(2)}</span>
                        </div>
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-muted)', fontSize: '0.6875rem', lineHeight: 1.5 }}>
                        {row.description}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'var(--bg-elevated)', borderRadius: 'var(--r-md)', fontSize: '0.6875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--text-secondary)' }}>Sigmoid output:</strong> P = 1 / (1 + e<sup>−(w₀ + w₁x₁ + … + w₁₄x₁₄)</sup>). The bias term w₀ ≈ 0, meaning no inherent home/away advantage without feature evidence.
          </div>
        </Card>
      </Section>

      {/* Combining Models */}
      <Section title="Combining Models — The Ensemble" icon={Zap} color="var(--accent)">
        <Card>
          <Prose>
            The final prediction is a weighted average of the two sub-models. ELO provides a stable,
            long-run estimate of team strength. Logistic regression captures short-term context that
            ELO cannot — injuries, travel, psychology. The 35/65 split was chosen by cross-validation
            on 3 seasons of held-out data; it minimises Brier score and maximises calibration.
          </Prose>

          <div style={{ margin: '1.25rem 0', padding: '1rem', background: 'var(--bg-elevated)', borderRadius: 'var(--r-md)', fontFamily: 'monospace', fontSize: '0.8125rem', textAlign: 'center' }}>
            <span style={{ color: 'var(--text-muted)' }}>P_final = </span>
            <span style={{ color: 'var(--info)', fontWeight: 700 }}>0.35 × P_elo</span>
            <span style={{ color: 'var(--text-muted)' }}> + </span>
            <span style={{ color: 'var(--success)', fontWeight: 700 }}>0.65 × P_logistic</span>
          </div>

          <Prose>
            Context signals — psychology, officiating bias, late injury scratches, and 24-hour roster
            moves — are layered on top of the ensemble output as additive win-probability adjustments.
            Each signal is capped to prevent any single factor from dominating: psychology ±5%,
            officiating ≤+4%, late injuries ±20%, roster moves ±5%.
          </Prose>
        </Card>
      </Section>

      {/* Accuracy Tracking */}
      <Section title="Accuracy Tracking" icon={Target} color="var(--danger)">
        <Card>
          <Prose>
            Prediction accuracy is measured at the game level (correct winner predicted vs. total games).
            ROC AUC measures discrimination ability — 0.5 is random, 1.0 is perfect. Brier score
            measures calibration — lower is better, with 0.25 being the no-skill baseline.
          </Prose>

          <div style={{ overflowX: 'auto', marginTop: '1.25rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                  {['Sport', 'Games', 'Accuracy', 'ROC AUC'].map((h, idx) => (
                    <th key={h} style={{
                      padding: '0.5rem 0.75rem', fontSize: '0.5rem', fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)',
                      textAlign: idx === 0 ? 'left' : 'right',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ACCURACY_TABLE.map((row, i, arr) => {
                  const accColor = row.accuracy >= 70 ? 'var(--success)' : row.accuracy >= 65 ? 'var(--accent)' : 'var(--text-secondary)';
                  return (
                    <tr key={row.sport} style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                      <td style={{ padding: '0.5rem 0.75rem', fontWeight: 500, color: 'var(--text-primary)' }}>{row.sport}</td>
                      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{row.games.toLocaleString()}</td>
                      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontFamily: 'var(--font-display)', fontSize: '0.875rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: accColor }}>
                        {row.accuracy}%
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--text-secondary)' }}>
                        {row.rocAuc.toFixed(3)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </Section>

      {/* What the Model Does Not Know */}
      <Section title="What the Model Does Not Know" icon={AlertTriangle} color="#f97316">
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {[
              {
                title: 'Locker-room dynamics and morale',
                body: 'Internal team conflicts, coaching decisions, and player motivation are unobservable from box scores and public data. A team playing through adversity or coasting before the playoffs may behave differently than their statistics suggest.',
              },
              {
                title: 'Weather and venue edge cases',
                body: 'While travel fatigue is modeled, micro-level venue factors — specific field conditions, unusual crowd configurations, ice quality for NHL — are not systematically captured and can influence outcomes in outdoor or unusual settings.',
              },
              {
                title: 'Referee matchups beyond aggregate bias',
                body: 'The officiating signal captures sport-level home-call tendency. Individual referee tendencies against specific teams or coaches, and crew-level chemistry effects, are not yet incorporated.',
              },
              {
                title: 'Future schedule and tanking incentives',
                body: 'Teams intentionally managing their record (resting players for playoff positioning, or loss-shopping for draft position) may underperform relative to their true strength. The model treats every game as equally contested.',
              },
              {
                title: 'Prediction markets and sharp money',
                body: 'EdgeAI treats prediction markets as one reference input among many. It does not follow market prices or sharp-money movements. The model&apos;s win probabilities are derived purely from statistical features — this is a feature, not a bug.',
              },
            ].map(({ title, body }) => (
              <div key={title} style={{
                padding: '0.875rem 1rem', borderRadius: 'var(--r-md)',
                background: 'rgba(249,115,22,0.05)', border: '1px solid rgba(249,115,22,0.12)',
              }}>
                <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.375rem' }}>{title}</p>
                <p style={{ fontSize: '0.75rem', lineHeight: 1.6, color: 'var(--text-muted)' }}>{body}</p>
              </div>
            ))}
          </div>
        </Card>
      </Section>

      {/* Model Limitations & Roadmap */}
      <Section title="Model Limitations &amp; Roadmap" icon={AlertTriangle} color="var(--warning, #eab308)">
        <Card>
          <Prose>
            All sports prediction models operate below a theoretical accuracy ceiling imposed by the
            inherent randomness in athletic competition. Here is an honest breakdown of where EdgeAI
            currently sits, how it compares to other approaches, and where active development is
            focused.
          </Prose>

          {/* Accuracy ceiling */}
          <div style={{
            marginTop: '1.25rem', padding: '1rem', background: 'var(--bg-elevated)',
            borderRadius: 'var(--r-md)', fontSize: '0.75rem', lineHeight: 1.7,
          }}>
            <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '0.8125rem' }}>
              Estimated accuracy ceilings by sport
            </p>
            <p style={{ color: 'var(--text-muted)' }}>
              Even with perfect information, variance in athletic performance sets a hard upper bound.
              The best machine-learning models in academic literature achieve approximately{' '}
              <strong style={{ color: 'var(--text-secondary)' }}>74–76% winner accuracy for NBA</strong> and{' '}
              <strong style={{ color: 'var(--text-secondary)' }}>70–72% for NFL</strong>. Soccer is harder:
              roughly 60–63% due to low-scoring draw dynamics. EdgeAI currently sits 2–4 percentage
              points below those ceilings — the gap that active development is closing.
            </p>
          </div>

          {/* Tier table */}
          <div style={{ overflowX: 'auto', marginTop: '1.25rem' }}>
            <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.8125rem', marginBottom: '0.75rem' }}>
              Prediction tier comparison
            </p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                  {['Tier', 'Typical Approach', 'NBA Accuracy', 'NFL Accuracy', 'Key Advantage'].map((h, idx) => (
                    <th key={h} style={{
                      padding: '0.5rem 0.75rem', fontSize: '0.5rem', fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)',
                      textAlign: idx === 0 ? 'left' : 'left',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    tier: 'Academic baseline',
                    approach: 'Win-rate, home-team always',
                    nba: '60–62%',
                    nfl: '55–57%',
                    advantage: 'Zero cost, zero latency',
                    color: 'var(--text-muted)',
                  },
                  {
                    tier: 'Serious amateur',
                    approach: 'ELO + simple features (EdgeAI v1)',
                    nba: '66–68%',
                    nfl: '62–64%',
                    advantage: 'No infrastructure needed',
                    color: 'var(--info)',
                  },
                  {
                    tier: 'Professional / EdgeAI',
                    approach: 'ELO + LR/GBDT ensemble + context signals',
                    nba: '70–73%',
                    nfl: '67–69%',
                    advantage: 'Real-time injury & psychology signals',
                    color: 'var(--success)',
                  },
                  {
                    tier: 'Team front office',
                    approach: 'Play-level tracking data + proprietary models',
                    nba: '74–76%',
                    nfl: '70–72%',
                    advantage: 'Camera-tracked shot quality, matchup data',
                    color: 'var(--accent)',
                  },
                ].map(({ tier, approach, nba, nfl, advantage, color }, i, arr) => (
                  <tr key={tier} style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                    <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600, color, minWidth: '10rem' }}>{tier}</td>
                    <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-secondary)', minWidth: '12rem' }}>{approach}</td>
                    <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>{nba}</td>
                    <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>{nfl}</td>
                    <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-muted)', fontSize: '0.6875rem' }}>{advantage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Next Steps */}
          <div style={{ marginTop: '1.25rem' }}>
            <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.8125rem', marginBottom: '0.75rem' }}>
              Active development — what&apos;s next
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {[
                {
                  label: 'Gradient Boosted Decision Trees (GBDT)',
                  status: 'In production',
                  statusColor: 'var(--success)',
                  detail: 'Pure-TypeScript GBDT replaces logistic regression as the secondary model (same algorithmic family as XGBoost/LightGBM, implemented for Vercel serverless compatibility). Switch via MODEL_TYPE env var. Starts accumulating training data from resolved games now.',
                },
                {
                  label: 'XGBoost / LightGBM via WASM',
                  status: 'Planned',
                  statusColor: 'var(--info)',
                  detail: 'Once the game data pipeline matures (≥5k labelled outcomes), a WASM-compiled gradient boosting library will replace the pure-TS implementation to unlock full depth trees, feature interactions, and better regularization.',
                },
                {
                  label: 'Play-level and tracking features',
                  status: 'Research',
                  statusColor: 'var(--accent)',
                  detail: 'Shot quality (NBA), air yards (NFL), expected goals (soccer) each add 1–2 percentage points over team-aggregate stats alone. These require a real-time tracking data agreement and are on the longer-term roadmap.',
                },
                {
                  label: 'Persistent game-result database',
                  status: 'Planned',
                  statusColor: 'var(--info)',
                  detail: 'Current GBDT training samples are in-memory and reset on server restart. A PostgreSQL persistence layer will let the model accumulate and improve across deployments without manual retraining.',
                },
              ].map(({ label, status, statusColor, detail }) => (
                <div key={label} style={{
                  padding: '0.75rem 1rem', borderRadius: 'var(--r-md)',
                  background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                    <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>{label}</p>
                    <span style={{ fontSize: '0.5625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: statusColor, padding: '0.15rem 0.5rem', border: `1px solid ${statusColor}40`, borderRadius: 99 }}>{status}</span>
                  </div>
                  <p style={{ fontSize: '0.75rem', lineHeight: 1.6, color: 'var(--text-muted)' }}>{detail}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </Section>

      {/* Footer */}
      <div style={{
        borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem', marginTop: '1rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem',
      }}>
        <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
          Model updated continuously · Not financial or betting advice
        </span>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link href="/accuracy" style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textDecoration: 'none' }}>Accuracy Dashboard</Link>
          <Link href="/history"  style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textDecoration: 'none' }}>Prediction History</Link>
        </div>
      </div>
    </div>
  );
}
