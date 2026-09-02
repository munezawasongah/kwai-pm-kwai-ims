/**
 * Public vs staff route policy — pure, dependency-free, and therefore unit-testable.
 *
 * Kept out of middleware.ts deliberately: this decides who can reach the internal
 * management system, so it must be verifiable without spinning up Next.js.
 */

/** Marketing pages any visitor may view without an account. */
export const PUBLIC_EXACT = [
  "/",
  "/about",
  "/destinations",
  "/experiences",
  "/voices",
  "/contact",
  "/privacy",
  "/terms",
  "/safety",
];

/**
 * Prefixes open to unauthenticated requests.
 *
 * - /site       static marketing assets (css/js/html)
 * - /login      the staff sign-in page itself
 * - /api/auth   NextAuth's own endpoints
 * - /api/public visitor-facing endpoints (the enquiry form)
 * - /api/health platform health probe
 * - /api/webhooks  Meta calls this; authenticated by HMAC signature instead
 * - /api/cron   scheduler calls this; authenticated by CRON_SECRET instead
 */
export const PUBLIC_PREFIXES = [
  "/site",
  "/login",
  "/api/auth",
  "/api/public",
  "/api/health",
  "/api/webhooks",
  "/api/cron",
];

/**
 * True if the path may be served to a visitor with no session.
 * Everything else is the IMS and requires a signed-in staff user.
 */
export function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_EXACT.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}
