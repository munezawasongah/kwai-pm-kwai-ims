/**
 * Pure authorization policy — no next-auth, no Prisma, no framework imports.
 *
 * Kept dependency-free deliberately: the permission matrix is the security policy for
 * the whole system, so it must be unit-testable in isolation without a database or a
 * live session. Session-aware guards live in authorization.ts and build on this.
 */

export type AppRole =
  | "ADMIN"
  | "MANAGER"
  | "SALES_AGENT"
  | "OPERATIONS"
  | "ACCOUNTANT"
  | "DRIVER_GUIDE";

/**
 * Capability-keyed rather than role-keyed: routes ask "can this user record a payment?"
 * not "is this user an accountant?". Role changes then touch exactly one file.
 *
 * DRIVER_GUIDE deliberately has no financial or CRM capabilities — drivers see their
 * own schedule only, never invoices, payments, expenses or the client contact list.
 */
export const PERMISSIONS = {
  // CRM
  "clients:read": ["ADMIN", "MANAGER", "SALES_AGENT", "OPERATIONS", "ACCOUNTANT"],
  "clients:write": ["ADMIN", "MANAGER", "SALES_AGENT"],
  "clients:delete": ["ADMIN", "MANAGER"],

  // Bookings & itineraries
  "bookings:read": ["ADMIN", "MANAGER", "SALES_AGENT", "OPERATIONS", "ACCOUNTANT"],
  "bookings:write": ["ADMIN", "MANAGER", "SALES_AGENT", "OPERATIONS"],
  "itineraries:write": ["ADMIN", "MANAGER", "SALES_AGENT", "OPERATIONS"],

  // Money
  "invoices:read": ["ADMIN", "MANAGER", "ACCOUNTANT", "SALES_AGENT"],
  "invoices:write": ["ADMIN", "MANAGER", "ACCOUNTANT"],
  "payments:write": ["ADMIN", "MANAGER", "ACCOUNTANT"],
  "expenses:write": ["ADMIN", "MANAGER", "ACCOUNTANT", "OPERATIONS"],
  "financials:read": ["ADMIN", "MANAGER", "ACCOUNTANT"],

  // Operations
  "fleet:read": ["ADMIN", "MANAGER", "OPERATIONS"],
  "fleet:write": ["ADMIN", "MANAGER", "OPERATIONS"],
  "staff:read": ["ADMIN", "MANAGER", "OPERATIONS"],
  "staff:write": ["ADMIN", "MANAGER", "OPERATIONS"],

  // Messaging
  "messages:read": ["ADMIN", "MANAGER", "SALES_AGENT", "OPERATIONS"],
  "messages:write": ["ADMIN", "MANAGER", "SALES_AGENT", "OPERATIONS"],
} as const;

export type Capability = keyof typeof PERMISSIONS;

export function roleHasCapability(role: string | undefined | null, capability: Capability): boolean {
  if (!role) return false;
  return (PERMISSIONS[capability] as readonly string[]).includes(role);
}
