import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NewInvoiceDialog } from "@/components/invoices/new-invoice-dialog";

export default async function InvoicesPage() {
  const [invoices, bookings] = await Promise.all([
    prisma.invoice.findMany({
      include: { client: true, booking: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.booking.findMany({
      select: { id: true, bookingRef: true, title: true, clientId: true, currency: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand">Invoices</h1>
        <NewInvoiceDialog bookings={bookings} />
      </div>

      <Card>
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-6 py-3">Invoice #</th>
              <th className="px-6 py-3">Client</th>
              <th className="px-6 py-3">Booking</th>
              <th className="px-6 py-3">Total</th>
              <th className="px-6 py-3">Balance Due</th>
              <th className="px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-6 py-3">
                  <Link href={`/invoices/${inv.id}`} className="font-medium text-brand hover:underline">
                    {inv.invoiceNumber}
                  </Link>
                </td>
                <td className="px-6 py-3">
                  {inv.client.firstName} {inv.client.lastName}
                </td>
                <td className="px-6 py-3">{inv.booking.bookingRef}</td>
                <td className="px-6 py-3">
                  {inv.currency} {inv.totalAmount.toString()}
                </td>
                <td className="px-6 py-3">
                  {inv.currency} {inv.balanceDue.toString()}
                </td>
                <td className="px-6 py-3">
                  <Badge status={inv.status} />
                </td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                  No invoices yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
