import { useNavigate } from 'react-router-dom';
import { useListing } from '../../context/ListingContext';
import { useToast } from '../../context/ToastContext';
import { Clock } from 'lucide-react';
import { IconCalendar, IconClock, IconToggle } from '../../components/Icons';
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
    if (!draft.startDate) { showToast({ type: 'error', title: 'Missing Start Date', message: 'Select an auction start date.' }); return; }
    if (!draft.startTime) { showToast({ type: 'error', title: 'Missing Start Time', message: 'Select an auction start time.' }); return; }
    if (draft.startingPrice <= 0) { showToast({ type: 'error', title: 'Missing Price', message: 'Enter a starting price.' }); return; }
    if (draft.hasReserve && draft.reservePrice <= draft.startingPrice) {
      showToast({ type: 'error', title: 'Invalid Reserve', message: 'Reserve price must be higher than starting price.' });
      return;
    }
    navigate('/seller/create-listing/step-3');
  };

  return (
    <div className="min-h-screen bg-white">
      <ListingStepperHeader currentStep={1} />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 py-5 sm:py-8">
        <div className="mb-5 sm:mb-6">
          <h1 className="font-extrabold text-[19px] sm:text-[22px] text-[#0b1f3a]">Create New Auction Listing</h1>
          <p className="text-[13px] text-[#6c757d]">Set your auction parameters</p>
        </div>

        <Stepper current={1} />

        <div className="flex flex-col md:grid md:grid-cols-[1fr_280px] gap-5 sm:gap-6">
          {/* Parameters form */}
          <div className="bg-white border border-[#e9ecef] rounded-[12px] p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="bg-[#fff0f2] flex items-center justify-center rounded-[10px] size-[36px]">
                <Clock size={18} strokeWidth={1.8} className="text-[#d0021b]" />
              </div>
              <div>
                <h2 className="font-bold text-[14px] text-[#0b1f3a]">Auction Parameters</h2>
                <p className="text-[12px] text-[#6c757d]">Define timing and pricing for your auction</p>
              </div>
            </div>

            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-[6px]">
                  <label className="font-bold text-[12px] text-[#343a40]">Auction start date <span className="text-[#d0021b]">*</span></label>
                  <div className="relative">
                    <input
                      type="date"
                      className="bg-white border border-[#dee2e6] h-[48px] pl-[43px] pr-4 rounded-[8px] text-[14px] text-[#343a40] w-full outline-none focus:border-[#d0021b]"
                      min={new Date().toISOString().split('T')[0]}
                      value={draft.startDate}
                      onChange={e => updateDraft({ startDate: e.target.value })}
                    />
                    <span className="absolute left-[14px] top-[15px]"><IconCalendar /></span>
                  </div>
                </div>
                <div className="flex flex-col gap-[6px]">
                  <label className="font-bold text-[12px] text-[#343a40]">Start time <span className="text-[#d0021b]">*</span></label>
                  <div className="relative">
                    <input
                      type="time"
                      className="bg-white border border-[#dee2e6] h-[48px] pl-[43px] pr-4 rounded-[8px] text-[14px] text-[#343a40] w-full outline-none focus:border-[#d0021b]"
                      value={draft.startTime}
                      onChange={e => updateDraft({ startTime: e.target.value })}
                    />
                    <span className="absolute left-[14px] top-[15px]"><IconClock /></span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-[6px]">
                  <label className="font-bold text-[12px] text-[#343a40]">Auction duration <span className="text-[#d0021b]">*</span></label>
                  <div className="flex gap-2">
                    {DURATIONS.map(d => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => updateDraft({ duration: d })}
                        className={`flex-1 h-[48px] rounded-[8px] font-semibold text-[13px] border transition-colors ${draft.duration === d ? 'border-[#d0021b] text-[#d0021b] bg-[#fff0f2]' : 'border-[#dee2e6] text-[#6c757d] hover:border-[#d0021b]'}`}
                      >
                        {d}d
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-[6px]">
                  <label className="font-bold text-[12px] text-[#343a40]">Starting price (PKR) <span className="text-[#d0021b]">*</span></label>
                  <input
                    type="number"
                    className="bg-white border border-[#dee2e6] h-[48px] px-4 rounded-[8px] text-[14px] text-[#343a40] w-full outline-none focus:border-[#d0021b]"
                    placeholder="e.g. 85000"
                    value={draft.startingPrice || ''}
                    onChange={e => updateDraft({ startingPrice: Number(e.target.value), finalStartingPrice: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-[6px]">
                <label className="font-bold text-[12px] text-[#343a40]">Minimum bid increment (PKR) <span className="text-[#d0021b]">*</span></label>
                <input
                  type="number"
                  className="bg-white border border-[#dee2e6] h-[48px] px-4 rounded-[8px] text-[14px] text-[#343a40] w-full outline-none focus:border-[#d0021b]"
                  placeholder="e.g. 1000"
                  value={draft.minIncrement || ''}
                  onChange={e => updateDraft({ minIncrement: Number(e.target.value) })}
                />
              </div>

              {/* Reserve price toggle */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-bold text-[13px] text-[#343a40]">Reserve price</p>
                    <p className="text-[11px] text-[#6c757d]">Auction won't close below this amount</p>
                  </div>
                  <button type="button" onClick={() => updateDraft({ hasReserve: !draft.hasReserve, reservePrice: 0 })}>
                    <IconToggle className={draft.hasReserve ? 'opacity-100' : 'opacity-40'} />
                  </button>
                </div>
                {draft.hasReserve && (
                  <input
                    type="number"
                    className="bg-white border border-[#d0021b] shadow-[0px_0px_0px_3px_rgba(208,2,27,0.08)] h-[48px] px-4 rounded-[8px] text-[14px] text-[#343a40] w-full outline-none"
                    placeholder="e.g. 95000"
                    value={draft.reservePrice || ''}
                    onChange={e => updateDraft({ reservePrice: Number(e.target.value) })}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-white border border-[#e9ecef] rounded-[12px] p-5 h-fit">
            <h3 className="font-bold text-[14px] text-[#0b1f3a] mb-4">Auction Preview</h3>
            <div className="bg-[#0b1f3a] rounded-[10px] h-[160px] flex items-center justify-center text-[60px] mb-4">
              {draft.category?.includes('Electronics') ? '📱' : draft.category?.includes('Vehicles') ? '🚗' : '📦'}
            </div>
            <h4 className="font-bold text-[13px] text-[#343a40] mb-3 truncate">{draft.title || 'Your Item Title'}</h4>
            <div className="flex flex-col gap-2">
              {[
                { label: 'Starting bid', value: fmtPrice(draft.startingPrice) || '—', bold: true },
                { label: 'Duration', value: `${draft.duration} Days` },
                { label: 'Starts', value: draft.startDate ? `${draft.startDate} · ${draft.startTime || '?'}` : '—' },
                { label: 'Ends', value: endDate },
                ...(draft.hasReserve ? [{ label: 'Reserve', value: fmtPrice(draft.reservePrice) || '—' }] : []),
              ].map(d => (
                <div key={d.label} className="flex justify-between">
                  <span className="text-[12px] text-[#6c757d]">{d.label}</span>
                  <span className={`text-[12px] ${d.bold ? 'font-bold text-[#d0021b]' : 'font-semibold text-[#343a40]'}`}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-between mt-5 sm:mt-6">
          <button onClick={() => navigate('/seller/create-listing/step-1')} className="border border-[#dee2e6] font-semibold text-[14px] text-[#495057] px-5 sm:px-6 py-3 rounded-[8px] hover:bg-[#f8f9fa]">← Back</button>
          <button onClick={handleNext} className="bg-[#d0021b] font-bold text-[14px] text-white px-5 sm:px-6 py-3 rounded-[8px] hover:bg-[#a80016] transition-colors">
            Next: AI Pricing →
          </button>
        </div>
      </div>
    </div>
  );
}
