import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Sparkles, Trophy, Frown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BuyerNavbar } from '../../components/ui';
import Button from '../../components/ui/Button';

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

  if (!state) {
    return <Navigate to="/buyer/browse" replace />;
  }

  const won = state.won ?? true;
  const title = state.title ?? 'Auction Item';
  const emoji = state.emoji ?? '🏆';
  const finalBid = state.finalBid ?? 0;

  return (
    <div className="min-h-screen bg-bg">
      <BuyerNavbar userName={user?.name} onLogout={logout} />

      <main className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
        {won ? (
          <>
            <div className="flex justify-center mb-4">
              <Sparkles size={60} strokeWidth={1.2} className="text-gold" />
            </div>
            <div className="bg-success-bg border border-success-border flex items-center justify-center rounded-md size-[72px] sm:size-[80px] mb-5">
              <div className="bg-success-bg border border-success-border flex items-center justify-center rounded-full size-[48px] sm:size-[52px]">
                <Trophy size={24} strokeWidth={2} className="text-success" />
              </div>
            </div>
            <h1 className="font-extrabold text-[26px] sm:text-[32px] text-navy mb-2 flex items-center gap-2">
              You Won! <Trophy size={24} strokeWidth={1.8} className="text-gold" />
            </h1>
            <p className="text-[14px] sm:text-[15px] text-muted text-center max-w-[400px] mb-8">
              Congratulations! You've won the auction for <span className="font-bold text-secondary">{title}</span>
            </p>

            <div className="bg-surface border border-border-light rounded-lg p-5 sm:p-6 w-full max-w-[440px] mb-6">
              <div className="bg-navy h-[160px] sm:h-[180px] rounded-md flex items-center justify-center text-[64px] sm:text-[72px] mb-5">{emoji}</div>
              <h2 className="font-bold text-[15px] sm:text-[16px] text-navy mb-4">{title}</h2>
              <div className="flex flex-col gap-3">
                {[
                  { label: 'Winning bid', value: `PKR ${finalBid.toLocaleString()}`, highlight: true },
                  { label: 'Status', value: 'Auction Closed' },
                  { label: 'Next step', value: 'Seller will contact you within 24h' },
                ].map(d => (
                  <div key={d.label} className="flex justify-between gap-4">
                    <span className="text-[13px] text-muted">{d.label}</span>
                    <span className={`font-bold text-[12px] sm:text-[13px] text-right ${d.highlight ? 'text-success' : 'text-success-dark'}`}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-[440px]">
              <Button
                variant="outline"
                className="flex-1 rounded-sm border-success-border text-success-dark hover:bg-success-bg"
                onClick={() => navigate('/buyer/my-bids')}
              >
                View My Bids
              </Button>
              <Button
                variant="outline"
                className="flex-1 rounded-sm bg-success-bg border-success-border text-success hover:bg-success-bg/80"
                onClick={() => navigate('/buyer/browse')}
              >
                Browse More Auctions
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-center mb-6">
              <Frown size={60} strokeWidth={1.2} className="text-placeholder" />
            </div>
            <h1 className="font-extrabold text-[24px] sm:text-[28px] text-navy mb-2">Auction Ended</h1>
            <p className="text-[13px] sm:text-[14px] text-muted text-center max-w-[380px] mb-4">
              The auction for <span className="font-bold text-secondary">{title}</span> has ended. You didn't win this time.
            </p>
            <p className="font-bold text-[16px] sm:text-[18px] text-warning mb-8">
              Final price: PKR {finalBid.toLocaleString()}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                className="rounded-sm"
                onClick={() => navigate('/buyer/my-bids')}
              >
                View My Bids
              </Button>
              <Button
                variant="outline"
                className="rounded-sm border-warning-border text-warning hover:bg-warning-bg"
                onClick={() => navigate('/buyer/browse')}
              >
                Find Another Auction
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
