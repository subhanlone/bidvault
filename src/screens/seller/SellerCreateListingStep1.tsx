import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ClipboardList, Camera, ChevronDown, Upload, Loader2, X, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useListing } from '../../context/ListingContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { SellerNavbar, Button, Input, Textarea } from '../../components/ui';
import StepProgress from '../../components/ui/StepProgress';
import type { ItemCondition } from '../../types';

interface UploadSignature {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
}

const CATEGORIES = [
  'Electronics & Gadgets', 'Vehicles', 'Clothing & Fashion',
  'Books & Education', 'Home & Furniture', 'Sports & Fitness', 'Art & Collectibles',
];
const CONDITIONS: { value: ItemCondition; label: string }[] = [
  { value: 'NEW',      label: 'New'      },
  { value: 'LIKE_NEW', label: 'Like New' },
  { value: 'USED',     label: 'Used'     },
];

export function ListingStepperHeader() {
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

type UploadState = 'idle' | 'uploading' | 'done' | 'error';

export default function SellerCreateListingStep1() {
  const navigate = useNavigate();
  const { draft, updateDraft } = useListing();
  const { showToast } = useToast();
  const [titleError, setTitleError] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [conditionError, setConditionError] = useState('');
  const [descriptionError, setDescriptionError] = useState('');
  const [uploadState, setUploadState] = useState<UploadState>(draft.imageUrl ? 'done' : 'idle');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ''; // allow re-selecting the same file

    if (!file.type.startsWith('image/')) {
      showToast({ type: 'error', title: 'Invalid File', message: 'Please select an image file (JPG, PNG, WebP).' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast({ type: 'error', title: 'File Too Large', message: 'Image must be under 10 MB.' });
      return;
    }

    setUploadState('uploading');
    try {
      const sig = await api.post<UploadSignature>('/listings/upload-signature');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('signature', sig.signature);
      formData.append('timestamp', String(sig.timestamp));
      formData.append('api_key', sig.apiKey);
      formData.append('folder', sig.folder);

      const resp = await fetch(
        `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
        { method: 'POST', body: formData },
      );
      if (!resp.ok) throw new Error('upload failed');

      const data = await resp.json() as { secure_url: string };
      updateDraft({ imageUrl: data.secure_url });
      setUploadState('done');
    } catch {
      setUploadState('error');
      showToast({ type: 'error', title: 'Upload Failed', message: 'Could not upload image. Please try again.' });
    }
  };

  const handleRemoveImage = () => {
    updateDraft({ imageUrl: '' });
    setUploadState('idle');
  };

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
      <ListingStepperHeader />

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

          {/* Image Upload */}
          <div className="bg-surface border border-border-light rounded-md p-4 sm:p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-md bg-primary-surface flex items-center justify-center flex-shrink-0">
                <Camera size={18} strokeWidth={1.8} className="text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-navy">Item Image</h2>
                <p className="text-xs text-muted">Upload a photo of your item (optional)</p>
              </div>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleFileChange}
            />

            {uploadState === 'idle' && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-border rounded-md p-6 flex flex-col items-center gap-2 hover:border-primary hover:bg-primary-surface/30 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Upload size={22} strokeWidth={1.5} className="text-placeholder" />
                <p className="text-sm font-semibold text-secondary">Click to upload an image</p>
                <p className="text-xs text-placeholder">JPG, PNG, WebP · Max 10 MB</p>
              </button>
            )}

            {uploadState === 'uploading' && (
              <div className="w-full border-2 border-dashed border-primary/40 rounded-md p-6 flex flex-col items-center gap-2">
                <Loader2 size={22} className="text-primary animate-spin" />
                <p className="text-sm font-semibold text-primary">Uploading to Cloudinary…</p>
              </div>
            )}

            {uploadState === 'done' && draft.imageUrl && (
              <div>
                <div className="rounded-md overflow-hidden bg-navy h-44 relative">
                  <img
                    src={draft.imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 bg-[rgba(0,0,0,0.55)] hover:bg-[rgba(0,0,0,0.75)] rounded-full p-1 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    aria-label="Remove image"
                  >
                    <X size={14} className="text-white" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="mt-2 flex items-center gap-1.5 text-xs font-bold text-primary hover:underline cursor-pointer focus-visible:outline-none"
                >
                  <RefreshCw size={11} /> Change image
                </button>
              </div>
            )}

            {uploadState === 'error' && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-error rounded-md p-6 flex flex-col items-center gap-2 hover:bg-error-bg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error"
              >
                <Upload size={22} strokeWidth={1.5} className="text-error" />
                <p className="text-sm font-semibold text-error">Upload failed — click to retry</p>
                <p className="text-xs text-placeholder">JPG, PNG, WebP · Max 10 MB</p>
              </button>
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
