import { useId, useState } from 'react';
import { X, CreditCard, Lock } from 'lucide-react';
import { api } from '../../services/api';
import Button from './Button';
import { pkr } from '../../utils/format';
import { useDialog } from '../../hooks/useDialog';
import PayWithList from '../payment/PayWithList';
import type { PaymentMethod, PayTransactionRequest } from '../../types/api';
import {
  BANK_REFERENCE_PATTERN, METHOD_LABEL, SIMULATED_BANK_ACCOUNT, formatCardNumber, formatExpiry, normalizePkMobile,
} from '../../utils/payment';

interface Props {
  transactionId: string;
  auctionTitle: string;
  finalAmount: number;
  onSuccess: () => void;
  onClose: () => void;
}

/** The pay body without the delivery fields: exactly one method's own field. */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
type MethodPart = DistributiveOmit<PayTransactionRequest, 'deliveryAddress' | 'deliveryPhone'>;

const inputClass =
  'w-full border border-border-light rounded-md px-4 py-[10px] bg-surface text-[13px] text-navy placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-primary/40';

function CheckoutForm({ transactionId, auctionTitle, finalAmount, onSuccess }: Props) {
  // Each label is tied to its field by id: a bare <label> next to a field names nothing.
  const fieldId = useId();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryPhone, setDeliveryPhone] = useState('');
  // Nothing is chosen at first: the buyer picks how to pay.
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  // Not pre-filled from the delivery phone: the seller sees that phone, so a wallet number copied
  // from it would no longer be private (the user's decision).
  const [walletNumber, setWalletNumber] = useState('');
  const [bankReference, setBankReference] = useState('');

  const amount = `PKR ${finalAmount.toLocaleString()}`;
  const submitLabel = !method
    ? 'Choose how to pay'
    : method === 'BANK_TRANSFER'
      ? `I have paid ${amount}`
      : `Pay ${amount} with ${METHOD_LABEL[method]}`;

  function chooseMethod(next: PaymentMethod) {
    setMethod(next);
    setError(null);
  }

  /** The chosen method's own field, checked here, or an error to show. Only this field is sent. */
  function methodBody(): { body: MethodPart } | { error: string } {
    switch (method) {
      case 'CARD': {
        const digits = cardNumber.replace(/\D/g, '');
        if (digits.length < 12 || digits.length > 19) return { error: 'Enter a card number.' };
        return { body: { method: 'CARD', cardNumber: digits } };
      }
      case 'JAZZCASH':
      case 'EASYPAISA': {
        const normalized = normalizePkMobile(walletNumber);
        if (!normalized) return { error: `Enter your ${METHOD_LABEL[method]} mobile number, e.g. 0300 1234567.` };
        return { body: { method, walletNumber: normalized } };
      }
      case 'BANK_TRANSFER': {
        const reference = bankReference.trim();
        if (!BANK_REFERENCE_PATTERN.test(reference)) {
          return { error: 'Enter the transfer reference: 6 to 30 letters, digits or dashes.' };
        }
        return { body: { method: 'BANK_TRANSFER', bankReference: reference } };
      }
      default:
        return { error: 'Choose how you want to pay.' };
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Delivery contact details are required before payment starts: the seller has nowhere to send
    // the item without them.
    if (deliveryAddress.trim().length < 10) {
      setError('Enter a delivery address the seller can ship to (at least 10 characters).');
      return;
    }
    if (deliveryPhone.trim().length < 7) {
      setError('Enter a phone number the seller can reach you on.');
      return;
    }
    const chosen = methodBody();
    if ('error' in chosen) {
      setError(chosen.error);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const body: PayTransactionRequest = {
        ...chosen.body,
        deliveryAddress: deliveryAddress.trim(),
        deliveryPhone: deliveryPhone.trim(),
      };
      const result = await api.post(`/payments/${transactionId}/pay`, body);

      if (result.status === 'COMPLETED') {
        onSuccess();
      } else {
        setError(result.lastPaymentError ?? 'Payment declined.');
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
          <label htmlFor={`${fieldId}-address`} className="text-[12px] font-semibold text-navy mb-2 block">Delivery Address</label>
          <textarea
            id={`${fieldId}-address`}
            value={deliveryAddress}
            onChange={e => setDeliveryAddress(e.target.value)}
            maxLength={300}
            rows={2}
            placeholder="House/flat, street, area, city"
            className="w-full border border-border-light rounded-md px-4 py-[10px] bg-surface text-[13px] text-navy placeholder:text-placeholder resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div>
          <label htmlFor={`${fieldId}-phone`} className="text-[12px] font-semibold text-navy mb-2 block">Delivery Phone</label>
          <input
            id={`${fieldId}-phone`}
            type="tel"
            value={deliveryPhone}
            onChange={e => setDeliveryPhone(e.target.value)}
            maxLength={20}
            placeholder="03xx xxxxxxx"
            className="w-full border border-border-light rounded-md px-4 py-[10px] bg-surface text-[13px] text-navy placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <PayWithList value={method} onChange={chooseMethod}>
          {method === 'CARD' && (
            <div className="flex flex-col gap-4">
              <div>
                <label htmlFor={`${fieldId}-card`} className="text-[12px] font-semibold text-navy mb-2 block">Card number</label>
                <input
                  id={`${fieldId}-card`}
                  type="text"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  value={cardNumber}
                  onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                  maxLength={23}
                  placeholder="4242 4242 4242 4242"
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor={`${fieldId}-expiry`} className="text-[12px] font-semibold text-navy mb-2 block">Expiry date</label>
                  <input
                    id={`${fieldId}-expiry`}
                    type="text"
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    value={expiry}
                    onChange={e => setExpiry(formatExpiry(e.target.value))}
                    maxLength={5}
                    placeholder="MM/YY"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor={`${fieldId}-cvc`} className="text-[12px] font-semibold text-navy mb-2 block">CVC</label>
                  <input
                    id={`${fieldId}-cvc`}
                    type="text"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    value={cvc}
                    onChange={e => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    maxLength={4}
                    placeholder="123"
                    className={inputClass}
                  />
                </div>
              </div>
              {import.meta.env.DEV && (
                <p className="text-[12px] text-muted">Test cards: 4242 4242 4242 4242 approves · 4000 0000 0000 0002 declines · any expiry/CVC</p>
              )}
            </div>
          )}

          {(method === 'JAZZCASH' || method === 'EASYPAISA') && (
            <div>
              <label htmlFor={`${fieldId}-wallet`} className="text-[12px] font-semibold text-navy mb-2 block">
                {METHOD_LABEL[method]} mobile number
              </label>
              <input
                id={`${fieldId}-wallet`}
                type="tel"
                inputMode="tel"
                value={walletNumber}
                onChange={e => setWalletNumber(e.target.value)}
                maxLength={20}
                placeholder="0300 1234567"
                className={inputClass}
              />
              <p className="text-[12px] text-muted mt-2">Approved straight away (simulated: no real money moves).</p>
            </div>
          )}

          {method === 'BANK_TRANSFER' && (
            <div className="flex flex-col gap-3">
              <p className="text-[13px] text-navy bg-info-bg border border-info-border rounded-md px-3 py-2">
                Send {amount} to {SIMULATED_BANK_ACCOUNT}
              </p>
              <div>
                <label htmlFor={`${fieldId}-bankref`} className="text-[12px] font-semibold text-navy mb-2 block">
                  Transfer reference / transaction ID
                </label>
                <input
                  id={`${fieldId}-bankref`}
                  type="text"
                  value={bankReference}
                  onChange={e => setBankReference(e.target.value)}
                  maxLength={30}
                  placeholder="e.g. FT2611110001"
                  className={inputClass}
                />
              </div>
            </div>
          )}
        </PayWithList>
      </div>

      {error && (
        <p role="alert" className="text-[13px] text-error bg-error-bg border border-error-border rounded-md px-3 py-2">{error}</p>
      )}

      <Button type="submit" disabled={loading || !method} className="w-full flex items-center justify-center gap-2">
        <Lock size={14} aria-hidden="true" className="shrink-0" />
        {loading ? 'Processing...' : submitLabel}
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
        className="bg-surface rounded-xl shadow-xl w-full max-w-[440px] max-h-[90vh] overflow-y-auto p-6 focus:outline-none"
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
