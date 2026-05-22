interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const paddingMap = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export default function Card({ children, className = '', padding = 'md', onClick }: CardProps) {
  return (
    <div
      className={`bg-white rounded-xl border border-[#e5e7eb] shadow-[0_4px_6px_rgba(0,0,0,0.08)] ${paddingMap[padding]} ${onClick ? 'cursor-pointer hover:shadow-[0_10px_15px_rgba(0,0,0,0.1)] transition-shadow duration-200' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
