import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { BROWSE_CATEGORIES } from '../../config/categories';
import type { AuctionFacets } from '../../types/api';
import {
  CONDITIONS,
  hasFilters,
  PRICE_BANDS,
  priceRangeBroken,
  readPrice,
  type BrowseParams,
} from '../../utils/browseParams';
import { conditionLabel } from '../../utils/format';

type Change = (patch: Partial<BrowseParams>, how?: 'push' | 'replace') => void;

interface FilterRailProps {
  params: BrowseParams;
  /** Undefined until the first counts arrive; the choices show without a number until then. */
  facets: AuctionFacets | undefined;
  onChange: Change;
  onClear: () => void;
}

function Choice({ type, name, checked, onToggle, label, count }: {
  type: 'radio' | 'checkbox';
  name?: string;
  checked: boolean;
  onToggle: () => void;
  label: string;
  count: number | undefined;
}) {
  return (
    <li>
      <label className="flex items-center gap-2 cursor-pointer text-[14px] text-body">
        <input type={type} name={name} checked={checked} onChange={onToggle} className="accent-primary size-[15px] shrink-0 cursor-pointer" />
        <span>{label}</span>
        {count !== undefined && <>{' '}<span className="text-[12px] text-muted">({count})</span></>}
      </label>
    </li>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="border-0 p-0 m-0 mb-5 min-w-0">
      <legend className="p-0 mb-2.5 font-extrabold text-[12px] text-navy uppercase tracking-[0.06em]">{title}</legend>
      <ul className="list-none m-0 p-0 flex flex-col gap-2">{children}</ul>
    </fieldset>
  );
}

const asText = (n: number | null) => (n === null ? '' : String(n));

/**
 * The two price fields. What is typed is a draft: it is sent after a pause, and only when it is a
 * range the server would accept. A lowest price above the highest says so here and sends nothing.
 */
function PriceFields({ minPrice, maxPrice, onCommit }: {
  minPrice: number | null;
  maxPrice: number | null;
  onCommit: (range: { minPrice: number | null; maxPrice: number | null }) => void;
}) {
  const [text, setText] = useState({ min: asText(minPrice), max: asText(maxPrice) });
  // A preset, "Clear all" or Back changes the committed range from outside: the fields follow it.
  const [seen, setSeen] = useState({ minPrice, maxPrice });
  if (seen.minPrice !== minPrice || seen.maxPrice !== maxPrice) {
    setSeen({ minPrice, maxPrice });
    setText({ min: asText(minPrice), max: asText(maxPrice) });
  }

  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const schedule = (next: { min: string; max: string }) => {
    setText(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const range = { minPrice: readPrice(next.min), maxPrice: readPrice(next.max) };
      if (priceRangeBroken(range)) return;
      onCommit(range);
    }, 400);
  };

  const broken = priceRangeBroken({ minPrice: readPrice(text.min), maxPrice: readPrice(text.max) });
  const field = 'w-[72px] h-[34px] box-border bg-surface border rounded-lg px-2.5 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-primary';
  const digits = (value: string) => value.replace(/\D/g, '').slice(0, 10);

  return (
    <li className="mt-1">
      <div className="flex items-center gap-2 text-[13px] text-secondary">
        <input
          type="text" inputMode="numeric" autoComplete="off" placeholder="Min" aria-label="Minimum price"
          aria-invalid={broken} aria-describedby={broken ? 'price-problem' : undefined}
          value={text.min}
          onChange={(e) => schedule({ ...text, min: digits(e.target.value) })}
          className={`${field} ${broken ? 'border-error' : 'border-border-medium'}`}
        />
        to
        <input
          type="text" inputMode="numeric" autoComplete="off" placeholder="Max" aria-label="Maximum price"
          aria-invalid={broken} aria-describedby={broken ? 'price-problem' : undefined}
          value={text.max}
          onChange={(e) => schedule({ ...text, max: digits(e.target.value) })}
          className={`${field} ${broken ? 'border-error' : 'border-border-medium'}`}
        />
      </div>
      {broken && (
        <p id="price-problem" role="alert" className="text-[12px] text-error mt-1.5 mb-0">
          The lowest price cannot be above the highest price.
        </p>
      )}
    </li>
  );
}

/**
 * The filters for the results: category, price, condition and "with bids". Each choice shows how
 * many auctions it would give; a group counts with every other filter applied but not its own, so
 * the number beside another choice is what picking it would show. Every choice is held in the
 * address by the screen, not here.
 */
export default function FilterRail({ params, facets, onChange, onClear }: FilterRailProps) {
  const categoryGroup = useId();

  // Every category stays in the list, a zero shown as (0): the list does not jump about as other
  // filters are chosen.
  const categoryCounts = new Map((facets?.categories ?? []).map((c) => [c.name, c.count]));
  const everyCategory = [...BROWSE_CATEGORIES, ...[...categoryCounts.keys()].filter((n) => !(BROWSE_CATEGORIES as readonly string[]).includes(n))];
  const allCount = facets ? [...categoryCounts.values()].reduce((sum, n) => sum + n, 0) : undefined;

  const bandCount = (id: string) => facets?.priceBands.find((b) => b.id === id)?.count;
  const conditionCount = (value: string) => facets?.conditions.find((c) => c.value === value)?.count;

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-[13px] text-navy flex items-center gap-1.5 m-0">
          <SlidersHorizontal size={13} strokeWidth={2.5} aria-hidden="true" /> Filters
        </h2>
        {hasFilters(params) && (
          <button
            type="button"
            onClick={onClear}
            className="text-[12px] text-primary font-bold hover:underline cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
          >
            Clear all
          </button>
        )}
      </div>

      <Group title="Category">
        <Choice type="radio" name={categoryGroup} checked={params.category === ''} onToggle={() => onChange({ category: '' })} label="All" count={allCount} />
        {everyCategory.map((name) => (
          <Choice
            key={name} type="radio" name={categoryGroup} checked={params.category === name}
            onToggle={() => onChange({ category: name })} label={name} count={facets ? (categoryCounts.get(name) ?? 0) : undefined}
          />
        ))}
      </Group>

      <Group title="Price">
        {PRICE_BANDS.map((band) => {
          const on = params.minPrice === band.minPrice && params.maxPrice === band.maxPrice;
          return (
            <Choice
              key={band.id} type="checkbox" checked={on} label={band.label} count={bandCount(band.id)}
              onToggle={() => onChange(on ? { minPrice: null, maxPrice: null } : { minPrice: band.minPrice, maxPrice: band.maxPrice })}
            />
          );
        })}
        <PriceFields
          minPrice={params.minPrice} maxPrice={params.maxPrice}
          onCommit={(range) => onChange(range, 'replace')}
        />
      </Group>

      <Group title="Condition">
        {CONDITIONS.map((value) => {
          const on = params.conditions.includes(value);
          return (
            <Choice
              key={value} type="checkbox" checked={on} label={conditionLabel(value)} count={conditionCount(value)}
              onToggle={() => onChange({ conditions: on ? params.conditions.filter((c) => c !== value) : [...params.conditions, value] })}
            />
          );
        })}
      </Group>

      <Group title="Show only">
        <Choice
          type="checkbox" checked={params.withBids} label="Auctions with bids" count={facets?.withBids}
          onToggle={() => onChange({ withBids: !params.withBids })}
        />
      </Group>
    </>
  );
}
