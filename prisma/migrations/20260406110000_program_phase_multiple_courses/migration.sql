-- CreateTable
CREATE TABLE "ProgramPhaseCourse" (
    "id" TEXT NOT NULL,
    "phaseId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProgramPhaseCourse_pkey" PRIMARY KEY ("id")
);

-- Copy existing single course links into join table
INSERT INTO "ProgramPhaseCourse" ("id", "phaseId", "courseId", "sortOrder")
SELECT
    'ppc_' || md5(random()::text || clock_timestamp()::text || "id"),
    "id",
    "courseId",
    0
FROM "ProgramPhase"
WHERE "courseId" IS NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ProgramPhaseCourse_phaseId_courseId_key" ON "ProgramPhaseCourse"("phaseId", "courseId");

-- CreateIndex
CREATE INDEX "ProgramPhaseCourse_phaseId_sortOrder_idx" ON "ProgramPhaseCourse"("phaseId", "sortOrder");

-- AddForeignKey
ALTER TABLE "ProgramPhaseCourse" ADD CONSTRAINT "ProgramPhaseCourse_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "ProgramPhase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramPhaseCourse" ADD CONSTRAINT "ProgramPhaseCourse_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DropForeignKey
ALTER TABLE "ProgramPhase" DROP CONSTRAINT "ProgramPhase_courseId_fkey";

-- AlterTable
ALTER TABLE "ProgramPhase" DROP COLUMN "courseId";
