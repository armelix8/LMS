-- CreateTable
CREATE TABLE "LabBooking" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "labId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabBooking_pkey" PRIMARY KEY ("id")
);

-- Migrate historical facility bookings to lab bookings
INSERT INTO "LabBooking" ("id", "userId", "labId", "startTime", "endTime", "status", "createdAt", "updatedAt")
SELECT
  fb."id",
  fb."userId",
  f."labId",
  fb."startTime",
  fb."endTime",
  fb."status",
  fb."createdAt",
  fb."updatedAt"
FROM "FacilityBooking" fb
JOIN "Facility" f ON f."id" = fb."facilityId";

-- Indexes
CREATE INDEX "LabBooking_labId_startTime_endTime_idx" ON "LabBooking"("labId", "startTime", "endTime");
CREATE INDEX "LabBooking_userId_status_idx" ON "LabBooking"("userId", "status");

-- FKs
ALTER TABLE "LabBooking" ADD CONSTRAINT "LabBooking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LabBooking" ADD CONSTRAINT "LabBooking_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Drop old table
DROP TABLE "FacilityBooking";
