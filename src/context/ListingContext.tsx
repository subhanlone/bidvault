import React, { useState } from 'react';
import type { ListingDraft } from '../types';
import { useAuth } from './auth';
import { ListingContext, type LimitFieldErrors } from './listing';

// One draft per account. The draft holds the seller's reserve price, and one key for everyone
// meant that whoever signed in next on the same tab was handed the previous seller's half-written
// listing. Keyed by user id, each account gets its own back when it signs in again -- and never
// sees another's.
const LEGACY_DRAFT_KEY = 'bidvault_listing_draft_v1';
const draftKey = (userId: string) => `${LEGACY_DRAFT_KEY}:${userId}`;

const DEFAULT_DRAFT: ListingDraft = {
  title: '',
  category: '',
  condition: '',
  description: '',
  imageUrl: '',
  duration: 7,
  startingPrice: 0,
  minIncrement: 1_000,
  hasReserve: false,
  reservePrice: 0,
  attributes: {},
};

/**
 * Remounts the draft store whenever the signed-in account changes, so React state can never carry
 * one account's draft over to the next; the new store reads its own account's saved draft.
 */
export function ListingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.userId ?? null;
  return <ListingStore key={userId ?? 'anonymous'} userId={userId}>{children}</ListingStore>;
}

function ListingStore({ userId, children }: { userId: string | null; children: React.ReactNode }) {
  const [draft, setDraft] = useState<ListingDraft>(() => {
    try {
      // The old un-keyed entry cannot be attributed to anyone, so it is dropped, not adopted.
      sessionStorage.removeItem(LEGACY_DRAFT_KEY);
      if (!userId) return { ...DEFAULT_DRAFT };
      const stored = sessionStorage.getItem(draftKey(userId));
      if (!stored) return { ...DEFAULT_DRAFT };
      return { ...DEFAULT_DRAFT, ...(JSON.parse(stored) as Partial<ListingDraft>) };
    } catch {
      return { ...DEFAULT_DRAFT };
    }
  });
  const [submittedListingCode, setSubmittedListingCode] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<LimitFieldErrors>({});

  const updateDraft = (partial: Partial<ListingDraft>) => {
    setDraft(prev => {
      const next = { ...prev, ...partial };
      if (userId) {
        try { sessionStorage.setItem(draftKey(userId), JSON.stringify(next)); } catch { /* quota */ }
      }
      return next;
    });
  };

  const clearDraft = () => {
    if (userId) {
      try { sessionStorage.removeItem(draftKey(userId)); } catch { /* ignore */ }
    }
    setDraft({ ...DEFAULT_DRAFT });
    setSubmittedListingCode(null);
    setFieldErrors({});
  };

  return (
    <ListingContext.Provider value={{ draft, updateDraft, clearDraft, submittedListingCode, setSubmittedListingCode, fieldErrors, setFieldErrors }}>
      {children}
    </ListingContext.Provider>
  );
}
