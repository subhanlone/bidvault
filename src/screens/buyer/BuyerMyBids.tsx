import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAuction } from '../../context/AuctionContext';
import { useTimer } from '../../hooks/useTimer';
import { Check, Zap, Trophy, X, Hammer } from 'lucide-react';
import { BuyerNavbar } from '../../components/ui';
import Button from '../../components/ui/Button';
import type { Auction } from '../../types';

interface BidEntry {
  auction: Auction;
  myHighestBid: number;
  myBidCount: number;
  isWinning: boolean;
}

function BidCardSkeleton() {
  return (
    <div className="bg-surface border border-border-light rounded-md overflow-hidden">
      <div className="flex items-stretch">
        <div className="bg-border-light w-[80px] sm:w-[110px] shrink-0 animate-pulse" style={{ minHeight: 90 }} />
        <div className="flex-1 p-3 sm:p-4">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="h-4 w-3/5 bg-border-light rounded animate-pulse" />
            <div className="h-5 w-16 bg-border-light rounded-full animate-pulse" />
          </div>
          <div className="flex gap-4 mb-3">
            <div>
              <div className="h-3 w-20 bg-border-light rounded animate-pulse mb-1" />
              <div className="h-5 w-24 bg-border-light rounded animate-pulse" />
            </div>
            <div>
              <div className="h-3 w-20 bg-border-light rounded animate-pulse mb-1" />
              <div className="h-5 w-24 bg-border-light rounded animate-pulse" />
            </div>
          </div>
          <div className="h-8 w-28 bg-border-light rounded-sm animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function BidCard({ entry }: { entry: BidEntry }) {
  const navigate = useNavigate();
  const timer = useTimer(entry.auction.endTime);
  const isEnded = timer.isExpired;
  const { auction, myHighestBid, isWinning } = entry;

  const status = isEnded
    ? isWinning ? 'won' : 'lost'
    : isWinning ? 'winning' : 'outbid';

  const statusConfig = {
    winning: { icon: <Check size={10} strokeWidth={3} />, label: 'Winning', bg: 'bg-primary-light', border: 'border-primary/30', text: 'text-primary' },
    outbid:  { icon: <Zap size={10} strokeWidth={2.5} />, label: 'Outbid', bg: 'bg-warning-bg', border: 'border-warning-border', text: 'text-warning' },
    won:     { icon: <Trophy size={10} strokeWidth={2.5} />, label: 'Won', bg: 'bg-success-bg', border: 'border-[rgba(26,122,74,0.3)]', text: 'text-success-dark' },
    lost:    { icon: <X size={10} strokeWidth={2.5} />, label: 'Ended', bg: 'bg-bg', border: 'border-border-light', text: 'text-muted' },
  }[status];

  return (
    <div className="bg-surface border border-border-light rounded-md overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex items-stretch">
        <div className="bg-navy w-[80px] sm:w-[110px] shrink-0 overflow-hidden">
          <img src={auction.imageUrl} alt={auction.title} loading="lazy" className="w-full h-full object-cover" />
        </div>

        <div className="flex-1 p-3 sm:p-4 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
            <h3 className="font-bold text-[13px] sm:text-[14px] text-navy leading-tight line-clamp-1">{auction.title}</h3>
            <span className={`font-bold text-[10px] sm:text-[11px] px-2 py-[3px] rounded-full border flex items-center gap-1 ${statusConfig.bg} ${statusConfig.border} ${statusConfig.text} shrink-0`}>
              {statusConfig.icon}{statusConfig.label}
            </span>
          </div>

          <div className="flex flex-wrap gap-x-4 sm:gap-x-5 gap-y-1 mb-3">
            <div>
              <p className="text-2xs sm:text-xs text-placeholder font-bold uppercase">My Highest Bid</p>
              <p className="font-extrabold text-[14px] sm:text-[16px] text-primary">PKR {myHighestBid.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-2xs sm:text-xs text-placeholder font-bold uppercase">Current Bid</p>
              <p className="font-bold text-[14px] sm:text-[16px] text-secondary">PKR {auction.currentBid.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-2xs sm:text-xs text-placeholder font-bold uppercase">Time Left</p>
              <p className={`font-bold text-[13px] sm:text-[14px] ${isEnded ? 'text-muted' : timer.totalSeconds < 3600 ? 'text-primary' : 'text-secondary'}`}>
                {isEnded ? 'Ended' : timer.display}
              </p>
            </div>
          </div>

          {!isEnded && (
            <button
              onClick={() => navigate(`/buyer/live-bidding/${auction.auctionId}`)}
              className={`font-bold text-[12px] px-3 sm:px-4 py-[7px] sm:py-2 rounded-sm transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${
                status === 'outbid'
                  ? 'bg-primary text-white hover:bg-primary-dark'
                  : 'border border-border-medium text-tertiary hover:bg-bg'
              }`}
            >
              {status === 'outbid' ? 'Bid Again →' : 'View Live Auction'}
            </button>
          )}
          {isEnded && status === 'won' && (
            <span className="font-bold text-[11px] sm:text-[12px] text-success-dark">Complete payment in My Wins</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BuyerMyBids() {
  const { user, logout } = useAuth();
  const { auctions, bids, fetchMyBids } = useAuction();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyBids().finally(() => setLoading(false));
  }, [fetchMyBids]);

  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const myBidEntries: BidEntry[] = Object.entries(bids)
    .map(([auctionId, bidList]) => {
      const myBids = bidList.filter(b => b.buyerId === user?.userId);
      if (myBids.length === 0) return null;
      const auction = auctions.find(a => a.auctionId === auctionId);
      if (!auction) return null;
      const myHighestBid = Math.max(...myBids.map(b => b.amount));
      const isWinning = myHighestBid === auction.currentBid;
      return { auction, myHighestBid, myBidCount: myBids.length, isWinning };
    })
    .filter((e): e is BidEntry => e !== null)
    .sort((a, b) => {
      const aEnded = new Date(a.auction.endTime).getTime() < now;
      const bEnded = new Date(b.auction.endTime).getTime() < now;
      if (aEnded !== bEnded) return aEnded ? 1 : -1;
      return new Date(a.auction.endTime).getTime() - new Date(b.auction.endTime).getTime();
    });

  const activeCount = myBidEntries.filter(e => new Date(e.auction.endTime).getTime() > now).length;
  const winningCount = myBidEntries.filter(e => e.isWinning && new Date(e.auction.endTime).getTime() > now).length;

  return (
    <div className="min-h-screen bg-bg">
      <BuyerNavbar userName={user?.name} onLogout={logout} />

      <main className="max-w-[860px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="font-extrabold text-[20px] sm:text-[22px] text-navy">My Bids</h1>
            <p className="text-[13px] text-muted mt-0.5">All auctions you've placed bids on</p>
          </div>
          {!loading && myBidEntries.length > 0 && (
            <div className="flex gap-2 sm:gap-3">
              {[
                { val: activeCount, label: 'Active', color: 'text-navy' },
                { val: winningCount, label: 'Winning', color: 'text-success-dark' },
                { val: myBidEntries.length, label: 'Total', color: 'text-secondary' },
              ].map(s => (
                <div key={s.label} className="bg-surface border border-border-light rounded-md px-3 sm:px-4 py-2 text-center min-w-[60px]">
                  <p className={`font-extrabold text-[18px] sm:text-[20px] ${s.color}`}>{s.val}</p>
                  <p className="text-[10px] sm:text-[11px] text-muted">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => <BidCardSkeleton key={i} />)}
          </div>
        ) : myBidEntries.length === 0 ? (
          <div className="bg-surface border border-border-light rounded-lg flex flex-col items-center justify-center py-14 sm:py-16 px-6 text-center">
            <div className="flex justify-center mb-4"><Hammer size={48} strokeWidth={1.3} className="text-placeholder" /></div>
            <h2 className="font-bold text-[17px] sm:text-[18px] text-navy mb-2">No bids yet</h2>
            <p className="text-[13px] sm:text-[14px] text-muted mb-6 max-w-[300px]">
              You haven't placed any bids yet. Browse live auctions and start bidding!
            </p>
            <Button variant="ghost" onClick={() => navigate('/buyer/browse')}>
              Browse Auctions →
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {myBidEntries.map(entry => (
              <BidCard key={entry.auction.auctionId} entry={entry} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
