import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Admin',
  description: 'EdgeAI administration — system health, model management, and data sync controls.',
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Server-side guard: require an authenticated admin session.
  try {
    const { auth } = await import('@/lib/auth/config');
    const session = await auth();
    if (!session?.user) {
      redirect('/auth/signin?callbackUrl=/admin');
    }
    if (session.user.role !== 'admin') {
      redirect('/?error=forbidden');
    }
  } catch (err: unknown) {
    // In development with no AUTH_SECRET configured, allow access so the dev
    // workflow isn't blocked. Never permit this in production.
    if (process.env.NODE_ENV === 'production') throw err;
  }

  return <>{children}</>;
}
