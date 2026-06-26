import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  suffix?: React.ReactNode;
  error?: string;
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ icon, suffix, error, label, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-label" style={{ color: 'var(--text-tertiary)' }}>
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <span className="absolute left-3 pointer-events-none" style={{ color: 'var(--text-tertiary)' }}>
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full h-9 rounded-lg px-3 text-sm outline-none transition-all',
              icon && 'pl-9',
              suffix && 'pr-9',
              error ? 'border-[var(--danger)]' : 'border-[var(--border-default)] focus:border-[var(--accent)]',
              className,
            )}
            style={{
              background: 'var(--bg-elevated)',
              border: `1px solid ${error ? 'var(--danger)' : 'var(--border-default)'}`,
              color: 'var(--text-primary)',
            }}
            {...props}
          />
          {suffix && (
            <span className="absolute right-3 pointer-events-none" style={{ color: 'var(--text-tertiary)' }}>
              {suffix}
            </span>
          )}
        </div>
        {error && <p className="text-xs" style={{ color: 'var(--text-danger)' }}>{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
