import type { Role } from "@prisma/client";

export function canManageLabs(role: Role | null | undefined): boolean {
  return role === "ADMIN";
}

export function canManageEquipment(role: Role | null | undefined): boolean {
  return role === "ADMIN" || role === "LAB_TECHNICIAN";
}

export function canManageBookings(role: Role | null | undefined): boolean {
  return role === "ADMIN" || role === "INSTRUCTOR";
}

export function canBookFacility(role: Role | null | undefined): boolean {
  return (
    role === "ADMIN" ||
    role === "INSTRUCTOR" ||
    role === "LAB_TECHNICIAN" ||
    role === "STUDENT"
  );
}

export function canManageMaintenance(role: Role | null | undefined): boolean {
  return role === "ADMIN" || role === "LAB_TECHNICIAN";
}
