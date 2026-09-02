import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCapability } from "@/lib/authorization";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { denied } = await requireCapability("invoices:read");
  if (denied) return denied;

  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: { client: true, booking: true, lineItems: true, payments: true },
  });

  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  return NextResponse.json(invoice);
}
