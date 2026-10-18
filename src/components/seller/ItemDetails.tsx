import { useBids } from '../../queries/auctions';
import { dateTimeShort, pkr, timeAgo } from '../../utils/format';
import { detailFacts, timeline } from '../../utils/sellerItemStage';
import type { SellerItem } from '../../types/api';

const HEADING = 'text-[11px] font-extrabold text-navy uppercase tracking-[0.08em] mb-2';

/** A live auction shows who is bidding; everything else shows what has happened so far. */
function RecentBids({ auctionId, now }: { auctionId: string; now: number }) {
  const { data: bids, isLoading, isError } = useBids(auctionId);

  if (isLoading) return <p className="text-[13px] text-muted">Loading bids…</p>;
  if (isError) return <p className="text-[13px] text-muted">Could not load the bids.</p>;
  if (!bids || bids.length === 0) return <p className="text-[13px] text-muted">No bids yet.</p>;

  return (
    <ul className="list-none m-0 p-0">
      {bids.slice(0, 5).map(bid => (
        <li key={bid.bidId} className="flex items-start gap-3 py-1.5">
          <span className="size-[10px] rounded-full bg-navy mt-1 shrink-0" aria-hidden="true" />
          <span className="flex-1 text-[13px] text-secondary">{bid.buyerName} · {pkr(bid.amount)}</span>
          <span className="text-[12px] text-muted whitespace-nowrap">{timeAgo(bid.timestamp, now)}</span>
        </li>
      ))}
    </ul>
  );
}

/** The expanded part of a row: the facts of the item, and its timeline or recent bids. */
export default function ItemDetails({ item, now, id }: { item: SellerItem; now: number; id: string }) {
  const facts = detailFacts(item);
  const events = timeline(item);
  const { sale } = item;

  return (
    <div id={id} className="bg-bg border-t border-border-light px-5 py-5 sm:pl-[86px] flex flex-wrap gap-x-14 gap-y-6">
      <div className="flex-[1_1_240px] min-w-0">
        <h3 className={HEADING}>Details</h3>
        <dl className="m-0">
          {facts.map(f => (
            <div key={f.label} className="flex justify-between gap-4 py-[7px] border-b border-border">
              <dt className="text-[13px] text-muted">{f.label}</dt>
              <dd className="m-0 text-[13px] font-bold text-navy text-right">{f.value}</dd>
            </div>
          ))}
        </dl>

        {sale?.disputeReason && (
          <div className="mt-4 text-[12px] bg-surface border border-border-light rounded-md px-3 py-2.5 flex flex-col gap-1.5">
            <p className="text-secondary"><span className="font-bold text-navy">Buyer reported:</span> "{sale.disputeReason}"</p>
            {sale.disputeSellerResponse
              ? <p className="text-success-dark"><span className="font-bold">You responded:</span> "{sale.disputeSellerResponse}"</p>
              : <p className="text-muted">You have not responded yet.</p>}
          </div>
        )}
      </div>

      <div className="flex-[1_1_340px] min-w-0">
        {item.stage === 'LIVE' && item.auction ? (
          <>
            <h3 className={HEADING}>Recent bids</h3>
            <RecentBids auctionId={item.auction.auctionId} now={now} />
          </>
        ) : (
          <>
            <h3 className={HEADING}>Timeline</h3>
            <ul className="list-none m-0 p-0">
              {events.map(e => (
                <li key={`${e.text}-${e.at ?? ''}`} className="flex items-start gap-3 py-1.5">
                  <span className="size-[10px] rounded-full bg-navy mt-1 shrink-0" aria-hidden="true" />
                  <span className="flex-1 text-[13px] text-secondary">{e.text}</span>
                  {e.at && <span className="text-[12px] text-muted whitespace-nowrap">{dateTimeShort(e.at)}</span>}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
