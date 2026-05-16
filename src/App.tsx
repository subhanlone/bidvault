import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AuctionProvider } from './context/AuctionContext';
import { ListingProvider } from './context/ListingContext';
import { ToastProvider } from './context/ToastContext';
import ToastContainer from './components/ToastContainer';
import ProtectedRoute from './components/ProtectedRoute';

import LandingPage from './screens/LandingPage';
import RegisterScreen from './screens/auth/RegisterScreen';
import EmailVerificationScreen from './screens/auth/EmailVerificationScreen';
import LoginScreen from './screens/auth/LoginScreen';
import ForgotPasswordScreen from './screens/auth/ForgotPasswordScreen';

import AdminDashboardOverview from './screens/admin/AdminDashboardOverview';
import AdminListingReview from './screens/admin/AdminListingReview';
import AdminLiveAuctions from './screens/admin/AdminLiveAuctions';
import AdminSellerVerification from './screens/admin/AdminSellerVerification';

import SellerDashboard from './screens/seller/SellerDashboard';
import SellerIdentityVerification from './screens/seller/SellerIdentityVerification';
import SellerVerificationStatus from './screens/seller/SellerVerificationStatus';
import SellerCreateListingStep1 from './screens/seller/SellerCreateListingStep1';
import SellerCreateListingStep2 from './screens/seller/SellerCreateListingStep2';
import SellerCreateListingStep3 from './screens/seller/SellerCreateListingStep3';
import SellerCreateListingStep4 from './screens/seller/SellerCreateListingStep4';
import SellerListingSubmitted from './screens/seller/SellerListingSubmitted';

import BuyerBrowseAuctions from './screens/buyer/BuyerBrowseAuctions';
import BuyerMyBids from './screens/buyer/BuyerMyBids';
import BuyerWatchlist from './screens/buyer/BuyerWatchlist';
import BuyerLiveBidding from './screens/buyer/BuyerLiveBidding';
import BuyerLiveBiddingFinalCountdown from './screens/buyer/BuyerLiveBiddingFinalCountdown';
import BuyerConfirmBid from './screens/buyer/BuyerConfirmBid';
import BuyerAuctionWon from './screens/buyer/BuyerAuctionWon';
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
                <Route path="/admin/seller-verification" element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminSellerVerification />
                  </ProtectedRoute>
                } />

                {/* Seller routes */}
                <Route path="/seller/dashboard" element={
                  <ProtectedRoute allowedRoles={['SELLER']}>
                    <SellerDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/seller/identity-verification" element={
                  <ProtectedRoute allowedRoles={['SELLER']}>
                    <SellerIdentityVerification />
                  </ProtectedRoute>
                } />
                <Route path="/seller/verification-status" element={
                  <ProtectedRoute allowedRoles={['SELLER']}>
                    <SellerVerificationStatus />
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
                  <ProtectedRoute allowedRoles={['BUYER']}>
                    <BuyerLiveBidding />
                  </ProtectedRoute>
                } />
                <Route path="/buyer/live-bidding/:auctionId/final-countdown" element={
                  <ProtectedRoute allowedRoles={['BUYER']}>
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
                <Route path="/buyer/toast-notifications" element={
                  <ProtectedRoute allowedRoles={['BUYER']}>
                    <BuyerToastNotifications />
                  </ProtectedRoute>
                } />

                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </ToastProvider>
          </ListingProvider>
        </AuctionProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
