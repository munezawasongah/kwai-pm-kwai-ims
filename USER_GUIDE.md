# kwai pm kwai — Staff User Guide

How to run the agency day to day using the Internal Management System.

This guide is for the people using the system, not for developers. No technical knowledge needed.

---

## Contents

1. [Getting started](#1-getting-started)
2. [Understanding your role](#2-understanding-your-role)
3. [The daily rhythm](#3-the-daily-rhythm)
4. [Clients](#4-clients)
5. [Bookings — the core workflow](#5-bookings--the-core-workflow)
6. [Building an itinerary](#6-building-an-itinerary)
7. [Invoices and getting paid](#7-invoices-and-getting-paid)
8. [Tracking costs and knowing your profit](#8-tracking-costs-and-knowing-your-profit)
9. [Assigning vehicles and guides](#9-assigning-vehicles-and-guides)
10. [The Inbox — WhatsApp and email](#10-the-inbox--whatsapp-and-email)
11. [Automatic messages](#11-automatic-messages)
12. [Fleet management](#12-fleet-management)
13. [Common situations](#13-common-situations)
14. [Troubleshooting](#14-troubleshooting)
15. [Rules worth following](#15-rules-worth-following)

---

## 1. Getting started

### Two different things at the same address

Your web address serves both the **public website** and the **internal system**:

- Visitors see the normal Kwaipmkwai website. They can browse and send enquiries. They cannot
  reach anything internal, and they don't have accounts.
- Staff sign in to reach the management system.

### Signing in

Go to your company web address (for example `https://kwaipmkwai.up.railway.app`) and click
**Staff Login** at the bottom of any page — or go straight to `/login`. Enter your email and
password and you'll land on the Dashboard.

If you're already signed in, visiting `/login` sends you to the Dashboard automatically.

If you see "Invalid email or password," check your caps lock first. If it still fails, ask your
administrator — they can reset it. There is no self-service password reset yet.

### What you see on screen

- **Left sidebar** — your modules. You'll only see what your role can access, so your sidebar may
  have fewer items than a colleague's. That's normal, not a fault.
- **Top bar** — your name and the Sign out button.
- **Main area** — whatever you're working on.

### Signing out

Always sign out on a shared computer. Top right, "Sign out." The system holds real client contact
details and financial records.

---

## 2. Understanding your role

Your role decides what you can see and do. This protects client data and financial records.

| Role | Can do |
|---|---|
| **Admin** | Everything, including managing users |
| **Manager** | Everything operational and financial |
| **Sales Agent** | Clients, bookings, quotes, itineraries, messaging. **Cannot record payments** |
| **Operations** | Bookings, itineraries, fleet, guide assignment, trip expenses. No invoicing |
| **Accountant** | Invoices, payments, expenses, profit reports. No fleet or messaging |
| **Driver/Guide** | Their own schedule only. No client lists, no financials |

If you need something you can't reach, ask a Manager or Admin rather than borrowing a colleague's
login. Shared logins make it impossible to tell who recorded a payment or changed a booking — which
matters when something goes wrong.

---

## 3. The daily rhythm

A practical order for a normal working day:

**Morning**
1. Open the **Dashboard** — check trips starting in the next 7 days.
2. Open the **Inbox** — reply to overnight WhatsApp messages and emails.
3. Check **Bookings** — anything sitting in *Quoted* that needs a follow-up.

**During the day**
4. Log new inquiries as clients and bookings as they arrive.
5. Build and send itineraries and quotes.
6. Record payments as they land (Accountant/Manager).
7. Assign vehicles and guides for upcoming departures (Operations).

**End of day**
8. Enter the day's trip expenses — fuel, park fees, allowances.
9. Check **Fleet** for insurance or inspection warnings.

---

## 3b. Website enquiries

Your public website's contact form now feeds straight into the system. When a visitor submits
it, you automatically get:

- a **Client** record (marked source: Website)
- a **Booking** at *Inquiry* stage, titled with what they're interested in
- their travel dates, traveller count, and message saved in the booking's internal notes

These appear on the **Dashboard** under "New Website Enquiries," with an amber highlight when
any are waiting. Click through to open the booking.

**Check these at least twice a day.** A travel enquiry that sits unanswered for 48 hours is
usually booked with someone else.

### Before you WhatsApp a website lead

The form's phone field is optional, so some enquiries arrive without one. Those get a
placeholder number and a warning in the internal notes. **Fix the phone number on the client
record before trying to message them**, or the WhatsApp send will fail.

Also remember the 24-hour rule (section 10): a website enquiry is not a WhatsApp message, so
you cannot free-type to them on WhatsApp. Reply by email, or phone them.

---

## 4. Clients

### Adding a client

**Clients** → **+ Add Client**.

Required: first name, last name, phone.

**The phone number is the most important field in the whole system.** It must be in international
format, starting with `+` and the country code:

- ✅ `+255712345678` (Tanzania)
- ✅ `+254712345678` (Kenya)
- ✅ `+14155551234` (USA)
- ❌ `0712345678` — missing country code
- ❌ `255 712 345 678` — no `+`

Get this wrong and WhatsApp messages to that client will fail, and their replies won't attach to
their profile. If a client's messages ever seem to vanish, check this field first.

### Finding a client

Type any part of their name, email, or phone into the search box on the Clients page.

### The client profile

Click a client's name to see their bookings and recent messages in one place. "Open in Inbox" takes
you straight to their message thread.

---

## 5. Bookings — the core workflow

Every trip is a booking, and every booking moves through six stages.

### The six stages

| Stage | What it means | What to do next |
|---|---|---|
| **Inquiry** | Someone asked about a trip | Build an itinerary, work out pricing |
| **Quoted** | You sent them a price | Follow up. This is where money is won or lost |
| **Confirmed** | They paid a deposit | Assign vehicle and guide |
| **In Progress** | The trip is running | Log expenses as they happen |
| **Completed** | They're home | Collect any balance, ask for a review |
| **Cancelled** | It fell through | Note why in internal notes |

### The Bookings board

**Bookings** shows every trip in columns by stage. You can see at a glance how many are sitting in
*Quoted* — that column is your pipeline, and a booking that sits there too long is usually a lost
one.

### Creating a booking

**Bookings** → **+ New Booking**. Pick the client (add them first if they're new), give the trip a
clear title, choose the type, set dates and traveller counts, and pick the currency.

**On currency:** choose what you'll actually invoice in. Most international clients are USD; local
corporate work is often TZS. It's what all financial figures for this trip get reported in, so
changing it later causes confusion.

### Moving a booking along

Use the status dropdown on the board or the booking page. One important exception, below.

### ⚠️ You usually shouldn't set "Confirmed" manually

When you record the first payment on an invoice, the system **automatically**:
- moves the booking to *Confirmed*
- sends the client a WhatsApp and email confirmation
- schedules their 48-hour pre-arrival reminder
- schedules their post-trip thank-you message

If you set *Confirmed* by hand instead, **none of that happens.** The client gets no confirmation
and no reminders. Record the payment and let the system do it.

---

## 6. Building an itinerary

Open the booking, scroll to **Itinerary**.

1. **+ Add Day** for each day of the trip.
2. Give the day a title travellers will understand — "Arusha → Serengeti," not "Day 2."
3. Add a description for context.
4. **+ Add activity** for each item, with a time like `08:00`.
5. Click **Save Itinerary**. *Nothing is stored until you press this.*
6. Click **Generate branded PDF** to produce the client-ready document.

### Tips

- Write for the client, not for yourself. They're reading this to picture their holiday.
- Include arrival and departure transfers as activities — travellers worry most about airport pickup.
- Times can be approximate ("Afternoon" works), but be consistent.
- Save before generating the PDF, or you'll export the old version.

### About the PDF

It carries your branding and is archived automatically, so you can retrieve exactly what a client
was sent months later — useful if there's ever a dispute about what was promised.

To add your logo, place `logo.png` in `public/branding/`. Without it, PDFs still generate fine, just
with a blank logo area.

---

## 7. Invoices and getting paid

*Accountants, Managers and Admins only.*

### Creating an invoice

**Invoices** → **+ New Invoice**. Select the booking, add line items (description, quantity, unit
price), then any discount or tax, and a due date.

Break line items out meaningfully — "Serengeti park fees," "Accommodation 3 nights," "Vehicle and
driver." Clients query a single lump sum far more often than an itemised one.

Totals calculate automatically. Send the PDF via **Download PDF**, or attach it to an email from
the Inbox.

### Recording a payment

Open the invoice → **Record Payment**.

- **Type** — Deposit, Balance, Full payment, or Refund
- **Method** — M-Pesa, Tigo Pesa, Airtel Money, bank transfer, cash, card
- **Amount** — in the invoice's currency
- **Reference** — the M-Pesa code or bank reference

**Always enter the reference.** When a client insists they paid, that code is what settles it in
seconds instead of an afternoon of phone calls.

The balance and status update automatically. And remember: the *first* payment on a booking triggers
the whole confirmation and reminder sequence.

### Refunds

Record type **Refund**. It subtracts from the amount paid. It does not cancel the booking — change
the status separately, and note the reason.

---

## 8. Tracking costs and knowing your profit

The point of this section is simple: **you cannot tell which trips make money unless someone enters
the costs.**

### Recording expenses

On the booking page, **Expenses** → fill the row → **Add Expense**.

Categories: driver allowance, fuel, park fees, hotel/accommodation, food, vehicle maintenance,
permits, guide fee, miscellaneous.

Enter costs in the currency you actually paid — TZS for local costs, USD where relevant. The system
converts for you.

**Enter expenses the same day.** Reconstructing a week of park fees from memory is where profit
figures quietly become fiction.

### Reading the profit panel

Three figures at the top of each booking: Revenue Collected, Expenses, Net Profit.

**Revenue Collected means money actually received** — not invoiced. An unpaid invoice contributes
nothing here, which is deliberate.

Underneath, you'll see a line like *"All figures converted to USD at 1 USD = 2,600 TZS."* That's
the exchange rate being used. Mixing TZS costs against USD revenue without conversion produces
nonsense, so the system converts everything to the booking's currency first and always tells you
which rate it used.

**The rate is set manually** by your administrator. If it's badly out of date, your profit figures
drift. Ask them to review it monthly.

---

## 9. Assigning vehicles and guides

*Operations, Managers and Admins.*

On the booking page:

**Vehicle Assignment** — pick a vehicle, set the dates, assign. Only vehicles marked *Available*
appear, and the vehicle switches to *On Trip*.

**Driver/Guide Assignment** — pick the person, their role, and dates. When you assign them, **the
system automatically WhatsApps them their schedule.** You'll see "notified ✓" once it's sent.

If it says "pending notify," the message didn't go through — usually a missing or wrongly formatted
phone number on their staff profile. Contact them directly and get the number fixed.

### ⚠️ Double-booking

The system does **not** currently stop you assigning the same vehicle or guide to two overlapping
trips. Check the Fleet and Staff pages for existing assignments before confirming. This is a known
gap and a planned improvement.

---

## 10. The Inbox — WhatsApp and email

**Inbox** gives you one thread per client, mixing WhatsApp and email.

Messages sent here go to the client's real WhatsApp on their phone, and their replies come back into
the same thread. New messages appear automatically every few seconds.

### Sending

Select the client, choose WhatsApp or Email, type, and Send. Email needs a subject line.

### ⚠️ The 24-hour WhatsApp rule

This is WhatsApp's rule, not ours, and it catches people out.

**You can only send a free-typed WhatsApp message within 24 hours of the client's last message to
you.** Outside that window WhatsApp rejects it and the message shows as failed.

To reach a client outside the window, you must use an approved template — which is exactly what the
automatic messages use.

Practical version: **if a client messaged you today, reply freely. If they went quiet three days
ago, a typed message won't reach them.** Phone them, or wait for them to message first.

The Inbox doesn't yet warn you before you hit send — you'll only see it fail afterwards. Worth
knowing.

---

## 11. Automatic messages

Four things send on their own:

| When | What |
|---|---|
| First payment recorded | Booking confirmation, by WhatsApp and email |
| 48 hours before trip start | Pre-arrival reminder |
| 24 hours after trip ends | Thank-you and review request |
| When set up by an accountant | Payment reminder for outstanding balances |

These are queued and sent by a background job every 15 minutes, so allow a few minutes — don't
assume failure if it isn't instant.

For these to work, the booking needs **accurate start and end dates** and the client needs a
**correctly formatted phone number**. A missing end date means no thank-you message.

Your administrator must also have had your message templates approved by Meta. Until then,
automatic messages won't send. Ask if you're unsure of the status.

---

## 12. Fleet management

**Fleet** shows every vehicle with its status: Available, On Trip, In Service, Out of Service.

Add vehicles with **+ Add Vehicle**, including insurance and inspection expiry dates.

**Enter those expiry dates.** The system shows an amber warning 30 days before either expires. An
expired insurance certificate discovered at a park gate, with clients in the vehicle, is a very bad
day — this warning exists to prevent exactly that.

---

## 13. Common situations

**A new inquiry arrives by WhatsApp**
Add the client (careful with the phone number) → create a booking as *Inquiry* → build the itinerary
→ create the invoice → send the quote → move to *Quoted*.

**A client pays their deposit**
Open their invoice → Record Payment → type *Deposit*, method, amount, reference. Everything else —
confirmation, reminders, status — happens automatically.

**A client wants to change their itinerary**
Edit the days and activities → Save → generate a new PDF → send it. If the price changed, create a
new invoice rather than editing the old one, so your records show what actually happened.

**The trip is running**
Set the booking to *In Progress*. Enter expenses daily as the guide reports them.

**The trip is finished**
Set to *Completed*. The thank-you message sends automatically. Chase any outstanding balance, and
check the profit panel — this is where you learn which trips are actually worth running.

**A booking falls through**
Set to *Cancelled* and record why in internal notes. Cancellation reasons, collected over a year,
tell you a lot about your pricing.

---

## 14. Troubleshooting

**I can't see a module in my sidebar**
Your role doesn't have access. This is intentional. Ask a Manager if you need it.

**A WhatsApp message failed to send**
Either the phone number is wrong (check for `+` and country code) or you're outside the 24-hour
window. See section 10.

**A client's replies aren't showing on their profile**
Their stored phone number doesn't exactly match the one they're messaging from. Correct it on their
client record.

**The PDF has no logo**
`logo.png` hasn't been added to `public/branding/`. Ask your administrator.

**Profit looks wrong**
Usually one of three things: expenses weren't entered, an invoice was raised but not paid (revenue
counts payments only), or the exchange rate is stale.

**A guide says they never got their schedule**
Check for "notified ✓" on the assignment. If it says pending, their staff phone number needs fixing.

**Nothing loads / login fails for everyone**
A system-level problem. Contact your administrator — they can check the health page.

---

## 15. Rules worth following

1. **Phone numbers always start with `+` and a country code.** More problems trace back to this than
   anything else.
2. **Never set a booking to Confirmed manually.** Record the payment instead and let the automation
   run.
3. **Always enter payment references.** They resolve disputes instantly.
4. **Enter expenses the same day.** Otherwise your profit figures are guesses.
5. **Press Save before generating a PDF.**
6. **Check vehicle and guide availability yourself** — the system won't catch a double-booking yet.
7. **Keep insurance and inspection dates current** so the warnings can do their job.
8. **Don't share logins.** Records should show who did what.
9. **Reply to WhatsApp within 24 hours**, or you lose the ability to message freely.
10. **Sign out on shared computers.**

---

*Questions this guide doesn't answer should go to your system administrator. For setup and
technical matters, see SETUP_GUIDE.md and DEPLOY_RAILWAY.md.*
