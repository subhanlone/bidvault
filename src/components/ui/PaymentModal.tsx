import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { X, CreditCard, Lock } from 'lucide-react';
import { api } from '../../services/api';
import Button from './Button';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string);

const elementStyle = {
  base: { fontSize: '14px', color: '#1e293b', '::placeholder': { color: '#94a3b8' } },
  invalid: { color: '#ef4444' },
};

interface Props {
  transactionId: string;
  auctionTitle: string;
  finalAmount: number;
  onSuccess: () => void;
  onClose: () => void;
}

function CheckoutForm({ transactionId, auctionTitle, finalAmount, onSuccess }: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    try {
      const { clientSecret } = await api.post<{ clientSecret: string }>(
        '/payments/create-intent',
        { transactionId },
      );

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: elements.getElement(CardNumberElement)! },
      });

      if (result.error) {
        setError(result.error.message ?? 'Payment failed.');
      } else if (result.paymentIntent?.status === 'succeeded') {
        onSuccess();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Payment failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <p className="text-[13px] text-muted mb-1">Paying for</p>
        <p className="font-bold text-[14px] text-navy">{auctionTitle}</p>
      </div>

      <div className="flex justify-between items-center bg-surface border border-border-light rounded-md px-4 py-3">
        <span className="text-[13px] text-muted">Total Amount</span>
        <span className="font-extrabold text-[18px] text-success">PKR {finalAmount.toLocaleString()}</span>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <label className="text-[12px] font-semibold text-navy mb-2 block">Card Number</label>
          <div className="border border-border-light rounded-md px-4 py-[14px] bg-surface">
            <CardNumberElement options={{ style: elementStyle }} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[12px] font-semibold text-navy mb-2 block">Expiry Date</label>
            <div className="border border-border-light rounded-md px-4 py-[14px] bg-surface">
              <CardExpiryElement options={{ style: elementStyle }} />
            </div>
          </div>
          <div>
            <label className="text-[12px] font-semibold text-navy mb-2 block">CVC</label>
            <div className="border border-border-light rounded-md px-4 py-[14px] bg-surface">
              <CardCvcElement options={{ style: elementStyle }} />
            </div>
          </div>
        </div>

        {import.meta.env.DEV && (
          <p className="text-[11px] text-muted">Test card: 4242 4242 4242 4242 · Any future date · Any CVC</p>
        )}
      </div>

      {error && (
        <p className="text-[13px] text-error bg-error-bg border border-error-border rounded-md px-3 py-2">{error}</p>
      )}

      <Button type="submit" disabled={!stripe || loading} className="w-full flex items-center justify-center gap-2">
        <Lock size={14} />
        {loading ? 'Processing...' : `Pay PKR ${finalAmount.toLocaleString()}`}
      </Button>
    </form>
  );
}

export default function PaymentModal({ transactionId, auctionTitle, finalAmount, onSuccess, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div className="bg-surface rounded-xl shadow-xl w-full max-w-[440px] p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <CreditCard size={18} className="text-primary" />
            <h2 className="font-bold text-[16px] text-navy">Complete Payment</h2>
          </div>
          <button onClick={onClose} aria-label="Close payment modal" className="text-muted hover:text-navy transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm">
            <X size={20} />
          </button>
        </div>

        <Elements stripe={stripePromise}>
          <CheckoutForm
            transactionId={transactionId}
            auctionTitle={auctionTitle}
            finalAmount={finalAmount}
            onSuccess={onSuccess}
            onClose={onClose}
          />
        </Elements>
      </div>
    </div>
  );
}
