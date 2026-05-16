import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  IconBidVaultLogo, IconCheck, IconBuyer, IconSeller, IconUser,
  IconEmail, IconLock, IconEye, IconArrow, IconCheckbox, IconGoogle,
} from '../../components/Icons';
import type { UserRole } from '../../types';

export default function RegisterScreen() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { showToast } = useToast();

  const [role, setRole] = useState<UserRole>('BUYER');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const pwStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const pwLabel = ['', 'Weak', 'Medium', 'Strong'][pwStrength];
  const pwColor = ['', '#ef4444', '#f59e0b', '#1a7a4a'][pwStrength];
  const pwWidth = ['0%', '30%', '55%', '100%'][pwStrength];

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Full name is required';
    if (!email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email';
    if (password.length < 6) e.password = 'Password must be at least 6 characters';
    if (!agree) e.agree = 'You must agree to the terms';
    return e;
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    const result = await register({ name, email, password, role });
    setLoading(false);
    if (result.success) {
      showToast({ type: 'success', title: 'Account Created!', message: 'Check your email for a verification code.' });
      navigate('/email-verification', { state: { email } });
    } else {
      showToast({ type: 'error', title: 'Registration Failed', message: result.error || 'Something went wrong.' });
    }
  };

  return (
    <div className="h-screen flex overflow-hidden">
      <div className="grid grid-cols-2 w-full h-full">

        {/* LEFT PANEL */}
        <div
          className="flex flex-col items-start overflow-hidden p-[52px] relative h-full"
          style={{ backgroundImage: 'linear-gradient(155deg,rgb(11,31,58) 0%,rgb(26,51,86) 50%,rgb(31,78,140) 100%)' }}
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

          <div className="flex flex-col flex-1 justify-center gap-10 z-10">
            <div className="flex flex-col gap-[13px]">
              <div className="bg-[rgba(208,2,27,0.18)] border border-[rgba(208,2,27,0.32)] flex gap-[7px] items-center pl-[10px] pr-[13px] py-[6px] rounded-[20px] w-fit">
                <div className="bg-[#d0021b] rounded-[3.5px] size-[7px]" />
                <span className="font-bold text-[#ff8a96] text-[10px] tracking-[1.2px] uppercase">Join Free Today</span>
              </div>
              <h1 className="font-extrabold text-[36px] text-white leading-[42px]">
                Pakistan's Smartest<br />Auction Platform
              </h1>
              <p className="text-[14px] text-[rgba(255,255,255,0.58)] leading-[23px] max-w-[340px]">
                List items, bid in real-time, and discover fair market prices powered by AI — all in one secure platform.
              </p>
              <div className="flex gap-4 items-start pt-5">
                {[{ value: '50K+', label: 'Active Users' }, { value: '12K+', label: 'Auctions Done' }, { value: '99%', label: 'Satisfaction' }].map(s => (
                  <div key={s.label} className="bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.14)] flex flex-col gap-[3px] items-start px-[17px] py-[13px] rounded-[10px]">
                    <span className="font-extrabold text-[22px] text-white leading-[22px]">{s.value}</span>
                    <span className="font-medium text-[11px] text-[rgba(255,255,255,0.55)]">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-[10px]">
              {['256-bit SSL encryption on all transactions', 'Admin-reviewed listings before going live', 'Verified sellers only — admin approved'].map(t => (
                <div key={t} className="flex gap-[10px] items-center">
                  <div className="bg-[rgba(26,122,74,0.2)] border border-[rgba(26,122,74,0.4)] flex items-center justify-center p-px rounded-[11px] size-[22px]">
                    <IconCheck />
                  </div>
                  <span className="font-medium text-[12.5px] text-[rgba(255,255,255,0.65)]">{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <form onSubmit={handleSubmit} className="bg-white flex flex-col items-start justify-center p-[52px] overflow-y-auto h-full">
          <div className="flex flex-col gap-[5px] pb-8 w-full">
            <h2 className="font-extrabold text-[26px] text-[#0b1f3a]">Create your account</h2>
            <p className="text-[14px] text-[#6c757d] leading-[21.7px]">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-[#d0021b]">Sign in here</Link>
            </p>
          </div>

          <div className="flex flex-col gap-[18px] w-full">
            {/* Role selector */}
            <div className="flex flex-col gap-[6px]">
              <label className="font-bold text-[12px] text-[#343a40] tracking-[0.15px]">
                I want to <span className="text-[#d0021b]">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {([['BUYER', 'Buyer', 'Browse & bid on live auctions'] as const, ['SELLER', 'Seller', 'List items & run your auctions'] as const]).map(([r, label, desc]) => {
                  const sel = role === r;
                  return (
                    <button
                      type="button"
                      key={r}
                      onClick={() => setRole(r)}
                      className={`relative rounded-[10px] h-[113px] border-2 text-left transition-all ${sel ? 'bg-[#fff0f2] border-[#d0021b]' : 'bg-[#f8f9fa] border-[#e9ecef] hover:border-[#d0021b]'}`}
                    >
                      <div className="absolute flex items-center justify-between left-[18px] right-[18px] top-4">
                        <div className={`flex items-center justify-center rounded-[8px] size-[34px] ${sel ? 'bg-[rgba(208,2,27,0.12)]' : 'bg-[#e9ecef]'}`}>
                          {r === 'BUYER' ? <IconBuyer /> : <IconSeller />}
                        </div>
                        <div className={`border-2 flex items-center justify-center p-[2px] rounded-[9px] size-[18px] ${sel ? 'border-[#d0021b]' : 'border-[#dee2e6]'}`}>
                          {sel && <div className="bg-[#d0021b] rounded-[4.5px] size-[9px]" />}
                        </div>
                      </div>
                      <div className="absolute left-[18px] top-[56px]">
                        <p className={`font-bold text-[13.5px] ${sel ? 'text-[#a80016]' : 'text-[#343a40]'}`}>{label}</p>
                      </div>
                      <div className="absolute left-[18px] top-[74px]">
                        <p className="text-[#6c757d] text-[11.5px]">{desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Name + Email */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-[6px]">
                <label className="font-bold text-[12px] text-[#343a40] tracking-[0.15px]">Full name <span className="text-[#d0021b]">*</span></label>
                <div className="relative">
                  <input
                    className={`bg-white border h-[48px] pl-[43px] pr-[15px] rounded-[8px] text-[14px] text-[#343a40] w-full outline-none focus:border-[#d0021b] ${errors.name ? 'border-[#d0021b]' : 'border-[#dee2e6]'}`}
                    placeholder="Your full name"
                    value={name}
                    onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })); }}
                  />
                  <span className="absolute left-[14px] top-[15px]"><IconUser /></span>
                </div>
                {errors.name && <p className="text-[11px] text-[#d0021b]">{errors.name}</p>}
              </div>
              <div className="flex flex-col gap-[6px]">
                <label className="font-bold text-[12px] text-[#343a40] tracking-[0.15px]">Email address <span className="text-[#d0021b]">*</span></label>
                <div className="relative">
                  <input
                    className={`bg-white border h-[48px] pl-[43px] pr-[15px] rounded-[8px] text-[14px] text-[#343a40] w-full outline-none focus:border-[#d0021b] ${errors.email ? 'border-[#d0021b]' : 'border-[#dee2e6]'}`}
                    placeholder="you@email.com"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })); }}
                  />
                  <span className="absolute left-[14px] top-[17.5px]"><IconEmail /></span>
                </div>
                {errors.email && <p className="text-[11px] text-[#d0021b]">{errors.email}</p>}
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-[6px]">
              <label className="font-bold text-[12px] text-[#343a40] tracking-[0.15px]">Password <span className="text-[#d0021b]">*</span></label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className={`bg-white border h-[48px] pl-[43px] pr-[45px] rounded-[8px] text-[14px] text-[#343a40] w-full outline-none focus:border-[#d0021b] ${errors.password ? 'border-[#d0021b]' : 'border-[#dee2e6]'}`}
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: '' })); }}
                />
                <span className="absolute left-[14px] top-[16px]"><IconLock /></span>
                <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-[14px] top-[17.5px]"><IconEye /></button>
              </div>
              {password.length > 0 && (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[11px] text-[#6c757d]">Password strength</span>
                    <span className="font-semibold text-[11px]" style={{ color: pwColor }}>{pwLabel}</span>
                  </div>
                  <div className="bg-[#e9ecef] h-[4px] overflow-hidden rounded-[99px]">
                    <div className="h-full rounded-[99px] transition-all" style={{ width: pwWidth, backgroundColor: pwColor }} />
                  </div>
                </div>
              )}
              {errors.password && <p className="text-[11px] text-[#d0021b]">{errors.password}</p>}
            </div>

            {/* Terms */}
            <div className="flex flex-col gap-1">
              <div className="flex gap-[10px] items-start">
                <button
                  type="button"
                  onClick={() => { setAgree(p => !p); setErrors(e => ({ ...e, agree: '' })); }}
                  className={`border-2 flex items-center justify-center p-[2px] rounded-[4px] size-[18px] shrink-0 mt-px transition-colors ${agree ? 'bg-[#d0021b] border-[#d0021b]' : 'bg-white border-[#dee2e6]'}`}
                >
                  {agree && <IconCheckbox />}
                </button>
                <p className="text-[#495057] text-[12.5px] leading-[19.38px]">
                  I agree to BidVault's{' '}
                  <a href="#" className="font-bold text-[#d0021b]">Terms of Service</a>{' '}and{' '}
                  <a href="#" className="font-bold text-[#d0021b]">Privacy Policy</a>
                </p>
              </div>
              {errors.agree && <p className="text-[11px] text-[#d0021b]">{errors.agree}</p>}
            </div>

            {/* CTA */}
            <button
              type="submit"
              disabled={loading}
              className="bg-[#d0021b] drop-shadow-[0px_4px_8px_rgba(208,2,27,0.28)] flex gap-[9px] h-[50px] items-center justify-center rounded-[8px] w-full hover:bg-[#a80016] transition-colors disabled:opacity-60"
            >
              {loading
                ? <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><span className="font-bold text-[15px] text-white tracking-[0.2px]">Create Account</span><IconArrow /></>
              }
            </button>

            <div className="flex gap-3 items-center py-1">
              <div className="bg-[#e9ecef] flex-1 h-px" />
              <span className="font-semibold text-[12px] text-[#adb5bd]">or continue with</span>
              <div className="bg-[#e9ecef] flex-1 h-px" />
            </div>

            <button type="button" className="bg-white border border-[#e9ecef] flex gap-[10px] h-[48px] items-center justify-center rounded-[8px] w-full hover:bg-[#f8f9fa] transition-colors">
              <IconGoogle />
              <span className="font-semibold text-[14px] text-[#343a40]">Continue with Google</span>
            </button>

            <p className="text-[13px] text-[#6c757d] text-center">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-[#d0021b]">Sign in to BidVault</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
