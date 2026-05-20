import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AuctionProvider } from './context/AuctionContext';
import { ListingProvider } from './context/ListingContext';
import { ToastProvider } from './context/ToastContext';
import ToastContainer from './components/ToastContainer';
import ProtectedRoute from './components/ProtectedRoute';

import LandingPage from './screens/LandingPage';
import NotFound from './screens/NotFound';
import PrivacyPolicy from './screens/PrivacyPolicy';
import TermsOfService from './screens/TermsOfService';
import RegisterScreen from './screens/auth/RegisterScreen';
import EmailVerificationScreen from './screens/auth/EmailVerificationScreen';
import LoginScreen from './screens/auth/LoginScreen';
import ForgotPasswordScreen from './screens/auth/ForgotPasswordScreen';

import AdminDashboardOverview from './screens/admin/AdminDashboardOverview';
import AdminListingReview from './screens/admin/AdminListingReview';
import AdminLiveAuctions from './screens/admin/AdminLiveAuctions';
import AdminAnalytics from './screens/admin/AdminAnalytics';
import AdminSettings from './screens/admin/AdminSettings';

import SellerDashboard from './screens/seller/SellerDashboard';
import SellerCreateListingStep1 from './screens/seller/SellerCreateListingStep1';
import SellerCreateListingStep2 from './screens/seller/SellerCreateListingStep2';
import SellerCreateListingStep4 from './screens/seller/SellerCreateListingStep4';
import SellerListingSubmitted from './screens/seller/SellerListingSubmitted';

import BuyerBrowseAuctions from './screens/buyer/BuyerBrowseAuctions';
import BuyerMyBids from './screens/buyer/BuyerMyBids';
import BuyerWatchlist from './screens/buyer/BuyerWatchlist';
import BuyerLiveBidding from './screens/buyer/BuyerLiveBidding';
import BuyerLiveBiddingFinalCountdown from './screens/buyer/BuyerLiveBiddingFinalCountdown';
import BuyerConfirmBid from './screens/buyer/BuyerConfirmBid';
import BuyerAuctionWon from './screens/buyer/BuyerAuctionWon';
import BuyerProfile from './screens/buyer/BuyerProfile';
import BuyerToastNotifications from './screens/buyer/BuyerToastNotifications';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AuctionProvider>
          <ListingProvider>
            <ToastProvider>
              <ToastContainer />
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
                <Route path="/buyer/profile" element={
                  <ProtectedRoute allowedRoles={['BUYER']}>
                    <BuyerProfile />
                  </ProtectedRoute>
                } />
                <Route path="/buyer/toast-notifications" element={
                  <ProtectedRoute allowedRoles={['BUYER']}>
                    <BuyerToastNotifications />
                  </ProtectedRoute>
                } />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </ToastProvider>
          </ListingProvider>
        </AuctionProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
