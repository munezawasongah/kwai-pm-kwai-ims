import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireCapability } from "@/lib/authorization";

const updateUserSchema = z.object({
  role: z.enum(["ADMIN", "MANAGER", "SALES_AGENT", "OPERATIONS", "ACCOUNTANT", "DRIVER_GUIDE", "STAFF"]).optional(),
  jobTitle: z.string().min(1).max(80).optional(),
  department: z.string().max(60).optional().nullable(),
  employeeNumber: z.string().max(40).optional().nullable(),
  startDate: z.coerce.date().optional().nullable(),
  emergencyName: z.string().max(80).optional().nullable(),
  emergencyPhone: z.string().max(40).optional().nullable(),
  employmentType: z.enum(["PERMANENT","FIXED_TERM_CONTRACT","PROBATION","CASUAL","INTERNSHIP","CONSULTANT"]).optional(),
  employmentStatus: z.enum(["ACTIVE","ON_LEAVE","SUSPENDED","RESIGNED","TERMINATED","CONTRACT_ENDED","RETIRED"]).optional(),
  contractEndDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  exitReason: z.string().max(500).optional().nullable(),
  annualLeaveDays: z.number().int().min(0).max(365).optional(),
  isActive: z.boolean().optional(),
  phone: z.string().max(40).optional().nullable(),
  password: z.string().min(10, "Password must be at least 10 characters").optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, denied } = await requireCapability("users:write");
  if (denied) return denied;

  const parsed = updateUserSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const d = parsed.data;
  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const actorId = (session?.user as { id?: string } | undefined)?.id;

  // Guard against an administrator locking themselves out, and against removing
  // the last administrator, which would leave nobody able to manage accounts.
  if (target.role === "ADMIN" && (d.role && d.role !== "ADMIN" || d.isActive === false)) {
    const otherAdmins = await prisma.user.count({
      where: { role: "ADMIN", isActive: true, id: { not: target.id } },
    });
    if (otherAdmins === 0) {
      return NextResponse.json(
        { error: "This is the last active administrator. Promote another admin first." },
        { status: 409 }
      );
    }
  }

  if (target.id === actorId && d.isActive === false) {
    return NextResponse.json({ error: "You cannot deactivate your own account." }, { status: 409 });
  }

  const user = await prisma.user.update({
    where: { id: params.id },
    data: {
      ...(d.role !== undefined && { role: d.role }),
      ...(d.isActive !== undefined && { isActive: d.isActive }),
      ...(d.phone !== undefined && { phone: d.phone }),
      ...(d.jobTitle !== undefined && { jobTitle: d.jobTitle }),
      ...(d.department !== undefined && { department: d.department }),
      ...(d.employeeNumber !== undefined && { employeeNumber: d.employeeNumber }),
      ...(d.startDate !== undefined && { startDate: d.startDate }),
      ...(d.emergencyName !== undefined && { emergencyName: d.emergencyName }),
      ...(d.emergencyPhone !== undefined && { emergencyPhone: d.emergencyPhone }),
      ...(d.employmentType !== undefined && { employmentType: d.employmentType }),
      ...(d.employmentStatus !== undefined && { employmentStatus: d.employmentStatus }),
      ...(d.contractEndDate !== undefined && { contractEndDate: d.contractEndDate }),
      ...(d.endDate !== undefined && { endDate: d.endDate }),
      ...(d.exitReason !== undefined && { exitReason: d.exitReason }),
      ...(d.annualLeaveDays !== undefined && { annualLeaveDays: d.annualLeaveDays }),
      // Ending employment also removes sign-in access; the record itself is kept.
      ...(d.employmentStatus !== undefined &&
        !["ACTIVE", "ON_LEAVE", "SUSPENDED"].includes(d.employmentStatus) && { isActive: false }),
      ...(d.password !== undefined && { passwordHash: await bcrypt.hash(d.password, 10) }),
      // Switching someone to driver/guide requires a staff profile to exist.
      ...(d.role === "DRIVER_GUIDE" && {
        staffProfile: { upsert: { create: {}, update: {} } },
      }),
    },
    select: {
      id: true, email: true, firstName: true, lastName: true,
      role: true, isActive: true, jobTitle: true, department: true,
    },
  });

  return NextResponse.json(user);
}

/**
 * Permanently delete a staff account.
 *
 * Only possible when the account has no linked business records. Once someone has
 * handled a booking, raised an invoice, sent a client message or taken leave,
 * deleting them would orphan or destroy those records — so deletion is refused and
 * the caller is told to record a departure instead, which keeps the history intact.
 *
 * This exists mainly for correcting mistakes and clearing test accounts.
 */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { session, denied } = await requireCapability("users:write");
  if (denied) return denied;

  const actorId = (session?.user as { id?: string } | undefined)?.id;

  const target = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true, role: true, firstName: true, lastName: true },
  });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (target.id === actorId) {
    return NextResponse.json({ error: "You cannot delete your own account." }, { status: 409 });
  }

  if (target.role === "ADMIN") {
    const otherAdmins = await prisma.user.count({
      where: { role: "ADMIN", isActive: true, id: { not: target.id } },
    });
    if (otherAdmins === 0) {
      return NextResponse.json(
        { error: "This is the last administrator. Promote another admin first." },
        { status: 409 }
      );
    }
  }

  // Anything that would be orphaned or lost by deleting this account.
  const [bookings, invoices, messages, leave, decisions, assignments] = await Promise.all([
    prisma.booking.count({ where: { assignedAgentId: target.id } }),
    prisma.invoice.count({ where: { createdById: target.id } }),
    prisma.message.count({ where: { sentById: target.id } }),
    prisma.leaveRequest.count({ where: { userId: target.id } }),
    prisma.leaveRequest.count({ where: { decidedById: target.id } }),
    prisma.staffAssignment.count({ where: { staffProfile: { userId: target.id } } }),
  ]);

  const blockers: string[] = [];
  if (bookings) blockers.push(`${bookings} booking(s)`);
  if (invoices) blockers.push(`${invoices} invoice(s)`);
  if (messages) blockers.push(`${messages} client message(s)`);
  if (leave) blockers.push(`${leave} leave request(s)`);
  if (decisions) blockers.push(`${decisions} leave decision(s)`);
  if (assignments) blockers.push(`${assignments} trip assignment(s)`);

  if (blockers.length > 0) {
    return NextResponse.json(
      {
        error:
          `${target.firstName} ${target.lastName} is linked to ${blockers.join(", ")}. ` +
          `Deleting would destroy that history. Record a departure instead — it removes their ` +
          `access and moves them to Former, keeping the records intact.`,
        blockers,
      },
      { status: 409 }
    );
  }

  // staffProfile is removed by the cascade defined on the relation.
  await prisma.user.delete({ where: { id: target.id } });

  return NextResponse.json({ deleted: true });
}
