/**
 * NextAuth v5 configuration.
 *
 * Authentication strategy:
 *  - Credentials provider for email/password (demo + local dev)
 *  - In-memory user store (swap for DB in production)
 *  - Roles: 'user' | 'admin'
 *
 * To add OAuth providers (Google, GitHub):
 *  1. npm install @auth/core
 *  2. Add provider entries from https://authjs.dev/reference/core/providers
 *  3. Set GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET in .env.local
 */

import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { userStore } from './store';
import { isValidEmail, isValidPassword } from '@/lib/security/validate';

declare module 'next-auth' {
  interface User { role?: 'user' | 'admin' }
  interface Session { user: { id: string; email: string; name?: string; role: 'user' | 'admin' } }
}

if (process.env.NODE_ENV === 'production' && !process.env.AUTH_SECRET) {
  throw new Error('AUTH_SECRET environment variable is required in production. Generate one with: openssl rand -base64 32');
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET ?? 'dev-only-secret-not-for-production',
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 }, // 30 days

  providers: [
    Credentials({
      name: 'Email & Password',
      credentials: {
        email:    { label: 'Email',    type: 'email'    },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? '');
        const password = String(credentials?.password ?? '');

        if (!isValidEmail(email) || !isValidPassword(password)) return null;

        const user = await userStore.verifyCredentials(email, password);
        if (!user) return null;

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],

  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id   = user.id;
        token.role = (user as { role?: string }).role ?? 'user';
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id   = token.id as string;
        session.user.role = (token.role ?? 'user') as 'user' | 'admin';
      }
      return session;
    },
  },

  pages: {
    signIn: '/auth/signin',
    error:  '/auth/error',
  },
});
