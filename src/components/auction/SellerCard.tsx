import { useState } from 'react';
import { Star } from 'lucide-react';
import { api } from '../../services/api';
import type { Auction, SellerReview } from '../../types/api';
import { count, dateMedium, locatedIn, monthYear } from '../../utils/format';

type SellerFields = Pick<
  Auction,
  'sellerId' | 'sellerName' | 'sellerRating' | 'sellerSales' | 'sellerMemberSince' | 'sellerCity' | 'sellerProvince'
>;

type Reviews = { average: number | null; count: number; reviews: SellerReview[] };

/**
 * Who is selling: name, rating, sales, member since and where they are (city and province, never an
 * address). The reviews are public and load when asked for. Remount it per auction (`key`) so the
 * open/closed state does not follow the visitor to the next item.
 */
export default function SellerCard({ auction }: { auction: SellerFields }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState<Reviews | null>(null);
  const place = locatedIn(auction.sellerCity, auction.sellerProvince);

  const toggle = async () => {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (reviews) return;
    setLoading(true);
    try {
      setReviews(await api.get(`/reviews/seller/${auction.sellerId}`));
    } catch {
      setReviews({ average: null, count: 0, reviews: [] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border-light">
        <div className="bg-navy size-[36px] rounded-full flex items-center justify-center text-white font-bold text-[14px] shrink-0">
          {auction.sellerName[0]}
        </div>
        <div>
          <p className="font-bold text-[13px] text-secondary">{auction.sellerName}</p>
          <div className="flex items-center gap-1 flex-wrap">
            <Star size={12} fill="currentColor" className="text-gold" aria-hidden="true" />
            <span className="text-[11px] text-muted">
              {auction.sellerRating ? `${auction.sellerRating}★` : 'No ratings yet'} · {auction.sellerSales ? count(auction.sellerSales, 'sale') : 'No sales yet'} · Member since {monthYear(auction.sellerMemberSince)}
            </span>
            <button
              type="button"
              onClick={toggle}
              className="text-[11px] font-bold text-primary hover:underline cursor-pointer ml-1"
            >
              {open ? 'Hide reviews' : 'See reviews'}
            </button>
          </div>
          {place && <p className="text-[11px] text-muted mt-0.5">Located in {place}</p>}
        </div>
      </div>

      {open && (
        <div className="mt-3 pt-3 border-t border-border-light">
          {loading ? (
            <p className="text-[12px] text-muted">Loading reviews…</p>
          ) : !reviews || reviews.count === 0 ? (
            <p className="text-[12px] text-muted">No reviews yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-[11px] font-bold text-placeholder uppercase tracking-wide">
                {reviews.count} review{reviews.count !== 1 ? 's' : ''}
              </p>
              {reviews.reviews.map((r) => (
                <div key={r.reviewId} className="text-[12px]">
                  <div className="flex items-center gap-1 mb-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={11}
                        aria-hidden="true"
                        className={i < r.stars ? 'text-gold' : 'text-border-medium'}
                        fill={i < r.stars ? 'currentColor' : 'none'}
                      />
                    ))}
                    <span className="text-[10px] text-placeholder ml-1">{dateMedium(r.createdAt)}</span>
                  </div>
                  {r.comment && <p className="text-secondary">{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
