import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppText } from "@/lib/whatsapp";
import { sendEmail } from "@/lib/email";
import { requireCapability } from "@/lib/authorization";

export async function GET(req: NextRequest) {
  const { denied } = await requireCapability("messages:read");
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");

  const messages = await prisma.message.findMany({
    where: clientId ? { clientId } : undefined,
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  return NextResponse.json(messages);
}

/**
 * Send a direct message from the unified inbox — used for ad-hoc staff replies,
 * not the automated trigger system (see /lib/notifications/engine.ts for that).
 */
export async function POST(req: NextRequest) {
  const { denied } = await requireCapability("messages:write");
  if (denied) return denied;

  const body = await req.json();
  const { clientId, bookingId, channel, body: text, subject, sentById } = body;

  const client = await prisma.client.findUniqueOrThrow({ where: { id: clientId } });

  let providerMessageId: string | undefined;
  let status: "SENT" | "FAILED" = "SENT";
  let errorMessage: string | undefined;

  try {
    if (channel === "WHATSAPP") {
      const result = await sendWhatsAppText({ to: client.phone.replace(/^\+/, ""), body: text });
      providerMessageId = result.messages?.[0]?.id;
    } else if (channel === "EMAIL") {
      if (!client.email) throw new Error("Client has no email address on file");
      const result = await sendEmail({ to: client.email, subject: subject ?? "Message from kwai pm kwai", html: text });
      providerMessageId = result.id;
    } else {
      throw new Error(`Unsupported channel: ${channel}`);
    }
  } catch (err: any) {
    status = "FAILED";
    errorMessage = String(err?.message ?? err);
  }

  const message = await prisma.message.create({
    data: {
      clientId,
      bookingId,
      sentById,
      channel,
      direction: "OUTBOUND",
      status,
      toAddress: channel === "WHATSAPP" ? client.phone : client.email ?? "",
      subject,
      body: text,
      providerMessageId,
      errorMessage,
    },
  });

  return NextResponse.json(message, { status: status === "SENT" ? 201 : 500 });
}
