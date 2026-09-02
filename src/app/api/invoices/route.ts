import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createInvoiceSchema } from "@/lib/validators/schemas";
import { generateInvoiceNumber } from "@/lib/reference-numbers";
import { requireCapability } from "@/lib/authorization";

export async function GET(req: NextRequest) {
  const { denied } = await requireCapability("invoices:read");
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const invoices = await prisma.invoice.findMany({
    where: status ? { status: status as any } : undefined,
    include: { client: true, booking: true, payments: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(invoices);
}

export async function POST(req: NextRequest) {
  const { denied } = await requireCapability("invoices:write");
  if (denied) return denied;

  const body = await req.json();
  const parsed = createInvoiceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { lineItems, discountAmount, taxAmount, ...rest } = parsed.data;

  const subtotal = lineItems.reduce((sum, li) => sum + li.quantity * li.unitPrice, 0);
  const totalAmount = subtotal - discountAmount + taxAmount;
  const invoiceNumber = await generateInvoiceNumber();

  const invoice = await prisma.invoice.create({
    data: {
      ...rest,
      invoiceNumber,
      subtotal,
      discountAmount,
      taxAmount,
      totalAmount,
      balanceDue: totalAmount,
      status: "SENT",
      lineItems: {
        create: lineItems.map((li) => ({
          description: li.description,
          quantity: li.quantity,
          unitPrice: li.unitPrice,
          lineTotal: li.quantity * li.unitPrice,
        })),
      },
    },
    include: { lineItems: true, client: true, booking: true },
  });

  return NextResponse.json(invoice, { status: 201 });
}
