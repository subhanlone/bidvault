import type { PaymentInfo, PaymentMethod } from '../types/api';

/** The four ways to pay (all simulated), in the order the "Pay with" list shows them. */
export const PAYMENT_METHODS: readonly PaymentMethod[] = ['CARD', 'JAZZCASH', 'EASYPAISA', 'BANK_TRANSFER'];

export const METHOD_LABEL: Record<PaymentMethod, string> = {
  CARD: 'Debit / credit card',
  JAZZCASH: 'JazzCash',
  EASYPAISA: 'Easypaisa',
  BANK_TRANSFER: 'Bank transfer',
};

/** The bank account a bank-transfer buyer is told to pay into. A fixed simulated value, not a setting. */
export const SIMULATED_BANK_ACCOUNT = 'BidVault (Pvt) Ltd · Meezan Bank · PK36 MEZN 0001 2345 6789 0123 (simulated)';

/** The same rule the server applies to a bank transfer's reference. */
export const BANK_REFERENCE_PATTERN = /^[A-Za-z0-9-]{6,30}$/;

/** "4242424242424242" -> "4242 4242 4242 4242" while typing: digits only, at most 19. */
export function formatCardNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 19);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

/** "1228" -> "12/28" while typing: digits only, at most 4. */
export function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

/**
 * A Pakistani mobile number in the one shape the server stores, 03XXXXXXXXX, or null. Accepts
 * +92 3…, 92 3… and 03…, with spaces and dashes. Same rule as the backend's normalizePkMobile.
 */
export function normalizePkMobile(raw: string): string | null {
  const digits = raw.replace(/[\s-]/g, '').replace(/^\+/, '');
  const local = digits.startsWith('92') ? `0${digits.slice(2)}` : digits;
  return /^03\d{9}$/.test(local) ? local : null;
}

/**
 * "Paid with JazzCash 0300•••567", "Paid with Visa •••4242", "Paid by bank transfer (ref …)".
 * The server leaves out the hint and reference for the seller, so a seller reads "Paid with JazzCash".
 */
export function paidWithText(payment: PaymentInfo): string {
  if (payment.method === 'BANK_TRANSFER') {
    return payment.bankTransferReference ? `Paid by bank transfer (ref ${payment.bankTransferReference})` : 'Paid by bank transfer';
  }
  if (payment.method === 'CARD') return payment.accountHint ? `Paid with ${payment.accountHint}` : 'Paid by card';
  return payment.accountHint ? `Paid with ${payment.methodLabel} ${payment.accountHint}` : `Paid with ${payment.methodLabel}`;
}
