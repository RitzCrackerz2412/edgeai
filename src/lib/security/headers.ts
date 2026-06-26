/**
 * HTTP security headers.
 *
 * Applied in middleware for every response.
 * Values are conservative defaults — tighten CSP once the UI stabilizes.
 */

export const SECURITY_HEADERS: Record<string, string> = {
  // Prevent MIME-type sniffing
  'X-Content-Type-Options': 'nosniff',

  // Deny framing (clickjacking protection)
  'X-Frame-Options': 'DENY',

  // Stops browsers from performing DNS prefetch
  'X-DNS-Prefetch-Control': 'off',

  // No referrer outside the origin
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Permissions policy: deny most powerful APIs
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',

  // Force HTTPS (only meaningful in prod)
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',

  // Content Security Policy
  // Permits: same-origin scripts, inline styles (Tailwind), Next.js eval for dev,
  // data: images (SVG logos), fonts from Google
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // 'unsafe-eval' needed for Next.js dev
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
  ].join('; '),
};

/** Remove headers that could leak server/framework information */
export const REMOVE_HEADERS = ['X-Powered-By', 'Server'];
