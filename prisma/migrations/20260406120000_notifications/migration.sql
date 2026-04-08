-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM (
  'ENROLLMENT_REQUEST',
  'ENROLLMENT_APPROVED',
  'ENROLLMENT_REJECTED',
  'COURSE_MESSAGE',
  'COHORT_APPLICATION',
  'COHORT_APPROVED',
  'COHORT_REJECTED',
  'COHORT_ASSIGNED',
  'PROGRAM_ASSIGNMENT_SUBMITTED',
  'PROGRAM_ASSIGNMENT_REVIEWED',
  'ASSIGNMENT_SUBMITTED',
  'ASSIGNMENT_REVIEWED'
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "linkUrl" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
