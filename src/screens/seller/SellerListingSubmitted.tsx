import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useListing } from '../../context/ListingContext';
import { Button } from '../../components/ui';
import { ListingStepperHeader } from './SellerCreateListingStep1';

export default function SellerListingSubmitted() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { submittedListingId, clearDraft } = useListing();

  const now = new Date();
  const submittedAt =
    now.toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' }) +
    ' · ' +
    now.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });

  const handleCreateAnother = () => {
    clearDraft();
    navigate('/seller/create-listing/step-1');
  };

  const timeline = [
    { label: 'Listing submitted', sub: submittedAt, done: true,  active: false },
    { label: 'Admin review',      sub: 'Within 24–48 hours',     done: false, active: true  },
    { label: 'Auction goes live', sub: 'After admin approval',   done: false, active: false },
  ];

  return (
    <div className="min-h-screen bg-white">
      <ListingStepperHeader currentStep={2} />

      <main className="flex flex-col items-center justify-center py-20 px-4">
        {/* Success icon */}
        <div className="w-20 h-20 rounded-2xl bg-[#f0faf4] border border-[#16a34a]/20 flex items-center justify-center mb-6">
          <div className="w-12 h-12 rounded-full bg-[#16a34a] flex items-center justify-center">
            <Check size={24} strokeWidth={3} className="text-white" />
          </div>
        </div>

        <h1 className="text-3xl font-extrabold text-[#0b1f3a] mb-3">Listing Submitted!</h1>
        <p className="text-sm text-[#6c757d] text-center leading-relaxed max-w-md mb-5">
          Your listing has been submitted for admin review. You'll receive an email at{' '}
          <span className="font-bold text-[#343a40]">{user?.email ?? 'your email'}</span> once it's approved.
        </p>

        {submittedListingId && (
          <div className="border border-[#dee2e6] text-sm font-semibold text-[#343a40] px-5 py-2 rounded-lg mb-10">
            Listing ID: <span className="font-bold text-[#d0021b]">{submittedListingId}</span>
          </div>
        )}

        {/* Timeline */}
        <div className="flex flex-col w-full max-w-sm">
          {timeline.map(({ label, sub, done, active }, i) => (
            <div key={label} className="flex items-start gap-5">
              <div className="flex flex-col items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                  done   ? 'bg-[#16a34a]' :
                  active ? 'border-2 border-[#f59e0b] bg-white' :
                           'border-2 border-[#e9ecef] bg-white'
                }`}>
                  {done
                    ? <Check size={12} strokeWidth={2.5} className="text-white" />
                    : <span className={`font-extrabold text-xs ${active ? 'text-[#f59e0b]' : 'text-[#adb5bd]'}`}>{i + 1}</span>
                  }
                </div>
                {i < timeline.length - 1 && <div className="w-0.5 h-10 bg-[#e9ecef]" />}
              </div>
              <div className="pt-1 pb-2">
                <p className="text-sm font-bold text-[#0b1f3a]">{label}</p>
                <p className="text-xs text-[#6c757d]">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-10 w-full max-w-sm">
          <Button variant="outline" fullWidth onClick={() => navigate('/seller/dashboard')}>
            View Dashboard
          </Button>
          <Button variant="primary" fullWidth onClick={handleCreateAnother}>
            Create Another Listing
          </Button>
        </div>
      </main>
    </div>
  );
}
