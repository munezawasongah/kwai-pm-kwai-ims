import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateInvoicePdf } from "@/lib/pdf/invoice-pdf";
import { requireCapability } from "@/lib/authorization";
import { uploadPdf } from "@/lib/storage";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { denied } = await requireCapability("invoices:read");
  if (denied) return denied;

  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: { client: true, booking: true, lineItems: true },
  });

  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  const pdfBuffer = await generateInvoicePdf({
    invoiceNumber: invoice.invoiceNumber,
    bookingRef: invoice.booking.bookingRef,
    clientName: `${invoice.client.firstName} ${invoice.client.lastName}`,
    clientEmail: invoice.client.email,
    issueDate: invoice.createdAt.toLocaleDateString("en-GB"),
    dueDate: invoice.dueDate?.toLocaleDateString("en-GB") ?? null,
    currency: invoice.currency,
    lineItems: invoice.lineItems.map((li) => ({
      description: li.description,
      quantity: li.quantity,
      unitPrice: li.unitPrice.toFixed(2),
      lineTotal: li.lineTotal.toFixed(2),
    })),
    subtotal: invoice.subtotal.toFixed(2),
    taxAmount: invoice.taxAmount.toFixed(2),
    discountAmount: invoice.discountAmount.toFixed(2),
    totalAmount: invoice.totalAmount.toFixed(2),
    amountPaid: invoice.amountPaid.toFixed(2),
    balanceDue: invoice.balanceDue.toFixed(2),
    bankDetails: process.env.COMPANY_BANK_DETAILS,
  });

  // Archive the invoice PDF and record its real location.
  const stored = await uploadPdf(`invoices/${invoice.invoiceNumber}.pdf`, pdfBuffer);
  if (stored) {
    await prisma.document.create({
      data: { bookingId: invoice.bookingId, type: "INVOICE", fileUrl: stored.url },
    });
    await prisma.invoice.update({ where: { id: invoice.id }, data: { pdfUrl: stored.url } });
  }

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${invoice.invoiceNumber}.pdf"`,
    },
  });
}
