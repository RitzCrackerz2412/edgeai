# EdgeAI — Troubleshooting

---

## Build fails: "middleware file convention is deprecated"

Next.js 16 renamed `src/middleware.ts` to `src/proxy.ts`. If you see this warning, rename the file:

```bash
mv src/middleware.ts src/proxy.ts
```

Update any `export const config` matchers accordingly.

---

## Auth: "CLIENT_FETCH_ERROR" or session always null

1. Verify `AUTH_SECRET` is set (≥ 32 chars) in your `.env.local`.
2. Verify `NEXTAUTH_URL` matches the URL you're accessing (including port).
3. Clear cookies and retry.
4. In dev: hard restart with `rm -rf .next && npm run dev`.

---

## Auth: Registration returns 409

The email is already registered. Use a different address or reset with the demo seed accounts:
- `admin@edgeai.dev` / `admin123`
- `demo@edgeai.dev` / `demo1234`

---

## Search: autocomplete returns empty results

The search index is populated lazily on first request. If no team/player data files exist at `src/lib/teamData.ts` or `src/lib/playerData.ts`, results will be empty.

Verify the exports exist:
```bash
grep "TEAM_DETAILS\|PLAYER_DETAILS" src/lib/teamData.ts src/lib/playerData.ts
```

---

## TypeScript: "Cannot find module 'next-auth'"

Install the beta version:
```bash
npm install next-auth@beta
```

The stable `next-auth@4` has a different API. EdgeAI uses v5 (beta).

---

## Rate limiting: 429 Too Many Requests

The in-memory token bucket resets every 60 seconds. Limits by tier:
- `api` — 100 req/60 s
- `auth` — 10 req/60 s
- `admin` — 50 req/60 s
- `public` — 200 req/60 s

In dev mode, you can temporarily raise these in `src/lib/security/rateLimit.ts`.

---

## Sync queue: jobs never complete

The job queue requires `queue.start()` to be called. In the current in-memory implementation this happens when `/api/sync` is first accessed. Background processing runs in the same Node.js process — it will not survive a serverless cold start.

For production, move sync jobs to a dedicated worker process or a service like Inngest or Trigger.dev.

---

## Metrics show 0 samples / empty providers

`MetricsStore` is in-memory and starts empty on each cold boot. It accumulates samples only from live traffic. In development, make a few API requests and then reload `/admin/monitor` to see data.

---

## Tests fail after changing calibration API

`CalibrationStore` uses `add({ rawProbability, outcome, modelName, gameId })` — not `addSample()`. If you see `addSample is not a function`, check for stale imports.

---

## Recharts formatter TypeScript error

Use `unknown` for Recharts formatter parameters:
```typescript
formatter={(v: unknown, name: unknown) => [`${(v as number) * 100}%`, String(name)]}
```

---

## `npx next build` crashes with heap OOM

Increase Node.js heap:
```bash
NODE_OPTIONS=--max-old-space-size=4096 npx next build
```
