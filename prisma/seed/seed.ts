import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("ChangeMe123!", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@kwaipmkwaitravelandtours.com" },
    update: {},
    create: {
      email: "admin@kwaipmkwaitravelandtours.com",
      phone: "+255700000000",
      passwordHash,
      firstName: "Admin",
      lastName: "User",
      role: Role.ADMIN,
    },
  });

  const driverUser = await prisma.user.upsert({
    where: { email: "driver1@kwaipmkwaitravelandtours.com" },
    update: {},
    create: {
      email: "driver1@kwaipmkwaitravelandtours.com",
      phone: "+255711111111",
      passwordHash,
      firstName: "Juma",
      lastName: "Mwakasege",
      role: Role.DRIVER_GUIDE,
      staffProfile: {
        create: {
          licenseNumber: "DL-TZ-00123",
          languagesSpoken: ["English", "Swahili"],
          yearsExperience: 8,
        },
      },
    },
  });

  await prisma.vehicle.upsert({
    where: { plateNumber: "T123 ABC" },
    update: {},
    create: {
      plateNumber: "T123 ABC",
      make: "Toyota",
      model: "Land Cruiser",
      year: 2019,
      capacitySeats: 7,
      insuranceExpiry: new Date("2027-01-01"),
      inspectionExpiry: new Date("2027-01-01"),
    },
  });

  await prisma.client.upsert({
    where: { id: "seed-client-1" },
    update: {},
    create: {
      id: "seed-client-1",
      firstName: "Alex",
      lastName: "Traveler",
      email: "alex.traveler@example.com",
      phone: "+15551234567",
      nationality: "USA",
      source: "WEBSITE",
    },
  });

  console.log("Seed complete:", { admin: admin.email, driver: driverUser.email });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
