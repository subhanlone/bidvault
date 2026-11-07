// Mirrors backend/src/config/otp.ts, kept in sync by hand because the two repos deploy separately.
// Used only for display copy ("valid for N seconds") and as a fallback deadline. The live countdown
// must be driven by the `codeExpiresAt` the server returns, never by this constant, or it drifts
// from the real expiry.
export const OTP_WINDOW_SECONDS = 90;

// How long before the user may request a new code. Deliberately shorter than the code's validity
// window, so the two are not conflated.
export const RESEND_COOLDOWN_SECONDS = 60;

/** Absolute deadline (epoch ms) from a server `codeExpiresAt`, falling back to the nominal window. */
export function deadlineFrom(iso?: string): number {
  return iso ? new Date(iso).getTime() : Date.now() + OTP_WINDOW_SECONDS * 1000;
}

/** Whole seconds remaining until `deadline`, floored at zero. */
export function secsUntil(deadline: number): number {
  return Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
}
