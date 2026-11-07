import { Link, useNavigate } from 'react-router-dom';
import { useTimer } from '../../hooks/useTimer';
import AuctionThumbnail from '../ui/AuctionThumbnail';
import Button from '../ui/Button';
import type { Auction } from '../../types/api';
import { conditionLabel, count, locatedIn, pkr, weekdayTime } from '../../utils/format';
import WatchHeart from './WatchHeart';

export function ResultCardSkeleton() {
  return (
    <div className="bg-surface border border-border-light rounded-md overflow-hidden">
      <div className="h-[160px] sm:h-[180px] bg-border-light animate-pulse" />
      <div className="p-4">
        <div className="flex gap-1.5 mb-2">
          <div className="h-[18px] w-20 bg-border-light rounded-full animate-pulse" />
          <div className="h-[18px] w-14 bg-border-light rounded-full animate-pulse" />
        </div>
        <div className="h-4 bg-border-light rounded animate-pulse mb-1.5" />
        <div className="h-4 w-3/4 bg-border-light rounded animate-pulse mb-4" />
        <div className="flex items-end justify-between">
          <div>
            <div className="h-3 w-16 bg-border-light rounded animate-pulse mb-1" />
            <div className="h-5 w-28 bg-border-light rounded animate-pulse" />
            <div className="h-3 w-12 bg-border-light rounded animate-pulse mt-1" />
          </div>
          <div className="h-8 w-20 bg-border-light rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
}

/** One result as a card: the grid view. */
export default function ResultCard({ auction, isGuest }: { auction: Auction; isGuest: boolean }) {
  const navigate = useNavigate();
  const timer = useTimer(auction.endTime);
  const isEndingSoon = timer.hours === 0 && timer.minutes < 60 && !timer.isExpired;
  const isFinalMinutes = timer.hours === 0 && timer.minutes < 5 && !timer.isExpired;
  const place = locatedIn(auction.sellerCity, auction.sellerProvince);
  const open = () => navigate(`/auctions/${auction.auctionId}`);

  return (
    // The whole card is clickable for a mouse; the title link and the button inside are what a
    // keyboard or a screen reader use, so the card itself is not a second, nested "button".
    <article
      className="bg-surface border border-border-light rounded-md overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer group"
      onClick={open}
    >
      <div className="h-[160px] sm:h-[180px] relative overflow-hidden bg-navy">
        <AuctionThumbnail
          src={auction.imageUrl}
          alt=""
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          iconSize={28}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(11,31,58,0.35)] to-transparent" />
        <span className={`absolute bottom-3 left-3 font-bold text-[11px] px-2 py-1 rounded-md flex items-center gap-2 ${timer.totalSeconds < 3600 ? 'bg-primary text-white' : 'bg-surface/15 backdrop-blur-sm text-white'}`}>
          <span>{timer.isExpired ? 'Closed' : timer.display}</span>
          {isFinalMinutes ? (
            <span className="inline-flex items-center gap-1 text-primary text-[9px] font-bold uppercase tracking-[0.3px]">
              <span className="size-2 rounded-full bg-primary animate-countdown-pulse" />
              Ending
            </span>
          ) : isEndingSoon ? (
            <span className="inline-flex items-center rounded-full bg-warning-bg text-warning px-2 py-[2px] text-[9px] font-bold">
              Ending Soon
            </span>
          ) : null}
        </span>
        <WatchHeart auction={auction} isGuest={isGuest} className="absolute top-3 right-3" />
      </div>
      <div className="p-4">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="bg-surface-raised font-medium text-[10px] text-muted px-2 py-[3px] rounded-full">{auction.category}</span>
          <span className="bg-surface-raised font-medium text-[10px] text-muted px-2 py-[3px] rounded-full">{conditionLabel(auction.condition)}</span>
        </div>
        <h3 className="font-bold text-[13px] text-navy leading-[19px] mb-1 line-clamp-2">
          <Link to={`/auctions/${auction.auctionId}`} onClick={(e) => e.stopPropagation()} className="text-navy no-underline hover:underline">
            {auction.title}
          </Link>
        </h3>
        <p className="text-[11px] text-muted mb-0.5">
          {auction.sellerName} · {auction.sellerRating ? `${auction.sellerRating}★` : 'No ratings yet'}
          {auction.sellerSales ? ` · ${count(auction.sellerSales, 'sale')}` : ''}
        </p>
        {place && <p className="text-[11px] text-muted mb-0.5">Located in {place}</p>}
        <p className="text-[11px] text-muted mb-3">Ends {weekdayTime(auction.endTime)}</p>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] text-muted mb-[2px]">Current bid</p>
            <p className="font-extrabold text-[17px] text-primary leading-none">{pkr(auction.currentBid)}</p>
            <p className="text-[10px] text-placeholder mt-1">
              {count(auction.bidCount, 'bid')}{auction.watcherCount > 0 ? ` · ${auction.watcherCount} watching` : ''}
            </p>
          </div>
          {/* An auction stays in the ACTIVE list until the worker closes it, which can lag endTime
             by up to the 5-minute reconcile interval; until then the card shows "Closed" and
             offers the result instead of a live "Bid Now". */}
          <Button
            size="sm"
            variant={timer.isExpired ? 'outline' : 'primary'}
            aria-label={`${timer.isExpired ? 'View result for' : isGuest ? 'View' : 'Bid on'} ${auction.title}`}
            onClick={(e) => { e.stopPropagation(); open(); }}
          >
            {timer.isExpired ? 'View Result' : isGuest ? 'View' : 'Bid Now'}
          </Button>
        </div>
      </div>
    </article>
  );
}
