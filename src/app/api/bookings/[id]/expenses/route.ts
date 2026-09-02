import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCapability } from "@/lib/authorization";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { denied } = await requireCapability("financials:read");
  if (denied) return denied;

  const expenses = await prisma.expense.findMany({
    where: { bookingId: params.id },
    orderBy: { incurredAt: "desc" },
  });
  return NextResponse.json(expenses);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { denied } = await requireCapability("expenses:write");
  if (denied) return denied;

  const body = await req.json();

  const expense = await prisma.expense.create({
    data: {
      bookingId: params.id,
      category: body.category,
      description: body.description || null,
      amount: Number(body.amount),
      currency: body.currency || "TZS",
      incurredAt: body.incurredAt ? new Date(body.incurredAt) : new Date(),
    },
  });

  return NextResponse.json(expense, { status: 201 });
}
