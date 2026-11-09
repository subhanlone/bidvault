import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import type { Auction } from '../../types/api';
import { count, locatedIn, monthYear } from '../../utils/format';

type SellerFields = Pick<
  Auction,
  'sellerId' | 'sellerName' | 'sellerRating' | 'sellerSales' | 'sellerMemberSince' | 'sellerCity' | 'sellerProvince'
>;

/**
 * Who is selling: name, rating, sales, member since and where they are (city and province, never an
 * address). Their other items and their reviews are on the public seller profile (F3, decision G).
 */
export default function SellerCard({ auction }: { auction: SellerFields }) {
  const place = locatedIn(auction.sellerCity, auction.sellerProvince);
  const profile = `/sellers/${auction.sellerId}`;

  return (
    <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border-light">
      <div className="bg-navy size-[36px] rounded-full flex items-center justify-center text-white font-bold text-[14px] shrink-0" aria-hidden="true">
        {auction.sellerName[0]}
      </div>
      <div className="min-w-0">
        <p className="font-bold text-[13px] text-secondary">
          <Link to={profile} className="text-secondary hover:text-primary hover:underline">{auction.sellerName}</Link>
        </p>
        <div className="flex items-center gap-1 flex-wrap">
          <Star size={12} fill="currentColor" className="text-gold" aria-hidden="true" />
          <span className="text-[11px] text-muted">
            {auction.sellerRating ? `${auction.sellerRating}★` : 'No ratings yet'} · {auction.sellerSales ? count(auction.sellerSales, 'sale') : 'No sales yet'} · Member since {monthYear(auction.sellerMemberSince)}
          </span>
        </div>
        {place && <p className="text-[11px] text-muted mt-0.5">Located in {place}</p>}
        <p className="text-[11px] mt-1 flex gap-3 flex-wrap">
          <Link to={profile} className="font-bold text-primary hover:underline">Seller's other items</Link>
          <Link to={`${profile}#reviews`} className="font-bold text-primary hover:underline">See reviews</Link>
        </p>
      </div>
    </div>
  );
}
