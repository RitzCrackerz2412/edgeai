# EdgeAI v2.1.0 — Release Notes

**June 26, 2026**

---

## Overview

EdgeAI v2.1.0 is the production-ready release of the sports intelligence platform. The v1.1.0 release established production infrastructure (database, cron jobs, live data providers, Docker). This release focuses exclusively on security hardening, stability, accessibility, and deployment readiness — no new features.

---

## What's in this release

### Security (8 critical fixes)
- **Password hashing**: SHA-256 single-pass → PBKDF2-SHA512 with 100,000 iterations and a random per-password salt
- **Credential management**: Hardcoded demo accounts removed from source — seeded only via optional `DEMO_ADMIN_EMAIL`/`DEMO_USER_EMAIL` environment variables
- **Session secrets**: `AUTH_SECRET` is required in production; app refuses to start without it
- **Cron endpoint protection**: All `/api/cron/*` routes deny every request when `CRON_SECRET` is unset (fail-closed)
- **Admin route guard**: Admin layout validates session and role server-side; unauthenticated users are redirected to sign in
- **IDOR fix**: Notifications endpoint derives user ID from the server session, not the query string
- **Admin API auth**: `/api/metrics`, `/api/sync`, `/api/backtest` require an authenticated admin session
- **Demo hints removed**: Sign-in page and admin UI no longer hint at default credentials

### Accessibility
- Skip-to-content link visible on keyboard focus, targeting `#main-content` in the app shell
- Form labels properly wired to inputs via `htmlFor`/`id` on compare pages and search
- Icon-only buttons (user menu, notification bell) have `aria-label` attributes
- All route segments export `<title>` and `<description>` metadata

### Loading States
Six routes now show skeleton screens while data loads:
- Admin dashboard, Settings, Compare (teams and players), Accuracy Center, Search, AI Analyst

### Infrastructure
- `middleware.ts` renamed to `proxy.ts` (Next.js 16 convention)
- Docker healthcheck uses `wget --spider` (pre-installed in Alpine)
- Sitemap uses `NEXT_PUBLIC_APP_URL` before `NEXTAUTH_URL`

### Code Quality
- 9 ESLint errors fixed (0 errors, 75 warnings)
- All `TODO:` comments converted or removed

---

## Required environment variables

| Variable | Notes |
|---|---|
| `AUTH_SECRET` | App refuses to start without this in production. Generate: `openssl rand -base64 32` |
| `CRON_SECRET` | Cron routes deny all requests if unset. Generate: `openssl rand -hex 32` |
| `NEXTAUTH_URL` | Canonical app URL — required for NextAuth redirects |
| `NEXT_PUBLIC_APP_URL` | Public URL used in sitemap and client links |

---

## Deployment

See [docs/DEPLOYMENT_CHECKLIST.md](docs/DEPLOYMENT_CHECKLIST.md) for the full pre-launch checklist.

**Minimum viable deployment (Vercel, no paid APIs):**
1. Deploy to Vercel
2. Set `AUTH_SECRET`, `CRON_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL` in Vercel environment variables
3. Done — ESPN (free) and Open-Meteo (free) are active as default providers

**Full production deployment:**
- Add `DATABASE_URL` (PostgreSQL) and run `npx prisma migrate deploy`
- Add `SPORTS_DATA_IO_API_KEY` for live scores and schedules
- Add `OPENWEATHERMAP_API_KEY` for venue weather
- Add `ODDS_API_KEY` for betting lines
- Optionally add `REDIS_URL` for distributed caching

---

## Known limitations

- All predictions use mock game data until `ENGINE_ENABLED=true` and a sports API key is configured
- Player and team pages show static data until live provider keys are set
- CSP `unsafe-eval` included for Next.js compatibility — tighten after confirming production builds don't require eval
