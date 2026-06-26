# EdgeAI — Deployment Guide

## Prerequisites

- Node.js ≥ 20.x
- npm ≥ 10.x
- (Production) PostgreSQL 15+ database
- (Production) Redis 7+ for session storage
- (Production) A `AUTH_SECRET` of at least 32 random characters

---

## Local Development

```bash
git clone <repo>
cd edgeai
npm install
cp .env.example .env.local   # fill in values
npm run dev
```

Visit `http://localhost:3000`.

Demo accounts are seeded automatically:
- `admin@edgeai.dev` / `admin123` (admin role)
- `demo@edgeai.dev` / `demo1234` (user role)

---

## Production Build

```bash
npm run build       # type-checks + compiles
npm run start       # starts production server on port 3000
```

Or with a custom port:
```bash
PORT=8080 npm run start
```

---

## Vercel Deployment (recommended)

1. Push to GitHub
2. Import repo in Vercel dashboard
3. Set environment variables (see `docs/ENVIRONMENT.md`)
4. Deploy — Vercel auto-detects Next.js

Edge middleware (rate limiting + security headers) runs automatically on Vercel's edge network.

---

## Docker

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
EXPOSE 3000
CMD ["npm", "start"]
```

---

## Health Check

`GET /api/metrics` returns HTTP 200 when the server is running and environment is valid.

Recommended probe: `curl -f http://localhost:3000/api/metrics`

---

## Upgrading

1. `npm outdated` — identify stale packages
2. Update `next` first: `npm install next@latest react@latest react-dom@latest`
3. Check `docs/TROUBLESHOOTING.md` for known upgrade issues
4. Run `npm run build` to verify
