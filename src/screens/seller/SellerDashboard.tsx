import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Banknote, Gavel, PackageCheck, Clock, Star, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/auth';
import { api } from '../../services/api';
import { fetchAllMyListings } from '../../services/myListings';
import { SellerNavbar, Badge, Button, ErrorState, StatCard, ReasonModal } from '../../components/ui';
import type { Listing, SellerReview } from '../../types/api';
import { conditionLabel, dateShort, pkr } from '../../utils/format';
import { listingBadge } from '../../utils/listingStatus';
import LoadingStatus from '../../components/ui/LoadingStatus';

function StatCardSkeleton() {
  return (
    <div className="bg-surface border border-border-light rounded-md p-4 sm:p-5">
      <div className="h-3 w-24 bg-border-light rounded-md animate-pulse mb-3" />
      <div className="h-8 w-12 bg-border-light rounded-md animate-pulse" />
    </div>
  );
}

function ListingRowSkeleton() {
  return (
    <div className="border-b border-bg last:border-0">
      <div className="hidden sm:grid grid-cols-[40px_1fr_140px_110px_120px_90px] gap-4 items-center px-5 py-3.5">
        <div className="w-9 h-9 bg-border-light rounded-md animate-pulse" />
        <div>
          <div className="h-4 w-3/4 bg-border-light rounded-md animate-pulse mb-1.5" />
          <div className="h-3 w-1/3 bg-border-light rounded-md animate-pulse" />
        </div>
        <div className="h-4 w-20 bg-border-light rounded-md animate-pulse" />
        <div className="h-4 w-16 bg-border-light rounded-md animate-pulse" />
        <div className="h-5 w-24 bg-border-light rounded-full animate-pulse" />
        <div className="h-3 w-12 bg-border-light rounded-md animate-pulse" />
      </div>
      <div className="sm:hidden flex items-center gap-3 px-4 py-3">
        <div className="w-11 h-11 bg-border-light rounded-md animate-pulse flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="h-4 w-3/4 bg-border-light rounded-md animate-pulse mb-1.5" />
          <div className="h-3 w-1/2 bg-border-light rounded-md animate-pulse" />
        </div>
        <div className="h-5 w-16 bg-border-light rounded-full animate-pulse" />
      </div>
    </div>
  );
}

// The three requests are independent, so each can fail alone. Which one did is kept (not one
// generic "something failed"): every figure and panel needs to know whether *its* data is missing,
// because a 0 or an empty list drawn from a failed request is a claim about the seller's account.
const loadDashboard = (userId: string) =>
  Promise.allSettled([
    fetchAllMyListings(),
    api.get('/payments/seller-stats'),
    api.get(`/reviews/seller/${userId}`),
  ]);

type DashboardResult = Awaited<ReturnType<typeof loadDashboard>>;

export default function SellerDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [sellerStats, setSellerStats] = useState({ totalRevenue: 0, itemsSold: 0 });
  const [reviewStats, setReviewStats] = useState<{ average: number | null; count: number; reviews: SellerReview[] }>({ average: null, count: 0, reviews: [] });
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState({ listings: false, stats: false, reviews: false });
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

  const applyResult = useCallback(([listingsResult, statsResult, reviewsResult]: DashboardResult) => {
    if (listingsResult.status === 'fulfilled') setListings(listingsResult.value);
    if (statsResult.status === 'fulfilled') setSellerStats(statsResult.value);
    if (reviewsResult.status === 'fulfilled') setReviewStats(reviewsResult.value);
    setFailed({
      listings: listingsResult.status === 'rejected',
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

  // "Try again": back to the loading state, then all three requests again.
  function retryLoad() {
    if (!userId) return;
    setLoading(true);
    void loadDashboard(userId).then(applyResult);
  }

  const total    = listings.length;
  const pending  = listings.filter(l => l.status === 'PENDING').length;
  // A1, Phase 6: was `status === 'APPROVED'`, which counts a sold or cancelled listing as live
  // inventory the same as an actually-live one -- the exact bug A1 is about. isLive is derived
  // server-side from the auction join (see utils/listingStatus.ts).
  const live     = listings.filter(l => l.isLive).length;

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
          {loading ? (
            <><LoadingStatus label="Loading dashboard statistics" />{Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}</>
          ) : (
            <>
              <StatCard label="Revenue"            value={failed.stats ? '—' : pkr(sellerStats.totalRevenue)} icon={<Banknote size={18} />}     iconColor="success" padding="sm" />
              <StatCard label="Live Listings"      value={failed.listings ? '—' : live}                                                  icon={<Gavel size={18} />}        iconColor="info"    padding="sm" />
              <StatCard label="Items Sold"         value={failed.stats ? '—' : sellerStats.itemsSold}                                 icon={<PackageCheck size={18} />}  iconColor="success" padding="sm" />
              <StatCard label="Pending Review"     value={failed.listings ? '—' : pending}                                               icon={<Clock size={18} />}         iconColor="warning" padding="sm" />
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
            <h2 className="text-sm font-bold text-navy">My Listings</h2>
            {!loading && !failed.listings && total > 0 && <span className="text-xs text-muted">{total} listing{total !== 1 ? 's' : ''}</span>}
          </div>

          {loading ? (
            <div className="divide-y divide-bg">
              <LoadingStatus label="Loading your listings" />
              {Array.from({ length: 4 }).map((_, i) => <ListingRowSkeleton key={i} />)}
            </div>
          ) : failed.listings ? (
            <ErrorState title="Could not load your listings" onRetry={retryLoad} className="border-0 rounded-none" />
          ) : total === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <Package size={44} strokeWidth={1.3} className="text-placeholder mb-4" />
              <h3 className="text-base font-bold text-navy mb-2">No listings yet</h3>
              <p className="text-sm text-muted mb-5 max-w-xs">Create your first auction listing to start selling on BidVault.</p>
              <Button variant="primary" onClick={() => navigate('/seller/create-listing/step-1')}>
                Create Your First Listing
              </Button>
            </div>
          ) : (
            <>
              <div className="hidden sm:grid grid-cols-[40px_1fr_140px_110px_120px_90px] gap-4 px-5 py-2.5 text-[11px] font-bold text-placeholder uppercase tracking-wide border-b border-bg">
                <span /><span>Item</span><span>Category</span><span>Start Price</span><span>Status</span><span>Submitted</span>
              </div>
              <div className="divide-y divide-bg">
                {listings.map(l => {
                  const cfg = listingBadge(l);
                  return (
                    <div key={l.listingId}>
                      <div className="hidden sm:grid grid-cols-[40px_1fr_140px_110px_120px_90px] gap-4 items-center px-5 py-3.5 hover:bg-bg transition-colors">
                        <div className="w-9 h-9 bg-bg rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {l.imageUrl
                            ? <img src={l.imageUrl} alt={l.title} className="w-full h-full object-cover" />
                            : <span className="text-base">{l.emoji}</span>
                          }
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-secondary truncate">{l.title}</p>
                          <p className="text-[11px] text-placeholder">{conditionLabel(l.condition)}</p>
                        </div>
                        <p className="text-xs text-tertiary">{l.category}</p>
                        <p className="text-sm font-bold text-navy">{pkr(l.startPrice)}</p>
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                        <p className="text-[11px] text-placeholder">
                          {dateShort(l.submittedAt)}
                        </p>
                      </div>
                      <div className="sm:hidden flex items-center gap-3 px-4 py-3 hover:bg-bg transition-colors">
                        <div className="w-11 h-11 bg-bg rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {l.imageUrl
                            ? <img src={l.imageUrl} alt={l.title} className="w-full h-full object-cover" />
                            : <span className="text-lg">{l.emoji}</span>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-secondary truncate">{l.title}</p>
                          <p className="text-[11px] text-placeholder">{l.category} · {pkr(l.startPrice)}</p>
                        </div>
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
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
