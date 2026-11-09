/**
 * The API types, re-exported under the names the app uses. `openapi.d.ts` is generated from the
 * backend's openapi.json: do not edit it, regenerate it with `npm run api:contract && npm run
 * api:types`. Import API shapes from here.
 */

export type {
  Auction,
  Listing,
  User,
  Bid,
  PublicBid,
  BidWithAuction,
  AuctionFacets,
  PaginatedAuctions,
  PaginatedBids,
  PaginatedBidsWithAuction,
  PaginatedListings,
  NotificationPrefs,
  Review,
  SellerReviews,
  WonTransaction,
  SellerStats,
  Analytics,
  PlatformSettings,
  PublicSettings,
  PlatformStats,
  Session,
  Registration,
  UserRole,
  UserStatus,
  AdminUser,
  AdminDispute,
  SellerItem,
  SellerItemTab,
  SellerItemStage,
  SellerItemAction,
  SellerItemsSummary,
  PaginatedSellerItems,
  PaginatedAdminUsers,
  SellerProfile,
  SellerLimits,
  ListingReport,
  AdminListingReport,
  PaginatedAdminReports,
  ReportReason,
  ReportStatus,
  AuctionStatus,
  ListingStatus,
  ItemCondition,
  TransactionStatus,
  NotificationType,
  CategoryAttributes,
  RegisterRequest,
  LoginRequest,
  EnrollSellerRequest,
  SubmitListingRequest,
  CreateReviewRequest,
  UpdateSettingsRequest,
  ErrorResponse,
  ValidationError,
} from './openapi';

// Renamed: `Notification` is a DOM global, so the bare name would shadow it confusingly.
export type { Notification as AppNotification } from './openapi';

import type { SellerReviews } from './openapi';

/**
 * One entry from GET /reviews/seller/{sellerId}. The contract nests it inside SellerReviews without
 * a name, but two screens hold a single review. Deliberately not `Review`, which is the POST
 * /reviews response (four fields, no buyerName).
 */
export type SellerReview = SellerReviews['reviews'][number];
