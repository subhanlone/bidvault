import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/auth';
import { useToast } from '../../context/toast';
import { AuthLayout, Button, Input } from '../../components/ui';
import { api } from '../../services/api';
import { isStrictEmail, EMAIL_INVALID_MESSAGE } from '../../utils/validation';
import { homePath } from '../../utils/account';

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

// Letters (incl. accented), spaces, hyphens, and apostrophes only — no digits or other symbols.
const NAME_REGEX = /^[\p{L}\s'-]+$/u;

export default function RegisterScreen() {
  const navigate = useNavigate();
  const { user, register } = useAuth();
  const { showToast } = useToast();

  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [agree, setAgree]       = useState(false);
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState<Record<string, string>>({});
  // "Satisfaction 99%" was hardcoded with nothing behind it. "Active Users" was total user
  // rows — the same number the landing page correctly calls "Registered Users".
  const [panelStats, setPanelStats] = useState([
    { value: '—', label: 'Registered Users' },
    { value: '—', label: 'Active Auctions' },
    { value: '—', label: 'Items Listed' },
  ]);

  // RG-02: redirect already-logged-in users to their role dashboard
  useEffect(() => {
    if (!user) return;
    navigate(homePath(user), { replace: true });
  }, [user, navigate]);

  // RG-03: replace hardcoded stats with live API data
  useEffect(() => {
    api.get('/stats')
      .then(d => setPanelStats([
        { value: d.userCount >= 1000 ? `${Math.floor(d.userCount / 1000)}K+` : String(d.userCount), label: 'Registered Users' },
        { value: String(d.activeAuctionCount), label: 'Active Auctions' },
        { value: String(d.listingCount),       label: 'Items Listed' },
      ]))
      .catch(() => {});
  }, []);

  const pwStrength = pwScore(password);
  const { width: pwWidth, label: pwLabel, labelClass: pwLabelClass, barClass: pwBarClass } = PW_CONFIG[pwStrength];

  const clearError = (key: string) => setErrors(p => ({ ...p, [key]: '' }));

  const validate = () => {
    const e: Record<string, string> = {};
    const trimmedName = name.trim();
    if (!trimmedName) e.name = 'Full name is required';
    else if (trimmedName.length < 2) e.name = 'Name must be at least 2 characters';
    else if (trimmedName.length > 100) e.name = 'Name must be under 100 characters';
    else if (!NAME_REGEX.test(trimmedName)) e.name = 'Name can only contain letters, spaces, hyphens, and apostrophes';
    if (!email.trim()) e.email = 'Email is required';
    // Strict: this is the address that gets stored. Must match the server exactly, or the
    // form accepts something register then refuses.
    else if (!isStrictEmail(email)) e.email = EMAIL_INVALID_MESSAGE;
    if (password.length < 8) e.password = 'Password must be at least 8 characters';
    if (!agree) e.agree = 'You must agree to the terms';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    const result = await register({ name: name.trim(), email: email.trim(), password });
    setLoading(false);
    if (result.success) {
      showToast({ type: 'success', title: 'Account Created!', message: 'Check your email for a verification code.' });
      navigate('/email-verification', { state: { email, verificationCode: result.verificationCode, codeExpiresAt: result.codeExpiresAt } });
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
      {/* noValidate: the browser's native bubble fires before onSubmit, which suppresses
          validate() and hides errors on every field except the first invalid one. */}
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
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
              <button type="button" onClick={() => setShowPw(p => !p)} aria-label={showPw ? 'Hide password' : 'Show password'} className="cursor-pointer text-placeholder hover:text-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm">
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
              className="sr-only peer"
              // The sentence next to the box is the name; the box itself (the label below) holds
              // no text, so without this the checkbox had no accessible name at all.
              aria-labelledby="terms-agree-text"
              aria-describedby={errors.agree ? 'agree-error' : undefined}
            />
            <label
              htmlFor="terms-agree"
              className={`w-[18px] h-[18px] rounded border-2 flex items-center justify-center flex-shrink-0 mt-px transition-colors cursor-pointer peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 ${agree ? 'bg-primary border-primary' : 'bg-surface border-border-medium'}`}
            >
              {agree && <svg viewBox="0 0 10 8" className="w-2.5 h-2 fill-none stroke-white stroke-2"><polyline points="1,4 4,7 9,1" /></svg>}
            </label>
            <span id="terms-agree-text" className="text-[12.5px] text-tertiary leading-relaxed">
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

        {/* One account buys and sells; becoming a seller is a step taken later, not a kind of account. */}
        <p className="text-center text-[12.5px] text-muted">
          Want to sell too? You can do it any time after you sign up.
        </p>

        <p className="text-center text-sm text-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-primary hover:underline">Sign in</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
