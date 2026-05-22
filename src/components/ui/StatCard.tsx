import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
  icon?: React.ReactNode;
  className?: string;
}

export default function StatCard({ label, value, trend, trendLabel, icon, className = '' }: StatCardProps) {
  return (
    <div className={`bg-white rounded-xl border border-[#e5e7eb] p-6 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[13px] text-[#6c757d] font-medium mb-1">{label}</p>
          <p className="text-[28px] font-bold text-[#0b1f3a] leading-none">{value}</p>
          {trendLabel && (
            <div className={`flex items-center gap-1 mt-2 text-[12px] font-medium
              ${trend === 'up' ? 'text-[#16a34a]' : trend === 'down' ? 'text-[#d0021b]' : 'text-[#6c757d]'}
            `}>
              {trend === 'up' && <TrendingUp size={13} />}
              {trend === 'down' && <TrendingDown size={13} />}
              {trendLabel}
            </div>
          )}
        </div>
        {icon && (
          <div className="w-10 h-10 rounded-lg bg-[#f8f9fa] flex items-center justify-center text-[#6c757d]">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
