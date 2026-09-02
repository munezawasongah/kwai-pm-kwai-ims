import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dispatchNotification } from "@/lib/notifications/engine";

/**
 * Protect this route with a shared secret so it can't be triggered by the public.
 * Vercel Cron sends the header automatically if configured in vercel.json; for other
 * schedulers (e.g. cron-job.org, Railway cron), pass ?secret=... or an Authorization header.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret") ?? authHeader?.replace("Bearer ", "");

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const due = await prisma.scheduledNotification.findMany({
    where: { status: "PENDING", scheduledFor: { lte: new Date() } },
    take: 50, // batch size per run to stay within function time limits
  });

  const results = { sent: 0, failed: 0 };

  for (const n of due) {
    try {
      await dispatchNotification(n.id);
      results.sent++;
    } catch {
      results.failed++;
    }
  }

  return NextResponse.json({ processed: due.length, ...results });
}
