import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookChallenge, verifyWebhookSignature, extractIncomingMessages } from "@/lib/whatsapp";

/**
 * Meta calls this once when you register the webhook URL in the Meta App Dashboard.
 * Configure the callback URL as: https://yourdomain.com/api/webhooks/whatsapp
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const result = verifyWebhookChallenge(mode, token, challenge);
  if (result) {
    return new NextResponse(result, { status: 200 });
  }
  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

/**
 * Receives inbound WhatsApp messages and delivery/read status updates.
 * Every inbound text message is stored and linked to the matching Client by phone number
 * (or logged as an "unmatched" message for staff to triage in the Inbox module if no client exists yet).
 */
export async function POST(req: NextRequest) {
  // Read the raw body — the signature is computed over the exact bytes Meta sent,
  // so req.json() (which re-serializes) cannot be used for verification.
  const rawBody = await req.text();
  const signature = req.headers.get("x-hub-signature-256");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
  }

  const incoming = extractIncomingMessages(payload);

  for (const msg of incoming) {
    if (msg.type !== "text" || !msg.text) continue;

    // Meta retries webhooks on non-2xx responses, so the same message id can arrive
    // more than once. Skip anything already stored to avoid duplicate inbox entries.
    const existing = await prisma.message.findFirst({ where: { providerMessageId: msg.id } });
    if (existing) continue;

    const phone = `+${msg.from}`;
    const client = await prisma.client.findFirst({ where: { phone } });

    await prisma.message.create({
      data: {
        clientId: client?.id,
        channel: "WHATSAPP",
        direction: "INBOUND",
        status: "RECEIVED",
        toAddress: process.env.WHATSAPP_PHONE_NUMBER_ID ?? "",
        fromAddress: phone,
        body: msg.text.body,
        providerMessageId: msg.id,
      },
    });
  }

  // Meta requires a 200 response quickly, regardless of processing outcome
  return NextResponse.json({ received: true });
}
