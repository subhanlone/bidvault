import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Banknote, Gavel, PackageCheck, Clock, Star, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/auth';
import { api } from '../../services/api';
import { useSellerItemsSummary } from '../../queries/sellerItems';
import { SellerNavbar, Button, ErrorState, StatCard, ReasonModal } from '../../components/ui';
import type { SellerReview } from '../../types/api';
import { TAB_LABELS, TAB_ORDER } from '../../utils/sellerItemStage';
import { dateShort, pkr } from '../../utils/format';
import LoadingStatus from '../../components/ui/LoadingStatus';

function StatCardSkeleton() {
  return (
    <div className="bg-surface border border-border-light rounded-md p-4 sm:p-5">
      <div className="h-3 w-24 bg-border-light rounded-md animate-pulse mb-3" />
      <div className="h-8 w-12 bg-border-light rounded-md animate-pulse" />
    </div>
  );
}

// The two requests are independent, so each can fail alone. Which one did is kept (not one generic
// "something failed"): every figure and panel needs to know whether *its* data is missing, because
// a 0 or an empty list drawn from a failed request is a claim about the seller's account. The item
// counts come from the My Items summary, which is its own query below.
const loadDashboard = (userId: string) =>
  Promise.allSettled([
    api.get('/payments/seller-stats'),
    api.get(`/reviews/seller/${userId}`),
  ]);

type DashboardResult = Awaited<ReturnType<typeof loadDashboard>>;

export default function SellerDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const summary = useSellerItemsSummary();
  const [sellerStats, setSellerStats] = useState({ totalRevenue: 0, itemsSold: 0 });
  const [reviewStats, setReviewStats] = useState<{ average: number | null; count: number; reviews: SellerReview[] }>({ average: null, count: 0, reviews: [] });
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState({ stats: false, reviews: false });
  const [replyingTo, setReplyingTo] = useState<SellerReview | null>(null);

  // C6, Phase 7: a one-shot reply, submitted through the same reason-prompt shape the cancel
  // actions use — one required text field, nothing more.
  async function handleReply(reply: string) {
    if (!replyingTo) return;
    const updated = await api.post(`/reviews/${replyingTo.reviewId}/reply`, { reply });
    setReviewStats(prev => ({
      ...prev,
      reviews: prev.reviews.map(r => r.reviewId === replyingTo.reviewId
        ? { ...r, sellerReply: updated.sellerReply, sellerReplyAt: updated.sellerReplyAt }
        : r),
    }));
    setReplyingTo(null);
  }

  const applyResult = useCallback(([statsResult, reviewsResult]: DashboardResult) => {
    if (statsResult.status === 'fulfilled') setSellerStats(statsResult.value);
    if (reviewsResult.status === 'fulfilled') setReviewStats(reviewsResult.value);
    setFailed({
      stats: statsResult.status === 'rejected',
      reviews: reviewsResult.status === 'rejected',
    });
    setLoading(false);
  }, []);

  const userId = user?.userId;
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    void loadDashboard(userId).then(result => { if (!cancelled) applyResult(result); });
    return () => { cancelled = true; };
  }, [userId, applyResult]);

  // "Try again": back to the loading state, then both requests again.
  function retryLoad() {
    if (!userId) return;
    setLoading(true);
    void loadDashboard(userId).then(applyResult);
  }

  // The server decides which tab each item is in, so "live" here is an auction that is actually
  // running, not a listing that was once approved (A1, Phase 6), and nothing is counted twice.
  const counts = summary.data;
  const total = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : 0;
  const countsLoading = summary.isLoading;
  const countsFailed = summary.isError;

  return (
    <div className="min-h-screen bg-bg">
      <SellerNavbar userName={user?.name} onLogout={logout} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-extrabold text-navy">Seller Dashboard</h1>
            <p className="text-sm text-muted mt-0.5">Manage your listings and track auction performance</p>
          </div>
          <Button variant="primary" size="sm" onClick={() => navigate('/seller/create-listing/step-1')}>
            <span className="hidden sm:inline">Create New Listing</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {loading || countsLoading ? (
            <><LoadingStatus label="Loading dashboard statistics" />{Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}</>
          ) : (
            <>
              <StatCard label="Revenue"            value={failed.stats ? '—' : pkr(sellerStats.totalRevenue)} icon={<Banknote size={18} />}     iconColor="success" padding="sm" />
              <StatCard label="Live Listings"      value={countsFailed ? '—' : counts?.live ?? '—'}          icon={<Gavel size={18} />}        iconColor="info"    padding="sm" />
              <StatCard label="Items Sold"         value={failed.stats ? '—' : sellerStats.itemsSold}        icon={<PackageCheck size={18} />}  iconColor="success" padding="sm" />
              <StatCard label="Pending Review"     value={countsFailed ? '—' : counts?.review ?? '—'}       icon={<Clock size={18} />}         iconColor="warning" padding="sm" />
            </>
          )}
        </div>

        <div className="bg-surface border border-border-light rounded-md p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-navy">Reviews</h2>
            {!loading && !failed.reviews && (
              <span className="text-xs text-muted">
                {reviewStats.average !== null ? `${reviewStats.average} ★ average · ` : ''}
                {reviewStats.count} review{reviewStats.count !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          {loading ? (
            <div className="h-12 bg-border-light rounded-md animate-pulse" />
          ) : failed.reviews ? (
            <ErrorState title="Could not load your reviews" onRetry={retryLoad} className="border-0 rounded-none py-8" />
          ) : reviewStats.count === 0 ? (
            <p className="text-sm text-muted text-center py-4">No reviews yet — they'll show up here after buyers rate completed purchases.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {reviewStats.reviews.slice(0, 5).map(r => (
                <div key={r.reviewId} className="border-b border-bg last:border-0 pb-3 last:pb-0">
                  <div className="flex items-center gap-1 mb-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        className={i < r.stars ? 'text-gold' : 'text-border-medium'}
                        fill={i < r.stars ? 'currentColor' : 'none'}
                      />
                    ))}
                    <span className="text-[11px] text-placeholder ml-1">
                      {dateShort(r.createdAt)}
                    </span>
                  </div>
                  {r.comment && <p className="text-[13px] text-secondary">{r.comment}</p>}
                  {r.sellerReply ? (
                    <div className="mt-2 ml-3 pl-3 border-l-2 border-border-light">
                      <p className="text-[11px] font-bold text-navy">Your reply</p>
                      <p className="text-[12px] text-tertiary">{r.sellerReply}</p>
                    </div>
                  ) : (
                    <button
                      onClick={() => setReplyingTo(r)}
                      className="mt-1.5 flex items-center gap-1 text-[11px] font-bold text-primary cursor-pointer"
                    >
                      <MessageSquare size={11} /> Reply
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-surface border border-border-light rounded-md">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border-light">
            <h2 className="text-sm font-bold text-navy">My Items</h2>
            <Link to="/seller/items" className="text-xs font-bold text-primary hover:underline">View all →</Link>
          </div>

          {countsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-5">
              <LoadingStatus label="Loading your items" />
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-16 bg-border-light rounded-md animate-pulse" />)}
            </div>
          ) : countsFailed ? (
            <ErrorState title="Could not load your items" onRetry={() => void summary.refetch()} className="border-0 rounded-none" />
          ) : total === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <Package size={44} strokeWidth={1.3} className="text-placeholder mb-4" />
              <h3 className="text-base font-bold text-navy mb-2">No items yet</h3>
              <p className="text-sm text-muted mb-5 max-w-xs">Create your first auction listing to start selling on BidVault.</p>
              <Button variant="primary" onClick={() => navigate('/seller/create-listing/step-1')}>
                Create Your First Listing
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-5">
              {TAB_ORDER.map(tab => {
                const n = counts?.[tab] ?? 0;
                const attention = tab === 'action' && n > 0;
                return (
                  <Link
                    key={tab}
                    to={tab === 'action' ? '/seller/items' : `/seller/items?tab=${tab}`}
                    className={`rounded-md border px-4 py-3 transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                      ${attention ? 'border-primary bg-primary-light' : 'border-border-light bg-bg'}`}
                  >
                    <p className={`text-[22px] font-extrabold ${attention ? 'text-primary' : 'text-navy'}`}>{n}</p>
                    <p className="text-[12px] font-semibold text-tertiary">{TAB_LABELS[tab]}</p>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {replyingTo && (
        <ReasonModal
          title="Reply to Review"
          subject={replyingTo.comment ? `"${replyingTo.comment}"` : `${replyingTo.stars}-star review`}
          description="Visible to anyone viewing this review. You can only reply once, so make it count."
          submitLabel="Post Reply"
          fieldLabel="Your reply"
          placeholder="Thank the buyer, or address their feedback"
          onSubmit={handleReply}
          onClose={() => setReplyingTo(null)}
        />
      )}
    </div>
  );
}
