/**
 * Host-based separation of the two audiences.
 *
 *   www.kwaipmkwaitravelandtours.com  -> public marketing site only
 *   ims.kwaipmkwaitravelandtours.com  -> internal management system only
 *
 * Both are served by the same deployment. Splitting by hostname keeps the staff
 * application off the public domain entirely, so it isn't discoverable by browsing
 * the website or reading its HTML.
 *
 * A note on what this does and does not achieve: moving the IMS to its own hostname
 * reduces exposure — it is not itself a security control. The actual protection is
 * the session check and the per-route capability checks, which apply regardless of
 * which hostname a request arrives on. Treat this as tidiness, not as a lock.
 */

/**
 * Resolve the hostname the visitor actually typed.
 *
 * Behind Railway's router — and Cloudflare in front of it — the `host` header can
 * carry an internal hostname rather than the public one. `x-forwarded-host` is set
 * by the proxy to the original host and is therefore checked first. Getting this
 * wrong silently disables all host-based routing, which is exactly what happened
 * when only `host` was consulted.
 */
export function resolveHost(headers: {
  get(name: string): string | null;
}): string | null {
  const forwarded = headers.get("x-forwarded-host");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("host");
}

/**
 * Hosts that serve both audiences: local development and Railway's generated
 * domain. No host-based redirects are applied on these, so the app stays usable
 * before (and independently of) the custom domains.
 */
export function isSharedHost(hostname: string | null | undefined): boolean {
  if (!hostname) return false;
  const host = hostname.split(":")[0].toLowerCase();
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.endsWith(".up.railway.app")
  );
}

/** Hostnames that should serve the internal management system. */
export function isImsHost(hostname: string | null | undefined): boolean {
  if (!hostname) return false;
  const host = hostname.split(":")[0].toLowerCase();

  // Explicit IMS subdomain
  if (host.startsWith("ims.")) return true;

  // Shared hosts serve everything, including the IMS.
  return isSharedHost(host);
}

/** True when the host serves only the public marketing site. */
export function isPublicSiteHost(hostname: string | null | undefined): boolean {
  return !isImsHost(hostname);
}

/** Paths belonging to the internal management system. */
const IMS_PREFIXES = [
  "/dashboard",
  "/clients",
  "/bookings",
  "/invoices",
  "/inbox",
  "/fleet",
  "/staff",
  "/settings",
  "/account",
  "/login",
];

export function isImsPath(pathname: string): boolean {
  return IMS_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

/** Marketing pages, which have no place on the IMS subdomain. */
const SITE_PATHS = [
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

export function isMarketingPath(pathname: string): boolean {
  return SITE_PATHS.includes(pathname);
}
