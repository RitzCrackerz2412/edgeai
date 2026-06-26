// Circuit breaker pattern for external provider calls.
// Transitions: closed → open (on failure threshold) → half-open (after timeout) → closed (on success).

type State = 'closed' | 'open' | 'half-open';

interface Config {
  failureThreshold: number;  // consecutive failures before opening
  successThreshold: number;  // successes in half-open before closing
  timeoutMs:        number;  // ms to wait before attempting half-open
}

export class CircuitBreaker {
  private state:         State = 'closed';
  private failures               = 0;
  private successes              = 0;
  private lastFailureAt          = 0;

  constructor(
    readonly name: string,
    private config: Config = { failureThreshold: 5, successThreshold: 2, timeoutMs: 60_000 },
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureAt >= this.config.timeoutMs) {
        this.state = 'half-open';
        this.successes = 0;
      } else {
        throw new Error(`Circuit breaker "${this.name}" is open — provider unavailable`);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    if (this.state === 'half-open') {
      this.successes++;
      if (this.successes >= this.config.successThreshold) {
        this.state = 'closed';
        this.successes = 0;
      }
    }
  }

  private onFailure(): void {
    this.lastFailureAt = Date.now();
    this.failures++;
    if (this.state === 'half-open' || this.failures >= this.config.failureThreshold) {
      this.state = 'open';
    }
  }

  getStatus() {
    return {
      name:          this.name,
      state:         this.state,
      failures:      this.failures,
      lastFailureAt: this.lastFailureAt
        ? new Date(this.lastFailureAt).toISOString()
        : null,
    };
  }

  reset(): void {
    this.state = 'closed';
    this.failures = 0;
    this.successes = 0;
    this.lastFailureAt = 0;
  }
}

// Singleton breakers — one per external service
export const breakers = {
  espn:       new CircuitBreaker('ESPN',          { failureThreshold: 3, successThreshold: 1, timeoutMs: 30_000 }),
  sportsdata: new CircuitBreaker('SportsDataIO',  { failureThreshold: 5, successThreshold: 2, timeoutMs: 60_000 }),
  odds:       new CircuitBreaker('OddsAPI',       { failureThreshold: 5, successThreshold: 2, timeoutMs: 60_000 }),
  openmeteo:  new CircuitBreaker('OpenMeteo',     { failureThreshold: 3, successThreshold: 1, timeoutMs: 30_000 }),
  weather:    new CircuitBreaker('OpenWeatherMap',{ failureThreshold: 3, successThreshold: 1, timeoutMs: 60_000 }),
};

export function getAllBreakerStatuses() {
  return Object.values(breakers).map(b => b.getStatus());
}
