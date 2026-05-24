interface BadgeProps {
  variant?: 'verified' | 'review' | 'unverified' | 'tag' | 'success' | 'warning' | 'error';
  children: React.ReactNode;
  className?: string;
}

const verifiedStyle = 'bg-success-bg text-success border border-success-border';
const reviewStyle = 'bg-warning-bg text-warning border border-warning-border';
const unverifiedStyle = 'bg-primary-light text-primary border border-primary';
const tagStyle = 'bg-surface-raised text-body border border-border';

const variantStyles = {
  verified: verifiedStyle,
  success: verifiedStyle,
  review: reviewStyle,
  warning: reviewStyle,
  unverified: unverifiedStyle,
  error: unverifiedStyle,
  tag: tagStyle,
};

export default function Badge({ variant = 'tag', children, className = '' }: BadgeProps) {
  return (
    <span role="status" className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
}
