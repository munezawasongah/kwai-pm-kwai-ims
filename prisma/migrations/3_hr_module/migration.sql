-- HR module: an HR role, leave entitlement, and leave requests.

ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'HR';

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "annualLeaveDays" INTEGER NOT NULL DEFAULT 28;

DO $$ BEGIN
  CREATE TYPE "LeaveType" AS ENUM ('ANNUAL','SICK','MATERNITY','PATERNITY','COMPASSIONATE','UNPAID','STUDY');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "LeaveStatus" AS ENUM ('PENDING','APPROVED','REJECTED','CANCELLED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "leave_requests" (
  "id"           TEXT NOT NULL,
  "userId"       TEXT NOT NULL,
  "type"         "LeaveType" NOT NULL,
  "startDate"    TIMESTAMP(3) NOT NULL,
  "endDate"      TIMESTAMP(3) NOT NULL,
  "days"         INTEGER NOT NULL,
  "reason"       TEXT,
  "status"       "LeaveStatus" NOT NULL DEFAULT 'PENDING',
  "decidedById"  TEXT,
  "decidedAt"    TIMESTAMP(3),
  "decisionNote" TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL,
  CONSTRAINT "leave_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "leave_requests_userId_status_idx" ON "leave_requests"("userId","status");
CREATE INDEX IF NOT EXISTS "leave_requests_startDate_idx" ON "leave_requests"("startDate");

DO $$ BEGIN
  ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_decidedById_fkey"
    FOREIGN KEY ("decidedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
