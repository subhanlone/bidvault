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

/**
 * Resolves to `true` only if A and B are the same type, otherwise `never`.
 *
 * Mutual assignability alone is not enough. A property that is optional on one side and
 * *absent* from the other is assignable in both directions, so the first version of this
 * guard passed `Bid.isWin?: boolean` against a six-field wire `Bid` that has never had the
 * field — and `BuyerProfile` rendered `bid.isWin ? 'Won' : 'Bid placed'` for a value that
 * was always `undefined`. The key-set containment below is what catches that.
 *
 * Limitation: the key comparison is top level. A nested object shape is only checked as
 * deeply as assignability checks it, so name nested shapes in their own assertion rather
 * than trusting the parent's — see the SellerReview line.
 */
type Exact<A, B> =
  [A] extends [B]
    ? [B] extends [A]
      ? [keyof A] extends [keyof B]
        ? [keyof B] extends [keyof A]
          ? true
          : never
        : never
      : never
    : never;

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

// Nested on the wire (GET /reviews/seller/{id} -> reviews[]), but the screens hold it as a
// standalone type, so it is asserted standalone. See the limitation note on Exact.
assertExact<Exact<Hand.SellerReview, Gen.SellerReviews['reviews'][number]>>(true);

// Enums and unions.
assertExact<Exact<Hand.UserRole, Gen.UserRole>>(true);
assertExact<Exact<Hand.AuctionStatus, Gen.AuctionStatus>>(true);
assertExact<Exact<Hand.ListingStatus, Gen.ListingStatus>>(true);
assertExact<Exact<Hand.ItemCondition, Gen.ItemCondition>>(true);
assertExact<Exact<Hand.TransactionStatus, Gen.TransactionStatus>>(true);
assertExact<Exact<Hand.NotificationType, Gen.NotificationType>>(true);
assertExact<Exact<Hand.CategoryAttributes, Gen.CategoryAttributes>>(true);

export {};
