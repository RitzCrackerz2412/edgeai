// ── Data quality issue logger ─────────────────────────────────────────────────
//
// Collects issues found during data validation. In development these go to
// console. In production they would also be forwarded to a structured log
// sink (e.g. Datadog, AWS CloudWatch).

export type IssueSeverity = 'info' | 'warning' | 'error' | 'critical';

export type IssueCategory =
  | 'missing_field'
  | 'invalid_value'
  | 'stale_data'
  | 'duplicate_record'
  | 'impossible_value'
  | 'schema_mismatch'
  | 'provider_error';

export interface DataIssue {
  id: string;
  severity: IssueSeverity;
  category: IssueCategory;
  entityType: string;   // e.g. 'game', 'team', 'player', 'odds'
  entityId: string;
  field?: string;       // which field triggered the issue
  message: string;
  value?: unknown;      // the offending value
  detectedAt: string;  // ISO 8601
}

// ── In-memory issue store ─────────────────────────────────────────────────────

class DataQualityLogger {
  private issues: DataIssue[] = [];
  private counter = 0;

  log(
    severity: IssueSeverity,
    category: IssueCategory,
    entityType: string,
    entityId: string,
    message: string,
    opts: { field?: string; value?: unknown } = {},
  ): DataIssue {
    const issue: DataIssue = {
      id: `dq-${Date.now()}-${++this.counter}`,
      severity,
      category,
      entityType,
      entityId,
      field: opts.field,
      message,
      value: opts.value,
      detectedAt: new Date().toISOString(),
    };

    this.issues.push(issue);

    // Console output in development
    if (process.env.NODE_ENV !== 'production') {
      const prefix = `[DataQuality/${severity.toUpperCase()}]`;
      const loc = opts.field ? ` (${entityType}.${opts.field})` : ` (${entityType})`;
      console.warn(`${prefix}${loc} ${message}`, opts.value !== undefined ? `value=${JSON.stringify(opts.value)}` : '');
    }

    return issue;
  }

  missing(entityType: string, entityId: string, field: string): DataIssue {
    return this.log('warning', 'missing_field', entityType, entityId,
      `Required field "${field}" is missing or null`, { field });
  }

  stale(entityType: string, entityId: string, ageSec: number, maxAgeSec: number): DataIssue {
    return this.log('warning', 'stale_data', entityType, entityId,
      `Data is ${Math.round(ageSec)}s old (max ${maxAgeSec}s)`,
      { field: 'fetchedAt', value: ageSec });
  }

  invalid(entityType: string, entityId: string, field: string, value: unknown, reason: string): DataIssue {
    return this.log('error', 'invalid_value', entityType, entityId,
      `Invalid value for "${field}": ${reason}`, { field, value });
  }

  impossible(entityType: string, entityId: string, field: string, value: unknown): DataIssue {
    return this.log('error', 'impossible_value', entityType, entityId,
      `Impossible value for "${field}"`, { field, value });
  }

  duplicate(entityType: string, entityId: string, duplicateId: string): DataIssue {
    return this.log('warning', 'duplicate_record', entityType, entityId,
      `Duplicate entry detected: existing id="${duplicateId}"`);
  }

  getIssues(filter?: {
    severity?: IssueSeverity;
    category?: IssueCategory;
    entityType?: string;
    since?: string;
  }): DataIssue[] {
    let result = [...this.issues];

    if (filter?.severity) result = result.filter(i => i.severity === filter.severity);
    if (filter?.category) result = result.filter(i => i.category === filter.category);
    if (filter?.entityType) result = result.filter(i => i.entityType === filter.entityType);
    if (filter?.since) {
      const cutoff = new Date(filter.since).getTime();
      result = result.filter(i => new Date(i.detectedAt).getTime() >= cutoff);
    }

    return result;
  }

  getErrorCount(): number {
    return this.issues.filter(i => i.severity === 'error' || i.severity === 'critical').length;
  }

  clear(): void {
    this.issues = [];
  }
}

export const dataLogger = new DataQualityLogger();
