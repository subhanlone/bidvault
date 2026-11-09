import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RealtimeBridge } from './queries/RealtimeBridge';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ListingProvider } from './context/ListingContext';
import { ToastProvider } from './context/ToastContext';
import ToastContainer from './components/ToastContainer';
import ProtectedRoute from './components/ProtectedRoute';

const LandingPage = lazy(() => import('./screens/LandingPage'));
const NotFound = lazy(() => import('./screens/NotFound'));
const MaintenancePage = lazy(() => import('./screens/MaintenancePage'));
const PrivacyPolicy = lazy(() => import('./screens/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./screens/TermsOfService'));
const RegisterScreen = lazy(() => import('./screens/auth/RegisterScreen'));
const EmailVerificationScreen = lazy(() => import('./screens/auth/EmailVerificationScreen'));
const LoginScreen = lazy(() => import('./screens/auth/LoginScreen'));
const ForgotPasswordScreen = lazy(() => import('./screens/auth/ForgotPasswordScreen'));

const AdminDashboardOverview = lazy(() => import('./screens/admin/AdminDashboardOverview'));
const AdminListingReview = lazy(() => import('./screens/admin/AdminListingReview'));
const AdminLiveAuctions = lazy(() => import('./screens/admin/AdminLiveAuctions'));
const AdminAuctionMonitor = lazy(() => import('./screens/admin/AdminAuctionMonitor'));
const AdminListingReviews = lazy(() => import('./screens/admin/AdminListingReviews'));
const AdminAnalytics = lazy(() => import('./screens/admin/AdminAnalytics'));
const AdminTransactions = lazy(() => import('./screens/admin/AdminTransactions'));
const AdminUsers = lazy(() => import('./screens/admin/AdminUsers'));
const AdminSettings = lazy(() => import('./screens/admin/AdminSettings'));

const SellerDashboard = lazy(() => import('./screens/seller/SellerDashboard'));
const SellerMyItems = lazy(() => import('./screens/seller/SellerMyItems'));
const SellerEditListing = lazy(() => import('./screens/seller/SellerEditListing'));
const SellerCreateListingStep1 = lazy(() => import('./screens/seller/SellerCreateListingStep1'));
const SellerCreateListingStep2 = lazy(() => import('./screens/seller/SellerCreateListingStep2'));
const SellerCreateListingStep3 = lazy(() => import('./screens/seller/SellerCreateListingStep3'));
const SellerListingSubmitted = lazy(() => import('./screens/seller/SellerListingSubmitted'));
const SellerProfile = lazy(() => import('./screens/seller/SellerProfile'));
const BecomeSeller = lazy(() => import('./screens/seller/BecomeSeller'));

// Open to anyone, signed in or not.
const BrowseAuctions = lazy(() => import('./screens/public/BrowseAuctions'));
const AuctionPage = lazy(() => import('./screens/public/AuctionPage'));
const PublicSellerProfile = lazy(() => import('./screens/public/SellerProfile'));

const BuyerMyBids = lazy(() => import('./screens/buyer/BuyerMyBids'));
const BuyerWatchlist = lazy(() => import('./screens/buyer/BuyerWatchlist'));
const BuyerAuctionWon = lazy(() => import('./screens/buyer/BuyerAuctionWon'));
const BuyerMyWins = lazy(() => import('./screens/buyer/BuyerMyWins'));
const BuyerProfile = lazy(() => import('./screens/buyer/BuyerProfile'));

const TransactionInvoice = lazy(() => import('./screens/TransactionInvoice'));


/**
 * One client for the app's lifetime. staleTime 30s: the socket bridge pushes the changes that
 * matter, so a remount need not refetch. retry 1 rather than 3, because a failed read is shown to
 * the user at once and a screen cannot say "couldn't load" while it is still retrying.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
});

export default function App() {
  // ErrorBoundary sits outermost, above the router and every provider: a throw inside any
  // of them would otherwise blank the page with nothing rendered to recover from.
  return (
    <ErrorBoundary area="app">
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ListingProvider>
              <ToastProvider>
                <RealtimeBridge />
                <ToastContainer />
                {/* Page content is max-w-5xl (1024px) on most screens; AuctionPage uses
                   max-w-[1100px] for its two columns. Do not change these per screen. */}
                <Suspense
                  fallback={
                    <div className="min-h-screen bg-bg flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full border-2 border-border border-t-primary animate-spin" />
                    </div>
                  }
                >
                  <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="/terms" element={<TermsOfService />} />
                    <Route path="/maintenance" element={<MaintenancePage />} />

                    {/* Public auth routes */}
                    <Route path="/register" element={<RegisterScreen />} />
                    <Route path="/email-verification" element={<EmailVerificationScreen />} />
                    <Route path="/login" element={<LoginScreen />} />
                    <Route path="/forgot-password" element={<ForgotPasswordScreen />} />

                    {/* Admin routes */}
                    <Route path="/admin/dashboard" element={
                      <ProtectedRoute allowedRoles={['ADMIN']}>
                        <AdminDashboardOverview />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/listing-review/:listingId" element={
                      <ProtectedRoute allowedRoles={['ADMIN']}>
                        <AdminListingReview />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/live-auctions" element={
                      <ProtectedRoute allowedRoles={['ADMIN']}>
                        <AdminLiveAuctions />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/monitor/:auctionId" element={
                      <ProtectedRoute allowedRoles={['ADMIN']}>
                        <AdminAuctionMonitor />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/listing-reviews" element={
                      <ProtectedRoute allowedRoles={['ADMIN']}>
                        <AdminListingReviews />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/analytics" element={
                      <ProtectedRoute allowedRoles={['ADMIN']}>
                        <AdminAnalytics />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/transactions" element={
                      <ProtectedRoute allowedRoles={['ADMIN']}>
                        <AdminTransactions />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/users" element={
                      <ProtectedRoute allowedRoles={['ADMIN']}>
                        <AdminUsers />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/settings" element={
                      <ProtectedRoute allowedRoles={['ADMIN']}>
                        <AdminSettings />
                      </ProtectedRoute>
                    } />

                    {/* Any signed-in account can become a seller; a seller who opens this goes on to the dashboard. */}
                    <Route path="/become-a-seller" element={
                      <ProtectedRoute allowedRoles={['BUYER']}>
                        <BecomeSeller />
                      </ProtectedRoute>
                    } />

                    {/* Seller routes */}
                    <Route path="/seller/dashboard" element={
                      <ProtectedRoute allowedRoles={['SELLER']}>
                        <SellerDashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/seller/items" element={
                      <ProtectedRoute allowedRoles={['SELLER']}>
                        <SellerMyItems />
                      </ProtectedRoute>
                    } />
                    <Route path="/seller/listings/:listingId/edit" element={
                      <ProtectedRoute allowedRoles={['SELLER']}>
                        <SellerEditListing />
                      </ProtectedRoute>
                    } />
                    <Route path="/seller/create-listing/step-1" element={
                      <ProtectedRoute allowedRoles={['SELLER']}>
                        <SellerCreateListingStep1 />
                      </ProtectedRoute>
                    } />
                    <Route path="/seller/create-listing/step-2" element={
                      <ProtectedRoute allowedRoles={['SELLER']}>
                        <SellerCreateListingStep2 />
                      </ProtectedRoute>
                    } />
                    <Route path="/seller/create-listing/step-3" element={
                      <ProtectedRoute allowedRoles={['SELLER']}>
                        <SellerCreateListingStep3 />
                      </ProtectedRoute>
                    } />
                    <Route path="/seller/listing-submitted" element={
                      <ProtectedRoute allowedRoles={['SELLER']}>
                        <SellerListingSubmitted />
                      </ProtectedRoute>
                    } />
                    <Route path="/seller/profile" element={
                      <ProtectedRoute allowedRoles={['SELLER']}>
                        <SellerProfile />
                      </ProtectedRoute>
                    } />

                    {/* Public: anyone can look; bidding and watching ask for an account on the page itself. */}
                    <Route path="/browse" element={<BrowseAuctions />} />
                    <Route path="/auctions/:auctionId" element={<AuctionPage />} />
                    <Route path="/sellers/:sellerId" element={<PublicSellerProfile />} />

                    {/* Buyer routes */}
                    <Route path="/buyer/my-bids" element={
                      <ProtectedRoute allowedRoles={['BUYER']}>
                        <BuyerMyBids />
                      </ProtectedRoute>
                    } />
                    <Route path="/buyer/watchlist" element={
                      <ProtectedRoute allowedRoles={['BUYER']}>
                        <BuyerWatchlist />
                      </ProtectedRoute>
                    } />
                    <Route path="/buyer/auction-won/:auctionId" element={
                      <ProtectedRoute allowedRoles={['BUYER']}>
                        <BuyerAuctionWon />
                      </ProtectedRoute>
                    } />
                    <Route path="/buyer/my-wins" element={
                      <ProtectedRoute allowedRoles={['BUYER']}>
                        <BuyerMyWins />
                      </ProtectedRoute>
                    } />
                    <Route path="/buyer/profile" element={
                      <ProtectedRoute allowedRoles={['BUYER']}>
                        <BuyerProfile />
                      </ProtectedRoute>
                    } />

                    {/* Shared: transaction invoice, reached from BuyerMyWins / SellerMyItems */}
                    <Route path="/transactions/:transactionId/invoice" element={
                      <ProtectedRoute allowedRoles={['BUYER', 'SELLER', 'ADMIN']}>
                        <TransactionInvoice />
                      </ProtectedRoute>
                    } />

                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </ToastProvider>
            </ListingProvider>
          </AuthProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
