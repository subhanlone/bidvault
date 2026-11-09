import { useId } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { useAiValuation } from '../../queries/ai';
import { useNow } from '../../hooks/useNow';
import { count, pkr, timeAgo } from '../../utils/format';

/**
 * Agentic AI: what similar items fetch in eBay auctions, as a separate block (eBay's licence: its
 * content is shown apart from BidVault's own, labelled as such). An AI agent chooses which eBay
 * auctions are comparable; the number is their plain average, converted to rupees. It says how old
 * the data is (eBay's freshness rule), that it is not a sale price, and every state has its own calm
 * wording: "not enough data" is a real answer for unique items, not an error.
 *
 * Hidden when the feature is off (no keys) or there is nothing to show (an ended auction that never
 * had one).
 */
export default function AiValuationPanel({ auctionId }: { auctionId: string }) {
  const { data } = useAiValuation(auctionId);
  const now = useNow(60_000);
  const headingId = useId();

  if (!data || !data.configured || data.status === null) return null;

  const working = data.status === 'QUEUED' || data.status === 'RUNNING';
  const from = data.source === 'WEB' ? 'via web search' : 'via eBay';

  return (
    <section aria-labelledby={headingId} className="bg-surface border border-border-light rounded-md p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 id={headingId} className="flex items-center gap-1.5 font-bold text-[13px] text-navy">
          <Sparkles size={15} className="text-primary" aria-hidden="true" />
          Price comparison
        </h2>
        <span className="text-[10px] font-bold uppercase tracking-wide text-muted bg-bg border border-border-light rounded-full px-2 py-0.5">
          {from}
        </span>
      </div>

      {working ? (
        <p className="flex items-center gap-2 text-[13px] text-secondary" role="status">
          <Loader2 size={15} className="animate-spin text-muted" aria-hidden="true" />
          Comparing with eBay auctions for similar items…
        </p>
      ) : data.status === 'READY' && data.averagePricePkr !== null ? (
        <div>
          <p className="text-[12px] text-muted">Similar items in eBay auctions</p>
          <p className="font-extrabold text-[24px] text-navy leading-tight">
            <span className="text-[14px] font-bold text-muted mr-1">≈</span>{pkr(data.averagePricePkr)}
          </p>
          <p className="text-[12px] text-secondary mt-1">
            The average current bid of {count(data.listingsUsed ?? 0, 'comparable eBay auction')}
            {data.listingsConsidered ? ` (of ${data.listingsConsidered} with bids)` : ''}. An estimate, not a sale price.
          </p>
        </div>
      ) : data.status === 'INSUFFICIENT_DATA' ? (
        <p className="text-[13px] text-secondary">
          Not enough comparable eBay auctions with bids to estimate a price for this item. Unique and handmade items often have none.
        </p>
      ) : data.status === 'PAUSED' ? (
        <p className="text-[13px] text-secondary">The price comparison is paused for today. Look again tomorrow.</p>
      ) : (
        <p className="text-[13px] text-secondary">The price comparison is not available right now. It will be tried again later.</p>
      )}

      {!working && (data.computedAt || data.refreshing) && (
        <p className="flex items-center gap-1.5 text-[11px] text-muted mt-3 pt-3 border-t border-border-light">
          {data.computedAt && <span>Data from {timeAgo(data.computedAt, now)}</span>}
          {data.refreshing && (
            <span className="inline-flex items-center gap-1">
              {data.computedAt && <span aria-hidden="true">·</span>}
              <Loader2 size={11} className="animate-spin" aria-hidden="true" />Updating…
            </span>
          )}
        </p>
      )}

      <p className="text-[10px] text-placeholder mt-2">
        An AI agent picks the comparable auctions; the figure is computed from their bids. eBay is not involved with BidVault.
      </p>
    </section>
  );
}
