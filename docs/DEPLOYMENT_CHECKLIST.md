# Deployment Checklist — EdgeAI v2.1.0

Use this checklist before every production deployment. Check each item manually.

---

## Pre-deployment

### Code
- [ ] `npm run build` completes with no errors
- [ ] `npm run typecheck` passes (zero TypeScript errors)
- [ ] `npm run lint` passes (zero ESLint errors)
- [ ] `npm test` passes (all 104+ tests green)
- [ ] No `console.log` calls outside dev-mode guards in `src/lib/`
- [ ] No hardcoded secrets or API keys in source files

### Environment variables
Set these in Vercel (or your platform's secret manager):

| Variable | Required | Notes |
|---|---|---|
| `AUTH_SECRET` | **Yes** | `openssl rand -base64 32`. App throws on boot without this. |
| `CRON_SECRET` | **Yes** | `openssl rand -hex 32`. Cron endpoints deny all requests if unset. |
| `NEXT_PUBLIC_APP_URL` | **Yes** | Your deployment URL, e.g. `https://edgeai.vercel.app` |
| `NEXTAUTH_URL` | **Yes** | Same as above — required by NextAuth for redirects. |
| `DATABASE_URL` | Optional | PostgreSQL connection string. Omit to run without DB. |
| `SPORTS_DATA_IO_API_KEY` | Optional | Enables live scores/schedules fallback. |
| `OPENWEATHERMAP_API_KEY` | Optional | Enables venue weather. |
| `ODDS_API_KEY` | Optional | Enables betting lines. |
| `REDIS_URL` | Optional | Enables distributed cache. Omit to use in-memory LRU. |
| `ENGINE_ENABLED` | Optional | Set `true` to merge engine predictions into game objects. |
| `DEMO_ADMIN_EMAIL` + `DEMO_ADMIN_PASSWORD` | Optional | Seeds a demo admin account. **Omit in production.** |
| `DEMO_USER_EMAIL` + `DEMO_USER_PASSWORD` | Optional | Seeds a demo user account. **Omit in production.** |

### Database (if using PostgreSQL)
- [ ] `DATABASE_URL` points to a running PostgreSQL 15+ instance
- [ ] `npx prisma migrate deploy` ran successfully against the production DB
- [ ] DB has at least 1 GB free space
- [ ] Connection pooling configured (PgBouncer or Vercel's built-in pooler)

---

## Vercel deployment

1. Push to `main` (or the branch you've connected to Vercel)
2. Wait for build to complete in the Vercel dashboard
3. Verify the deployment URL loads without errors
4. Check the Functions log for any import errors at cold start

### Cron jobs (Vercel)
Cron jobs are defined in `vercel.json`. After deployment:
- [ ] `/api/cron/refresh` — triggers every 15 min, fetches today/tomorrow schedules
- [ ] `/api/cron/predict` — triggers every 2h, runs prediction batch
- [ ] `/api/cron/validate` — triggers every 1h, validates completed games

To test manually (replace `<SECRET>` with your `CRON_SECRET`):
```bash
curl -H "Authorization: Bearer <SECRET>" https://your-app.vercel.app/api/cron/refresh
```

---

## Docker deployment

```bash
# Build
docker build -t edgeai:2.1.0 .

# Run with env file
docker run -p 3000:3000 --env-file .env.production edgeai:2.1.0

# Or with docker-compose (includes Postgres + Redis)
docker-compose up -d
docker-compose exec app npx prisma migrate deploy
```

Required in `next.config.ts` for Docker:
```typescript
output: 'standalone'
```

---

## Post-deployment smoke tests

Run these against the live URL after each deployment:

### Health check
```bash
curl https://your-app.vercel.app/api/health
# Expected: {"status":"ok",...} or {"status":"degraded",...} with 200
# Failing: {"status":"down"} with 503
```

### Key pages
- [ ] `/` — Dashboard loads, game cards visible
- [ ] `/predictions` — Prediction list loads
- [ ] `/accuracy` — Accuracy page with chart loads
- [ ] `/admin` — Admin dashboard loads (no auth required in RC1)
- [ ] `/search?q=NFL` — Search returns results
- [ ] `/live` — Live tracker loads without errors

### Accessibility
- [ ] Tab through the home page — skip-to-content link appears on first Tab press
- [ ] All focus rings are visible
- [ ] Page title changes on navigation (check browser tab)

### Performance
- [ ] Run Lighthouse on home page — Performance ≥ 90, Accessibility ≥ 95
- [ ] No layout shift (CLS < 0.1)
- [ ] First Contentful Paint < 2s on 4G throttling

---

## Rollback procedure

**Vercel:** Select the previous deployment in the dashboard → "Promote to Production"

**Docker:**
```bash
docker-compose down
docker run -p 3000:3000 --env-file .env.production edgeai:<previous-version>
```

**Database:** Keep a snapshot before running migrations. Restore with:
```bash
pg_restore -d $DATABASE_URL backup.dump
```

---

## Known limitations

- Predictions use mock data unless `ENGINE_ENABLED=true` and sports API keys are set
- Player/team pages show static mock data until live provider keys are configured
- CSP `unsafe-eval` directive is present for Next.js compatibility; tighten after verifying no eval is needed in production builds
