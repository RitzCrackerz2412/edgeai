# EdgeAI — Sports Intelligence Platform

> AI-powered game predictions, live probability tracking, and deep analytics across 13 professional sports.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Tests](https://img.shields.io/badge/Tests-104%20passing-22c55e)](./src/lib/engine/__tests__)
[![License](https://img.shields.io/badge/License-MIT-blue)](#license)

---

## Overview

EdgeAI is a full-stack sports analytics platform that combines statistical models with modern web engineering. It generates pre-game predictions using an ensemble of ELO ratings, logistic regression, and Monte Carlo simulation — then tracks accuracy over time with a calibrated backtesting pipeline.

The application runs without any paid API keys out of the box: ESPN's free public API and Open-Meteo's free weather service are the default data providers. Paid integrations (SportsDataIO, OpenWeatherMap, The Odds API) can be layered in for production-grade live data.

---

## Screenshots

> **Note:** Replace these placeholders with actual screenshots before publishing.

| Dashboard | Game Detail | Live Tracker |
|---|---|---|
| `[Screenshot: Home dashboard with game cards]` | `[Screenshot: Game detail with prediction breakdown]` | `[Screenshot: Live win probability chart]` |

| AI Analyst | Team Comparison | Accuracy Center |
|---|---|---|
| `[Screenshot: AI-generated game analysis report]` | `[Screenshot: Head-to-head team radar charts]` | `[Screenshot: Rolling accuracy chart]` |

---

## Features

### Predictions & Analysis
- **Pre-game predictions** — ensemble model combining ELO ratings, logistic regression, Monte Carlo simulation, and Bayesian probability
- **AI Analyst reports** — narrative game analysis with key matchups, risk factors, and confidence decomposition
- **Explainability** — waterfall charts and counterfactual "what-if" analysis for every prediction

### Live Intelligence
- **Live win probability** — real-time Markov chain simulation with per-quarter/per-period state tracking
- **Momentum tracking** — probability chart updates as the simulated game progresses

### Comparison Tools
- **Team comparison** — head-to-head analytics across offensive/defensive metrics
- **Player comparison** — career and season stats with radar charts and projected game lines
- **Draft & prospect analysis** — projected NBA/NFL draft tiers and upside ratings
- **Fantasy projections** — points projections with matchup-adjusted estimates

### Historical & Accuracy
- **Accuracy Center** — rolling accuracy by sport and confidence band, calibration curves
- **Prediction history** — full log of past predictions vs. actual results
- **Backtesting** — Brier score, log-loss, ROC-AUC, and ECE metrics across all recorded games

### Operations
- **Admin dashboard** — live observability (p50/p95/p99 latency, error rate, cache hit rate)
- **Monitoring panel** — provider health, job queue status, dead-letter queue inspection
- **Model dashboard** — feature importance, calibration diagnostics, dynamic model weights
- **Automated pipeline** — Vercel cron jobs refresh data, generate predictions, and validate completed games

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS, CSS custom properties |
| **Charts** | Recharts |
| **Icons** | Lucide React |
| **Auth** | NextAuth v5 (beta) |
| **Database** | PostgreSQL + Prisma ORM (optional) |
| **Cache** | Redis (optional) / in-process LRU |
| **Testing** | Vitest |
| **CI** | GitHub Actions |
| **Deployment** | Vercel (primary) / Docker |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js 16 App                        │
│                                                         │
│  Server Components ──► Page Rendering                   │
│  Client Components ──► Interactive UI                   │
│  API Routes        ──► /api/*                           │
│  Proxy (proxy.ts)  ──► Rate limiting + Security headers │
└──────────────────────────┬──────────────────────────────┘
                           │
           ┌───────────────┼────────────────┐
           │               │                │
    ┌──────▼──────┐  ┌─────▼──────┐  ┌─────▼──────┐
    │  Prediction  │  │  Data      │  │  Auth      │
    │  Engine      │  │  Providers │  │  (NextAuth)│
    │              │  │            │  │            │
    │  ELO         │  │  ESPN ─────┼► │  Sessions  │
    │  Logistic    │  │  SportsData│  │  PBKDF2    │
    │  MonteCarlo  │  │  OpenMeteo │  │  Rate limit│
    │  Bayesian    │  │  OWM       │  └────────────┘
    │  Ensemble    │  │  Odds API  │
    └──────────────┘  └─────┬──────┘
                            │
                     ┌──────▼──────┐
                     │  PostgreSQL  │
                     │  (optional) │
                     └─────────────┘
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full architecture document.

---

## Prerequisites

- **Node.js 20+**
- **npm 10+**

Optional (for full production functionality):
- PostgreSQL 15+
- Redis 7+
- SportsDataIO API key
- The Odds API key
- OpenWeatherMap API key

---

## Installation

```bash
# Clone the repository
git clone https://github.com/your-username/edgeai.git
cd edgeai

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

### Required in production

| Variable | Description | How to generate |
|---|---|---|
| `AUTH_SECRET` | NextAuth session signing key | `openssl rand -base64 32` |
| `CRON_SECRET` | Bearer token protecting cron endpoints | `openssl rand -hex 32` |
| `NEXTAUTH_URL` | Canonical app URL | Your deployment URL |
| `NEXT_PUBLIC_APP_URL` | Public URL for sitemap and links | Your deployment URL |

### Optional — Data providers

| Variable | Description |
|---|---|
| `SPORTS_DATA_IO_API_KEY` | [SportsDataIO](https://sportsdata.io) — live scores, schedules, injury reports |
| `ODDS_API_KEY` | [The Odds API](https://the-odds-api.com) — live betting lines (500 free req/month) |
| `OPENWEATHERMAP_API_KEY` | [OpenWeatherMap](https://openweathermap.org) — venue weather conditions |

### Optional — Infrastructure

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis URL (falls back to in-process LRU cache) |
| `ENGINE_ENABLED` | Set `true` to use live prediction engine output |

### Optional — Demo accounts (development only)

| Variable | Description |
|---|---|
| `DEMO_ADMIN_EMAIL` / `DEMO_ADMIN_PASSWORD` | Seeds a demo admin account |
| `DEMO_USER_EMAIL` / `DEMO_USER_PASSWORD` | Seeds a demo user account |

---

## Running Locally

```bash
# Development (with hot reload)
npm run dev

# Type checking
npm run typecheck

# Lint
npm run lint

# Tests
npm test

# Tests with coverage
npm run test:coverage

# Production build
npm run build
npm start
```

### With PostgreSQL (optional)

```bash
# Add DATABASE_URL to .env.local, then:
npm install prisma @prisma/client
npx prisma generate
npx prisma migrate dev
```

---

## Deployment

### Vercel (recommended)

1. Push to GitHub
2. Import the repository at [vercel.com/new](https://vercel.com/new)
3. Set environment variables in the Vercel dashboard:
   - `AUTH_SECRET`, `CRON_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL`
4. Deploy — Vercel auto-deploys on every push

Cron jobs are configured in `vercel.json` and activate automatically after deployment.

### Docker

```bash
# Add output: 'standalone' to next.config.ts, then:
docker compose up -d
```

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for full deployment instructions.

---

## Project Structure

```
edgeai/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (pages)/            # Dashboard, game, player, team, etc.
│   │   ├── admin/              # Admin dashboard + monitoring
│   │   ├── api/                # 20+ REST API endpoints
│   │   └── auth/               # Sign-in, registration
│   ├── components/
│   │   ├── analysis/           # Prediction UI (gauges, charts, factors)
│   │   ├── charts/             # Recharts wrappers
│   │   ├── layout/             # AppShell, Sidebar, TopBar, Breadcrumbs
│   │   └── ui/                 # Design system (Card, Badge, StatCard, etc.)
│   └── lib/
│       ├── engine/             # Prediction engine core (9 models)
│       ├── features/           # Sport-specific feature engineering
│       ├── providers/          # ESPN, SportsDataIO, weather adapters
│       ├── auth/               # NextAuth config + user store
│       ├── security/           # Rate limiting, headers, validation
│       ├── sync/               # Job queue + cron automation
│       └── observability/      # Metrics collection
├── prisma/schema.prisma        # 13-model database schema
├── docs/                       # Architecture, API, deployment docs
├── Dockerfile
├── docker-compose.yml
└── vercel.json
```

---

## Prediction Engine

The prediction engine (`src/lib/engine/`) combines five statistical approaches into a calibrated ensemble:

| Model | File | Description |
|---|---|---|
| **ELO** | `elo.ts` | Win probability from team rating differential |
| **Logistic Regression** | `logistic.ts` | Weighted feature vector classification |
| **Monte Carlo** | `montecarlo.ts` | Score distribution from 10,000+ simulated games |
| **Bayesian** | `ensemble.ts` | Prior belief updated with recent performance |
| **Similarity** | `similarity.ts` | Cosine-similar historical matchup lookup |

**Feature engineering** (`src/lib/features/`) extracts sport-specific vectors covering:
- Recent form (rolling averages over configurable windows)
- Home/away splits and rest advantages
- Head-to-head historical records
- Injury and lineup factors
- Weather conditions (outdoor sports)
- Betting market signals (when Odds API key is set)

**Calibration** — raw model outputs are calibrated with Platt scaling, bringing predicted probabilities in line with observed win rates across confidence bands.

**Continuous learning** — after each game completes, the validation pipeline records the outcome, updates calibration samples, and adjusts model weights using inverse-Brier score weighting.

**Backtesting** — the `/api/backtest` endpoint computes Brier score, log-loss, ROC-AUC, and expected calibration error (ECE) against all recorded validation games.

---

## Supported Sports

NFL · NBA · MLB · NHL · Soccer · NCAA Football · NCAA Basketball · UFC · Boxing · Tennis · Formula 1 · Cricket · Esports

---

## API Routes

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/predict` | Generate a game prediction |
| `POST` | `/api/simulate` | Run Monte Carlo simulation |
| `POST` | `/api/validate` | Submit game result for learning |
| `POST` | `/api/learn` | Trigger continuous learning update |
| `GET` | `/api/backtest` | Run backtesting metrics |
| `GET` | `/api/health` | Health check with service status |
| `GET` | `/api/metrics` | Observability data (admin only) |
| `GET/POST` | `/api/sync` | Data refresh queue (admin only) |
| `GET/POST` | `/api/notifications` | User notifications |
| `GET/PUT` | `/api/user/preferences` | User preference management |

Cron routes (`/api/cron/*`) are protected with `CRON_SECRET` and called by Vercel on schedule.

See [docs/API.md](docs/API.md) for full request/response schemas.

---

## Security

- **Password hashing** — PBKDF2-SHA512 with 100,000 iterations and a random per-password salt
- **Session auth** — NextAuth v5 with secure, httpOnly session cookies
- **Rate limiting** — per-IP limits by route tier (public / API / admin / auth)
- **Security headers** — CSP, HSTS, X-Frame-Options, Referrer-Policy in every response
- **Cron protection** — all `/api/cron/*` routes fail closed when `CRON_SECRET` is unset
- **Admin auth** — server-side session + role check on every admin route and API

---

## Live Demo

> **Coming soon** — deployment link will be added here.

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

## Credits

Built with [Next.js](https://nextjs.org), [Recharts](https://recharts.org), [NextAuth.js](https://authjs.dev), [Prisma](https://prisma.io), [Tailwind CSS](https://tailwindcss.com), and [Lucide](https://lucide.dev).

Sports data provided by [ESPN](https://www.espn.com) (free public API), [SportsDataIO](https://sportsdata.io), [The Odds API](https://the-odds-api.com), [Open-Meteo](https://open-meteo.com), and [OpenWeatherMap](https://openweathermap.org).
