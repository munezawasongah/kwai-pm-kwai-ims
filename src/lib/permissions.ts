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

  // User administration. Deliberately ADMIN-only: creating accounts and changing
  // roles is how every other permission in this file gets granted, so it must be
  // the narrowest capability in the system.
  "users:read": ["ADMIN"],
  "users:write": ["ADMIN"],
} as const;

/** Human-readable labels for the permissions matrix shown in the UI. */
export const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  ADMIN: "Full access, including creating staff accounts and changing roles.",
  MANAGER: "All operations and financials. Cannot manage user accounts.",
  SALES_AGENT: "Clients, bookings, quotes and messaging. Cannot record payments.",
  OPERATIONS: "Bookings, itineraries, fleet, guide assignment and trip expenses.",
  ACCOUNTANT: "Invoices, payments, expenses and profit. No fleet or messaging.",
  DRIVER_GUIDE: "Own schedule only. No client lists, no financial data.",
};

export const ALL_ROLES: AppRole[] = [
  "ADMIN", "MANAGER", "SALES_AGENT", "OPERATIONS", "ACCOUNTANT", "DRIVER_GUIDE",
];

/** Capabilities grouped for display, so staff can see who reaches what. */
export const CAPABILITY_GROUPS: { label: string; capabilities: Capability[] }[] = [
  { label: "Clients", capabilities: ["clients:read", "clients:write", "clients:delete"] },
  { label: "Bookings", capabilities: ["bookings:read", "bookings:write", "itineraries:write"] },
  { label: "Money", capabilities: ["invoices:read", "invoices:write", "payments:write", "expenses:write", "financials:read"] },
  { label: "Operations", capabilities: ["fleet:read", "fleet:write", "staff:read", "staff:write"] },
  { label: "Messaging", capabilities: ["messages:read", "messages:write"] },
  { label: "Administration", capabilities: ["users:read", "users:write"] },
];

export type Capability = keyof typeof PERMISSIONS;

export function roleHasCapability(role: string | undefined | null, capability: Capability): boolean {
  if (!role) return false;
  return (PERMISSIONS[capability] as readonly string[]).includes(role);
}
