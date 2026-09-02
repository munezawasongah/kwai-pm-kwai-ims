import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, roleHasCapability } from "@/lib/authorization";

const decisionSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "CANCELLED"]),
  decisionNote: z.string().max(1000).optional().or(z.literal("")),
  /** HR may correct the working-day count, e.g. when a public holiday falls inside the period. */
  days: z.number().int().min(1).max(365).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;

  const parsed = decisionSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const role = (session?.user as { role?: string } | undefined)?.role;
  const actorId = (session?.user as { id?: string } | undefined)?.id;

  const request = await prisma.leaveRequest.findUnique({ where: { id: params.id } });
  if (!request) return NextResponse.json({ error: "Request not found" }, { status: 404 });

  const canApprove = roleHasCapability(role, "leave:approve");
  const isOwn = request.userId === actorId;

  // An employee may withdraw their own pending request; only an approver may
  // approve or reject — and never their own request.
  if (parsed.data.status === "CANCELLED") {
    if (!isOwn && !canApprove) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else {
    if (!canApprove) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (isOwn) {
      return NextResponse.json(
        { error: "You cannot decide your own leave request. Ask another approver." },
        { status: 403 }
      );
    }
  }

  if (request.status !== "PENDING") {
    return NextResponse.json(
      { error: `This request has already been ${request.status.toLowerCase()}.` },
      { status: 409 }
    );
  }

  const updated = await prisma.leaveRequest.update({
    where: { id: params.id },
    data: {
      status: parsed.data.status,
      decisionNote: parsed.data.decisionNote || null,
      decidedById: actorId ?? null,
      decidedAt: new Date(),
      ...(parsed.data.days !== undefined && canApprove && { days: parsed.data.days }),
    },
  });

  return NextResponse.json(updated);
}
