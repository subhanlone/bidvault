interface BadgeProps {
  variant?: 'verified' | 'review' | 'unverified' | 'tag' | 'success' | 'warning' | 'error';
  children: React.ReactNode;
  className?: string;
}

const variantStyles = {
  verified: 'bg-[#dcfce7] text-[#16a34a] border border-[#bbf7d0]',
  review: 'bg-[#fef3c7] text-[#d97706]',
  unverified: 'bg-[#fee2e2] text-[#d0021b]',
  tag: 'bg-[#f3f4f6] text-[#374151]',
  success: 'bg-[#dcfce7] text-[#16a34a]',
  warning: 'bg-[#fef3c7] text-[#d97706]',
  error: 'bg-[#fee2e2] text-[#d0021b]',
};

export default function Badge({ variant = 'tag', children, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
}
