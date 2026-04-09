import type {
  BookingStatus,
  EquipmentStatus,
  FacilityAvailabilityStatus,
  LabStatus,
  LabType,
  MaintenanceStatus,
} from "@prisma/client";

export function formatLabType(t: LabType): string {
  switch (t) {
    case "THREE_D_PRINTING":
      return "3D Printing";
    case "WOODWORKING":
      return "Woodworking";
    case "ELECTRONICS":
      return "Electronics";
    case "CNC":
      return "CNC";
    case "LASER":
      return "Laser";
    default:
      return "General";
  }
}

export function formatLabStatus(status: LabStatus): string {
  switch (status) {
    case "ACTIVE":
      return "Active";
    case "MAINTENANCE":
      return "Maintenance";
    default:
      return "Closed";
  }
}

export function formatEquipmentStatus(status: EquipmentStatus): string {
  switch (status) {
    case "AVAILABLE":
      return "Available";
    case "IN_USE":
      return "In use";
    case "MAINTENANCE":
      return "Maintenance";
    default:
      return "Broken";
  }
}

export function formatFacilityAvailability(
  status: FacilityAvailabilityStatus,
): string {
  switch (status) {
    case "AVAILABLE":
      return "Available";
    case "UNAVAILABLE":
      return "Unavailable";
    default:
      return "Maintenance";
  }
}

export function formatBookingStatus(status: BookingStatus): string {
  switch (status) {
    case "PENDING":
      return "Pending";
    case "APPROVED":
      return "Approved";
    case "REJECTED":
      return "Rejected";
    case "COMPLETED":
      return "Completed";
    default:
      return "Cancelled";
  }
}

export function formatMaintenanceStatus(status: MaintenanceStatus): string {
  switch (status) {
    case "REPORTED":
      return "Reported";
    case "IN_PROGRESS":
      return "In progress";
    default:
      return "Resolved";
  }
}

export function statusBadgeClass(
  status:
    | LabStatus
    | EquipmentStatus
    | FacilityAvailabilityStatus
    | BookingStatus
    | MaintenanceStatus,
): string {
  if (
    status === "ACTIVE" ||
    status === "AVAILABLE" ||
    status === "APPROVED" ||
    status === "COMPLETED" ||
    status === "RESOLVED"
  ) {
    return "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200";
  }
  if (
    status === "PENDING" ||
    status === "IN_PROGRESS" ||
    status === "MAINTENANCE" ||
    status === "IN_USE"
  ) {
    return "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200";
  }
  return "bg-rose-100 text-rose-900 dark:bg-rose-950/60 dark:text-rose-200";
}
