import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useListing } from '../../context/ListingContext';
import { useToast } from '../../context/ToastContext';
import { mockApi } from '../../services/mockApi';
import { IconInfo } from '../../components/Icons';
import { ListingStepperHeader, Stepper } from './SellerCreateListingStep1';

export default function SellerCreateListingStep4() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { draft, setSubmittedListingId } = useListing();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const fmtPKR = (n: number) => n > 0 ? `PKR ${n.toLocaleString()}` : '—';

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    const res = await mockApi.submitListing(draft, user.userId, user.name);
    setLoading(false);
    if (res.success && res.data) {
      setSubmittedListingId(res.data.listingId);
      showToast({ type: 'success', title: 'Listing Submitted!', message: 'Your listing is under admin review.' });
      navigate('/seller/listing-submitted');
    } else {
      showToast({ type: 'error', title: 'Submission Failed', message: res.error || 'Please try again.' });
    }
  };

  const price = draft.useAiPrice ? draft.aiPrediction?.predictedPrice ?? draft.finalStartingPrice : draft.startingPrice;

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <ListingStepperHeader currentStep={3} />

      <div className="max-w-[900px] mx-auto px-8 py-8">
        <h1 className="font-extrabold text-[22px] text-[#0b1f3a] mb-1">Review Your Listing</h1>
        <p className="text-[13px] text-[#6c757d] mb-6">Check all details before submitting to admin for review.</p>

        <Stepper current={3} />

        <div className="grid grid-cols-2 gap-5">
          {/* Item Details */}
          <div className="bg-white border border-[#e9ecef] rounded-[12px] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e9ecef]">
              <h3 className="font-bold text-[14px] text-[#0b1f3a]">Item Details</h3>
              <button onClick={() => navigate('/seller/create-listing/step-1')} className="font-bold text-[12px] text-[#d0021b]">Edit</button>
            </div>
            <div className="p-5">
              <div className="bg-[#0b1f3a] rounded-[10px] h-[160px] flex items-center justify-center text-[60px] mb-4">
                {draft.category?.includes('Electronics') ? '📱' : draft.category?.includes('Vehicles') ? '🚗' : '📦'}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'TITLE', value: draft.title || '—' },
                  { label: 'CATEGORY', value: draft.category?.split('&')[0].trim() || '—' },
                  { label: 'CONDITION', value: draft.condition === 'NEW' ? 'New' : draft.condition === 'LIKE_NEW' ? 'Like New' : draft.condition === 'USED' ? 'Used' : '—' },
                  { label: 'PHOTOS', value: draft.hasPhoto ? '3 uploaded' : 'None' },
                ].map(d => (
                  <div key={d.label} className="bg-[#f8f9fa] rounded-[8px] px-3 py-3">
                    <p className="text-[10px] text-[#adb5bd] font-bold tracking-[0.5px] uppercase">{d.label}</p>
                    <p className="font-semibold text-[13px] text-[#343a40] mt-[2px] truncate">{d.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Auction Parameters */}
          <div className="bg-white border border-[#e9ecef] rounded-[12px] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e9ecef]">
              <h3 className="font-bold text-[14px] text-[#0b1f3a]">Auction Parameters</h3>
              <button onClick={() => navigate('/seller/create-listing/step-2')} className="font-bold text-[12px] text-[#d0021b]">Edit</button>
            </div>
            <div className="p-5 grid grid-cols-2 gap-3">
              {[
                { label: 'STARTING PRICE', value: fmtPKR(price), red: true },
                { label: 'MIN INCREMENT', value: fmtPKR(draft.minIncrement) },
                { label: 'START DATE', value: draft.startDate || '—' },
                { label: 'DURATION', value: `${draft.duration} Days` },
                ...(draft.hasReserve ? [{ label: 'RESERVE PRICE', value: fmtPKR(draft.reservePrice) }] : []),
                { label: 'AI PRICE USED', value: draft.useAiPrice ? 'Yes' : 'No' },
              ].map(d => (
                <div key={d.label} className="bg-[#f8f9fa] rounded-[8px] px-3 py-3">
                  <p className="text-[10px] text-[#adb5bd] font-bold tracking-[0.5px] uppercase">{d.label}</p>
                  <p className={`font-bold text-[14px] mt-[2px] ${d.red ? 'text-[#d0021b]' : 'text-[#343a40]'}`}>{d.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-[#eff6ff] border border-[#bfdbfe] flex gap-3 items-center px-4 py-3 rounded-[8px] mt-5">
          <IconInfo color="#1e40af" />
          <p className="text-[12px] text-[#1e40af] font-medium">
            After submission, admin will review your listing within <span className="font-bold">24–48 hours</span>. You'll be notified by email once it's approved.
          </p>
        </div>

        <div className="flex justify-between mt-6">
          <button onClick={() => navigate('/seller/create-listing/step-3')} className="border border-[#dee2e6] font-semibold text-[14px] text-[#495057] px-6 py-3 rounded-[8px] hover:bg-[#f8f9fa]">← Back</button>
          <button onClick={handleSubmit} disabled={loading} className="bg-[#d0021b] flex gap-2 items-center font-bold text-[14px] text-white px-6 py-3 rounded-[8px] hover:bg-[#a80016] transition-colors disabled:opacity-60">
            {loading ? <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Submit Listing for Review →'}
          </button>
        </div>
      </div>
    </div>
  );
}
