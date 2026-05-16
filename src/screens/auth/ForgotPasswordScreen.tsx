import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  IconBidVaultLogo, IconCheck, IconArrowLeft, IconStepDone,
  IconMailLock, IconLock, IconEye, IconInfo, IconShield, IconResend,
} from '../../components/Icons';

type Step = 1 | 2 | 3;

function StepTracker({ step }: { step: Step }) {
  const steps = ['Email', 'Verify Code', 'New Password'];
  return (
    <div className="flex items-start justify-center pb-2">
      {steps.map((label, i) => {
        const n = (i + 1) as Step;
        const done = step > n;
        const active = step === n;
        return (
          <div key={label} className="flex flex-1 flex-col gap-[6px] items-center relative">
            {i < steps.length - 1 && (
              <div className={`absolute h-[2px] left-1/2 right-[-50%] top-[14px] ${done || active ? 'bg-[#d0021b]' : 'bg-[#e9ecef]'}`} />
            )}
            <div className={`flex items-center justify-center rounded-[14px] size-[28px] border-2 ${done ? 'bg-[#fff0f2] border-[#d0021b]' : active ? 'bg-[#d0021b] border-[#d0021b]' : 'bg-white border-[#e9ecef]'}`}>
              {done
                ? <IconStepDone />
                : <span className={`font-extrabold text-[12px] ${active ? 'text-white' : 'text-[#adb5bd]'}`}>{n}</span>
              }
            </div>
            <span className={`font-bold text-[10.5px] tracking-[0.2px] ${active ? 'text-[#d0021b]' : done ? 'text-[#495057]' : 'text-[#adb5bd]'}`}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function ForgotPasswordScreen() {
  const navigate = useNavigate();
  const { forgotPassword, verifyResetOtp, resetPassword } = useAuth();
  const { showToast } = useToast();

  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (step === 2) {
      setResendSeconds(60);
      inputRefs.current[0]?.focus();
    }
  }, [step]);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const t = setInterval(() => setResendSeconds(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendSeconds]);

  const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const handleOtpInput = (i: number, val: string) => {
    const digit = val.replace(/\D/, '').slice(-1);
    const next = [...otp]; next[i] = digit; setOtp(next);
    if (digit && i < 5) inputRefs.current[i + 1]?.focus();
  };

  const handleOtpKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) inputRefs.current[i - 1]?.focus();
  };

  const handleStep1 = async (e: React.SyntheticEvent) => {
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

  const handleStep2 = async (e: React.SyntheticEvent) => {
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

  const handleStep3 = async (e: React.SyntheticEvent) => {
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

  const leftPanel = (
    <div
      className="flex flex-col items-start justify-between overflow-hidden p-[52px] relative h-full"
      style={{ backgroundImage: 'linear-gradient(156deg,rgb(11,31,58) 0%,rgb(26,51,86) 50%,rgb(31,78,140) 100%)' }}
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
          <span className="font-bold text-[#ff8a96] text-[10px] tracking-[1.2px] uppercase">Account Recovery</span>
        </div>
        <h1 className="font-extrabold text-[36px] text-white leading-[42px]">
          Don't worry —<br />we've got you<br />covered
        </h1>
        <p className="max-w-[340px] text-[14px] text-[rgba(255,255,255,0.58)] leading-[23px]">
          Reset your password in 3 simple steps. Enter your email, verify the code, and set a new secure password.
        </p>
      </div>
      <div className="flex flex-col gap-[10px] z-10">
        {['Reset code valid for 10 minutes', 'Sent to your registered email only', 'New password encrypted with bcrypt'].map(t => (
          <div key={t} className="flex gap-[10px] items-center">
            <div className="bg-[rgba(26,122,74,0.2)] border border-[rgba(26,122,74,0.4)] flex items-center justify-center p-px rounded-[11px] size-[22px]">
              <IconCheck />
            </div>
            <span className="font-medium text-[12.5px] text-[rgba(255,255,255,0.65)]">{t}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="h-screen flex overflow-hidden">
      <div className="grid grid-cols-2 w-full h-full">
        {leftPanel}

        <div className="bg-white flex flex-col items-start justify-center p-[52px] overflow-y-auto h-full">
          <div className="flex gap-2 items-center pb-6">
            <IconArrowLeft />
            <Link to="/login" className="font-semibold text-[13px] text-[#6c757d]">Back to Sign In</Link>
          </div>

          <div className="flex flex-col gap-[18px] w-full">
            <StepTracker step={step} />

            {/* Step 1 — Email */}
            {step === 1 && (
              <form onSubmit={handleStep1} className="flex flex-col gap-[18px]">
                <div className="flex justify-center">
                  <div className="bg-[#fff0f2] border border-[rgba(208,2,27,0.15)] flex items-center justify-center rounded-[16px] size-[64px]">
                    <IconMailLock />
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="font-extrabold text-[18px] text-[#0b1f3a]">Forgot your password?</h3>
                  <p className="text-[13px] text-[#6c757d] leading-[20px] mt-1">Enter your account email to receive a reset code.</p>
                </div>
                <div className="flex flex-col gap-[6px]">
                  <label className="font-bold text-[12px] text-[#343a40] tracking-[0.15px]">Email address <span className="text-[#d0021b]">*</span></label>
                  <input
                    className="bg-white border border-[#dee2e6] h-[48px] px-4 rounded-[8px] text-[14px] text-[#343a40] w-full outline-none focus:border-[#d0021b]"
                    placeholder="you@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                  <p className="text-[11px] text-[#adb5bd]">Hint: try <strong>sawera@gmail.com</strong></p>
                </div>
                <button type="submit" disabled={loading} className="bg-[#d0021b] drop-shadow-[0px_4px_8px_rgba(208,2,27,0.28)] flex gap-[9px] h-[50px] items-center justify-center rounded-[8px] w-full hover:bg-[#a80016] transition-colors disabled:opacity-60">
                  {loading ? <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <span className="font-bold text-[15px] text-white">Send Reset Code</span>}
                </button>
              </form>
            )}

            {/* Step 2 — OTP */}
            {step === 2 && (
              <form onSubmit={handleStep2} className="flex flex-col gap-[18px]">
                <div className="flex justify-center">
                  <div className="bg-[#fff0f2] border border-[rgba(208,2,27,0.15)] flex items-center justify-center rounded-[16px] size-[64px]">
                    <IconMailLock />
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="font-extrabold text-[18px] text-[#0b1f3a]">Reset code sent!</h3>
                  <p className="text-[13px] text-[#6c757d] leading-[20px] mt-1">We sent a 6-digit code to<br /><span className="font-bold text-[#343a40]">{email}</span></p>
                </div>
                <div className="flex flex-col gap-[10px]">
                  <label className="font-bold text-[12px] text-[#343a40] text-center tracking-[0.15px]">Enter 6-digit reset code</label>
                  <div className="flex gap-[10px] justify-center">
                    {otp.map((val, i) => (
                      <input
                        key={i}
                        ref={el => { inputRefs.current[i] = el; }}
                        maxLength={1}
                        value={val}
                        onChange={e => handleOtpInput(i, e.target.value)}
                        onKeyDown={e => handleOtpKey(i, e)}
                        className={`h-[64px] w-[52px] rounded-[8px] text-center font-extrabold text-[26px] border outline-none transition-all ${val ? 'bg-[#fff0f2] border-[#d0021b] text-[#a80016]' : 'bg-[#f8f9fa] border-[#e9ecef] text-[#343a40]'}`}
                      />
                    ))}
                  </div>
                  <p className="text-[11px] text-[#adb5bd] text-center">Hint: use code <strong>654321</strong> for demo</p>
                </div>
                <div className="bg-[#eff6ff] border border-[#bfdbfe] flex gap-[10px] items-start px-[15px] py-[13px] rounded-[8px]">
                  <IconInfo className="size-[17px] shrink-0" color="#1e40af" />
                  <p className="font-medium text-[12.5px] text-[#1e40af] leading-[19px]">Code is valid for <span className="font-bold">10 minutes</span>. Check your spam folder if not found.</p>
                </div>
                <button type="submit" disabled={loading || otp.join('').length < 6} className="bg-[#d0021b] drop-shadow-[0px_4px_8px_rgba(208,2,27,0.28)] flex gap-[9px] h-[50px] items-center justify-center rounded-[8px] w-full hover:bg-[#a80016] transition-colors disabled:opacity-60">
                  {loading ? <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <span className="font-bold text-[15px] text-white">Verify Code</span>}
                </button>
                <div className="flex gap-[7px] items-center justify-center">
                  <IconResend />
                  <span className="text-[13px] text-[#6c757d]">Didn't get the code?</span>
                  <button type="button" disabled={resendSeconds > 0} onClick={() => { setResendSeconds(60); showToast({ type: 'info', title: 'Code Resent', message: `New code sent to ${email}` }); }} className={`font-bold text-[13px] ${resendSeconds > 0 ? 'text-[#adb5bd]' : 'text-[#d0021b]'}`}>
                    {resendSeconds > 0 ? `Resend (${fmtTime(resendSeconds)})` : 'Resend email'}
                  </button>
                </div>
              </form>
            )}

            {/* Step 3 — New Password */}
            {step === 3 && (
              <form onSubmit={handleStep3} className="flex flex-col gap-[18px]">
                <div className="text-center">
                  <h3 className="font-extrabold text-[18px] text-[#0b1f3a]">Set a new password</h3>
                  <p className="text-[13px] text-[#6c757d] leading-[20px] mt-1">Choose a strong password for your account.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-[6px]">
                    <label className="font-bold text-[12px] text-[#343a40] tracking-[0.15px]">New password <span className="text-[#d0021b]">*</span></label>
                    <div className="relative">
                      <input type={showPw ? 'text' : 'password'} placeholder="Min. 6 characters" className="bg-white border border-[#dee2e6] h-[48px] pl-[43px] pr-[45px] rounded-[8px] text-[14px] text-[#343a40] w-full outline-none focus:border-[#d0021b]" value={newPw} onChange={e => setNewPw(e.target.value)} />
                      <span className="absolute left-[14px] top-[16px]"><IconLock /></span>
                      <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-[14px] top-[17.5px]"><IconEye /></button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-[6px]">
                    <label className="font-bold text-[12px] text-[#343a40] tracking-[0.15px]">Confirm password <span className="text-[#d0021b]">*</span></label>
                    <div className="relative">
                      <input type={showConfirm ? 'text' : 'password'} placeholder="Repeat password" className="bg-white border border-[#dee2e6] h-[48px] pl-[43px] pr-[45px] rounded-[8px] text-[14px] text-[#343a40] w-full outline-none focus:border-[#d0021b]" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} />
                      <span className="absolute left-[14px] top-[16px]"><IconLock /></span>
                      <button type="button" onClick={() => setShowConfirm(p => !p)} className="absolute right-[14px] top-[17.5px]"><IconEye /></button>
                    </div>
                  </div>
                </div>
                <div className="bg-[#eff6ff] border border-[#bfdbfe] flex gap-[10px] items-start px-[15px] py-[13px] rounded-[8px]">
                  <IconInfo className="size-[17px] shrink-0" color="#1e40af" />
                  <p className="font-medium text-[12.5px] text-[#1e40af] leading-[19px]">Must be <span className="font-bold">6+ characters</span> long and match the confirm field.</p>
                </div>
                <button type="submit" disabled={loading} className="bg-[#0b1f3a] drop-shadow-[0px_4px_8px_rgba(11,31,58,0.22)] flex gap-[9px] h-[50px] items-center justify-center rounded-[8px] w-full hover:bg-[#1a3356] transition-colors disabled:opacity-60">
                  {loading ? <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><IconShield /><span className="font-bold text-[15px] text-white">Reset My Password</span></>}
                </button>
              </form>
            )}

            <p className="text-[13px] text-[#6c757d] text-center">
              Remembered your password?{' '}
              <Link to="/login" className="font-bold text-[#d0021b]">Back to sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
