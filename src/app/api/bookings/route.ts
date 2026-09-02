import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createBookingSchema } from "@/lib/validators/schemas";
import { generateBookingRef } from "@/lib/reference-numbers";
import { requireCapability } from "@/lib/authorization";

export async function GET(req: NextRequest) {
  const { denied } = await requireCapability("bookings:read");
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const bookings = await prisma.booking.findMany({
    where: status ? { status: status as any } : undefined,
    include: { client: true, assignedAgent: true, invoices: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json(bookings);
}

export async function POST(req: NextRequest) {
  const { denied } = await requireCapability("bookings:write");
  if (denied) return denied;

  const body = await req.json();
  const parsed = createBookingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const bookingRef = await generateBookingRef();

  const d = parsed.data;

  // Fields are listed explicitly rather than spread: Prisma's create input is a
  // union of a relation-shaped type and a scalar-shaped one, and a spread object
  // can resolve to the wrong branch.
  const booking = await prisma.booking.create({
    data: {
      bookingRef,
      clientId: d.clientId,
      assignedAgentId: d.assignedAgentId ?? null,
      tripType: d.tripType,
      title: d.title,
      startDate: d.startDate ?? null,
      endDate: d.endDate ?? null,
      numAdults: d.numAdults,
      numChildren: d.numChildren,
      currency: d.currency,
      quotedTotal: d.quotedTotal ?? null,
      internalNotes: d.internalNotes ?? null,
    },
    include: { client: true },
  });

  // Automatically scaffold an empty itinerary shell for the operations team to fill in
  await prisma.itinerary.create({
    data: {
      bookingId: booking.id,
      title: booking.title,
    },
  });

  return NextResponse.json(booking, { status: 201 });
}
