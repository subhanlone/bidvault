import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Upload, X, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { fetchAllMyListings } from '../../services/myListings';
import { SellerNavbar, Button, ErrorState, Input, Textarea } from '../../components/ui';
import LoadingStatus from '../../components/ui/LoadingStatus';
import type { ItemCondition, CategoryAttributes } from '../../types/api';
import type { ListingCategory } from '../../types';
import { getCategoryFields, validateCategoryFields } from '../../config/categoryFields';

const CATEGORIES: ListingCategory[] = [
  'Electronics & Gadgets', 'Vehicles', 'Clothing & Fashion',
  'Books & Education', 'Home & Furniture', 'Sports & Fitness', 'Art & Collectibles',
];
const CONDITIONS: { value: ItemCondition; label: string }[] = [
  { value: 'NEW', label: 'New' },
  { value: 'LIKE_NEW', label: 'Like New' },
  { value: 'USED', label: 'Used' },
];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

interface FormState {
  title: string;
  category: ListingCategory | '';
  condition: ItemCondition | '';
  description: string;
  startPrice: string;
  reservePrice: string;
  minIncrement: string;
  durationDays: string;
  imageUrl: string;
  attributes: CategoryAttributes;
}

/**
 * A2, Phase 6: a rejected listing previously offered nothing beyond its rejection reason —
 * fixing it meant retyping a brand new submission. One page rather than reusing the 3-step
 * create wizard: the wizard's step-to-step state lives in ListingContext for a fresh draft with
 * no server round trip yet, and threading "editing an existing REJECTED row" through that
 * context would touch all three step screens for a flow this small. Same fields, same
 * validation, same category-attribute config — just PATCH instead of POST at the end.
 */
export default function SellerEditListing() {
  const { listingId } = useParams<{ listingId: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  // A request that failed (worth retrying) as opposed to a listing that is not there or not editable.
  const [loadFailed, setLoadFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [form, setForm] = useState<FormState | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const userId = user?.userId;
  useEffect(() => {
    if (!userId || !listingId) return;
    let cancelled = false;
    (async () => {
      try {
        // No single-listing GET route exists for a seller — /listings/mine is small enough at
        // this project's scale to walk in full, same as SellerMyListings does.
        const all = await fetchAllMyListings();

        const listing = all.find(l => l.listingId === listingId);
        if (!listing) { if (!cancelled) setLoadError('Listing not found.'); return; }
        if (listing.status !== 'REJECTED') {
          if (!cancelled) setLoadError('Only a rejected listing can be edited and resubmitted.');
          return;
        }
        if (!cancelled) {
          setForm({
            title: listing.title,
            category: listing.category as ListingCategory,
            condition: listing.condition,
            description: listing.description,
            startPrice: String(listing.startPrice),
            reservePrice: listing.reservePrice !== undefined ? String(listing.reservePrice) : '',
            minIncrement: String(listing.minIncrement),
            durationDays: String(listing.durationDays),
            imageUrl: listing.imageUrl ?? '',
            attributes: listing.attributes ?? {},
          });
        }
      } catch {
        if (!cancelled) { setLoadError('Could not load this listing. Please try again.'); setLoadFailed(true); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId, listingId, attempt]);

  function retryLoad() {
    setLoadError(null);
    setLoadFailed(false);
    setLoading(true);
    setAttempt(a => a + 1);
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(f => f ? { ...f, [key]: value } : f);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      showToast({ type: 'error', title: 'Invalid File', message: 'Please select an image file (JPG, PNG, WebP).' });
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      showToast({ type: 'error', title: 'File Too Large', message: 'Image must be 5 MB or smaller.' });
      return;
    }
    setUploading(true);
    try {
      const sig = await api.post('/listings/upload-signature');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('signature', sig.signature);
      formData.append('timestamp', String(sig.timestamp));
      formData.append('api_key', sig.apiKey);
      formData.append('folder', sig.folder);
      formData.append('format', sig.format);
      formData.append('public_id', sig.publicId);
      formData.append('allowed_formats', sig.allowedFormats);

      const resp = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, { method: 'POST', body: formData });
      if (!resp.ok) throw new Error('upload failed');
      const data = await resp.json() as { secure_url: string };
      set('imageUrl', data.secure_url);
    } catch {
      showToast({ type: 'error', title: 'Upload Failed', message: 'Could not upload image. Please try again.' });
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form || !listingId) return;

    const nextErrors: Record<string, string> = {};
    const title = form.title.trim();
    if (title.length < 3 || title.length > 150) nextErrors.title = 'Title must be 3–150 characters.';
    if (!form.category) nextErrors.category = 'Category is required.';
    if (!form.condition) nextErrors.condition = 'Condition is required.';
    const description = form.description.trim();
    if (description.length < 10 || description.length > 5000) nextErrors.description = 'Description must be 10–5000 characters.';
    const startPrice = Number(form.startPrice);
    if (!Number.isInteger(startPrice) || startPrice <= 0) nextErrors.startPrice = 'Enter a valid starting price.';
    const minIncrement = Number(form.minIncrement);
    if (!Number.isInteger(minIncrement) || minIncrement <= 0) nextErrors.minIncrement = 'Enter a valid minimum increment.';
    const durationDays = Number(form.durationDays);
    if (!Number.isInteger(durationDays) || durationDays <= 0 || durationDays > 30) nextErrors.durationDays = 'Duration must be 1–30 days.';
    let reservePrice: number | undefined;
    if (form.reservePrice.trim()) {
      reservePrice = Number(form.reservePrice);
      if (!Number.isInteger(reservePrice) || reservePrice <= 0) nextErrors.reservePrice = 'Enter a valid reserve price, or leave it blank.';
    }
    if (form.category) {
      Object.assign(nextErrors, validateCategoryFields(form.category, form.attributes));
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      showToast({ type: 'error', title: 'Missing Fields', message: 'Please fill in the highlighted fields.' });
      return;
    }

    setSubmitting(true);
    try {
      await api.patch(`/listings/${listingId}`, {
        title,
        category: form.category as ListingCategory,
        condition: form.condition as ItemCondition,
        description,
        startPrice,
        reservePrice,
        minIncrement,
        durationDays,
        imageUrl: form.imageUrl || undefined,
        attributes: form.attributes,
      });
      showToast({ type: 'success', title: 'Resubmitted', message: 'Your listing has been resubmitted for review.' });
      navigate('/seller/listings');
    } catch (err: unknown) {
      showToast({ type: 'error', title: 'Could Not Resubmit', message: err instanceof Error ? err.message : 'Please try again.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      <SellerNavbar userName={user?.name} onLogout={logout} />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <button
          onClick={() => navigate('/seller/listings')}
          className="flex items-center gap-1 text-[13px] font-semibold text-muted hover:text-navy mb-4 cursor-pointer"
        >
          <ChevronLeft size={16} /> Back to My Listings
        </button>

        <h1 className="text-xl font-extrabold text-navy mb-1">Edit &amp; Resubmit</h1>
        <p className="text-sm text-muted mb-6">Fix what the admin flagged, then resubmit for another review.</p>

        {loading ? (
          <LoadingStatus label="Loading listing" />
        ) : loadError && loadFailed ? (
          <ErrorState title="Could not load this listing" onRetry={retryLoad} />
        ) : loadError ? (
          <div className="bg-error-bg border border-error-border rounded-md px-4 py-3">
            <p className="text-[13px] text-error font-medium">{loadError}</p>
          </div>
        ) : form ? (
          <form onSubmit={handleSubmit} className="bg-surface border border-border-light rounded-md p-5 sm:p-6 flex flex-col gap-5">
            <Input label="Item Title" required value={form.title} onChange={e => set('title', e.target.value)} error={errors.title} maxLength={150} />

            <div>
              <label className="text-[13px] font-semibold text-body mb-1 block">Category<span className="text-primary ml-0.5">*</span></label>
              <select
                value={form.category}
                onChange={e => set('category', e.target.value as ListingCategory)}
                className={`w-full h-10 px-3 rounded-lg border text-sm bg-surface ${errors.category ? 'border-error' : 'border-border'}`}
              >
                <option value="">Select a category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.category && <p className="text-[12px] text-primary mt-1">{errors.category}</p>}
            </div>

            <div>
              <label className="text-[13px] font-semibold text-body mb-1 block">Condition<span className="text-primary ml-0.5">*</span></label>
              <div className="flex gap-2">
                {CONDITIONS.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => set('condition', c.value)}
                    className={`flex-1 h-10 rounded-lg border text-sm font-semibold cursor-pointer ${form.condition === c.value ? 'border-primary bg-primary/5 text-primary' : 'border-border text-tertiary hover:bg-bg'}`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              {errors.condition && <p className="text-[12px] text-primary mt-1">{errors.condition}</p>}
            </div>

            <Textarea label="Description" required value={form.description} onChange={e => set('description', e.target.value)} error={errors.description} maxLength={5000} />

            {form.category && getCategoryFields(form.category).map(field => (
              <div key={field.key}>
                <label className="text-[13px] font-semibold text-body mb-1 block">
                  {field.label}{field.required && <span className="text-primary ml-0.5">*</span>}
                </label>
                {field.type === 'select' ? (
                  <select
                    value={String(form.attributes[field.key] ?? '')}
                    onChange={e => set('attributes', { ...form.attributes, [field.key]: e.target.value })}
                    className={`w-full h-10 px-3 rounded-lg border text-sm bg-surface ${errors[field.key] ? 'border-error' : 'border-border'}`}
                  >
                    <option value="">Select</option>
                    {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <Input
                    type={field.type === 'number' ? 'number' : 'text'}
                    placeholder={field.placeholder}
                    value={String(form.attributes[field.key] ?? '')}
                    onChange={e => set('attributes', { ...form.attributes, [field.key]: field.type === 'number' ? Number(e.target.value) : e.target.value })}
                    error={errors[field.key]}
                  />
                )}
              </div>
            ))}

            <div className="grid grid-cols-2 gap-4">
              <Input label="Starting Price (PKR)" type="number" required value={form.startPrice} onChange={e => set('startPrice', e.target.value)} error={errors.startPrice} />
              <Input label="Reserve Price (optional)" type="number" value={form.reservePrice} onChange={e => set('reservePrice', e.target.value)} error={errors.reservePrice} />
              <Input label="Min. Bid Increment" type="number" required value={form.minIncrement} onChange={e => set('minIncrement', e.target.value)} error={errors.minIncrement} />
              <Input label="Duration (days)" type="number" required value={form.durationDays} onChange={e => set('durationDays', e.target.value)} error={errors.durationDays} />
            </div>

            <div>
              <label className="text-[13px] font-semibold text-body mb-1 block">Photo</label>
              {form.imageUrl ? (
                <div className="relative w-full h-40 rounded-lg overflow-hidden border border-border-light">
                  <img src={form.imageUrl} alt="Listing" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => set('imageUrl', '')}
                    className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 cursor-pointer"
                    aria-label="Remove photo"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="w-full h-24 border-2 border-dashed border-border-medium rounded-lg flex flex-col items-center justify-center gap-1 text-muted hover:border-primary cursor-pointer disabled:opacity-60"
                >
                  {uploading ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
                  <span className="text-[12px] font-semibold">{uploading ? 'Uploading…' : 'Upload a photo'}</span>
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
            </div>

            <Button type="submit" loading={submitting} disabled={uploading} className="w-full">
              Resubmit for Review
            </Button>
          </form>
        ) : null}
      </main>
    </div>
  );
}
