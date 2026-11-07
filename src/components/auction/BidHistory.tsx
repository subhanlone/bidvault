import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useBids } from '../../queries/auctions';
import { useSignInLink } from '../../hooks/useSignInLink';
import { count, pkr, timeShort } from '../../utils/format';

/** Who is looking: a member (signed in), a guest, or a returning visitor whose session is being restored. */
export type Viewer = 'member' | 'guest' | 'pending';

/**
 * The list of bids is for signed-in members: a guest is told how many bids there are and is offered
 * the sign-in, and no request is made. Remount it per auction (`key`).
 */
export default function BidHistory({ auctionId, bidCount, viewer }: { auctionId: string; bidCount: number; viewer: Viewer }) {
  const signIn = useSignInLink();
  const { data: bids = [], isError, refetch } = useBids(auctionId, viewer === 'member');
  const [visible, setVisible] = useState(8);

  const failed = isError && bids.length === 0;

  return (
    <section aria-labelledby="bid-history-title" className="bg-surface border border-border-light rounded-md p-4 sm:p-5">
      <h3 id="bid-history-title" className="font-bold text-[14px] text-navy mb-4">
        Bid History{viewer === 'member' && !failed && ` (${bids.length})`}
      </h3>

      {viewer === 'guest' ? (
        <p className="text-[13px] text-muted text-center py-6 leading-[20px]">
          {count(bidCount, 'bid')} so far. The list of bids is for signed-in members.{' '}
          <Link {...signIn} className="font-bold text-primary hover:underline">Sign in</Link> to see it.
        </p>
      ) : viewer === 'pending' ? (
        <p className="text-[13px] text-muted text-center py-6">Loading…</p>
      ) : failed ? (
        <p className="text-[13px] text-error text-center py-6">
          Could not load the bid history.{' '}
          <button type="button" onClick={() => { void refetch(); }} className="font-bold underline cursor-pointer">Try again</button>
        </p>
      ) : bids.length === 0 ? (
        <p className="text-[13px] text-muted text-center py-6">No bids yet. Be the first!</p>
      ) : (
        <div className="flex flex-col gap-1">
          {bids.slice(0, visible).map((b, i) => (
            <div key={b.bidId} className={`flex items-center justify-between py-3 ${i < bids.length - 1 ? 'border-b border-surface-raised' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="bg-surface-raised size-[32px] rounded-full flex items-center justify-center font-bold text-[12px] text-secondary shrink-0">
                  {b.isMine ? 'Y' : b.buyerName[0]}
                </div>
                <div>
                  <p className="font-bold text-[12px] text-secondary">{b.isMine ? 'You' : b.buyerName}</p>
                  <p className="text-[10px] text-placeholder">{timeShort(b.timestamp)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-[13px] text-secondary">{pkr(b.amount)}</p>
                {i === 0 && (
                  <span className="bg-success-bg border border-success-border text-success-dark text-[10px] font-bold px-2 py-[1px] rounded-full">
                    Highest
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {viewer === 'member' && bids.length > visible && (
        <button
          type="button"
          onClick={() => setVisible((c) => c + 8)}
          className="w-full mt-3 text-[12px] font-bold text-primary hover:underline cursor-pointer text-center"
        >
          Show more ({bids.length - visible} remaining)
        </button>
      )}
    </section>
  );
}
