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
  const { verifyEmail } = useAuth();
  const { showToast }   = useToast();

  const email: string = (location.state as { email?: string })?.email ?? '';
  const [otp, setOtp]             = useState(['', '', '', '', '', '']);
  const [loading, setLoading]     = useState(false);
  const [resendSecs, setResendSecs] = useState(60);
  const [codeExpiry, setCodeExpiry] = useState(600);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

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
      showToast({ type: 'error', title: 'Invalid Code', message: result.error || 'The code is incorrect or expired.' });
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = () => {
    if (resendSecs > 0) return;
    setResendSecs(60);
    setCodeExpiry(600);
    showToast({ type: 'info', title: 'Code Resent', message: `A new code was sent to ${email}` });
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
            <div className="w-9 h-9 rounded-lg bg-[#d0021b] flex items-center justify-center">
              <span className="text-white font-extrabold text-sm">BV</span>
            </div>
            <span className="font-extrabold text-xl text-[#0b1f3a]">Bid<span className="text-[#d0021b]">Vault</span></span>
          </Link>
        </div>

        {/* Icon + heading */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#fff0f2] border border-[#d0021b]/15 flex items-center justify-center">
            <Mail size={28} className="text-[#d0021b]" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-[#0b1f3a]">Check your inbox</h2>
            <p className="text-sm text-[#6c757d] mt-1">
              We sent a 6-digit code to<br />
              <span className="font-bold text-[#343a40]">{email || 'your email'}</span>
            </p>
          </div>
        </div>

        {/* Email row */}
        <div className="flex items-center gap-3 bg-[#f8f9fa] border border-[#e9ecef] rounded-lg px-4 py-3">
          <Mail size={17} className="text-[#6c757d] flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#343a40] truncate">{email || 'your email'}</p>
            <p className="text-[11.5px] text-[#adb5bd]">Code expires in {fmtTime(codeExpiry)}</p>
          </div>
          <Link to="/register" className="text-xs font-bold text-[#d0021b] hover:underline flex-shrink-0">Change</Link>
        </div>

        {/* OTP inputs */}
        <div className="flex flex-col gap-2">
          <p className="text-[12px] font-bold text-[#343a40] text-center">Enter 6-digit verification code</p>
          <div className="flex gap-2.5 justify-center" onPaste={handlePaste}>
            {otp.map((val, i) => (
              <input
                key={i}
                ref={el => { inputRefs.current[i] = el; }}
                maxLength={1}
                inputMode="numeric"
                value={val}
                onChange={e => handleInput(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className={`w-12 h-14 rounded-lg text-center font-extrabold text-2xl border outline-none transition-all ${
                  val
                    ? 'bg-[#fff0f2] border-[#d0021b] text-[#a80016]'
                    : 'bg-[#f8f9fa] border-[#e9ecef] text-[#343a40] focus:border-[#d0021b] focus:shadow-[0_0_0_3px_rgba(208,2,27,0.08)] focus:bg-white'
                }`}
              />
            ))}
          </div>
          <p className="text-[11px] text-[#adb5bd] text-center">Hint: use code <strong>123456</strong> for demo</p>
        </div>

        {/* Info banner */}
        <div className="flex gap-2.5 items-start bg-[#eff6ff] border border-[#bfdbfe] rounded-lg px-4 py-3">
          <Info size={15} className="text-[#1e40af] flex-shrink-0 mt-0.5" />
          <p className="text-[12px] text-[#1e40af] leading-relaxed">
            Check your <span className="font-bold">spam or junk folder</span> if you don't see the email. Code is valid for <span className="font-bold">10 minutes</span>.
          </p>
        </div>

        <Button type="submit" variant="primary" fullWidth size="lg" loading={loading} disabled={otp.join('').length < 6}>
          Verify &amp; Activate Account
          <ArrowRight size={17} />
        </Button>

        {/* Resend */}
        <div className="flex items-center justify-center gap-1.5">
          <RefreshCw size={13} className="text-[#6c757d]" />
          <span className="text-sm text-[#6c757d]">Didn't receive code?</span>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendSecs > 0}
            className={`text-sm font-bold cursor-pointer transition-colors ${resendSecs > 0 ? 'text-[#adb5bd] cursor-not-allowed' : 'text-[#d0021b] hover:underline'}`}
          >
            {resendSecs > 0 ? `Resend (${fmtTime(resendSecs)})` : 'Resend Code'}
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}
