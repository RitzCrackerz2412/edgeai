/**
 * Input validation and sanitization utilities.
 *
 * All user-supplied strings entering the system should pass through here
 * before being used in queries, logs, or responses.
 */

/** Strip HTML tags and script-injection patterns */
export function sanitizeString(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<[^>]*>/g, '')      // strip HTML tags
    .replace(/javascript:/gi, '') // strip JS URIs
    .replace(/on\w+\s*=/gi, '')   // strip inline event handlers
    .trim()
    .slice(0, 2048);              // hard length cap
}

/** Validate and clamp a numeric query parameter */
export function parseIntParam(value: unknown, defaultVal: number, min: number, max: number): number {
  const n = parseInt(String(value ?? defaultVal), 10);
  if (isNaN(n)) return defaultVal;
  return Math.max(min, Math.min(max, n));
}

/** Validate a sport identifier against the allowed list */
const VALID_SPORTS = new Set([
  'NFL', 'NBA', 'MLB', 'NHL', 'Soccer',
  'NCAA Football', 'NCAA Basketball', 'UFC', 'Boxing',
  'Tennis', 'F1', 'Cricket', 'Esports',
]);

export function isSport(value: unknown): boolean {
  return typeof value === 'string' && VALID_SPORTS.has(value);
}

/** Validate a simple alphanumeric ID (no SQL/NoSQL injection) */
export function isValidId(id: unknown): boolean {
  return typeof id === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(id);
}

/** Validate an email address */
export function isValidEmail(email: unknown): boolean {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

/** Validate a password (min 8 chars, at least one number) */
export function isValidPassword(pw: unknown): boolean {
  return typeof pw === 'string' && pw.length >= 8 && /\d/.test(pw);
}

/** Strip keys from an object that don't match a whitelist */
export function pickAllowed<T extends Record<string, unknown>>(
  obj: unknown,
  allowed: readonly (keyof T)[],
): Partial<T> {
  if (!obj || typeof obj !== 'object') return {};
  const result: Partial<T> = {};
  for (const key of allowed) {
    if (key in (obj as object)) {
      result[key] = (obj as T)[key];
    }
  }
  return result;
}

/** Build a validation error response body */
export function validationError(
  field: string,
  message: string,
): { error: string; field: string } {
  return { error: message, field };
}
