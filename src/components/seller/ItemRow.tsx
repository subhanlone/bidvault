import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import JourneyBar from './JourneyBar';
import ItemDetails from './ItemDetails';
import { conditionLabel } from '../../utils/format';
import { ACTION_META, orderedActions, stageView, type Tone } from '../../utils/sellerItemStage';
import type { SellerItem, SellerItemAction } from '../../types/api';

const CAPTION: Record<Tone, string> = {
  primary: 'text-primary',
  warn: 'text-warning',
  err: 'text-error',
  info: 'text-info',
  ok: 'text-success-dark',
};

interface Props {
  item: SellerItem;
  now: number;
  expanded: boolean;
  onToggle: () => void;
  onAction: (action: SellerItemAction, item: SellerItem) => void;
  /** The action currently running on this item, if any. */
  pending: SellerItemAction | null;
}

const OUTLINE_LINK =
  'inline-flex items-center justify-center h-10 px-5 text-sm font-semibold rounded-lg bg-surface border border-border text-body ' +
  'hover:border-primary hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary';

/** One item, whatever stage it is in: what it is, where it stands, two figures, and what can be done. */
export default function ItemRow({ item, now, expanded, onToggle, onAction, pending }: Props) {
  const view = stageView(item, now);
  const actions = orderedActions(item.actions).slice(0, 2);
  const detailsId = `item-details-${item.itemId}`;

  return (
    <li className="border-b border-border-light last:border-b-0 list-none">
      {/* Wraps on narrower screens; from xl up it is one grid, so every row lines up whatever width its buttons need. */}
      <div className="flex flex-wrap items-center gap-x-7 gap-y-4 px-4 sm:px-5 py-4 xl:grid xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,0.75fr)_380px]">
        {/* The item */}
        <div className="flex-[1_1_280px] min-w-0 flex items-center gap-3.5">
          <div className="size-[52px] rounded-lg shrink-0 flex items-center justify-center bg-bg border border-border-light overflow-hidden">
            {item.imageUrl
              ? <img src={item.imageUrl} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              : <span className="text-2xl" aria-hidden="true">{item.emoji}</span>}
          </div>
          <div className="min-w-0">
            <p className="text-[14px] font-bold text-navy truncate">{item.title}</p>
            <p className="text-[12px] text-muted mt-0.5">{item.category} · {conditionLabel(item.condition)}</p>
            <p className="text-[11px] text-placeholder mt-0.5 tracking-[0.02em]">{item.listingCode}</p>
          </div>
        </div>

        {/* Where it stands */}
        <div className="flex-[1_1_240px] min-w-[200px]">
          <div className="mb-2"><JourneyBar journey={view.journey} tone={view.tone} /></div>
          <p className={`text-[13px] font-bold ${CAPTION[view.tone]}`}>{view.label}</p>
          {view.caption && <p className="text-[12px] text-muted mt-px">{view.caption}</p>}
        </div>

        {/* Two figures */}
        <dl className="flex-[1_1_160px] min-w-[150px] m-0 flex flex-col gap-1.5 items-start">
          <div>
            <dt className="text-[10px] font-bold text-placeholder uppercase tracking-[0.06em]">{view.facts[0].label}</dt>
            <dd className="m-0 text-[14px] font-bold text-navy">{view.facts[0].value}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold text-placeholder uppercase tracking-[0.06em]">{view.facts[1].label}</dt>
            <dd className="m-0 text-[13px] font-semibold text-secondary">{view.facts[1].value}</dd>
          </div>
        </dl>

        {/* Status and what can be done */}
        <div className="flex flex-col sm:flex-row xl:flex-col items-start sm:items-center xl:items-end sm:justify-between xl:justify-start gap-2 w-full">
          <Badge variant={view.badge.variant} className="whitespace-nowrap">{view.badge.label}</Badge>
          <div className="flex items-center gap-2 flex-wrap">
            {[...actions].reverse().map(action => {
              const meta = ACTION_META[action];
              if (action === 'VIEW_INVOICE' && item.sale) {
                return <Link key={action} to={`/transactions/${item.sale.transactionId}/invoice`} className={OUTLINE_LINK}>{meta.label}</Link>;
              }
              return (
                <Button
                  key={action}
                  variant={meta.filled ? 'primary' : 'outline'}
                  loading={pending === action}
                  disabled={pending !== null}
                  onClick={() => onAction(action, item)}
                >
                  {meta.label}
                </Button>
              );
            })}
            <button
              type="button"
              onClick={onToggle}
              aria-expanded={expanded}
              aria-controls={detailsId}
              aria-label={expanded ? `Hide details for ${item.title}` : `Show details for ${item.title}`}
              className="size-10 shrink-0 border border-border-light rounded-lg bg-surface text-tertiary flex items-center justify-center cursor-pointer hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <ChevronDown size={16} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {expanded && <ItemDetails item={item} now={now} id={detailsId} />}
    </li>
  );
}
