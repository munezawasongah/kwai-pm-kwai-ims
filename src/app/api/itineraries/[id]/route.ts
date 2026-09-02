import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/require-session";
import type { Prisma } from "@prisma/client";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;

  const body = await req.json();
  const { title, summary } = body;

  const itinerary = await prisma.itinerary.update({
    where: { id: params.id },
    data: { title, summary },
  });

  return NextResponse.json(itinerary);
}

/**
 * Replaces all days/activities for this itinerary with the payload provided.
 * Simpler and safer for an internal tool than diffing individual day/activity CRUD ops.
 *
 * Body: { days: [{ dayNumber, date?, title, description?, activities: [{ order, name, description?, startTime?, costItemType?, costAmount?, costCurrency? }] }] }
 */
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { unauthorized } = await requireSession();
  if (unauthorized) return unauthorized;

  const body = await req.json();
  const days: any[] = body.days ?? [];

  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.itineraryDay.deleteMany({ where: { itineraryId: params.id } });

    for (const day of days) {
      await tx.itineraryDay.create({
        data: {
          itineraryId: params.id,
          dayNumber: day.dayNumber,
          date: day.date ? new Date(day.date) : null,
          title: day.title,
          description: day.description || null,
          activities: {
            create: (day.activities ?? []).map((a: any, i: number) => ({
              order: a.order ?? i,
              name: a.name,
              description: a.description || null,
              location: a.location || null,
              startTime: a.startTime || null,
              costItemType: a.costItemType || null,
              costAmount: a.costAmount ? Number(a.costAmount) : null,
              costCurrency: a.costCurrency || "USD",
            })),
          },
        },
      });
    }

    return tx.itinerary.findUnique({
      where: { id: params.id },
      include: { days: { include: { activities: true }, orderBy: { dayNumber: "asc" } } },
    });
  });

  return NextResponse.json(result);
}
