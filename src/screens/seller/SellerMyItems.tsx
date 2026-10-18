import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PackageSearch, Search, X } from 'lucide-react';
import { useAuth } from '../../context/auth';
import { useListing } from '../../context/listing';
import { useToast } from '../../context/toast';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useDialog } from '../../hooks/useDialog';
import { useNow } from '../../hooks/useNow';
import { flattenPages } from '../../queries/auctions';
import {
  useCancelAuction,
  useMarkShipped,
  useOfferNextBidder,
  useRelist,
  useRespondToDispute,
  useSellerItems,
  useSellerItemsSummary,
  useWithdrawListing,
} from '../../queries/sellerItems';
import { SellerNavbar, Button, ErrorState, ReasonModal } from '../../components/ui';
import LoadingStatus from '../../components/ui/LoadingStatus';
import ItemRow from '../../components/seller/ItemRow';
import RespondToDisputeModal from '../../components/seller/RespondToDisputeModal';
import type { SellerItem, SellerItemAction } from '../../types/api';
import { EMPTY_TAB, TAB_LABELS, TAB_ORDER, isSellerItemTab, listAgainDraft } from '../../utils/sellerItemStage';
import { count } from '../../utils/format';

function RowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-5 py-4 border-b border-border-light last:border-0">
      <div className="size-[52px] bg-border-light rounded-lg animate-pulse shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="h-4 w-1/2 bg-border-light rounded-md animate-pulse mb-2" />
        <div className="h-3 w-1/3 bg-border-light rounded-md animate-pulse" />
      </div>
      <div className="hidden sm:block h-8 w-28 bg-border-light rounded-lg animate-pulse" />
    </div>
  );
}

function WithdrawDialog({ item, loading, onConfirm, onClose }: {
  item: SellerItem;
  loading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const dialogRef = useDialog<HTMLDivElement>(true, onClose);
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-4 z-50" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="withdraw-title"
        tabIndex={-1}
        className="bg-surface rounded-xl shadow-xl w-full max-w-[420px] p-6 focus:outline-none"
        onClick={e => e.stopPropagation()}
      >
        <h2 id="withdraw-title" className="font-bold text-[16px] text-navy mb-1">Withdraw item?</h2>
        <p className="text-[13px] text-muted mb-5">"{item.title}" will be removed from review. This cannot be undone.</p>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button variant="primary" className="flex-1" loading={loading} onClick={onConfirm}>Withdraw</Button>
        </div>
      </div>
    </div>
  );
}

export default function SellerMyItems() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const { clearDraft, updateDraft } = useListing();
  const now = useNow(30_000);

  // The tab lives in the address, so a refresh or the back button lands where the seller was.
  const [params, setParams] = useSearchParams();
  const tabParam = params.get('tab');
  const tab = isSellerItemTab(tabParam) ? tabParam : 'action';

  const [searchText, setSearchText] = useState('');
  const search = useDebouncedValue(searchText, 300);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pending, setPending] = useState<{ itemId: string; action: SellerItemAction } | null>(null);
  const [withdrawing, setWithdrawing] = useState<SellerItem | null>(null);
  const [cancelling, setCancelling] = useState<SellerItem | null>(null);
  const [responding, setResponding] = useState<SellerItem | null>(null);

  const itemsQuery = useSellerItems(tab, search);
  const summary = useSellerItemsSummary();
  const items = flattenPages(itemsQuery.data);

  const withdraw = useWithdrawListing();
  const cancel = useCancelAuction();
  const ship = useMarkShipped();
  const offer = useOfferNextBidder();
  const relist = useRelist();
  const respond = useRespondToDispute();

  function pickTab(next: typeof tab) {
    setParams(next === 'action' ? {} : { tab: next });
    setExpandedId(null);
  }

  /** Runs one action on one item, showing it as busy and reporting the outcome. */
  async function run(item: SellerItem, action: SellerItemAction, work: () => Promise<unknown>, done: { title: string; message: string }, failTitle: string) {
    setPending({ itemId: item.itemId, action });
    try {
      await work();
      showToast({ type: 'success', ...done });
    } catch (err: unknown) {
      showToast({ type: 'error', title: failTitle, message: err instanceof Error ? err.message : 'Please try again.' });
    } finally {
      setPending(null);
    }
  }

  function handleAction(action: SellerItemAction, item: SellerItem) {
    const transactionId = item.sale?.transactionId;
    switch (action) {
      case 'WITHDRAW':
        setWithdrawing(item);
        return;
      case 'CANCEL_AUCTION':
        setCancelling(item);
        return;
      case 'RESPOND_TO_DISPUTE':
        setResponding(item);
        return;
      case 'EDIT_RESUBMIT':
        navigate(`/seller/listings/${item.itemId}/edit`);
        return;
      case 'LIST_AGAIN':
        // The same create-listing form, filled in from this item; it goes through review like any new one.
        clearDraft();
        updateDraft(listAgainDraft(item));
        navigate('/seller/create-listing/step-1');
        return;
      case 'MARK_SHIPPED':
        if (transactionId) {
          void run(item, action, () => ship.mutateAsync({ transactionId }),
            { title: 'Marked as shipped', message: `"${item.title}" is on its way to the buyer.` }, 'Could not mark shipped');
        }
        return;
      case 'OFFER_NEXT_BIDDER':
        if (transactionId) {
          void run(item, action, () => offer.mutateAsync({ transactionId }),
            { title: 'Offer sent', message: 'The next-highest bidder has been offered this item.' }, 'Could not send the offer');
        }
        return;
      case 'RELIST':
        if (transactionId) {
          void run(item, action, () => relist.mutateAsync({ transactionId }),
            { title: 'Relisted', message: 'A new auction for this item is now live.' }, 'Could not relist');
        }
        return;
      case 'VIEW_INVOICE':
        // Drawn as a link by the row; nothing to do here.
        return;
    }
  }

  async function confirmWithdraw() {
    if (!withdrawing) return;
    const item = withdrawing;
    setPending({ itemId: item.itemId, action: 'WITHDRAW' });
    try {
      await withdraw.mutateAsync({ listingId: item.itemId });
      showToast({ type: 'success', title: 'Item withdrawn', message: `"${item.title}" has been withdrawn.` });
      setWithdrawing(null);
    } catch (err: unknown) {
      showToast({ type: 'error', title: 'Could not withdraw', message: err instanceof Error ? err.message : 'Please try again.' });
    } finally {
      setPending(null);
    }
  }

  const cancelAuctionId = cancelling?.auction?.auctionId;
  const respondTransactionId = responding?.sale?.transactionId;
  const searching = search.trim().length > 0;
  const total = summary.data ? Object.values(summary.data).reduce((a, b) => a + b, 0) : null;

  return (
    <div className="min-h-screen bg-bg">
      <SellerNavbar userName={user?.name} onLogout={logout} />

      <main className="max-w-[1180px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
          <div>
            <h1 className="text-[26px] font-extrabold text-navy tracking-[-0.02em]">My Items</h1>
            <p className="text-sm text-muted mt-0.5">
              {total === null ? ' ' : `${count(total, 'item')} in total`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <label className="relative block">
              <span className="sr-only">Search items</span>
              <Search size={16} className="absolute left-3 top-3 text-muted pointer-events-none" aria-hidden="true" />
              <input
                type="search"
                value={searchText}
                onChange={e => { setSearchText(e.target.value); setExpandedId(null); }}
                maxLength={100}
                placeholder="Search this tab by title or code"
                className="box-border w-[260px] max-w-full h-10 pl-9 pr-3 border border-border-strong rounded-md bg-surface text-[13px] text-navy placeholder:text-placeholder focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </label>
            <Button size="md" onClick={() => navigate('/seller/create-listing/step-1')}>List an item</Button>
          </div>
        </div>

        <div role="tablist" aria-label="Item stage" className="flex gap-0.5 border-b border-border-light overflow-x-auto mb-4">
          {TAB_ORDER.map(key => {
            const on = key === tab;
            const badge = summary.data?.[key];
            return (
              <button
                key={key}
                type="button"
                role="tab"
                id={`tab-${key}`}
                aria-selected={on}
                aria-controls="items-panel"
                onClick={() => pickTab(key)}
                className={`-mb-px flex items-center gap-2 px-4 py-3 text-sm font-bold whitespace-nowrap border-b-2 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                  ${on ? 'text-navy border-primary' : 'text-muted border-transparent hover:text-secondary'}`}
              >
                {TAB_LABELS[key]}
                {badge !== undefined && (
                  <span
                    className={`min-w-5 h-5 px-1.5 rounded-[10px] text-[11px] font-extrabold flex items-center justify-center
                      ${key === 'action' && badge > 0 ? 'bg-primary text-white' : on ? 'bg-navy text-white' : 'bg-border-light text-tertiary'}`}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div id="items-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
          {itemsQuery.isError ? (
            <ErrorState title="Could not load your items" onRetry={() => void itemsQuery.refetch()} retrying={itemsQuery.isFetching} />
          ) : itemsQuery.isLoading ? (
            <div className="bg-surface border border-border-light rounded-lg overflow-hidden">
              <LoadingStatus label="Loading your items" />
              {Array.from({ length: 4 }).map((_, i) => <RowSkeleton key={i} />)}
            </div>
          ) : items.length === 0 ? (
            <div className="bg-surface border border-border-light rounded-lg flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="bg-surface-raised rounded-full p-4 mb-4"><PackageSearch size={40} strokeWidth={1.3} className="text-placeholder" /></div>
              {searching ? (
                <>
                  <h2 className="font-bold text-[16px] text-navy mb-1">No items match "{search.trim()}"</h2>
                  <p className="text-[13px] text-muted mb-5 max-w-xs">Searching looks at the title and the item code, inside {TAB_LABELS[tab]} only.</p>
                  <Button variant="outline" onClick={() => setSearchText('')}><X size={14} /> Clear search</Button>
                </>
              ) : (
                <>
                  <h2 className="font-bold text-[16px] text-navy mb-1">{EMPTY_TAB[tab].heading}</h2>
                  <p className="text-[13px] text-muted max-w-xs">{EMPTY_TAB[tab].sub}</p>
                </>
              )}
            </div>
          ) : (
            <>
              <ul
                aria-busy={itemsQuery.isPlaceholderData}
                className={`bg-surface border border-border-light rounded-lg overflow-hidden m-0 p-0 transition-opacity ${itemsQuery.isPlaceholderData ? 'opacity-60' : ''}`}
              >
                {items.map(item => (
                  <ItemRow
                    key={item.itemId}
                    item={item}
                    now={now}
                    expanded={expandedId === item.itemId}
                    onToggle={() => setExpandedId(expandedId === item.itemId ? null : item.itemId)}
                    onAction={handleAction}
                    pending={pending?.itemId === item.itemId ? pending.action : null}
                  />
                ))}
              </ul>
              {itemsQuery.hasNextPage && (
                <div className="flex justify-center mt-4">
                  <Button variant="outline" loading={itemsQuery.isFetchingNextPage} onClick={() => void itemsQuery.fetchNextPage()}>
                    Show more
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {withdrawing && (
        <WithdrawDialog
          item={withdrawing}
          loading={pending?.action === 'WITHDRAW'}
          onConfirm={() => void confirmWithdraw()}
          onClose={() => setWithdrawing(null)}
        />
      )}

      {cancelling && cancelAuctionId && (
        <ReasonModal
          title="Cancel Auction"
          subject={cancelling.title}
          description="This stops the auction immediately. No sale or charge will result, and it can't be undone."
          submitLabel="Cancel Auction"
          fieldLabel="Reason"
          placeholder="e.g. Changed my mind about selling this"
          onSubmit={async reason => {
            await cancel.mutateAsync({ auctionId: cancelAuctionId, reason });
            showToast({ type: 'success', title: 'Auction cancelled', message: `"${cancelling.title}" has been cancelled.` });
            setCancelling(null);
          }}
          onClose={() => setCancelling(null)}
        />
      )}

      {responding && respondTransactionId && (
        <RespondToDisputeModal
          item={responding}
          onSubmit={async response => {
            await respond.mutateAsync({ transactionId: respondTransactionId, response });
            showToast({ type: 'success', title: 'Response sent', message: 'An admin will read it before deciding.' });
            setResponding(null);
          }}
          onClose={() => setResponding(null)}
        />
      )}
    </div>
  );
}
