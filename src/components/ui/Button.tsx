import { type ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled,
  className = '',
  children,
  ...props
}, ref) => {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-hover hover:-translate-y-px active:translate-y-0 active:scale-[0.97]',
    success: 'bg-success text-white hover:bg-success-dark hover:-translate-y-px active:translate-y-0 active:scale-[0.97]',
    outline: 'bg-surface border border-border text-body hover:border-primary hover:text-primary hover:-translate-y-px active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary',
    ghost: 'bg-transparent text-primary hover:bg-primary-light active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary',
  };

  const sizes = {
    sm: 'h-8 px-4 text-xs',
    md: 'h-10 px-5 text-sm',
    lg: 'h-12 px-6 text-base',
  };

  return (
    <button
      type="button"
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading}
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      <span className={loading ? 'opacity-0 w-0 overflow-hidden' : ''}>{children}</span>
    </button>
  );
});

Button.displayName = 'Button';
export default Button;
