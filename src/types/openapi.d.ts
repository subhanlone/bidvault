/**
 * Generated from the backend contract. Do not edit.
 *
 * Source: backend/src/openapi/schemas.ts -> backend/openapi.json -> this file.
 * Regenerate: in the backend, `npm run api:contract && npm run api:types`.
 *
 * Emitted by backend/scripts/generate-client-types.ts, which has no dependencies —
 * see that file for why no third-party generator is used.
 */

export type AdminDispute = {
  disputeId: string;
  transactionId: string;
  auctionTitle: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  finalAmount: number;
  reason: string;
  createdAt: string;
};

export type AdminTransaction = {
  transactionId: string;
  auctionId: string;
  auctionTitle: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  finalAmount: number;
  status: TransactionStatus;
  lastPaymentError?: string;
  createdAt: string;
};

export type AdminUser = {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
};

export type Analytics = {
  totalRevenue: number;
  totalBids: number;
  avgBidValue: number;
  sellerConversionRate: number;
  monthlyRevenue: {
    month: string;
    value: number;
    bids: number;
  }[];
  categoryBreakdown: {
    name: string;
    count: number;
    pct: number;
  }[];
  topSellers: {
    sellerId: string;
    sellerName: string;
    sales: number;
    revenue: number;
  }[];
};

export type AnonymizeUserRequest = {
  reason: string;
};

export type Approval = {
  listingId: string;
  status: "APPROVED";
  auctionId?: string;
  warning?: string;
};

export type Auction = {
  auctionId: string;
  listingId: string;
  title: string;
  category: string;
  condition: ItemCondition;
  description: string;
  emoji: string;
  sellerId: string;
  sellerName: string;
  sellerRating: number | null;
  sellerSales: number | null;
  startPrice: number;
  currentBid: number;
  minIncrement: number;
  reserveMet: boolean | null;
  bidCount: number;
  startTime: string;
  endTime: string;
  status: AuctionStatus;
  imageUrl: string;
  images: string[];
  attributes?: CategoryAttributes;
};

export type AuctionStatus = "SCHEDULED" | "ACTIVE" | "CLOSED";

export type Bid = {
  bidId: string;
  auctionId: string;
  buyerId: string;
  buyerName: string;
  amount: number;
  timestamp: string;
};

export type BidWithAuction = {
  bidId: string;
  auctionId: string;
  buyerId: string;
  buyerName: string;
  amount: number;
  timestamp: string;
  auction: Auction;
};

export type BulkApproval = {
  approved: number;
  failed: number;
  failures: {
    listingId: string;
    error: string;
  }[];
  remaining: number;
};

/** Category-specific fields; keys vary by category. */
export type CategoryAttributes = Record<string, string | number>;

export type ChangePasswordRequest = {
  currentPassword: string;
  /**
   * 8-128 characters. Additionally scored with zxcvbn and rejected below score 2, which refuses common passwords, keyboard walks and dictionary words regardless of length.
   */
  newPassword: string;
};

export type CreateReviewRequest = {
  transactionId: string;
  stars: number;
  comment?: string;
};

export type DeleteAccountRequest = {
  password: string;
};

export type Earnings = {
  ledgerBalance: number;
  entries: {
    transactionId: string;
    auctionTitle: string;
    amount: number;
    createdAt: string;
  }[];
};

export type ErrorResponse = {
  success: false;
  error: string;
  code?: string;
};

export type ForgotPasswordRequest = {
  email: string;
};

export type Health = {
  status: "ok";
  service: string;
  version: string;
  commit: string;
  dependencies: {
    database: {
      state: "up" | "down";
      latencyMs: number;
    };
    redis: {
      state: "up" | "down";
      latencyMs: number;
    };
  };
  contractViolations: number;
  workerHeartbeatAgeSeconds: number | null;
};

export type Invoice = {
  transactionId: string;
  invoiceNumber: string;
  auctionTitle: string;
  category: string;
  buyerName: string;
  buyerEmail: string;
  sellerName: string;
  sellerEmail: string;
  amount: number;
  status: TransactionStatus;
  paymentReference?: string;
  deliveryAddress?: string;
  deliveryPhone?: string;
  createdAt: string;
  shippedAt?: string;
  disputeStatus?: "OPEN" | "RESOLVED_REFUNDED" | "RESOLVED_RELEASED";
  disputeReason?: string;
  disputeResolutionNote?: string;
};

export type ItemCondition = "NEW" | "LIKE_NEW" | "USED";

export type Listing = {
  listingId: string;
  listingCode: string;
  sellerId: string;
  sellerName: string;
  title: string;
  category: string;
  condition: ItemCondition;
  description: string;
  startPrice: number;
  reservePrice?: number;
  minIncrement: number;
  durationDays: number;
  status: ListingStatus;
  rejectionReason?: string;
  submittedAt: string;
  emoji: string;
  imageUrl?: string;
  sellerEmail: string;
  attributes?: CategoryAttributes;
};

export type ListingStatus = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";

export type LoginRequest = {
  email: string;
  password: string;
};

export type Message = {
  message: string;
};

export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export type NotificationPreferences = {
  notifyOutbid?: boolean;
  notifyWins?: boolean;
  notifyNews?: boolean;
};

export type NotificationPrefs = {
  notifyOutbid: boolean;
  notifyWins: boolean;
  notifyNews: boolean;
};

export type NotificationRead = {
  id: string;
  isRead: true;
};

export type NotificationType = "BID_OUTBID" | "AUCTION_WON" | "RESERVE_NOT_MET" | "LISTING_APPROVED" | "LISTING_REJECTED" | "NEW_REVIEW";

export type OtpIssued = {
  message: string;
  resetCode?: string;
  verificationCode?: string;
  codeExpiresAt?: string;
};

export type PaginatedAuctions = {
  items: Auction[];
  nextCursor: string | null;
};

export type PaginatedBids = {
  items: PublicBid[];
  nextCursor: string | null;
};

export type PaginatedBidsWithAuction = {
  items: BidWithAuction[];
  nextCursor: string | null;
};

export type PaginatedListings = {
  items: Listing[];
  nextCursor: string | null;
};

export type PaginatedSellerSales = {
  items: SellerSale[];
  nextCursor: string | null;
};

export type PasswordChanged = {
  message: string;
  accessToken: string;
  refreshToken: string;
};

export type PayResult = {
  transactionId: string;
  status: "COMPLETED" | "PENDING";
  lastPaymentError?: string;
};

export type PayTransactionRequest = {
  cardNumber: string;
  deliveryAddress: string;
  deliveryPhone: string;
};

export type PlaceBidRequest = {
  amount: number;
};

export type PlatformSettings = {
  emailNotifsEnabled: boolean;
  maintenanceMode: boolean;
  maxBidIncrement: number;
  minListingPrice: number;
  reviewTimeoutHours: number;
  supportEmail: string;
};

export type PlatformStats = {
  userCount: number;
  activeAuctionCount: number;
  transactionTotal: number;
  listingCount: number;
  completedSalesCount: number;
};

export type PublicBid = {
  bidId: string;
  auctionId: string;
  isMine: boolean;
  buyerName: string;
  amount: number;
  timestamp: string;
};

export type PublicSettings = {
  maintenanceMode: boolean;
  supportEmail: string;
  minListingPrice: number;
  maxBidIncrement: number;
};

export type RaiseDisputeRequest = {
  reason: string;
};

export type RefreshRequest = {
  refreshToken: string;
};

export type RefreshedTokens = {
  accessToken: string;
  refreshToken: string;
};

export type RegisterRequest = {
  name: string;
  email: string;
  /**
   * 8-128 characters. Additionally scored with zxcvbn and rejected below score 2, which refuses common passwords, keyboard walks and dictionary words regardless of length.
   */
  password: string;
  role: "BUYER" | "SELLER";
};

export type Registration = {
  user: User;
  verificationCode?: string;
  codeExpiresAt: string;
};

export type RejectListingRequest = {
  reason: string;
};

export type Rejection = {
  listingId: string;
  status: ListingStatus;
  rejectionReason: string | null;
};

export type ResendVerificationRequest = {
  email: string;
};

export type ResetPasswordRequest = {
  email: string;
  otp: string;
  /**
   * 8-128 characters. Additionally scored with zxcvbn and rejected below score 2, which refuses common passwords, keyboard walks and dictionary words regardless of length.
   */
  password: string;
};

export type ResolveDisputeRequest = {
  resolution: "REFUND" | "RELEASE";
  note: string;
};

export type Review = {
  reviewId: string;
  stars: number;
  comment: string | null;
  createdAt: string;
};

export type SellerReviews = {
  sellerId: string;
  average: number | null;
  count: number;
  reviews: ({
    reviewId: string;
    stars: number;
    comment: string | null;
    createdAt: string;
    buyerName: string;
  })[];
};

export type SellerSale = {
  transactionId: string;
  auctionId: string;
  auctionTitle: string;
  auctionEmoji: string;
  auctionImageUrl: string;
  buyerName: string;
  finalAmount: number;
  status: TransactionStatus;
  deliveryAddress?: string;
  deliveryPhone?: string;
  shippedAt?: string;
  reviewDeadlineAt?: string;
  disputeReason?: string;
  createdAt: string;
};

export type SellerStats = {
  totalRevenue: number;
  itemsSold: number;
};

export type Session = {
  accessToken: string;
  refreshToken: string;
  user: User;
};

export type SubmitListingRequest = {
  title: string;
  category: "Electronics & Gadgets" | "Vehicles" | "Clothing & Fashion" | "Books & Education" | "Home & Furniture" | "Sports & Fitness" | "Art & Collectibles";
  condition: "NEW" | "LIKE_NEW" | "USED";
  description: string;
  startPrice: number;
  reservePrice?: number;
  minIncrement: number;
  durationDays: number;
  imageUrl?: string;
  /**
   * At most two emoji, measured as grapheme clusters.
   */
  emoji?: string;
  attributes?: Record<string, unknown>;
};

export type TransactionStatus = "PENDING" | "COMPLETED" | "FAILED" | "VOIDED" | "SHIPPED" | "DELIVERED" | "DISPUTED" | "REFUNDED";

export type UpdateSettingsRequest = {
  emailNotifsEnabled?: boolean;
  maintenanceMode?: boolean;
  maxBidIncrement?: number;
  minListingPrice?: number;
  reviewTimeoutHours?: number;
  supportEmail?: string;
};

export type UploadSignature = {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
  format: string;
  publicId: string;
  allowedFormats: string;
};

export type User = {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  isEmailVerified: boolean;
  createdAt: string;
};

export type UserRole = "BUYER" | "SELLER" | "ADMIN";

export type ValidationError = {
  success: false;
  error: "Validation error";
  details: Record<string, string[]>;
};

export type VerifyEmailRequest = {
  email: string;
  otp: string;
};

export type VerifyResetOtpRequest = {
  email: string;
  otp: string;
};

export type VoidTransactionRequest = {
  reason: string;
};

export type WatchToggle = {
  auctionId: string;
  watched: boolean;
};

export type WonTransaction = {
  transactionId: string;
  auctionId: string;
  auctionTitle: string;
  auctionEmoji: string;
  auctionImageUrl: string;
  sellerName: string;
  finalAmount: number;
  status: TransactionStatus;
  lastPaymentError?: string;
  shippedAt?: string;
  reviewDeadlineAt?: string;
  disputeReason?: string;
  createdAt: string;
  reviewed: boolean;
};

/** What each documented GET returns, unwrapped from the response envelope. */
export interface GetEndpoints {
  "/admin/analytics": Analytics;
  "/admin/disputes": AdminDispute[];
  "/admin/transactions": AdminTransaction[];
  "/admin/users": AdminUser[];
  "/auctions": PaginatedAuctions;
  "/auctions/mine/bids": PaginatedBidsWithAuction;
  "/auctions/{auctionId}": Auction;
  "/auctions/{auctionId}/bids": PaginatedBids;
  "/auth/me": {
    user: User;
  };
  "/auth/me/preferences": NotificationPrefs;
  "/health": Health;
  "/listings/mine": PaginatedListings;
  "/listings/pending": PaginatedListings;
  "/notifications": Notification[];
  "/payments/earnings": Earnings;
  "/payments/my-sales": PaginatedSellerSales;
  "/payments/my-wins": WonTransaction[];
  "/payments/seller-stats": SellerStats;
  "/payments/{transactionId}/invoice": Invoice;
  "/reviews/seller/{sellerId}": SellerReviews;
  "/settings": PlatformSettings;
  "/settings/public": PublicSettings;
  "/stats": PlatformStats;
  "/watchlist": PaginatedAuctions;
}

/** What each documented POST returns, unwrapped from the response envelope. */
export interface PostEndpoints {
  "/admin/disputes/{disputeId}/resolve": {
    disputeId: string;
    resolution: "REFUND" | "RELEASE";
  };
  "/admin/transactions/{transactionId}/void": {
    transactionId: string;
    status: "VOIDED";
  };
  "/admin/users/{userId}/anonymize": {
    userId: string;
    status: "ANONYMIZED";
  };
  "/auctions/{auctionId}/bids": Bid;
  "/auth/change-password": PasswordChanged;
  "/auth/delete-account": {
    message: string;
  };
  "/auth/forgot-password": OtpIssued;
  "/auth/login": Session;
  "/auth/logout": Message;
  "/auth/refresh": RefreshedTokens;
  "/auth/register": Registration;
  "/auth/resend-verification": OtpIssued;
  "/auth/reset-password": Message;
  "/auth/verify-email": Message;
  "/auth/verify-reset-otp": Message;
  "/listings": Listing;
  "/listings/approve-all": BulkApproval;
  "/listings/upload-signature": UploadSignature;
  "/listings/{listingId}/approve": Approval;
  "/listings/{listingId}/reject": Rejection;
  "/notifications/read-all": Message;
  "/notifications/{notificationId}/read": NotificationRead;
  "/payments/{transactionId}/confirm-receipt": {
    transactionId: string;
    status: "DELIVERED";
  };
  "/payments/{transactionId}/dispute": {
    transactionId: string;
    status: "DISPUTED";
  };
  "/payments/{transactionId}/pay": PayResult;
  "/reviews": Review;
  "/watchlist/{auctionId}": WatchToggle;
}

/** What each documented PUT returns, unwrapped from the response envelope. */
export interface PutEndpoints {
  "/settings": PlatformSettings;
}

/** What each documented PATCH returns, unwrapped from the response envelope. */
export interface PatchEndpoints {
  "/auth/me/preferences": NotificationPrefs;
  "/payments/{transactionId}/ship": {
    transactionId: string;
    status: "SHIPPED";
  };
}

/** What each documented DELETE returns, unwrapped from the response envelope. */
export interface DeleteEndpoints {
  "/watchlist/{auctionId}": WatchToggle;
}

/** The body each documented POST expects. */
export interface PostRequests {
  "/admin/disputes/{disputeId}/resolve": ResolveDisputeRequest;
  "/admin/transactions/{transactionId}/void": VoidTransactionRequest;
  "/admin/users/{userId}/anonymize": AnonymizeUserRequest;
  "/auctions/{auctionId}/bids": PlaceBidRequest;
  "/auth/change-password": ChangePasswordRequest;
  "/auth/delete-account": DeleteAccountRequest;
  "/auth/forgot-password": ForgotPasswordRequest;
  "/auth/login": LoginRequest;
  "/auth/logout": RefreshRequest;
  "/auth/refresh": RefreshRequest;
  "/auth/register": RegisterRequest;
  "/auth/resend-verification": ResendVerificationRequest;
  "/auth/reset-password": ResetPasswordRequest;
  "/auth/verify-email": VerifyEmailRequest;
  "/auth/verify-reset-otp": VerifyResetOtpRequest;
  "/listings": SubmitListingRequest;
  "/listings/{listingId}/reject": RejectListingRequest;
  "/payments/{transactionId}/dispute": RaiseDisputeRequest;
  "/payments/{transactionId}/pay": PayTransactionRequest;
  "/reviews": CreateReviewRequest;
}

/** The body each documented PUT expects. */
export interface PutRequests {
  "/settings": UpdateSettingsRequest;
}

/** The body each documented PATCH expects. */
export interface PatchRequests {
  "/auth/me/preferences": NotificationPreferences;
}
