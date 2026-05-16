import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useListing } from '../../context/ListingContext';
import { ListingStepperHeader } from './SellerCreateListingStep1';

export default function SellerListingSubmitted() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { submittedListingId, clearDraft } = useListing();

  const now = new Date();
  const submittedAt = now.toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' }) + ' · ' + now.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });

  const handleCreateAnother = () => {
    clearDraft();
    navigate('/seller/create-listing/step-1');
  };

  return (
    <div className="min-h-screen bg-white">
      <ListingStepperHeader currentStep={3} />

      <div className="flex flex-col items-center justify-center py-20 px-4">
        {/* Success icon */}
        <div className="bg-[#f0faf4] border border-[rgba(26,122,74,0.2)] flex items-center justify-center rounded-[20px] size-[80px] mb-6">
          <div className="bg-[#1a7a4a] flex items-center justify-center rounded-full size-[48px]">
            <Check size={24} strokeWidth={3} className="text-white" />
          </div>
        </div>

        <h1 className="font-extrabold text-[28px] text-[#0b1f3a] mb-3">Listing Submitted!</h1>
        <p className="text-[14px] text-[#6c757d] text-center leading-[22px] max-w-[420px] mb-5">
          Your listing has been submitted for admin review. You'll receive an email at{' '}
          <span className="font-bold text-[#343a40]">{user?.email ?? 'your email'}</span> once it's approved.
        </p>

        {submittedListingId && (
          <div className="border border-[#dee2e6] font-semibold text-[13px] text-[#343a40] px-5 py-2 rounded-[8px] mb-10">
            Listing ID: <span className="font-bold text-[#d0021b]">{submittedListingId}</span>
          </div>
        )}

        {/* Progress timeline */}
        <div className="flex flex-col gap-0 w-full max-w-[380px]">
          {/* Step 1 — done */}
          <div className="flex items-start gap-5">
            <div className="flex flex-col items-center">
              <div className="bg-[#1a7a4a] flex items-center justify-center rounded-full size-[28px] shrink-0">
                <Check size={12} strokeWidth={2.5} className="text-white" />
              </div>
              <div className="bg-[#e9ecef] w-[2px] h-[40px]" />
            </div>
            <div className="pt-1">
              <p className="font-bold text-[14px] text-[#0b1f3a]">Listing submitted</p>
              <p className="text-[12px] text-[#6c757d]">{submittedAt}</p>
            </div>
          </div>

          {/* Step 2 — in progress */}
          <div className="flex items-start gap-5">
            <div className="flex flex-col items-center">
              <div className="border-2 border-[#f59e0b] flex items-center justify-center rounded-full size-[28px] shrink-0 bg-white">
                <span className="font-extrabold text-[13px] text-[#f59e0b]">2</span>
              </div>
              <div className="bg-[#e9ecef] w-[2px] h-[40px]" />
            </div>
            <div className="pt-1">
              <p className="font-bold text-[14px] text-[#0b1f3a]">Admin review</p>
              <p className="text-[12px] text-[#6c757d]">Within 24–48 hours</p>
            </div>
          </div>

          {/* Step 3 — pending */}
          <div className="flex items-start gap-5">
            <div className="flex flex-col items-center">
              <div className="border-2 border-[#e9ecef] flex items-center justify-center rounded-full size-[28px] shrink-0 bg-white">
                <span className="font-extrabold text-[13px] text-[#adb5bd]">3</span>
              </div>
            </div>
            <div className="pt-1">
              <p className="font-bold text-[14px] text-[#0b1f3a]">Auction goes live</p>
              <p className="text-[12px] text-[#6c757d]">After admin approval</p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-10 w-full max-w-[380px]">
          <button onClick={() => navigate('/seller/dashboard')} className="flex-1 border border-[#dee2e6] font-semibold text-[14px] text-[#495057] px-6 py-3 rounded-[8px] hover:bg-[#f8f9fa] transition-colors">
            View Dashboard
          </button>
          <button onClick={handleCreateAnother} className="flex-1 bg-[#d0021b] font-bold text-[14px] text-white px-6 py-3 rounded-[8px] hover:bg-[#a80016] transition-colors">
            Create Another Listing
          </button>
        </div>
      </div>
    </div>
  );
}
