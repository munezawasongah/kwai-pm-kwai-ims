import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCapability } from "@/lib/authorization";
import { createVehicleSchema } from "@/lib/validators/schemas";

export async function GET(req: NextRequest) {
  const { denied } = await requireCapability("fleet:read");
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const vehicles = await prisma.vehicle.findMany({
    where: status ? { status: status as any } : undefined,
    include: {
      assignments: {
        where: { endDate: { gte: new Date() } },
        include: { booking: true },
        orderBy: { startDate: "asc" },
      },
    },
    orderBy: { plateNumber: "asc" },
  });

  // Flag vehicles with insurance/inspection expiring within 30 days for the dashboard
  const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const withAlerts = vehicles.map((v) => ({
    ...v,
    alerts: {
      insuranceExpiringSoon: !!v.insuranceExpiry && v.insuranceExpiry <= in30Days,
      inspectionExpiringSoon: !!v.inspectionExpiry && v.inspectionExpiry <= in30Days,
    },
  }));

  return NextResponse.json(withAlerts);
}

export async function POST(req: NextRequest) {
  const { denied } = await requireCapability("fleet:write");
  if (denied) return denied;

  const parsed = createVehicleSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const d = parsed.data;
  const vehicle = await prisma.vehicle.create({
    data: {
      plateNumber: d.plateNumber,
      make: d.make,
      model: d.model,
      year: d.year ?? null,
      capacitySeats: d.capacitySeats,
      insuranceExpiry: d.insuranceExpiry ?? null,
      inspectionExpiry: d.inspectionExpiry ?? null,
      notes: d.notes ?? null,
    },
  });
  return NextResponse.json(vehicle, { status: 201 });
}
