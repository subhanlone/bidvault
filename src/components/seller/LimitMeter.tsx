import { useId, useState } from 'react';
import { Gauge } from 'lucide-react';
import { Button, ReasonModal } from '../ui';
import { useToast } from '../../context/toast';
import { useRequestHigherLimit, useSellerLimits } from '../../queries/sellerItems';
import { hasLimit, resetDay } from '../../utils/sellerLimits';
import { count, pkr } from '../../utils/format';

function Bar({ label, used, limit, usedText }: { label: string; used: number; limit: number; usedText: string }) {
  const share = limit > 0 ? Math.min(1, used / limit) : 1;
  const tone = share >= 1 ? 'bg-error' : share >= 0.8 ? 'bg-warning' : 'bg-primary';
  return (
    <div className="flex-1 min-w-[180px]">
      <p className="text-[13px] font-semibold text-secondary mb-1.5">{usedText}</p>
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-valuenow={Math.min(used, limit)}
        className="h-2 rounded-full bg-border-light overflow-hidden"
      >
        <div className={`h-full ${tone} rounded-full`} style={{ width: `${share * 100}%` }} />
      </div>
    </div>
  );
}

/**
 * B5 (docs/B5-SELLER-ACCOUNT-RESEARCH.md section 4, screen 4): this month's limit as two bars, when it
 * resets, how to lift it, and a way to ask for more. Hidden when no limit applies.
 */
export default function LimitMeter() {
  const { data: limits } = useSellerLimits();
  const request = useRequestHigherLimit();
  const { showToast } = useToast();
  const [asking, setAsking] = useState(false);
  const headingId = useId();

  if (!hasLimit(limits)) return null;

  return (
    <section aria-labelledby={headingId} className="bg-surface border border-border-light rounded-md p-4 sm:p-5 mb-5">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Gauge size={17} className="text-primary" aria-hidden="true" />
          <h2 id={headingId} className="font-bold text-[14px] text-navy">Monthly selling limit</h2>
        </div>
        <p className="text-[12px] text-muted">Resets on {resetDay(limits.resetsAt)}</p>
      </div>

      <div className="flex flex-wrap gap-4 sm:gap-6">
        {limits.items.limit !== null && (
          <Bar
            label="Items listed this month"
            used={limits.items.used}
            limit={limits.items.limit}
            usedText={`${limits.items.used} of ${count(limits.items.limit, 'item')}`}
          />
        )}
        {limits.value.limit !== null && (
          <Bar
            label="Starting prices listed this month"
            used={limits.value.used}
            limit={limits.value.limit}
            usedText={`${pkr(limits.value.used)} of ${pkr(limits.value.limit)}`}
          />
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-border-light">
        <p className="text-[12px] text-muted">
          {limits.standing === 'NEW'
            ? `Complete ${count(limits.salesToGraduate, 'more sale')} to remove the limit.`
            : limits.standing === 'RESTRICTED'
              ? `The limit is back because ${limits.refunds} of your ${limits.paidSales} paid sales in the last 12 months were refunded, to ${limits.refundBuyers} different buyers.`
              : 'An admin set a personal limit for your account.'}
        </p>
        <Button variant="outline" size="sm" onClick={() => setAsking(true)}>Request a higher limit</Button>
      </div>

      {asking && (
        <ReasonModal
          title="Request a higher limit"
          subject="Your monthly selling limit"
          description="An admin reads every request and can raise your limit. You can send one a month."
          submitLabel="Send request"
          fieldLabel="Anything the admin should know? (optional)"
          placeholder="e.g. I have 40 cameras from my shop to list this month"
          optional
          onSubmit={async (note) => {
            const result = await request.mutateAsync(note);
            setAsking(false);
            showToast(
              result.alreadyRequested
                ? { type: 'info', title: 'You already asked this month', message: 'An admin has your request.' }
                : { type: 'success', title: 'Request sent', message: 'An admin will look at your limit.' },
            );
          }}
          onClose={() => setAsking(false)}
        />
      )}
    </section>
  );
}
