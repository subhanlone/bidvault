import { useState } from 'react';
import { Lock } from 'lucide-react';
import { Button } from '../ui';
import Input from '../ui/Input';
import { useToast } from '../../context/toast';
import { useChangeMinIncrement, useLowerReserve } from '../../queries/auctions';
import { ApiError } from '../../services/api';
import type { Auction } from '../../types/api';
import { pkr } from '../../utils/format';

/** The server locks the increment for the last hour (INCREMENT_LOCK_MS in auction-control.service). */
const INCREMENT_LOCK_SECONDS = 60 * 60;

/** Digits only, without leading zeros: what the server's whole-number fields accept. */
function digitsOnly(value: string) {
  return value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
}

/** The server's reason, in its own words: a field error first (422), then the message. */
function reasonOf(err: unknown, field: string, fallback: string) {
  if (err instanceof ApiError) return err.details?.[field]?.[0] ?? err.message;
  return fallback;
}

/**
 * The seller's two live edits on their own running auction (2026-11-28, the FYP mid panel):
 *   - the minimum increment, up or down, except in the final hour;
 *   - a lower reserve, while the bids have not reached it; at or below the current bid it is met
 *     and the sale can be concluded.
 * The server enforces every rule (PATCH .../min-increment, .../reserve); they are restated here
 * only so the controls are offered when they can work. Bidders' pages update over the socket.
 */
export default function LiveAuctionEdits({ auction, secondsLeft }: { auction: Auction; secondsLeft: number }) {
  return (
    <section aria-labelledby="bidding-rules-title" className="bg-surface border border-border-light rounded-md p-4 sm:p-5">
      <h3 id="bidding-rules-title" className="font-bold text-[14px] text-navy mb-1">Bidding rules</h3>
      <p className="text-[12px] text-muted mb-4">Change them while the auction runs. Bidders see the change at once.</p>
      <div className="flex flex-col divide-y divide-surface-raised">
        <IncrementRow auction={auction} locked={secondsLeft <= INCREMENT_LOCK_SECONDS} />
        <ReserveRow auction={auction} />
      </div>
    </section>
  );
}

function IncrementRow({ auction, locked }: { auction: Auction; locked: boolean }) {
  const { showToast } = useToast();
  const change = useChangeMinIncrement();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  function open() {
    setValue(String(auction.minIncrement));
    setError(null);
    setEditing(true);
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    const amount = value === '' ? 0 : Number(value);
    if (amount <= 0) {
      setError('Enter an increment of at least PKR 1.');
      return;
    }
    change.mutate(
      { auctionId: auction.auctionId, minIncrement: amount },
      {
        onSuccess: (data) => {
          setEditing(false);
          showToast({ type: 'success', title: 'Increment updated', message: `Each new bid must now beat the last by ${pkr(data.minIncrement)}.` });
        },
        onError: (err) => setError(reasonOf(err, 'minIncrement', 'Could not change the increment. Please try again.')),
      },
    );
  }

  return (
    <div className="py-3 first:pt-0">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[12px] text-muted">Minimum increment</p>
          <p className="font-bold text-[15px] text-secondary">{pkr(auction.minIncrement)}</p>
        </div>
        {locked ? (
          <p className="text-[12px] text-muted flex items-center gap-1.5 text-right">
            <Lock size={13} aria-hidden="true" /> Locked in the final hour
          </p>
        ) : !editing ? (
          <Button variant="outline" size="sm" onClick={open}>Change</Button>
        ) : null}
      </div>
      {editing && !locked && (
        <form onSubmit={save} className="mt-3 flex flex-col gap-2">
          <label htmlFor="new-min-increment" className="font-bold text-[11px] text-muted uppercase tracking-[0.3px]">New increment (PKR)</label>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-start">
            <div className="flex-1">
              <Input
                id="new-min-increment"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                maxLength={10}
                value={value}
                onChange={(e) => { setValue(digitsOnly(e.target.value)); setError(null); }}
                error={error ?? undefined}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="md" loading={change.isPending} className="flex-1 sm:flex-none">Save</Button>
              <Button type="button" variant="outline" size="md" onClick={() => setEditing(false)} className="flex-1 sm:flex-none">Cancel</Button>
            </div>
          </div>
          <p className="text-[11.5px] text-muted">You can raise or lower it until the last hour of the auction.</p>
        </form>
      )}
    </div>
  );
}

function ReserveRow({ auction }: { auction: Auction }) {
  const { showToast } = useToast();
  const lower = useLowerReserve();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const reserve = auction.reservePrice;
  // The server's own conditions for lowering (lowerReserve): a reserve, at least one bid, not yet met.
  const canLower = reserve !== undefined && auction.bidCount > 0 && auction.reserveMet === false;

  function open() {
    setValue('');
    setError(null);
    setEditing(true);
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (reserve === undefined) return;
    const amount = value === '' ? 0 : Number(value);
    if (amount >= reserve) {
      setError(`Enter less than your current reserve of ${pkr(reserve)}.`);
      return;
    }
    if (amount < auction.startPrice) {
      setError(`The reserve cannot be below the starting price of ${pkr(auction.startPrice)}.`);
      return;
    }
    lower.mutate(
      { auctionId: auction.auctionId, reservePrice: amount },
      {
        onSuccess: (data) => {
          setEditing(false);
          showToast(data.reserveMet
            ? { type: 'success', title: 'Reserve met', message: `The reserve is now ${pkr(data.reservePrice)}. You can conclude the sale.` }
            : { type: 'success', title: 'Reserve lowered', message: `The reserve is now ${pkr(data.reservePrice)}.` });
        },
        onError: (err) => setError(reasonOf(err, 'reservePrice', 'Could not lower the reserve. Please try again.')),
      },
    );
  }

  return (
    <div className="py-3 last:pb-0">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[12px] text-muted">Your reserve</p>
          <p className="font-bold text-[15px] text-secondary">{reserve === undefined ? 'No reserve' : pkr(reserve)}</p>
        </div>
        {canLower && !editing && <Button variant="outline" size="sm" onClick={open}>Lower</Button>}
      </div>
      {reserve !== undefined && !canLower && auction.reserveMet === false && auction.bidCount === 0 && (
        <p className="text-[11.5px] text-muted mt-1">You can lower it once the auction has a bid.</p>
      )}
      {editing && canLower && (
        <form onSubmit={save} className="mt-3 flex flex-col gap-2">
          <label htmlFor="new-reserve" className="font-bold text-[11px] text-muted uppercase tracking-[0.3px]">New reserve (PKR)</label>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-start">
            <div className="flex-1">
              <Input
                id="new-reserve"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                maxLength={10}
                placeholder={`${auction.startPrice.toLocaleString()} – ${(reserve - 1).toLocaleString()}`}
                value={value}
                onChange={(e) => { setValue(digitsOnly(e.target.value)); setError(null); }}
                error={error ?? undefined}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="md" loading={lower.isPending} className="flex-1 sm:flex-none">Lower</Button>
              <Button type="button" variant="outline" size="md" onClick={() => setEditing(false)} className="flex-1 sm:flex-none">Cancel</Button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { setValue(String(auction.currentBid)); setError(null); }}
            className="self-start text-left text-[12px] font-semibold text-primary hover:underline cursor-pointer"
          >
            Use the current bid ({pkr(auction.currentBid)}): the reserve is met at once
          </button>
          <p className="text-[11.5px] text-muted">A reserve can only go down, never back up. At the current bid or below it is met, and you can conclude the sale.</p>
        </form>
      )}
    </div>
  );
}
