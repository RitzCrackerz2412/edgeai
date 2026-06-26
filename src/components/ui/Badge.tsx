import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'green' | 'red' | 'yellow' | 'accent' | 'cyan';

const variantStyles: Record<BadgeVariant, { bg: string; color: string }> = {
  default: { bg: 'var(--bg-elevated)',  color: 'var(--text-secondary)' },
  green:   { bg: 'rgba(34,197,94,0.12)',  color: '#4ade80' },
  red:     { bg: 'rgba(239,68,68,0.12)',  color: '#f87171' },
  yellow:  { bg: 'rgba(245,158,11,0.12)', color: '#fbbf24' },
  accent:  { bg: 'var(--accent-dim)',      color: 'var(--accent-light)' },
  cyan:    { bg: 'rgba(6,182,212,0.12)',   color: '#22d3ee' },
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const { bg, color } = variantStyles[variant];
  return (
    <span
      className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold', className)}
      style={{ background: bg, color }}
    >
      {children}
    </span>
  );
}
