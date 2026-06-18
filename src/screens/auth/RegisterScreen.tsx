import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, ShoppingBag, Tag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import type { UserRole } from '../../types';
import { AuthLayout, Button, Input } from '../../components/ui';
import { api } from '../../services/api';

const PW_CONFIG = [
  { width: '0%',   label: '',       labelClass: 'text-muted',   barClass: 'bg-border' },
  { width: '30%',  label: 'Weak',   labelClass: 'text-error',   barClass: 'bg-error' },
  { width: '55%',  label: 'Medium', labelClass: 'text-warning', barClass: 'bg-warning' },
  { width: '100%', label: 'Strong', labelClass: 'text-success', barClass: 'bg-success' },
] as const;

function pwScore(pw: string): 0 | 1 | 2 | 3 {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return (s >= 3 ? 3 : s >= 2 ? 2 : 1) as 1 | 2 | 3;
}

export default function RegisterScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, register } = useAuth();
  const { showToast } = useToast();

  const [role, setRole] = useState<UserRole>(
    searchParams.get('role') === 'SELLER' ? 'SELLER' : 'BUYER',
  );
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [agree, setAgree]       = useState(false);
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState<Record<string, string>>({});
  const [panelStats, setPanelStats] = useState([
    { value: '—', label: 'Active Users' },
    { value: '—', label: 'Active Auctions' },
    { value: '99%', label: 'Satisfaction' },
  ]);

  // RG-02: redirect already-logged-in users to their role dashboard
  useEffect(() => {
    if (!user) return;
    if (user.role === 'ADMIN')       navigate('/admin/dashboard',  { replace: true });
    else if (user.role === 'SELLER') navigate('/seller/dashboard', { replace: true });
    else                             navigate('/buyer/browse',     { replace: true });
  }, [user, navigate]);

  // RG-03: replace hardcoded stats with live API data
  useEffect(() => {
    api.get<{ userCount: number; activeAuctionCount: number }>('/stats')
      .then(d => setPanelStats([
        { value: d.userCount >= 1000 ? `${Math.floor(d.userCount / 1000)}K+` : String(d.userCount), label: 'Active Users' },
        { value: String(d.activeAuctionCount), label: 'Active Auctions' },
        { value: '99%', label: 'Satisfaction' },
      ]))
      .catch(() => {});
  }, []);

  const pwStrength = pwScore(password);
  const { width: pwWidth, label: pwLabel, labelClass: pwLabelClass, barClass: pwBarClass } = PW_CONFIG[pwStrength];

  const clearError = (key: string) => setErrors(p => ({ ...p, [key]: '' }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Full name is required';
    if (!email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email';
    if (password.length < 8) e.password = 'Password must be at least 8 characters';
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
      navigate('/email-verification', { state: { email, verificationCode: result.verificationCode } });
    } else {
      showToast({ type: 'error', title: 'Registration Failed', message: result.error || 'Something went wrong.' });
    }
  };

  return (
    <AuthLayout
      headline="Pakistan's Smartest Auction Platform"
      subtext="List items, bid in real-time, and discover fair market prices — all in one secure platform built for Pakistan."
      bullets={[
        'Admin-reviewed listings before going live',
        'Real-time bidding with live countdowns',
      ]}
      stats={panelStats}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Mobile logo */}
        <div className="lg:hidden mb-2">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-extrabold text-sm">BV</span>
            </div>
            <span className="font-extrabold text-xl text-navy">Bid<span className="text-primary">Vault</span></span>
          </Link>
        </div>

        <div>
          <h2 className="text-2xl font-extrabold text-navy">Create your account</h2>
          <p className="text-sm text-muted mt-1">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-primary hover:underline">Sign in here</Link>
          </p>
        </div>

        {/* Role selector */}
        <div>
          <p className="text-[12px] font-bold text-secondary mb-2">I want to <span className="text-primary">*</span></p>
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
                  className={`relative rounded-md h-[110px] border-2 text-left transition-all cursor-pointer p-4 ${sel ? 'bg-primary-surface border-primary' : 'bg-bg border-border-light hover:border-primary'}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${sel ? 'bg-primary/12' : 'bg-border-light'}`}>
                      <Icon size={16} className={sel ? 'text-primary' : 'text-muted'} />
                    </div>
                    <div className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center ${sel ? 'border-primary' : 'border-border-medium'}`}>
                      {sel && <div className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                  </div>
                  <p className={`text-[13px] font-bold leading-tight ${sel ? 'text-primary-dark' : 'text-secondary'}`}>{label}</p>
                  <p className="text-[11px] text-muted mt-0.5">{desc}</p>
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

        {/* Password + strength bar */}
        <div>
          <Input
            label="Password"
            type={showPw ? 'text' : 'password'}
            placeholder="Min. 8 characters"
            value={password}
            onChange={e => { setPassword(e.target.value); clearError('password'); }}
            leftIcon={<Lock size={16} />}
            rightIcon={
              <button type="button" onClick={() => setShowPw(p => !p)} aria-label={showPw ? 'Hide' : 'Show'} className="cursor-pointer text-placeholder hover:text-body">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
            error={errors.password}
            autoComplete="new-password"
          />
          {password.length > 0 && (
            <div className="mt-2 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted">Password strength</span>
                <span className={`text-[11px] font-semibold ${pwLabelClass}`}>{pwLabel}</span>
              </div>
              <div className="h-1 bg-border-light rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-300 ${pwBarClass}`} style={{ width: pwWidth }} />
              </div>
            </div>
          )}
        </div>

        {/* Terms — RG-04: real <input type="checkbox"> for screen-reader semantics */}
        <div>
          <div className="flex gap-2.5 items-start">
            <input
              type="checkbox"
              id="terms-agree"
              checked={agree}
              onChange={e => { setAgree(e.target.checked); clearError('agree'); }}
              className="sr-only"
              aria-describedby={errors.agree ? 'agree-error' : undefined}
            />
            <label
              htmlFor="terms-agree"
              className={`w-[18px] h-[18px] rounded border-2 flex items-center justify-center flex-shrink-0 mt-px transition-colors cursor-pointer ${agree ? 'bg-primary border-primary' : 'bg-surface border-border-medium'}`}
            >
              {agree && <svg viewBox="0 0 10 8" className="w-2.5 h-2 fill-none stroke-white stroke-2"><polyline points="1,4 4,7 9,1" /></svg>}
            </label>
            <span className="text-[12.5px] text-tertiary leading-relaxed">
              I agree to BidVault's{' '}
              <Link to="/terms" className="font-bold text-primary hover:underline">Terms of Service</Link>{' '}and{' '}
              <Link to="/privacy" className="font-bold text-primary hover:underline">Privacy Policy</Link>
            </span>
          </div>
          {errors.agree && <p id="agree-error" className="text-[11px] text-error mt-1">{errors.agree}</p>}
        </div>

        <Button type="submit" variant="primary" fullWidth size="lg" loading={loading}>
          Create Account
        </Button>

        <p className="text-center text-sm text-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-primary hover:underline">Sign in</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
