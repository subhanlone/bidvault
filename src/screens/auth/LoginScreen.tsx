import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  IconBidVaultLogo, IconCheck, IconGoogle, IconEmail, IconLock,
  IconEye, IconCheckbox, IconInfo, IconKey,
} from '../../components/Icons';

export default function LoginScreen() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast({ type: 'error', title: 'Missing Fields', message: 'Enter your email and password.' });
      return;
    }
    setLoading(true);
    const result = await login({ email, password });
    setLoading(false);
    if (result.success && result.user) {
      showToast({ type: 'success', title: `Welcome back, ${result.user.name.split(' ')[0]}!`, message: 'You are now signed in.' });
      if (result.user.role === 'ADMIN') navigate('/admin/dashboard');
      else if (result.user.role === 'SELLER') {
        const dest = result.user.verificationStatus === 'VERIFIED'
          ? '/seller/dashboard'
          : '/seller/identity-verification';
        navigate(dest);
      } else navigate('/buyer/browse');
    } else {
      showToast({ type: 'error', title: 'Sign In Failed', message: result.error || 'Invalid credentials.' });
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-6">
      <div className="bg-transparent grid grid-cols-2 w-full max-w-[1000px] min-h-[680px] overflow-hidden rounded-[16px] shadow-[0px_2px_8px_0px_rgba(11,31,58,0.06),0px_16px_48px_0px_rgba(11,31,58,0.08)]">

        {/* LEFT PANEL */}
        <div
          className="flex flex-col items-start justify-between overflow-hidden p-[52px] relative"
          style={{ backgroundImage: 'linear-gradient(150deg,rgb(11,31,58) 0%,rgb(26,51,86) 50%,rgb(31,78,140) 100%)' }}
        >
          <div className="absolute bg-[rgba(208,2,27,0.1)] right-[-60px] rounded-[160px] size-[320px] top-[-60px]" />
          <div className="absolute bg-[rgba(255,255,255,0.04)] bottom-[-40px] left-[-40px] rounded-[100px] size-[200px]" />

          <div className="flex gap-3 items-center z-10">
            <div className="bg-[#d0021b] flex items-center justify-center rounded-[10px] size-[42px]">
              <IconBidVaultLogo />
            </div>
            <span className="font-extrabold text-[26px] text-white tracking-[-0.5px]">
              Bid<span className="text-[#d0021b]">Vault</span>
            </span>
          </div>

          <div className="flex flex-col gap-[13px] z-10">
            <div className="bg-[rgba(208,2,27,0.18)] border border-[rgba(208,2,27,0.32)] flex gap-[7px] items-center pl-[10px] pr-[13px] py-[6px] rounded-[20px] w-fit">
              <div className="bg-[#d0021b] rounded-[3.5px] size-[7px]" />
              <span className="font-bold text-[#ff8a96] text-[10px] tracking-[1.2px] uppercase">Welcome Back</span>
            </div>
            <h1 className="font-extrabold text-[36px] text-white leading-[42px]">
              Your auctions<br />are waiting<br />for you
            </h1>
            <p className="max-w-[340px] text-[14px] text-[rgba(255,255,255,0.58)] leading-[23px]">
              Sign in to continue bidding, manage your listings, or access your admin controls — all in one place.
            </p>
            <div className="flex gap-4 items-start pt-4">
              <div className="bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.14)] flex flex-col gap-[3px] items-start px-[17px] py-[13px] rounded-[10px]">
                <span className="font-bold text-[22px] text-[#ef4444] leading-[22px]">●</span>
                <span className="font-medium text-[11px] text-[rgba(255,255,255,0.55)]">3 Live Now</span>
              </div>
              <div className="bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.14)] flex flex-col gap-[3px] items-start px-[17px] py-[13px] rounded-[10px]">
                <span className="font-extrabold text-[22px] text-white leading-[22px]">PKR 2.4M</span>
                <span className="font-medium text-[11px] text-[rgba(255,255,255,0.55)]">Bid Volume</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-[10px] z-10">
            {['Role-based dashboard — Buyer / Seller / Admin', 'JWT secured session with auto-refresh', 'Real-time bid updates via Socket.io'].map(t => (
              <div key={t} className="flex gap-[10px] items-center">
                <div className="bg-[rgba(26,122,74,0.2)] border border-[rgba(26,122,74,0.4)] flex items-center justify-center p-px rounded-[11px] size-[22px]">
                  <IconCheck />
                </div>
                <span className="font-medium text-[12.5px] text-[rgba(255,255,255,0.65)]">{t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <form onSubmit={handleSubmit} className="bg-white flex flex-col items-start justify-center px-[52px] py-[66px]">
          <div className="flex flex-col gap-[5px] pb-8 w-full">
            <h2 className="font-extrabold text-[26px] text-[#0b1f3a]">Sign in to BidVault</h2>
            <p className="text-[14px] text-[#6c757d] leading-[21.7px]">
              Don't have an account?{' '}
              <Link to="/register" className="font-bold text-[#d0021b]">Create one free</Link>
            </p>
          </div>

          <div className="flex flex-col gap-[18px] w-full">
            <button type="button" className="bg-white border border-[#e9ecef] flex gap-[10px] h-[48px] items-center justify-center rounded-[8px] w-full hover:bg-[#f8f9fa] transition-colors">
              <IconGoogle />
              <span className="font-semibold text-[14px] text-[#343a40]">Continue with Google</span>
            </button>

            <div className="flex gap-3 items-center py-1">
              <div className="bg-[#e9ecef] flex-1 h-px" />
              <span className="font-semibold text-[12px] text-[#adb5bd]">or sign in with email</span>
              <div className="bg-[#e9ecef] flex-1 h-px" />
            </div>

            {/* Demo accounts hint */}
            <div className="bg-[#f8f9fa] border border-[#e9ecef] rounded-[8px] px-4 py-3">
              <p className="font-bold text-[11px] text-[#6c757d] mb-1 uppercase tracking-[0.5px]">Demo Accounts</p>
              {[
                ['BUYER', 'sawera@gmail.com', 'password123'],
                ['SELLER', 'ahmed@gmail.com', 'password123'],
                ['ADMIN', 'admin@bidvault.com', 'admin123'],
              ].map(([role, em, pw]) => (
                <button
                  type="button"
                  key={role}
                  onClick={() => { setEmail(em); setPassword(pw); }}
                  className="text-left w-full text-[11.5px] text-[#0b1f3a] hover:text-[#d0021b] font-medium py-[2px]"
                >
                  <span className="font-bold">{role}:</span> {em}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-[6px]">
              <label className="font-bold text-[12px] text-[#343a40] tracking-[0.15px]">Email address <span className="text-[#d0021b]">*</span></label>
              <div className="relative">
                <input
                  className="bg-white border border-[#dee2e6] h-[48px] pl-[43px] pr-[15px] rounded-[8px] text-[14px] text-[#343a40] w-full outline-none focus:border-[#d0021b]"
                  placeholder="you@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
                <span className="absolute left-[14px] top-[17.5px]"><IconEmail /></span>
              </div>
            </div>

            <div className="flex flex-col gap-[6px]">
              <label className="font-bold text-[12px] text-[#343a40] tracking-[0.15px]">Password <span className="text-[#d0021b]">*</span></label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="bg-white border border-[#dee2e6] h-[48px] pl-[43px] pr-[45px] rounded-[8px] text-[14px] text-[#343a40] w-full outline-none focus:border-[#d0021b]"
                  placeholder="Your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <span className="absolute left-[14px] top-[16px]"><IconLock /></span>
                <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-[14px] top-[17.5px]"><IconEye /></button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex gap-[10px] items-center">
                <button
                  type="button"
                  onClick={() => setRemember(p => !p)}
                  className={`border-2 flex items-center justify-center p-[2px] rounded-[4px] size-[18px] transition-colors ${remember ? 'bg-[#d0021b] border-[#d0021b]' : 'bg-white border-[#dee2e6]'}`}
                >
                  {remember && <IconCheckbox />}
                </button>
                <span className="text-[#495057] text-[12.5px]">Keep me signed in</span>
              </div>
              <Link to="/forgot-password" className="font-bold text-[12.5px] text-[#d0021b]">Forgot password?</Link>
            </div>

            <div className="bg-[#f0f4ff] border border-[#c7d7fe] flex gap-[10px] items-center px-[15px] py-3 rounded-[8px]">
              <IconInfo color="#3451b2" />
              <p className="text-[12px] text-[#3451b2] leading-[18.6px]">
                <span className="font-bold">Role-based access:</span>
                <span className="font-medium"> After sign in, you'll be directed to your Buyer, Seller, or Admin dashboard automatically.</span>
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-[#d0021b] drop-shadow-[0px_4px_8px_rgba(208,2,27,0.28)] flex gap-[9px] h-[50px] items-center justify-center rounded-[8px] w-full hover:bg-[#a80016] transition-colors disabled:opacity-60"
            >
              {loading
                ? <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><IconKey /><span className="font-bold text-[15px] text-white tracking-[0.2px]">Sign In to BidVault</span></>
              }
            </button>

            <p className="text-[13px] text-[#6c757d] text-center">
              New to BidVault?{' '}
              <Link to="/register" className="font-bold text-[#d0021b]">Create a free account</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
