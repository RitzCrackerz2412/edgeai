# EdgeAI — Future Roadmap

This document outlines potential directions for EdgeAI beyond v2.1.0. These are organized by feasibility and estimated impact, not as promises of future releases.

---

## Planned Improvements

Improvements to existing functionality that are well-scoped and directly extend what's already built.

### Prediction Engine
- **Live prediction updates** — re-run the engine mid-game using real score and possession data when a live data provider is configured, replacing the Markov simulation with actual game state
- **Model versioning** — tag each prediction with the engine version that produced it, enabling A/B comparison between model releases
- **Sport-specific calibration curves** — currently calibration is global; per-sport isotonic regression would improve accuracy in sports with structurally different score distributions (soccer vs. basketball)
- **Expanded feature set** — add referee/officiating crew effects (NFL), travel fatigue (back-to-backs in NBA), and dome/outdoor splits where data is available

### Data & Providers
- **WebSocket live data** — stream play-by-play events over WebSocket when a provider supports it, updating the live tracker without polling
- **Historical game ingestion** — batch import past seasons from the ESPN API to pre-populate calibration samples on a fresh deployment
- **Odds movement tracking** — record line movement over time and expose it as a feature for detecting sharp-money signals

### User Experience
- **Prediction alerts** — email/push notifications when a high-confidence prediction is available for a user-followed team
- **Personalized feed** — filter the home dashboard to only show sports and teams the user follows
- **Export** — CSV/PDF export of prediction history and accuracy reports

### Operations
- **Distributed rate limiting** — replace the per-instance in-memory rate limiter with Redis-backed counters to handle load balancing correctly
- **Error tracking integration** — hook into Sentry or similar for production error aggregation (currently just console output)
- **Metrics export** — expose the observability endpoint in Prometheus format for Grafana dashboards

---

## Experimental Ideas

Higher-risk, higher-reward directions that would require significant new development or external dependencies.

### LLM-Enhanced Analysis
- Integrate a small language model to generate analyst report narratives — replacing the current template-based system with dynamic prose that responds to the specific feature values (e.g., "this is the third time these teams have played with less than 3 days rest")
- Use LLM output as an additional weak signal in the ensemble, treating market sentiment and analyst consensus as a Bayesian prior

### Multi-Game Parlay Modeling
- Extend the Monte Carlo simulation to model correlated game outcomes across a slate — useful for parlay probability estimation and DFS lineup construction
- The main challenge is correctly modeling within-day correlations (weather affecting multiple outdoor games, scheduling quirks)

### Player Prop Predictions
- Extend feature engineering to player-level stats (targets, touches, minutes) and predict individual performance lines
- Requires the SportsDataIO key for live roster/lineup data; ESPN alone is insufficient

### Computer Vision Box Scores
- OCR pipeline to ingest historic box score images for pre-API-era data, extending the historical training set further back

---

## Nice-to-Have Features

Quality-of-life additions that don't change the core product but improve the experience.

- **Dark/light mode toggle** — the current design uses a fixed dark palette; a light mode would improve readability in bright environments
- **Mobile app (React Native)** — port the prediction cards and live tracker to a mobile shell; the API layer is already decoupled from the UI
- **Share cards** — one-click image generation for sharing a prediction card to social media (using `satori` or `@vercel/og`)
- **Keyboard shortcuts** — power-user shortcuts for navigating between games, toggling the prediction simulator, and jumping to the accuracy page
- **Offline mode** — cache the last-known game data in the browser so the app is usable on poor connections
- **Localization** — i18n support for international sports audiences (soccer/football disambiguation, European date formats, metric/imperial weather)

---

## What Will Not Change

To stay grounded, a few things that are intentionally out of scope:

- **Real-money betting integrations** — EdgeAI is an analytics and prediction tool, not a gambling platform
- **Prediction guarantees** — win probabilities are calibrated estimates from statistical models, not certainties; the accuracy center exists specifically to surface this honestly
- **Data resale** — provider API terms of service prohibit redistributing raw data; EdgeAI only surfaces derived analytics
