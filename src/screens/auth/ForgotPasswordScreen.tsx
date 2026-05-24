import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, Info, RefreshCw, Shield, MailOpen, ArrowLeft, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { AuthLayout, Button, Input } from '../../components/ui';

type Step = 1 | 2 | 3;

function StepTracker({ step }: { step: Step }) {
  const steps = ['Email', 'Verify Code', 'New Password'];
  return (
    <div className="flex items-start justify-center pb-2">
      {steps.map((label, i) => {
        const n = (i + 1) as Step;
        const done   = step > n;
        const active = step === n;
        return (
          <div key={label} className="flex flex-1 flex-col gap-1.5 items-center relative">
            {i < steps.length - 1 && (
              <div className={`absolute h-0.5 left-1/2 right-[-50%] top-[14px] ${done ? 'bg-primary' : 'bg-[#e9ecef]'}`} />
            )}
            <div className={`flex items-center justify-center rounded-full w-7 h-7 border-2 z-10 ${
              done   ? 'bg-primary-surface border-primary' :
              active ? 'bg-primary  border-primary' :
                       'bg-surface      border-border-light'
            }`}>
              {done
                ? <Check size={13} className="text-primary" />
                : <span className={`font-extrabold text-xs ${active ? 'text-white' : 'text-placeholder'}`}>{n}</span>
              }
            </div>
            <span className={`font-bold text-[10.5px] tracking-wide ${
              active ? 'text-primary' : done ? 'text-tertiary' : 'text-placeholder'
            }`}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

function fmtTime(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export default function ForgotPasswordScreen() {
  const navigate = useNavigate();
  const { forgotPassword, verifyResetOtp, resetPassword } = useAuth();
  const { showToast } = useToast();

  const [step,       setStep]       = useState<Step>(1);
  const [email,      setEmail]      = useState('');
  const [otp,        setOtp]        = useState(['', '', '', '', '', '']);
  const [newPw,      setNewPw]      = useState('');
  const [confirmPw,  setConfirmPw]  = useState('');
  const [showPw,     setShowPw]     = useState(false);
  const [showConfirm,setShowConfirm]= useState(false);
  const [loading,    setLoading]    = useState(false);
  const [resendSecs, setResendSecs] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (step === 2) { setResendSecs(60); inputRefs.current[0]?.focus(); }
  }, [step]);

  useEffect(() => {
    if (resendSecs <= 0) return;
    const t = setInterval(() => setResendSecs(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendSecs]);

  const handleOtpInput = (i: number, val: string) => {
    const digit = val.replace(/\D/, '').slice(-1);
    const next = [...otp]; next[i] = digit; setOtp(next);
    if (digit && i < 5) inputRefs.current[i + 1]?.focus();
  };

  const handleOtpKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) inputRefs.current[i - 1]?.focus();
  };

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      showToast({ type: 'error', title: 'Invalid Email', message: 'Enter a valid email address.' });
      return;
    }
    setLoading(true);
    const res = await forgotPassword(email);
    setLoading(false);
    if (res.success) {
      showToast({ type: 'success', title: 'Code Sent!', message: `Check ${email} for your reset code.` });
      setStep(2);
    } else {
      showToast({ type: 'error', title: 'Error', message: res.error || 'Could not send reset code.' });
    }
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) { showToast({ type: 'error', title: 'Incomplete', message: 'Enter all 6 digits.' }); return; }
    setLoading(true);
    const res = await verifyResetOtp(email, code);
    setLoading(false);
    if (res.success) {
      setStep(3);
    } else {
      showToast({ type: 'error', title: 'Invalid Code', message: res.error || 'The code is incorrect.' });
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleStep3 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw.length < 6) { showToast({ type: 'error', title: 'Weak Password', message: 'Password must be at least 6 characters.' }); return; }
    if (newPw !== confirmPw) { showToast({ type: 'error', title: 'Mismatch', message: 'Passwords do not match.' }); return; }
    setLoading(true);
    const res = await resetPassword(email, newPw);
    setLoading(false);
    if (res.success) {
      showToast({ type: 'success', title: 'Password Reset!', message: 'You can now sign in with your new password.' });
      navigate('/login');
    } else {
      showToast({ type: 'error', title: 'Error', message: res.error || 'Reset failed.' });
    }
  };

  return (
    <AuthLayout
      headline="Don't worry — we've got you covered"
      subtext="Reset your password in 3 simple steps. Enter your email, verify the code, and set a new secure password."
      bullets={[
        'Reset code valid for 10 minutes',
        'Sent to your registered email only',
        'New password encrypted with bcrypt',
      ]}
    >
      <div className="flex flex-col gap-5">
        {/* Mobile logo */}
        <div className="lg:hidden mb-2">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-extrabold text-sm">BV</span>
            </div>
            <span className="font-extrabold text-xl text-navy">Bid<span className="text-primary">Vault</span></span>
          </Link>
        </div>

        <Link to="/login" className="flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-navy transition-colors w-fit">
          <ArrowLeft size={15} /> Back to Sign In
        </Link>

        <StepTracker step={step} />

        {/* Step 1 — Email */}
        {step === 1 && (
          <form onSubmit={handleStep1} className="flex flex-col gap-4">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-14 h-14 rounded-lg bg-primary-surface border border-primary/15 flex items-center justify-center">
                <MailOpen size={24} className="text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-navy">Forgot your password?</h2>
                <p className="text-sm text-muted mt-1">Enter your account email to receive a reset code.</p>
              </div>
            </div>

            <div>
              <Input
                label="Email address"
                type="email"
                placeholder="you@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
              />
              <p className="text-[11px] text-placeholder mt-1">Hint: try <strong>sawera@gmail.com</strong></p>
            </div>

            <Button type="submit" variant="primary" fullWidth size="lg" loading={loading}>
              Send Reset Code
            </Button>
          </form>
        )}

        {/* Step 2 — OTP */}
        {step === 2 && (
          <form onSubmit={handleStep2} className="flex flex-col gap-4">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-14 h-14 rounded-lg bg-primary-surface border border-primary/15 flex items-center justify-center">
                <MailOpen size={24} className="text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-navy">Reset code sent!</h2>
                <p className="text-sm text-muted mt-1">We sent a 6-digit code to<br /><span className="font-bold text-secondary">{email}</span></p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-[12px] font-bold text-secondary text-center">Enter 6-digit reset code</p>
              <div className="flex gap-2.5 justify-center">
                {otp.map((val, i) => (
                  <input
                    key={i}
                    ref={el => { inputRefs.current[i] = el; }}
                    maxLength={1}
                    inputMode="numeric"
                    value={val}
                    onChange={e => handleOtpInput(i, e.target.value)}
                    onKeyDown={e => handleOtpKey(i, e)}
                    className={`w-12 h-14 rounded-lg text-center font-extrabold text-2xl border outline-none transition-all ${
                      val
                        ? 'bg-primary-surface border-primary text-primary-dark'
                        : 'bg-bg border-border-light text-secondary focus:border-primary focus:shadow-[0_0_0_3px_rgba(208,2,27,0.08)] focus:bg-surface'
                    }`}
                  />
                ))}
              </div>
              <p className="text-[11px] text-placeholder text-center">Hint: use code <strong>654321</strong> for demo</p>
            </div>

            <div className="flex gap-2.5 items-start bg-[#eff6ff] border border-info-border rounded-lg px-4 py-3">
              <Info size={15} className="text-info flex-shrink-0 mt-0.5" />
              <p className="text-[12px] text-info leading-relaxed">Code is valid for <span className="font-bold">10 minutes</span>. Check your spam folder if not found.</p>
            </div>

            <Button type="submit" variant="primary" fullWidth size="lg" loading={loading} disabled={otp.join('').length < 6}>
              Verify Code
            </Button>

            <div className="flex items-center justify-center gap-1.5">
              <RefreshCw size={13} className="text-muted" />
              <span className="text-sm text-muted">Didn't get the code?</span>
              <button
                type="button"
                disabled={resendSecs > 0}
                onClick={() => { setResendSecs(60); showToast({ type: 'info', title: 'Code Resent', message: `New code sent to ${email}` }); }}
                className={`text-sm font-bold cursor-pointer ${resendSecs > 0 ? 'text-placeholder cursor-not-allowed' : 'text-primary hover:underline'}`}
              >
                {resendSecs > 0 ? `Resend (${fmtTime(resendSecs)})` : 'Resend email'}
              </button>
            </div>
          </form>
        )}

        {/* Step 3 — New Password */}
        {step === 3 && (
          <form onSubmit={handleStep3} className="flex flex-col gap-4">
            <div className="text-center">
              <h2 className="text-xl font-extrabold text-navy">Set a new password</h2>
              <p className="text-sm text-muted mt-1">Choose a strong password for your account.</p>
            </div>

            <Input
              label="New password"
              type={showPw ? 'text' : 'password'}
              placeholder="Min. 6 characters"
              value={newPw}
              onChange={e => setNewPw(e.target.value)}
              leftIcon={<Lock size={16} />}
              rightIcon={
                <button type="button" onClick={() => setShowPw(p => !p)} aria-label={showPw ? 'Hide' : 'Show'} className="cursor-pointer text-placeholder hover:text-body">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              autoComplete="new-password"
            />

            <Input
              label="Confirm password"
              type={showConfirm ? 'text' : 'password'}
              placeholder="Repeat password"
              value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
              leftIcon={<Lock size={16} />}
              rightIcon={
                <button type="button" onClick={() => setShowConfirm(p => !p)} aria-label={showConfirm ? 'Hide' : 'Show'} className="cursor-pointer text-placeholder hover:text-body">
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              autoComplete="new-password"
            />

            <div className="flex gap-2.5 items-start bg-[#eff6ff] border border-info-border rounded-lg px-4 py-3">
              <Info size={15} className="text-info flex-shrink-0 mt-0.5" />
              <p className="text-[12px] text-info leading-relaxed">Must be <span className="font-bold">6+ characters</span> long and match the confirm field.</p>
            </div>

            <Button type="submit" variant="primary" fullWidth size="lg" loading={loading}>
              <Shield size={17} />
              Reset My Password
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-muted">
          Remembered your password?{' '}
          <Link to="/login" className="font-bold text-primary hover:underline">Back to sign in</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
