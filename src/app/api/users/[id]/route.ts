import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireCapability } from "@/lib/authorization";

const updateUserSchema = z.object({
  role: z.enum(["ADMIN", "MANAGER", "SALES_AGENT", "OPERATIONS", "ACCOUNTANT", "DRIVER_GUIDE"]).optional(),
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
      ...(d.password !== undefined && { passwordHash: await bcrypt.hash(d.password, 10) }),
      // Switching someone to driver/guide requires a staff profile to exist.
      ...(d.role === "DRIVER_GUIDE" && {
        staffProfile: { upsert: { create: {}, update: {} } },
      }),
    },
    select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true },
  });

  return NextResponse.json(user);
}
