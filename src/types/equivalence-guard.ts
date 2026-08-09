/**
 * Compile-time proof that the hand-written types in `./index.ts` — which 29 screens still
 * import — describe exactly what the API actually sends, as recorded in the generated
 * `./openapi.d.ts`.
 *
 * Why this exists: on 2026-08-10 an audit found `Auction.reserveMet`, `Auction.imageUrl`,
 * `Auction.images` and `Listing.sellerEmail` had drifted to optional while the server always
 * sends them. Nothing caught it, because the two files are independent. Any future drift is
 * now a build error instead of a silent lie the screens believe.
 *
 * **Delete this file once task #32 lands** — when every screen imports from `types/api`,
 * the hand-written shapes go away and there is nothing left to compare.
 */
import type * as Hand from './index';
import type * as Gen from './openapi';

/** Resolves to `true` only if A and B are mutually assignable, otherwise `never`. */
type Exact<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never;

/**
 * Passing `true` where the parameter has collapsed to `never` is a type error, which is what
 * turns a drifted type into a failed build. The argument is returned so it counts as used.
 */
const assertExact = <T extends true>(proof: T): T => proof;

// Wire shapes — a mismatch here means a screen is reading the API wrong.
assertExact<Exact<Hand.Auction, Gen.Auction>>(true);
assertExact<Exact<Hand.Listing, Gen.Listing>>(true);
assertExact<Exact<Hand.User, Gen.User>>(true);
assertExact<Exact<Hand.Bid, Gen.Bid>>(true);
assertExact<Exact<Hand.NotificationPrefs, Gen.NotificationPrefs>>(true);
assertExact<Exact<Hand.AppNotification, Gen.Notification>>(true);

// Enums and unions.
assertExact<Exact<Hand.UserRole, Gen.UserRole>>(true);
assertExact<Exact<Hand.AuctionStatus, Gen.AuctionStatus>>(true);
assertExact<Exact<Hand.ListingStatus, Gen.ListingStatus>>(true);
assertExact<Exact<Hand.ItemCondition, Gen.ItemCondition>>(true);
assertExact<Exact<Hand.TransactionStatus, Gen.TransactionStatus>>(true);
assertExact<Exact<Hand.NotificationType, Gen.NotificationType>>(true);
assertExact<Exact<Hand.CategoryAttributes, Gen.CategoryAttributes>>(true);

export {};
