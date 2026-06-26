import type { MetadataRoute } from 'next';
import { TEAM_DETAILS } from '@/lib/teamData';
import { PLAYER_DETAILS } from '@/lib/playerData';

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? 'https://edgeai.example.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE,             lastModified: new Date(), changeFrequency: 'hourly',  priority: 1.0 },
    { url: `${BASE}/search`, lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.6 },
    { url: `${BASE}/accuracy`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE}/history`,  lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE}/team`,     lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE}/player`,   lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
  ];

  const teamRoutes: MetadataRoute.Sitemap = Object.keys(TEAM_DETAILS).map(id => ({
    url: `${BASE}/team/${id}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.75,
  }));

  const playerRoutes: MetadataRoute.Sitemap = Object.keys(PLAYER_DETAILS).map(id => ({
    url: `${BASE}/player/${id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [...staticRoutes, ...teamRoutes, ...playerRoutes];
}
