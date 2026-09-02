import { prisma } from "@/lib/prisma";

/** KPK-2026-0001 style booking references */
export async function generateBookingRef(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.booking.count({
    where: { createdAt: { gte: new Date(`${year}-01-01`) } },
  });
  const seq = String(count + 1).padStart(4, "0");
  return `KPK-${year}-${seq}`;
}

/** INV-2026-0001 style invoice numbers */
export async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.invoice.count({
    where: { createdAt: { gte: new Date(`${year}-01-01`) } },
  });
  const seq = String(count + 1).padStart(4, "0");
  return `INV-${year}-${seq}`;
}
