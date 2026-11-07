import { locatedIn } from '../../utils/format';

/**
 * The rules a bidder agrees to, in plain words, shown before they sign in. The payment and
 * confirmation windows are admin settings and are not quoted here yet (nothing is hard-coded).
 */
export default function BuyingRules({ city, province }: { city: string | null; province: string | null }) {
  const place = locatedIn(city, province);
  const rows: { label: string; value: string }[] = [
    { label: 'Bids', value: 'Every bid is binding. If yours is the highest when the clock runs out, you buy the item.' },
    { label: 'Payment', value: 'You pay on BidVault after you win.' },
    { label: 'Delivery', value: 'The seller ships the item, and you confirm that it arrived.' },
    ...(place ? [{ label: 'Located in', value: place }] : []),
    { label: "Seller's phone", value: 'Shown to the buyer after payment, so you can arrange pickup or a courier.' },
  ];

  return (
    <section aria-labelledby="buying-rules-title" className="bg-surface border border-border-light rounded-md p-4 sm:p-5">
      <h3 id="buying-rules-title" className="font-bold text-[14px] text-navy mb-3">Buying on BidVault</h3>
      <dl className="flex flex-col gap-2.5">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-[110px_1fr] gap-3 text-[12.5px] leading-[19px]">
            <dt className="font-bold text-secondary">{row.label}</dt>
            <dd className="text-muted m-0">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
