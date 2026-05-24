import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { AuthLayout, Button, Input } from '../../components/ui';

const DEMO_ACCOUNTS = [
  { role: 'BUYER',  email: 'sawera@gmail.com',      password: 'password123' },
  { role: 'SELLER', email: 'ahmed@gmail.com',        password: 'password123' },
  { role: 'ADMIN',  email: 'admin@bidvault.com',     password: 'admin123'    },
] as const;

export default function LoginScreen() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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
      if (result.user.role === 'ADMIN')        navigate('/admin/dashboard');
      else if (result.user.role === 'SELLER')  navigate('/seller/dashboard');
      else                                     navigate('/buyer/browse');
    } else {
      showToast({ type: 'error', title: 'Sign In Failed', message: result.error || 'Invalid credentials.' });
    }
  };

  return (
    <AuthLayout
      headline="Your auctions are waiting for you"
      subtext="Sign in to continue bidding, manage your listings, or access your admin controls — all in one place."
      bullets={[
        'Role-based dashboard — Buyer / Seller / Admin',
        'JWT secured session with auto-refresh',
        'Real-time bid updates via Socket.io',
      ]}
      stats={[
        { value: '3', label: 'Live Now' },
        { value: 'PKR 2.4M', label: 'Bid Volume' },
        { value: '99.9%', label: 'Uptime' },
      ]}
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
          <h2 className="text-2xl font-extrabold text-navy">Sign in to BidVault</h2>
          <p className="text-sm text-muted mt-1">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-primary hover:underline">Create one free</Link>
          </p>
        </div>

        {/* Demo accounts */}
        <div className="bg-bg border border-border-light rounded-lg px-4 py-3">
          <p className="text-[11px] font-bold text-muted uppercase tracking-wider mb-1.5">Demo Accounts</p>
          {DEMO_ACCOUNTS.map(({ role, email: em, password: pw }) => (
            <button
              key={role}
              type="button"
              onClick={() => { setEmail(em); setPassword(pw); }}
              className="block w-full text-left text-[11.5px] text-navy hover:text-primary font-medium py-0.5 cursor-pointer transition-colors"
            >
              <span className="font-bold">{role}:</span> {em}
            </button>
          ))}
        </div>

        <Input
          label="Email address"
          type="email"
          placeholder="you@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          leftIcon={<Mail size={16} />}
          autoComplete="email"
        />

        <Input
          label="Password"
          type={showPw ? 'text' : 'password'}
          placeholder="Your password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          leftIcon={<Lock size={16} />}
          rightIcon={
            <button type="button" onClick={() => setShowPw(p => !p)} aria-label={showPw ? 'Hide password' : 'Show password'} className="cursor-pointer text-placeholder hover:text-body">
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
          autoComplete="current-password"
        />

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <button
              type="button"
              onClick={() => setRemember(p => !p)}
              className={`w-[18px] h-[18px] rounded flex items-center justify-center border-2 transition-colors ${remember ? 'bg-primary border-primary' : 'bg-surface border-[#dee2e6]'}`}
            >
              {remember && <svg viewBox="0 0 10 8" className="w-2.5 h-2 fill-none stroke-white stroke-2"><polyline points="1,4 4,7 9,1" /></svg>}
            </button>
            <span className="text-[12.5px] text-tertiary">Keep me signed in</span>
          </label>
          <Link to="/forgot-password" className="text-[12.5px] font-bold text-primary hover:underline">Forgot password?</Link>
        </div>

        <div className="flex gap-2.5 items-start bg-[#f0f4ff] border border-[#c7d7fe] rounded-lg px-4 py-3">
          <Info size={15} className="text-[#3451b2] flex-shrink-0 mt-0.5" />
          <p className="text-[12px] text-[#3451b2] leading-relaxed">
            <span className="font-bold">Role-based access:</span>{' '}
            After sign in, you'll be directed to your Buyer, Seller, or Admin dashboard automatically.
          </p>
        </div>

        <Button type="submit" variant="primary" fullWidth size="lg" loading={loading}>
          <LogIn size={17} />
          Sign In to BidVault
        </Button>

        <p className="text-center text-sm text-muted">
          New to BidVault?{' '}
          <Link to="/register" className="font-bold text-primary hover:underline">Create a free account</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
