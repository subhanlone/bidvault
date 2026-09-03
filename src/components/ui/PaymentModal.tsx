import { useState } from 'react';
import { X, CreditCard, Lock } from 'lucide-react';
import { api } from '../../services/api';
import Button from './Button';
import { pkr } from '../../utils/format';
import { useDialog } from '../../hooks/useDialog';

interface Props {
  transactionId: string;
  auctionTitle: string;
  finalAmount: number;
  onSuccess: () => void;
  onClose: () => void;
}

function CheckoutForm({ transactionId, auctionTitle, finalAmount, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryPhone, setDeliveryPhone] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // BV-047: the platform previously held no delivery contact data at all — the seller has
    // nowhere to send the item without this, so it's required before payment starts.
    if (deliveryAddress.trim().length < 10) {
      setError('Enter a delivery address the seller can ship to (at least 10 characters).');
      return;
    }
    if (deliveryPhone.trim().length < 7) {
      setError('Enter a phone number the seller can reach you on.');
      return;
    }
    const digits = cardNumber.replace(/\s+/g, '');
    if (digits.length < 12 || digits.length > 24) {
      setError('Enter a card number.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await api.post(
        `/payments/${transactionId}/pay`,
        {
          cardNumber: digits,
          deliveryAddress: deliveryAddress.trim(),
          deliveryPhone: deliveryPhone.trim(),
        },
      );

      if (result.status === 'COMPLETED') {
        onSuccess();
      } else {
        setError(result.lastPaymentError ?? 'Card declined.');
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
        <span className="font-extrabold text-[18px] text-success">{pkr(finalAmount)}</span>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <label className="text-[12px] font-semibold text-navy mb-2 block">Delivery Address</label>
          <textarea
            value={deliveryAddress}
            onChange={e => setDeliveryAddress(e.target.value)}
            maxLength={300}
            rows={2}
            placeholder="House/flat, street, area, city"
            className="w-full border border-border-light rounded-md px-4 py-[10px] bg-surface text-[13px] text-navy placeholder:text-placeholder resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div>
          <label className="text-[12px] font-semibold text-navy mb-2 block">Delivery Phone</label>
          <input
            type="tel"
            value={deliveryPhone}
            onChange={e => setDeliveryPhone(e.target.value)}
            maxLength={20}
            placeholder="03xx xxxxxxx"
            className="w-full border border-border-light rounded-md px-4 py-[10px] bg-surface text-[13px] text-navy placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div>
          <label className="text-[12px] font-semibold text-navy mb-2 block">Card Number</label>
          <input
            type="text"
            inputMode="numeric"
            value={cardNumber}
            onChange={e => setCardNumber(e.target.value)}
            maxLength={24}
            placeholder="4242 4242 4242 4242"
            className="w-full border border-border-light rounded-md px-4 py-[10px] bg-surface text-[13px] text-navy placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[12px] font-semibold text-navy mb-2 block">Expiry Date</label>
            <input
              type="text"
              value={expiry}
              onChange={e => setExpiry(e.target.value)}
              maxLength={5}
              placeholder="MM/YY"
              className="w-full border border-border-light rounded-md px-4 py-[10px] bg-surface text-[13px] text-navy placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="text-[12px] font-semibold text-navy mb-2 block">CVC</label>
            <input
              type="text"
              inputMode="numeric"
              value={cvc}
              onChange={e => setCvc(e.target.value)}
              maxLength={4}
              placeholder="123"
              className="w-full border border-border-light rounded-md px-4 py-[10px] bg-surface text-[13px] text-navy placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        {import.meta.env.DEV && (
          <p className="text-[11px] text-muted">Test cards: 4242 4242 4242 4242 approves · 4000 0000 0000 0002 declines · any expiry/CVC</p>
        )}
      </div>

      {error && (
        <p className="text-[13px] text-error bg-error-bg border border-error-border rounded-md px-3 py-2">{error}</p>
      )}

      <Button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2">
        <Lock size={14} />
        {loading ? 'Processing...' : `Pay PKR ${finalAmount.toLocaleString()}`}
      </Button>
    </form>
  );
}

export default function PaymentModal({ transactionId, auctionTitle, finalAmount, onSuccess, onClose }: Props) {
  const dialogRef = useDialog<HTMLDivElement>(true, onClose);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-modal-title"
        tabIndex={-1}
        className="bg-surface rounded-xl shadow-xl w-full max-w-[440px] p-6 focus:outline-none"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <CreditCard size={18} className="text-primary" />
            <h2 id="payment-modal-title" className="font-bold text-[16px] text-navy">Complete Payment</h2>
          </div>
          <button onClick={onClose} aria-label="Close payment modal" className="text-muted hover:text-navy transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm">
            <X size={20} />
          </button>
        </div>

        <CheckoutForm
          transactionId={transactionId}
          auctionTitle={auctionTitle}
          finalAmount={finalAmount}
          onSuccess={onSuccess}
          onClose={onClose}
        />
      </div>
    </div>
  );
}
