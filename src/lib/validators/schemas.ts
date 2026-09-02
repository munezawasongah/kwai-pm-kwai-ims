import { z } from "zod";

export const createClientSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional().nullable(),
  phone: z.string().min(9, "Phone must be in E.164 format, e.g. +255712345678"),
  nationality: z.string().optional().nullable(),
  passportNumber: z.string().optional().nullable(),
  source: z
    .enum(["WEBSITE", "WHATSAPP", "EMAIL", "REFERRAL", "WALK_IN", "OTA", "SOCIAL_MEDIA", "OTHER"])
    .default("OTHER"),
  preferences: z.record(z.any()).optional(),
  notes: z.string().optional().nullable(),
});

export const createBookingSchema = z.object({
  clientId: z.string().min(1),
  assignedAgentId: z.string().optional().nullable(),
  tripType: z.enum([
    "SAFARI",
    "ZANZIBAR_BEACH",
    "KILIMANJARO",
    "CITY_TOUR",
    "AIRPORT_TRANSFER",
    "CAR_RENTAL",
    "CROSS_BORDER",
    "CUSTOM",
  ]),
  title: z.string().min(1),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  numAdults: z.number().int().min(1).default(1),
  numChildren: z.number().int().min(0).default(0),
  currency: z.enum(["TZS", "USD"]).default("USD"),
  quotedTotal: z.number().nonnegative().optional().nullable(),
  internalNotes: z.string().optional().nullable(),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(["INQUIRY", "QUOTED", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
});

export const createInvoiceSchema = z.object({
  bookingId: z.string().min(1),
  clientId: z.string().min(1),
  currency: z.enum(["TZS", "USD"]).default("USD"),
  dueDate: z.coerce.date().optional().nullable(),
  depositRequired: z.number().nonnegative().optional().nullable(),
  lineItems: z
    .array(
      z.object({
        description: z.string().min(1),
        quantity: z.number().int().min(1).default(1),
        unitPrice: z.number().nonnegative(),
      })
    )
    .min(1),
  discountAmount: z.number().nonnegative().default(0),
  taxAmount: z.number().nonnegative().default(0),
  notes: z.string().optional().nullable(),
});

export const recordPaymentSchema = z.object({
  type: z.enum(["DEPOSIT", "BALANCE", "FULL", "REFUND"]),
  method: z.enum(["MPESA", "TIGO_PESA", "AIRTEL_MONEY", "BANK_TRANSFER", "CASH", "CARD", "OTHER"]),
  currency: z.enum(["TZS", "USD"]),
  amount: z.number().positive(),
  reference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const createVehicleSchema = z.object({
  plateNumber: z.string().min(1).max(20),
  make: z.string().min(1).max(40),
  model: z.string().min(1).max(40),
  year: z.number().int().min(1950).max(2100).optional().nullable(),
  capacitySeats: z.number().int().min(1).max(80),
  insuranceExpiry: z.coerce.date().optional().nullable(),
  inspectionExpiry: z.coerce.date().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const createStaffAssignmentSchema = z.object({
  staffProfileId: z.string().min(1),
  bookingId: z.string().min(1),
  role: z.enum(["DRIVER", "GUIDE", "DRIVER_GUIDE"]),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  allowanceAmount: z.number().nonnegative().optional().nullable(),
  allowanceCurrency: z.enum(["TZS", "USD"]).optional(),
  notes: z.string().max(2000).optional().nullable(),
});
