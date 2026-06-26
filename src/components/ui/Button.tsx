import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type Size    = 'sm' | 'md' | 'lg';

const variantClasses: Record<Variant, string> = {
  primary:   'bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white border-transparent',
  secondary: 'bg-[var(--bg-elevated)] hover:bg-[var(--border-strong)] text-[var(--text-primary)] border-[var(--border-strong)]',
  ghost:     'bg-transparent hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-transparent',
  danger:    'bg-[var(--danger-dim)] hover:bg-[rgba(239,68,68,0.2)] text-[var(--text-danger)] border-[rgba(239,68,68,0.3)]',
  success:   'bg-[var(--success-dim)] hover:bg-[rgba(34,197,94,0.2)] text-[var(--text-success)] border-[rgba(34,197,94,0.3)]',
};

const sizeClasses: Record<Size, string> = {
  sm:  'h-7  px-3   text-xs  gap-1.5 rounded-md',
  md:  'h-8  px-3.5 text-sm  gap-2   rounded-lg',
  lg:  'h-10 px-5   text-sm  gap-2   rounded-lg',
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: React.ReactNode;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'secondary', size = 'md', icon, loading, children, className, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-medium border transition-all duration-150',
        'disabled:opacity-50 disabled:cursor-not-allowed select-none',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {loading ? <Spinner /> : icon}
      {children}
    </button>
  )
);
Button.displayName = 'Button';

function Spinner() {
  return (
    <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
