/**
 * Shared display formatting. Anything user-visible that needs a decision about how it reads
 * (currency, dates, counts, enum labels) belongs here, not inline.
 */

import type { ItemCondition } from '../types/api';

/**
 * Pinned so output does not follow the viewer's browser locale (a German browser would otherwise
 * show "PKR 2.500.000").
 */
const LOCALE = 'en-PK';

/** Full precision: `PKR 2,500,000`. The default — use this unless space is genuinely tight. */
export function pkr(amount: number): string {
  return `PKR ${amount.toLocaleString(LOCALE)}`;
}

/** Abbreviated for narrow columns and stat tiles: `PKR 2.5M`, `PKR 42K`, `PKR 900`. */
export function pkrCompact(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) {
    const millions = amount / 1_000_000;
    // Drop a trailing ".0" so 3,000,000 reads "PKR 3M" rather than "PKR 3.0M".
    return `PKR ${Number(millions.toFixed(1))}M`;
  }
  if (Math.abs(amount) >= 1_000) return `PKR ${Math.round(amount / 1_000)}K`;
  return `PKR ${amount.toLocaleString(LOCALE)}`;
}

const CONDITION_LABELS: Record<string, string> = {
  NEW: 'New',
  LIKE_NEW: 'Like New',
  USED: 'Used',
};

/**
 * `LIKE_NEW` → `Like New`. Falls back to the raw value rather than an empty string, so an
 * unrecognised condition is visibly wrong instead of silently blank.
 */
export function conditionLabel(condition: ItemCondition | string | null | undefined): string {
  if (!condition) return '—';
  return CONDITION_LABELS[condition] ?? condition;
}

/** `1 bid` / `2 bids`. Pass an explicit plural for irregular words. */
export function count(n: number, singular: string, pluralForm?: string): string {
  const word = n === 1 ? singular : (pluralForm ?? `${singular}s`);
  return `${n.toLocaleString(LOCALE)} ${word}`;
}

/** `Lahore, Punjab`, or just the part that is known; null when the seller gave neither. */
export function locatedIn(city: string | null | undefined, province: string | null | undefined): string | null {
  const parts = [city, province].filter((part): part is string => Boolean(part && part.trim()));
  return parts.length > 0 ? parts.join(', ') : null;
}

const toDate = (value: string | Date): Date => (value instanceof Date ? value : new Date(value));

/** `8 Aug` — dense lists and table cells. */
export function dateShort(value: string | Date): string {
  return toDate(value).toLocaleDateString(LOCALE, { day: 'numeric', month: 'short' });
}

/** `8 Aug 2026` — the general-purpose date. */
export function dateMedium(value: string | Date): string {
  return toDate(value).toLocaleDateString(LOCALE, { day: 'numeric', month: 'short', year: 'numeric' });
}

/** `Saturday, 8 August 2026` — page headers. */
export function dateLong(value: string | Date): string {
  return toDate(value).toLocaleDateString(LOCALE, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** `August 2026` — "member since" style. */
export function monthYear(value: string | Date): string {
  return toDate(value).toLocaleDateString(LOCALE, { month: 'long', year: 'numeric' });
}

/** `02:15` — bid timestamps. */
export function timeShort(value: string | Date): string {
  return toDate(value).toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' });
}

/** `8 Aug, 02:15` — when both the day and the time matter. */
export function dateTimeShort(value: string | Date): string {
  return `${dateShort(value)}, ${timeShort(value)}`;
}

/** `Tue, 9:42 pm` — when an auction ends, beside its countdown. */
export function weekdayTime(value: string | Date): string {
  return toDate(value).toLocaleString(LOCALE, { weekday: 'short', hour: 'numeric', minute: '2-digit' });
}

/** `Tue, 4 Nov at 9:42 pm` — the moment an auction ended. */
export function dateTimeLong(value: string | Date): string {
  const d = toDate(value);
  const day = d.toLocaleDateString(LOCALE, { weekday: 'short', day: 'numeric', month: 'short' });
  const time = d.toLocaleTimeString(LOCALE, { hour: 'numeric', minute: '2-digit' });
  return `${day} at ${time}`;
}

/**
 * `just now` / `12 min ago` / `3 h ago` / `2 d ago`. `now` is passed in, not read here: a screen
 * that shows it keeps the clock in state (`useNow`), because `Date.now()` in a render is not allowed.
 */
export function timeAgo(value: string | Date, now: number): string {
  const minutes = Math.floor(Math.max(0, now - toDate(value).getTime()) / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.floor(hours / 24)} d ago`;
}

/** `2 h 14 m` / `1 d 6 h` / `9 m`, or `Ended` once the time has passed. Two units at most. */
export function timeLeft(value: string | Date, now: number): string {
  const minutes = Math.floor((toDate(value).getTime() - now) / 60_000);
  if (minutes <= 0) return 'Ended';
  const days = Math.floor(minutes / 1_440);
  const hours = Math.floor((minutes % 1_440) / 60);
  if (days > 0) return `${days} d ${hours} h`;
  return hours > 0 ? `${hours} h ${minutes % 60} m` : `${minutes} m`;
}
