# kwai pm kwai — Internal Management System
Setup & Deployment Guide

## 0. What you're getting

A self-hosted replacement for third-party CRM/booking SaaS, covering:
- Client CRM, Bookings & Itineraries (with branded PDF export)
- Multi-currency invoicing (TZS/USD), payment tracking, per-trip profit calculation
- Fleet & driver/guide allocation with automated WhatsApp scheduling alerts
- Unified WhatsApp + Email inbox, plus automated triggers (booking confirmation,
  48h pre-arrival reminder, post-trip thank-you, payment reminders)

Stack: Next.js 14 (App Router) + Tailwind + Shadcn-style components, PostgreSQL + Prisma,
WhatsApp Business Cloud API, Resend/Nodemailer for email.

---

## 1. Prerequisites (Windows 11 / PowerShell)

Install these first:

```powershell
# Node.js 20 LTS — download from nodejs.org, or via winget:
winget install OpenJS.NodeJS.LTS

# Git
winget install Git.Git

# PostgreSQL (local dev) — or skip this and use a free Supabase/Railway Postgres instead (recommended)
winget install PostgreSQL.PostgreSQL
```

Verify:
```powershell
node -v
npm -v
git --version
```

---

## 2. Project setup

```powershell
cd C:\path\to\your\projects
git clone <your-repo-url> kwai-pm-kwai
cd kwai-pm-kwai
npm install
```

Copy the environment template and fill in real values:
```powershell
Copy-Item .env.example .env
notepad .env
```

### Minimum values to fill in before first run
| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | Supabase/Railway project settings, or your local Postgres connection string |
| `NEXTAUTH_SECRET`, `JWT_SECRET`, `CRON_SECRET` | Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` | Meta for Developers → your App → WhatsApp → API Setup |
| `RESEND_API_KEY` | resend.com → API Keys (free tier is enough to start) |

---

## 3. Database

Generate the Prisma client and run the first migration:

```powershell
npx prisma generate
npx prisma migrate dev --name init
```

Seed sample data (an admin user, a driver, a vehicle, a demo client):
```powershell
npm run prisma:seed
```

Inspect your data visually any time with:
```powershell
npx prisma studio
```

---

## 4. Run locally

```powershell
npm run dev
```

Visit `http://localhost:3000`. Login credentials from the seed script:
- Email: `admin@kwaipmkwaitravelandtours.com`
- Password: `ChangeMe123!` (change this immediately — see Section 8)

---

## 5. WhatsApp Business Cloud API setup

1. Go to [developers.facebook.com](https://developers.facebook.com) → create an App → add the **WhatsApp** product.
2. Under **API Setup**, note your **Phone Number ID** and generate a **temporary token** (swap for a permanent System User token before going live).
3. Under **Configuration → Webhooks**, set:
   - Callback URL: `https://yourdomain.com/api/webhooks/whatsapp`
   - Verify Token: the same string you set as `WHATSAPP_VERIFY_TOKEN` in `.env`
   - Subscribe to the `messages` field.
4. **Create and get approval for these Message Templates** (Meta requires pre-approved templates to message a client outside a 24-hour reply window — this is what powers your automated reminders):
   - `booking_confirmation`
   - `pre_arrival_reminder`
   - `post_trip_thankyou`
   - `payment_reminder`
   - `staff_schedule_alert`
   - `quote_follow_up`
   - `document_expiry_alert`

   Each should have a body like: `Hello {{1}}, your booking {{2}} ... {{3}}` — matching the
   3 positional parameters sent by `src/lib/notifications/engine.ts`.

Until templates are approved, you can still test **inbound** messages and **free-form replies**
within 24 hours of a client messaging you first (that part works immediately via `sendWhatsAppText`).

---

## 6. Email setup (Resend — recommended)

1. Sign up at [resend.com](https://resend.com), verify your sending domain (e.g. `kwaipmkwaitravelandtours.com`) by adding the DNS records they provide.
2. Copy your API key into `RESEND_API_KEY`.
3. Set `EMAIL_FROM="Kwai PM Kwai Travel and Tours Limited <booking@kwaipmkwaitravelandtours.com>"`.

If you'd rather use an existing company mailbox (Gmail Workspace, Zoho, etc.), leave `RESEND_API_KEY`
blank and fill in the `SMTP_*` variables instead — the code automatically falls back to Nodemailer/SMTP.

---

## 7. Automated notification worker (cron)

Scheduled reminders (48h pre-arrival, post-trip thank you, payment nudges) are queued in the
`ScheduledNotification` table and dispatched by `/api/cron/notifications`. This route must be
called periodically:

**On Vercel:** already configured in `vercel.json` to run every 15 minutes. Add a `CRON_SECRET`
environment variable in your Vercel project settings — Vercel automatically sends it as
`Authorization: Bearer <CRON_SECRET>` to routes protected this way.

**On Railway or any other host:** use a free external scheduler like
[cron-job.org](https://cron-job.org) to hit:
```
GET https://yourdomain.com/api/cron/notifications?secret=YOUR_CRON_SECRET
```
every 5–15 minutes.

---

## 8. Production deployment

### Option A — Vercel (frontend/API) + Supabase (database) — simplest, generous free tiers

1. Push your code to GitHub.
2. Create a free Postgres database at [supabase.com](https://supabase.com) → copy the connection
   string (use the "Connection Pooling" URI for `DATABASE_URL`, port 6543).
3. On [vercel.com](https://vercel.com), import the GitHub repo.
4. Add every variable from `.env` into Vercel → Project → Settings → Environment Variables.
5. Deploy. Then run the migration against production once, from your machine:
   ```powershell
   $env:DATABASE_URL="your-production-connection-string"
   npx prisma migrate deploy
   ```
6. Update the WhatsApp webhook Callback URL in Meta to your live Vercel domain.
7. **Change the seeded admin password immediately** — either build a password-reset flow or
   update it directly:
   ```powershell
   npx prisma studio  # against production DATABASE_URL — edit the passwordHash field
   ```
   (Generate a new bcrypt hash with `node -e "console.log(require('bcryptjs').hashSync('YourNewPassword', 10))"`.)

### Option B — Railway (all-in-one: app + Postgres)

1. Create a new Railway project → **Deploy from GitHub repo**.
2. Add a **PostgreSQL** plugin in the same project — Railway auto-injects `DATABASE_URL`.
3. Add the remaining environment variables in Railway → Variables.
4. Railway auto-runs `npm run build` / `npm start`. Run `npx prisma migrate deploy` once via
   Railway's shell (Project → your service → "Shell" tab) or a one-off deploy command.
5. Set up the notification cron via Railway's built-in Cron Jobs feature, or an external
   scheduler hitting `/api/cron/notifications`.

---

## 9. Build verification status — READ THIS FIRST

All modules (auth, clients, bookings, itinerary builder, invoicing, payments, expenses, fleet,
staff, unified inbox) are implemented with real, wired code. However, **the final `next build`
has not been run end-to-end**, because the environment this was authored in could not reach
`binaries.prisma.sh` to download the Prisma query engine. `prisma generate` therefore produced
only a placeholder type stub.

Everything that *could* be verified was:
- `npm install` resolves cleanly (a `next-auth` / `nodemailer` peer conflict was found and fixed —
  nodemailer is pinned to `^7.0.7` with `@types/nodemailer@^7.0.7`).
- `npx tsc --noEmit` was run repeatedly. Three genuine bugs were found and fixed:
  1. `NextResponse` rejecting a Node `Buffer` in both PDF routes (now wrapped in `Uint8Array`).
  2. Missing nodemailer type declarations.
  3. An untyped Prisma `$transaction` callback in the itinerary route.
- A fourth real bug was caught by review: the itinerary PDF used a browser-relative logo path
  (`/branding/logo.png`), which cannot resolve in Node and would have thrown on **every**
  itinerary PDF. It now resolves from the filesystem and skips the logo if absent.

**Run this first on your machine, and expect to fix a small number of residual type errors:**

```powershell
npm install
npx prisma generate      # works once you have normal network access
npx tsc --noEmit         # should now be clean; fix anything that surfaces
npm run build
```

The remaining type errors seen in authoring were all `implicitly has an 'any' type` on Prisma
result callbacks and missing enum exports (`Role`, `MessageChannel`, `NotificationTriggerType`) —
every one of them a direct consequence of the stubbed client, and all expected to disappear once
`prisma generate` runs properly. If any persist, they'll be trivial annotation fixes, not design
problems.

## 9b. A constraint worth knowing

**`middleware.ts` must live at `src/middleware.ts`, not the project root.**

This project uses a `src/` directory, and Next.js only loads middleware from
`src/middleware.ts` in that layout. At the project root it is silently ignored —
no error, no warning, it simply never runs.

To confirm middleware is active, look for this line in `npm run build` output:

```
ƒ Middleware    XX kB
```

If that line is absent, the middleware is not compiled, and everything it does —
host-based routing between the public site and the IMS subdomain, plus route
protection — is silently inactive.

---

## 10. Genuinely remaining work before this is production-hardened

Being straight with you about what "production-ready" still requires beyond the code itself:

1. **WhatsApp template approval (external dependency, days not hours).** Automated reminders
   cannot send until Meta approves your templates — see Section 5. Inbound messages and 24h-window
   replies work immediately.
2. **FX rate is a manually-set constant.** `TZS_PER_USD` is fixed in env, deliberately, so
   historical reports stay reproducible. Update it periodically, or swap a live FX API in behind
   `getRate()` in `src/lib/currency.ts`. Ideally, store the rate at transaction time
   (`Invoice.exchangeRateToUSD` exists for this) so old bookings don't re-value when the rate moves.
3. **WhatsApp templates must be approved by Meta** before automated reminders can send —
   see Section 5. Nothing in the code can shortcut this.
4. **Error tracking.** No Sentry/observability yet. Worth adding before the payment →
   confirmation path runs unattended, since it touches money and messages clients.
5. **Rate limiting on the webhook.** Signature verification is now in place, but there is no
   throttle on request volume.
6. **Integration tests.** Unit tests cover the money math and permission matrix (`npm test`),
   but the payment → booking-confirmation flow has no end-to-end test yet.

Items 1–3 are the ones that will bite you first in live operation.

---

## 11. Security & correctness hardening (completed)

The following were identified as gaps and have since been implemented:

**Role-based authorization.** `src/lib/permissions.ts` holds a capability-keyed permission
matrix (`payments:write`, `financials:read`, etc.) with no framework dependencies, so it is
independently unit-testable. `src/lib/authorization.ts` wraps it with session-aware guards.
Every mutating API route now calls `requireCapability(...)` with the specific capability it
needs, returning 401 when unauthenticated and 403 when authenticated but unauthorized.

Notably, `DRIVER_GUIDE` has no financial or CRM capabilities at all. The booking detail API
strips invoices and expenses from its response for roles lacking `financials:read`, and the
UI hides those sections plus any nav item the role can't reach. **The API check is the security
boundary; hiding nav is only usability.**

**Mass-assignment protection.** `PATCH /api/clients/[id]` and `PATCH /api/bookings/[id]`
previously passed the raw request body to Prisma, letting a caller set arbitrary columns.
Both now validate against a Zod schema first.

**Webhook signature verification.** `POST /api/webhooks/whatsapp` previously accepted any
well-formed POST — anyone who learned the URL could inject fake client messages. It now
verifies Meta's `X-Hub-Signature-256` HMAC over the **raw** body using `WHATSAPP_APP_SECRET`,
with a timing-safe comparison, and **fails closed in production** if the secret is unset.
It also skips duplicate `providerMessageId`s, since Meta retries on non-2xx responses.

**Multi-currency profit math (was producing wrong numbers).** The old calculation subtracted
raw TZS expenses from USD revenue. On a trip with 1,000 USD revenue and 1,300,000 TZS costs it
reported a loss of −1,299,000 when the real result is a **profit of 500 USD**. `src/lib/currency.ts`
now normalizes everything to the booking's currency before any arithmetic, and the UI always
discloses the rate used. Set `TZS_PER_USD` in `.env`; a fixed, deliberately-set rate is the
default so historical reports stay reproducible.

**Storage-backed PDFs.** `Document.fileUrl` previously recorded a path to a file that was never
written — the PDF was streamed and discarded. `src/lib/storage.ts` is now a pluggable adapter
(Supabase Storage / any S3-compatible bucket / local disk for dev). Generated itineraries and
invoices are uploaded and their real signed URL is persisted to `Document`, `Itinerary.pdfUrl`
and `Invoice.pdfUrl`. A `Document` row is only written if the upload actually succeeded — a row
pointing at a nonexistent file is worse than no row. Uploads never throw: if storage is
misconfigured the PDF still generates and downloads.

**Every read endpoint is now guarded too**, not just mutations — previously any authenticated
user could GET client lists, invoices and financials regardless of role.

**Next.js upgraded** 14.2.13 → 14.2.35 to clear a published security advisory.

**Tests.** `npm test` runs 13 unit tests (Node's built-in runner, no DB required) covering
currency conversion, the profit regression above, and the permission matrix.
