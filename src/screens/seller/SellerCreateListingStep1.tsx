import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Check, ClipboardList, Camera, Package, Smartphone, Car, Upload } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useListing } from '../../context/ListingContext';
import { useToast } from '../../context/ToastContext';
import { SellerNavbar, Button, Input, Textarea } from '../../components/ui';
import type { ItemCondition } from '../../types';

const STEP_LABELS = ['Item Details', 'Auction Setup', 'Review & Submit'];
const CATEGORIES = [
  'Electronics & Gadgets', 'Vehicles', 'Clothing & Fashion',
  'Books & Education', 'Home & Furniture', 'Sports & Fitness', 'Art & Collectibles',
];
const CONDITIONS: { value: ItemCondition; label: string }[] = [
  { value: 'NEW',      label: 'New'      },
  { value: 'LIKE_NEW', label: 'Like New' },
  { value: 'USED',     label: 'Used'     },
];

export function Stepper({ current }: { current: number }) {
  return (
    <div className="flex items-center mb-6 sm:mb-8">
      {STEP_LABELS.map((s, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <div key={s} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={`flex items-center justify-center rounded-full w-7 h-7 sm:w-8 sm:h-8 border-2 font-bold text-xs sm:text-sm ${
                done   ? 'bg-[#fff0f2] border-[#d0021b]' :
                active ? 'bg-[#d0021b]  border-[#d0021b] text-white' :
                         'bg-white      border-[#e9ecef]  text-[#adb5bd]'
              }`}>
                {done
                  ? <Check size={12} strokeWidth={2.5} className="text-[#d0021b]" />
                  : <span className={active ? 'text-white' : 'text-[#adb5bd]'}>{i + 1}</span>
                }
              </div>
              <span className={`hidden sm:block font-bold text-[10px] sm:text-[11px] mt-1.5 text-center max-w-[70px] leading-tight ${
                active ? 'text-[#d0021b]' : done ? 'text-[#495057]' : 'text-[#adb5bd]'
              }`}>{s}</span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mb-0 sm:mb-5 ${done ? 'bg-[#d0021b]' : 'bg-[#e9ecef]'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ListingStepperHeader({ currentStep }: { currentStep: number }) {
  const { user, logout } = useAuth();
  return (
    <SellerNavbar
      userName={user?.name}
      onLogout={logout}
      links={[
        { label: 'Dashboard',      to: '/seller/dashboard'            },
        { label: 'Create Listing', to: '/seller/create-listing/step-1' },
      ]}
    />
  );
}

export default function SellerCreateListingStep1() {
  const navigate = useNavigate();
  const { draft, updateDraft } = useListing();
  const { showToast } = useToast();

  const handleNext = () => {
    if (!draft.title.trim())       { showToast({ type: 'error', title: 'Missing Title',       message: 'Enter an item title.' });       return; }
    if (!draft.category)           { showToast({ type: 'error', title: 'Missing Category',    message: 'Select a category.' });          return; }
    if (!draft.condition)          { showToast({ type: 'error', title: 'Missing Condition',   message: 'Select item condition.' });      return; }
    if (!draft.description.trim()) { showToast({ type: 'error', title: 'Missing Description', message: 'Add an item description.' });   return; }
    navigate('/seller/create-listing/step-2');
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <ListingStepperHeader currentStep={0} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
        <div className="mb-5">
          <h1 className="text-xl font-extrabold text-[#0b1f3a]">Create New Auction Listing</h1>
          <p className="text-sm text-[#6c757d]">Fill in the details to list your item for auction</p>
        </div>

        <Stepper current={0} />

        <div className="flex flex-col md:grid md:grid-cols-[1fr_300px] gap-5">
          {/* Item info */}
          <div className="bg-white border border-[#e9ecef] rounded-xl p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-[#fff0f2] flex items-center justify-center flex-shrink-0">
                <ClipboardList size={18} strokeWidth={1.8} className="text-[#d0021b]" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#0b1f3a]">Item Information</h2>
                <p className="text-xs text-[#6c757d]">Basic details about your item</p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <Input
                label="Item title"
                placeholder="e.g. Samsung Galaxy S24 Ultra — 256GB"
                value={draft.title}
                onChange={e => updateDraft({ title: e.target.value })}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#343a40]">Category <span className="text-[#d0021b]">*</span></label>
                  <select
                    className="bg-white border border-[#dee2e6] h-10 px-3 rounded-lg text-sm text-[#343a40] w-full outline-none focus:border-[#d0021b] focus:shadow-[0_0_0_3px_rgba(208,2,27,0.08)] transition-shadow appearance-none cursor-pointer"
                    value={draft.category}
                    onChange={e => updateDraft({ category: e.target.value })}
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#343a40]">Condition <span className="text-[#d0021b]">*</span></label>
                  <div className="flex gap-2">
                    {CONDITIONS.map(c => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => updateDraft({ condition: c.value })}
                        className={`flex-1 h-10 rounded-lg font-semibold text-xs border transition-colors cursor-pointer ${
                          draft.condition === c.value
                            ? 'border-[#d0021b] text-[#d0021b] bg-[#fff0f2]'
                            : 'border-[#dee2e6] text-[#6c757d] hover:border-[#d0021b] hover:text-[#d0021b]'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <Textarea
                label="Item description"
                placeholder="Describe your item in detail — condition, specs, accessories included, etc."
                value={draft.description}
                onChange={e => updateDraft({ description: e.target.value })}
                rows={5}
              />
            </div>
          </div>

          {/* Photos */}
          <div className="bg-white border border-[#e9ecef] rounded-xl p-4 sm:p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-[#fff0f2] flex items-center justify-center flex-shrink-0">
                <Camera size={18} strokeWidth={1.8} className="text-[#d0021b]" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#0b1f3a]">Photos</h2>
                <p className="text-xs text-[#6c757d]">Add up to 8 clear photos</p>
              </div>
            </div>

            {draft.hasPhoto ? (
              <>
                <div className="bg-[#0b1f3a] rounded-xl w-full h-40 flex items-center justify-center mb-3">
                  {draft.category?.includes('Electronics')
                    ? <Smartphone size={52} strokeWidth={1.2} className="text-white/30" />
                    : draft.category?.includes('Vehicles')
                    ? <Car size={52} strokeWidth={1.2} className="text-white/30" />
                    : <Package size={52} strokeWidth={1.2} className="text-white/30" />}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-[#1a3356] rounded-lg h-16 flex items-center justify-center">
                    <Package size={22} strokeWidth={1.3} className="text-white/30" />
                  </div>
                  <div className="bg-[#1a3356] rounded-lg h-16 flex items-center justify-center">
                    <Package size={22} strokeWidth={1.3} className="text-white/30" />
                  </div>
                  <label className="border-2 border-dashed border-[#dee2e6] rounded-lg h-16 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-[#d0021b] transition-colors">
                    <Upload size={14} className="text-[#adb5bd]" />
                    <span className="text-[10px] text-[#adb5bd]">Add photo</span>
                  </label>
                </div>
              </>
            ) : (
              <label className="border-2 border-dashed border-[#dee2e6] rounded-xl w-full h-48 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#d0021b] hover:bg-[#fff0f2] transition-colors">
                <Upload size={26} className="text-[#adb5bd]" />
                <p className="text-sm font-semibold text-[#6c757d]">Upload photos</p>
                <p className="text-[11px] text-[#adb5bd]">PNG or JPG · Max 10MB each</p>
                <input type="file" className="hidden" accept=".png,.jpg,.jpeg" multiple onChange={() => updateDraft({ hasPhoto: true })} />
              </label>
            )}
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-5">
          <Link to="/seller/dashboard">
            <Button variant="outline" fullWidth>Cancel</Button>
          </Link>
          <Button variant="primary" onClick={handleNext}>
            Next: Auction Setup →
          </Button>
        </div>
      </main>
    </div>
  );
}
