import { useLocation, useNavigate, Link } from 'react-router-dom';
import { IconBidVaultLogo, IconTrophy } from '../../components/Icons';

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
  const state = location.state as WonState | null;

  const won = state?.won ?? true;
  const title = state?.title ?? 'Auction Item';
  const emoji = state?.emoji ?? '🏆';
  const finalBid = state?.finalBid ?? 0;

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <header className="bg-[#0b1f3a] flex items-center justify-between px-8 py-4">
        <div className="flex gap-[10px] items-center">
          <div className="bg-[#d0021b] flex items-center justify-center rounded-[8px] size-[34px]">
            <IconBidVaultLogo className="size-[18px]" />
          </div>
          <span className="font-extrabold text-[20px] text-white tracking-[-0.3px]">
            Bid<span className="text-[#d0021b]">Vault</span>
          </span>
        </div>
        <Link to="/buyer/browse" className="font-semibold text-[13px] text-[rgba(255,255,255,0.7)] hover:text-white">Browse Auctions</Link>
      </header>

      <div className="flex flex-col items-center justify-center py-16 px-4">
        {won ? (
          <>
            <div className="text-[80px] mb-4">🎉</div>
            <div className="bg-[#f0faf4] border border-[rgba(26,122,74,0.2)] flex items-center justify-center rounded-[20px] size-[80px] mb-5">
              <div className="bg-[#1a7a4a] flex items-center justify-center rounded-full size-[52px]">
                <IconTrophy className="size-[26px]" />
              </div>
            </div>
            <h1 className="font-extrabold text-[32px] text-[#0b1f3a] mb-2">You Won! 🏆</h1>
            <p className="text-[15px] text-[#6c757d] text-center max-w-[400px] mb-8">
              Congratulations! You've won the auction for <span className="font-bold text-[#343a40]">{title}</span>
            </p>

            <div className="bg-white border border-[#e9ecef] rounded-[16px] p-6 w-full max-w-[440px] mb-6">
              <div className="bg-[#0b1f3a] h-[180px] rounded-[10px] flex items-center justify-center text-[72px] mb-5">{emoji}</div>
              <h2 className="font-bold text-[16px] text-[#0b1f3a] mb-4">{title}</h2>
              <div className="flex flex-col gap-3">
                {[
                  { label: 'Winning bid', value: `PKR ${finalBid.toLocaleString()}`, highlight: true },
                  { label: 'Status', value: '✓ Auction Closed' },
                  { label: 'Next step', value: 'Seller will contact you within 24h' },
                ].map(d => (
                  <div key={d.label} className="flex justify-between">
                    <span className="text-[13px] text-[#6c757d]">{d.label}</span>
                    <span className={`font-bold text-[13px] ${d.highlight ? 'text-[#d0021b]' : 'text-[#1a7a4a]'}`}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={() => navigate('/buyer/browse')} className="border border-[#dee2e6] font-semibold text-[14px] text-[#495057] px-6 py-3 rounded-[8px] hover:bg-[#f8f9fa]">
                Browse More Auctions
              </button>
              <button onClick={() => navigate('/buyer/browse')} className="bg-[#1a7a4a] font-bold text-[14px] text-white px-6 py-3 rounded-[8px] hover:bg-[#135c38] transition-colors">
                Browse More Auctions
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="text-[80px] mb-6">😞</div>
            <h1 className="font-extrabold text-[28px] text-[#0b1f3a] mb-2">Auction Ended</h1>
            <p className="text-[14px] text-[#6c757d] text-center max-w-[380px] mb-4">
              The auction for <span className="font-bold text-[#343a40]">{title}</span> has ended. You didn't win this time.
            </p>
            <p className="font-bold text-[18px] text-[#d0021b] mb-8">Final price: PKR {finalBid.toLocaleString()}</p>
            <button onClick={() => navigate('/buyer/browse')} className="bg-[#d0021b] font-bold text-[14px] text-white px-8 py-3 rounded-[8px] hover:bg-[#a80016] transition-colors">
              Find Another Auction
            </button>
          </>
        )}
      </div>
    </div>
  );
}
