/**
 * Email sending abstraction.
 * Defaults to Resend (recommended: simpler, better deliverability, no SMTP hassle).
 * Falls back to Nodemailer/SMTP if RESEND_API_KEY is not set (e.g. self-hosted SMTP / Gmail workspace).
 *
 * Env vars:
 *   RESEND_API_KEY       - if set, Resend is used
 *   EMAIL_FROM           - e.g. "Kwai PM Kwai Travel and Tours Limited <booking@kwaipmkwaitravelandtours.com>"
 *   SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS   - used only if RESEND_API_KEY is absent
 */

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  attachments?: { filename: string; content: Buffer | string; contentType?: string }[];
}

export async function sendEmail({ to, subject, html, attachments = [] }: SendEmailParams) {
  const from = process.env.EMAIL_FROM || "Kwai PM Kwai Travel and Tours Limited <no-reply@kwaipmkwaitravelandtours.com>";

  if (process.env.RESEND_API_KEY) {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    const result = await resend.emails.send({
      from,
      to,
      subject,
      html,
      attachments: attachments.map((a) => ({
        filename: a.filename,
        content: a.content instanceof Buffer ? a.content.toString("base64") : a.content,
      })),
    });

    if (result.error) throw new Error(`Resend error: ${result.error.message}`);
    return { id: result.data?.id };
  }

  // Fallback: Nodemailer / SMTP
  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    html,
    attachments: attachments.map((a) => ({
      filename: a.filename,
      content: a.content,
      contentType: a.contentType,
    })),
  });

  return { id: info.messageId };
}
