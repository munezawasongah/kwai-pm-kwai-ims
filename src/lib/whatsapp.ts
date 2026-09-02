/**
 * WhatsApp Business Cloud API client.
 *
 * Env vars required:
 *   WHATSAPP_TOKEN            - permanent or long-lived access token
 *   WHATSAPP_PHONE_NUMBER_ID  - your registered sending number's ID
 *   WHATSAPP_VERIFY_TOKEN     - arbitrary string you choose, used for webhook verification
 *   WHATSAPP_APP_SECRET       - Meta App Secret, used to verify inbound webhook signatures
 *   WHATSAPP_API_VERSION      - e.g. "v20.0"
 */

import crypto from "crypto";

const API_VERSION = process.env.WHATSAPP_API_VERSION || "v20.0";
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const TOKEN = process.env.WHATSAPP_TOKEN;

const BASE_URL = `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`;

interface SendTextParams {
  to: string; // E.164, no leading "+", e.g. "255712345678"
  body: string;
  previewUrl?: boolean;
}

interface SendTemplateParams {
  to: string;
  templateName: string;
  languageCode?: string;
  components?: Record<string, unknown>[];
}

async function callWhatsAppApi(payload: Record<string, unknown>) {
  if (!TOKEN || !PHONE_NUMBER_ID) {
    throw new Error("WhatsApp credentials are not configured (WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID)");
  }

  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(`WhatsApp API error: ${JSON.stringify(data)}`);
  }

  return data as { messages: { id: string }[] };
}

/** Send a free-form text message. Only allowed within the 24h customer-service window. */
export async function sendWhatsAppText({ to, body, previewUrl = false }: SendTextParams) {
  return callWhatsAppApi({
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body, preview_url: previewUrl },
  });
}

/** Send a pre-approved template message. Required to initiate contact outside the 24h window
 *  (e.g. booking confirmations, payment reminders, pre-arrival reminders). */
export async function sendWhatsAppTemplate({
  to,
  templateName,
  languageCode = "en",
  components = [],
}: SendTemplateParams) {
  return callWhatsAppApi({
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
      components,
    },
  });
}

/** Helper to build a template component with simple positional text parameters. */
export function textParams(...values: string[]) {
  return [
    {
      type: "body",
      parameters: values.map((v) => ({ type: "text", text: v })),
    },
  ];
}

/**
 * Verify the webhook subscription handshake (GET request from Meta).
 */
export function verifyWebhookChallenge(mode: string | null, token: string | null, challenge: string | null) {
  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return challenge;
  }
  return null;
}

/**
 * Verify that a webhook POST genuinely came from Meta.
 *
 * Meta signs the raw request body with your App Secret and sends the result as
 * `X-Hub-Signature-256: sha256=<hex>`. Without this check, anyone who learns your
 * webhook URL can inject fake inbound messages into the inbox.
 *
 * Requires WHATSAPP_APP_SECRET (Meta App Dashboard -> Settings -> Basic -> App Secret).
 * Must be computed over the RAW body bytes, not a re-serialized JSON object.
 */
export function verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  const appSecret = process.env.WHATSAPP_APP_SECRET;

  if (!appSecret) {
    // Fail closed in production; allow through in development so local testing with
    // curl/ngrok doesn't require a secret.
    if (process.env.NODE_ENV === "production") return false;
    return true;
  }

  if (!signatureHeader?.startsWith("sha256=")) return false;

  const expected = crypto.createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex");
  const received = signatureHeader.slice("sha256=".length);

  // Both buffers must be equal length for timingSafeEqual, so guard first.
  const expectedBuf = Buffer.from(expected, "hex");
  const receivedBuf = Buffer.from(received, "hex");
  if (expectedBuf.length !== receivedBuf.length) return false;

  return crypto.timingSafeEqual(expectedBuf, receivedBuf);
}

/**
 * Shape of an incoming WhatsApp webhook payload (simplified).
 * Full reference: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks
 */
export interface IncomingWhatsAppMessage {
  from: string; // sender's phone number
  id: string; // WhatsApp message id
  timestamp: string;
  type: "text" | "image" | "document" | "audio" | "video" | string;
  text?: { body: string };
}

export function extractIncomingMessages(payload: any): IncomingWhatsAppMessage[] {
  const messages: IncomingWhatsAppMessage[] = [];
  const entries = payload?.entry ?? [];
  for (const entry of entries) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      for (const msg of value?.messages ?? []) {
        messages.push(msg);
      }
    }
  }
  return messages;
}
