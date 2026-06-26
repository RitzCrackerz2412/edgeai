/**
 * GET  /api/notifications         — list the session user's notifications
 * POST /api/notifications         — mark read / delete
 *
 * userId is always derived from the server session — never from the request body
 * or query string — to prevent IDOR (accessing another user's notifications).
 */

import { NextRequest, NextResponse } from 'next/server';
import { notificationStore } from '@/lib/notifications/store';
import { isValidId } from '@/lib/security/validate';

async function getSessionUserId(): Promise<string | null> {
  try {
    const { auth } = await import('@/lib/auth/config');
    const session = await auth();
    return session?.user?.id ?? null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const unreadOnly = req.nextUrl.searchParams.get('unreadOnly') === 'true';
  const notifications = unreadOnly
    ? notificationStore.getUnread(userId)
    : notificationStore.getAll(userId);

  return NextResponse.json({
    notifications,
    unreadCount: notificationStore.unreadCount(userId),
  });
}

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const action = String(body.action ?? '');

  if (action === 'markAllRead') {
    const count = notificationStore.markAllRead(userId);
    return NextResponse.json({ marked: count });
  }

  if (action === 'markRead') {
    const notifId = String(body.notificationId ?? '');
    if (!isValidId(notifId)) return NextResponse.json({ error: 'Invalid notificationId' }, { status: 400 });
    const ok = notificationStore.markRead(userId, notifId);
    return ok
      ? NextResponse.json({ success: true })
      : NextResponse.json({ error: 'Notification not found' }, { status: 404 });
  }

  if (action === 'delete') {
    const notifId = String(body.notificationId ?? '');
    if (!isValidId(notifId)) return NextResponse.json({ error: 'Invalid notificationId' }, { status: 400 });
    const ok = notificationStore.delete(userId, notifId);
    return ok
      ? NextResponse.json({ success: true })
      : NextResponse.json({ error: 'Notification not found' }, { status: 404 });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
