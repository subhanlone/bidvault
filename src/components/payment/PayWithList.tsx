import { useId, type ReactNode } from 'react';
import { CreditCard, Smartphone, Wallet, Landmark, type LucideIcon } from 'lucide-react';
import type { PaymentMethod } from '../../types/api';
import { METHOD_LABEL, PAYMENT_METHODS } from '../../utils/payment';

const METHOD_ICON: Record<PaymentMethod, LucideIcon> = {
  CARD: CreditCard,
  JAZZCASH: Smartphone,
  EASYPAISA: Wallet,
  BANK_TRANSFER: Landmark,
};

interface Props {
  value: PaymentMethod | null;
  onChange: (method: PaymentMethod) => void;
  /** The chosen method's fields, shown in place under its row. */
  children: ReactNode;
}

/**
 * The "Pay with" choice: one row per method (all simulated), nothing chosen at first. Native radio
 * inputs sharing one name, so the browser gives the keyboard behaviour (Tab into the group, arrow
 * keys between methods) and screen readers announce a named group of options. Each row is at least
 * 44 px tall with its icon inline, and the chosen row opens its fields directly beneath it.
 */
export default function PayWithList({ value, onChange, children }: Props) {
  const name = useId();
  const labelId = `${name}-label`;

  return (
    <div role="radiogroup" aria-labelledby={labelId} className="flex flex-col gap-2">
      <p id={labelId} className="text-[12px] font-semibold text-navy">Pay with</p>
      {PAYMENT_METHODS.map((method) => {
        const Icon = METHOD_ICON[method];
        const chosen = value === method;
        return (
          <div
            key={method}
            className={`rounded-md border transition-colors ${chosen ? 'border-primary bg-primary/5' : 'border-border-light bg-surface'}`}
          >
            <label className="flex min-h-[44px] cursor-pointer items-center gap-3 px-4 py-2">
              <input
                type="radio"
                name={name}
                value={method}
                checked={chosen}
                onChange={() => onChange(method)}
                className="h-4 w-4 shrink-0 accent-primary cursor-pointer"
              />
              <Icon size={18} aria-hidden="true" className={chosen ? 'text-primary' : 'text-muted'} />
              <span className="text-[14px] font-semibold text-navy">{METHOD_LABEL[method]}</span>
            </label>
            {chosen && <div className="border-t border-border-light px-4 pb-4 pt-3">{children}</div>}
          </div>
        );
      })}
    </div>
  );
}
