import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { NewBookingDialog } from "@/components/bookings/new-booking-dialog";
import { BookingStatusSelect } from "@/components/bookings/booking-status-select";

const COLUMNS = ["INQUIRY", "QUOTED", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;

export default async function BookingsPage() {
  const [bookings, clients] = await Promise.all([
    prisma.booking.findMany({
      include: { client: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.client.findMany({ select: { id: true, firstName: true, lastName: true }, orderBy: { firstName: "asc" } }),
  ]);

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand">Bookings</h1>
        <NewBookingDialog clients={clients} />
      </div>

      <div className="grid grid-cols-1 gap-4 overflow-x-auto md:grid-cols-3 lg:grid-cols-6">
        {COLUMNS.map((status) => {
          const items = bookings.filter((b) => b.status === status);
          return (
            <div key={status} className="min-w-[220px] rounded-lg bg-gray-100 p-3">
              <p className="mb-3 text-xs font-semibold uppercase text-gray-500">
                {status.replace(/_/g, " ")} ({items.length})
              </p>
              <div className="space-y-2">
                {items.map((b) => (
                  <div key={b.id} className="rounded border bg-white p-3 shadow-sm">
                    <Link href={`/bookings/${b.id}`} className="block font-medium text-brand hover:underline">
                      {b.title}
                    </Link>
                    <p className="mb-2 text-xs text-gray-500">
                      {b.client.firstName} {b.client.lastName} · {b.bookingRef}
                    </p>
                    <BookingStatusSelect bookingId={b.id} currentStatus={b.status} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
