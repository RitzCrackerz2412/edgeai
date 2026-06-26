# EdgeAI — Architecture

## Overview

EdgeAI is a Next.js 16 sports intelligence platform. It generates AI-assisted game predictions using an ensemble model (ELO + logistic regression + gradient-boosted trees), Monte Carlo simulation, and historical similarity matching.

The application is a monolithic Next.js app using the App Router, with server components for data fetching and client components only where interactivity is required.

---

## Directory Structure

```
src/
  app/                  # Next.js App Router pages + API routes
    admin/              # Admin dashboard, monitoring, model dashboard
    api/                # REST API handlers (predict, simulate, learn, …)
    auth/               # Sign-in + registration pages
    game/[id]/          # Game detail
    player/[id]/        # Player detail
    team/[id]/          # Team detail
  components/
    layout/             # AppShell, Sidebar, TopBar, Breadcrumbs
    ui/                 # Reusable presentational components
  lib/
    auth/               # NextAuth v5 config, in-memory user store
    cache/              # TTL-based in-memory cache
    data/               # Static sport configs (13 sports)
    engine/             # Prediction engine core
      backtest.ts       # Backtesting metrics (Brier, log-loss, ROC-AUC, ECE)
      calibration.ts    # Platt scaling, calibration curve
      elo.ts            # ELO model
      explainability2.ts # Waterfall, counterfactuals, confidence decomposition
      learning.ts       # Post-game update, continuous learning pipeline
      logistic.ts       # Logistic regression with feature weights
      montecarlo.ts     # Monte Carlo score simulation
      similarity.ts     # Cosine-similarity historical matching
      weights.ts        # Dynamic inverse-Brier model weighting
    features/           # Sport-specific feature extractors
      sports/           # NFL, NBA, MLB, Soccer feature vectors
    notifications/      # In-app notification store
    observability/      # Structured logger, circular-buffer metrics
    providers/          # Data provider adapters (mock → real)
    search/             # Trigram fuzzy search engine
    security/           # Rate limiting, input validation, env validation
    sync/               # Background job queue + sport sync jobs
    types.ts            # Shared TypeScript types (Sport, GamePrediction, …)
    validation/         # ValidationStore for post-game outcomes
```

---

## Prediction Pipeline

```
Request → /api/predict
  │
  ├── Fetch team stats (provider → cache)
  │     └── RawTeamStats { record, eloRating, extras: Record<string,number> }
  │
  ├── Feature extraction
  │     └── extractSportFeatures(sport, teamId, isHome, raw) → Feature vector
  │
  ├── ELO model          → P(home win)
  ├── Logistic regression → P(home win)
  ├── GBT model          → P(home win)
  │
  ├── Dynamic weighting  (inverse-Brier proportional, 5% floor)
  │     └── DynamicWeightStore.getWeights(sport) → ModelWeights
  │
  ├── Ensemble blend      → final homeWinProbability
  │
  ├── Monte Carlo simulation → expected scores, win % distribution
  │
  ├── Historical similarity  → top-5 similar past games
  │
  ├── Explainability 2.0     → waterfall, counterfactuals, confidence decomp
  │
  └── Response: GamePrediction
```

---

## Key Design Decisions

**No database in M1–M6:** All state is in-memory (user store, calibration store, ELO ratings). A production deployment would swap these for PostgreSQL via Prisma.

**Server-first rendering:** Pages use Server Components where possible. `'use client'` is added only where hooks or browser APIs are required.

**Calibration over raw accuracy:** The system tracks Brier score, log loss, and ECE in addition to winner accuracy. A 68% accurate well-calibrated model is preferred over 70% overconfident.

**Trigram search:** The search index uses trigram similarity (no external dependency). Replace with Algolia or Typesense for production.

---

## Data Flow

```
External APIs (Sportradar, SportsDataIO, The Odds API)
  └──→ JobQueue (background sync, exponential backoff, DLQ)
         └──→ In-memory cache (TTL-based)
                └──→ Provider adapters
                       └──→ Prediction engine
```

---

## Security Layers

1. **Middleware** (`src/middleware.ts` / `src/proxy.ts`): rate limiting + security headers on all routes
2. **Input validation** (`src/lib/security/validate.ts`): sanitize all user-controlled inputs
3. **Auth** (NextAuth v5): JWT-based sessions, Credentials provider
4. **Environment validation** (`src/lib/security/env.ts`): asserts required vars on startup
