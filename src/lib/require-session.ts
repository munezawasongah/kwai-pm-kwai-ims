/**
 * Re-exported from authorization.ts so existing imports keep working.
 * Prefer importing requireCapability from "@/lib/authorization" for new routes —
 * authentication alone is rarely the right check for business data.
 */
export { requireSession, requireCapability, roleHasCapability, PERMISSIONS } from "@/lib/authorization";
export type { Capability, AppRole } from "@/lib/authorization";
