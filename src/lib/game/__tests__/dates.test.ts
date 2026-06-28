import { describe, it, expect } from 'vitest';
import { formatDate, formatGameTime, isoDateInTZ } from '@/lib/utils';

describe('formatDate — UTC midnight trap', () => {
  it('renders the correct calendar date for a bare YYYY-MM-DD string (no UTC shift)', () => {
    // "2026-06-28" must display as Jun 28, NOT Jun 27 (the UTC-midnight trap)
    const result = formatDate('2026-06-28');
    expect(result).toContain('Jun 28');
    expect(result).not.toContain('Jun 27');
  });

  it('handles ISO timestamps correctly', () => {
    const result = formatDate('2026-06-28T23:30:00Z');
    // June 28 UTC → could be Jun 28 or Jun 29 depending on locale, but should not be Jun 27
    expect(result).not.toContain('Jun 27');
  });

  it('renders weekday', () => {
    const result = formatDate('2026-06-28');
    // June 28 2026 is a Sunday
    expect(result).toMatch(/Sun|Mon|Tue|Wed|Thu|Fri|Sat/);
  });
});

describe('formatGameTime', () => {
  it('converts UTC ISO to ET time string', () => {
    // 23:30 UTC = 7:30 PM ET (UTC-4 in EDT)
    const result = formatGameTime('2026-06-28T23:30:00Z', 'America/New_York');
    expect(result).toContain('7:30');
    expect(result).toContain('PM');
  });

  it('includes timezone abbreviation', () => {
    const result = formatGameTime('2026-06-28T23:30:00Z', 'America/New_York');
    // Should include ET or EDT
    expect(result).toMatch(/ET|EDT/);
  });
});

describe('isoDateInTZ', () => {
  it('returns YYYY-MM-DD in the requested timezone', () => {
    // Midnight UTC on June 29 is still June 28 in ET (UTC-4)
    const utcMidnightJun29 = new Date('2026-06-29T00:00:00Z');
    const etDate = isoDateInTZ(utcMidnightJun29, 'America/New_York');
    expect(etDate).toBe('2026-06-28');
  });

  it('returns tomorrow for noon UTC', () => {
    const noon = new Date('2026-06-29T16:00:00Z'); // noon ET
    const etDate = isoDateInTZ(noon, 'America/New_York');
    expect(etDate).toBe('2026-06-29');
  });
});
