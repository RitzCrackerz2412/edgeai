# EdgeAI — Environment Variables

Copy `.env.example` to `.env.local` for local development. In production, set these as platform environment variables (never commit secrets).

---

## Required in Production

| Variable | Description |
|---|---|
| `AUTH_SECRET` | Random string ≥ 32 chars for JWT signing. Generate with `openssl rand -base64 32`. |
| `NEXTAUTH_URL` | Full base URL of the app, e.g. `https://edgeai.example.com`. |

---

## Optional — Data Providers

| Variable | Provider | Notes |
|---|---|---|
| `SPORTS_DATA_API_KEY` | SportsDataIO | Schedules, standings |
| `SPORTRADAR_API_KEY` | Sportradar | Player stats, injuries, advanced metrics |
| `ODDS_API_KEY` | The Odds API | Betting lines, spreads |
| `WEATHER_API_KEY` | OpenWeatherMap | Outdoor game weather |
| `FANTASY_DATA_API_KEY` | FantasyData | Fantasy-relevant player stats |

Missing optional keys are logged as warnings at startup (not errors). The app runs with mock data when they are absent.

---

## Optional — Infrastructure

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | (none) | PostgreSQL connection string. Required for persisted user accounts and prediction history. |
| `REDIS_URL` | (none) | Redis connection string. Required for distributed rate limiting and session storage. |
| `NODE_ENV` | `development` | Set `production` in prod. |
| `PORT` | `3000` | HTTP port. |

---

## Example `.env.local`

```bash
# Required in production
AUTH_SECRET=replace-with-32-plus-random-chars
NEXTAUTH_URL=http://localhost:3000

# Optional: data providers
# SPORTRADAR_API_KEY=
# ODDS_API_KEY=
# WEATHER_API_KEY=

# Optional: infrastructure
# DATABASE_URL=postgresql://user:pass@localhost:5432/edgeai
# REDIS_URL=redis://localhost:6379
```

---

## Validation

`src/lib/security/env.ts` validates environment on startup:
- In production, missing `AUTH_SECRET` or `NEXTAUTH_URL` throws and prevents the server from starting.
- Missing optional keys are surfaced as warnings in `/api/metrics` and `/admin/monitor`.
