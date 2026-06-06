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
    <div role="list" aria-label="Password reset progress" className="flex items-start justify-center pb-2">
      {steps.map((label, i) => {
        const n = (i + 1) as Step;
        const done   = step > n;
        const active = step === n;
        return (
          <div
            key={label}
            role="listitem"
            aria-current={active ? 'step' : undefined}
            aria-label={`Step ${n}: ${label}${done ? ' (completed)' : active ? ' (current)' : ''}`}
            className="flex flex-1 flex-col gap-1.5 items-center relative"
          >
            {i < steps.length - 1 && (
              <div className={`absolute h-0.5 left-1/2 right-[-50%] top-[14px] ${done ? 'bg-primary' : 'bg-border-light'}`} />
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

const PW_CONFIG = [
  { width: '0%',   label: '',       labelClass: 'text-muted',  barClass: 'bg-border' },
  { width: '30%',  label: 'Weak',   labelClass: 'text-error',  barClass: 'bg-error' },
  { width: '55%',  label: 'Medium', labelClass: 'text-warning', barClass: 'bg-warning' },
  { width: '100%', label: 'Strong', labelClass: 'text-success', barClass: 'bg-success' },
] as const;

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
  const [resetCode,  setResetCode]  = useState<string | undefined>();
  const [emailError, setEmailError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [newPwError, setNewPwError] = useState('');
  const [confirmPwError, setConfirmPwError] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const pwStrength = (() => {
    if (!newPw) return 0;
    let s = 0;
    if (newPw.length >= 8) s++;
    if (/[A-Z]/.test(newPw)) s++;
    if (/[0-9]/.test(newPw)) s++;
    if (/[^A-Za-z0-9]/.test(newPw)) s++;
    return s >= 3 ? 3 : s >= 2 ? 2 : 1;
  })() as 0 | 1 | 2 | 3;
  const { width: pwWidth, label: pwLabel, labelClass: pwLabelClass, barClass: pwBarClass } = PW_CONFIG[pwStrength];

  useEffect(() => {
    if (step !== 2) return;
    const timeoutId = setTimeout(() => {
      setResendSecs(60);
      inputRefs.current[0]?.focus();
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [step]);

  useEffect(() => {
    if (resendSecs <= 0) return;
    const t = setInterval(() => setResendSecs(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendSecs]);

  const handleOtpInput = (i: number, val: string) => {
    if (otpError) setOtpError('');
    const digit = val.replace(/\D/, '').slice(-1);
    const next = [...otp]; next[i] = digit; setOtp(next);
    if (digit && i < 5) inputRefs.current[i + 1]?.focus();
  };

  const handleOtpKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) inputRefs.current[i - 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!text) return;
    e.preventDefault();
    if (otpError) setOtpError('');
    const next = [...otp];
    text.split('').forEach((ch, idx) => { next[idx] = ch; });
    setOtp(next);
    inputRefs.current[Math.min(text.length, 5)]?.focus();
  };

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    if (!email.trim()) {
      setEmailError('Email is required');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Enter a valid email address');
      return;
    }
    setLoading(true);
    const res = await forgotPassword(email);
    setLoading(false);
    if (res.success) {
      setResetCode(res.resetCode);
      showToast({ type: 'success', title: 'Code Sent!', message: `Check ${email} for your reset code.` });
      setStep(2);
    } else {
      showToast({ type: 'error', title: 'Error', message: res.error || 'Could not send reset code.' });
    }
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) {
      setOtpError('Enter all 6 digits');
      return;
    }
    setLoading(true);
    const res = await verifyResetOtp(email, code);
    setLoading(false);
    if (res.success) {
      setOtpError('');
      setStep(3);
    } else {
      const msg = res.error || 'The code is incorrect or expired.';
      showToast({ type: 'error', title: 'Invalid Code', message: msg });
      setOtpError(msg);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleStep3 = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewPwError('');
    setConfirmPwError('');
    let invalidCount = 0;
    if (newPw.length < 8) {
      setNewPwError('Password must be at least 8 characters');
      invalidCount += 1;
    }
    if (newPw !== confirmPw) {
      setConfirmPwError('Passwords do not match');
      invalidCount += 1;
    }
    if (invalidCount > 0) return;
    setLoading(true);
    const res = await resetPassword(email, otp.join(''), newPw);
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
                onChange={e => { setEmail(e.target.value); setEmailError(''); }}
                autoComplete="email"
                error={emailError}
              />
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
              <div className="flex gap-2.5 justify-center" role="group" aria-label="6-digit reset code" onPaste={handleOtpPaste}>
                {otp.map((val, i) => (
                  <input
                    key={i}
                    ref={el => { inputRefs.current[i] = el; }}
                    maxLength={1}
                    inputMode="numeric"
                    aria-label={`Digit ${i + 1}`}
                    value={val}
                    onChange={e => handleOtpInput(i, e.target.value)}
                    onKeyDown={e => handleOtpKey(i, e)}
                    className={`w-12 h-14 rounded-lg text-center font-extrabold text-2xl border outline-none transition-all ${
                      val
                        ? 'bg-primary-surface border-primary text-primary-dark'
                        : 'bg-bg border-border-light text-secondary focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary'
                    }`}
                  />
                ))}
              </div>
              {otpError && <p className="text-[11px] text-error text-center" role="alert">{otpError}</p>}
              {import.meta.env.DEV && resetCode && (
                <p className="text-[11px] text-placeholder text-center">Dev hint: your code is <strong>{resetCode}</strong></p>
              )}
            </div>

            <div className="flex gap-2.5 items-start bg-info-surface border border-info-border-strong rounded-lg px-4 py-3">
              <Info size={15} className="text-info-text flex-shrink-0 mt-0.5" />
              <p className="text-[12px] text-info-text leading-relaxed">Code is valid for <span className="font-bold">10 minutes</span>. Check your spam folder if not found.</p>
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
                onClick={async () => {
                  setResendSecs(60);
                  const res = await forgotPassword(email);
                  if (res.success) {
                    setResetCode(res.resetCode);
                    showToast({ type: 'info', title: 'Code Resent', message: `New code sent to ${email}` });
                  } else {
                    showToast({ type: 'error', title: 'Failed', message: res.error || 'Could not resend code.' });
                  }
                }}
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
              placeholder="Min. 8 characters"
              value={newPw}
              onChange={e => { setNewPw(e.target.value); setNewPwError(''); if (confirmPw) setConfirmPwError(e.target.value !== confirmPw ? 'Passwords do not match' : ''); }}
              leftIcon={<Lock size={16} />}
              rightIcon={
                <button type="button" onClick={() => setShowPw(p => !p)} aria-label={showPw ? 'Hide' : 'Show'} className="cursor-pointer text-placeholder hover:text-body">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              autoComplete="new-password"
              error={newPwError}
            />

            {newPw.length > 0 && (
              <div className="mt-1 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-muted">Password strength</span>
                  <span className={`text-[11px] font-semibold ${pwLabelClass}`}>{pwLabel}</span>
                </div>
                <div className="h-1 bg-border-light rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-300 ${pwBarClass}`} style={{ width: pwWidth }} />
                </div>
              </div>
            )}

            <Input
              label="Confirm password"
              type={showConfirm ? 'text' : 'password'}
              placeholder="Repeat password"
              value={confirmPw}
              onChange={e => { setConfirmPw(e.target.value); setConfirmPwError(e.target.value && newPw && e.target.value !== newPw ? 'Passwords do not match' : ''); }}
              leftIcon={<Lock size={16} />}
              rightIcon={
                <button type="button" onClick={() => setShowConfirm(p => !p)} aria-label={showConfirm ? 'Hide' : 'Show'} className="cursor-pointer text-placeholder hover:text-body">
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              autoComplete="new-password"
              error={confirmPwError}
            />

            <div className="flex gap-2.5 items-start bg-info-surface border border-info-border-strong rounded-lg px-4 py-3">
              <Info size={15} className="text-info-text flex-shrink-0 mt-0.5" />
              <p className="text-[12px] text-info-text leading-relaxed">Must be <span className="font-bold">8+ characters</span> long and match the confirm field.</p>
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
