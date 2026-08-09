import type { components, paths } from './openapi';

/**
 * Readable names for the generated API types.
 *
 * `openapi.d.ts` is generated from the backend's openapi.json and must not be edited — run
 * `npm run api:types` after the backend's contract changes. Reaching into
 * `components['schemas'][...]` at every call site is unpleasant, so this file is the one
 * place that does it.
 *
 * These are the *only* API shapes that are true by construction. `types/index.ts` still
 * holds hand-written equivalents that predate this; they are being migrated over, and
 * anything new should import from here.
 */

type Schemas = components['schemas'];

export type Auction = Schemas['Auction'];
export type Listing = Schemas['Listing'];
export type User = Schemas['User'];
export type Bid = Schemas['Bid'];
export type BidWithAuction = Schemas['BidWithAuction'];
export type WatchlistEntry = Schemas['WatchlistEntry'];
export type AppNotification = Schemas['Notification'];
export type NotificationPrefs = Schemas['NotificationPrefs'];
export type Review = Schemas['Review'];
export type SellerReviews = Schemas['SellerReviews'];
export type WonTransaction = Schemas['WonTransaction'];
export type SellerStats = Schemas['SellerStats'];
export type Analytics = Schemas['Analytics'];
export type PlatformSettings = Schemas['PlatformSettings'];
export type PublicSettings = Schemas['PublicSettings'];
export type PlatformStats = Schemas['PlatformStats'];
export type Session = Schemas['Session'];
export type Registration = Schemas['Registration'];

export type UserRole = Schemas['UserRole'];
export type AuctionStatus = Schemas['AuctionStatus'];
export type ListingStatus = Schemas['ListingStatus'];
export type ItemCondition = Schemas['ItemCondition'];
export type TransactionStatus = Schemas['TransactionStatus'];
export type NotificationType = Schemas['NotificationType'];
export type CategoryAttributes = Schemas['CategoryAttributes'];

export type RegisterRequest = Schemas['RegisterRequest'];
export type LoginRequest = Schemas['LoginRequest'];
export type SubmitListingRequest = Schemas['SubmitListingRequest'];
export type CreateReviewRequest = Schemas['CreateReviewRequest'];
export type UpdateSettingsRequest = Schemas['UpdateSettingsRequest'];

/** Escape hatch for routes without a named alias above. */
export type ApiPaths = paths;
