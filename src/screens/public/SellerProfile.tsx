import { useEffect } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { CheckCircle, Search, Star } from 'lucide-react';
import { useAuth } from '../../context/auth';
import { useSellerAuctions, useSellerProfile, useSellerReviews } from '../../queries/sellers';
import { SiteNavbar, AuctionThumbnail, ErrorState, Button } from '../../components/ui';
import ResultCard, { ResultCardSkeleton } from '../../components/browse/ResultCard';
import { ApiError } from '../../services/api';
import { auctionOutcome } from '../../utils/auctionOutcome';
import { count, dateMedium, locatedIn, monthYear, pkr } from '../../utils/format';
import type { Auction, SellerReview } from '../../types/api';

/**
 * A seller's public page (guest browsing F3): who they are (name, member since, where they are,
 * their own words), what they sell now, what has ended, and their reviews. Reviewers are masked by
 * the API, and the page never has a phone number or an e-mail address: the API does not send them.
 */
export default function PublicSellerProfile() {
  const { sellerId } = useParams<{ sellerId: string }>();
  const { hash } = useLocation();
  const { user } = useAuth();
  const profile = useSellerProfile(sellerId);
  const found = Boolean(profile.data);
  const live = useSellerAuctions(sellerId, 'ACTIVE', found);
  const ended = useSellerAuctions(sellerId, 'CLOSED', found);
  const reviews = useSellerReviews(sellerId, found);

  // "See reviews" links here with #reviews; the section only exists once the data has arrived, so
  // the browser's own jump to the anchor happens too early.
  useEffect(() => {
    if (hash === '#reviews' && reviews.data) {
      document.getElementById('reviews')?.scrollIntoView();
    }
  }, [hash, reviews.data]);

  if (profile.isPending) {
    return (
      <div className="min-h-screen bg-bg">
        <SiteNavbar />
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-6 flex flex-col gap-4">
          <div className="h-[150px] bg-surface border border-border-light rounded-md animate-pulse" />
          <div className="h-[260px] bg-surface border border-border-light rounded-md animate-pulse" />
        </div>
      </div>
    );
  }

  const notFound = profile.error instanceof ApiError && profile.error.status === 404;
  if (profile.isError && !notFound) {
    return (
      <div className="min-h-screen bg-bg">
        <SiteNavbar />
        <div className="max-w-[560px] mx-auto px-4 py-16">
          <ErrorState title="Could not load this seller" onRetry={() => { void profile.refetch(); }} retrying={profile.isFetching} />
        </div>
      </div>
    );
  }

  const seller = profile.data;
  if (!seller) {
    return (
      <div className="min-h-screen bg-bg">
        <SiteNavbar />
        <main className="max-w-[480px] mx-auto px-4 py-16 text-center">
          <div className="bg-surface-raised rounded-full p-5 flex justify-center mb-4 w-fit mx-auto">
            <Search size={40} strokeWidth={1.3} className="text-placeholder" aria-hidden="true" />
          </div>
          <h1 className="font-extrabold text-[22px] text-navy mb-2">Seller not found</h1>
          <p className="text-[13px] text-muted mb-5">The link may be old, or this account no longer sells on BidVault.</p>
          <Link
            to="/browse"
            className="inline-flex items-center justify-center rounded-sm px-5 py-2.5 font-bold text-[14px] bg-primary text-white hover:bg-primary-dark transition-colors no-underline"
          >
            Browse live auctions
          </Link>
        </main>
      </div>
    );
  }

  const place = locatedIn(seller.city, seller.province);
  const liveItems: Auction[] = live.data?.pages.flatMap((p) => p.items) ?? [];
  const endedItems: Auction[] = ended.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="min-h-screen bg-bg">
      <SiteNavbar />
      <main className="max-w-[1100px] mx-auto px-4 sm:px-6 py-6 flex flex-col gap-5">
        {/* Who */}
        <section className="bg-surface border border-border-light rounded-md p-5 sm:p-6 flex flex-col sm:flex-row gap-4 sm:items-start">
          <div className="bg-navy size-[64px] rounded-full flex items-center justify-center text-white font-extrabold text-[26px] shrink-0" aria-hidden="true">
            {seller.displayName[0]}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-extrabold text-[22px] text-navy leading-tight mb-1">{seller.displayName}</h1>
            <p className="text-[13px] text-secondary flex items-center gap-1 flex-wrap">
              <Star size={13} fill="currentColor" className="text-gold" aria-hidden="true" />
              {seller.rating !== null ? `${seller.rating}★ from ${count(seller.ratingCount, 'rating')}` : 'No ratings yet'}
              <span aria-hidden="true">·</span>
              {seller.itemsSold > 0 ? `${count(seller.itemsSold, 'item')} sold` : 'No sales yet'}
            </p>
            <p className="text-[12px] text-muted mt-1">Member since {monthYear(seller.memberSince)}</p>
            {place && <p className="text-[12px] text-muted">Located in {place}</p>}
            {seller.bio && (
              <div className="mt-3 pt-3 border-t border-border-light">
                <h2 className="font-bold text-[11px] text-placeholder uppercase tracking-wide mb-1">About</h2>
                <p className="text-[13px] text-secondary leading-[20px] whitespace-pre-line">{seller.bio}</p>
              </div>
            )}
          </div>
        </section>

        {/* What they sell now */}
        <section aria-labelledby="for-sale-heading" className="flex flex-col gap-3">
          <h2 id="for-sale-heading" className="font-bold text-[16px] text-navy">Items for sale</h2>
          {live.isPending ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <ResultCardSkeleton key={i} />)}
            </div>
          ) : liveItems.length === 0 ? (
            <p className="text-[13px] text-muted bg-surface border border-border-light rounded-md px-4 py-5">Nothing for sale right now.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {liveItems.map((a) => <ResultCard key={a.auctionId} auction={a} isGuest={!user} />)}
              </div>
              {live.hasNextPage && (
                <Button variant="outline" size="sm" className="self-center" loading={live.isFetchingNextPage} onClick={() => { void live.fetchNextPage(); }}>
                  Show more
                </Button>
              )}
            </>
          )}
        </section>

        {/* What has ended */}
        <section aria-labelledby="ended-heading" className="flex flex-col gap-3">
          <h2 id="ended-heading" className="font-bold text-[16px] text-navy">Ended</h2>
          {ended.isPending ? (
            <div className="h-[120px] bg-surface border border-border-light rounded-md animate-pulse" />
          ) : endedItems.length === 0 ? (
            <p className="text-[13px] text-muted bg-surface border border-border-light rounded-md px-4 py-5">No ended auctions yet.</p>
          ) : (
            <>
              <ul className="bg-surface border border-border-light rounded-md divide-y divide-border-light m-0 p-0 list-none">
                {endedItems.map((a) => <EndedItem key={a.auctionId} auction={a} />)}
              </ul>
              {ended.hasNextPage && (
                <Button variant="outline" size="sm" className="self-center" loading={ended.isFetchingNextPage} onClick={() => { void ended.fetchNextPage(); }}>
                  Show more
                </Button>
              )}
            </>
          )}
        </section>

        {/* Reviews */}
        <section id="reviews" aria-labelledby="reviews-heading" className="flex flex-col gap-3 scroll-mt-4">
          <h2 id="reviews-heading" className="font-bold text-[16px] text-navy">Reviews</h2>
          {reviews.isPending ? (
            <div className="h-[120px] bg-surface border border-border-light rounded-md animate-pulse" />
          ) : !reviews.data || reviews.data.count === 0 ? (
            <p className="text-[13px] text-muted bg-surface border border-border-light rounded-md px-4 py-5">No reviews yet.</p>
          ) : (
            <ul className="bg-surface border border-border-light rounded-md divide-y divide-border-light m-0 p-0 list-none">
              {reviews.data.reviews.map((r) => <ReviewItem key={r.reviewId} review={r} />)}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

/** An ended auction says what happened, as the auction page does: a sale, a highest bid under the
 * reserve (never a "final price"), or no bids. */
function EndedItem({ auction }: { auction: Auction }) {
  const outcome = auctionOutcome(auction);
  const result =
    outcome === 'sold'
      ? `Sold for ${pkr(auction.currentBid)}`
      : outcome === 'reserve-not-met'
        ? `Not sold · highest bid ${pkr(auction.currentBid)}`
        : 'Ended with no bids';
  return (
    <li className="flex items-center gap-3 p-3">
      <div className="size-[48px] rounded-md overflow-hidden bg-navy shrink-0">
        <AuctionThumbnail src={auction.imageUrl} alt="" className="w-full h-full object-cover" iconSize={20} />
      </div>
      <div className="min-w-0">
        <Link to={`/auctions/${auction.auctionId}`} className="font-semibold text-[13px] text-navy hover:underline block truncate">
          {auction.title}
        </Link>
        <p className="text-[12px] text-muted">{result} · {dateMedium(auction.endTime)}</p>
      </div>
    </li>
  );
}

function ReviewItem({ review }: { review: SellerReview }) {
  return (
    <li className="p-4 text-[13px]">
      <div className="flex items-center gap-1 flex-wrap mb-1">
        <span className="sr-only">{review.stars} out of 5 stars</span>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={12}
            aria-hidden="true"
            className={i < review.stars ? 'text-gold' : 'text-border-medium'}
            fill={i < review.stars ? 'currentColor' : 'none'}
          />
        ))}
        <span className="font-semibold text-secondary ml-1">{review.buyerName}</span>
        {review.verifiedPurchase && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-success-dark">
            <CheckCircle size={12} aria-hidden="true" />Verified purchase
          </span>
        )}
        <span className="text-[11px] text-placeholder">· {dateMedium(review.createdAt)}</span>
      </div>
      <p className="text-[12px] text-muted mb-1">{review.itemTitle}</p>
      {review.comment && <p className="text-secondary leading-[20px]">{review.comment}</p>}
      {review.sellerReply && (
        <p className="mt-2 pl-3 border-l-2 border-border-light text-[12px] text-muted">
          <span className="font-semibold text-secondary">Seller's reply:</span> {review.sellerReply}
        </p>
      )}
    </li>
  );
}
