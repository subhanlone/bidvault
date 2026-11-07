import { Link, useNavigate } from 'react-router-dom';
import AuctionThumbnail from '../ui/AuctionThumbnail';
import type { Auction } from '../../types/api';
import { count, locatedIn, pkr, timeLeft, weekdayTime } from '../../utils/format';
import WatchHeart from './WatchHeart';

export function ResultRowSkeleton() {
  return (
    <div className="bg-surface border border-border-light rounded-xl p-3.5 flex flex-col sm:flex-row gap-4">
      <div className="w-full sm:w-[200px] h-[170px] sm:h-[150px] rounded-[10px] bg-border-light animate-pulse shrink-0" />
      <div className="flex-1 flex flex-col gap-2.5">
        <div className="h-4 w-3/4 bg-border-light rounded animate-pulse" />
        <div className="h-6 w-32 bg-border-light rounded animate-pulse" />
        <div className="h-3 w-48 bg-border-light rounded animate-pulse" />
        <div className="h-3 w-36 bg-border-light rounded animate-pulse" />
      </div>
    </div>
  );
}

/**
 * One result as a row: the list view, in the order a buyer reads it (the picture, the title, the
 * price, the bids and the time left, where it is) with the seller on the right. `now` comes from
 * the screen, which keeps one clock for every row.
 */
export default function ResultRow({ auction, isGuest, now }: { auction: Auction; isGuest: boolean; now: number }) {
  const navigate = useNavigate();
  const place = locatedIn(auction.sellerCity, auction.sellerProvince);
  const left = timeLeft(auction.endTime, now);
  const open = () => navigate(`/auctions/${auction.auctionId}`);

  return (
    // The whole row is clickable for a mouse; the title link is what a keyboard or a screen reader
    // uses, so the row itself is not a second, nested "button".
    <article
      className="bg-surface border border-border-light rounded-xl p-3.5 flex flex-col sm:flex-row gap-4 sm:gap-[18px] hover:shadow-md transition-shadow duration-200 cursor-pointer"
      onClick={open}
    >
      <div className="relative w-full sm:w-[200px] h-[170px] sm:h-[150px] rounded-[10px] overflow-hidden bg-navy shrink-0">
        <AuctionThumbnail src={auction.imageUrl} alt="" className="w-full h-full object-cover" iconSize={30} />
        <WatchHeart auction={auction} isGuest={isGuest} className="absolute top-2 right-2" />
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <h2 className="font-bold text-[16px] leading-[1.35] text-navy m-0">
          <Link to={`/auctions/${auction.auctionId}`} onClick={(e) => e.stopPropagation()} className="text-navy no-underline hover:underline">
            {auction.title}
          </Link>
        </h2>
        <p className="font-extrabold text-[22px] leading-tight text-primary mt-0.5 mb-0">{pkr(auction.currentBid)}</p>
        <p className="text-[13px] text-secondary m-0">
          {count(auction.bidCount, 'bid')} · {left === 'Ended' ? 'Ended' : `${left} left`} ({weekdayTime(auction.endTime)})
        </p>
        {place && <p className="text-[13px] text-muted m-0">Located in {place}</p>}
      </div>

      <div className="sm:w-[200px] sm:shrink text-[13px] leading-normal text-secondary">
        <strong className="block text-navy">{auction.sellerName}</strong>
        {auction.sellerRating ? `${auction.sellerRating} ★` : 'No ratings yet'}
        {auction.sellerSales ? ` · ${count(auction.sellerSales, 'sale')}` : ''}
      </div>
    </article>
  );
}
