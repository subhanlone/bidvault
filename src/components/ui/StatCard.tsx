import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
  icon?: React.ReactNode;
  iconColor?: 'default' | 'success' | 'warning' | 'error' | 'info';
  padding?: 'sm' | 'md';
  className?: string;
}

const iconColorMap = {
  default: 'bg-surface-raised text-muted',
  success: 'bg-success-bg text-success',
  warning: 'bg-warning-bg text-warning',
  error: 'bg-error-bg text-error',
  info: 'bg-info-bg text-info',
};

const paddingMap = {
  sm: 'p-4',
  md: 'p-6',
};

export default function StatCard({
  label,
  value,
  trend,
  trendLabel,
  icon,
  iconColor = 'default',
  padding = 'md',
  className = '',
}: StatCardProps) {
  return (
    <div className={`bg-surface rounded-md border border-border ${paddingMap[padding]} ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[13px] text-muted font-medium mb-1">{label}</p>
          <p className="text-[28px] font-bold text-navy leading-none">{value}</p>
          {trendLabel && (
            <div className={`flex items-center gap-1 mt-2 text-[12px] font-medium
              ${trend === 'up' ? 'text-success' : trend === 'down' ? 'text-primary' : 'text-muted'}
            `}>
              {trend === 'up' && <TrendingUp size={13} />}
              {trend === 'down' && <TrendingDown size={13} />}
              {trendLabel}
            </div>
          )}
        </div>
        {icon && (
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconColorMap[iconColor]}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
