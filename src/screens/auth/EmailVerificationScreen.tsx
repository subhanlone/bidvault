import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  IconBidVaultLogo, IconCheck, IconEmailLg, IconEmail, IconInfo, IconArrow, IconResend,
} from '../../components/Icons';

export default function EmailVerificationScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyEmail } = useAuth();
  const { showToast } = useToast();

  const email: string = (location.state as { email?: string })?.email ?? '';
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(60);
  const [codeExpiry, setCodeExpiry] = useState(600);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const t = setInterval(() => setResendSeconds(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendSeconds]);

  useEffect(() => {
    if (codeExpiry <= 0) return;
    const t = setInterval(() => setCodeExpiry(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [codeExpiry]);

  const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const handleInput = (i: number, val: string) => {
    const digit = val.replace(/\D/, '').slice(-1);
    const next = [...otp];
    next[i] = digit;
    setOtp(next);
    if (digit && i < 5) inputRefs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
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

  const handleSubmit = async () => {
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
    if (resendSeconds > 0) return;
    setResendSeconds(60);
    setCodeExpiry(600);
    showToast({ type: 'info', title: 'Code Resent', message: `A new code was sent to ${email}` });
  };

  return (
    <div className="min-h-screen md:h-screen flex overflow-hidden bg-white">
      <div className="grid md:grid-cols-2 w-full md:h-full">

        {/* LEFT PANEL */}
        <div
          className="hidden md:flex flex-col items-start overflow-hidden p-[52px] relative h-full"
          style={{ backgroundImage: 'linear-gradient(145deg,rgb(11,31,58) 0%,rgb(26,51,86) 50%,rgb(31,78,140) 100%)' }}
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
                <span className="font-bold text-[#ff8a96] text-[10px] tracking-[1.2px] uppercase">Almost There</span>
              </div>
              <h1 className="font-extrabold text-[36px] text-white leading-[42px]">
                One last step<br />to activate your<br />account
              </h1>
              <p className="max-w-[340px] text-[14px] text-[rgba(255,255,255,0.58)] leading-[23px]">
                We sent a 6-digit verification code to your email address. Enter it to confirm your identity and start using BidVault.
              </p>
              <div className="flex gap-4 items-start pt-4">
                {[{ value: fmtTime(codeExpiry), label: 'Code Expires' }, { value: '6', label: 'Digit Code' }].map(s => (
                  <div key={s.label} className="bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.14)] flex flex-col gap-[3px] items-start px-[17px] py-[13px] rounded-[10px]">
                    <span className="font-extrabold text-[22px] text-white leading-[22px]">{s.value}</span>
                    <span className="font-medium text-[11px] text-[rgba(255,255,255,0.55)]">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-[10px]">
              {['Code valid for 10 minutes only', 'Check spam folder if not found', 'Your account is 100% secure'].map(t => (
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
        <div className="bg-white flex flex-col items-start justify-center px-5 py-8 sm:px-8 md:px-[52px] overflow-y-auto md:h-full">
          <div className="w-full max-w-[440px] mx-auto md:max-w-none md:mx-0">

          {/* Mobile brand header */}
          <div className="md:hidden flex items-center gap-3 mb-6">
            <div className="bg-[#d0021b] flex items-center justify-center rounded-[10px] size-[40px]">
              <IconBidVaultLogo />
            </div>
            <span className="font-extrabold text-[24px] text-[#0b1f3a] tracking-[-0.5px]">
              Bid<span className="text-[#d0021b]">Vault</span>
            </span>
          </div>
          <div className="flex flex-col gap-[18px] w-full">
            <div className="flex justify-center">
              <div className="bg-[#fff0f2] border border-[rgba(208,2,27,0.15)] flex items-center justify-center rounded-[18px] size-[72px]">
                <IconEmailLg />
              </div>
            </div>

            <div className="flex flex-col gap-[5px] text-center">
              <h3 className="font-extrabold text-[18px] text-[#0b1f3a]">Check your inbox</h3>
              <p className="text-[13px] text-[#6c757d] leading-[20px]">
                We sent a 6-digit code to<br />
                <span className="font-bold text-[#343a40]">{email || 'your email'}</span>
              </p>
            </div>

            <div className="bg-[#f8f9fa] border border-[#e9ecef] flex gap-3 items-center px-[17px] py-[13px] rounded-[8px]">
              <IconEmail className="h-[17px] w-[20px]" />
              <div className="flex-1">
                <p className="font-bold text-[14px] text-[#343a40]">{email || 'your email'}</p>
                <p className="text-[11.5px] text-[#adb5bd]">Code expires in {fmtTime(codeExpiry)}</p>
              </div>
              <Link to="/register" className="font-bold text-[12px] text-[#d0021b]">Change</Link>
            </div>

            {/* OTP */}
            <div className="flex flex-col gap-[10px]">
              <label className="font-bold text-[12px] text-[#343a40] text-center tracking-[0.15px]">
                Enter 6-digit verification code
              </label>
              <div className="flex gap-[10px] justify-center" onPaste={handlePaste}>
                {otp.map((val, i) => (
                  <input
                    key={i}
                    ref={el => { inputRefs.current[i] = el; }}
                    maxLength={1}
                    value={val}
                    onChange={e => handleInput(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    className={`h-[64px] w-[52px] rounded-[8px] text-center font-extrabold text-[26px] border outline-none transition-all ${
                      val
                        ? 'bg-[#fff0f2] border-[#d0021b] text-[#a80016]'
                        : document.activeElement === inputRefs.current[i]
                          ? 'bg-white border-[#d0021b] shadow-[0px_0px_0px_3px_rgba(208,2,27,0.08)]'
                          : 'bg-[#f8f9fa] border-[#e9ecef] text-[#343a40]'
                    }`}
                  />
                ))}
              </div>
              <p className="text-[11px] text-[#adb5bd] text-center">Hint: use code <strong>123456</strong> for demo</p>
            </div>

            <div className="bg-[#eff6ff] border border-[#bfdbfe] flex gap-[10px] items-start px-[15px] py-[13px] rounded-[8px]">
              <IconInfo className="size-[17px] shrink-0" color="#1e40af" />
              <p className="font-medium text-[12.5px] text-[#1e40af] leading-[19px]">
                Check your <span className="font-bold">spam or junk folder</span> if you don't see the email. Code is valid for <span className="font-bold">10 minutes</span>.
              </p>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || otp.join('').length < 6}
              className="bg-[#d0021b] drop-shadow-[0px_4px_8px_rgba(208,2,27,0.28)] flex gap-[9px] h-[50px] items-center justify-center rounded-[8px] w-full hover:bg-[#a80016] transition-colors disabled:opacity-60"
            >
              {loading
                ? <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><span className="font-bold text-[15px] text-white tracking-[0.2px]">Verify & Activate Account</span><IconArrow /></>
              }
            </button>

            <div className="flex gap-[7px] items-center justify-center">
              <IconResend />
              <span className="text-[13px] text-[#6c757d]">Didn't receive code?</span>
              <button
                onClick={handleResend}
                disabled={resendSeconds > 0}
                className={`font-bold text-[13px] ${resendSeconds > 0 ? 'text-[#adb5bd]' : 'text-[#d0021b]'}`}
              >
                {resendSeconds > 0 ? `Resend (${fmtTime(resendSeconds)})` : 'Resend Code'}
              </button>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
