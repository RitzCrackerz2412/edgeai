// Lazy Prisma client — only initializes when DATABASE_URL is set.
// Prisma is an optional runtime dependency; the app runs on mock data without it.
// Setup: npm install prisma @prisma/client && npx prisma generate && npx prisma migrate dev --name init

/* eslint-disable @typescript-eslint/no-explicit-any */

let _client: any = null;

export async function getDb(): Promise<any | null> {
  if (!process.env.DATABASE_URL) return null;
  if (_client !== null) return _client;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaClient } = require('@prisma/client');
    // Reuse connection across hot-reloads in development
    const g = globalThis as any;
    if (!g.__prismaClient) {
      g.__prismaClient = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
      });
    }
    _client = g.__prismaClient;
    return _client;
  } catch {
    console.warn(
      '[DB] @prisma/client not installed.\n' +
      '     Run: npm install prisma @prisma/client\n' +
      '     Then: npx prisma generate && npx prisma migrate dev --name init',
    );
    return null;
  }
}

export async function disconnectDb(): Promise<void> {
  if (_client) {
    await _client.$disconnect?.();
    _client = null;
    const g = globalThis as any;
    delete g.__prismaClient;
  }
}
