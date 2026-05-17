import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { IconBidVaultLogo } from '../components/Icons';

export default function NotFound() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const homeLink = user?.role === 'ADMIN'
    ? '/admin/dashboard'
    : user?.role === 'SELLER'
    ? '/seller/dashboard'
    : user?.role === 'BUYER'
    ? '/buyer/browse'
    : '/';

  return (
    <main className="min-h-screen bg-[#0b1f3a] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-[0.035]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }} />

      {/* Glow orbs */}
      <div className="absolute top-[-80px] left-[-80px] w-[400px] h-[400px] bg-[#d0021b] opacity-[0.06] rounded-full blur-[100px]" />
      <div className="absolute bottom-[-80px] right-[-80px] w-[400px] h-[400px] bg-[#1a7a4a] opacity-[0.05] rounded-full blur-[100px]" />

      <div className="relative z-10 text-center max-w-[560px] mx-auto">
        {/* Brand */}
        <Link to="/" className="inline-flex items-center gap-2 mb-12 opacity-70 hover:opacity-100 transition-opacity">
          <div className="bg-[#d0021b] flex items-center justify-center rounded-[8px] size-[32px]">
            <IconBidVaultLogo className="size-[16px]" />
          </div>
          <span className="font-extrabold text-[20px] text-white tracking-[-0.3px]">
            Bid<span className="text-[#d0021b]">Vault</span>
          </span>
        </Link>

        {/* 404 */}
        <div className="relative mb-6">
          <p className="font-extrabold leading-none select-none"
            style={{
              fontSize: 'clamp(120px, 22vw, 200px)',
              color: 'transparent',
              WebkitTextStroke: '2px rgba(255,255,255,0.08)',
              letterSpacing: '-8px',
            }}
          >
            404
          </p>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="font-extrabold text-[22px] sm:text-[28px] text-white tracking-[-0.5px] leading-tight">
                Lost the Auction?
              </p>
              <p className="font-bold text-[13px] sm:text-[14px] text-[rgba(255,255,255,0.45)] mt-1">
                This page doesn't exist.
              </p>
            </div>
          </div>
        </div>

        <p className="text-[14px] sm:text-[15px] text-[rgba(255,255,255,0.5)] leading-[1.7] mb-8 max-w-[400px] mx-auto">
          The page you're looking for may have been moved, deleted, or never existed. Don't let this stop your bidding.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="border border-[rgba(255,255,255,0.2)] font-bold text-[14px] text-[rgba(255,255,255,0.75)] px-6 py-3 rounded-[10px] hover:border-white hover:text-white transition-all"
          >
            ← Go Back
          </button>
          <Link
            to={homeLink}
            className="bg-[#d0021b] font-bold text-[14px] text-white px-6 py-3 rounded-[10px] hover:bg-[#a80016] transition-colors shadow-[0_8px_24px_rgba(208,2,27,0.35)]"
          >
            {user ? 'Back to Dashboard' : 'Go Home'} →
          </Link>
        </div>

        <p className="mt-8 text-[11px] text-[rgba(255,255,255,0.2)] font-medium">
          BidVault · Pakistan's AI-Powered Auction Platform
        </p>
      </div>
    </main>
  );
}
