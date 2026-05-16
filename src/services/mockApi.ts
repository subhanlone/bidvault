import type { User, Auction, Bid, Listing, PricePrediction, RegisterData, LoginData, ListingDraft, ApiResponse } from '../types';
import { SEED_USERS, SEED_PASSWORDS, SEED_AUCTIONS, SEED_BIDS, SEED_PENDING_LISTINGS } from './mockData';

const delay = (ms = 650) => new Promise<void>(r => setTimeout(r, ms));

// Mutable in-memory store (extended from seed data)
const users: User[] = [...SEED_USERS];
const passwords: Record<string, string> = { ...SEED_PASSWORDS };
const registeredEmails = new Set(SEED_USERS.map(u => u.email));
export const auctions: Auction[] = [...SEED_AUCTIONS];
export const bids: Bid[] = [...SEED_BIDS];
export const pendingListings: Listing[] = [...SEED_PENDING_LISTINGS];

let listingCounter = 1000;

export const mockApi = {
  // ── Auth ──────────────────────────────────────────────────────────────────

  async register(data: RegisterData): Promise<ApiResponse<User>> {
    await delay();
    if (registeredEmails.has(data.email.toLowerCase())) {
      return { success: false, error: 'An account with this email already exists.' };
    }
    if (data.password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters.' };
    }
    const newUser: User = {
      userId: `u-${Date.now()}`,
      name: data.name.trim(),
      email: data.email.toLowerCase(),
      role: data.role,
      isEmailVerified: false,
      verificationStatus: data.role === 'SELLER' ? 'UNVERIFIED' : undefined,
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    passwords[newUser.email] = data.password;
    registeredEmails.add(newUser.email);
    return { success: true, data: newUser };
  },

  async verifyEmail(email: string, otp: string): Promise<ApiResponse<User>> {
    await delay(500);
    if (!/^\d{6}$/.test(otp)) {
      return { success: false, error: 'Enter a valid 6-digit code.' };
    }
    const user = users.find(u => u.email === email.toLowerCase());
    if (!user) return { success: false, error: 'Account not found.' };
    user.isEmailVerified = true;
    return { success: true, data: { ...user } };
  },

  async login(data: LoginData): Promise<ApiResponse<{ user: User; token: string }>> {
    await delay();
    const user = users.find(u => u.email === data.email.toLowerCase());
    if (!user || passwords[user.email] !== data.password) {
      return { success: false, error: 'Incorrect email or password.' };
    }
    if (!user.isEmailVerified) {
      return { success: false, error: 'Please verify your email first.' };
    }
    return { success: true, data: { user: { ...user }, token: `jwt-${Date.now()}` } };
  },

  async forgotPassword(email: string): Promise<ApiResponse> {
    await delay(500);
    if (!registeredEmails.has(email.toLowerCase())) {
      return { success: false, error: 'No account found with this email address.' };
    }
    return { success: true };
  },

  async verifyResetOtp(_email: string, otp: string): Promise<ApiResponse> {
    await delay(500);
    if (!/^\d{6}$/.test(otp)) {
      return { success: false, error: 'Enter a valid 6-digit code.' };
    }
    return { success: true };
  },

  async resetPassword(email: string, newPassword: string): Promise<ApiResponse> {
    await delay(500);
    if (newPassword.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters.' };
    }
    passwords[email.toLowerCase()] = newPassword;
    return { success: true };
  },

  // ── Seller Verification ───────────────────────────────────────────────────

  async submitVerification(sellerId: string): Promise<ApiResponse> {
    await delay(800);
    const user = users.find(u => u.userId === sellerId);
    if (user) user.verificationStatus = 'PENDING';
    return { success: true };
  },

  async approveSellerVerification(sellerId: string): Promise<ApiResponse> {
    await delay(500);
    const user = users.find(u => u.userId === sellerId);
    if (user) user.verificationStatus = 'VERIFIED';
    return { success: true };
  },

  // ── Auctions ──────────────────────────────────────────────────────────────

  async getAuctions(): Promise<ApiResponse<Auction[]>> {
    await delay(300);
    return { success: true, data: [...auctions] };
  },

  async getAuction(auctionId: string): Promise<ApiResponse<Auction>> {
    await delay(200);
    const auction = auctions.find(a => a.auctionId === auctionId);
    if (!auction) return { success: false, error: 'Auction not found.' };
    return { success: true, data: { ...auction } };
  },

  async getBids(auctionId: string): Promise<ApiResponse<Bid[]>> {
    await delay(200);
    return { success: true, data: bids.filter(b => b.auctionId === auctionId) };
  },

  async placeBid(auctionId: string, amount: number, buyer: User): Promise<ApiResponse<Bid>> {
    await delay(600);
    const auction = auctions.find(a => a.auctionId === auctionId);
    if (!auction) return { success: false, error: 'Auction not found.' };
    if (amount < auction.currentBid + auction.minIncrement) {
      return {
        success: false,
        error: `Bid must be at least PKR ${(auction.currentBid + auction.minIncrement).toLocaleString()}.`,
      };
    }
    auction.currentBid = amount;
    auction.bidCount += 1;
    const newBid: Bid = {
      bidId: `b-${Date.now()}`,
      auctionId,
      buyerId: buyer.userId,
      buyerName: buyer.name.split(' ')[0],
      amount,
      timestamp: new Date().toISOString(),
      isWin: false,
    };
    bids.unshift(newBid);
    return { success: true, data: newBid };
  },

  // ── AI Price Prediction ───────────────────────────────────────────────────

  async getPricePrediction(
    category: string,
    condition: string,
    startingPrice: number,
  ): Promise<ApiResponse<PricePrediction>> {
    await delay(1200);
    const base = startingPrice > 0 ? startingPrice : 50_000;
    const multiplier = condition === 'NEW' ? 1.15 : condition === 'LIKE_NEW' ? 1.0 : 0.82;
    const predicted = Math.round((base * multiplier * (0.95 + Math.random() * 0.2)) / 1000) * 1000;
    const rangeLow = Math.round(predicted * 0.8 / 1000) * 1000;
    const rangeHigh = Math.round(predicted * 1.25 / 1000) * 1000;
    const confidence = 0.78 + Math.random() * 0.15;

    const comparablePrices = [
      Math.round(predicted * (0.9 + Math.random() * 0.15) / 1000) * 1000,
      Math.round(predicted * (1.0 + Math.random() * 0.15) / 1000) * 1000,
      Math.round(predicted * (0.75 + Math.random() * 0.15) / 1000) * 1000,
    ];

    const prediction: PricePrediction = {
      predictionId: `pp-${Date.now()}`,
      listingId: 'draft',
      predictedPrice: predicted,
      confidence: parseFloat(confidence.toFixed(2)),
      modelName: 'XGBoost v2.1',
      generatedAt: new Date().toISOString(),
      comparables: [
        { title: `${category} Item — 256GB`, soldPrice: comparablePrices[0] },
        { title: `${category} Item — 512GB`, soldPrice: comparablePrices[1] },
        { title: `${category} Item — Basic`, soldPrice: comparablePrices[2] },
      ],
      rangeLow,
      rangeHigh,
    };
    return { success: true, data: prediction };
  },

  // ── Listings ──────────────────────────────────────────────────────────────

  async submitListing(
    draft: ListingDraft,
    sellerId: string,
    sellerName: string,
  ): Promise<ApiResponse<Listing>> {
    await delay(900);
    const listingId = `BV-${new Date().getFullYear()}-${String(++listingCounter).padStart(5, '0')}`;
    const newListing: Listing = {
      listingId,
      sellerId,
      sellerName,
      title: draft.title,
      category: draft.category,
      condition: draft.condition as 'NEW' | 'LIKE_NEW' | 'USED',
      description: draft.description,
      startPrice: draft.finalStartingPrice || draft.startingPrice,
      reservePrice: draft.hasReserve ? draft.reservePrice : undefined,
      status: 'PENDING',
      submittedAt: new Date().toISOString(),
      emoji: (() => {
        const cat = draft.category.toLowerCase();
        if (cat.includes('electronic') || cat.includes('gadget') || cat.includes('phone') || cat.includes('mobile')) return '📱';
        if (cat.includes('laptop') || cat.includes('computer') || cat.includes('macbook')) return '💻';
        if (cat.includes('vehicle') || cat.includes('car') || cat.includes('auto')) return '🚗';
        if (cat.includes('clothing') || cat.includes('fashion') || cat.includes('shoes')) return '👗';
        if (cat.includes('sport') || cat.includes('fitness')) return '🏋️';
        if (cat.includes('home') || cat.includes('furniture')) return '🛋️';
        if (cat.includes('book')) return '📚';
        if (cat.includes('toy') || cat.includes('game')) return '🎮';
        return '📦';
      })(),
    };
    pendingListings.push(newListing);
    return { success: true, data: newListing };
  },

  async getPendingListings(): Promise<ApiResponse<Listing[]>> {
    await delay(300);
    return { success: true, data: pendingListings.filter(l => l.status === 'PENDING') };
  },

  async getSellerListings(sellerId: string): Promise<ApiResponse<Listing[]>> {
    await delay(300);
    const fromPending = pendingListings.filter(l => l.sellerId === sellerId);
    const fromAuctions: Listing[] = auctions
      .filter(a => a.sellerId === sellerId)
      .map(a => ({
        listingId: a.listingId,
        sellerId: a.sellerId,
        sellerName: a.sellerName,
        title: a.title,
        category: a.category,
        condition: a.condition,
        description: a.description,
        startPrice: a.startPrice,
        status: 'APPROVED' as const,
        submittedAt: a.startTime,
        emoji: a.emoji,
      }));
    const pendingIds = new Set(fromPending.map(l => l.listingId));
    const merged = [...fromPending, ...fromAuctions.filter(a => !pendingIds.has(a.listingId))];
    return { success: true, data: merged };
  },

  async approveListing(listingId: string): Promise<ApiResponse> {
    await delay(600);
    const idx = pendingListings.findIndex(l => l.listingId === listingId);
    if (idx !== -1) pendingListings[idx].status = 'APPROVED';
    return { success: true };
  },

  async rejectListing(listingId: string, _reason: string): Promise<ApiResponse> {
    await delay(600);
    const idx = pendingListings.findIndex(l => l.listingId === listingId);
    if (idx !== -1) pendingListings[idx].status = 'REJECTED';
    return { success: true };
  },

  async getPendingSellerVerifications(): Promise<ApiResponse<User[]>> {
    await delay(300);
    return { success: true, data: users.filter(u => u.role === 'SELLER' && u.verificationStatus === 'PENDING') };
  },

  async rejectSellerVerification(sellerId: string): Promise<ApiResponse> {
    await delay(500);
    const u = users.find(u => u.userId === sellerId);
    if (u) u.verificationStatus = 'REJECTED';
    return { success: true };
  },

  // Helper: get user by email (for internal use)
  getUserByEmail(email: string): User | undefined {
    return users.find(u => u.email === email.toLowerCase());
  },

  // Helper: get live user state (syncs with internal mutable store)
  getUser(userId: string): User | undefined {
    return users.find(u => u.userId === userId);
  },
};
