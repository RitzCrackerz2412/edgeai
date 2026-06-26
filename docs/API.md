# EdgeAI — API Reference

All routes are prefixed with `/api`. JSON request/response unless noted.

---

## Predictions

### `POST /api/predict`

Generate a game prediction.

**Body:**
```json
{
  "sport": "NFL",
  "homeTeamId": "kc-chiefs",
  "awayTeamId": "buf-bills",
  "gameId": "optional-string"
}
```

**Response:** `GamePrediction` object including `homeWinProbability`, `confidence`, `explanation`, `factors`.

---

### `POST /api/simulate`

Run Monte Carlo simulation.

**Body:**
```json
{
  "sport": "NFL",
  "homeWinProbability": 0.62,
  "expectedHomeScore": 27,
  "expectedAwayScore": 21,
  "n": 10000,
  "seed": 42
}
```

**Response:** `SimulationResult` — `homeWins`, `awayWins`, `draws`, score distributions.

### `GET /api/simulate?sport=NFL&homeWinProbability=0.62`

Quick estimate without full simulation.

---

## Learning & Calibration

### `GET /api/learn`

Returns continuous learning status.

**Response:**
```json
{
  "totalSamples": 120,
  "samplesSinceRetrain": 45,
  "nextRetrainIn": 55,
  "snapshots": [{ "sport": "NFL", "version": 3, "sampleCount": 80, "timestamp": 1700000000000 }]
}
```

### `POST /api/learn`

Submit post-game result or trigger season reset.

**Body (post-game):**
```json
{
  "action": "postGame",
  "gameId": "g123",
  "sport": "NFL",
  "homeTeamId": "kc-chiefs",
  "awayTeamId": "buf-bills",
  "homeScore": 27,
  "awayScore": 21,
  "predictedHomeWinProb": 0.62
}
```

**Body (new season):**
```json
{ "action": "newSeason", "sport": "NFL" }
```

---

## Backtesting

### `GET /api/backtest`

Run backtest against stored validation samples.

**Response:** `BacktestResult` — accuracy, Brier, log loss, ECE, ROC-AUC, confidence buckets.

### `POST /api/backtest`

Run backtest against custom samples you provide.

**Body:**
```json
{
  "samples": [
    { "predictedProb": 0.65, "actualOutcome": 1, "sport": "NFL" }
  ]
}
```

---

## Sync

### `GET /api/sync`

Returns queue stats and dead-letter queue.

### `POST /api/sync`

Trigger a sync job.

**Body:**
```json
{ "type": "all" }
```

Valid types: `all`, `schedules`, `injuries`, `odds`, `standings`, or `retryDead` action.

---

## Notifications

### `GET /api/notifications`

Returns all notifications for the current user.

### `POST /api/notifications`

**Body (mark read):** `{ "action": "markRead", "id": "n123" }`
**Body (mark all):** `{ "action": "markAllRead" }`
**Body (delete):** `{ "action": "delete", "id": "n123" }`

---

## Search

### `GET /api/search/autocomplete?q=chiefs&type=team&limit=8`

Returns up to `limit` search results ranked by relevance.

**Response:**
```json
{
  "results": [
    { "id": "kc-chiefs", "type": "team", "title": "Kansas City Chiefs", "subtitle": "NFL · NFL", "url": "/team/kc-chiefs", "score": 0.82 }
  ],
  "query": "chiefs"
}
```

---

## Auth

### `GET|POST /api/auth/[...nextauth]`

NextAuth v5 handler — supports sign-in, sign-out, session, CSRF.

### `POST /api/auth/register`

**Body:** `{ "email": "...", "password": "...", "name": "..." }`

---

## Metrics

### `GET /api/metrics`

Returns system observability data: API latency percentiles, cache hit rate, provider health, queue stats, environment validation.

---

## User

### `GET /api/user/preferences`

Returns preferences for the authenticated user. Requires session.

### `POST /api/user/preferences`

Updates preferences (favorites, notifications, theme). Requires session.
