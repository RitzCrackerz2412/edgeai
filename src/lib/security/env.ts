/**
 * Environment variable validation — runs at module load time.
 *
 * Logs warnings for missing optional vars.
 * Throws for missing required vars (only in production).
 */

interface EnvSpec {
  key: string;
  required: 'always' | 'production' | 'optional';
  description: string;
  example?: string;
}

const ENV_SPEC: EnvSpec[] = [
  // Auth — both required in production; app/auth module throws independently for AUTH_SECRET
  { key: 'AUTH_SECRET',             required: 'production', description: 'NextAuth secret for signing sessions', example: 'openssl rand -base64 32' },
  { key: 'NEXTAUTH_URL',            required: 'production', description: 'Canonical URL of the app',            example: 'https://edgeai.example.com' },
  // Cron — required in production; cron routes deny all requests when unset
  { key: 'CRON_SECRET',             required: 'production', description: 'Bearer token protecting /api/cron/* routes', example: 'openssl rand -hex 32' },

  // Data providers
  { key: 'SPORTS_DATA_IO_API_KEY',  required: 'optional',   description: 'SportsDataIO API key for live game data' },
  { key: 'ODDS_API_KEY',            required: 'optional',   description: 'The Odds API key for live betting lines' },
  { key: 'OPENWEATHERMAP_API_KEY',  required: 'optional',   description: 'OpenWeatherMap API key for weather data' },

  // Infrastructure
  { key: 'REDIS_URL',               required: 'optional',   description: 'Redis URL for distributed caching',    example: 'redis://localhost:6379' },
  { key: 'DATABASE_URL',            required: 'optional',   description: 'PostgreSQL connection string',         example: 'postgresql://user:pass@host/db' },

  // Feature flags
  { key: 'ENGINE_ENABLED',          required: 'optional',   description: 'Set to "true" to use prediction engine instead of mock data' },
  { key: 'NEXT_PUBLIC_APP_URL',     required: 'optional',   description: 'Public app URL for client-side links' },
];

export interface EnvValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
}

export function validateEnvironment(): EnvValidationResult {
  const isProd = process.env.NODE_ENV === 'production';
  const warnings: string[] = [];
  const errors: string[] = [];

  for (const spec of ENV_SPEC) {
    const value = process.env[spec.key];
    const isMissing = !value || value.trim() === '';

    if (!isMissing) continue;

    if (spec.required === 'always' || (spec.required === 'production' && isProd)) {
      const hint = spec.example ? ` (example: ${spec.example})` : '';
      errors.push(`Missing required env var: ${spec.key} — ${spec.description}${hint}`);
    } else if (spec.required !== 'optional') {
      warnings.push(`Missing optional env var: ${spec.key} — ${spec.description}`);
    }
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors,
  };
}

/** Run at startup — call from layout or instrumentation hook */
export function assertEnvironment(): void {
  const result = validateEnvironment();

  for (const w of result.warnings) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[EdgeAI env] ⚠  ${w}`);
    }
  }

  for (const e of result.errors) {
    console.error(`[EdgeAI env] ✗ ${e}`);
  }

  if (!result.valid) {
    throw new Error(
      `EdgeAI environment misconfigured. Missing required variables:\n${result.errors.join('\n')}`,
    );
  }
}

/** Safe accessor — returns undefined instead of throwing for optional vars */
export function env(key: string): string | undefined {
  return process.env[key] || undefined;
}
