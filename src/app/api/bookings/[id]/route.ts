import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateBookingStatusSchema, createBookingSchema } from "@/lib/validators/schemas";
import { requireCapability, roleHasCapability } from "@/lib/authorization";
import { computeProfit, type SupportedCurrency } from "@/lib/currency";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { session, denied } = await requireCapability("bookings:read");
  if (denied) return denied;

  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: {
      client: true,
      assignedAgent: true,
      itinerary: { include: { days: { include: { activities: true }, orderBy: { dayNumber: "asc" } } } },
      invoices: { include: { payments: true, lineItems: true } },
      expenses: true,
      staffAssignments: { include: { staffProfile: { include: { user: true } } } },
      vehicleAssignments: { include: { vehicle: true } },
      documents: true,
    },
  });

  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  // Financial figures are only returned to roles allowed to see them.
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!roleHasCapability(role, "financials:read")) {
    const { invoices, expenses, ...rest } = booking;
    return NextResponse.json(rest);
  }

  // Normalize mixed-currency payments and expenses to the booking's currency
  // before subtracting — see src/lib/currency.ts.
  const payments = booking.invoices.flatMap((inv) =>
    inv.payments.map((p) => ({ amount: p.amount, currency: p.currency }))
  );
  const expenseRows = booking.expenses.map((e) => ({ amount: e.amount, currency: e.currency }));

  const profitSummary = computeProfit(payments, expenseRows, booking.currency as SupportedCurrency);

  return NextResponse.json({ ...booking, profitSummary });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { denied } = await requireCapability("bookings:write");
  if (denied) return denied;

  const body = await req.json();

  // Status-only update goes through the validated status schema.
  if (body.status && Object.keys(body).length === 1) {
    const parsed = updateBookingStatusSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const booking = await prisma.booking.update({
      where: { id: params.id },
      data: { status: parsed.data.status },
    });
    return NextResponse.json(booking);
  }

  // General update: validate against a partial of the create schema rather than
  // passing the raw body through to Prisma (mass-assignment protection).
  const parsed = createBookingSchema.partial().safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // Assign each field explicitly rather than spreading the parsed object.
  // Two reasons: Prisma's update input is a union of a relation-shaped type and a
  // scalar-shaped one, and passing a mixed object resolves to the wrong branch; and
  // clientId is deliberately excluded — moving a booking to a different client is
  // not something a general edit should do silently.
  const d = parsed.data;
  const booking = await prisma.booking.update({
    where: { id: params.id },
    data: {
      ...(d.title !== undefined && { title: d.title }),
      ...(d.tripType !== undefined && { tripType: d.tripType }),
      ...(d.startDate !== undefined && { startDate: d.startDate }),
      ...(d.endDate !== undefined && { endDate: d.endDate }),
      ...(d.numAdults !== undefined && { numAdults: d.numAdults }),
      ...(d.numChildren !== undefined && { numChildren: d.numChildren }),
      ...(d.currency !== undefined && { currency: d.currency }),
      ...(d.quotedTotal !== undefined && { quotedTotal: d.quotedTotal }),
      ...(d.internalNotes !== undefined && { internalNotes: d.internalNotes }),
      ...(d.assignedAgentId !== undefined && {
        assignedAgent: d.assignedAgentId
          ? { connect: { id: d.assignedAgentId } }
          : { disconnect: true },
      }),
    },
  });
  return NextResponse.json(booking);
}
