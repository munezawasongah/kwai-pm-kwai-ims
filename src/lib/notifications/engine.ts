import { prisma } from "@/lib/prisma";
import { sendWhatsAppTemplate, textParams } from "@/lib/whatsapp";
import { sendEmail } from "@/lib/email";
import type { NotificationTriggerType, MessageChannel } from "@prisma/client";

/**
 * Queue a notification to be dispatched later by the cron worker (/api/cron/notifications).
 * Keeping this as a queue (rather than sending inline) means:
 *  - a WhatsApp/email outage doesn't block the booking/payment flow
 *  - reminders scheduled for the future (48h before trip, post-trip, etc.) are handled naturally
 */
export async function scheduleNotification(params: {
  triggerType: NotificationTriggerType;
  channel: MessageChannel;
  clientId: string;
  bookingId?: string;
  invoiceId?: string;
  scheduledFor: Date;
  payload?: Record<string, unknown>;
}) {
  return prisma.scheduledNotification.create({
    data: {
      triggerType: params.triggerType,
      channel: params.channel,
      clientId: params.clientId,
      bookingId: params.bookingId,
      invoiceId: params.invoiceId,
      scheduledFor: params.scheduledFor,
      payload: params.payload as any,
    },
  });
}

/** Call this immediately after a payment is confirmed. */
export async function scheduleBookingConfirmation(bookingId: string) {
  const booking = await prisma.booking.findUniqueOrThrow({
    where: { id: bookingId },
    include: { client: true },
  });

  await scheduleNotification({
    triggerType: "BOOKING_CONFIRMATION",
    channel: "WHATSAPP",
    clientId: booking.clientId,
    bookingId,
    scheduledFor: new Date(), // immediate
    payload: { bookingRef: booking.bookingRef, title: booking.title },
  });

  if (booking.client.email) {
    await scheduleNotification({
      triggerType: "BOOKING_CONFIRMATION",
      channel: "EMAIL",
      clientId: booking.clientId,
      bookingId,
      scheduledFor: new Date(),
      payload: { bookingRef: booking.bookingRef, title: booking.title },
    });
  }

  // Also queue the 48h pre-arrival reminder and post-trip thank you relative to trip dates
  if (booking.startDate) {
    const reminderTime = new Date(booking.startDate.getTime() - 48 * 60 * 60 * 1000);
    if (reminderTime > new Date()) {
      await scheduleNotification({
        triggerType: "PRE_ARRIVAL_REMINDER",
        channel: "WHATSAPP",
        clientId: booking.clientId,
        bookingId,
        scheduledFor: reminderTime,
        payload: { bookingRef: booking.bookingRef, title: booking.title },
      });
    }
  }

  if (booking.endDate) {
    const thankYouTime = new Date(booking.endDate.getTime() + 24 * 60 * 60 * 1000);
    await scheduleNotification({
      triggerType: "POST_TRIP_THANK_YOU",
      channel: "WHATSAPP",
      clientId: booking.clientId,
      bookingId,
      scheduledFor: thankYouTime,
      payload: { bookingRef: booking.bookingRef, title: booking.title },
    });
  }
}

/** Call this when an invoice has a balance due and you want to nudge the client. */
export async function schedulePaymentReminder(invoiceId: string, sendAt: Date = new Date()) {
  const invoice = await prisma.invoice.findUniqueOrThrow({
    where: { id: invoiceId },
    include: { client: true, booking: true },
  });

  await scheduleNotification({
    triggerType: "PAYMENT_REMINDER",
    channel: "WHATSAPP",
    clientId: invoice.clientId,
    invoiceId,
    bookingId: invoice.bookingId,
    scheduledFor: sendAt,
    payload: {
      bookingRef: invoice.booking.bookingRef,
      balanceDue: invoice.balanceDue.toString(),
      currency: invoice.currency,
    },
  });
}

/**
 * Dispatch a single due notification. Called by the cron route for every
 * ScheduledNotification with status=PENDING and scheduledFor <= now.
 *
 * NOTE: WhatsApp template names below (booking_confirmation, pre_arrival_reminder,
 * payment_reminder, post_trip_thankyou) must be created and approved in Meta
 * Business Manager before use — free-form text only works inside a 24h reply window.
 */
export async function dispatchNotification(notificationId: string) {
  const n = await prisma.scheduledNotification.findUniqueOrThrow({
    where: { id: notificationId },
    include: { client: true },
  });

  try {
    const payload = (n.payload as Record<string, any>) ?? {};

    if (n.channel === "WHATSAPP") {
      const to = n.client.phone.replace(/^\+/, "");
      const templateMap: Record<string, string> = {
        BOOKING_CONFIRMATION: "booking_confirmation",
        PRE_ARRIVAL_REMINDER: "pre_arrival_reminder",
        POST_TRIP_THANK_YOU: "post_trip_thankyou",
        PAYMENT_REMINDER: "payment_reminder",
        QUOTE_FOLLOW_UP: "quote_follow_up",
        STAFF_SCHEDULE_ALERT: "staff_schedule_alert",
        DOCUMENT_EXPIRY_ALERT: "document_expiry_alert",
      };
      const templateName = templateMap[n.triggerType];

      await sendWhatsAppTemplate({
        to,
        templateName,
        components: textParams(
          n.client.firstName,
          payload.bookingRef ?? "",
          payload.balanceDue ? `${payload.currency} ${payload.balanceDue}` : payload.title ?? ""
        ),
      });
    } else if (n.channel === "EMAIL" && n.client.email) {
      const subjectMap: Record<string, string> = {
        BOOKING_CONFIRMATION: `Booking Confirmed — ${payload.bookingRef}`,
        PRE_ARRIVAL_REMINDER: `Your trip starts soon — ${payload.bookingRef}`,
        POST_TRIP_THANK_YOU: `Thank you for traveling with kwai pm kwai!`,
        PAYMENT_REMINDER: `Payment reminder — ${payload.bookingRef}`,
        QUOTE_FOLLOW_UP: `Following up on your quote`,
        STAFF_SCHEDULE_ALERT: `Schedule update`,
        DOCUMENT_EXPIRY_ALERT: `Document expiry alert`,
      };

      await sendEmail({
        to: n.client.email,
        subject: subjectMap[n.triggerType] ?? "Update from kwai pm kwai",
        html: `<p>Dear ${n.client.firstName},</p><p>${buildEmailBody(n.triggerType, payload)}</p><p>Warm regards,<br/>kwai pm kwai Team</p>`,
      });
    }

    await prisma.scheduledNotification.update({
      where: { id: n.id },
      data: { status: "SENT", sentAt: new Date() },
    });
  } catch (err: any) {
    await prisma.scheduledNotification.update({
      where: { id: n.id },
      data: { status: "FAILED", errorMessage: String(err?.message ?? err) },
    });
    throw err;
  }
}

function buildEmailBody(triggerType: string, payload: Record<string, any>) {
  switch (triggerType) {
    case "BOOKING_CONFIRMATION":
      return `Your booking <strong>${payload.bookingRef}</strong> (${payload.title}) is confirmed. We look forward to hosting you!`;
    case "PRE_ARRIVAL_REMINDER":
      return `Your trip <strong>${payload.bookingRef}</strong> begins in 48 hours. Please have your travel documents ready.`;
    case "POST_TRIP_THANK_YOU":
      return `Thank you for traveling with us on <strong>${payload.bookingRef}</strong>. We'd love to hear your feedback!`;
    case "PAYMENT_REMINDER":
      return `A balance of <strong>${payload.currency} ${payload.balanceDue}</strong> remains on booking ${payload.bookingRef}. Kindly settle it at your earliest convenience.`;
    default:
      return "There is an update regarding your trip.";
  }
}
