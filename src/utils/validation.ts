/**
 * Email validation, mirroring `backend/src/config/email.ts`.
 *
 * There were four different email rules across four screens here, and none of them matched
 * what the server enforced on the same request. LoginScreen was the worst case: its rule was
 * looser than the server's, so it passed an address through, the server rejected it, and the
 * user saw a validation error on a field the form had already called valid.
 *
 * Two rules, split by purpose — not by screen:
 *
 *   isStrictEmail  — for input that creates or updates a stored address (register, the
 *                    admin support-email setting). The data-quality gate.
 *
 *   isLookupEmail  — for input that only identifies an existing account (login, forgot
 *                    password). Deliberately permissive: the address is about to be looked
 *                    up, so a strict rule here cannot protect anything and can only lock a
 *                    real user out of their own account.
 *
 * Invariant: anything `isStrictEmail` accepts, `isLookupEmail` must accept too. Keep these
 * in step with the backend — if the two disagree, one of them is wrong and the user pays.
 */

// Requires a TLD-shaped domain; rejects consecutive, leading and trailing dots and hyphens
// in domain labels. Zod's parser permits all of those, so this is the half it does not cover.
const DOMAIN_SHAPE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

// Copied verbatim from `z.regexes.email` (zod 4.4.3) — this is the other half of what the
// server enforces, and it is narrower than DOMAIN_SHAPE in the local part: no leading dot,
// no consecutive dots, no trailing dot, and only [A-Za-z0-9_'+-.] characters.
//
// Do not hand-approximate this. An earlier draft did, allowed punctuation the server
// rejects, and would have reproduced the very bug this module exists to fix. If zod is
// upgraded, re-copy it and re-run the differential check against the backend.
const ZOD_EMAIL = /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9-]*\.)+[A-Za-z]{2,}$/;

// Shaped like an address and nothing more.
const ADDRESS_SHAPE = /^[^\s@]+@[^\s@]+$/;

export function isStrictEmail(value: string): boolean {
  const email = value.trim();
  return email.length <= 254 && ZOD_EMAIL.test(email) && DOMAIN_SHAPE.test(email);
}

export function isLookupEmail(value: string): boolean {
  const email = value.trim();
  return email.length <= 320 && ADDRESS_SHAPE.test(email);
}

export const EMAIL_INVALID_MESSAGE = 'Enter a valid email address';
