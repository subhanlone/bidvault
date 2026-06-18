interface BadgeProps {
  variant?: 'tag' | 'success' | 'warning' | 'error';
  children: React.ReactNode;
  className?: string;
}

const successStyle = 'bg-success-bg text-success border border-success-border';
const warningStyle = 'bg-warning-bg text-warning border border-warning-border';
const errorStyle = 'bg-primary-light text-primary border border-primary';
const tagStyle = 'bg-surface-raised text-body border border-border';

const variantStyles = {
  success: successStyle,
  warning: warningStyle,
  error: errorStyle,
  tag: tagStyle,
};

export default function Badge({ variant = 'tag', children, className = '' }: BadgeProps) {
  return (
    <span role="status" className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
}
