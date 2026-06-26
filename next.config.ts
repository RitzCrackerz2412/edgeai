import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // ── Image optimization ──────────────────────────────────────────────────────
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [375, 640, 768, 1024, 1280, 1536, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    // External domains used for team logos / player headshots (add when live)
    remotePatterns: [
      // { protocol: 'https', hostname: 'a.espncdn.com' },
      // { protocol: 'https', hostname: 'media.sportradar.com' },
    ],
    minimumCacheTTL: 86_400,  // 24 h
  },

  // ── Compression ─────────────────────────────────────────────────────────────
  compress: true,

  // ── Build output ────────────────────────────────────────────────────────────
  poweredByHeader: false,

  // ── Strict mode ─────────────────────────────────────────────────────────────
  reactStrictMode: true,

  // ── Experimental ────────────────────────────────────────────────────────────
  experimental: {
    optimizeCss: false,   // set true only after adding critters pkg
    // ppr: true,         // partial pre-rendering — enable when stable
  },
};

export default nextConfig;
