-- Add CAR_RENTAL to the TripType enum.
-- ALTER TYPE ... ADD VALUE is safe on an existing database: it appends a new
-- enum member without rewriting rows or affecting existing bookings.
ALTER TYPE "TripType" ADD VALUE IF NOT EXISTS 'CAR_RENTAL';
