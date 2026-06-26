/**
 * Next.js proxy — runs before every request.
 *
 * Responsibilities:
 *  1. Apply HTTP security headers
 *  2. Rate limiting per IP and route tier
 *  3. Auth checks for protected routes (/admin/*)
 *
 * Note: We do NOT call auth() here in proxy (it adds latency).
 * Instead, admin pages check the session server-side. The proxy
 * only handles the unauthenticated redirect for /admin routes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { SECURITY_HEADERS, REMOVE_HEADERS } from '@/lib/security/headers';
import { checkRateLimit, rateLimitHeaders, getIp, type RateLimitTier } from '@/lib/security/rateLimit';

// ── Route tier mapping ────────────────────────────────────────────────────────

function getTier(pathname: string): RateLimitTier {
  if (pathname.startsWith('/api/auth')) return 'auth';
  if (pathname.startsWith('/admin'))    return 'admin';
  if (pathname.startsWith('/api/'))     return 'api';
  return 'public';
}

// ── Proxy ─────────────────────────────────────────────────────────────────────

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ip = getIp(req);

  // 1. Rate limit
  const tier = getTier(pathname);
  const rl = checkRateLimit(ip, tier);

  if (!rl.allowed) {
    return new NextResponse(
      JSON.stringify({ error: 'Too many requests', retryAfter: rl.resetInSeconds }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          ...rateLimitHeaders(rl),
        },
      },
    );
  }

  // 2. Continue — apply security headers to the response
  const response = NextResponse.next();

  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  for (const key of REMOVE_HEADERS) {
    response.headers.delete(key);
  }

  // Apply rate limit headers even for successful responses
  for (const [key, value] of Object.entries(rateLimitHeaders(rl))) {
    response.headers.set(key, value);
  }

  return response;
}

export const config = {
  // Run on all routes except Next.js internals and static files
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
};
