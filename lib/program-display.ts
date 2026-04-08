/** Human-readable labels for program / cohort UI. */
export function cohortMemberStatusLabel(status: string): string {
  switch (status) {
    case "APPLIED":
      return "Application under review";
    case "ACTIVE":
      return "Enrolled";
    case "REJECTED":
      return "Not admitted";
    case "WITHDRAWN":
      return "Withdrawn";
    default:
      return status;
  }
}

export function submissionReviewLabel(status: string): string {
  switch (status) {
    case "PENDING":
      return "Awaiting review";
    case "APPROVED":
      return "Approved";
    case "REJECTED":
      return "Needs revision";
    default:
      return status;
  }
}
