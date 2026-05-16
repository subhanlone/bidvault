import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAuction } from '../../context/AuctionContext';
import { useTimer } from '../../hooks/useTimer';
import { Check, Zap, Trophy, X, Hammer } from 'lucide-react';
import { IconBidVaultLogo } from '../../components/Icons';
import type { Auction } from '../../types';

interface BidEntry {
  auction: Auction;
  myHighestBid: number;
  myBidCount: number;
  isWinning: boolean;
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
    winning: { icon: <Check size={10} strokeWidth={3} />, label: 'Winning', bg: 'bg-[#f0faf4]', border: 'border-[rgba(26,122,74,0.3)]', text: 'text-[#1a7a4a]' },
    outbid:  { icon: <Zap size={10} strokeWidth={2.5} />, label: 'Outbid', bg: 'bg-[#fff5f5]', border: 'border-[rgba(208,2,27,0.2)]', text: 'text-[#d0021b]' },
    won:     { icon: <Trophy size={10} strokeWidth={2.5} />, label: 'Won', bg: 'bg-[#f0faf4]', border: 'border-[rgba(26,122,74,0.3)]', text: 'text-[#1a7a4a]' },
    lost:    { icon: <X size={10} strokeWidth={2.5} />, label: 'Ended', bg: 'bg-[#f8f9fa]', border: 'border-[#e9ecef]', text: 'text-[#6c757d]' },
  }[status];

  return (
    <div className="bg-white border border-[#e9ecef] rounded-[14px] overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex items-stretch">
        {/* Image panel */}
        <div className="bg-[#0b1f3a] w-[90px] sm:w-[110px] shrink-0 overflow-hidden">
          <img src={auction.imageUrl} alt={auction.title} className="w-full h-full object-cover" />
        </div>

        {/* Content */}
        <div className="flex-1 p-4 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
            <h3 className="font-bold text-[14px] text-[#0b1f3a] leading-tight line-clamp-1">{auction.title}</h3>
            <span className={`font-bold text-[11px] px-2 py-[3px] rounded-[99px] border flex items-center gap-1 ${statusConfig.bg} ${statusConfig.border} ${statusConfig.text} shrink-0`}>
              {statusConfig.icon}{statusConfig.label}
            </span>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-1 mb-3">
            <div>
              <p className="text-[10px] text-[#adb5bd] font-bold uppercase">My Highest Bid</p>
              <p className="font-extrabold text-[16px] text-[#d0021b]">PKR {myHighestBid.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[10px] text-[#adb5bd] font-bold uppercase">Current Bid</p>
              <p className="font-bold text-[16px] text-[#343a40]">PKR {auction.currentBid.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[10px] text-[#adb5bd] font-bold uppercase">Time Left</p>
              <p className={`font-bold text-[14px] ${isEnded ? 'text-[#6c757d]' : timer.totalSeconds < 3600 ? 'text-[#d0021b]' : 'text-[#343a40]'}`}>
                {isEnded ? 'Ended' : timer.display}
              </p>
            </div>
          </div>

          {!isEnded && (
            <button
              onClick={() => navigate(`/buyer/live-bidding/${auction.auctionId}`)}
              className={`font-bold text-[12px] px-4 py-2 rounded-[7px] transition-colors ${
                status === 'outbid'
                  ? 'bg-[#d0021b] text-white hover:bg-[#a80016]'
                  : 'border border-[#dee2e6] text-[#495057] hover:bg-[#f8f9fa]'
              }`}
            >
              {status === 'outbid' ? 'Bid Again →' : 'View Live Auction'}
            </button>
          )}
          {isEnded && status === 'won' && (
            <span className="font-bold text-[12px] text-[#1a7a4a]">Seller will contact you within 24h</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BuyerMyBids() {
  const { user, logout } = useAuth();
  const { auctions, bids } = useAuction();

  const myBidEntries: BidEntry[] = Object.entries(bids)
    .map(([auctionId, bidList]) => {
      const myBids = bidList.filter(b => b.buyerId === user?.userId);
      if (myBids.length === 0) return null;
      const auction = auctions.find(a => a.auctionId === auctionId);
      if (!auction) return null;
      const myHighestBid = Math.max(...myBids.map(b => b.amount));
      const isWinning = bidList[0]?.buyerId === user?.userId;
      return { auction, myHighestBid, myBidCount: myBids.length, isWinning };
    })
    .filter((e): e is BidEntry => e !== null)
    .sort((a, b) => {
      // Active auctions first, then by end time ascending
      const aEnded = new Date(a.auction.endTime).getTime() < Date.now();
      const bEnded = new Date(b.auction.endTime).getTime() < Date.now();
      if (aEnded !== bEnded) return aEnded ? 1 : -1;
      return new Date(a.auction.endTime).getTime() - new Date(b.auction.endTime).getTime();
    });

  const activeCount = myBidEntries.filter(e => new Date(e.auction.endTime).getTime() > Date.now()).length;
  const winningCount = myBidEntries.filter(e => e.isWinning && new Date(e.auction.endTime).getTime() > Date.now()).length;

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <header className="bg-[#0b1f3a] flex items-center justify-between px-4 sm:px-8 py-0">
        <div className="flex items-center gap-6 sm:gap-8">
          <div className="flex gap-[10px] items-center py-4">
            <div className="bg-[#d0021b] flex items-center justify-center rounded-[8px] size-[34px]">
              <IconBidVaultLogo className="size-[18px]" />
            </div>
            <span className="font-extrabold text-[20px] text-white tracking-[-0.3px]">
              Bid<span className="text-[#d0021b]">Vault</span>
            </span>
          </div>
          <nav className="hidden sm:flex">
            <Link to="/buyer/browse" className="font-semibold text-[13px] px-4 py-5 border-b-2 text-[rgba(255,255,255,0.55)] border-transparent hover:text-white">Browse Auctions</Link>
            <span className="font-semibold text-[13px] px-4 py-5 border-b-2 text-white border-[#d0021b]">My Bids</span>
            <Link to="/buyer/watchlist" className="font-semibold text-[13px] px-4 py-5 border-b-2 text-[rgba(255,255,255,0.55)] border-transparent hover:text-white">Watchlist</Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-[rgba(255,255,255,0.1)] rounded-full size-[34px] flex items-center justify-center">
            <span className="font-bold text-[13px] text-white">{user?.name[0] ?? 'B'}</span>
          </div>
          <span className="hidden sm:block font-semibold text-[13px] text-white">{user?.name?.split(' ')[0]}</span>
          <button onClick={logout} className="font-semibold text-[12px] text-[rgba(255,255,255,0.55)] hover:text-white ml-1">Logout</button>
        </div>
      </header>

      <div className="max-w-[860px] mx-auto px-4 sm:px-6 py-8">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="font-extrabold text-[22px] text-[#0b1f3a]">My Bids</h1>
            <p className="text-[13px] text-[#6c757d] mt-0.5">All auctions you've placed bids on</p>
          </div>
          {myBidEntries.length > 0 && (
            <div className="flex gap-3">
              <div className="bg-white border border-[#e9ecef] rounded-[10px] px-4 py-2 text-center">
                <p className="font-extrabold text-[20px] text-[#0b1f3a]">{activeCount}</p>
                <p className="text-[11px] text-[#6c757d]">Active</p>
              </div>
              <div className="bg-white border border-[#e9ecef] rounded-[10px] px-4 py-2 text-center">
                <p className="font-extrabold text-[20px] text-[#1a7a4a]">{winningCount}</p>
                <p className="text-[11px] text-[#6c757d]">Winning</p>
              </div>
              <div className="bg-white border border-[#e9ecef] rounded-[10px] px-4 py-2 text-center">
                <p className="font-extrabold text-[20px] text-[#343a40]">{myBidEntries.length}</p>
                <p className="text-[11px] text-[#6c757d]">Total</p>
              </div>
            </div>
          )}
        </div>

        {/* Bid list */}
        {myBidEntries.length === 0 ? (
          <div className="bg-white border border-[#e9ecef] rounded-[16px] flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="flex justify-center mb-4"><Hammer size={56} strokeWidth={1.3} className="text-[#adb5bd]" /></div>
            <h2 className="font-bold text-[18px] text-[#0b1f3a] mb-2">No bids yet</h2>
            <p className="text-[14px] text-[#6c757d] mb-6 max-w-[300px]">
              You haven't placed any bids yet. Browse live auctions and start bidding!
            </p>
            <Link to="/buyer/browse" className="bg-[#d0021b] font-bold text-[14px] text-white px-6 py-3 rounded-[8px] hover:bg-[#a80016] transition-colors">
              Browse Auctions →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {myBidEntries.map(entry => (
              <BidCard key={entry.auction.auctionId} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
