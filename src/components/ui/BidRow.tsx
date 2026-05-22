interface BidRowProps {
  userName: string;
  amount: number;
  timeAgo: string;
  isHighest?: boolean;
  isYou?: boolean;
}

function formatPrice(n: number) {
  return `PKR ${n.toLocaleString()}`;
}

export default function BidRow({ userName, amount, timeAgo, isHighest, isYou }: BidRowProps) {
  return (
    <div className={`flex items-center justify-between py-2.5 px-3 rounded-lg ${isHighest ? 'bg-[#fee2e2]' : 'bg-[#f8f9fa]'}`}>
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full bg-[#e5e7eb] flex items-center justify-center text-xs font-semibold text-[#374151]">
          {userName.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium text-[#0b1f3a]">
            {isYou ? 'You' : userName}
            {isHighest && <span className="ml-1.5 text-[10px] font-semibold text-[#d0021b] uppercase tracking-wide">Highest</span>}
          </p>
          <p className="text-[11px] text-[#6c757d]">{timeAgo}</p>
        </div>
      </div>
      <p className="text-sm font-bold text-[#0b1f3a]">{formatPrice(amount)}</p>
    </div>
  );
}
