import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Mail, RefreshCw, ArrowRight, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { AuthLayout, Button } from '../../components/ui';

function fmtTime(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export default function EmailVerificationScreen() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { verifyEmail, resendVerification } = useAuth();
  const { showToast }   = useToast();

  const state = location.state as { email?: string; verificationCode?: string } | null;
  const email: string = state?.email ?? '';
  const verificationCode: string | undefined = state?.verificationCode;
  const [otp, setOtp]             = useState(['', '', '', '', '', '']);
  const [loading, setLoading]     = useState(false);
  const [resendSecs, setResendSecs] = useState(60);
  const [codeExpiry, setCodeExpiry] = useState(600);
  const [otpError, setOtpError]   = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // EV-01: guard — no email means user navigated directly, not from registration
  useEffect(() => {
    if (!email) navigate('/register', { replace: true });
  }, [email, navigate]);

  useEffect(() => { inputRefs.current[0]?.focus(); }, []);

  useEffect(() => {
    if (resendSecs <= 0) return;
    const t = setInterval(() => setResendSecs(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendSecs]);

  useEffect(() => {
    if (codeExpiry <= 0) return;
    const t = setInterval(() => setCodeExpiry(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [codeExpiry]);

  const handleInput = (i: number, val: string) => {
    if (otpError) setOtpError('');
    const digit = val.replace(/\D/, '').slice(-1);
    const next = [...otp];
    next[i] = digit;
    setOtp(next);
    if (digit && i < 5) inputRefs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) inputRefs.current[i - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!text) return;
    e.preventDefault();
    if (otpError) setOtpError('');
    const next = [...otp];
    text.split('').forEach((ch, idx) => { next[idx] = ch; });
    setOtp(next);
    inputRefs.current[Math.min(text.length, 5)]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) {
      showToast({ type: 'error', title: 'Incomplete Code', message: 'Enter all 6 digits.' });
      return;
    }
    setLoading(true);
    const result = await verifyEmail(email, code);
    setLoading(false);
    if (result.success) {
      showToast({ type: 'success', title: 'Email Verified!', message: 'Your account is now active. Please sign in.' });
      navigate('/login');
    } else {
      const msg = result.error || 'The code is incorrect or expired.';
      showToast({ type: 'error', title: 'Invalid Code', message: msg });
      setOtpError(msg);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    if (resendSecs > 0) return;
    setResendSecs(60);
    setCodeExpiry(600);
    const result = await resendVerification(email);
    if (result.success) {
      showToast({ type: 'info', title: 'Code Resent', message: `A new code was sent to ${email}` });
    } else {
      showToast({ type: 'error', title: 'Failed', message: result.error || 'Could not resend code.' });
    }
  };

  return (
    <AuthLayout
      headline="One last step to activate your account"
      subtext="We sent a 6-digit verification code to your email address. Enter it to confirm your identity and start using BidVault."
      bullets={[
        'Code valid for 10 minutes only',
        'Check spam folder if not found',
        'Your account is 100% secure',
      ]}
      stats={[
        { value: fmtTime(codeExpiry), label: 'Code Expires' },
        { value: '6',                 label: 'Digit Code'   },
        { value: '100%',              label: 'Secure'        },
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

        {/* Icon + heading */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-16 h-16 rounded-lg bg-primary-surface border border-primary/15 flex items-center justify-center">
            <Mail size={28} className="text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-navy">Check your inbox</h2>
            <p className="text-sm text-muted mt-1">
              We sent a 6-digit code to<br />
              <span className="font-bold text-secondary">{email || 'your email'}</span>
            </p>
          </div>
        </div>

        {/* Email row */}
        <div className="flex items-center gap-3 bg-bg border border-border-light rounded-lg px-4 py-3">
          <Mail size={17} className="text-muted flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-secondary truncate">{email || 'your email'}</p>
            <p className="text-[11.5px] text-placeholder">Code expires in {fmtTime(codeExpiry)}</p>
          </div>
          <Link to="/register" className="text-xs font-bold text-primary hover:underline flex-shrink-0">Change</Link>
        </div>

        {/* OTP inputs */}
        <div className="flex flex-col gap-2">
          <p className="text-[12px] font-bold text-secondary text-center">Enter 6-digit verification code</p>
          <div className="flex gap-2.5 justify-center" onPaste={handlePaste} role="group" aria-label="6-digit verification code">
            {otp.map((val, i) => (
              <input
                key={i}
                ref={el => { inputRefs.current[i] = el; }}
                maxLength={1}
                inputMode="numeric"
                aria-label={`Digit ${i + 1}`}
                value={val}
                onChange={e => handleInput(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className={`w-12 h-14 rounded-lg text-center font-extrabold text-2xl border outline-none transition-all ${
                  val
                    ? 'bg-primary-surface border-primary text-primary-dark'
                    : 'bg-bg border-border-light text-secondary focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary'
                }`}
              />
            ))}
          </div>
          {otpError && (
            <p role="alert" className="text-[12px] text-error text-center font-medium">{otpError}</p>
          )}
          {import.meta.env.DEV && verificationCode && (
            <p className="text-[11px] text-placeholder text-center">Dev hint: your code is <strong>{verificationCode}</strong></p>
          )}
        </div>

        {/* Info banner */}
        <div className="flex gap-2.5 items-start bg-info-surface border border-info-border-strong rounded-lg px-4 py-3">
          <Info size={15} className="text-info-text flex-shrink-0 mt-0.5" />
          <p className="text-[12px] text-info-text leading-relaxed">
            Check your <span className="font-bold">spam or junk folder</span> if you don't see the email. Code is valid for <span className="font-bold">10 minutes</span>.
          </p>
        </div>

        <Button type="submit" variant="primary" fullWidth size="lg" loading={loading} disabled={otp.join('').length < 6}>
          Verify &amp; Activate Account
          <ArrowRight size={17} />
        </Button>

        {/* Resend */}
        <div className="flex items-center justify-center gap-1.5">
          <RefreshCw size={13} className="text-muted" />
          <span className="text-sm text-muted">Didn't receive code?</span>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendSecs > 0}
            className={`text-sm font-bold cursor-pointer transition-colors ${resendSecs > 0 ? 'text-placeholder cursor-not-allowed' : 'text-primary hover:underline'}`}
          >
            {resendSecs > 0 ? `Resend (${fmtTime(resendSecs)})` : 'Resend Code'}
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}
