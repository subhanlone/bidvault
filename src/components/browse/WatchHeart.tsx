import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useSignInLink } from '../../hooks/useSignInLink';
import { useWatchlistToggle } from '../../queries/auctions';
import type { Auction } from '../../types/api';

/**
 * The heart on a result. A guest is sent to sign in and returns here; a member adds or removes the
 * watch. Named after its auction, so a screen reader can tell the results' buttons apart. It sits
 * over the picture, so `className` places it.
 */
export default function WatchHeart({ auction, isGuest, className }: { auction: Auction; isGuest: boolean; className: string }) {
  const signIn = useSignInLink();
  const { toggle, isWatched } = useWatchlistToggle();
  const watched = isWatched(auction.auctionId);
  const base = `${className} rounded-full w-[30px] h-[30px] flex items-center justify-center shadow-sm hover:scale-110 transition-transform cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1`;

  if (isGuest) {
    return (
      <Link
        {...signIn}
        onClick={(e) => e.stopPropagation()}
        aria-label={`Sign in to watch ${auction.title}`}
        className={`${base} bg-surface/80 text-muted hover:text-primary`}
      >
        <Heart size={14} className="text-muted" />
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); toggle(auction.auctionId); }}
      aria-label={`${watched ? 'Remove' : 'Add'} ${auction.title} ${watched ? 'from' : 'to'} watchlist`}
      aria-pressed={watched}
      className={`${base} ${watched ? 'bg-primary text-white' : 'bg-surface/80 text-muted hover:text-primary'}`}
    >
      <Heart size={14} className={watched ? 'text-white' : 'text-muted'} fill={watched ? 'currentColor' : 'none'} />
    </button>
  );
}
