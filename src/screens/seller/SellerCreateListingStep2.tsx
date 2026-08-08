import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Package, Smartphone, Car } from 'lucide-react';
import { useListing } from '../../context/ListingContext';
import { useToast } from '../../context/ToastContext';
import { Button, Input } from '../../components/ui';
import StepProgress from '../../components/ui/StepProgress';
import { ListingStepperHeader } from './SellerCreateListingStep1';
import { api } from '../../services/api';
import { pkr } from '../../utils/format';

const DURATIONS = [3, 5, 7, 14];
const MAX_PRICE = 100_000_000;
// The server accepts durationDays 1–30. The presets only ever offered four of those, with no way
// to enter anything else, so a seller could not run a 1-day or a 30-day auction at all.
const MIN_DURATION = 1;
const MAX_DURATION = 30;

/** Platform limits enforced by POST /listings. Defaults match the seeded PlatformSetting row and
 *  are only used if /settings/public is unreachable — the server stays the real authority. */
const FALLBACK_LIMITS = { minListingPrice: 1_000, maxBidIncrement: 500_000 };

export default function SellerCreateListingStep2() {
  const navigate = useNavigate();
  const { draft, updateDraft } = useListing();
  const { showToast } = useToast();
  const [startingPriceError, setStartingPriceError] = useState('');
  const [minIncrementError, setMinIncrementError] = useState('');
  const [reservePriceError, setReservePriceError] = useState('');
  const [durationError, setDurationError] = useState('');
  const [limits, setLimits] = useState(FALLBACK_LIMITS);
  const [customDuration, setCustomDuration] = useState(!DURATIONS.includes(draft.duration));

  // These limits are enforced server-side at submit. Fetching them here is what lets the form
  // fail at the offending field instead of via a toast two steps later.
  useEffect(() => {
    api.get<{ minListingPrice: number; maxBidIncrement: number }>('/settings/public')
      .then(s => setLimits({
        minListingPrice: s.minListingPrice ?? FALLBACK_LIMITS.minListingPrice,
        maxBidIncrement: s.maxBidIncrement ?? FALLBACK_LIMITS.maxBidIncrement,
      }))
      .catch(() => {});
  }, []);

  const fmtPrice = (n: number) => n > 0 ? pkr(n) : '';

  // What someone would actually have to bid first. Surfacing it makes a lopsided increment
  // obvious while the seller is still looking at the field.
  const firstBid = draft.startingPrice > 0 && draft.minIncrement > 0
    ? draft.startingPrice + draft.minIncrement
    : null;

  const handleNext = () => {
    setStartingPriceError('');
    setMinIncrementError('');
    setReservePriceError('');
    setDurationError('');

    let invalidCount = 0;

    if (draft.startingPrice <= 0) { setStartingPriceError('Starting price is required'); invalidCount += 1; }
    else if (!Number.isInteger(draft.startingPrice)) { setStartingPriceError('Starting price must be a whole number'); invalidCount += 1; }
    // Same rule POST /listings applies — checked here so it surfaces on the field itself.
    else if (draft.startingPrice < limits.minListingPrice) { setStartingPriceError(`Starting price must be at least ${pkr(limits.minListingPrice)}`); invalidCount += 1; }
    else if (draft.startingPrice > MAX_PRICE) { setStartingPriceError(`Starting price must be under PKR ${MAX_PRICE.toLocaleString()}`); invalidCount += 1; }

    if (draft.minIncrement <= 0) { setMinIncrementError('Minimum increment is required'); invalidCount += 1; }
    else if (!Number.isInteger(draft.minIncrement)) { setMinIncrementError('Minimum increment must be a whole number'); invalidCount += 1; }
    else if (draft.minIncrement > limits.maxBidIncrement) { setMinIncrementError(`Minimum increment cannot exceed ${pkr(limits.maxBidIncrement)}`); invalidCount += 1; }
    // An increment larger than the asking price means the first legal bid more than doubles it,
    // which is almost never intended — PKR 500 start with a PKR 1,000 increment was accepted.
    else if (draft.startingPrice > 0 && draft.minIncrement > draft.startingPrice) {
      setMinIncrementError(`Increment can't exceed the ${pkr(draft.startingPrice)} starting price — the first bid would be ${pkr(draft.startingPrice + draft.minIncrement)}`);
      invalidCount += 1;
    }
    else if (draft.minIncrement > MAX_PRICE) { setMinIncrementError(`Minimum increment must be under PKR ${MAX_PRICE.toLocaleString()}`); invalidCount += 1; }

    if (!Number.isInteger(draft.duration) || draft.duration < MIN_DURATION || draft.duration > MAX_DURATION) {
      setDurationError(`Duration must be a whole number of days between ${MIN_DURATION} and ${MAX_DURATION}`);
      invalidCount += 1;
    }

    if (draft.hasReserve) {
      if (draft.reservePrice <= draft.startingPrice) {
        setReservePriceError('Reserve price must be higher than starting price');
        invalidCount += 1;
      } else if (!Number.isInteger(draft.reservePrice)) {
        setReservePriceError('Reserve price must be a whole number');
        invalidCount += 1;
      } else if (draft.reservePrice > MAX_PRICE) {
        setReservePriceError(`Reserve price must be under PKR ${MAX_PRICE.toLocaleString()}`);
        invalidCount += 1;
      }
    }

    if (invalidCount > 1) {
      showToast({ type: 'error', title: 'Missing Fields', message: 'Please fill in the highlighted fields.' });
    }
    if (invalidCount > 0) return;
    navigate('/seller/create-listing/step-3');
  };

  return (
    <div className="min-h-screen bg-bg">
      <ListingStepperHeader />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
        <div className="mb-5">
          <h1 className="text-xl font-extrabold text-navy">Create New Auction Listing</h1>
          <p className="text-sm text-muted">Set your auction parameters</p>
        </div>

        <StepProgress
          steps={[
            { label: 'Item Details' },
            { label: 'Auction Setup' },
            { label: 'Review & Submit' },
          ]}
          currentStep={2}
        />

        <form onSubmit={e => { e.preventDefault(); handleNext(); }}>
          <div className="flex flex-col md:grid md:grid-cols-[1fr_280px] gap-5">
            {/* Parameters */}
            <div className="bg-surface border border-border-light rounded-md p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-md bg-primary-surface flex items-center justify-center flex-shrink-0">
                  <Clock size={18} strokeWidth={1.8} className="text-primary" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-navy">Auction Parameters</h2>
                  <p className="text-xs text-muted">Define timing and pricing for your auction</p>
                </div>
              </div>

              <div className="flex flex-col gap-5">
                <div className="flex items-start gap-2 bg-info-surface border border-info-border-strong rounded-lg px-3 py-2.5">
                  <Clock size={14} className="text-info flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-info leading-relaxed">
                    Your auction goes live automatically the moment admin approves this listing — no need to pick a start time.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <span id="duration-label" className="text-xs font-bold text-secondary">Duration <span className="text-primary">*</span></span>
                    <div role="group" aria-labelledby="duration-label" className="flex gap-1.5">
                      {DURATIONS.map(d => (
                        <button
                          key={d}
                          type="button"
                          aria-pressed={!customDuration && draft.duration === d}
                          aria-label={`${d} days`}
                          onClick={() => { setCustomDuration(false); setDurationError(''); updateDraft({ duration: d }); }}
                          className={`flex-1 h-10 rounded-lg font-semibold text-xs border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${
                            !customDuration && draft.duration === d
                              ? 'bg-primary text-white border-primary'
                              : 'bg-surface border-border text-body hover:border-primary'
                          }`}
                        >
                          {d}d
                        </button>
                      ))}
                      {/* The four presets covered only part of the 1–30 days the server accepts,
                          so short and long auctions were simply unreachable from the UI. */}
                      <button
                        type="button"
                        aria-pressed={customDuration}
                        aria-label="Custom duration in days"
                        onClick={() => { setCustomDuration(true); setDurationError(''); }}
                        className={`flex-1 h-10 rounded-lg font-semibold text-xs border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${
                          customDuration
                            ? 'bg-primary text-white border-primary'
                            : 'bg-surface border-border text-body hover:border-primary'
                        }`}
                      >
                        Custom
                      </button>
                    </div>
                    {customDuration && (
                      <Input
                        aria-label="Auction duration in days"
                        type="number"
                        inputMode="numeric"
                        min={MIN_DURATION}
                        max={MAX_DURATION}
                        step={1}
                        placeholder={`${MIN_DURATION}–${MAX_DURATION} days`}
                        value={draft.duration || ''}
                        onChange={e => { updateDraft({ duration: Number(e.target.value) }); setDurationError(''); }}
                        error={durationError}
                      />
                    )}
                    {!customDuration && durationError && (
                      <p role="alert" className="text-[12px] text-error">{durationError}</p>
                    )}
                  </div>
                  <Input
                    label="Starting price (PKR)"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={MAX_PRICE}
                    step={1}
                    value={draft.startingPrice || ''}
                    onChange={e => {
                      updateDraft({ startingPrice: Number(e.target.value) });
                      setStartingPriceError('');
                    }}
                    hint={`Platform minimum ${pkr(limits.minListingPrice)}`}
                    error={startingPriceError}
                    required
                  />
                </div>

                <div>
                  <Input
                    label="Minimum bid increment (PKR)"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={MAX_PRICE}
                    step={1}
                    value={draft.minIncrement || ''}
                    onChange={e => {
                      updateDraft({ minIncrement: Number(e.target.value) });
                      setMinIncrementError('');
                    }}
                    error={minIncrementError}
                    required
                  />
                  <p className="text-[11px] text-muted mt-1">
                    The minimum amount each bid must be raised by
                    {firstBid !== null && !minIncrementError && (
                      <> — first bid would be <span className="font-bold text-secondary">{pkr(firstBid)}</span></>
                    )}
                  </p>
                </div>

                {/* Reserve toggle */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-bold text-secondary">Reserve price</p>
                      <p className="text-xs text-muted">Auction won't close below this amount</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={draft.hasReserve}
                      aria-label="Enable reserve price"
                      onClick={() => {
                        updateDraft({ hasReserve: !draft.hasReserve, reservePrice: 0 });
                        setReservePriceError('');
                      }}
                      className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${draft.hasReserve ? 'bg-primary' : 'bg-border'}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-surface shadow transition-all ${draft.hasReserve ? 'left-[22px]' : 'left-0.5'}`} />
                    </button>
                  </div>
                  {draft.hasReserve && (
                    <Input
                      label="Reserve price (PKR)"
                      type="number"
                      inputMode="numeric"
                      aria-label="Reserve price in PKR"
                      min={1}
                      max={MAX_PRICE}
                      step={1}
                      value={draft.reservePrice || ''}
                      onChange={e => {
                        updateDraft({ reservePrice: Number(e.target.value) });
                        setReservePriceError('');
                      }}
                      error={reservePriceError}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="bg-surface border border-border-light rounded-md p-5 h-fit">
              <h3 className="text-sm font-bold text-navy mb-4">Auction Preview</h3>
              <div className="bg-navy rounded-md h-40 flex items-center justify-center mb-4 overflow-hidden">
                {draft.imageUrl
                  ? <img src={draft.imageUrl} alt={draft.title} className="w-full h-full object-cover" />
                  : draft.category?.includes('Electronics')
                  ? <Smartphone size={52} strokeWidth={1.2} className="text-white/30" aria-hidden="true" />
                  : draft.category?.includes('Vehicles')
                  ? <Car size={52} strokeWidth={1.2} className="text-white/30" aria-hidden="true" />
                  : <Package size={52} strokeWidth={1.2} className="text-white/30" aria-hidden="true" />}
              </div>
              <h4 className="text-sm font-bold text-secondary mb-3 truncate">{draft.title || 'Your Item Title'}</h4>
              <div className="flex flex-col gap-2">
                {[
                  { label: 'Starting bid', value: fmtPrice(draft.startingPrice) || '—', bold: true },
                  { label: 'Duration',     value: `${draft.duration} Days` },
                  { label: 'Starts',       value: 'On admin approval' },
                  ...(draft.hasReserve ? [{ label: 'Reserve', value: fmtPrice(draft.reservePrice) || '—', bold: false }] : []),
                ].map(d => (
                  <div key={d.label} className="flex justify-between">
                    <span className="text-xs text-muted">{d.label}</span>
                    <span className={`text-xs ${d.bold ? 'font-bold text-primary' : 'font-semibold text-secondary'}`}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between mt-5">
            <Button variant="outline" onClick={() => navigate('/seller/create-listing/step-1')}>← Back</Button>
            <Button type="submit" variant="primary">Next </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
