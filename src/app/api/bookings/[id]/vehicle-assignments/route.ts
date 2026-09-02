import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCapability } from "@/lib/authorization";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { denied } = await requireCapability("fleet:write");
  if (denied) return denied;

  const body = await req.json();

  const assignment = await prisma.vehicleAssignment.create({
    data: {
      bookingId: params.id,
      vehicleId: body.vehicleId,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      notes: body.notes || null,
    },
    include: { vehicle: true },
  });

  await prisma.vehicle.update({ where: { id: body.vehicleId }, data: { status: "ON_TRIP" } });

  return NextResponse.json(assignment, { status: 201 });
}
