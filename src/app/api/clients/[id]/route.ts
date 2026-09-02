import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { requireCapability } from "@/lib/authorization";
import { createClientSchema } from "@/lib/validators/schemas";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { denied } = await requireCapability("clients:read");
  if (denied) return denied;

  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      bookings: { orderBy: { createdAt: "desc" } },
      messages: { orderBy: { createdAt: "desc" }, take: 50 },
      invoices: true,
    },
  });

  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });
  return NextResponse.json(client);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { denied } = await requireCapability("clients:write");
  if (denied) return denied;

  // Validate rather than passing the raw body to Prisma — otherwise a caller could
  // set arbitrary columns (mass assignment). partial() allows updating a subset.
  const parsed = createClientSchema.partial().safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const d = parsed.data;
  const client = await prisma.client.update({
    where: { id: params.id },
    data: {
      ...(d.firstName !== undefined && { firstName: d.firstName }),
      ...(d.lastName !== undefined && { lastName: d.lastName }),
      ...(d.email !== undefined && { email: d.email }),
      ...(d.phone !== undefined && { phone: d.phone }),
      ...(d.nationality !== undefined && { nationality: d.nationality }),
      ...(d.passportNumber !== undefined && { passportNumber: d.passportNumber }),
      ...(d.source !== undefined && { source: d.source }),
      ...(d.notes !== undefined && { notes: d.notes }),
      ...(d.preferences !== undefined && { preferences: d.preferences as Prisma.InputJsonValue }),
    },
  });
  return NextResponse.json(client);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { denied } = await requireCapability("clients:delete");
  if (denied) return denied;

  await prisma.client.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
