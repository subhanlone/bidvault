import React, { createContext, useContext, useState } from 'react';
import type { ListingDraft } from '../types';

const DEFAULT_DRAFT: ListingDraft = {
  title: '',
  category: '',
  condition: '',
  description: '',
  hasPhoto: false,
  startDate: '',
  startTime: '',
  duration: 7,
  startingPrice: 0,
  minIncrement: 1_000,
  hasReserve: false,
  reservePrice: 0,
  aiPrediction: undefined,
  useAiPrice: false,
  finalStartingPrice: 0,
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
  const [draft, setDraft] = useState<ListingDraft>({ ...DEFAULT_DRAFT });
  const [submittedListingId, setSubmittedListingId] = useState<string | null>(null);

  const updateDraft = (partial: Partial<ListingDraft>) =>
    setDraft(prev => ({ ...prev, ...partial }));

  const clearDraft = () => {
    setDraft({ ...DEFAULT_DRAFT });
    setSubmittedListingId(null);
  };

  return (
    <ListingContext.Provider value={{ draft, updateDraft, clearDraft, submittedListingId, setSubmittedListingId }}>
      {children}
    </ListingContext.Provider>
  );
}

export function useListing() {
  const ctx = useContext(ListingContext);
  if (!ctx) throw new Error('useListing must be used within ListingProvider');
  return ctx;
}
