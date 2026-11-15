import type { RefundSummary, RefundedBy } from '../../types/api';
import { dateTimeShort, pkr } from '../../utils/format';

const DECIDED_BY: Record<RefundedBy, string> = {
  SELLER: 'The seller',
  ADMIN: 'BidVault',
  SYSTEM: 'BidVault (automatically)',
};

/**
 * A refund explained: how much, where it went back to, why, the note, who decided, when, the
 * references and when it should arrive. The server words it for whoever is looking and leaves out
 * what they may not see (a seller never gets "Back to" or "Expected"), so a row is shown only when
 * its field is present. A refund made before the record existed shows Amount and Payment ref only.
 */
export default function RefundDetails({ refund, className = '' }: { refund: RefundSummary; className?: string }) {
  const rows: Array<[string, string | undefined]> = [
    ['Amount', pkr(refund.amount)],
    ['Back to', refund.paidTo],
    ['Why', refund.reasonText],
    ['Note', refund.note],
    ['Decided by', refund.refundedBy ? DECIDED_BY[refund.refundedBy] : undefined],
    ['Date', refund.refundedAt ? dateTimeShort(refund.refundedAt) : undefined],
    ['Refund ref', refund.refundReference],
    ['Payment ref', refund.paymentReference],
    ['Expected', refund.expectedArrival],
  ];

  return (
    <dl className={`m-0 ${className}`}>
      {rows.filter(([, value]) => value).map(([label, value]) => (
        <div key={label} className="flex justify-between gap-4 py-[7px] border-b border-border-light last:border-b-0">
          <dt className="text-[13px] text-muted shrink-0">{label}</dt>
          <dd className="m-0 text-[13px] font-semibold text-navy text-right break-words min-w-0">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
