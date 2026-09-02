-- Employment records: type, status and departure details.

DO $$ BEGIN
  CREATE TYPE "EmploymentType" AS ENUM
    ('PERMANENT','FIXED_TERM_CONTRACT','PROBATION','CASUAL','INTERNSHIP','CONSULTANT');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "EmploymentStatus" AS ENUM
    ('ACTIVE','ON_LEAVE','SUSPENDED','RESIGNED','TERMINATED','CONTRACT_ENDED','RETIRED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "employmentType" "EmploymentType" NOT NULL DEFAULT 'PERMANENT';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "employmentStatus" "EmploymentStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "contractEndDate" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "endDate" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "exitReason" TEXT;

CREATE INDEX IF NOT EXISTS "users_employmentStatus_idx" ON "users"("employmentStatus");
