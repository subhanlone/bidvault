import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Truck, ShieldAlert, CheckCircle2, Receipt, RotateCcw, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/auth';
import { useToast } from '../../context/toast';
import { api } from '../../services/api';
import { SellerNavbar, Badge, Button, ErrorState } from '../../components/ui';
import { dateMedium, pkr } from '../../utils/format';
import LoadingStatus from '../../components/ui/LoadingStatus';

type TransactionStatus =
  | 'PENDING' | 'COMPLETED' | 'FAILED' | 'VOIDED'
  | 'SHIPPED' | 'DELIVERED' | 'DISPUTED' | 'REFUNDED';

interface SellerSale {
  transactionId: string;
  auctionId: string;
  auctionTitle: string;
  auctionEmoji: string;
  auctionImageUrl: string;
  buyerName: string;
  finalAmount: number;
  status: TransactionStatus;
  deliveryAddress?: string;
  deliveryPhone?: string;
  shippedAt?: string;
  reviewDeadlineAt?: string;
  disputeReason?: string;
  createdAt: string;
}

const STATUS_CONFIG: Partial<Record<TransactionStatus, { label: string; variant: 'warning' | 'success' | 'error' | 'tag' }>> = {
  COMPLETED: { label: 'Ready to Ship',  variant: 'warning' },
  SHIPPED:   { label: 'Shipped',        variant: 'tag'     },
  DELIVERED: { label: 'Delivered',      variant: 'success' },
  DISPUTED:  { label: 'Disputed',       variant: 'error'   },
  REFUNDED:  { label: 'Refunded',       variant: 'tag'     },
  // A3/A5, Phase 6: the winner didn't pay in time and the worker auto-voided the sale — the
  // seller now has two ways to recover it instead of the item being stuck forever.
  VOIDED:    { label: 'Buyer Didn\'t Pay', variant: 'error' },
};

// Sales still awaiting payment or a failed card have nothing for the seller to do here — this
// screen is about the post-payment half of the sale, plus VOIDED's own recovery actions.
const RELEVANT_STATUSES: TransactionStatus[] = ['COMPLETED', 'SHIPPED', 'DELIVERED', 'DISPUTED', 'REFUNDED', 'VOIDED'];

// Every page of the seller's sales, keeping only the ones this screen is about. A plain function
// outside the component: the load effect then depends on nothing but the signed-in user, and the
// action handlers can reload through it too.
async function fetchAllSales(): Promise<SellerSale[]> {
  const all: SellerSale[] = [];
  let cursor: string | null = null;
  do {
    const page: { items: SellerSale[]; nextCursor: string | null } = await api.get(
      cursor ? `/payments/my-sales?limit=100&cursor=${encodeURIComponent(cursor)}` : '/payments/my-sales?limit=100',
    );
    all.push(...page.items);
    cursor = page.nextCursor;
  } while (cursor);
  return all.filter(s => RELEVANT_STATUSES.includes(s.status));
}

export default function SellerMySales() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [sales, setSales] = useState<SellerSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shippingId, setShippingId] = useState<string | null>(null);
  const [recoveringId, setRecoveringId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<{ id: string; message: string } | null>(null);

  const loadSales = async () => { setSales(await fetchAllSales()); };

  const userId = user?.userId;
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    fetchAllSales()
      .then(all => { if (!cancelled) setSales(all); })
      .catch(() => { if (!cancelled) setError('Could not load your sales. Please try again.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [userId]);

  // "Try again": back to the loading state, then the same request the first load makes.
  function retryLoad() {
    setError(null);
    setLoading(true);
    fetchAllSales()
      .then(setSales)
      .catch(() => setError('Could not load your sales. Please try again.'))
      .finally(() => setLoading(false));
  }

  // A5, Phase 6: both recovery actions on a VOIDED sale — offering it to the next-highest
  // bidder at their own last bid, or relisting it as a fresh listing + auction.
  async function handleOfferNextBidder(sale: SellerSale) {
    setActionError(null);
    setRecoveringId(sale.transactionId);
    try {
      await api.post(`/payments/${sale.transactionId}/offer-next-bidder`);
      showToast({ type: 'success', title: 'Offer Sent', message: 'The next-highest bidder has been offered this item.' });
      await loadSales();
    } catch (err: unknown) {
      setActionError({ id: sale.transactionId, message: err instanceof Error ? err.message : 'Could not send the offer.' });
    } finally {
      setRecoveringId(null);
    }
  }

  async function handleRelist(sale: SellerSale) {
    setActionError(null);
    setRecoveringId(sale.transactionId);
    try {
      await api.post(`/payments/${sale.transactionId}/relist`);
      showToast({ type: 'success', title: 'Relisted', message: 'A new auction for this item is now live.' });
      await loadSales();
    } catch (err: unknown) {
      setActionError({ id: sale.transactionId, message: err instanceof Error ? err.message : 'Could not relist this item.' });
    } finally {
      setRecoveringId(null);
    }
  }

  async function handleMarkShipped(sale: SellerSale) {
    setActionError(null);
    setShippingId(sale.transactionId);
    try {
      await api.patch(`/payments/${sale.transactionId}/ship`);
      await loadSales();
    } catch (err: unknown) {
      setActionError({ id: sale.transactionId, message: err instanceof Error ? err.message : 'Could not mark shipped.' });
    } finally {
      setShippingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      <SellerNavbar userName={user?.name} onLogout={logout} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6">
          <h1 className="text-xl font-extrabold text-navy">My Sales</h1>
          <p className="text-sm text-muted mt-0.5">
            {loading ? 'Loading…' : error ? 'Could not load your sales' : `${sales.length} sale${sales.length !== 1 ? 's' : ''} awaiting or past shipment`}
          </p>
        </div>

        {error && !loading ? (
          <ErrorState title="Could not load your sales" onRetry={retryLoad} />
        ) : (
        <div className="bg-surface border border-border-light rounded-md overflow-hidden">
          {loading ? (
            <div className="divide-y divide-bg">
              <LoadingStatus label="Loading your sales" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-4">
                  <div className="w-9 h-9 bg-border-light rounded-md animate-pulse" />
                  <div className="flex-1">
                    <div className="h-4 w-1/2 bg-border-light rounded-md animate-pulse mb-1.5" />
                    <div className="h-3 w-1/3 bg-border-light rounded-md animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : sales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <Package size={40} strokeWidth={1.3} className="text-placeholder mb-4" />
              <h3 className="font-bold text-[16px] text-navy mb-1">No sales yet</h3>
              <p className="text-[13px] text-muted">Once a buyer pays for one of your auctions, it will show up here.</p>
            </div>
          ) : (
            <div className="divide-y divide-bg">
              {sales.map(s => {
                const cfg = STATUS_CONFIG[s.status] ?? { label: s.status, variant: 'tag' as const };
                return (
                  <div key={s.transactionId} className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 bg-bg rounded-md overflow-hidden shrink-0 flex items-center justify-center border border-border-light">
                        {s.auctionImageUrl
                          ? <img src={s.auctionImageUrl} alt={s.auctionTitle} className="w-full h-full object-cover" />
                          : <span className="text-base">{s.auctionEmoji}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <p className="text-[13px] font-semibold text-secondary truncate">{s.auctionTitle}</p>
                          <Badge variant={cfg.variant}>{cfg.label}</Badge>
                        </div>
                        <p className="text-[11px] text-placeholder mt-0.5">
                          Buyer: {s.buyerName} · {pkr(s.finalAmount)} · {dateMedium(s.createdAt)}
                        </p>

                        {(s.status === 'COMPLETED' || s.status === 'SHIPPED' || s.status === 'DISPUTED') && s.deliveryAddress && (
                          <div className="mt-2 text-[12px] text-tertiary bg-bg border border-border-light rounded-md px-3 py-2">
                            <p><span className="font-semibold text-navy">Ship to:</span> {s.deliveryAddress}</p>
                            {s.deliveryPhone && <p className="mt-0.5">{s.deliveryPhone}</p>}
                          </div>
                        )}

                        {s.status === 'DISPUTED' && s.disputeReason && (
                          <p className="mt-2 text-[12px] text-error bg-error-bg border border-error-border rounded-md px-3 py-2 flex items-start gap-1.5">
                            <ShieldAlert size={13} className="shrink-0 mt-[1px]" />
                            Buyer reported: "{s.disputeReason}" — an admin is reviewing this.
                          </p>
                        )}

                        {s.status === 'SHIPPED' && s.reviewDeadlineAt && (
                          <p className="mt-2 text-[11px] text-muted">
                            Payout releases automatically by {dateMedium(s.reviewDeadlineAt)} if the buyer doesn't respond sooner.
                          </p>
                        )}

                        {actionError && actionError.id === s.transactionId && (
                          <p className="mt-2 text-[12px] text-error bg-error-bg border border-error-border rounded-md px-3 py-2">
                            {actionError.message}
                          </p>
                        )}

                        {s.status === 'COMPLETED' && (
                          <Button
                            size="sm"
                            className="mt-3"
                            loading={shippingId === s.transactionId}
                            onClick={() => handleMarkShipped(s)}
                          >
                            <Truck size={14} /> Mark as Shipped
                          </Button>
                        )}

                        {s.status === 'VOIDED' && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            <p className="basis-full text-[12px] text-muted mb-0.5">
                              The buyer didn't complete payment in time. Offer it to the next-highest bidder, or relist it.
                            </p>
                            <Button
                              size="sm"
                              variant="outline"
                              loading={recoveringId === s.transactionId}
                              onClick={() => handleOfferNextBidder(s)}
                            >
                              <UserPlus size={14} /> Offer to Next Bidder
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              loading={recoveringId === s.transactionId}
                              onClick={() => handleRelist(s)}
                            >
                              <RotateCcw size={14} /> Relist
                            </Button>
                          </div>
                        )}

                        {s.status === 'DELIVERED' && (
                          <div className="mt-2 flex items-center justify-between gap-3">
                            <p className="text-[12px] text-success font-semibold flex items-center gap-1.5">
                              <CheckCircle2 size={13} /> Delivered — payout sent
                            </p>
                            <Link
                              to={`/transactions/${s.transactionId}/invoice`}
                              className="text-[12px] font-semibold text-primary hover:underline flex items-center gap-1 shrink-0"
                            >
                              <Receipt size={13} /> Invoice
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        )}

        <p className="text-[12px] text-muted mt-4">
          Track your earnings on your <Link to="/seller/profile" className="text-primary font-semibold">Profile</Link> page.
        </p>
      </main>
    </div>
  );
}
