/**
 * Shared display formatting.
 *
 * Before this module there was no `src/utils` and no `src/lib` at all — 82 inline formatting
 * calls were spread across 23 files, including three different ad-hoc ways to render
 * ItemCondition and two byte-identical copies of the same compact-currency function. That is
 * what produced `LIKE_NEW` on the buyer's most-visited screens, `PKR 2500K`, and `1 bids`.
 *
 * Anything user-visible that needs a decision about *how* it reads belongs here.
 */

import type { ItemCondition } from '../types';

/**
 * Pinned so output does not follow the viewer's browser locale. Currency was previously
 * formatted with a bare `toLocaleString()` while dates passed 'en-PK' explicitly, so a visitor
 * with a German browser saw "PKR 2.500.000" next to Pakistani-formatted dates.
 */
const LOCALE = 'en-PK';

/* ── Currency ─────────────────────────────────────────────────────────────── */

/** Full precision: `PKR 2,500,000`. The default — use this unless space is genuinely tight. */
export function pkr(amount: number): string {
  return `PKR ${amount.toLocaleString(LOCALE)}`;
}

/**
 * Abbreviated for narrow columns and stat tiles: `PKR 2.5M`, `PKR 42K`, `PKR 900`.
 *
 * Replaces `PKR ${(n / 1000).toFixed(0)}K`, which divided by a thousand unconditionally and so
 * rendered PKR 2,500,000 as "PKR 2500K" — technically true, unreadable, and inconsistent with
 * the same figure shown in full elsewhere on the same screen.
 */
export function pkrCompact(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) {
    const millions = amount / 1_000_000;
    // Drop a trailing ".0" so 3,000,000 reads "PKR 3M" rather than "PKR 3.0M".
    return `PKR ${Number(millions.toFixed(1))}M`;
  }
  if (Math.abs(amount) >= 1_000) return `PKR ${Math.round(amount / 1_000)}K`;
  return `PKR ${amount.toLocaleString(LOCALE)}`;
}

/* ── Enums ────────────────────────────────────────────────────────────────── */

const CONDITION_LABELS: Record<string, string> = {
  NEW: 'New',
  LIKE_NEW: 'Like New',
  USED: 'Used',
};

/**
 * `LIKE_NEW` → `Like New`. Six screens rendered the raw enum, including Browse and Live
 * Bidding, so an item advertised as "Like New" on the landing page became "LIKE_NEW" one
 * click later. Falls back to the raw value rather than an empty string, so an unrecognised
 * condition is visibly wrong instead of silently blank.
 */
export function conditionLabel(condition: ItemCondition | string | null | undefined): string {
  if (!condition) return '—';
  return CONDITION_LABELS[condition] ?? condition;
}

/* ── Counting ─────────────────────────────────────────────────────────────── */

/**
 * `1 bid` / `2 bids`. The app said "1 bids" on live bidding and the admin monitor, and
 * "4 rating · 1 sales" on the seller card — the two screens buyers look at most.
 * Pass an explicit plural for irregular words.
 */
export function count(n: number, singular: string, pluralForm?: string): string {
  const word = n === 1 ? singular : (pluralForm ?? `${singular}s`);
  return `${n.toLocaleString(LOCALE)} ${word}`;
}

/* ── Dates ────────────────────────────────────────────────────────────────── */

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
