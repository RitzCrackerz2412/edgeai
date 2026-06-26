# EdgeAI — Launch Announcements

Copy-ready text for LinkedIn, GitHub Releases, and X (Twitter).

---

## LinkedIn Post

---

Excited to share EdgeAI — a full-stack sports intelligence platform I built from scratch.

It generates pre-game predictions across 13 sports (NFL, NBA, MLB, NHL, Soccer, UFC, and more) using an ensemble of statistical models: ELO ratings, logistic regression, Monte Carlo simulation, Bayesian probability, and cosine-similarity matching against historical matchups.

A few things I'm proud of from an engineering perspective:

**The prediction pipeline degrades gracefully.** Every model operates independently. A missing API key or provider outage lowers confidence rather than breaking the page. Circuit breakers handle provider failover automatically between ESPN (free) → SportsDataIO and Open-Meteo → OpenWeatherMap.

**The system is genuinely calibrated.** Raw model outputs pass through Platt scaling before reaching the UI. Predicted probabilities match observed win rates within each confidence band — and that gap shrinks over time as the continuous learning pipeline updates model weights after each completed game.

**Security was a first-class concern.** PBKDF2-SHA512 password hashing (100k iterations), server-side admin auth guards, fail-closed cron endpoints, and per-IP rate limiting across four route tiers.

**Zero required paid dependencies.** The app runs with ESPN's free public API and Open-Meteo's free weather service out of the box. Paid integrations layer in for production-grade live data.

Tech: Next.js 16, TypeScript, Recharts, NextAuth v5, Prisma (optional), Vitest.

Numbers: 40 routes · 13 API endpoints · 104 automated tests · 0 TypeScript errors · 13-model database schema.

GitHub: [link]
Live demo: [coming soon]

#nextjs #typescript #sportstech #machinelearning #webdevelopment #fullstack

---

## GitHub Release Description (v2.1.0)

---

### EdgeAI v2.1.0

This is the production-ready release of EdgeAI — a full-stack sports analytics platform built with Next.js 16 and TypeScript.

#### What's included

**Prediction engine**
- Five-model ensemble: ELO, logistic regression, Monte Carlo, Bayesian, cosine similarity
- Sport-specific feature engineering across 13 sports
- Platt-scaled calibration with ECE and Brier score tracking
- Continuous learning: model weights update after each completed game
- Explainability layer: waterfall charts and counterfactual analysis

**Application**
- 40 routes including game detail, live tracker, AI analyst reports, team and player comparison, draft/prospect, fantasy projections, accuracy center, and full admin dashboard
- Observability: p50/p95/p99 latency, error rate, cache hit rate, provider health
- Automated pipeline: Vercel cron jobs for data refresh, prediction generation, and game validation

**Infrastructure**
- Docker multi-stage build (Alpine) + docker-compose with PostgreSQL and Redis
- GitHub Actions CI: typecheck → lint → test → build → Lighthouse
- Optional PostgreSQL via Prisma (13-model schema)
- Optional Redis cache (falls back to in-process LRU)

**Security** *(8 hardening fixes applied)*
- PBKDF2-SHA512 password hashing (100k iterations, random salt per password)
- Server-side admin route guards with session + role validation
- Fail-closed cron endpoint protection
- Notifications IDOR fix: user ID derived from session, not query string
- Admin API endpoints (`/api/metrics`, `/api/sync`, `/api/backtest`) require authenticated admin session

#### Installation

```bash
git clone https://github.com/your-username/edgeai.git
cd edgeai
npm install
cp .env.example .env.local  # set AUTH_SECRET at minimum
npm run dev
```

See [README.md](../README.md) and [docs/DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) for full setup instructions.

#### What's next

See [docs/ROADMAP.md](ROADMAP.md) for planned improvements and experimental ideas.

---

## X (Twitter) Thread

---

**Tweet 1 (lead)**

Built EdgeAI: a full-stack sports prediction platform in Next.js 16 + TypeScript.

5-model ensemble (ELO + logistic regression + Monte Carlo + Bayesian + similarity matching) across 13 sports. Ships with zero required paid APIs.

40 routes · 104 tests · 0 TS errors.

GitHub: [link] 🧵

---

**Tweet 2 (prediction engine)**

The engine combines 5 independent statistical models:

→ ELO ratings (win probability from rating gap)
→ Logistic regression (feature-weighted classification)
→ Monte Carlo (10k simulated score distributions)
→ Bayesian (prior × recent form)
→ Cosine similarity (historical matchup lookup)

Outputs are Platt-scaled before reaching the UI.

---

**Tweet 3 (graceful degradation)**

My favorite architectural decision: every model is independent.

Missing an API key? Lower confidence, not an error. Provider down? Circuit breaker promotes the fallback automatically.

ESPN (free) → SportsDataIO. Open-Meteo (free) → OpenWeatherMap.

The app never fully breaks.

---

**Tweet 4 (continuous learning)**

After each game completes:

1. Validate prediction against actual result
2. Update calibration samples
3. Recompute model weights using inverse-Brier scoring
4. Models that predicted correctly get higher weight next time

It gets better over time without any manual tuning.

---

**Tweet 5 (call to action)**

Live demo: [coming soon]
GitHub: [link]

Stack: Next.js 16 · TypeScript · Recharts · NextAuth v5 · Prisma · Vitest · Vercel

Happy to answer questions about the architecture.
