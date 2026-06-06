import React, { createContext, useContext, useState } from 'react';
import type { ListingDraft } from '../types';

const DRAFT_KEY = 'bidvault_listing_draft_v1';

const DEFAULT_DRAFT: ListingDraft = {
  title: '',
  category: '',
  condition: '',
  description: '',
  imageUrl: '',
  startDate: '',
  startTime: '',
  duration: 7,
  startingPrice: 0,
  minIncrement: 1_000,
  hasReserve: false,
  reservePrice: 0,
};

interface ListingContextType {
  draft: ListingDraft;
  updateDraft: (partial: Partial<ListingDraft>) => void;
  clearDraft: () => void;
  submittedListingId: string | null;
  setSubmittedListingId: (id: string | null) => void;
}

const ListingContext = createContext<ListingContextType | null>(null);

export function ListingProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<ListingDraft>(() => {
    try {
      const stored = sessionStorage.getItem(DRAFT_KEY);
      if (!stored) return { ...DEFAULT_DRAFT };
      return { ...DEFAULT_DRAFT, ...(JSON.parse(stored) as Partial<ListingDraft>) };
    } catch {
      return { ...DEFAULT_DRAFT };
    }
  });
  const [submittedListingId, setSubmittedListingId] = useState<string | null>(null);

  const updateDraft = (partial: Partial<ListingDraft>) => {
    setDraft(prev => {
      const next = { ...prev, ...partial };
      try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(next)); } catch { /* quota */ }
      return next;
    });
  };

  const clearDraft = () => {
    try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
    setDraft({ ...DEFAULT_DRAFT });
    setSubmittedListingId(null);
  };

  return (
    <ListingContext.Provider value={{ draft, updateDraft, clearDraft, submittedListingId, setSubmittedListingId }}>
      {children}
    </ListingContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useListing() {
  const ctx = useContext(ListingContext);
  if (!ctx) throw new Error('useListing must be used within ListingProvider');
  return ctx;
}
