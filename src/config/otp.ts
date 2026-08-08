// Mirrors backend/src/config/otp.ts. Kept in sync manually — the two repos deploy separately, so
// this cannot be imported across the boundary.
//
// Used only for display copy ("valid for N seconds") and as a fallback deadline when a response
// didn't carry one. The live countdown must always be driven by the `codeExpiresAt` timestamp the
// server returns, never by this constant, or the timer drifts ahead of the real expiry.
export const OTP_WINDOW_SECONDS = 90;

// How long before the user may request a new code. Deliberately shorter than the window above —
// these were both 60s and easy to conflate, but the code now outlives the cooldown.
export const RESEND_COOLDOWN_SECONDS = 60;

/** Absolute deadline (epoch ms) from a server `codeExpiresAt`, falling back to the nominal window. */
export function deadlineFrom(iso?: string): number {
  return iso ? new Date(iso).getTime() : Date.now() + OTP_WINDOW_SECONDS * 1000;
}

/** Whole seconds remaining until `deadline`, floored at zero. */
export function secsUntil(deadline: number): number {
  return Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
}
