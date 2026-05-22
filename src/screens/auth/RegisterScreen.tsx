import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, ShoppingBag, Tag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import type { UserRole } from '../../types';
import { AuthLayout, Button, Input } from '../../components/ui';

const PW_CONFIG = [
  { width: '0%',   color: '',         label: ''       },
  { width: '30%',  color: '#ef4444',  label: 'Weak'   },
  { width: '55%',  color: '#f59e0b',  label: 'Medium' },
  { width: '100%', color: '#16a34a',  label: 'Strong' },
] as const;

export default function RegisterScreen() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { showToast } = useToast();

  const [role, setRole]       = useState<UserRole>('BUYER');
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]   = useState(false);
  const [agree, setAgree]     = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState<Record<string, string>>({});

  const pwStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const { width: pwWidth, color: pwColor, label: pwLabel } = PW_CONFIG[pwStrength];

  const clearError = (key: string) => setErrors(p => ({ ...p, [key]: '' }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Full name is required';
    if (!email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email';
    if (password.length < 6) e.password = 'Password must be at least 6 characters';
    if (!agree) e.agree = 'You must agree to the terms';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
    <AuthLayout
      headline="Pakistan's Smartest Auction Platform"
      subtext="List items, bid in real-time, and discover fair market prices — all in one secure platform built for Pakistan."
      bullets={[
        '256-bit SSL encryption on all transactions',
        'Admin-reviewed listings before going live',
        'Real-time bidding with live countdowns',
      ]}
      stats={[
        { value: '50K+', label: 'Active Users' },
        { value: '12K+', label: 'Auctions Done' },
        { value: '99%',  label: 'Satisfaction'  },
      ]}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Mobile logo */}
        <div className="lg:hidden mb-2">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-[#d0021b] flex items-center justify-center">
              <span className="text-white font-extrabold text-sm">BV</span>
            </div>
            <span className="font-extrabold text-xl text-[#0b1f3a]">Bid<span className="text-[#d0021b]">Vault</span></span>
          </Link>
        </div>

        <div>
          <h2 className="text-2xl font-extrabold text-[#0b1f3a]">Create your account</h2>
          <p className="text-sm text-[#6c757d] mt-1">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-[#d0021b] hover:underline">Sign in here</Link>
          </p>
        </div>

        {/* Role selector */}
        <div>
          <p className="text-[12px] font-bold text-[#343a40] mb-2">I want to <span className="text-[#d0021b]">*</span></p>
          <div className="grid grid-cols-2 gap-3">
            {([
              { r: 'BUYER'  as UserRole, label: 'Buyer',  desc: 'Browse & bid on live auctions', Icon: ShoppingBag },
              { r: 'SELLER' as UserRole, label: 'Seller', desc: 'List items & run your auctions', Icon: Tag        },
            ]).map(({ r, label, desc, Icon }) => {
              const sel = role === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`relative rounded-xl h-[110px] border-2 text-left transition-all cursor-pointer p-4 ${sel ? 'bg-[#fff0f2] border-[#d0021b]' : 'bg-[#f8f9fa] border-[#e9ecef] hover:border-[#d0021b]'}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${sel ? 'bg-[#d0021b]/12' : 'bg-[#e9ecef]'}`}>
                      <Icon size={16} className={sel ? 'text-[#d0021b]' : 'text-[#6c757d]'} />
                    </div>
                    <div className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center ${sel ? 'border-[#d0021b]' : 'border-[#dee2e6]'}`}>
                      {sel && <div className="w-2 h-2 rounded-full bg-[#d0021b]" />}
                    </div>
                  </div>
                  <p className={`text-[13px] font-bold leading-tight ${sel ? 'text-[#a80016]' : 'text-[#343a40]'}`}>{label}</p>
                  <p className="text-[11px] text-[#6c757d] mt-0.5">{desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Name + Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Full name"
            placeholder="Your full name"
            value={name}
            onChange={e => { setName(e.target.value); clearError('name'); }}
            leftIcon={<User size={16} />}
            error={errors.name}
            autoComplete="name"
          />
          <Input
            label="Email address"
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={e => { setEmail(e.target.value); clearError('email'); }}
            leftIcon={<Mail size={16} />}
            error={errors.email}
            autoComplete="email"
          />
        </div>

        {/* Password */}
        <div>
          <Input
            label="Password"
            type={showPw ? 'text' : 'password'}
            placeholder="Min. 6 characters"
            value={password}
            onChange={e => { setPassword(e.target.value); clearError('password'); }}
            leftIcon={<Lock size={16} />}
            rightIcon={
              <button type="button" onClick={() => setShowPw(p => !p)} aria-label={showPw ? 'Hide' : 'Show'} className="cursor-pointer text-[#9ca3af] hover:text-[#374151]">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
            error={errors.password}
            autoComplete="new-password"
          />
          {password.length > 0 && (
            <div className="mt-2 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#6c757d]">Password strength</span>
                <span className="text-[11px] font-semibold" style={{ color: pwColor }}>{pwLabel}</span>
              </div>
              <div className="h-1 bg-[#e9ecef] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-300" style={{ width: pwWidth, backgroundColor: pwColor }} />
              </div>
            </div>
          )}
        </div>

        {/* Terms */}
        <div>
          <label className="flex gap-2.5 items-start cursor-pointer">
            <button
              type="button"
              onClick={() => { setAgree(p => !p); clearError('agree'); }}
              className={`w-[18px] h-[18px] rounded border-2 flex items-center justify-center flex-shrink-0 mt-px transition-colors cursor-pointer ${agree ? 'bg-[#d0021b] border-[#d0021b]' : 'bg-white border-[#dee2e6]'}`}
            >
              {agree && <svg viewBox="0 0 10 8" className="w-2.5 h-2 fill-none stroke-white stroke-2"><polyline points="1,4 4,7 9,1" /></svg>}
            </button>
            <span className="text-[12.5px] text-[#495057] leading-relaxed">
              I agree to BidVault's{' '}
              <Link to="/terms" className="font-bold text-[#d0021b] hover:underline">Terms of Service</Link>{' '}and{' '}
              <Link to="/privacy" className="font-bold text-[#d0021b] hover:underline">Privacy Policy</Link>
            </span>
          </label>
          {errors.agree && <p className="text-[11px] text-[#d0021b] mt-1">{errors.agree}</p>}
        </div>

        <Button type="submit" variant="primary" fullWidth size="lg" loading={loading}>
          Create Account
          <ArrowRight size={17} />
        </Button>

        <p className="text-center text-sm text-[#6c757d]">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-[#d0021b] hover:underline">Sign in to BidVault</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
