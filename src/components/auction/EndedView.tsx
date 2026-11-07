import { Link } from 'react-router-dom';
import type { Auction } from '../../types/api';
import type { AuctionOutcome } from '../../utils/auctionOutcome';
import { count, dateTimeLong, pkr } from '../../utils/format';

type Ended = Exclude<AuctionOutcome, 'live'>;

const linkButton =
  'inline-flex items-center justify-center rounded-sm px-4 py-2.5 font-bold text-[13px] no-underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1';

/**
 * What the page says once an auction is over, whoever is looking: a sale, a highest bid under the
 * reserve, no bids, or a withdrawal. An auction that closed under its reserve was not a sale, so it
 * never shows a "final price", and the cancel reason is for the people who had bid, not for this
 * public page.
 */
export default function EndedView({
  auction, outcome, viewerWon,
}: {
  auction: Auction;
  outcome: Ended;
  /** The signed-in viewer holds the winning bid on a sale, so they are pointed to payment. */
  viewerWon: boolean;
}) {
  const banner =
    outcome === 'sold'
      ? `Item sold on ${dateTimeLong(auction.endTime)}`
      : outcome === 'cancelled'
        ? 'This auction was cancelled by the seller.'
        : `This auction ended on ${dateTimeLong(auction.endTime)}.`;

  return (
    <section aria-label="Result" className="bg-surface border border-border-light rounded-md overflow-hidden">
      <p role="status" className="bg-navy text-white font-bold text-[14px] px-5 py-3">{banner}</p>
      <div className="p-5 flex flex-col gap-3">
        {outcome === 'sold' && (
          <>
            <span className="self-start bg-success-bg border border-success-border text-success-dark text-[11px] font-extrabold tracking-[0.5px] px-3 py-1 rounded-full">SOLD</span>
            <div>
              <p className="text-[12px] text-muted">Final price</p>
              <p className="font-extrabold text-[28px] text-primary leading-none">{pkr(auction.currentBid)}</p>
              <p className="text-[11px] text-muted mt-1">{count(auction.bidCount, 'bid')}</p>
            </div>
          </>
        )}

        {outcome === 'reserve-not-met' && (
          <>
            <div>
              <p className="text-[12px] text-muted">Highest bid</p>
              <p className="font-extrabold text-[28px] text-secondary leading-none">{pkr(auction.currentBid)}</p>
              <p className="text-[11px] text-muted mt-1">{count(auction.bidCount, 'bid')}</p>
            </div>
            <span className="self-start bg-warning-bg border border-warning-border text-warning text-[12px] font-extrabold px-3 py-1 rounded-full">
              Not sold · reserve not met
            </span>
          </>
        )}

        {outcome === 'no-bids' && (
          <div>
            <p className="font-bold text-[15px] text-secondary">Ended with no bids</p>
            <p className="text-[12px] text-muted mt-1">Starting price was {pkr(auction.startPrice)}.</p>
          </div>
        )}

        {outcome === 'cancelled' && (
          <p className="text-[13px] text-secondary leading-[20px]">
            No one bought this item and no one was charged.
          </p>
        )}

        {viewerWon && (
          <p className="text-[13px] text-secondary">
            You won this item.{' '}
            <Link to={`/buyer/auction-won/${auction.auctionId}`} className="font-bold text-primary hover:underline">See payment details</Link>
          </p>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          {outcome !== 'cancelled' && (
            <Link to="/become-a-seller" className={`${linkButton} bg-primary text-white hover:bg-primary-dark`}>Sell one like this</Link>
          )}
          <Link to="/browse" className={`${linkButton} border border-border-medium text-secondary hover:border-primary hover:text-primary`}>Browse live auctions</Link>
        </div>
      </div>
    </section>
  );
}
