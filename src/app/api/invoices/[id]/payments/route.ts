import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordPaymentSchema } from "@/lib/validators/schemas";
import { scheduleBookingConfirmation } from "@/lib/notifications/engine";
import { requireCapability } from "@/lib/authorization";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { denied } = await requireCapability("payments:write");
  if (denied) return denied;

  const body = await req.json();
  const parsed = recordPaymentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const invoice = await prisma.invoice.findUniqueOrThrow({
    where: { id: params.id },
    include: { booking: true },
  });

  const payment = await prisma.payment.create({
    data: {
      invoiceId: invoice.id,
      type: parsed.data.type,
      method: parsed.data.method,
      currency: parsed.data.currency,
      amount: parsed.data.amount,
      reference: parsed.data.reference ?? null,
      notes: parsed.data.notes ?? null,
    },
  });

  const newAmountPaid =
    parsed.data.type === "REFUND"
      ? Number(invoice.amountPaid) - parsed.data.amount
      : Number(invoice.amountPaid) + parsed.data.amount;

  const newBalanceDue = Number(invoice.totalAmount) - newAmountPaid;

  let newStatus: "PARTIALLY_PAID" | "PAID" | "SENT" = "SENT";
  if (newBalanceDue <= 0) newStatus = "PAID";
  else if (newAmountPaid > 0) newStatus = "PARTIALLY_PAID";

  const wasUnpaid = Number(invoice.amountPaid) === 0;

  const updatedInvoice = await prisma.invoice.update({
    where: { id: invoice.id },
    data: { amountPaid: newAmountPaid, balanceDue: newBalanceDue, status: newStatus },
  });

  // First payment received (deposit or full) on an INQUIRY/QUOTED booking -> confirm it
  // and fire the automated booking-confirmation + scheduled reminders.
  if (wasUnpaid && parsed.data.type !== "REFUND" && ["INQUIRY", "QUOTED"].includes(invoice.booking.status)) {
    await prisma.booking.update({
      where: { id: invoice.bookingId },
      data: { status: "CONFIRMED", confirmedTotal: invoice.totalAmount },
    });
    await scheduleBookingConfirmation(invoice.bookingId);
  }

  return NextResponse.json({ payment, invoice: updatedInvoice }, { status: 201 });
}
