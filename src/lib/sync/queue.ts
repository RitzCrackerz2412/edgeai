/**
 * In-memory job queue with retry and dead-letter queue.
 *
 * Production replacement: swap for BullMQ (Redis) or Inngest.
 *
 * Features:
 *  - Priority levels (critical > high > normal > low)
 *  - Configurable max attempts with exponential backoff
 *  - Dead-letter queue for exhausted jobs
 *  - Per-job concurrency control
 *  - Health stats endpoint
 */

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'dead';
export type JobPriority = 'critical' | 'high' | 'normal' | 'low';

const PRIORITY_ORDER: Record<JobPriority, number> = {
  critical: 4, high: 3, normal: 2, low: 1,
};

export interface Job<T = unknown> {
  id: string;
  type: string;
  payload: T;
  priority: JobPriority;
  status: JobStatus;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  scheduledAt: string;
  startedAt?: string;
  completedAt?: string;
  failedAt?: string;
  lastError?: string;
  /** Metadata attached by the queue for observability */
  tags?: Record<string, string>;
}

export interface JobHandler<T = unknown> {
  (job: Job<T>): Promise<void>;
}

// ── Exponential backoff ───────────────────────────────────────────────────────

function backoffMs(attempt: number): number {
  // 5s, 30s, 2.5min, 20min, 2.5hr
  return Math.min(5_000 * Math.pow(6, attempt - 1), 9_000_000);
}

function nextSchedule(attempt: number): string {
  return new Date(Date.now() + backoffMs(attempt)).toISOString();
}

function generateId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ── Queue ─────────────────────────────────────────────────────────────────────

class JobQueue {
  private queue: Map<string, Job> = new Map();
  private dlq:   Map<string, Job> = new Map();
  private handlers: Map<string, JobHandler> = new Map();
  private running = new Set<string>();
  private maxConcurrency = 5;
  private processorInterval?: ReturnType<typeof setInterval>;

  register<T>(type: string, handler: JobHandler<T>): void {
    this.handlers.set(type, handler as JobHandler);
  }

  enqueue<T>(
    type: string,
    payload: T,
    opts: {
      priority?: JobPriority;
      maxAttempts?: number;
      delayMs?: number;
      tags?: Record<string, string>;
    } = {},
  ): string {
    const id = generateId();
    const job: Job<T> = {
      id, type, payload,
      priority: opts.priority ?? 'normal',
      status: 'pending',
      attempts: 0,
      maxAttempts: opts.maxAttempts ?? 3,
      createdAt: new Date().toISOString(),
      scheduledAt: new Date(Date.now() + (opts.delayMs ?? 0)).toISOString(),
      tags: opts.tags,
    };
    this.queue.set(id, job as Job);
    return id;
  }

  private pickNext(): Job | null {
    const now = Date.now();
    let best: Job | null = null;

    for (const job of this.queue.values()) {
      if (job.status !== 'pending') continue;
      if (this.running.has(job.id)) continue;
      if (new Date(job.scheduledAt).getTime() > now) continue;

      if (!best || PRIORITY_ORDER[job.priority] > PRIORITY_ORDER[best.priority]) {
        best = job;
      }
    }
    return best;
  }

  async processNext(): Promise<boolean> {
    if (this.running.size >= this.maxConcurrency) return false;
    const job = this.pickNext();
    if (!job) return false;

    const handler = this.handlers.get(job.type);
    if (!handler) {
      job.status = 'dead';
      job.lastError = `No handler registered for type: ${job.type}`;
      this.dlq.set(job.id, job);
      this.queue.delete(job.id);
      return false;
    }

    job.status = 'running';
    job.startedAt = new Date().toISOString();
    job.attempts++;
    this.running.add(job.id);

    handler(job)
      .then(() => {
        job.status = 'completed';
        job.completedAt = new Date().toISOString();
        this.running.delete(job.id);
        this.queue.delete(job.id);
      })
      .catch((err: unknown) => {
        this.running.delete(job.id);
        job.lastError = err instanceof Error ? err.message : String(err);
        job.failedAt = new Date().toISOString();

        if (job.attempts >= job.maxAttempts) {
          job.status = 'dead';
          this.dlq.set(job.id, job);
          this.queue.delete(job.id);
        } else {
          job.status = 'pending';
          job.scheduledAt = nextSchedule(job.attempts);
        }
      });

    return true;
  }

  start(pollIntervalMs = 1000): void {
    if (this.processorInterval) return;
    this.processorInterval = setInterval(() => {
      if (this.running.size < this.maxConcurrency) {
        this.processNext().catch(() => {});
      }
    }, pollIntervalMs);
    this.processorInterval.unref?.();
  }

  stop(): void {
    if (this.processorInterval) {
      clearInterval(this.processorInterval);
      this.processorInterval = undefined;
    }
  }

  getStats() {
    const jobs = Array.from(this.queue.values());
    return {
      pending:   jobs.filter(j => j.status === 'pending').length,
      running:   jobs.filter(j => j.status === 'running').length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed:    jobs.filter(j => j.status === 'failed').length,
      dead:      this.dlq.size,
      total:     this.queue.size,
    };
  }

  getDLQ(): Job[] { return Array.from(this.dlq.values()); }

  retryDead(jobId: string): boolean {
    const job = this.dlq.get(jobId);
    if (!job) return false;
    job.status = 'pending';
    job.attempts = 0;
    job.scheduledAt = new Date().toISOString();
    this.queue.set(jobId, job);
    this.dlq.delete(jobId);
    return true;
  }

  listPending(): Job[] {
    return Array.from(this.queue.values()).filter(j => j.status === 'pending');
  }
}

export const jobQueue = new JobQueue();

// Auto-start the processor
if (typeof process !== 'undefined') {
  jobQueue.start();
}
