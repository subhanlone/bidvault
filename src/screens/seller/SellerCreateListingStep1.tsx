import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ClipboardList, Camera, Package, Smartphone, Car, Upload, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useListing } from '../../context/ListingContext';
import { useToast } from '../../context/ToastContext';
import { SellerNavbar, Button, Input, Textarea } from '../../components/ui';
import StepProgress from '../../components/ui/StepProgress';
import type { ItemCondition } from '../../types';

const CATEGORIES = [
  'Electronics & Gadgets', 'Vehicles', 'Clothing & Fashion',
  'Books & Education', 'Home & Furniture', 'Sports & Fitness', 'Art & Collectibles',
];
const CONDITIONS: { value: ItemCondition; label: string }[] = [
  { value: 'NEW',      label: 'New'      },
  { value: 'LIKE_NEW', label: 'Like New' },
  { value: 'USED',     label: 'Used'     },
];

export function ListingStepperHeader({ currentStep }: { currentStep: number }) {
  const { user, logout } = useAuth();
  void currentStep;
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
  const [titleError, setTitleError] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [conditionError, setConditionError] = useState('');
  const [descriptionError, setDescriptionError] = useState('');

  const handleNext = () => {
    setTitleError('');
    setCategoryError('');
    setConditionError('');
    setDescriptionError('');

    let invalidCount = 0;
    if (!draft.title.trim())       { setTitleError('Item title is required'); invalidCount += 1; }
    if (!draft.category)           { setCategoryError('Category is required'); invalidCount += 1; }
    if (!draft.condition)          { setConditionError('Condition is required'); invalidCount += 1; }
    if (!draft.description.trim()) { setDescriptionError('Description is required'); invalidCount += 1; }

    if (invalidCount > 1) {
      showToast({ type: 'error', title: 'Missing Fields', message: 'Please fill in the highlighted fields.' });
    }
    if (invalidCount > 0) return;
    navigate('/seller/create-listing/step-2');
  };

  return (
    <div className="min-h-screen bg-bg">
      <ListingStepperHeader currentStep={0} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
        <div className="mb-5">
          <h1 className="text-xl font-extrabold text-navy">Create New Auction Listing</h1>
          <p className="text-sm text-muted">Fill in the details to list your item for auction</p>
        </div>

        <StepProgress
          steps={[
            { label: 'Item Details' },
            { label: 'Auction Setup' },
            { label: 'Review & Submit' },
          ]}
          currentStep={1}
        />

        <div className="flex flex-col md:grid md:grid-cols-[1fr_300px] gap-5">
          {/* Item info */}
          <div className="bg-surface border border-border-light rounded-md p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-md bg-primary-surface flex items-center justify-center flex-shrink-0">
                <ClipboardList size={18} strokeWidth={1.8} className="text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-navy">Item Information</h2>
                <p className="text-xs text-muted">Basic details about your item</p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <Input
                label="Item title"
                placeholder="e.g. Samsung Galaxy S24 Ultra — 256GB"
                value={draft.title}
                onChange={e => {
                  updateDraft({ title: e.target.value });
                  setTitleError('');
                }}
                error={titleError}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="listing-category" className="text-xs font-bold text-secondary">Category <span className="text-primary">*</span></label>
                  <div className="relative">
                    <select
                      id="listing-category"
                      className={`bg-surface border h-10 px-3 pr-9 rounded-lg text-sm text-secondary w-full outline-none focus-visible:ring-2 focus-visible:ring-primary transition-shadow appearance-none cursor-pointer ${categoryError ? 'border-error' : 'border-border'}`}
                      value={draft.category}
                      onChange={e => {
                        updateDraft({ category: e.target.value });
                        setCategoryError('');
                      }}
                    >
                      <option value="">Select category</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown size={16} aria-hidden="true" className="absolute right-3 top-1/2 -translate-y-1/2 text-placeholder" />
                  </div>
                  {categoryError && <p className="text-[12px] text-primary" role="alert">{categoryError}</p>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <span id="condition-label" className="text-xs font-bold text-secondary">Condition <span className="text-primary">*</span></span>
                  <div role="group" aria-labelledby="condition-label" className="flex gap-2">
                    {CONDITIONS.map(c => (
                      <button
                        key={c.value}
                        type="button"
                        aria-pressed={draft.condition === c.value}
                        onClick={() => {
                          updateDraft({ condition: c.value });
                          setConditionError('');
                        }}
                        className={`flex-1 h-10 rounded-lg font-semibold text-xs border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${
                          draft.condition === c.value
                            ? 'bg-primary text-white border-primary'
                            : 'bg-surface border-border text-body hover:border-primary'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                  {conditionError && <p className="text-[12px] text-primary" role="alert">{conditionError}</p>}
                </div>
              </div>

              <Textarea
                label="Item description"
                placeholder="Describe your item in detail — condition, specs, accessories included, etc."
                value={draft.description}
                onChange={e => {
                  updateDraft({ description: e.target.value });
                  setDescriptionError('');
                }}
                error={descriptionError}
                rows={5}
              />
            </div>
          </div>

          {/* Photos */}
          <div className="bg-surface border border-border-light rounded-md p-4 sm:p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-md bg-primary-surface flex items-center justify-center flex-shrink-0">
                <Camera size={18} strokeWidth={1.8} className="text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-navy">Photos</h2>
                <p className="text-xs text-muted">Add up to 8 clear photos</p>
              </div>
            </div>

            {draft.hasPhoto ? (
              <>
                <div className="bg-navy rounded-md w-full h-40 flex items-center justify-center mb-3">
                  {draft.category?.includes('Electronics')
                    ? <Smartphone size={52} strokeWidth={1.2} className="text-white/30" aria-hidden="true" />
                    : draft.category?.includes('Vehicles')
                    ? <Car size={52} strokeWidth={1.2} className="text-white/30" aria-hidden="true" />
                    : <Package size={52} strokeWidth={1.2} className="text-white/30" aria-hidden="true" />}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-navy-mid rounded-lg h-16 flex items-center justify-center">
                    <Package size={22} strokeWidth={1.3} className="text-white/30" aria-hidden="true" />
                  </div>
                  <div className="bg-navy-mid rounded-lg h-16 flex items-center justify-center">
                    <Package size={22} strokeWidth={1.3} className="text-white/30" aria-hidden="true" />
                  </div>
                  <label className="border-2 border-dashed border-border-medium rounded-lg h-16 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-primary transition-colors">
                    <Upload size={14} className="text-placeholder" aria-hidden="true" />
                    <span className="text-[10px] text-placeholder">Add photo</span>
                  </label>
                </div>
              </>
            ) : (
              <label className="border-2 border-dashed border-border-medium rounded-md w-full h-48 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary hover:bg-primary-surface transition-colors">
                <Upload size={26} className="text-placeholder" aria-hidden="true" />
                <p className="text-sm font-semibold text-muted">Upload photos</p>
                <p className="text-[11px] text-placeholder">PNG or JPG · Max 10MB each</p>
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
