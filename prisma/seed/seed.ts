import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Only seed when the database has no users. Once real staff exist, seeding must
  // not run again — otherwise deleted test accounts reappear on every deploy, and
  // the default admin password could be silently restored.
  const existing = await prisma.user.count();
  if (existing > 0) {
    console.log(`Seed skipped: ${existing} user(s) already exist.`);
    return;
  }

  const passwordHash = await bcrypt.hash("ChangeMe123!", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@kwaipmkwaitravelandtours.com",
      phone: "+255723603604",
      passwordHash,
      firstName: "Admin",
      lastName: "User",
      role: Role.ADMIN,
      jobTitle: "System Administrator",
      department: "IT",
    },
  });

  console.log("Seed complete. Sign in as:", admin.email);
  console.log("Password: ChangeMe123! — change it immediately at /settings/password");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
