import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, Car, Package, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useListing } from '../../context/ListingContext';
import { useToast } from '../../context/ToastContext';
import { api, ApiError } from '../../services/api';
import { Button } from '../../components/ui';
import StepProgress from '../../components/ui/StepProgress';
import { ListingStepperHeader } from './SellerCreateListingStep1';
import { getCategoryFields, validateCategoryFields } from '../../config/categoryFields';

export default function SellerCreateListingStep3() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { draft, setSubmittedListingId } = useListing();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fmtPKR = (n: number) => n > 0 ? `PKR ${n.toLocaleString()}` : '—';

  const handleSubmit = async () => {
    if (!user) return;

    const title = draft.title.trim();
    const description = draft.description.trim();

    if (title.length < 3) {
      showToast({ type: 'error', title: 'Missing Info', message: 'Please go back and enter a valid item title (at least 3 characters).' });
      return;
    }
    if (description.length < 10) {
      showToast({ type: 'error', title: 'Missing Info', message: 'Please go back and enter a more detailed description (at least 10 characters).' });
      return;
    }
    if (draft.startingPrice <= 0) {
      showToast({ type: 'error', title: 'Missing Info', message: 'Please go back and set a valid starting price.' });
      return;
    }
    const attrErrors = validateCategoryFields(draft.category, draft.attributes);
    if (Object.keys(attrErrors).length > 0) {
      showToast({ type: 'error', title: 'Missing Info', message: 'Please go back and fill in the required category details.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await api.post<{ listingId: string }>('/listings', {
        title,
        category: draft.category,
        condition: draft.condition,
        description,
        durationDays: draft.duration,
        startPrice: draft.startingPrice,
        minIncrement: draft.minIncrement,
        reservePrice: draft.hasReserve ? draft.reservePrice : undefined,
        imageUrl: draft.imageUrl || undefined,
        attributes: draft.attributes,
      });
      setSubmittedListingId(data.listingId);
      showToast({ type: 'success', title: 'Listing Submitted!', message: 'Your listing is under admin review.' });
      navigate('/seller/listing-submitted');
    } catch (err) {
      showToast({ type: 'error', title: 'Submission Failed', message: err instanceof ApiError ? err.message : 'Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const conditionLabel = draft.condition === 'NEW' ? 'New' : draft.condition === 'LIKE_NEW' ? 'Like New' : draft.condition === 'USED' ? 'Used' : '—';

  return (
    <div className="min-h-screen bg-bg">
      <ListingStepperHeader />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
        <h1 className="text-xl font-extrabold text-navy mb-1">Review Your Listing</h1>
        <p className="text-sm text-muted mb-5">Check all details before submitting to admin for review.</p>

        <StepProgress
          steps={[
            { label: 'Item Details' },
            { label: 'Auction Setup' },
            { label: 'Review & Submit' },
          ]}
          currentStep={3}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {/* Item details */}
          <div className="bg-surface border border-border-light rounded-md overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-light">
              <h3 className="text-sm font-bold text-navy">Item Details</h3>
              <button onClick={() => navigate('/seller/create-listing/step-1')} className="text-xs font-bold text-primary hover:underline cursor-pointer">Edit</button>
            </div>
            <div className="p-5">
              <div className="bg-navy rounded-md h-40 flex items-center justify-center mb-4 overflow-hidden">
                {draft.imageUrl
                  ? <img src={draft.imageUrl} alt={draft.title} className="w-full h-full object-cover" />
                  : draft.category?.includes('Electronics')
                  ? <Smartphone size={52} strokeWidth={1.2} className="text-white/40" aria-hidden="true" />
                  : draft.category?.includes('Vehicles')
                  ? <Car size={52} strokeWidth={1.2} className="text-white/40" aria-hidden="true" />
                  : <Package size={52} strokeWidth={1.2} className="text-white/40" aria-hidden="true" />}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'TITLE',     value: draft.title || '—' },
                  { label: 'CATEGORY',  value: draft.category?.split('&')[0].trim() || '—' },
                  { label: 'CONDITION', value: conditionLabel },
                  { label: 'IMAGE',     value: draft.imageUrl ? 'Image uploaded' : 'No image' },
                ].map(d => (
                  <div key={d.label} className="bg-bg rounded-lg px-3 py-3">
                    <p className="text-[10px] text-placeholder font-bold tracking-wide uppercase">{d.label}</p>
                    <p className="text-sm font-semibold text-secondary mt-0.5 truncate">{d.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Auction parameters */}
          <div className="bg-surface border border-border-light rounded-md overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-light">
              <h3 className="text-sm font-bold text-navy">Auction Parameters</h3>
              <button onClick={() => navigate('/seller/create-listing/step-2')} className="text-xs font-bold text-primary hover:underline cursor-pointer">Edit</button>
            </div>
            <div className="p-5 grid grid-cols-2 gap-3">
              {[
                { label: 'STARTING PRICE', value: fmtPKR(draft.startingPrice), red: true },
                { label: 'MIN INCREMENT',  value: fmtPKR(draft.minIncrement)  },
                { label: 'STARTS',         value: 'On admin approval'         },
                { label: 'DURATION',       value: `${draft.duration} Days`    },
                ...(draft.hasReserve ? [{ label: 'RESERVE PRICE', value: fmtPKR(draft.reservePrice), red: false }] : []),
              ].map(d => (
                <div key={d.label} className="bg-bg rounded-lg px-3 py-3">
                  <p className="text-[10px] text-placeholder font-bold tracking-wide uppercase">{d.label}</p>
                  <p className={`text-sm font-bold mt-0.5 ${d.red ? 'text-primary' : 'text-secondary'}`}>{d.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Category-specific details */}
          {draft.category && getCategoryFields(draft.category).length > 0 && (
            <div className="bg-surface border border-border-light rounded-md overflow-hidden sm:col-span-2">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border-light">
                <h3 className="text-sm font-bold text-navy">Category Details</h3>
                <button onClick={() => navigate('/seller/create-listing/step-1')} className="text-xs font-bold text-primary hover:underline cursor-pointer">Edit</button>
              </div>
              <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {getCategoryFields(draft.category).map(field => {
                  const value = draft.attributes[field.key];
                  const display = value === undefined || value === '' ? '—' : String(value);
                  return (
                    <div key={field.key} className="bg-bg rounded-lg px-3 py-3">
                      <p className="text-[10px] text-placeholder font-bold tracking-wide uppercase">{field.label}</p>
                      <p className="text-sm font-semibold text-secondary mt-0.5 truncate">{display}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2.5 items-start bg-info-surface border border-info-border-strong rounded-lg px-4 py-3 mt-5">
          <Info size={15} className="text-info flex-shrink-0 mt-0.5" />
          <p className="text-xs text-info leading-relaxed">
            After submission, admin will review your listing within <span className="font-bold">24–48 hours</span>. Once approved, your auction goes live immediately and you'll be notified by email.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:justify-between mt-5">
          <Button variant="outline" onClick={() => navigate('/seller/create-listing/step-2')}>← Back</Button>
          <Button variant="primary" fullWidth loading={isSubmitting} onClick={handleSubmit} className="sm:w-auto">
            Submit
          </Button>
        </div>
      </main>
    </div>
  );
}
