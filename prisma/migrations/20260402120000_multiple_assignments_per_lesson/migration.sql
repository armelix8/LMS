-- Multiple assignments per lesson: drop unique on lessonId, add sortOrder + index.

ALTER TABLE "Assignment" DROP CONSTRAINT IF EXISTS "Assignment_lessonId_key";

ALTER TABLE "Assignment" ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "Assignment_lessonId_sortOrder_idx" ON "Assignment"("lessonId", "sortOrder");
