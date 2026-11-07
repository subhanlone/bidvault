/**
 * Email validation, mirroring `backend/src/config/email.ts`. Two rules, split by purpose rather
 * than by screen:
 * isStrictEmail, for input that creates or updates a stored address (register, the admin
 * support-email setting): the data-quality gate.
 * isLookupEmail, for input that only identifies an existing account (login, forgot password):
 * deliberately permissive, because a strict rule there can only lock a real user out of their own
 * account.
 * Invariant: anything `isStrictEmail` accepts, `isLookupEmail` must accept too. Keep both in step
 * with the backend.
 */

// Requires a TLD-shaped domain; rejects consecutive, leading and trailing dots and hyphens
// in domain labels. Zod's parser permits all of those, so this is the half it does not cover.
const DOMAIN_SHAPE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

// Copied verbatim from `z.regexes.email` (zod 4.4.3): the other half of what the server enforces,
// narrower than DOMAIN_SHAPE in the local part (no leading, consecutive or trailing dots; only
// [A-Za-z0-9_'+-.]). Do not hand-approximate it; if zod is upgraded, re-copy it and re-run the
// differential check against the backend.
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
