export function cohortApplicationsWindowOpen(cohort: {
  applicationsOpen: boolean;
  applicationOpensAt: Date | null;
  applicationClosesAt: Date | null;
}): boolean {
  if (!cohort.applicationsOpen) return false;
  const now = Date.now();
  if (cohort.applicationOpensAt && cohort.applicationOpensAt.getTime() > now) {
    return false;
  }
  if (cohort.applicationClosesAt && cohort.applicationClosesAt.getTime() < now) {
    return false;
  }
  return true;
}
