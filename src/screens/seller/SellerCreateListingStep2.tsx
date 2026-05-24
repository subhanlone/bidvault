import { useNavigate } from 'react-router-dom';
import { Clock, Calendar, Package, Smartphone, Car } from 'lucide-react';
import { useListing } from '../../context/ListingContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui';
import { ListingStepperHeader, Stepper } from './SellerCreateListingStep1';

const DURATIONS = [3, 5, 7, 14];

export default function SellerCreateListingStep2() {
  const navigate = useNavigate();
  const { draft, updateDraft } = useListing();
  const { showToast } = useToast();

  const fmtPrice = (n: number) => n > 0 ? `PKR ${n.toLocaleString()}` : '';
  const endDate = (() => {
    if (!draft.startDate) return '—';
    const d = new Date(draft.startDate);
    d.setDate(d.getDate() + draft.duration);
    return d.toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' });
  })();

  const handleNext = () => {
    if (!draft.startDate)   { showToast({ type: 'error', title: 'Missing Start Date', message: 'Select an auction start date.' }); return; }
    if (!draft.startTime)   { showToast({ type: 'error', title: 'Missing Start Time', message: 'Select an auction start time.' }); return; }
    if (draft.startingPrice <= 0) { showToast({ type: 'error', title: 'Missing Price', message: 'Enter a starting price.' }); return; }
    if (draft.hasReserve && draft.reservePrice <= draft.startingPrice) {
      showToast({ type: 'error', title: 'Invalid Reserve', message: 'Reserve price must be higher than starting price.' });
      return;
    }
    navigate('/seller/create-listing/step-4');
  };

  const inputCls = "bg-white border border-[#dee2e6] h-10 px-3 rounded-lg text-sm text-[#343a40] w-full outline-none focus:border-[#d0021b] focus:shadow-[0_0_0_3px_rgba(208,2,27,0.08)] transition-shadow";
  const labelCls = "text-xs font-bold text-[#343a40]";

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <ListingStepperHeader currentStep={1} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
        <div className="mb-5">
          <h1 className="text-xl font-extrabold text-[#0b1f3a]">Create New Auction Listing</h1>
          <p className="text-sm text-[#6c757d]">Set your auction parameters</p>
        </div>

        <Stepper current={1} />

        <form onSubmit={e => { e.preventDefault(); handleNext(); }}>
          <div className="flex flex-col md:grid md:grid-cols-[1fr_280px] gap-5">
            {/* Parameters */}
            <div className="bg-white border border-[#e9ecef] rounded-xl p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-[#fff0f2] flex items-center justify-center flex-shrink-0">
                  <Clock size={18} strokeWidth={1.8} className="text-[#d0021b]" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#0b1f3a]">Auction Parameters</h2>
                  <p className="text-xs text-[#6c757d]">Define timing and pricing for your auction</p>
                </div>
              </div>

              <div className="flex flex-col gap-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="auction-start-date" className={labelCls}>Auction start date <span className="text-[#d0021b]">*</span></label>
                    <div className="relative">
                      <input
                        id="auction-start-date"
                        type="date"
                        className={`${inputCls} pl-10`}
                        min={new Date().toISOString().split('T')[0]}
                        value={draft.startDate}
                        onChange={e => updateDraft({ startDate: e.target.value })}
                      />
                      <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#adb5bd]" aria-hidden="true" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="auction-start-time" className={labelCls}>Start time <span className="text-[#d0021b]">*</span></label>
                    <div className="relative">
                      <input
                        id="auction-start-time"
                        type="time"
                        className={`${inputCls} pl-10`}
                        value={draft.startTime}
                        onChange={e => updateDraft({ startTime: e.target.value })}
                      />
                      <Clock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#adb5bd]" aria-hidden="true" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <span id="duration-label" className={labelCls}>Duration <span className="text-[#d0021b]">*</span></span>
                    <div role="group" aria-labelledby="duration-label" className="flex gap-1.5">
                      {DURATIONS.map(d => (
                        <button
                          key={d}
                          type="button"
                          aria-pressed={draft.duration === d}
                          aria-label={`${d} days`}
                          onClick={() => updateDraft({ duration: d })}
                          className={`flex-1 h-10 rounded-lg font-semibold text-xs border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d0021b] focus-visible:ring-offset-1 ${
                            draft.duration === d
                              ? 'border-[#d0021b] text-[#d0021b] bg-[#fff0f2]'
                              : 'border-[#dee2e6] text-[#6c757d] hover:border-[#d0021b]'
                          }`}
                        >
                          {d}d
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="starting-price" className={labelCls}>Starting price (PKR) <span className="text-[#d0021b]">*</span></label>
                    <input
                      id="starting-price"
                      type="number"
                      inputMode="numeric"
                      className={inputCls}
                      placeholder="e.g. 85000"
                      value={draft.startingPrice || ''}
                      onChange={e => updateDraft({ startingPrice: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="min-increment" className={labelCls}>Minimum bid increment (PKR) <span className="text-[#d0021b]">*</span></label>
                  <input
                    id="min-increment"
                    type="number"
                    inputMode="numeric"
                    className={inputCls}
                    placeholder="e.g. 1000"
                    value={draft.minIncrement || ''}
                    onChange={e => updateDraft({ minIncrement: Number(e.target.value) })}
                  />
                </div>

                {/* Reserve toggle */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-bold text-[#343a40]">Reserve price</p>
                      <p className="text-xs text-[#6c757d]">Auction won't close below this amount</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={draft.hasReserve}
                      aria-label="Enable reserve price"
                      onClick={() => updateDraft({ hasReserve: !draft.hasReserve, reservePrice: 0 })}
                      className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d0021b] focus-visible:ring-offset-1 ${draft.hasReserve ? 'bg-[#d0021b]' : 'bg-[#dee2e6]'}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${draft.hasReserve ? 'left-[22px]' : 'left-0.5'}`} />
                    </button>
                  </div>
                  {draft.hasReserve && (
                    <input
                      id="reserve-price"
                      type="number"
                      inputMode="numeric"
                      aria-label="Reserve price in PKR"
                      className="bg-white border border-[#d0021b] shadow-[0_0_0_3px_rgba(208,2,27,0.08)] h-10 px-3 rounded-lg text-sm text-[#343a40] w-full outline-none"
                      placeholder="e.g. 95000"
                      value={draft.reservePrice || ''}
                      onChange={e => updateDraft({ reservePrice: Number(e.target.value) })}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="bg-white border border-[#e9ecef] rounded-xl p-5 h-fit">
              <h3 className="text-sm font-bold text-[#0b1f3a] mb-4">Auction Preview</h3>
              <div className="bg-[#0b1f3a] rounded-xl h-40 flex items-center justify-center mb-4">
                {draft.category?.includes('Electronics')
                  ? <Smartphone size={52} strokeWidth={1.2} className="text-white/30" />
                  : draft.category?.includes('Vehicles')
                  ? <Car size={52} strokeWidth={1.2} className="text-white/30" />
                  : <Package size={52} strokeWidth={1.2} className="text-white/30" />}
              </div>
              <h4 className="text-sm font-bold text-[#343a40] mb-3 truncate">{draft.title || 'Your Item Title'}</h4>
              <div className="flex flex-col gap-2">
                {[
                  { label: 'Starting bid', value: fmtPrice(draft.startingPrice) || '—', bold: true },
                  { label: 'Duration',     value: `${draft.duration} Days` },
                  { label: 'Starts',       value: draft.startDate ? `${draft.startDate} · ${draft.startTime || '?'}` : '—' },
                  { label: 'Ends',         value: endDate },
                  ...(draft.hasReserve ? [{ label: 'Reserve', value: fmtPrice(draft.reservePrice) || '—', bold: false }] : []),
                ].map(d => (
                  <div key={d.label} className="flex justify-between">
                    <span className="text-xs text-[#6c757d]">{d.label}</span>
                    <span className={`text-xs ${d.bold ? 'font-bold text-[#d0021b]' : 'font-semibold text-[#343a40]'}`}>{d.value}</span>
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
