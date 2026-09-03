import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Receipt, XCircle, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SellerNavbar, BuyerNavbar } from '../components/ui';
import { api } from '../services/api';
import { dateLong, pkr } from '../utils/format';
import LoadingStatus from '../components/ui/LoadingStatus';
import type { Invoice } from '../types/openapi';

const STATUS_LABEL: Record<Invoice['status'], string> = {
  PENDING: 'Payment Pending',
  COMPLETED: 'Paid — Awaiting Shipment',
  FAILED: 'Payment Failed',
  VOIDED: 'Cancelled',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  DISPUTED: 'Under Dispute',
  REFUNDED: 'Refunded',
};

export default function TransactionInvoice() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { transactionId } = useParams<{ transactionId: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!transactionId) return;
    api.get(`/payments/${transactionId}/invoice`)
      .then(setInvoice)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Could not load invoice.'))
      .finally(() => setLoading(false));
  }, [transactionId]);

  const Navbar = user?.role === 'SELLER' ? SellerNavbar : BuyerNavbar;

  return (
    <div className="min-h-screen bg-bg">
      <Navbar userName={user?.name} onLogout={logout} />

      <main className="max-w-[640px] mx-auto px-4 py-10">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-[13px] font-semibold text-muted hover:text-navy transition-colors cursor-pointer mb-6"
        >
          <ArrowLeft size={14} /> Back
        </button>

        {loading ? (
          <div className="bg-surface border border-border-light rounded-md py-16">
            <LoadingStatus label="Loading invoice" />
          </div>
        ) : error || !invoice ? (
          <div className="bg-surface border border-border-light rounded-md flex flex-col items-center justify-center py-20 text-center">
            <XCircle size={40} strokeWidth={1.3} className="text-error mx-auto mb-4" />
            <p className="font-bold text-[16px] text-navy mb-1">Could not load invoice</p>
            <p className="text-[13px] text-muted">{error}</p>
          </div>
        ) : (
          <div className="bg-surface border border-border-light rounded-xl overflow-hidden">
            <div className="bg-navy px-6 py-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt size={18} className="text-white/70" />
                <div>
                  <p className="font-extrabold text-[17px] text-white">{invoice.invoiceNumber}</p>
                  <p className="text-[12px] text-white/50">{dateLong(invoice.createdAt)}</p>
                </div>
              </div>
              <span className="bg-white/10 border border-white/20 font-semibold text-[11px] text-white px-3 py-1 rounded-full">
                {STATUS_LABEL[invoice.status]}
              </span>
            </div>

            <div className="p-6 flex flex-col gap-6">
              <div>
                <p className="text-[12px] text-muted mb-1">Item</p>
                <p className="font-bold text-[15px] text-navy">{invoice.auctionTitle}</p>
                <p className="text-[12px] text-placeholder">{invoice.category}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[12px] text-muted mb-1">Buyer</p>
                  <p className="font-semibold text-[13px] text-secondary">{invoice.buyerName}</p>
                  <p className="text-[12px] text-placeholder break-all">{invoice.buyerEmail}</p>
                </div>
                <div>
                  <p className="text-[12px] text-muted mb-1">Seller</p>
                  <p className="font-semibold text-[13px] text-secondary">{invoice.sellerName}</p>
                  <p className="text-[12px] text-placeholder break-all">{invoice.sellerEmail}</p>
                </div>
              </div>

              {invoice.deliveryAddress && (
                <div>
                  <p className="text-[12px] text-muted mb-1">Delivery Address</p>
                  <p className="text-[13px] text-secondary">{invoice.deliveryAddress}</p>
                  {invoice.deliveryPhone && <p className="text-[12px] text-placeholder">{invoice.deliveryPhone}</p>}
                </div>
              )}

              {invoice.disputeStatus && (
                <div className="bg-warning-bg border border-warning-border rounded-md px-3 py-2">
                  <p className="text-[12px] text-navy font-semibold flex items-center gap-1.5">
                    <ShieldAlert size={13} /> {invoice.disputeStatus === 'OPEN' ? 'Dispute under review' : 'Dispute resolved'}
                  </p>
                  {invoice.disputeReason && <p className="text-[11px] text-muted mt-1">Reason: "{invoice.disputeReason}"</p>}
                  {invoice.disputeResolutionNote && (
                    <p className="text-[11px] text-muted mt-1">Resolution: {invoice.disputeResolutionNote}</p>
                  )}
                </div>
              )}

              <div className="flex justify-between items-center bg-bg border border-border-light rounded-md px-4 py-3">
                <span className="text-[13px] text-muted">Amount Paid</span>
                <span className="font-extrabold text-[20px] text-success">{pkr(invoice.amount)}</span>
              </div>

              {invoice.paymentReference && (
                <p className="text-[11px] text-placeholder text-center">Payment reference: {invoice.paymentReference}</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
