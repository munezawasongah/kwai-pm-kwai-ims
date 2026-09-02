import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RecordPaymentDialog } from "@/components/invoices/record-payment-dialog";

export default async function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: { client: true, booking: true, lineItems: true, payments: { orderBy: { paidAt: "desc" } } },
  });

  if (!invoice) notFound();

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand">{invoice.invoiceNumber}</h1>
          <p className="text-sm text-gray-500">
            <Link href={`/bookings/${invoice.bookingId}`} className="text-brand hover:underline">
              {invoice.booking.bookingRef}
            </Link>{" "}
            ·{" "}
            <Link href={`/clients/${invoice.clientId}`} className="text-brand hover:underline">
              {invoice.client.firstName} {invoice.client.lastName}
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge status={invoice.status} />
          <a
            href={`/api/invoices/${invoice.id}/pdf`}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-brand hover:underline"
          >
            Download PDF
          </a>
          <RecordPaymentDialog invoiceId={invoice.id} currency={invoice.currency} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold">Line Items</h2>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="py-2">Description</th>
                <th className="py-2 text-right">Qty</th>
                <th className="py-2 text-right">Unit Price</th>
                <th className="py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems.map((li) => (
                <tr key={li.id} className="border-t">
                  <td className="py-2">{li.description}</td>
                  <td className="py-2 text-right">{li.quantity}</td>
                  <td className="py-2 text-right">{li.unitPrice.toString()}</td>
                  <td className="py-2 text-right">{li.lineTotal.toString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="ml-auto mt-4 w-56 space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{invoice.subtotal.toString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Discount</span>
              <span>-{invoice.discountAmount.toString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax</span>
              <span>{invoice.taxAmount.toString()}</span>
            </div>
            <div className="flex justify-between border-t pt-1 font-bold">
              <span>Total</span>
              <span>{invoice.totalAmount.toString()}</span>
            </div>
            <div className="flex justify-between text-emerald-600">
              <span>Paid</span>
              <span>{invoice.amountPaid.toString()}</span>
            </div>
            <div className="flex justify-between font-bold text-red-500">
              <span>Balance Due</span>
              <span>{invoice.balanceDue.toString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold">Payment History</h2>
        </CardHeader>
        <CardContent>
          {invoice.payments.length === 0 && <p className="text-sm text-gray-400">No payments recorded yet.</p>}
          <div className="space-y-2">
            {invoice.payments.map((p) => (
              <div key={p.id} className="flex justify-between rounded border p-3 text-sm">
                <span>
                  {p.type} · {p.method.replace(/_/g, " ")} {p.reference ? `· ${p.reference}` : ""}
                </span>
                <span className="font-medium">
                  {p.currency} {p.amount.toString()} — {new Date(p.paidAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
