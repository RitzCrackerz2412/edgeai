# EdgeAI — Portfolio Package

This document contains materials for portfolio, internship, and job applications.

---

## Portfolio Description (150–250 words)

EdgeAI is a full-stack sports intelligence platform built with Next.js 16 and TypeScript. It generates pre-game predictions across 13 professional sports using an ensemble of statistical models — ELO ratings, logistic regression, Monte Carlo simulation, and Bayesian probability — then tracks calibrated accuracy over time with a backtesting pipeline.

The project began as an exploration of how far pure statistical modeling can go without play-by-play data or team-specific proprietary feeds. The most interesting engineering challenge was building a prediction pipeline that degrades gracefully: every model in the ensemble operates independently, so a missing API key or provider outage reduces confidence rather than returning an error.

On the infrastructure side, the application runs zero-cost out of the box (ESPN and Open-Meteo are both free), supports an optional PostgreSQL backend with a 13-model Prisma schema, and can be deployed to Vercel in under five minutes. The data pipeline uses Vercel cron jobs to refresh schedules, generate predictions, and validate completed games on a rolling schedule.

Security was treated as a first-class concern: passwords are hashed with PBKDF2-SHA512 (100,000 iterations), cron endpoints fail closed without a secret, and the admin layer enforces server-side session and role checks at the layout level rather than relying on client-side guards.

The result is a production-hardened codebase: 40 routes, 104 automated tests, 0 TypeScript errors, and a clean ESLint run — deployable to Vercel with four environment variables.

---

## Resume Bullet Points

Use 3–5 of the following depending on the role. Tailor the emphasis (AI/ML roles → engine bullets; backend roles → infrastructure bullets; full-stack roles → architecture bullets).

---

### Full-Stack Architecture

- **Built EdgeAI**, a full-stack sports analytics platform in Next.js 16 (App Router) and TypeScript — 40 routes, 13 API endpoints, real-time live game simulation, and an admin observability dashboard

- **Designed a provider abstraction layer** with circuit breakers and automatic failover across four sports data APIs (ESPN, SportsDataIO, The Odds API, Open-Meteo), ensuring the app degrades gracefully when any provider is unavailable

### AI / Prediction Engine

- **Engineered a five-model prediction ensemble** (ELO ratings, logistic regression, Monte Carlo simulation, Bayesian probability, and cosine-similarity matching) with Platt-scaled calibration and inverse-Brier dynamic model weighting

- **Implemented a continuous learning pipeline** that validates game outcomes post-completion, updates calibration samples, and reweights ensemble models — producing backtesting metrics (Brier score, log-loss, ROC-AUC, ECE) against a rolling validation set

### Security

- **Hardened authentication and API security**: replaced single-pass SHA-256 password hashing with PBKDF2-SHA512 (100,000 iterations, random salt per password); added server-side admin route guards, fail-closed cron endpoint protection, and per-IP rate limiting across four route tiers

### Production & Deployment

- **Built a production-ready deployment pipeline**: Docker multi-stage build on Alpine, Vercel cron-job automation (data refresh every 15 min, predictions every 2h, validation every 1h), and GitHub Actions CI running typecheck → lint → test → build → Lighthouse on every push

- **Designed an optional persistence layer** using Prisma ORM with a 13-model PostgreSQL schema and a TTL-based in-memory LRU cache that transparently falls back when Redis is unavailable

### Testing

- **Achieved 104 automated tests** (Vitest) across the prediction engine, feature extractors, calibration pipeline, backtesting metrics, and security utilities — with zero TypeScript errors and a clean ESLint run

---

## Architecture Summary (one-page technical overview)

### EdgeAI — Technical Architecture

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS · Recharts · NextAuth v5 · Prisma · Vitest

---

#### Frontend

The UI is a single Next.js monolith using the App Router. Server Components handle all data fetching and initial render; Client Components are used only where interactivity requires it (charts, live simulation, forms). Styling is implemented entirely through Tailwind CSS and CSS custom properties on `:root`, making the design system a single source of truth that Tailwind utilities reference rather than override.

The component library is split into three layers: layout components (AppShell, Sidebar, TopBar, Breadcrumbs), domain components (ConfidenceGauge, TeamRadar, PredictionSimulator, RollingAccuracyChart), and a presentational UI kit (Card, Badge, StatCard, LoadingSkeleton, NotificationBell).

---

#### Backend

API routes are Next.js Route Handlers (`src/app/api/`). Every response path passes through `src/proxy.ts` (formerly `middleware.ts` — renamed per Next.js 16 convention), which applies rate limiting per IP/route-tier and injects HTTP security headers (CSP, HSTS, X-Frame-Options, Referrer-Policy).

Authentication uses NextAuth v5 in credentials mode with an in-memory user store. Passwords are hashed with PBKDF2-SHA512 (100,000 iterations, 16-byte random salt). Admin routes are guarded by an async Server Component layout that calls `auth()` server-side and redirects on failure.

---

#### Prediction Pipeline

```
Raw game data
    │
    ▼
Feature extraction (sport-specific: form, H2H, rest, weather, injuries)
    │
    ▼
Five independent models:
  ELO ─────────────────────────────────────┐
  Logistic regression ─────────────────────┤
  Monte Carlo (10,000 simulations) ─────────┼──► Ensemble combiner
  Bayesian (prior × recent form) ──────────┤        │
  Cosine similarity (historical lookup) ───┘        │
                                                     ▼
                                              Platt-scaled calibration
                                                     │
                                                     ▼
                                              Explainability layer
                                          (waterfall, counterfactuals)
```

Model weights are dynamically adjusted using inverse-Brier scoring against the validation store. Post-game, the learning pipeline records outcomes, updates calibration samples, and recomputes weights.

---

#### Data Providers

A provider abstraction (`src/lib/providers/`) wraps four external APIs behind a common interface. Each provider runs through a circuit breaker (closed → open → half-open) that tracks failure rate and prevents cascade failures. The composite provider prefers the free tier (ESPN, Open-Meteo) and automatically promotes the paid fallback after three consecutive failures.

---

#### Database & Caching

PostgreSQL is optional — `getDb()` returns `null` when `DATABASE_URL` is unset, and all data falls back to in-memory mock data. When present, Prisma manages a 13-model schema covering Users, Games, Predictions, ValidationResults, CalibrationRecords, FeatureVectors, ModelWeights, Notifications, and UserPreferences.

Caching is similarly layered: Redis is used when `REDIS_URL` is set; otherwise, a per-instance TTL-based LRU cache handles route-level caching. Both implementations share a single `ICache` interface.

---

#### Automation

Three Vercel cron jobs drive the data pipeline:
- `*/15 * * * *` — refresh schedules and injury data
- `0 */2 * * *` — generate predictions for upcoming games
- `0 * * * *` — validate completed games and trigger learning updates

---

#### Deployment

The application targets Vercel for serverless deployment and ships a Docker Compose stack (Node 20 Alpine + PostgreSQL + Redis) for self-hosted environments. GitHub Actions runs a five-stage CI pipeline (typecheck → lint → test → build → Lighthouse) on every push.
