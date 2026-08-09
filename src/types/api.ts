/**
 * The API types, re-exported under the names the app uses.
 *
 * `openapi.d.ts` is generated from the backend's openapi.json, which is generated from the
 * Zod schemas the server validates and serves with. Do not edit it — regenerate from the
 * backend with `npm run api:contract && npm run api:types`.
 *
 * These are the only API shapes that are true by construction. `types/index.ts` still holds
 * hand-written equivalents that predate this; they are being migrated over, and anything
 * new should import from here.
 */

export type {
  Auction,
  Listing,
  User,
  Bid,
  BidWithAuction,
  WatchlistEntry,
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
  AuctionStatus,
  ListingStatus,
  ItemCondition,
  TransactionStatus,
  NotificationType,
  CategoryAttributes,
  RegisterRequest,
  LoginRequest,
  SubmitListingRequest,
  CreateReviewRequest,
  UpdateSettingsRequest,
  ErrorResponse,
  ValidationError,
} from './openapi';

// Renamed: `Notification` is a DOM global, so the bare name would shadow it confusingly.
export type { Notification as AppNotification } from './openapi';
