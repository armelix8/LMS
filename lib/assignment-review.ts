import type { SubmissionReviewStatus } from "@prisma/client";

/** True when the submission counts as approved for lesson completion. */
export function isSubmissionApproved(sub: {
  reviewStatus: SubmissionReviewStatus;
  grade: number | null;
  gradedAt: Date | null;
}): boolean {
  if (sub.reviewStatus === "APPROVED") return true;
  if (sub.reviewStatus === "REJECTED") return false;
  // Legacy rows graded before review workflow
  return sub.grade != null && sub.gradedAt != null;
}
