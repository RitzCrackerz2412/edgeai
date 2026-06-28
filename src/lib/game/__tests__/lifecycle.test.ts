import { describe, it, expect } from 'vitest';
import { rawGameToGame } from '@/lib/data/live';
import type { RawGame } from '@/lib/providers/types';

function makeRaw(overrides: Partial<RawGame> = {}): RawGame {
  return {
    id: 'test-123',
    sport: 'NFL',
    league: 'NFL',
    homeTeamId: 'nfl-kc',
    awayTeamId: 'nfl-buf',
    homeTeamName: 'Kansas City Chiefs',
    awayTeamName: 'Buffalo Bills',
    scheduledAt: '2026-06-28T23:30:00Z',
    venue: 'Arrowhead Stadium',
    venueId: 'arrowhead',
    venueCity: 'Kansas City',
    venueState: 'MO',
    venueCountry: 'USA',
    status: 'scheduled',
    ...overrides,
  };
}

describe('rawGameToGame — status mapping', () => {
  it('maps "scheduled" to Upcoming', () => {
    const g = rawGameToGame(makeRaw({ status: 'scheduled' }));
    expect(g?.status).toBe('Upcoming');
  });

  it('maps "inprogress" to Live', () => {
    const g = rawGameToGame(makeRaw({ status: 'inprogress', period: 2, clock: '5:30' }));
    expect(g?.status).toBe('Live');
  });

  it('maps "closed" to Final', () => {
    const g = rawGameToGame(makeRaw({ status: 'closed', homeScore: 27, awayScore: 21 }));
    expect(g?.status).toBe('Final');
  });

  it('maps "postponed" to Postponed (not Upcoming)', () => {
    const g = rawGameToGame(makeRaw({ status: 'postponed' }));
    expect(g?.status).toBe('Postponed');
  });

  it('maps "cancelled" to Cancelled (not Upcoming)', () => {
    const g = rawGameToGame(makeRaw({ status: 'cancelled' }));
    expect(g?.status).toBe('Cancelled');
  });
});

describe('rawGameToGame — actual scores', () => {
  it('sets homeScore and awayScore for live games', () => {
    const g = rawGameToGame(makeRaw({ status: 'inprogress', homeScore: 14, awayScore: 7 }));
    expect(g?.homeScore).toBe(14);
    expect(g?.awayScore).toBe(7);
  });

  it('sets homeScore and awayScore for final games', () => {
    const g = rawGameToGame(makeRaw({ status: 'closed', homeScore: 27, awayScore: 21 }));
    expect(g?.homeScore).toBe(27);
    expect(g?.awayScore).toBe(21);
  });

  it('leaves scores undefined for scheduled games', () => {
    const g = rawGameToGame(makeRaw({ status: 'scheduled' }));
    expect(g?.homeScore).toBeUndefined();
    expect(g?.awayScore).toBeUndefined();
  });
});

describe('rawGameToGame — duplicate and validation', () => {
  it('returns null when homeTeamName is empty', () => {
    const g = rawGameToGame(makeRaw({ homeTeamName: '' }));
    expect(g).toBeNull();
  });

  it('returns null when awayTeamName is empty', () => {
    const g = rawGameToGame(makeRaw({ awayTeamName: '' }));
    expect(g).toBeNull();
  });

  it('returns null when home and away IDs are identical and non-empty', () => {
    const g = rawGameToGame(makeRaw({ homeTeamId: 'same-id', awayTeamId: 'same-id' }));
    expect(g).toBeNull();
  });

  it('preserves scheduledAt ISO timestamp', () => {
    const iso = '2026-06-28T23:30:00Z';
    const g = rawGameToGame(makeRaw({ scheduledAt: iso }));
    expect(g?.scheduledAt).toBe(iso);
  });
});

describe('rawGameToGame — period and clock', () => {
  it('sets period for live games', () => {
    const g = rawGameToGame(makeRaw({ status: 'inprogress', period: 3 }));
    expect(g?.period).toBe(3);
  });

  it('sets clock for live games', () => {
    const g = rawGameToGame(makeRaw({ status: 'inprogress', clock: '2:45' }));
    expect(g?.clock).toBe('2:45');
  });
});

describe('rawGameToGame — date conversion (ET)', () => {
  it('stores date as YYYY-MM-DD in Eastern Time', () => {
    // 2026-06-29T02:00:00Z = June 28 10 PM ET (UTC-4)
    const g = rawGameToGame(makeRaw({ scheduledAt: '2026-06-29T02:00:00Z' }));
    expect(g?.date).toBe('2026-06-28');
  });

  it('does not shift a noon-ET game to the wrong day', () => {
    // 2026-06-28T16:00:00Z = June 28 noon ET
    const g = rawGameToGame(makeRaw({ scheduledAt: '2026-06-28T16:00:00Z' }));
    expect(g?.date).toBe('2026-06-28');
  });
});
