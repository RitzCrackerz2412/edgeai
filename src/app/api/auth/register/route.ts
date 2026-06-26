import { NextRequest, NextResponse } from 'next/server';
import { userStore } from '@/lib/auth/store';
import { isValidEmail, isValidPassword, sanitizeString } from '@/lib/security/validate';

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const email    = sanitizeString(String(body.email    ?? ''));
  const password = String(body.password ?? '');
  const name     = sanitizeString(String(body.name     ?? 'User'));

  if (!isValidEmail(email))    return NextResponse.json({ error: 'Invalid email address' },                 { status: 400 });
  if (!isValidPassword(password)) return NextResponse.json({ error: 'Password must be at least 8 characters and include a number' }, { status: 400 });
  if (name.length < 2)          return NextResponse.json({ error: 'Name must be at least 2 characters' },   { status: 400 });

  const result = await userStore.createUser(email, password, name);
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: 409 });

  return NextResponse.json({ success: true, userId: result.user.id }, { status: 201 });
}
