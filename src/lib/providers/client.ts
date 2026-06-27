// ── Custom error types ────────────────────────────────────────────────────────

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly provider?: string,
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

// ── In-process rate limit tracker ────────────────────────────────────────────

interface RateLimitWindow {
  count: number;
  resetAt: number; // Unix ms
}

const rateLimitWindows = new Map<string, RateLimitWindow>();
const MAX_REQUESTS_PER_MINUTE = 120;

function checkRateLimit(key: string): void {
  const now = Date.now();
  const window = rateLimitWindows.get(key);

  if (!window || window.resetAt < now) {
    rateLimitWindows.set(key, { count: 1, resetAt: now + 60_000 });
    return;
  }

  if (window.count >= MAX_REQUESTS_PER_MINUTE) {
    const waitSec = Math.ceil((window.resetAt - now) / 1000);
    throw new RateLimitError(
      `Rate limit reached for "${key}". Resets in ${waitSec}s`,
    );
  }

  window.count++;
}

// ── Retry + timeout fetch ─────────────────────────────────────────────────────

export interface FetchOptions extends Omit<RequestInit, 'signal'> {
  retries?: number;        // default 3
  retryDelayMs?: number;   // base delay, doubles each attempt (default 500)
  timeoutMs?: number;      // default 10 000
  rateLimitKey?: string;   // if set, enforces in-process rate limiting
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function apiFetch<T>(url: string, options: FetchOptions = {}): Promise<T> {
  const {
    retries = 3,
    retryDelayMs = 500,
    timeoutMs = 10_000,
    rateLimitKey,
    ...fetchOptions
  } = options;

  if (rateLimitKey) checkRateLimit(rateLimitKey);

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const wait = retryAfter
            ? parseInt(retryAfter, 10) * 1000
            : retryDelayMs * Math.pow(2, attempt);
          if (attempt < retries) {
            await sleep(wait);
            continue;
          }
          throw new RateLimitError(`API rate limited: ${url}`);
        }
        if (response.status >= 500 && attempt < retries) {
          await sleep(retryDelayMs * Math.pow(2, attempt));
          continue;
        }
        throw new ProviderError(
          `HTTP ${response.status}: ${response.statusText} — ${url}`,
          response.status,
        );
      }

      return response.json() as Promise<T>;
    } catch (err) {
      clearTimeout(timeoutId);

      if (err instanceof RateLimitError || err instanceof ProviderError) throw err;

      lastError = err instanceof Error ? err : new Error(String(err));

      // AbortError = timeout — retry
      if (attempt < retries) {
        await sleep(retryDelayMs * Math.pow(2, attempt));
      }
    }
  }

  throw lastError ?? new ProviderError(`Failed to fetch after ${retries} retries: ${url}`);
}
