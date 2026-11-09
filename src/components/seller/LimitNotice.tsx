import { AlertTriangle, Info } from 'lucide-react';
import type { SellerLimits } from '../../types/api';
import { count, pkr } from '../../utils/format';
import { itemsFull, itemsFullMessage, nearLimit, valueLeft, valueOverMessage, wayOut } from '../../utils/sellerLimits';

/**
 * B5 (section 4, screen 5): the monthly limit inside the create-listing wizard and the resubmit form,
 * so a seller learns before filling in the form, not from an error after it. At the limit it is an
 * alert with the way out; near it (80%), a quiet note of what is left. `startPrice` adds the value
 * check for the price being typed (0 skips it).
 */
export default function LimitNotice({ limits, startPrice = 0 }: { limits: SellerLimits | undefined; startPrice?: number }) {
  if (!limits) return null;

  if (itemsFull(limits)) {
    return (
      <div role="alert" className="flex gap-2.5 items-start bg-error-bg border border-error-border rounded-lg px-4 py-3 mb-5">
        <AlertTriangle size={16} className="text-error shrink-0 mt-0.5" aria-hidden="true" />
        <div className="text-[13px] text-secondary">
          <p className="font-bold text-navy">{itemsFullMessage(limits)}</p>
          <p>{wayOut(limits)}</p>
        </div>
      </div>
    );
  }

  const over = startPrice > 0 ? valueOverMessage(limits, startPrice) : null;
  if (over) {
    return (
      <div role="alert" className="flex gap-2.5 items-start bg-error-bg border border-error-border rounded-lg px-4 py-3 mb-5">
        <AlertTriangle size={16} className="text-error shrink-0 mt-0.5" aria-hidden="true" />
        <div className="text-[13px] text-secondary">
          <p className="font-bold text-navy">{over}</p>
          <p>Lower the starting price, or: {wayOut(limits)}</p>
        </div>
      </div>
    );
  }

  if (!nearLimit(limits)) return null;
  const left: string[] = [];
  if (limits.items.limit !== null) left.push(count(limits.items.limit - limits.items.used, 'item'));
  const value = valueLeft(limits);
  if (value !== null) left.push(pkr(value));
  return (
    <div className="flex gap-2.5 items-start bg-info-surface border border-info-border-strong rounded-lg px-4 py-3 mb-5">
      <Info size={15} className="text-info shrink-0 mt-0.5" aria-hidden="true" />
      <p className="text-[12px] text-info">You have {left.join(' and ')} left this month.</p>
    </div>
  );
}
