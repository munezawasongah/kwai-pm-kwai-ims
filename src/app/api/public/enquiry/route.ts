import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateBookingRef } from "@/lib/reference-numbers";

/**
 * PUBLIC endpoint — website visitors post here from the contact form. No auth.
 *
 * Because it is unauthenticated and writes to the database, it is deliberately
 * constrained: strict validation, a honeypot field, a per-IP rate limit, and it can
 * only ever create a Client plus an INQUIRY booking. It cannot touch money, staff,
 * fleet, or existing bookings.
 */

const enquirySchema = z.object({
  fname: z.string().min(1).max(80),
  lname: z.string().min(1).max(80),
  email: z.string().email().max(160),
  phone: z.string().max(40).optional().or(z.literal("")),
  dates: z.string().max(160).optional().or(z.literal("")),
  guests: z.string().max(80).optional().or(z.literal("")),
  trip: z.array(z.string().max(40)).max(10).optional(),
  message: z.string().max(4000).optional().or(z.literal("")),
  // Honeypot: hidden from humans, commonly filled by bots.
  company: z.string().max(0).optional(),
});

// In-memory rate limit. Adequate for a single Railway instance; move to Redis if you
// ever scale to multiple replicas, since each would hold its own counter.
const RATE_LIMIT = 5; // submissions
const WINDOW_MS = 60 * 60 * 1000; // per hour, per IP
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);

  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT;
}

/** Best-effort E.164 normalization. Tanzanian local formats are the common case. */
function normalizePhone(raw?: string): string | null {
  if (!raw) return null;
  let p = raw.replace(/[\s\-()]/g, "");
  if (!p) return null;
  if (p.startsWith("+")) return p;
  if (p.startsWith("00")) return `+${p.slice(2)}`;
  if (p.startsWith("0")) return `+255${p.slice(1)}`; // local TZ number
  if (p.startsWith("255")) return `+${p}`;
  return `+${p}`;
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  if (rateLimited(ip)) {
    return NextResponse.json({ error: "Too many enquiries. Please try again later." }, { status: 429 });
  }

  const parsed = enquirySchema.safeParse(await req.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the form and try again." }, { status: 400 });
  }

  // Honeypot tripped — respond as success so bots don't learn anything.
  if (parsed.data.company) {
    return NextResponse.json({ ok: true });
  }

  const { fname, lname, email, phone, dates, guests, trip, message } = parsed.data;
  const normalizedPhone = normalizePhone(phone);

  try {
    // Returning enquirers shouldn't create duplicate client records.
    let client = await prisma.client.findFirst({
      where: normalizedPhone ? { OR: [{ email }, { phone: normalizedPhone }] } : { email },
    });

    if (!client) {
      client = await prisma.client.create({
        data: {
          firstName: fname,
          lastName: lname,
          email,
          // Phone is required on Client; fall back to a placeholder rather than
          // rejecting an otherwise good lead. Staff correct it before messaging.
          phone: normalizedPhone ?? "+000000000000",
          source: "WEBSITE",
          whatsappOptIn: !!normalizedPhone,
        },
      });
    }

    const interests = trip?.length ? trip.join(", ") : "General";

    const notes = [
      `Website enquiry received ${new Date().toISOString()}`,
      dates ? `Travel dates: ${dates}` : null,
      guests ? `Travellers: ${guests}` : null,
      `Interested in: ${interests}`,
      message ? `\nMessage:\n${message}` : null,
      normalizedPhone ? null : "⚠ No phone supplied — cannot WhatsApp this client until one is added.",
    ]
      .filter(Boolean)
      .join("\n");

    await prisma.booking.create({
      data: {
        bookingRef: await generateBookingRef(),
        clientId: client.id,
        title: `Website enquiry — ${interests}`,
        tripType: "CUSTOM",
        status: "INQUIRY",
        source: "WEBSITE",
        currency: "USD",
        internalNotes: notes,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[enquiry] failed to record website enquiry:", err);
    // Never leak internals to a public caller.
    return NextResponse.json({ error: "Something went wrong. Please try again or WhatsApp us." }, { status: 500 });
  }
}
