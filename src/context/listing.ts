import { createContext, useContext } from 'react';
import type { ListingDraft } from '../types';

// Apart from the provider component for the same reason as auth.ts (react-refresh).
/** Messages the server attached to the two fields Step 2 owns, when a submit on Step 3 was refused. */
export type LimitFieldErrors = { startPrice?: string; minIncrement?: string };

export interface ListingContextType {
  draft: ListingDraft;
  updateDraft: (partial: Partial<ListingDraft>) => void;
  clearDraft: () => void;
  submittedListingCode: string | null;
  setSubmittedListingCode: (code: string | null) => void;
  /**
   * What the server said about the starting price / increment when it refused the submit. Kept
   * here, not in navigation state: this store is per account (see ListingProvider), so one
   * account's message can never be shown on the next account's form.
   */
  fieldErrors: LimitFieldErrors;
  setFieldErrors: (errors: LimitFieldErrors) => void;
}

export const ListingContext = createContext<ListingContextType | null>(null);

export function useListing() {
  const ctx = useContext(ListingContext);
  if (!ctx) throw new Error('useListing must be used within ListingProvider');
  return ctx;
}
