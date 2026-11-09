import type { SellerLimits } from '../types/api';
import { pkr } from './format';

/** The day the monthly limit starts again, in Karachi time: "1 December". */
export function resetDay(resetsAt: string): string {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', timeZone: 'Asia/Karachi' }).format(new Date(resetsAt));
}

/** Whether any limit applies to this seller this month. */
export function hasLimit(l: SellerLimits | undefined): l is SellerLimits {
  return Boolean(l) && (l!.items.limit !== null || l!.value.limit !== null);
}

/** The item limit is used up: no new listing can go in this month. */
export function itemsFull(l: SellerLimits | undefined): boolean {
  return Boolean(l) && l!.items.limit !== null && l!.items.used >= l!.items.limit;
}

/** Starting-price value still allowed this month, or null for no value limit. */
export function valueLeft(l: SellerLimits | undefined): number | null {
  if (!l || l.value.limit === null) return null;
  return Math.max(0, l.value.limit - l.value.used);
}

/** The sentence for a starting price that would go over the value limit, or null when it fits. */
export function valueOverMessage(l: SellerLimits | undefined, startPrice: number): string | null {
  const left = valueLeft(l);
  if (left === null || startPrice <= left || !l || l.value.limit === null) return null;
  return `${pkr(left)} is left of your ${pkr(l.value.limit)} monthly limit.`;
}

/** The sentence for a used-up item limit. */
export function itemsFullMessage(l: SellerLimits): string {
  const limit = l.items.limit ?? 0;
  return `You have reached this month's limit of ${limit} ${limit === 1 ? 'item' : 'items'}.`;
}

/** What a seller at the limit can do about it (docs/B5 section 4, screen 5). */
export function wayOut(l: SellerLimits): string {
  return `It resets on ${resetDay(l.resetsAt)}. Until then you can withdraw a listing that is waiting for review, or request a higher limit from My Items.`;
}

/** 80% or more of either figure used: the wizard says what is left. */
export function nearLimit(l: SellerLimits | undefined): boolean {
  if (!l) return false;
  const near = (used: number, limit: number | null) => limit !== null && used >= limit * 0.8;
  return near(l.items.used, l.items.limit) || near(l.value.used, l.value.limit);
}
