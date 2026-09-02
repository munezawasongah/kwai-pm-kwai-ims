import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppTemplate, textParams } from "@/lib/whatsapp";
import { createStaffAssignmentSchema } from "@/lib/validators/schemas";
import { requireCapability } from "@/lib/authorization";

export async function GET() {
  const { denied } = await requireCapability("staff:read");
  if (denied) return denied;

  const staff = await prisma.staffProfile.findMany({
    include: { user: true, assignments: { include: { booking: true }, orderBy: { startDate: "asc" } } },
  });
  return NextResponse.json(staff);
}

/**
 * Assign a driver/guide to a booking and immediately notify them via WhatsApp.
 * Body: { staffProfileId, bookingId, role, startDate, endDate, allowanceAmount? }
 */
export async function POST(req: NextRequest) {
  const { denied } = await requireCapability("staff:write");
  if (denied) return denied;

  const parsed = createStaffAssignmentSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const d = parsed.data;
  const assignment = await prisma.staffAssignment.create({
    data: {
      staffProfileId: d.staffProfileId,
      bookingId: d.bookingId,
      role: d.role,
      startDate: d.startDate,
      endDate: d.endDate,
      allowanceAmount: d.allowanceAmount ?? null,
      allowanceCurrency: d.allowanceCurrency ?? "TZS",
      notes: d.notes ?? null,
    },
    include: { staffProfile: { include: { user: true } }, booking: true },
  });

  const phone = assignment.staffProfile.user.phone;
  if (phone) {
    try {
      await sendWhatsAppTemplate({
        to: phone.replace(/^\+/, ""),
        templateName: "staff_schedule_alert",
        components: textParams(
          assignment.staffProfile.user.firstName,
          assignment.booking.bookingRef,
          new Date(assignment.startDate).toLocaleDateString("en-GB")
        ),
      });
      await prisma.staffAssignment.update({ where: { id: assignment.id }, data: { notified: true } });
    } catch (err) {
      // Assignment still succeeds even if the WhatsApp notification fails to send;
      // staff can be notified manually from the Inbox module.
      console.error("Failed to notify staff via WhatsApp:", err);
    }
  }

  return NextResponse.json(assignment, { status: 201 });
}
