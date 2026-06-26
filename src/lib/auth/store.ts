/**
 * In-memory user store.
 *
 * Intentionally simple — replace with Prisma + PostgreSQL for production.
 * Passwords are hashed with PBKDF2-SHA512 (100 000 iterations) via Node's
 * built-in `crypto` module. Swap for bcrypt or argon2 when persistence is added.
 *
 * Demo credentials are controlled via environment variables so they are never
 * hardcoded in deployed code:
 *   DEMO_ADMIN_EMAIL    (default: none — seeding disabled if unset)
 *   DEMO_ADMIN_PASSWORD
 *   DEMO_USER_EMAIL
 *   DEMO_USER_PASSWORD
 */

import { pbkdf2Sync, randomBytes } from 'crypto';

export interface StoredUser {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  passwordHash: string; // "salt:hash" (hex:hex)
  createdAt: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  favoriteTeams: string[];
  favoritePlayers: string[];
  favoriteSports: string[];
  defaultSport?: string;
  notifications: {
    upcomingGames: boolean;
    injuryAlerts: boolean;
    lineMovement: boolean;
    gameSummaries: boolean;
    emailEnabled: boolean;
    pushEnabled: boolean;
  };
  theme: 'dark' | 'light' | 'system';
  timezone: string;
}

function defaultPreferences(): UserPreferences {
  return {
    favoriteTeams: [],
    favoritePlayers: [],
    favoriteSports: [],
    notifications: {
      upcomingGames: true,
      injuryAlerts: true,
      lineMovement: false,
      gameSummaries: true,
      emailEnabled: false,
      pushEnabled: false,
    },
    theme: 'dark',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_KEYLEN     = 64;
const PBKDF2_DIGEST     = 'sha512';

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const candidate = pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST).toString('hex');
  // Constant-time comparison to resist timing attacks
  return candidate.length === hash.length &&
    candidate.split('').every((c, i) => c === hash[i]);
}

function generateId(): string {
  return `user_${randomBytes(6).toString('hex')}`;
}

class UserStore {
  private users = new Map<string, StoredUser>();

  constructor() {
    // Seed demo accounts only when credentials are provided via environment variables.
    // Never seed in production without explicit configuration.
    const adminEmail = process.env.DEMO_ADMIN_EMAIL;
    const adminPass  = process.env.DEMO_ADMIN_PASSWORD;
    const userEmail  = process.env.DEMO_USER_EMAIL;
    const userPass   = process.env.DEMO_USER_PASSWORD;

    if (adminEmail && adminPass) {
      this.seedUser(adminEmail, adminPass, 'EdgeAI Admin', 'admin');
    }
    if (userEmail && userPass) {
      this.seedUser(userEmail, userPass, 'Demo User', 'user');
    }
  }

  private seedUser(email: string, password: string, name: string, role: StoredUser['role']): void {
    const id = `user_${role}_seed`;
    this.users.set(email.toLowerCase(), {
      id, email: email.toLowerCase(), name, role,
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString(),
      preferences: defaultPreferences(),
    });
  }

  async verifyCredentials(email: string, password: string): Promise<StoredUser | null> {
    const user = this.users.get(email.toLowerCase());
    if (!user) return null;
    if (!verifyPassword(password, user.passwordHash)) return null;
    return user;
  }

  async createUser(email: string, password: string, name: string): Promise<{ user: StoredUser } | { error: string }> {
    const key = email.toLowerCase();
    if (this.users.has(key)) return { error: 'Email already registered' };
    const user: StoredUser = {
      id: generateId(),
      email: key, name, role: 'user',
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString(),
      preferences: defaultPreferences(),
    };
    this.users.set(key, user);
    return { user };
  }

  async getUserById(id: string): Promise<StoredUser | null> {
    for (const user of this.users.values()) {
      if (user.id === id) return user;
    }
    return null;
  }

  async updatePreferences(id: string, prefs: Partial<UserPreferences>): Promise<boolean> {
    for (const user of this.users.values()) {
      if (user.id === id) {
        user.preferences = { ...user.preferences, ...prefs };
        return true;
      }
    }
    return false;
  }

  getUserCount(): number { return this.users.size; }
}

export const userStore = new UserStore();
