import Link from "next/link";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { roleHasCapability } from "@/lib/permissions";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  const canSeeFinancials = roleHasCapability(role, "financials:read");

  const [activeBookings, pendingInvoices, vehiclesAvailable, upcomingTrips, newEnquiries] =
    await Promise.all([
      prisma.booking.count({ where: { status: { in: ["CONFIRMED", "IN_PROGRESS"] } } }),
      canSeeFinancials
        ? prisma.invoice.count({ where: { status: { in: ["SENT", "PARTIALLY_PAID", "OVERDUE"] } } })
        : Promise.resolve(0),
      prisma.vehicle.count({ where: { status: "AVAILABLE" } }),
      prisma.booking.count({
        where: { startDate: { gte: new Date(), lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } },
      }),
      prisma.booking.count({ where: { status: "INQUIRY", source: "WEBSITE" } }),
    ]);

  // Website enquiries need a fast response — surface the newest ones directly.
  const latestEnquiries = await prisma.booking.findMany({
    where: { status: "INQUIRY", source: "WEBSITE" },
    include: { client: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const cards = [
    { label: "New Website Enquiries", value: newEnquiries, highlight: newEnquiries > 0 },
    { label: "Active Bookings", value: activeBookings },
    ...(canSeeFinancials ? [{ label: "Pending Invoices", value: pendingInvoices }] : []),
    { label: "Vehicles Available", value: vehiclesAvailable },
    { label: "Trips Next 7 Days", value: upcomingTrips },
  ];

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold text-brand">Dashboard</h1>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((c) => (
          <div
            key={c.label}
            className={`rounded-lg border bg-white p-6 shadow-sm ${
              c.highlight ? "border-amber-400 ring-1 ring-amber-200" : ""
            }`}
          >
            <p className="text-sm text-gray-500">{c.label}</p>
            <p className={`mt-2 text-3xl font-bold ${c.highlight ? "text-amber-600" : "text-brand"}`}>
              {c.value}
            </p>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <h2 className="font-semibold">Latest Website Enquiries</h2>
          <Link href="/bookings" className="text-sm text-brand hover:underline">
            View all bookings →
          </Link>
        </CardHeader>
        <CardContent>
          {latestEnquiries.length === 0 && (
            <p className="text-sm text-gray-400">
              No new website enquiries. Submissions from the contact form appear here.
            </p>
          )}
          <div className="space-y-2">
            {latestEnquiries.map((b) => (
              <Link
                key={b.id}
                href={`/bookings/${b.id}`}
                className="flex items-center justify-between rounded border p-3 hover:bg-gray-50"
              >
                <div>
                  <p className="font-medium">
                    {b.client.firstName} {b.client.lastName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {b.title} · {new Date(b.createdAt).toLocaleString()}
                  </p>
                </div>
                <Badge status={b.status} />
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
