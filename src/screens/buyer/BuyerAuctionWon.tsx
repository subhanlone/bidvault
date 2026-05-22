import { useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, Trophy, Frown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BuyerNavbar } from '../../components/ui';

interface WonState {
  auctionId: string;
  title: string;
  emoji: string;
  finalBid: number;
  won: boolean;
}

export default function BuyerAuctionWon() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const state = location.state as WonState | null;

  const won = state?.won ?? true;
  const title = state?.title ?? 'Auction Item';
  const emoji = state?.emoji ?? '🏆';
  const finalBid = state?.finalBid ?? 0;

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <BuyerNavbar userName={user?.name} onLogout={logout} />

      <main className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
        {won ? (
          <>
            <div className="flex justify-center mb-4">
              <Sparkles size={60} strokeWidth={1.2} className="text-[#f59e0b]" />
            </div>
            <div className="bg-[#f0faf4] border border-[rgba(26,122,74,0.2)] flex items-center justify-center rounded-[20px] size-[72px] sm:size-[80px] mb-5">
              <div className="bg-[#1a7a4a] flex items-center justify-center rounded-full size-[48px] sm:size-[52px]">
                <Trophy size={24} strokeWidth={2} className="text-white" />
              </div>
            </div>
            <h1 className="font-extrabold text-[26px] sm:text-[32px] text-[#0b1f3a] mb-2 flex items-center gap-2">
              You Won! <Trophy size={24} strokeWidth={1.8} className="text-[#f59e0b]" />
            </h1>
            <p className="text-[14px] sm:text-[15px] text-[#6c757d] text-center max-w-[400px] mb-8">
              Congratulations! You've won the auction for <span className="font-bold text-[#343a40]">{title}</span>
            </p>

            <div className="bg-white border border-[#e9ecef] rounded-[16px] p-5 sm:p-6 w-full max-w-[440px] mb-6">
              <div className="bg-[#0b1f3a] h-[160px] sm:h-[180px] rounded-[10px] flex items-center justify-center text-[64px] sm:text-[72px] mb-5">{emoji}</div>
              <h2 className="font-bold text-[15px] sm:text-[16px] text-[#0b1f3a] mb-4">{title}</h2>
              <div className="flex flex-col gap-3">
                {[
                  { label: 'Winning bid', value: `PKR ${finalBid.toLocaleString()}`, highlight: true },
                  { label: 'Status', value: 'Auction Closed' },
                  { label: 'Next step', value: 'Seller will contact you within 24h' },
                ].map(d => (
                  <div key={d.label} className="flex justify-between gap-4">
                    <span className="text-[13px] text-[#6c757d]">{d.label}</span>
                    <span className={`font-bold text-[12px] sm:text-[13px] text-right ${d.highlight ? 'text-[#d0021b]' : 'text-[#1a7a4a]'}`}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-[440px]">
              <button
                onClick={() => navigate('/buyer/my-bids')}
                className="flex-1 border border-[#dee2e6] font-semibold text-[14px] text-[#495057] px-5 py-3 rounded-[8px] hover:bg-[#f8f9fa] transition-colors cursor-pointer"
              >
                View My Bids
              </button>
              <button
                onClick={() => navigate('/buyer/browse')}
                className="flex-1 bg-[#1a7a4a] font-bold text-[14px] text-white px-5 py-3 rounded-[8px] hover:bg-[#135c38] transition-colors cursor-pointer"
              >
                Browse More Auctions
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-center mb-6">
              <Frown size={60} strokeWidth={1.2} className="text-[#adb5bd]" />
            </div>
            <h1 className="font-extrabold text-[24px] sm:text-[28px] text-[#0b1f3a] mb-2">Auction Ended</h1>
            <p className="text-[13px] sm:text-[14px] text-[#6c757d] text-center max-w-[380px] mb-4">
              The auction for <span className="font-bold text-[#343a40]">{title}</span> has ended. You didn't win this time.
            </p>
            <p className="font-bold text-[16px] sm:text-[18px] text-[#d0021b] mb-8">
              Final price: PKR {finalBid.toLocaleString()}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate('/buyer/my-bids')}
                className="border border-[#dee2e6] font-semibold text-[14px] text-[#495057] px-6 py-3 rounded-[8px] hover:bg-[#f8f9fa] transition-colors cursor-pointer"
              >
                View My Bids
              </button>
              <button
                onClick={() => navigate('/buyer/browse')}
                className="bg-[#d0021b] font-bold text-[14px] text-white px-8 py-3 rounded-[8px] hover:bg-[#a80016] transition-colors cursor-pointer"
              >
                Find Another Auction
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
