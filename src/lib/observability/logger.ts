/**
 * Structured logger.
 *
 * In development: pretty-prints to console.
 * In production: emits JSON for log aggregation (Datadog, CloudWatch, etc.).
 *
 * Attach request IDs and user context via the `withContext()` builder.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  service: string;
  requestId?: string;
  userId?: string;
  sport?: string;
  route?: string;
  durationMs?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  [key: string]: unknown;
}

const SERVICE = 'edgeai';
const IS_PROD = process.env.NODE_ENV === 'production';

function formatEntry(entry: LogEntry): string {
  if (IS_PROD) return JSON.stringify(entry);
  const { level, message, timestamp, ...rest } = entry;
  const color = { debug: '\x1b[37m', info: '\x1b[36m', warn: '\x1b[33m', error: '\x1b[31m' }[level];
  const reset = '\x1b[0m';
  const meta = Object.keys(rest).filter(k => k !== 'service').length > 0
    ? ` ${JSON.stringify(rest).slice(1, -1)}` : '';
  return `${color}[${level.toUpperCase()}]${reset} ${message}${meta}`;
}

class Logger {
  private context: Partial<LogEntry> = {};

  withContext(ctx: Partial<LogEntry>): Logger {
    const child = new Logger();
    child.context = { ...this.context, ...ctx };
    return child;
  }

  private log(level: LogLevel, message: string, extra?: Partial<LogEntry>): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      service: SERVICE,
      ...this.context,
      ...extra,
    };

    const formatted = formatEntry(entry);

    switch (level) {
      case 'debug': if (!IS_PROD) console.debug(formatted); break;
      case 'info':  console.log(formatted);   break;
      case 'warn':  console.warn(formatted);  break;
      case 'error': console.error(formatted); break;
    }
  }

  debug(message: string, extra?: Partial<LogEntry>): void { this.log('debug', message, extra); }
  info (message: string, extra?: Partial<LogEntry>): void { this.log('info',  message, extra); }
  warn (message: string, extra?: Partial<LogEntry>): void { this.log('warn',  message, extra); }

  error(message: string, error?: unknown, extra?: Partial<LogEntry>): void {
    const errObj = error instanceof Error
      ? { name: error.name, message: error.message, stack: IS_PROD ? undefined : error.stack }
      : error ? { name: 'UnknownError', message: String(error) }
      : undefined;
    this.log('error', message, { error: errObj, ...extra });
  }

  /** Log + time an async operation */
  async timed<T>(label: string, fn: () => Promise<T>, extra?: Partial<LogEntry>): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      this.info(`${label} completed`, { durationMs: Date.now() - start, ...extra });
      return result;
    } catch (err) {
      this.error(`${label} failed`, err, { durationMs: Date.now() - start, ...extra });
      throw err;
    }
  }
}

export const logger = new Logger();
