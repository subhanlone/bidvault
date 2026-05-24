import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Calendar, Package, Smartphone, Car } from 'lucide-react';
import { useListing } from '../../context/ListingContext';
import { useToast } from '../../context/ToastContext';
import { Button, Input } from '../../components/ui';
import StepProgress from '../../components/ui/StepProgress';
import { ListingStepperHeader } from './SellerCreateListingStep1';

const DURATIONS = [3, 5, 7, 14];

export default function SellerCreateListingStep2() {
  const navigate = useNavigate();
  const { draft, updateDraft } = useListing();
  const { showToast } = useToast();
  const [startDateError, setStartDateError] = useState('');
  const [startTimeError, setStartTimeError] = useState('');
  const [startingPriceError, setStartingPriceError] = useState('');
  const [minIncrementError, setMinIncrementError] = useState('');
  const [reservePriceError, setReservePriceError] = useState('');

  const fmtPrice = (n: number) => n > 0 ? `PKR ${n.toLocaleString()}` : '';
  const endDate = (() => {
    if (!draft.startDate) return '—';
    const d = new Date(draft.startDate);
    d.setDate(d.getDate() + draft.duration);
    return d.toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' });
  })();

  const handleNext = () => {
    setStartDateError('');
    setStartTimeError('');
    setStartingPriceError('');
    setMinIncrementError('');
    setReservePriceError('');

    let invalidCount = 0;
    if (!draft.startDate)   { setStartDateError('Start date is required'); invalidCount += 1; }
    if (!draft.startTime)   { setStartTimeError('Start time is required'); invalidCount += 1; }
    if (draft.startingPrice <= 0) { setStartingPriceError('Starting price is required'); invalidCount += 1; }
    if (draft.minIncrement <= 0) { setMinIncrementError('Minimum increment is required'); invalidCount += 1; }
    if (draft.hasReserve && draft.reservePrice <= draft.startingPrice) {
      setReservePriceError('Reserve price must be higher than starting price');
      invalidCount += 1;
    }
    if (invalidCount > 1) {
      showToast({ type: 'error', title: 'Missing Fields', message: 'Please fill in the highlighted fields.' });
    }
    if (invalidCount > 0) return;
    navigate('/seller/create-listing/step-4');
  };

  return (
    <div className="min-h-screen bg-bg">
      <ListingStepperHeader currentStep={1} />

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
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Auction start date"
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={draft.startDate}
                    onChange={e => {
                      updateDraft({ startDate: e.target.value });
                      setStartDateError('');
                    }}
                    leftIcon={<Calendar size={15} aria-hidden="true" />}
                    error={startDateError}
                  />
                  <Input
                    label="Start time"
                    type="time"
                    value={draft.startTime}
                    onChange={e => {
                      updateDraft({ startTime: e.target.value });
                      setStartTimeError('');
                    }}
                    leftIcon={<Clock size={15} aria-hidden="true" />}
                    error={startTimeError}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <span id="duration-label" className="text-xs font-bold text-secondary">Duration <span className="text-primary">*</span></span>
                    <div role="group" aria-labelledby="duration-label" className="flex gap-1.5">
                      {DURATIONS.map(d => (
                        <button
                          key={d}
                          type="button"
                          aria-pressed={draft.duration === d}
                          aria-label={`${d} days`}
                          onClick={() => updateDraft({ duration: d })}
                          className={`flex-1 h-10 rounded-lg font-semibold text-xs border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${
                            draft.duration === d
                              ? 'bg-primary text-white border-primary'
                              : 'bg-surface border-border text-body hover:border-primary'
                          }`}
                        >
                          {d}d
                        </button>
                      ))}
                    </div>
                  </div>
                  <Input
                    label="Starting price (PKR)"
                    type="number"
                    inputMode="numeric"
                    placeholder="e.g. 85000"
                    value={draft.startingPrice || ''}
                    onChange={e => {
                      updateDraft({ startingPrice: Number(e.target.value) });
                      setStartingPriceError('');
                    }}
                    error={startingPriceError}
                  />
                </div>

                <Input
                  label="Minimum bid increment (PKR)"
                  type="number"
                  inputMode="numeric"
                  placeholder="e.g. 1000"
                  value={draft.minIncrement || ''}
                  onChange={e => {
                    updateDraft({ minIncrement: Number(e.target.value) });
                    setMinIncrementError('');
                  }}
                  error={minIncrementError}
                />

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
                      placeholder="e.g. 95000"
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
              <div className="bg-navy rounded-md h-40 flex items-center justify-center mb-4">
                {draft.category?.includes('Electronics')
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
                  { label: 'Starts',       value: draft.startDate ? `${draft.startDate} · ${draft.startTime || '?'}` : '—' },
                  { label: 'Ends',         value: endDate },
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
            <Button type="submit" variant="primary">Next: Review →</Button>
          </div>
        </form>
      </main>
    </div>
  );
}
