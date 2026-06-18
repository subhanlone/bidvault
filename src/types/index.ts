export type UserRole = 'BUYER' | 'SELLER' | 'ADMIN';
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
  createdAt: string;
}

export interface Listing {
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
  startAt: string;
  durationDays: number;
  status: ListingStatus;
  rejectionReason?: string;
  submittedAt: string;
  emoji: string;
  imageUrl?: string;
  sellerEmail?: string;
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
  sellerRating: number | null;
  sellerSales: number | null;
  startPrice: number;
  currentBid: number;
  minIncrement: number;
  reservePrice?: number;
  bidCount: number;
  startTime: string;
  endTime: string;
  status: AuctionStatus;
  imageUrl: string;
  images?: string[];
}

export interface SellerReview {
  reviewId: string;
  stars: number;
  comment: string | null;
  buyerName: string;
  createdAt: string;
}

export interface Bid {
  bidId: string;
  auctionId: string;
  buyerId: string;
  buyerName: string;
  amount: number;
  timestamp: string;
  isWin?: boolean;
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
  imageUrl: string;
  startDate: string;
  startTime: string;
  duration: number;
  startingPrice: number;
  minIncrement: number;
  hasReserve: boolean;
  reservePrice: number;
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
