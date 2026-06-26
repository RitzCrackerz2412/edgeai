/**
 * GET  /api/user/preferences   — return current user's preferences
 * POST /api/user/preferences   — update preferences
 *
 * Requires a valid session (NextAuth v5).
 * Falls back gracefully when no auth is configured (dev mode).
 */

import { NextRequest, NextResponse } from 'next/server';
import { userStore } from '@/lib/auth/store';

async function getSession() {
  try {
    const { auth } = await import('@/lib/auth/config');
    return auth();
  } catch {
    return null;
  }
}

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await userStore.getUserById(session.user.id);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  return NextResponse.json({ preferences: user.preferences });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const ok = await userStore.updatePreferences(session.user.id, body as Parameters<typeof userStore.updatePreferences>[1]);
  if (!ok) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const updated = await userStore.getUserById(session.user.id);
  return NextResponse.json({ success: true, preferences: updated?.preferences ?? {} });
}
