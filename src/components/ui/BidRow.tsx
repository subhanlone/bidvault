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
  let displayName: React.ReactNode;
  if (isYou && isHighest) {
    displayName = "You're Leading";
  } else if (isYou) {
    displayName = 'You';
  } else {
    displayName = userName;
  }

  return (
    <div className={`flex items-center justify-between py-2.5 px-3 rounded-lg ${isHighest ? 'bg-success-bg border border-success-border' : 'bg-bg'}`}>
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full bg-border flex items-center justify-center text-xs font-semibold text-body">
          {userName.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium text-navy">
            {displayName}
            {isHighest && !isYou && <span className="ml-1.5 text-[10px] font-semibold text-success-dark uppercase tracking-wide">Highest</span>}
            {isYou && !isHighest && <span className="ml-1.5 text-[10px] font-semibold text-warning uppercase tracking-wide">Outbid</span>}
          </p>
          <p className="text-[11px] text-muted">{timeAgo}</p>
        </div>
      </div>
      <p className="text-sm font-bold text-navy">{formatPrice(amount)}</p>
    </div>
  );
}
