import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, requireCapability, roleHasCapability } from "@/lib/authorization";
import { countWorkingDays, deductsFromBalance, annualLeaveBalance } from "@/lib/leave";

const createSchema = z.object({
  type: z.enum(["ANNUAL", "SICK", "MATERNITY", "PATERNITY", "COMPASSIONATE", "UNPAID", "STUDY"]),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  reason: z.string().max(1000).optional().or(z.literal("")),
});

/**
 * Anyone signed in sees their own requests. HR and management see everyone's.
 * The distinction is made from the session, never from a query parameter, so a
 * staff member cannot read a colleague's records by changing the URL.
 */
export async function GET(req: NextRequest) {
  const { session, unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;

  const role = (session?.user as { role?: string } | undefined)?.role;
  const userId = (session?.user as { id?: string } | undefined)?.id;
  const canSeeAll = roleHasCapability(role, "hr:read");

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const requests = await prisma.leaveRequest.findMany({
    where: {
      ...(canSeeAll ? {} : { userId }),
      ...(status ? { status: status as any } : {}),
    },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, jobTitle: true, department: true } },
      decidedBy: { select: { firstName: true, lastName: true } },
    },
    orderBy: [{ status: "asc" }, { startDate: "desc" }],
  });

  return NextResponse.json(requests);
}

/** Any signed-in employee may request leave for themselves. */
export async function POST(req: NextRequest) {
  const { session, unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const d = parsed.data;
  if (d.endDate < d.startDate) {
    return NextResponse.json({ error: "The end date is before the start date." }, { status: 400 });
  }

  const days = countWorkingDays(d.startDate, d.endDate);
  if (days === 0) {
    return NextResponse.json(
      { error: "That period contains no working days." },
      { status: 400 }
    );
  }

  // Refuse an annual-leave request that exceeds the remaining balance, rather
  // than accepting it and leaving HR to discover the overdraft at approval time.
  if (deductsFromBalance(d.type)) {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { annualLeaveDays: true },
    });
    const existing = await prisma.leaveRequest.findMany({
      where: { userId, status: { in: ["APPROVED", "PENDING"] } },
      select: { type: true, days: true, status: true },
    });
    const balance = annualLeaveBalance(user.annualLeaveDays, existing);
    if (days > balance.remaining) {
      return NextResponse.json(
        { error: `Only ${balance.remaining} day(s) of annual leave remain; you requested ${days}.` },
        { status: 400 }
      );
    }
  }

  const created = await prisma.leaveRequest.create({
    data: {
      userId,
      type: d.type,
      startDate: d.startDate,
      endDate: d.endDate,
      days,
      reason: d.reason || null,
    },
  });

  return NextResponse.json(created, { status: 201 });
}
