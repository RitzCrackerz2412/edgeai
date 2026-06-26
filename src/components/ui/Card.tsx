import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
  elevated?: boolean;
  noPad?: boolean;
}

export function Card({ children, className, title, action, elevated, noPad }: CardProps) {
  return (
    <div
      className={cn('rounded-2xl', !noPad && 'p-5', className)}
      style={{
        background: elevated ? 'var(--bg-elevated)' : 'var(--bg-card)',
        border: `1px solid ${elevated ? 'var(--border-strong)' : 'var(--border-default)'}`,
      }}
    >
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          {title && (
            <h3 className="text-label">
              {title}
            </h3>
          )}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
