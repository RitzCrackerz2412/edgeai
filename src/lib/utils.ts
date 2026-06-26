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

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
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
