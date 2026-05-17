import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useListing } from '../../context/ListingContext';
import { useToast } from '../../context/ToastContext';
import { Camera, Car, Check, ClipboardList, Menu, Package, Smartphone, X } from 'lucide-react';
import { IconBidVaultLogo, IconUpload } from '../../components/Icons';
import type { ItemCondition } from '../../types';

const STEP_LABELS = ['Item Details', 'Auction Setup', 'AI Pricing', 'Review & Submit'];
const CATEGORIES = ['Electronics & Gadgets', 'Vehicles', 'Clothing & Fashion', 'Books & Education', 'Home & Furniture', 'Sports & Fitness', 'Art & Collectibles'];
const CONDITIONS: { value: ItemCondition; label: string }[] = [
  { value: 'NEW', label: 'New' },
  { value: 'LIKE_NEW', label: 'Like New' },
  { value: 'USED', label: 'Used' },
];

function ListingStepperHeader({ currentStep }: { currentStep: number }) {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  return (
    <header className="bg-[#0b1f3a] sticky top-0 z-30 shadow-[0_2px_12px_rgba(0,0,0,0.18)]">
      <div className="flex items-center justify-between px-4 sm:px-8 h-[60px]">
        <div className="flex items-center gap-4 md:gap-8">
          <div className="flex gap-[10px] items-center">
            <div className="bg-[#d0021b] flex items-center justify-center rounded-[8px] size-[34px]">
              <IconBidVaultLogo className="size-[18px]" />
            </div>
            <span className="font-extrabold text-[20px] text-white tracking-[-0.3px]">
              Bid<span className="text-[#d0021b]">Vault</span>
            </span>
          </div>
          <nav className="hidden md:flex gap-6">
            <Link to="/seller/dashboard" className="font-semibold text-[13px] text-[rgba(255,255,255,0.55)] hover:text-white transition-colors">Dashboard</Link>
            <Link to="/seller/create-listing/step-1" className="font-semibold text-[13px] text-white border-b-2 border-white pb-1">Create Listing</Link>
          </nav>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <span className="bg-[#1a7a4a] border border-[#1a7a4a] font-bold text-[11px] text-white px-3 py-1 rounded-[99px]">Verified Seller</span>
          <div className="bg-[rgba(255,255,255,0.1)] rounded-full size-[34px] flex items-center justify-center">
            <span className="font-bold text-[13px] text-white">{user?.name?.[0] ?? 'S'}</span>
          </div>
          <span className="font-semibold text-[13px] text-white">{user?.name ?? 'Seller'}</span>
          <button onClick={logout} className="font-semibold text-[12px] text-[rgba(255,255,255,0.55)] hover:text-white ml-2 transition-colors">Logout</button>
        </div>
        <button className="md:hidden p-2 rounded-[6px] hover:bg-[rgba(255,255,255,0.08)]" onClick={() => setMobileMenuOpen(o => !o)}>
          {mobileMenuOpen ? <X size={20} className="text-white" /> : <Menu size={20} className="text-white" />}
        </button>
      </div>
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0d2545] border-t border-[rgba(255,255,255,0.08)] px-4 py-4 flex flex-col gap-1">
          <Link to="/seller/dashboard" onClick={() => setMobileMenuOpen(false)} className="font-semibold text-[14px] text-[rgba(255,255,255,0.7)] py-2 hover:text-white">Dashboard</Link>
          <span className="font-semibold text-[14px] text-white py-2">Create Listing (Step {currentStep + 1})</span>
          <div className="flex items-center justify-between pt-3 mt-1 border-t border-[rgba(255,255,255,0.08)]">
            <span className="font-semibold text-[13px] text-white">{user?.name ?? 'Seller'}</span>
            <button onClick={logout} className="font-semibold text-[12px] text-[#d0021b]">Logout</button>
          </div>
        </div>
      )}
    </header>
  );
}

export { ListingStepperHeader };

function Stepper({ current }: { current: number }) {
  return (
    <div className="flex items-center mb-6 sm:mb-8">
      {STEP_LABELS.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={s} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={`flex items-center justify-center rounded-full size-[28px] sm:size-[32px] border-2 font-bold text-[12px] sm:text-[13px] ${done ? 'bg-[#fff0f2] border-[#d0021b]' : active ? 'bg-[#d0021b] border-[#d0021b] text-white' : 'bg-white border-[#e9ecef] text-[#adb5bd]'}`}>
                {done
                  ? <Check size={12} strokeWidth={2.5} className="text-[#d0021b]" />
                  : <span className={active ? 'text-white' : 'text-[#adb5bd]'}>{i + 1}</span>
                }
              </div>
              <span className={`hidden sm:block font-bold text-[10px] sm:text-[11px] mt-2 text-center max-w-[70px] leading-tight ${active ? 'text-[#d0021b]' : done ? 'text-[#495057]' : 'text-[#adb5bd]'}`}>{s}</span>
            </div>
            {i < STEP_LABELS.length - 1 && <div className={`flex-1 h-[2px] mx-2 mb-0 sm:mb-5 ${done ? 'bg-[#d0021b]' : 'bg-[#e9ecef]'}`} />}
          </div>
        );
      })}
    </div>
  );
}

export { Stepper };

export default function SellerCreateListingStep1() {
  const navigate = useNavigate();
  const { draft, updateDraft } = useListing();
  const { showToast } = useToast();

  const handleNext = () => {
    if (!draft.title.trim()) { showToast({ type: 'error', title: 'Missing Title', message: 'Enter an item title.' }); return; }
    if (!draft.category) { showToast({ type: 'error', title: 'Missing Category', message: 'Select a category.' }); return; }
    if (!draft.condition) { showToast({ type: 'error', title: 'Missing Condition', message: 'Select item condition.' }); return; }
    if (!draft.description.trim()) { showToast({ type: 'error', title: 'Missing Description', message: 'Add an item description.' }); return; }
    navigate('/seller/create-listing/step-2');
  };

  return (
    <div className="min-h-screen bg-white">
      <ListingStepperHeader currentStep={0} />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 py-5 sm:py-8">
        <div className="mb-5 sm:mb-6">
          <h1 className="font-extrabold text-[19px] sm:text-[22px] text-[#0b1f3a]">Create New Auction Listing</h1>
          <p className="text-[13px] text-[#6c757d]">Fill in the details to list your item for auction</p>
        </div>

        <Stepper current={0} />

        <div className="flex flex-col md:grid md:grid-cols-[1fr_300px] gap-5 sm:gap-6">
          {/* Form */}
          <div className="bg-white border border-[#e9ecef] rounded-[12px] p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="bg-[#fff0f2] flex items-center justify-center rounded-[10px] size-[36px]">
                <ClipboardList size={18} strokeWidth={1.8} className="text-[#d0021b]" />
              </div>
              <div>
                <h2 className="font-bold text-[14px] text-[#0b1f3a]">Item Information</h2>
                <p className="text-[12px] text-[#6c757d]">Basic details about your item</p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-[6px]">
                <label className="font-bold text-[12px] text-[#343a40]">Item title <span className="text-[#d0021b]">*</span></label>
                <input
                  className="bg-white border border-[#dee2e6] h-[48px] px-4 rounded-[8px] text-[14px] text-[#343a40] w-full outline-none focus:border-[#d0021b] focus:shadow-[0px_0px_0px_3px_rgba(208,2,27,0.08)] transition-shadow"
                  placeholder="e.g. Samsung Galaxy S24 Ultra — 256GB"
                  value={draft.title}
                  onChange={e => updateDraft({ title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-[6px]">
                  <label className="font-bold text-[12px] text-[#343a40]">Category <span className="text-[#d0021b]">*</span></label>
                  <select
                    className="bg-white border border-[#dee2e6] h-[48px] px-4 rounded-[8px] text-[14px] text-[#343a40] w-full outline-none focus:border-[#d0021b] focus:shadow-[0_0_0_3px_rgba(208,2,27,0.08)] transition-shadow appearance-none"
                    value={draft.category}
                    onChange={e => updateDraft({ category: e.target.value })}
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-[6px]">
                  <label className="font-bold text-[12px] text-[#343a40]">Condition <span className="text-[#d0021b]">*</span></label>
                  <div className="flex gap-2">
                    {CONDITIONS.map(c => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => updateDraft({ condition: c.value })}
                        className={`flex-1 h-[48px] rounded-[8px] font-semibold text-[12px] sm:text-[13px] border transition-colors ${draft.condition === c.value ? 'border-[#d0021b] text-[#d0021b] bg-[#fff0f2]' : 'border-[#dee2e6] text-[#6c757d] hover:border-[#d0021b] hover:text-[#d0021b]'}`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-[6px]">
                <label className="font-bold text-[12px] text-[#343a40]">Item description <span className="text-[#d0021b]">*</span></label>
                <textarea
                  className="bg-white border border-[#dee2e6] px-4 py-3 rounded-[8px] text-[13px] text-[#495057] w-full h-[120px] resize-none outline-none focus:border-[#d0021b] focus:shadow-[0_0_0_3px_rgba(208,2,27,0.08)] transition-shadow leading-[20px]"
                  placeholder="Describe your item in detail — condition, specs, accessories included, etc."
                  value={draft.description}
                  onChange={e => updateDraft({ description: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Photos */}
          <div className="bg-white border border-[#e9ecef] rounded-[12px] p-4 sm:p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-[#fff0f2] flex items-center justify-center rounded-[10px] size-[36px]">
                <Camera size={18} strokeWidth={1.8} className="text-[#d0021b]" />
              </div>
              <div>
                <h2 className="font-bold text-[14px] text-[#0b1f3a]">Photos</h2>
                <p className="text-[12px] text-[#6c757d]">Add up to 8 clear photos</p>
              </div>
            </div>

            {draft.hasPhoto ? (
              <>
                <div className="bg-[#0b1f3a] rounded-[10px] w-full h-[160px] flex items-center justify-center mb-3">
                  {draft.category?.includes('Electronics')
                    ? <Smartphone size={56} strokeWidth={1.2} className="text-[rgba(255,255,255,0.35)]" />
                    : draft.category?.includes('Vehicles')
                    ? <Car size={56} strokeWidth={1.2} className="text-[rgba(255,255,255,0.35)]" />
                    : <Package size={56} strokeWidth={1.2} className="text-[rgba(255,255,255,0.35)]" />}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-[#1a3356] rounded-[8px] h-[64px] flex items-center justify-center"><Package size={24} strokeWidth={1.3} className="text-[rgba(255,255,255,0.3)]" /></div>
                  <div className="bg-[#1a3356] rounded-[8px] h-[64px] flex items-center justify-center"><Package size={24} strokeWidth={1.3} className="text-[rgba(255,255,255,0.3)]" /></div>
                  <label className="border-2 border-dashed border-[#dee2e6] rounded-[8px] h-[64px] flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-[#d0021b]">
                    <IconUpload className="size-[16px]" color="#adb5bd" />
                    <span className="text-[10px] text-[#adb5bd]">Add photo</span>
                  </label>
                </div>
              </>
            ) : (
              <label className="border-2 border-dashed border-[#dee2e6] rounded-[10px] w-full h-[180px] sm:h-[200px] flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#d0021b] hover:bg-[#fff0f2] transition-colors">
                <IconUpload className="size-[28px]" color="#adb5bd" />
                <p className="font-semibold text-[13px] text-[#6c757d]">Upload photos</p>
                <p className="text-[11px] text-[#adb5bd]">PNG or JPG · Max 10MB each</p>
                <input type="file" className="hidden" accept=".png,.jpg,.jpeg" multiple onChange={() => updateDraft({ hasPhoto: true })} />
              </label>
            )}
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-5 sm:mt-6">
          <Link to="/seller/verification-status" className="border border-[#dee2e6] font-semibold text-[14px] text-[#495057] px-6 py-3 rounded-[8px] hover:bg-[#f8f9fa] text-center">Cancel</Link>
          <button onClick={handleNext} className="bg-[#d0021b] font-bold text-[14px] text-white px-6 py-3 rounded-[8px] hover:bg-[#a80016] transition-colors">
            Next: Auction Setup →
          </button>
        </div>
      </div>
    </div>
  );
}
