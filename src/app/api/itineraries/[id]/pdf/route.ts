import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateItineraryPdf } from "@/lib/pdf/itinerary-pdf";
import { requireCapability } from "@/lib/authorization";
import { uploadPdf } from "@/lib/storage";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { denied } = await requireCapability("bookings:read");
  if (denied) return denied;

  const itinerary = await prisma.itinerary.findUnique({
    where: { id: params.id },
    include: {
      booking: { include: { client: true } },
      days: { include: { activities: { orderBy: { order: "asc" } } }, orderBy: { dayNumber: "asc" } },
    },
  });

  if (!itinerary) return NextResponse.json({ error: "Itinerary not found" }, { status: 404 });

  const pdfBuffer = await generateItineraryPdf({
    bookingRef: itinerary.booking.bookingRef,
    clientName: `${itinerary.booking.client.firstName} ${itinerary.booking.client.lastName}`,
    title: itinerary.title,
    summary: itinerary.summary,
    startDate: itinerary.booking.startDate?.toLocaleDateString("en-GB") ?? null,
    endDate: itinerary.booking.endDate?.toLocaleDateString("en-GB") ?? null,
    numTravelers: itinerary.booking.numAdults + itinerary.booking.numChildren,
    days: itinerary.days.map((d) => ({
      dayNumber: d.dayNumber,
      date: d.date?.toLocaleDateString("en-GB") ?? null,
      title: d.title,
      description: d.description,
      activities: d.activities.map((a) => ({
        startTime: a.startTime,
        name: a.name,
        description: a.description,
      })),
    })),
  });

  // Archive the PDF, then record the REAL url. Only write a Document row if the upload
  // actually succeeded — a row pointing at a nonexistent file is worse than no row.
  const stored = await uploadPdf(
    `itineraries/${itinerary.booking.bookingRef}-v${itinerary.version}.pdf`,
    pdfBuffer
  );

  if (stored) {
    await prisma.document.create({
      data: { bookingId: itinerary.bookingId, type: "ITINERARY", fileUrl: stored.url },
    });
    await prisma.itinerary.update({ where: { id: itinerary.id }, data: { pdfUrl: stored.url } });
  }

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="itinerary-${itinerary.booking.bookingRef}.pdf"`,
    },
  });
}
