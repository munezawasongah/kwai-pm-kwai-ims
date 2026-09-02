import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { roleHasCapability } from "@/lib/authorization";
import { computeProfit, formatMoney, type SupportedCurrency } from "@/lib/currency";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookingStatusSelect } from "@/components/bookings/booking-status-select";
import { ItineraryBuilder } from "@/components/bookings/itinerary-builder";
import { ExpenseForm } from "@/components/bookings/expense-form";
import { AssignVehicleForm, AssignStaffForm } from "@/components/bookings/assignment-forms";

export default async function BookingDetailPage({ params }: { params: { id: string } }) {
  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: {
      client: true,
      itinerary: { include: { days: { include: { activities: true }, orderBy: { dayNumber: "asc" } } } },
      invoices: { include: { payments: true } },
      expenses: { orderBy: { incurredAt: "desc" } },
      vehicleAssignments: { include: { vehicle: true } },
      staffAssignments: { include: { staffProfile: { include: { user: true } } } },
    },
  });

  if (!booking) notFound();

  const [vehicles, staff] = await Promise.all([
    prisma.vehicle.findMany({ where: { status: "AVAILABLE" } }),
    prisma.staffProfile.findMany({ include: { user: true } }),
  ]);

  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  const canSeeFinancials = roleHasCapability(role, "financials:read");

  const base = booking.currency as SupportedCurrency;
  const profit = computeProfit(
    booking.invoices.flatMap((inv) => inv.payments.map((p) => ({ amount: p.amount, currency: p.currency }))),
    booking.expenses.map((e) => ({ amount: e.amount, currency: e.currency })),
    base
  );

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand">{booking.title}</h1>
          <p className="text-sm text-gray-500">
            {booking.bookingRef} ·{" "}
            <Link href={`/clients/${booking.clientId}`} className="text-brand hover:underline">
              {booking.client.firstName} {booking.client.lastName}
            </Link>{" "}
            · {booking.tripType.replace(/_/g, " ")}
          </p>
        </div>
        <BookingStatusSelect bookingId={booking.id} currentStatus={booking.status} />
      </div>

      {canSeeFinancials && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardContent>
              <p className="text-xs text-gray-500">Revenue Collected</p>
              <p className="text-xl font-bold text-emerald-600">{formatMoney(profit.totalRevenue, base)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-xs text-gray-500">Expenses</p>
              <p className="text-xl font-bold text-red-500">{formatMoney(profit.totalExpenses, base)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-xs text-gray-500">Net Profit</p>
              <p className={`text-xl font-bold ${profit.netProfit >= 0 ? "text-brand" : "text-red-600"}`}>
                {formatMoney(profit.netProfit, base)}
              </p>
              <p className="text-[10px] text-gray-400">
                All figures converted to {base} at 1 USD = {profit.rateUsed.toLocaleString()} TZS
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <h2 className="font-semibold">Itinerary</h2>
        </CardHeader>
        <CardContent>
          {booking.itinerary && (
            <ItineraryBuilder
              itineraryId={booking.itinerary.id}
              initialTitle={booking.itinerary.title}
              initialSummary={booking.itinerary.summary}
              initialDays={booking.itinerary.days.map((d) => ({
                dayNumber: d.dayNumber,
                date: d.date ? d.date.toISOString().slice(0, 10) : null,
                title: d.title,
                description: d.description,
                activities: d.activities.map((a) => ({
                  order: a.order,
                  name: a.name,
                  description: a.description,
                  startTime: a.startTime,
                })),
              }))}
            />
          )}
        </CardContent>
      </Card>

      {canSeeFinancials && (
      <Card>
        <CardHeader className="flex items-center justify-between">
          <h2 className="font-semibold">Invoices</h2>
          <Link href={`/invoices?bookingId=${booking.id}`} className="text-sm text-brand hover:underline">
            Manage invoices →
          </Link>
        </CardHeader>
        <CardContent>
          {booking.invoices.length === 0 && <p className="text-sm text-gray-400">No invoices yet.</p>}
          <div className="space-y-2">
            {booking.invoices.map((inv) => (
              <Link
                key={inv.id}
                href={`/invoices/${inv.id}`}
                className="flex items-center justify-between rounded border p-3 hover:bg-gray-50"
              >
                <div>
                  <p className="font-medium">{inv.invoiceNumber}</p>
                  <p className="text-xs text-gray-500">
                    {inv.currency} {inv.totalAmount.toString()} · Balance: {inv.balanceDue.toString()}
                  </p>
                </div>
                <Badge status={inv.status} />
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
      )}

      {canSeeFinancials && (
      <Card>
        <CardHeader>
          <h2 className="font-semibold">Expenses</h2>
        </CardHeader>
        <CardContent className="space-y-3">
          <ExpenseForm bookingId={booking.id} />
          <div className="space-y-1">
            {booking.expenses.map((e) => (
              <div key={e.id} className="flex justify-between border-b py-1 text-sm">
                <span>
                  {e.category.replace(/_/g, " ")} {e.description ? `— ${e.description}` : ""}
                </span>
                <span className="font-medium">
                  {e.currency} {e.amount.toString()}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      )}

      <Card>
        <CardHeader>
          <h2 className="font-semibold">Vehicle Assignment</h2>
        </CardHeader>
        <CardContent className="space-y-3">
          <AssignVehicleForm bookingId={booking.id} vehicles={vehicles} />
          <div className="space-y-1">
            {booking.vehicleAssignments.map((va) => (
              <p key={va.id} className="text-sm">
                {va.vehicle.plateNumber} ({va.vehicle.make} {va.vehicle.model}) —{" "}
                {new Date(va.startDate).toLocaleDateString()} to {new Date(va.endDate).toLocaleDateString()}
              </p>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold">Driver / Guide Assignment</h2>
        </CardHeader>
        <CardContent className="space-y-3">
          <AssignStaffForm bookingId={booking.id} staff={staff} />
          <div className="space-y-1">
            {booking.staffAssignments.map((sa) => (
              <p key={sa.id} className="text-sm">
                {sa.staffProfile.user.firstName} {sa.staffProfile.user.lastName} — {sa.role.replace(/_/g, " ")} (
                {sa.notified ? "notified ✓" : "not yet notified"})
              </p>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
