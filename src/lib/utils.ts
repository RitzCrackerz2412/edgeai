import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatOdds(american: number): string {
  return american > 0 ? `+${american}` : `${american}`;
}

export function confidenceColor(pct: number): string {
  if (pct >= 80) return 'text-green-400';
  if (pct >= 65) return 'text-yellow-400';
  return 'text-orange-400';
}

export function confidenceBg(pct: number): string {
  if (pct >= 80) return 'bg-green-400/10 border-green-400/30';
  if (pct >= 65) return 'bg-yellow-400/10 border-yellow-400/30';
  return 'bg-orange-400/10 border-orange-400/30';
}

export function momentumColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#84cc16';
  if (score >= 40) return '#f59e0b';
  return '#ef4444';
}

/**
 * Format a date string for display.
 * Appends T00:00:00 when given a bare YYYY-MM-DD to avoid the UTC-midnight
 * timezone trap where new Date("2026-06-28") shows as Jun 27 in US timezones.
 */
export function formatDate(dateStr: string): string {
  const safe = /^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? dateStr + 'T00:00:00' : dateStr;
  return new Date(safe).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });
}

/**
 * Format an ISO timestamp (from provider) to local time with timezone abbreviation.
 * e.g. "2026-06-28T23:30:00Z" → "7:30 PM ET"
 */
export function formatGameTime(isoStr: string, timeZone = 'America/New_York'): string {
  return new Date(isoStr).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', hour12: true, timeZoneName: 'short', timeZone,
  });
}

/**
 * Return YYYY-MM-DD in a given timezone (defaults to ET).
 * Safe to compare with date-bucketing logic.
 */
export function isoDateInTZ(date: Date, timeZone = 'America/New_York'): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

export function sportIcon(sport: string): string {
  const icons: Record<string, string> = {
    NFL: '🏈', NBA: '🏀', MLB: '⚾', NHL: '🏒',
    Soccer: '⚽', 'NCAA Football': '🏈', 'NCAA Basketball': '🏀',
    UFC: '🥊', Boxing: '🥊', Tennis: '🎾', F1: '🏎️',
    Cricket: '🏏', Esports: '🎮',
  };
  return icons[sport] ?? '🏆';
}
