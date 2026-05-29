import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AuctionProvider } from './context/AuctionContext';
import { ListingProvider } from './context/ListingContext';
import { ToastProvider } from './context/ToastContext';
import ToastContainer from './components/ToastContainer';
import ProtectedRoute from './components/ProtectedRoute';

const LandingPage = lazy(() => import('./screens/LandingPage'));
const NotFound = lazy(() => import('./screens/NotFound'));
const PrivacyPolicy = lazy(() => import('./screens/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./screens/TermsOfService'));
const RegisterScreen = lazy(() => import('./screens/auth/RegisterScreen'));
const EmailVerificationScreen = lazy(() => import('./screens/auth/EmailVerificationScreen'));
const LoginScreen = lazy(() => import('./screens/auth/LoginScreen'));
const ForgotPasswordScreen = lazy(() => import('./screens/auth/ForgotPasswordScreen'));

const AdminDashboardOverview = lazy(() => import('./screens/admin/AdminDashboardOverview'));
const AdminListingReview = lazy(() => import('./screens/admin/AdminListingReview'));
const AdminLiveAuctions = lazy(() => import('./screens/admin/AdminLiveAuctions'));
const AdminListingReviews = lazy(() => import('./screens/admin/AdminListingReviews'));
const AdminAnalytics = lazy(() => import('./screens/admin/AdminAnalytics'));
const AdminSettings = lazy(() => import('./screens/admin/AdminSettings'));

const SellerDashboard = lazy(() => import('./screens/seller/SellerDashboard'));
const SellerCreateListingStep1 = lazy(() => import('./screens/seller/SellerCreateListingStep1'));
const SellerCreateListingStep2 = lazy(() => import('./screens/seller/SellerCreateListingStep2'));
const SellerCreateListingStep4 = lazy(() => import('./screens/seller/SellerCreateListingStep4'));
const SellerListingSubmitted = lazy(() => import('./screens/seller/SellerListingSubmitted'));

const BuyerBrowseAuctions = lazy(() => import('./screens/buyer/BuyerBrowseAuctions'));
const BuyerMyBids = lazy(() => import('./screens/buyer/BuyerMyBids'));
const BuyerWatchlist = lazy(() => import('./screens/buyer/BuyerWatchlist'));
const BuyerLiveBidding = lazy(() => import('./screens/buyer/BuyerLiveBidding'));
const BuyerLiveBiddingFinalCountdown = lazy(() => import('./screens/buyer/BuyerLiveBiddingFinalCountdown'));
const BuyerConfirmBid = lazy(() => import('./screens/buyer/BuyerConfirmBid'));
const BuyerAuctionWon = lazy(() => import('./screens/buyer/BuyerAuctionWon'));
const BuyerMyWins = lazy(() => import('./screens/buyer/BuyerMyWins'));
const BuyerProfile = lazy(() => import('./screens/buyer/BuyerProfile'));


export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AuctionProvider>
          <ListingProvider>
            <ToastProvider>
              <ToastContainer />
              {/* Layout convention: page content max-width is max-w-5xl (1024px) for most screens. */}
              {/* BuyerLiveBidding uses max-w-[1100px] due to two-column layout. Do not change these per-screen. */}
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
                  <Route path="/admin/settings" element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AdminSettings />
                    </ProtectedRoute>
                  } />

                  {/* Seller routes */}
                  <Route path="/seller/dashboard" element={
                    <ProtectedRoute allowedRoles={['SELLER']}>
                      <SellerDashboard />
                    </ProtectedRoute>
                  } />
                  {/* TODO: build dedicated My Listings screen; placeholder routes to dashboard so nav link resolves. */}
                  <Route path="/seller/listings" element={
                    <ProtectedRoute allowedRoles={['SELLER']}>
                      <SellerDashboard />
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
                  <Route path="/seller/create-listing/step-3" element={<Navigate to="/seller/create-listing/step-4" replace />} />
                  <Route path="/seller/create-listing/step-4" element={
                    <ProtectedRoute allowedRoles={['SELLER']}>
                      <SellerCreateListingStep4 />
                    </ProtectedRoute>
                  } />
                  <Route path="/seller/listing-submitted" element={
                    <ProtectedRoute allowedRoles={['SELLER']}>
                      <SellerListingSubmitted />
                    </ProtectedRoute>
                  } />

                  {/* Buyer routes */}
                  <Route path="/buyer/browse" element={
                    <ProtectedRoute allowedRoles={['BUYER']}>
                      <BuyerBrowseAuctions />
                    </ProtectedRoute>
                  } />
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
                  <Route path="/buyer/live-bidding/:auctionId" element={
                    <ProtectedRoute allowedRoles={['BUYER', 'ADMIN']}>
                      <BuyerLiveBidding />
                    </ProtectedRoute>
                  } />
                  <Route path="/buyer/live-bidding/:auctionId/final-countdown" element={
                    <ProtectedRoute allowedRoles={['BUYER', 'ADMIN']}>
                      <BuyerLiveBiddingFinalCountdown />
                    </ProtectedRoute>
                  } />
                  <Route path="/buyer/confirm-bid" element={
                    <ProtectedRoute allowedRoles={['BUYER']}>
                      <BuyerConfirmBid />
                    </ProtectedRoute>
                  } />
                  <Route path="/buyer/auction-won" element={
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

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </ToastProvider>
          </ListingProvider>
        </AuctionProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
