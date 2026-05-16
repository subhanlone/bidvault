export type UserRole = 'BUYER' | 'SELLER' | 'ADMIN';
export type VerificationStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
export type AuctionStatus = 'SCHEDULED' | 'ACTIVE' | 'CLOSED';
export type ListingStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
export type NotificationType = 'BID' | 'WIN' | 'LISTING' | 'SYSTEM';
export type TransactionStatus = 'PENDING' | 'COMPLETED';
export type ItemCondition = 'NEW' | 'LIKE_NEW' | 'USED';

export interface User {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  isEmailVerified: boolean;
  verificationStatus?: VerificationStatus;
  createdAt: string;
}

export interface ComparableListing {
  title: string;
  soldPrice: number;
}

export interface PricePrediction {
  predictionId: string;
  listingId: string;
  predictedPrice: number;
  confidence: number;
  modelName: string;
  generatedAt: string;
  comparables: ComparableListing[];
  rangeLow: number;
  rangeHigh: number;
}

export interface Listing {
  listingId: string;
  sellerId: string;
  sellerName: string;
  title: string;
  category: string;
  condition: ItemCondition;
  description: string;
  startPrice: number;
  reservePrice?: number;
  status: ListingStatus;
  submittedAt: string;
  emoji: string;
  imageUrl?: string;
}

export interface Auction {
  auctionId: string;
  listingId: string;
  title: string;
  category: string;
  condition: ItemCondition;
  description: string;
  emoji: string;
  sellerId: string;
  sellerName: string;
  sellerVerified: boolean;
  sellerRating: number;
  sellerSales: number;
  startPrice: number;
  currentBid: number;
  minIncrement: number;
  reservePrice?: number;
  bidCount: number;
  startTime: string;
  endTime: string;
  status: AuctionStatus;
  badge?: string;
  badgeColor?: string;
  specs?: Record<string, string>;
  imageUrl: string;
  images?: string[];
}

export interface Bid {
  bidId: string;
  auctionId: string;
  buyerId: string;
  buyerName: string;
  amount: number;
  timestamp: string;
  isWin: boolean;
}

export interface Transaction {
  transactionId: string;
  auctionId: string;
  winnerId: string;
  sellerId: string;
  finalAmount: number;
  status: TransactionStatus;
  createdAt: string;
}

export interface ListingDraft {
  title: string;
  category: string;
  condition: ItemCondition | '';
  description: string;
  hasPhoto: boolean;
  startDate: string;
  startTime: string;
  duration: number;
  startingPrice: number;
  minIncrement: number;
  hasReserve: boolean;
  reservePrice: number;
  aiPrediction?: PricePrediction;
  useAiPrice: boolean;
  finalStartingPrice: number;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface ApiResponse<T = null> {
  success: boolean;
  data?: T;
  error?: string;
}
