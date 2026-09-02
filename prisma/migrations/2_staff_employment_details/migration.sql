-- Employment details for staff records, and a general STAFF role for employees
-- who need an account but no operational access (HR, cleaners, security).

ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'STAFF';

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "jobTitle" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "department" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "employeeNumber" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "startDate" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "nationalId" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emergencyName" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emergencyPhone" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "users_employeeNumber_key" ON "users"("employeeNumber");
