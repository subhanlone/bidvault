import { useEffect, useId, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ListPlus, Wallet, Gavel } from 'lucide-react';
import { useAuth } from '../../context/auth';
import { useToast } from '../../context/toast';
import { BuyerNavbar, Button, ErrorState, Input, Textarea } from '../../components/ui';
import LoadingStatus from '../../components/ui/LoadingStatus';
import { api } from '../../services/api';
import { homePath, writeMode } from '../../utils/account';

// Where a seller can be, as the contract lists them (EnrollSellerRequest['province']).
const PROVINCES = [
  'Punjab',
  'Sindh',
  'Khyber Pakhtunkhwa',
  'Balochistan',
  'Islamabad Capital Territory',
  'Gilgit-Baltistan',
  'Azad Jammu and Kashmir',
] as const;

const BIO_MAX = 280;

type Field = 'city' | 'province' | 'phone' | 'bio' | 'terms' | 'adult';

/**
 * Turning a buying account into a selling one. Instant: there is no approval step, the safeguards
 * are the terms accepted here, the details given, and (soon) a monthly limit for new sellers.
 * What is asked for is only what the public pages and fulfilment use -- no ID number, no bank.
 */
export default function BecomeSeller() {
  const { user, logout, becomeSeller } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // The terms version the form must send back. Without it the form cannot be submitted, so a
  // failed load is shown as such rather than leaving a button that quietly does nothing.
  const [termsVersion, setTermsVersion] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);

  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [confirmAdult, setConfirmAdult] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  const provinceId = useId();
  const termsId = useId();
  const adultId = useId();

  useEffect(() => {
    let cancelled = false;
    api.get('/settings/public')
      .then(s => { if (!cancelled) { setTermsVersion(s.sellerTermsVersion); setLoadFailed(false); } })
      .catch(() => { if (!cancelled) setLoadFailed(true); });
    return () => { cancelled = true; };
  }, [loadAttempt]);

  // Someone who is already a seller has nothing to fill in. (This is also where the page lands
  // after a successful submit, once the signed-in user is updated.)
  if (user?.isSeller) return <Navigate to="/seller/dashboard" replace />;

  const clear = (key: Field) => setErrors(p => ({ ...p, [key]: undefined }));

  const validate = (): Partial<Record<Field, string>> => {
    const e: Partial<Record<Field, string>> = {};
    const trimmedCity = city.trim();
    if (!trimmedCity) e.city = 'City is required';
    else if (trimmedCity.length < 2) e.city = 'City must be at least 2 characters';
    if (!province) e.province = 'Choose your province';
    if (!acceptTerms) e.terms = 'You must accept the seller terms';
    if (!confirmAdult) e.adult = 'You must confirm you are 18 or older';
    return e;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!termsVersion || !user) return;
    const found = validate();
    if (Object.keys(found).length > 0) { setErrors(found); return; }

    setSubmitting(true);
    const result = await becomeSeller({
      acceptTerms: true,
      termsVersion,
      confirmAdult: true,
      city: city.trim(),
      province: province as (typeof PROVINCES)[number],
      ...(phone.trim() ? { phone: phone.trim() } : {}),
      ...(bio.trim() ? { bio: bio.trim() } : {}),
    });
    setSubmitting(false);

    if (result.success) {
      writeMode(user, 'selling');
      showToast({ type: 'success', title: 'You are now a seller', message: 'You can list your first item whenever you are ready.' });
      navigate('/seller/dashboard', { replace: true });
      return;
    }
    // The server names the field it refused; show it there. Anything else is a toast.
    const named = result.details ?? {};
    const fromServer: Partial<Record<Field, string>> = {};
    for (const key of ['city', 'province', 'phone', 'bio'] as const) {
      if (named[key]?.[0]) fromServer[key] = named[key][0];
    }
    if (Object.keys(fromServer).length > 0) setErrors(fromServer);
    else showToast({ type: 'error', title: 'Could not set up your seller account', message: result.error ?? 'Something went wrong.' });
  };

  return (
    <div className="min-h-screen bg-bg">
      <BuyerNavbar userName={user?.name} onLogout={logout} />

      <main className="max-w-[640px] mx-auto px-4 py-8 sm:py-10 flex flex-col gap-6">
        <header>
          <h1 className="text-2xl font-extrabold text-navy">Become a seller</h1>
          <p className="text-sm text-muted mt-1">
            Sell with the account you already have. It takes a minute and there is nothing to wait for.
          </p>
        </header>

        <section aria-labelledby="what-you-can-do" className="bg-surface border border-border-light rounded-md p-5">
          <h2 id="what-you-can-do" className="text-[13px] font-bold text-secondary mb-3">What you can do</h2>
          <ul className="flex flex-col gap-3 list-none m-0 p-0">
            {[
              { Icon: ListPlus, text: 'List items. Each one is reviewed by our team before it goes live.' },
              { Icon: Gavel, text: 'Run auctions with a starting price and an optional hidden reserve.' },
              { Icon: Wallet, text: 'Get paid into your earnings once the buyer confirms delivery.' },
            ].map(({ Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-[13px] text-body">
                <span className="w-7 h-7 rounded-md bg-primary-surface flex items-center justify-center flex-shrink-0">
                  <Icon size={14} className="text-primary" aria-hidden="true" />
                </span>
                <span className="pt-1">{text}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="visibility" className="bg-surface border border-border-light rounded-md p-5">
          <h2 id="visibility" className="text-[13px] font-bold text-secondary mb-3">What buyers can see</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px]">
            <div>
              <p className="flex items-center gap-1.5 font-semibold text-body mb-1"><Eye size={14} aria-hidden="true" /> Shown on your auctions</p>
              <p className="text-muted">Your name, your city and province, your bio, your items and your reviews.</p>
            </div>
            <div>
              <p className="flex items-center gap-1.5 font-semibold text-body mb-1"><EyeOff size={14} aria-hidden="true" /> Not shown</p>
              <p className="text-muted">Your email and phone number are not shown on public pages. If you give a phone number, only a buyer who has paid for one of your items can see it.</p>
            </div>
          </div>
        </section>

        {loadFailed ? (
          <ErrorState title="Could not load the seller terms" onRetry={() => setLoadAttempt(n => n + 1)} />
        ) : termsVersion === null ? (
          <div className="bg-surface border border-border-light rounded-md p-5 animate-pulse h-64">
            <LoadingStatus label="Loading the seller terms" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="bg-surface border border-border-light rounded-md p-5 flex flex-col gap-5">
            <h2 className="text-[13px] font-bold text-secondary">Your details</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="City"
                placeholder="e.g. Lahore"
                value={city}
                onChange={e => { setCity(e.target.value); clear('city'); }}
                error={errors.city}
                autoComplete="address-level2"
                maxLength={60}
              />
              <div className="flex flex-col gap-1">
                <label htmlFor={provinceId} className="text-[13px] font-semibold text-body">Province</label>
                <select
                  id={provinceId}
                  value={province}
                  onChange={e => { setProvince(e.target.value); clear('province'); }}
                  aria-invalid={!!errors.province}
                  aria-describedby={errors.province ? `${provinceId}-error` : undefined}
                  autoComplete="address-level1"
                  className={`w-full h-10 px-3 rounded-lg border text-sm text-body bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${errors.province ? 'border-error focus-visible:ring-error' : 'border-border focus:border-primary focus-visible:ring-primary'}`}
                >
                  <option value="">Choose a province</option>
                  {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                {errors.province && <p id={`${provinceId}-error`} role="alert" className="text-[12px] text-primary">{errors.province}</p>}
              </div>
            </div>

            <Input
              label="Phone (optional, private)"
              type="tel"
              placeholder="03xx xxxxxxx"
              value={phone}
              onChange={e => { setPhone(e.target.value); clear('phone'); }}
              error={errors.phone}
              hint="Not verified. Shown only to a buyer after they have paid for one of your items."
              autoComplete="tel"
            />

            <Textarea
              label="About you (optional)"
              placeholder="What you sell, how you pack and ship."
              value={bio}
              onChange={e => { setBio(e.target.value); clear('bio'); }}
              error={errors.bio}
              hint={`No links, email addresses or phone numbers. ${bio.length}/${BIO_MAX}`}
              maxLength={BIO_MAX}
              rows={3}
            />

            <section aria-labelledby="terms-heading" className="border border-border-light rounded-md">
              <h3 id="terms-heading" className="text-[12px] font-bold text-secondary px-4 pt-3">Seller terms</h3>
              {/* tabIndex so the scrolling summary can be reached and read with a keyboard. */}
              <div tabIndex={0} aria-label="Seller terms summary" className="max-h-40 overflow-y-auto px-4 py-2 text-[12.5px] text-tertiary leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md">
                <ul className="list-disc pl-4 flex flex-col gap-1.5">
                  <li>You are 18 or older.</li>
                  <li>You hold one account per person, and every account of yours follows these terms.</li>
                  <li>You describe each item honestly and show photos of the actual item.</li>
                  <li>You do not bid on your own items or ask others to, to raise a price.</li>
                  <li>You give a true reason when you cancel an auction.</li>
                  <li>You ship a paid item promptly and answer a buyer&apos;s dispute within the time given.</li>
                  <li>BidVault may remove a listing or limit selling on an account that breaks these terms. Sales already made continue.</li>
                </ul>
              </div>
            </section>

            <div className="flex flex-col gap-3">
              <div>
                <div className="flex gap-2.5 items-start">
                  <input
                    id={termsId}
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={e => { setAcceptTerms(e.target.checked); clear('terms'); }}
                    aria-describedby={errors.terms ? `${termsId}-error` : undefined}
                    className="mt-0.5 size-4 accent-primary cursor-pointer"
                  />
                  <label htmlFor={termsId} className="text-[13px] text-body cursor-pointer">I accept the seller terms (version {termsVersion})</label>
                </div>
                {errors.terms && <p id={`${termsId}-error`} role="alert" className="text-[12px] text-primary mt-1">{errors.terms}</p>}
              </div>
              <div>
                <div className="flex gap-2.5 items-start">
                  <input
                    id={adultId}
                    type="checkbox"
                    checked={confirmAdult}
                    onChange={e => { setConfirmAdult(e.target.checked); clear('adult'); }}
                    aria-describedby={errors.adult ? `${adultId}-error` : undefined}
                    className="mt-0.5 size-4 accent-primary cursor-pointer"
                  />
                  <label htmlFor={adultId} className="text-[13px] text-body cursor-pointer">I am 18 or older</label>
                </div>
                {errors.adult && <p id={`${adultId}-error`} role="alert" className="text-[12px] text-primary mt-1">{errors.adult}</p>}
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => user && navigate(homePath(user))}>Not now</Button>
              <Button type="submit" variant="primary" loading={submitting}>Become a seller</Button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
