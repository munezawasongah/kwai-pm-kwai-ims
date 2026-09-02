import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { roleHasCapability, type Capability } from "@/lib/permissions";

// Re-exported so callers have a single import site for authorization concerns.
export { PERMISSIONS, roleHasCapability } from "@/lib/permissions";
export type { Capability, AppRole } from "@/lib/permissions";

/**
 * Authentication only. Use requireCapability for anything that reads or mutates business data.
 */
export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { session: null, unauthorized: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session, unauthorized: null };
}

/**
 * Authentication + authorization. 401 if not signed in, 403 if signed in but lacking
 * the capability.
 *
 *   const { denied } = await requireCapability("payments:write");
 *   if (denied) return denied;
 */
export async function requireCapability(capability: Capability) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return { session: null, denied: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const role = (session.user as { role?: string } | undefined)?.role;

  if (!roleHasCapability(role, capability)) {
    return {
      session,
      denied: NextResponse.json(
        { error: `Forbidden: your role (${role ?? "unknown"}) cannot perform "${capability}"` },
        { status: 403 }
      ),
    };
  }

  return { session, denied: null };
}
