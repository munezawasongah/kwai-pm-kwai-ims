# Deploying to Railway

Step-by-step, from this repo to a live system. Assumes you've pushed this folder to GitHub.

---

## 1. Push to GitHub

```powershell
cd kwai-pm-kwai
git init
git add .
git commit -m "kwai pm kwai internal management system"
git branch -M main
git remote add origin https://github.com/<your-username>/kwai-pm-kwai.git
git push -u origin main
```

`.env` is gitignored. Never commit it — you'll set those values in Railway instead.

---

## 2. Create the Railway project

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**.
2. Select your `kwai-pm-kwai` repo. Railway detects Next.js via Nixpacks and starts a build.
   The first build will **fail** — that's expected, there's no database or env vars yet.

---

## 3. Add PostgreSQL

In the same project: **+ New** → **Database** → **Add PostgreSQL**.

Railway injects `DATABASE_URL` into your service automatically. You don't need to copy it.

---

## 4. Set environment variables

Open your **app service** (not the database) → **Variables** tab → **Raw Editor**, and paste:

```
NEXTAUTH_URL=https://your-app.up.railway.app
NEXTAUTH_SECRET=<generate>
JWT_SECRET=<generate>
CRON_SECRET=<generate>

WHATSAPP_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_VERIFY_TOKEN=kwai-pm-kwai-verify-2026
WHATSAPP_APP_SECRET=
WHATSAPP_API_VERSION=v20.0

RESEND_API_KEY=
EMAIL_FROM=Kwai PM Kwai Travel and Tours Limited <booking@kwaipmkwaitravelandtours.com>

TZS_PER_USD=2600

STORAGE_DRIVER=supabase
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=documents
STORAGE_SIGNED_URL_TTL=604800

COMPANY_BANK_DETAILS=Bank: CRDB Bank | Account Name: kwai pm kwai Ltd | Account No: 0150XXXXXXX
```

Generate each secret with:
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**`NEXTAUTH_URL` must match your real Railway domain exactly** (Settings → Networking →
Generate Domain, or your custom domain). Login silently fails if this is wrong — it's the
single most common deployment mistake with NextAuth.

---

## 5. File storage (required for PDF archiving)

Railway's filesystem is **ephemeral** — anything written to disk vanishes on redeploy. Generated
itineraries and invoices must go to object storage or they will not persist.

Simplest option, free tier:
1. Create a project at [supabase.com](https://supabase.com).
2. **Storage** → **New bucket** → name it `documents`, keep it **private**.
3. **Settings → API** → copy the Project URL into `SUPABASE_URL`, and the **`service_role`**
   key into `SUPABASE_SERVICE_ROLE_KEY`.

The service_role key bypasses row-level security and must only ever live in server env vars —
never in client code.

If you'd rather skip archiving for now, set `STORAGE_DRIVER=` (empty). PDFs will still generate
and download; they just won't be stored. Nothing crashes.

---

## 6. Deploy and migrate

Redeploy (Deployments → **Redeploy**). The start command in `railway.json` runs
`prisma migrate deploy` automatically before booting, so your schema is applied on every deploy.

Before the very first deploy, generate the migration locally and commit it:
```powershell
npx prisma migrate dev --name init
git add prisma/migrations
git commit -m "add initial migration"
git push
```

Without a committed `prisma/migrations` folder, `migrate deploy` has nothing to apply and your
tables won't exist.

---

## 7. Seed the first admin user

From your machine, pointed at the Railway database (copy `DATABASE_URL` from the Postgres
service → Variables → **Connect** tab):

```powershell
$env:DATABASE_URL="postgresql://postgres:...@...railway.app:5432/railway"
npm run prisma:seed
```

Login: `admin@kwaipmkwaitravelandtours.com` / `ChangeMe123!`

**Change this password immediately.** Generate a hash and update it via `npx prisma studio`:
```powershell
node -e "console.log(require('bcryptjs').hashSync('YourStrongPassword', 10))"
```

---

## 8. Health check

Visit `https://your-app.up.railway.app/api/health` — should return
`{"status":"ok","database":"connected"}`. Railway uses this endpoint to decide whether a
deploy succeeded.

---

## 9. Scheduled reminders (cron)

Railway doesn't run `vercel.json` crons. Use either:

**Option A — Railway Cron:** add a second service in the project → **Cron Schedule** `*/15 * * * *`
with command:
```
curl -s "https://your-app.up.railway.app/api/cron/notifications?secret=$CRON_SECRET"
```

**Option B — external scheduler** (free): [cron-job.org](https://cron-job.org) hitting the same
URL every 15 minutes.

Without this, queued reminders (48h pre-arrival, post-trip thank-you, payment nudges) never send.

---

## 10. Point WhatsApp at the live URL

In the Meta App Dashboard → WhatsApp → Configuration → Webhooks:
- Callback URL: `https://your-app.up.railway.app/api/webhooks/whatsapp`
- Verify Token: whatever you set as `WHATSAPP_VERIFY_TOKEN`
- Subscribe to the `messages` field

Set `WHATSAPP_APP_SECRET` (Settings → Basic → App Secret) **before** going live. In production
the webhook fails closed without it, rejecting all inbound messages — this is deliberate, since
an unverified webhook lets anyone inject fake client messages.

---

## 11. Retiring the old website service

This deployment now serves **both** the public website and the IMS, so the separate
`kwaipmkwai-site` Railway service is redundant. Once you've confirmed the new deployment
serves `/`, `/about`, `/destinations`, `/experiences`, `/voices` and `/contact` correctly:

1. Move your custom domain from the old service to this one (Settings → Networking).
2. Delete or pause the old service so you aren't billed twice.

Do this in that order — moving the domain first means no downtime for visitors.

---

## Deployment checklist

- [ ] `prisma/migrations` committed to git
- [ ] PostgreSQL service added
- [ ] `NEXTAUTH_URL` matches the real domain exactly
- [ ] All secrets generated (not left as placeholder text)
- [ ] Storage bucket created, `STORAGE_DRIVER` set
- [ ] `/api/health` returns ok
- [ ] Seed run, **admin password changed**
- [ ] Cron scheduled
- [ ] WhatsApp webhook verified, `WHATSAPP_APP_SECRET` set
- [ ] WhatsApp message templates submitted to Meta for approval
- [ ] Public site loads at `/` without a login
- [ ] Contact form submits successfully and appears on the Dashboard
- [ ] Visiting `/dashboard` while signed out redirects to `/login`
- [ ] Old `kwaipmkwai-site` Railway service retired after the domain move
