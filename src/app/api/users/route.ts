import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireCapability } from "@/lib/authorization";

const createUserSchema = z.object({
  email: z.string().email().max(160),
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  phone: z.string().max(40).optional().or(z.literal("")),
  role: z.enum(["ADMIN", "MANAGER", "SALES_AGENT", "OPERATIONS", "ACCOUNTANT", "DRIVER_GUIDE", "STAFF"]),
  password: z.string().min(10, "Password must be at least 10 characters"),
  // Employment details — what the person does, as opposed to what the system lets them reach.
  jobTitle: z.string().min(1, "Designation is required").max(80),
  department: z.string().max(60).optional().or(z.literal("")),
  employeeNumber: z.string().max(40).optional().or(z.literal("")),
  startDate: z.coerce.date().optional().nullable(),
  emergencyName: z.string().max(80).optional().or(z.literal("")),
  emergencyPhone: z.string().max(40).optional().or(z.literal("")),
  employmentType: z.enum(["PERMANENT","FIXED_TERM_CONTRACT","PROBATION","CASUAL","INTERNSHIP","CONSULTANT"]).default("PERMANENT"),
  contractEndDate: z.coerce.date().optional().nullable(),
  // Driver/guide extras, only used when role is DRIVER_GUIDE
  licenseNumber: z.string().max(60).optional().or(z.literal("")),
  languagesSpoken: z.string().max(200).optional().or(z.literal("")),
});

export async function GET() {
  const { denied } = await requireCapability("users:read");
  if (denied) return denied;

  const users = await prisma.user.findMany({
    orderBy: [{ isActive: "desc" }, { firstName: "asc" }],
    select: {
      id: true, email: true, firstName: true, lastName: true, phone: true,
      role: true, isActive: true, createdAt: true,
      staffProfile: { select: { id: true, licenseNumber: true, languagesSpoken: true } },
    },
    // passwordHash is never selected — it must not leave the server.
  });

  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const { denied } = await requireCapability("users:write");
  if (denied) return denied;

  const parsed = createUserSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const d = parsed.data;
  const email = d.email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "A user with that email already exists." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(d.password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      firstName: d.firstName,
      lastName: d.lastName,
      phone: d.phone || null,
      role: d.role,
      passwordHash,
      jobTitle: d.jobTitle,
      department: d.department || null,
      employeeNumber: d.employeeNumber || null,
      startDate: d.startDate ?? null,
      emergencyName: d.emergencyName || null,
      emergencyPhone: d.emergencyPhone || null,
      employmentType: d.employmentType,
      contractEndDate: d.contractEndDate ?? null,
      // A driver/guide needs a staff profile before they can be assigned to a trip.
      ...(d.role === "DRIVER_GUIDE" && {
        staffProfile: {
          create: {
            licenseNumber: d.licenseNumber || null,
            languagesSpoken: d.languagesSpoken
              ? d.languagesSpoken.split(",").map((s) => s.trim()).filter(Boolean)
              : [],
          },
        },
      }),
    },
    select: {
      id: true, email: true, firstName: true, lastName: true,
      role: true, isActive: true, jobTitle: true, department: true,
    },
  });

  return NextResponse.json(user, { status: 201 });
}
