import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Health check for Railway. Deliberately unauthenticated — the platform probes this
 * before any user session exists. Reports DB connectivity without leaking details.
 */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", database: "connected", timestamp: new Date().toISOString() });
  } catch {
    return NextResponse.json({ status: "degraded", database: "unreachable" }, { status: 503 });
  }
}
