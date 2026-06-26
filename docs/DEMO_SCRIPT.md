# EdgeAI — Demo Walkthrough Script

**Duration:** 3–5 minutes  
**Format:** Screen share or live demo

This script flows in a natural arc: start at the home page with the big picture, go deep on a single prediction, then show the AI analysis, comparisons, live simulation, accuracy, and finally the ops layer. Each section has a spoken cue and what to click.

---

## Opening (15 seconds)

> "This is EdgeAI — a sports intelligence platform I built that generates pre-game predictions across 13 sports, tracks prediction accuracy over time, and includes a full ops layer for monitoring and automation. Let me walk you through it."

**Action:** Have the home dashboard open at full screen.

---

## 1. Home Dashboard (~30 seconds)

> "The home page shows today's games sorted by confidence — the engine is most confident about these predictions at the top. Each card shows the predicted winner, win probability, and key risk factors."

**Action:** Point to a game card — note the confidence percentage and win probability bar.

> "These predictions come from an ensemble of five statistical models: ELO ratings, logistic regression, Monte Carlo simulation, Bayesian probability, and cosine-similarity matching against historical games. The confidence score reflects how much the five models agree."

**Action:** Scroll down to show the trending section and top picks.

> "The dashboard also shows a rolling accuracy chart and today's highest-confidence picks — I'll come back to accuracy in a moment."

---

## 2. Game Prediction Detail (~45 seconds)

**Action:** Click into a game card.

> "The game detail page breaks down everything the engine knows. At the top, the win probability bar — in this case, the home team is favored at 68%. Below that, the predicted score, expected margin, and upset probability."

**Action:** Point to the confidence gauge and factor list.

> "The factors section shows which inputs pushed the probability in each direction. A heavy home-field advantage and injury to the away team's starter pulled it toward the home side, while the away team's recent form and head-to-head record are slightly negative factors."

**Action:** Scroll to the explainability section.

> "This waterfall chart shows the mathematical contribution of each feature to the final probability — a form of local model explainability. The prediction simulator lets you toggle individual factors and see the probability update in real time."

**Action:** Drag a simulator slider to show live probability update.

---

## 3. AI Analyst Report (~30 seconds)

**Action:** Click the "AI Analyst" button on the game detail page.

> "The analyst report takes the model output and structures it into a narrative format — key matchups, tactical factors, risk assessment, and a final verdict. This is generated server-side from the prediction's feature vector, not from a language model, so it's grounded in the actual numbers."

**Action:** Point to the sections: Key Matchups, Risk Factors, Historical Patterns, Verdict.

> "Each section maps directly to a feature group in the prediction engine. If the biggest risk factor is weather, it shows up here as a narrative paragraph."

---

## 4. Team or Player Comparison (~30 seconds)

**Action:** Navigate to Compare → Teams (or Players).

> "The comparison tool puts two teams side by side across offensive and defensive metrics, win rates, and recent form. I'll compare these two teams..."

**Action:** Select two teams from the dropdowns.

> "The radar chart shows relative strengths — you can see immediately that Team A dominates offensively but is weaker defensively. The bar charts below break down individual stat categories."

**Action:** Point to the head-to-head record section.

> "And at the bottom, the full historical head-to-head record — which matters for the similarity matching component of the prediction engine."

---

## 5. Live Win Probability Tracker (~30 seconds)

**Action:** Navigate to a live game (or any game's live tracker).

> "The live tracker simulates a game in real time using a Markov chain model. Each tick updates the game state and recalculates win probability — you can see the chart updating."

**Action:** Let it run for a few seconds so the chart animates.

> "The simulation accounts for score differential, time remaining, and possession. You can pause it, reset it, or let it run to the final whistle."

**Action:** Point to the probability percentage readout next to each team.

> "When a simulated game finishes, it records the outcome back to the validation store for learning purposes."

---

## 6. Accuracy Center (~30 seconds)

**Action:** Navigate to /accuracy.

> "The Accuracy Center is where I track how well the model actually performs. These are all historical predictions validated against real game results."

**Action:** Point to the top stat cards.

> "Overall accuracy, average confidence on correct predictions, and average confidence on incorrect ones — a well-calibrated model should have higher confidence when it's right."

**Action:** Change the sport filter to a single sport.

> "The rolling accuracy chart shows 30-day accuracy over time by sport. The calibration chart below compares predicted probability to observed win rate — a perfect model would fall along the diagonal. These gaps show where the model is over- or under-confident in specific confidence bands."

---

## 7. Admin Dashboard (~30 seconds)

**Action:** Navigate to /admin.

> "The admin dashboard is the ops layer. It shows live observability — request count, p50/p95 latency, error rate, and cache hit rate — all collected from the request handler without any third-party service."

**Action:** Click to the Monitor tab.

> "The monitoring panel shows provider health — whether ESPN and SportsDataIO are responding — along with the job queue for scheduled data refreshes. Dead-letter queue entries show any jobs that failed after three retries."

**Action:** Click to the Model tab.

> "The model dashboard shows feature importance rankings and current dynamic model weights. The weights shift automatically after each completed game based on which models predicted it most accurately."

---

## Closing (15 seconds)

> "The whole thing is deployed on Vercel with three cron jobs — data refreshes every 15 minutes, predictions generate every two hours, and completed games are validated every hour. It supports an optional PostgreSQL backend and Redis cache, but runs entirely with free APIs and in-memory storage out of the box."

> "Questions?"

---

## Tips for Demo Day

- **Have a game with a clear favorite loaded** — high-confidence predictions make the explainability section more readable
- **Run the live tracker for 10–15 seconds before switching away** — the moving probability chart is visually compelling
- **On the accuracy page, use NFL filter** — typically the most complete mock dataset
- **If asked about real accuracy numbers**, clarify that the prediction history shown is mock data; the model metrics (Brier score, ECE) reflect the engine's mathematical properties
