# kwai pm kwai — Internal Management System

Self-hosted platform for a Dar es Salaam tours & travel agency. One deployment serves
two audiences:

- **Public website** (`/`, `/about`, `/destinations`, `/experiences`, `/voices`, `/contact`) —
  open to any visitor, no account needed. The contact form creates real leads in the IMS.
- **Internal Management System** (`/dashboard` and everything else) — staff only, login required.

The IMS replaces subscription CRM/booking SaaS, covering the full trip lifecycle:
enquiry → quote → itinerary → invoice → payment → dispatch → post-trip follow-up.

## Modules

| Module | What it does |
|---|---|
| **Clients / CRM** | Profiles, nationality, travel history, searchable list |
| **Bookings** | Kanban board across 6 statuses, per-trip detail view |
| **Itinerary builder** | Day-by-day editor with activities, exports branded PDF |
| **Invoicing** | Multi-currency (TZS/USD), line items, deposit vs balance tracking |
| **Payments** | M-Pesa / Tigo Pesa / Airtel / bank / cash; auto-confirms booking on first payment |
| **Expenses & profit** | Per-trip cost capture with FX-normalized net profit |
| **Fleet** | Vehicles, availability, insurance & inspection expiry alerts |
| **Drivers & guides** | Assignment with automatic WhatsApp schedule notification |
| **Unified inbox** | Send/receive WhatsApp + email from one thread view |
| **Automation** | Booking confirmation, 48h pre-arrival reminder, post-trip thank-you, payment nudges |

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind · PostgreSQL + Prisma · NextAuth ·
WhatsApp Business Cloud API · Resend/Nodemailer · @react-pdf/renderer

## Quick start

```bash
npm install
cp .env.example .env        # fill in DATABASE_URL at minimum
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```

Open http://localhost:3000 → `admin@kwaipmkwaitravelandtours.com` / `ChangeMe123!` (change immediately).

## Commands

```bash
npm run dev        # local dev server
npm run build      # production build
npm test           # unit tests (no database required)
npm run prisma:studio   # browse/edit data
```

## Who sees what

| Visitor | Staff |
|---|---|
| Marketing pages | Everything a visitor sees, plus… |
| Submits the contact form | The full IMS, gated by role |
| Never sees client data, bookings, invoices, or messages | Sign in at `/login` |

Route policy lives in `src/lib/route-policy.ts` and is unit-tested: unknown routes default
to **protected**, so a new page added later is private unless deliberately opened up.

## Security model

Authorization is capability-based, defined in `src/lib/permissions.ts` — a dependency-free
module so the policy is unit-testable in isolation. Every API route calls
`requireCapability("...")`; the API is the security boundary, and hidden UI is only usability.

`DRIVER_GUIDE` has no financial or CRM access at all. The booking API strips invoices and
expenses from responses for roles lacking `financials:read`.

The WhatsApp webhook verifies Meta's `X-Hub-Signature-256` HMAC over the raw body and fails
closed in production if `WHATSAPP_APP_SECRET` is unset.

## Docs

- **[USER_GUIDE.md](./USER_GUIDE.md)** — for staff using the system day to day
- **[DEPLOY_RAILWAY.md](./DEPLOY_RAILWAY.md)** — deployment, step by step
- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** — full setup, WhatsApp/email config, known limitations

## Known limitations

Read Section 10 of SETUP_GUIDE.md before going live. In short: WhatsApp template approval is a
multi-day external dependency on Meta; the FX rate is a manually-set constant; and there's no
integration test yet on the payment → confirmation path.
