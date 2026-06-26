# Changelog

All notable changes to EdgeAI are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [2.1.0] — 2026-06-26

### Security (critical)
- Replaced SHA-256 single-pass password hashing with PBKDF2-SHA512 (100k iterations, random salt per password)
- Removed hardcoded demo credentials from source — now controlled by optional `DEMO_ADMIN_EMAIL`/`DEMO_USER_EMAIL` env vars
- `AUTH_SECRET` throws at module load in production when unset — prevents running without a secure session secret
- Cron endpoints (`/api/cron/*`) now fail-closed: deny ALL requests when `CRON_SECRET` is unset (was fail-open)
- Admin layout (`/app/admin/layout.tsx`) is now an async Server Component with session + role checks; unauthenticated/non-admin users are redirected
- Notifications IDOR fixed: `userId` derived from server session, not query string
- `/api/metrics`, `/api/sync`, `/api/backtest` now require an authenticated admin session
- Demo credential hint removed from sign-in page; hardcoded email removed from admin UI

### Added
- Loading skeletons for admin, settings, compare, accuracy, search, and game/analyst routes
- Skip-to-content link in root layout targeting `#main-content` for keyboard accessibility
- `aria-label="User menu"` on the TopBar user button
- Route-level `metadata` exports via sibling `layout.tsx` files for: admin, settings, auth, live, compare
- `DEMO_ADMIN_EMAIL`, `DEMO_ADMIN_PASSWORD`, `DEMO_USER_EMAIL`, `DEMO_USER_PASSWORD` env vars for optional demo account seeding
- `CHANGELOG.md`, `RELEASE_NOTES.md`, `VERSION`, `docs/DEPLOYMENT_CHECKLIST.md`
- `htmlFor`/`id` wiring on compare player and team selectors for screen reader accessibility
- `aria-label` on search page text input

### Changed
- `src/middleware.ts` renamed to `src/proxy.ts`; exported function renamed from `middleware` to `proxy` (Next.js 16 convention)
- Redis cache stub returns null/no-op instead of throwing — app falls back to in-memory cache transparently
- Pipeline debug `console.log` calls guarded behind `process.env.NODE_ENV !== 'production'`
- `CRON_SECRET` added to production-required env var list in `src/lib/security/env.ts`
- `RollingAccuracyChart` seeded noise replaces `Math.random()`, result wrapped in `useMemo`
- All `// TODO:` comments in `api.ts`, `playerData.ts`, and provider files converted to descriptive notes
- Sitemap base URL checks `NEXT_PUBLIC_APP_URL` before `NEXTAUTH_URL`
- Docker healthcheck uses `wget --spider` instead of curl (present in Alpine)
- `package.json` lint script fixed: `eslint` → `eslint src/`

### Fixed
- 9 ESLint errors: `prefer-const` (montecarlo), `no-unescaped-entities` (compare/players), `set-state-in-effect` (6 occurrences), `purity` (NotificationBell)
- `RollingAccuracyChart` Recharts `formatter` type error: `ValueType | undefined` handled correctly
- `pipeline.ts` `EnginePrediction` field access: uses `ensemble.homeWinProbability` / `ensemble.confidence`
- `espn.ts` `flatMap` type inference: replaced `map().filter()` with `flatMap(ev => [...])` returning `RawGame[]`
- `/api/learn` route: replaced `as never` cast with correct `ValidationRecord | undefined` type

---

## [1.1.0] — 2026-06-25

### Added
- PostgreSQL/Prisma schema with 13 models (User, Game, Prediction, ValidationResult, CalibrationRecord, etc.)
- Lazy Prisma client (`getDb()`) using `require('@prisma/client')` in try/catch — no hard dependency
- ESPN public API adapter (no key required) with circuit breaker
- Open-Meteo free weather adapter (no key required) with 17 venue coordinates
- SportsDataIO paid sports adapter with provider failover
- OpenWeatherMap paid weather adapter with provider failover
- Circuit breaker pattern: `closed → open → half-open → closed`
- Composite provider pattern: ESPN → SportsDataIO, OpenMeteo → OpenWeatherMap
- Prediction automation pipeline: `fetchAndPredict`, `validateCompleted`, `runPredictionBatch`, `runValidationBatch`
- Vercel cron jobs: refresh (*/15 min), predict (every 2h), validate (every 1h)
- Health endpoint at `/api/health` returning `{status, timestamp, version, uptimeSeconds, services}`
- Docker multi-stage build (Node 20 Alpine) + docker-compose with postgres and redis
- GitHub Actions CI: typecheck → lint → test → build → Lighthouse CI
- Enhanced Accuracy Center with sport/period filters, rolling accuracy chart, model version comparison table
- `docs/PRODUCTION.md` covering Vercel + Docker deployment, provider setup, health monitoring

### Changed
- `src/app/accuracy/page.tsx` accepts `searchParams: Promise<{sport?, period?}>` for URL-based filtering
- `AccuracyFilters` extracted as a client component using `useRouter`
- `RollingAccuracyChart` extracted as a client component with Recharts LineChart

---

## [1.0.0] — 2026-06-20 (Feature Complete)

### Added
- 19 App Router routes across games, teams, players, predictions, accuracy, admin, live, compare, search
- Prediction engine: ELO rating system + Logistic Regression ensemble
- Model validation and calibration stores
- In-memory LRU cache with TTL
- Data quality logger and validation pipeline
- Full mock data layer (games, teams, players, predictions, accuracy stats)
- Dark-mode sports analytics UI: sidebar nav, TopBar, stat cards, charts, tables
- Framer Motion page transitions and micro-animations
- Recharts integration: bar charts, line charts, radar charts
- Responsive mobile layout
- 104 unit/integration tests (all passing)
