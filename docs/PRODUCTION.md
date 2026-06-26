# EdgeAI — Production Deployment Guide

## Prerequisites

| Tool        | Version | Purpose                          |
|-------------|---------|----------------------------------|
| Node.js     | 20+     | Runtime                          |
| PostgreSQL  | 15+     | Persistent storage               |
| Redis       | 7+      | Distributed caching (optional)   |
| Prisma CLI  | 5+      | Database migrations              |

---

## Option A — Vercel (Recommended)

Vercel deploys automatically via Git push with zero-config Next.js support.

### 1. Install Prisma (if using PostgreSQL)

```bash
npm install prisma @prisma/client
npx prisma generate
```

### 2. Create a Vercel project

```bash
npm i -g vercel
vercel login
vercel --cwd edgeai
```

### 3. Set environment variables in Vercel dashboard

```
AUTH_SECRET          = <openssl rand -base64 32>
NEXTAUTH_URL         = https://your-app.vercel.app
DATABASE_URL         = postgresql://...   (Vercel Postgres, Neon, Supabase, Railway)
REDIS_URL            = redis://...        (Upstash — free tier available)
CRON_SECRET          = <openssl rand -hex 32>
ENGINE_ENABLED       = true
```

Optional (improves data quality, app runs without them):
```
SPORTS_DATA_IO_API_KEY  = ...   (sportsdata.io)
ODDS_API_KEY            = ...   (the-odds-api.com — 500 free req/month)
OPENWEATHERMAP_API_KEY  = ...   (openweathermap.org — free tier)
```

### 4. Run database migrations

```bash
npx prisma migrate deploy
```

Or connect to your DB and run:
```bash
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

### 5. Deploy

```bash
git push origin main
```

Vercel detects the push, builds, and deploys automatically. Cron jobs activate on the next schedule tick.

### Cron schedule (from vercel.json)

| Route                   | Schedule      | Purpose                              |
|-------------------------|---------------|--------------------------------------|
| `/api/cron/refresh`     | Every 15 min  | Refresh today's/tomorrow's game data |
| `/api/cron/predict`     | Every 2 hours | Generate predictions for new games   |
| `/api/cron/validate`    | Every hour    | Validate yesterday's completed games |

---

## Option B — Docker

### 1. Add standalone output to next.config.ts

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  output: 'standalone',
  // ... existing config
};
```

### 2. Create .env

```bash
cp .env.example .env
# Fill in required values
```

### 3. Start all services

```bash
docker compose up -d
```

This starts:
- **app** on port 3000
- **postgres** on port 5432  
- **redis** on port 6379
- **migrate** (one-shot migration job)

### 4. Verify health

```bash
curl http://localhost:3000/api/health
# {"status":"ok","services":{"database":{"status":"ok"},...}}
```

---

## Database Setup

### Schema migrations

```bash
# Development (creates migration files + applies)
npx prisma migrate dev --name init

# Production (applies existing migrations only)
npx prisma migrate deploy

# View migration status
npx prisma migrate status
```

### Seeding (optional)

The app ships with mock data — no DB seeding required for basic operation.

---

## Live Data Providers

### Free providers (no key required)

| Provider   | Data           | Rate limit        |
|------------|----------------|-------------------|
| ESPN API   | Schedules, scores, venues | No limit (unofficial) |
| Open-Meteo | Weather forecasts         | Unlimited (non-commercial) |

### Paid providers (key required, optional)

| Provider       | Data                          | Free tier         |
|----------------|-------------------------------|-------------------|
| SportsDataIO   | Team stats, injuries, history | Limited endpoints |
| The Odds API   | Betting lines, consensus odds | 500 req/month     |
| OpenWeatherMap | Weather                       | 60 calls/min      |

Set keys in `.env.local` (dev) or Vercel dashboard (prod). The app degrades gracefully when keys are missing — ESPN provides schedule/score coverage for all major sports at no cost.

---

## Health Monitoring

### Health endpoint

```
GET /api/health
```

Returns:
```json
{
  "status": "ok",           // ok | degraded | down
  "timestamp": "...",
  "version": "1.1.0",
  "uptimeSeconds": 3847,
  "services": {
    "database": { "status": "ok", "latencyMs": 4 },
    "cache": { "status": "ok", "latencyMs": 2 },
    "providers": {
      "espn": { "status": "ok", "latencyMs": 180 }
    }
  }
}
```

Returns **503** when `database.status = "down"`.

### Circuit breaker status

Monitor provider health at `/admin/monitor`. The dashboard shows each provider's circuit state, failure count, and last failure timestamp.

---

## Disaster Recovery

### DB backup

```bash
# Dump
pg_dump $DATABASE_URL > edgeai-$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < edgeai-20260628.sql
```

### Redis flush (clears all cache)

```bash
redis-cli -u $REDIS_URL FLUSHDB
```

This is safe — the app rebuilds the cache on next request.

### Rollback a deployment

```bash
# Vercel
vercel rollback

# Docker
docker compose down
docker compose up -d --no-build  # uses previous image tag
```

### Re-run migrations

```bash
npx prisma migrate reset  # WARNING: drops all data
npx prisma migrate deploy  # apply without resetting
```

---

## Performance Targets (Phase 8)

Run Lighthouse CI to verify:

```bash
npx lighthouse-ci autorun --collect.url=https://your-app.vercel.app
```

Target scores: Performance ≥95, Accessibility ≥95, Best Practices ≥95, SEO ≥95.

---

## Security Checklist

- [ ] `AUTH_SECRET` is set (≥32 bytes of entropy)
- [ ] `CRON_SECRET` is set (protects `/api/cron/*` from public access)
- [ ] Admin routes (`/admin/*`) protected by NextAuth session check
- [ ] `DATABASE_URL` uses SSL: `?sslmode=require`
- [ ] `NEXTAUTH_URL` matches production domain exactly
- [ ] `poweredByHeader: false` is set in next.config.ts (already done)
- [ ] HTTPS enforced (Vercel handles this automatically)
