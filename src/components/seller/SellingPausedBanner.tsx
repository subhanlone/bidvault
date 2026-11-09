import { PauseCircle } from 'lucide-react';
import { dateMedium } from '../../utils/format';

/**
 * B5 (section 4, screen 6): selling on this account was paused by an admin. The person can still see
 * and finish the sales they already made, so My Items stays open to them with this note on top.
 */
export default function SellingPausedBanner({ since }: { since: string }) {
  return (
    <div role="status" className="flex gap-3 items-start bg-warning-bg border border-warning-border rounded-md px-4 py-3 mb-5">
      <PauseCircle size={18} className="text-warning shrink-0 mt-0.5" aria-hidden="true" />
      <div className="text-[13px] text-secondary">
        <p className="font-bold text-navy">Selling is paused on your account</p>
        <p>
          An administrator paused selling on {dateMedium(since)}. Sales you already made continue: ship them and answer
          any dispute here. You cannot list new items. Contact support if you believe this is a mistake.
        </p>
      </div>
    </div>
  );
}
