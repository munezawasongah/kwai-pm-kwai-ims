import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { createClientSchema } from "@/lib/validators/schemas";
import { requireCapability } from "@/lib/authorization";

export async function GET(req: NextRequest) {
  const { denied } = await requireCapability("clients:read");
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  const clients = await prisma.client.findMany({
    where: q
      ? {
          OR: [
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(clients);
}

export async function POST(req: NextRequest) {
  const { denied } = await requireCapability("clients:write");
  if (denied) return denied;

  const body = await req.json();
  const parsed = createClientSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const d = parsed.data;
  const client = await prisma.client.create({
    data: {
      firstName: d.firstName,
      lastName: d.lastName,
      email: d.email ?? null,
      phone: d.phone,
      nationality: d.nationality ?? null,
      passportNumber: d.passportNumber ?? null,
      source: d.source,
      notes: d.notes ?? null,
      ...(d.preferences !== undefined && { preferences: d.preferences as Prisma.InputJsonValue }),
    },
  });
  return NextResponse.json(client, { status: 201 });
}
