"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  deletePublicUploadFile,
  getFormImageFile,
  saveEquipmentFeaturedUpload,
  saveLabFeaturedUpload,
  validateEquipmentFeaturedImage,
  validateLabFeaturedImage,
} from "@/lib/image-upload";
import {
  canBookFacility,
  canManageBookings,
  canManageEquipment,
  canManageLabs,
  canManageMaintenance,
} from "@/lib/lab-permissions";
import { prisma } from "@/lib/prisma";

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");
  return session.user;
}

export async function createLabAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  if (!canManageLabs(user.role)) redirect("/dashboard");

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const featuredImageUrl =
    String(formData.get("featuredImageUrl") ?? "").trim() || null;
  const featuredImageFile = getFormImageFile(formData, "featuredImageFile");
  const location = String(formData.get("location") ?? "").trim();
  const capacity = Math.max(1, Math.round(Number(formData.get("capacity")) || 1));
  const labType = String(formData.get("labType") ?? "GENERAL");
  const status = String(formData.get("status") ?? "ACTIVE");

  if (!name || !location) return;

  const lab = await prisma.lab.create({
    data: {
      name,
      description,
      featuredImageUrl,
      location,
      capacity,
      labType:
        labType === "ELECTRONICS" ||
        labType === "WOODWORKING" ||
        labType === "THREE_D_PRINTING" ||
        labType === "CNC" ||
        labType === "LASER"
          ? labType
          : "GENERAL",
      status:
        status === "MAINTENANCE" || status === "CLOSED" ? status : "ACTIVE",
    },
  });

  if (featuredImageFile) {
    const validation = validateLabFeaturedImage(featuredImageFile);
    if (validation.ok) {
      const { url } = await saveLabFeaturedUpload(lab.id, featuredImageFile);
      await prisma.lab.update({
        where: { id: lab.id },
        data: { featuredImageUrl: url },
      });
    }
  }

  revalidatePath("/labs");
}

export async function updateLabAction(
  labId: string,
  formData: FormData,
): Promise<void> {
  const user = await requireUser();
  if (!canManageLabs(user.role)) redirect("/dashboard");

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const featuredImageUrl =
    String(formData.get("featuredImageUrl") ?? "").trim() || null;
  const featuredImageFile = getFormImageFile(formData, "featuredImageFile");
  const location = String(formData.get("location") ?? "").trim();
  const capacity = Math.max(1, Math.round(Number(formData.get("capacity")) || 1));
  const labType = String(formData.get("labType") ?? "GENERAL");
  const status = String(formData.get("status") ?? "ACTIVE");

  if (!name || !location) return;

  const current = await prisma.lab.findUnique({
    where: { id: labId },
    select: { featuredImageUrl: true },
  });
  if (!current) return;

  let nextFeaturedImageUrl = current.featuredImageUrl;
  if (featuredImageFile) {
    const validation = validateLabFeaturedImage(featuredImageFile);
    if (!validation.ok) return;
    await deletePublicUploadFile(current.featuredImageUrl);
    nextFeaturedImageUrl = (
      await saveLabFeaturedUpload(labId, featuredImageFile)
    ).url;
  } else if (featuredImageUrl) {
    if (
      current.featuredImageUrl &&
      current.featuredImageUrl.startsWith("/uploads/labs/") &&
      current.featuredImageUrl !== featuredImageUrl
    ) {
      await deletePublicUploadFile(current.featuredImageUrl);
    }
    nextFeaturedImageUrl = featuredImageUrl;
  } else {
    nextFeaturedImageUrl = null;
    if (current.featuredImageUrl?.startsWith("/uploads/labs/")) {
      await deletePublicUploadFile(current.featuredImageUrl);
    }
  }

  await prisma.lab.update({
    where: { id: labId },
    data: {
      name,
      description,
      featuredImageUrl: nextFeaturedImageUrl,
      location,
      capacity,
      labType:
        labType === "ELECTRONICS" ||
        labType === "WOODWORKING" ||
        labType === "THREE_D_PRINTING" ||
        labType === "CNC" ||
        labType === "LASER"
          ? labType
          : "GENERAL",
      status:
        status === "MAINTENANCE" || status === "CLOSED" ? status : "ACTIVE",
    },
  });

  revalidatePath("/labs");
  revalidatePath(`/labs/${labId}/edit`);
  redirect("/labs");
}

export async function createEquipmentAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  if (!canManageEquipment(user.role)) redirect("/dashboard");

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const featuredImageUrl =
    String(formData.get("featuredImageUrl") ?? "").trim() || null;
  const featuredImageFile = getFormImageFile(formData, "featuredImageFile");
  const labId = String(formData.get("labId") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const brand = String(formData.get("brand") ?? "").trim() || null;
  const model = String(formData.get("model") ?? "").trim() || null;
  const serialNumber = String(formData.get("serialNumber") ?? "").trim() || null;
  const condition = String(formData.get("condition") ?? "").trim() || null;
  const status = String(formData.get("status") ?? "AVAILABLE");

  if (!name || !labId || !category) return;

  const equipment = await prisma.equipment.create({
    data: {
      name,
      description,
      featuredImageUrl,
      labId,
      category,
      brand,
      model,
      serialNumber,
      condition,
      status:
        status === "IN_USE" ||
        status === "MAINTENANCE" ||
        status === "BROKEN"
          ? status
          : "AVAILABLE",
    },
  });

  if (featuredImageFile) {
    const validation = validateEquipmentFeaturedImage(featuredImageFile);
    if (validation.ok) {
      const { url } = await saveEquipmentFeaturedUpload(
        equipment.id,
        featuredImageFile,
      );
      await prisma.equipment.update({
        where: { id: equipment.id },
        data: { featuredImageUrl: url },
      });
    }
  }
  revalidatePath("/labs/equipment");
  revalidatePath("/labs");
}

export async function updateEquipmentAction(
  equipmentId: string,
  formData: FormData,
): Promise<void> {
  const user = await requireUser();
  if (!canManageEquipment(user.role)) redirect("/dashboard");

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const featuredImageUrl =
    String(formData.get("featuredImageUrl") ?? "").trim() || null;
  const featuredImageFile = getFormImageFile(formData, "featuredImageFile");
  const labId = String(formData.get("labId") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const brand = String(formData.get("brand") ?? "").trim() || null;
  const model = String(formData.get("model") ?? "").trim() || null;
  const serialNumber = String(formData.get("serialNumber") ?? "").trim() || null;
  const condition = String(formData.get("condition") ?? "").trim() || null;
  const status = String(formData.get("status") ?? "AVAILABLE");

  if (!name || !labId || !category) return;

  const current = await prisma.equipment.findUnique({
    where: { id: equipmentId },
    select: { featuredImageUrl: true },
  });
  if (!current) return;

  let nextFeaturedImageUrl = current.featuredImageUrl;
  if (featuredImageFile) {
    const validation = validateEquipmentFeaturedImage(featuredImageFile);
    if (!validation.ok) return;
    await deletePublicUploadFile(current.featuredImageUrl);
    nextFeaturedImageUrl = (
      await saveEquipmentFeaturedUpload(equipmentId, featuredImageFile)
    ).url;
  } else if (featuredImageUrl) {
    if (
      current.featuredImageUrl &&
      current.featuredImageUrl.startsWith("/uploads/equipment/") &&
      current.featuredImageUrl !== featuredImageUrl
    ) {
      await deletePublicUploadFile(current.featuredImageUrl);
    }
    nextFeaturedImageUrl = featuredImageUrl;
  } else {
    nextFeaturedImageUrl = null;
    if (current.featuredImageUrl?.startsWith("/uploads/equipment/")) {
      await deletePublicUploadFile(current.featuredImageUrl);
    }
  }

  await prisma.equipment.update({
    where: { id: equipmentId },
    data: {
      name,
      description,
      featuredImageUrl: nextFeaturedImageUrl,
      labId,
      category,
      brand,
      model,
      serialNumber,
      condition,
      status:
        status === "IN_USE" ||
        status === "MAINTENANCE" ||
        status === "BROKEN"
          ? status
          : "AVAILABLE",
    },
  });

  revalidatePath("/labs/equipment");
  revalidatePath(`/labs/equipment/${equipmentId}/edit`);
  revalidatePath("/labs");
  redirect("/labs/equipment");
}

export async function createFacilityAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  if (!canManageLabs(user.role)) redirect("/dashboard");

  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "").trim();
  const labId = String(formData.get("labId") ?? "").trim();
  const usageRules = String(formData.get("usageRules") ?? "").trim() || null;
  const availabilityStatus = String(
    formData.get("availabilityStatus") ?? "AVAILABLE",
  );

  if (!name || !type || !labId) return;

  await prisma.facility.create({
    data: {
      name,
      type,
      labId,
      usageRules,
      availabilityStatus:
        availabilityStatus === "UNAVAILABLE" ||
        availabilityStatus === "MAINTENANCE"
          ? availabilityStatus
          : "AVAILABLE",
    },
  });
  revalidatePath("/labs");
  revalidatePath("/labs/bookings");
}

export async function createBookingAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  if (!canBookFacility(user.role)) redirect("/dashboard");

  const labId = String(formData.get("labId") ?? "").trim();
  const startTimeRaw = String(formData.get("startTime") ?? "").trim();
  const endTimeRaw = String(formData.get("endTime") ?? "").trim();
  if (!labId || !startTimeRaw || !endTimeRaw) return;

  const startTime = new Date(startTimeRaw);
  const endTime = new Date(endTimeRaw);
  if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) return;
  if (endTime <= startTime) return;

  const lab = await prisma.lab.findUnique({
    where: { id: labId },
    select: { id: true },
  });
  if (!lab) return;

  const overlap = await prisma.labBooking.findFirst({
    where: {
      labId,
      status: { in: ["PENDING", "APPROVED"] },
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
  });
  if (overlap) return;

  await prisma.labBooking.create({
    data: {
      userId: user.id,
      labId,
      startTime,
      endTime,
      status: "PENDING",
    },
  });
  revalidatePath("/labs/bookings");
}

export async function createEquipmentBookingAction(
  equipmentId: string,
  formData: FormData,
): Promise<void> {
  const user = await requireUser();
  if (!canBookFacility(user.role)) redirect("/dashboard");
  if (!equipmentId) return;

  const startTimeRaw = String(formData.get("startTime") ?? "").trim();
  const endTimeRaw = String(formData.get("endTime") ?? "").trim();
  if (!startTimeRaw || !endTimeRaw) return;

  const startTime = new Date(startTimeRaw);
  const endTime = new Date(endTimeRaw);
  if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) return;
  if (endTime <= startTime) return;

  const equipment = await prisma.equipment.findUnique({
    where: { id: equipmentId },
    select: { id: true, status: true },
  });
  if (!equipment) return;
  if (equipment.status === "BROKEN") return;

  const overlap = await prisma.equipmentBooking.findFirst({
    where: {
      equipmentId,
      status: { in: ["PENDING", "APPROVED"] },
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
  });
  if (overlap) return;

  await prisma.equipmentBooking.create({
    data: {
      userId: user.id,
      equipmentId,
      startTime,
      endTime,
      status: "PENDING",
    },
  });
  revalidatePath(`/labs/equipment/${equipmentId}`);
  revalidatePath("/labs/bookings");
}

export async function updateBookingStatusAction(
  bookingId: string,
  decision: "approve" | "reject" | "complete" | "cancel",
): Promise<void> {
  const user = await requireUser();
  const booking = await prisma.labBooking.findUnique({
    where: { id: bookingId },
    select: { userId: true },
  });
  if (!booking) return;

  const manager = canManageBookings(user.role);
  const ownCancellation =
    decision === "cancel" && booking.userId === user.id;
  if (!manager && !ownCancellation) redirect("/dashboard");

  const status =
    decision === "approve"
      ? "APPROVED"
      : decision === "reject"
        ? "REJECTED"
        : decision === "complete"
          ? "COMPLETED"
          : "CANCELLED";

  await prisma.labBooking.update({
    where: { id: bookingId },
    data: { status },
  });

  revalidatePath("/labs/bookings");
}

export async function updateEquipmentBookingStatusAction(
  bookingId: string,
  decision: "approve" | "reject" | "complete" | "cancel",
): Promise<void> {
  const user = await requireUser();
  const booking = await prisma.equipmentBooking.findUnique({
    where: { id: bookingId },
    select: { userId: true, equipmentId: true },
  });
  if (!booking) return;

  const manager = canManageBookings(user.role);
  const ownCancellation = decision === "cancel" && booking.userId === user.id;
  if (!manager && !ownCancellation) redirect("/dashboard");

  const status =
    decision === "approve"
      ? "APPROVED"
      : decision === "reject"
        ? "REJECTED"
        : decision === "complete"
          ? "COMPLETED"
          : "CANCELLED";

  await prisma.equipmentBooking.update({
    where: { id: bookingId },
    data: { status },
  });

  revalidatePath("/labs/bookings");
  revalidatePath(`/labs/equipment/${booking.equipmentId}`);
}

export async function reportMaintenanceAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  if (!canBookFacility(user.role)) redirect("/dashboard");

  const equipmentId = String(formData.get("equipmentId") ?? "").trim();
  const issueDescription = String(formData.get("issueDescription") ?? "").trim();
  if (!equipmentId || !issueDescription) return;

  await prisma.$transaction(async (tx) => {
    await tx.maintenanceLog.create({
      data: {
        equipmentId,
        reportedById: user.id,
        issueDescription,
        maintenanceStatus: "REPORTED",
      },
    });
    await tx.equipment.update({
      where: { id: equipmentId },
      data: { status: "MAINTENANCE" },
    });
  });

  revalidatePath("/labs/maintenance");
  revalidatePath("/labs/equipment");
}

export async function updateMaintenanceStatusAction(
  maintenanceId: string,
  maintenanceStatus: "REPORTED" | "IN_PROGRESS" | "RESOLVED",
): Promise<void> {
  const user = await requireUser();
  if (!canManageMaintenance(user.role)) redirect("/dashboard");

  const updated = await prisma.maintenanceLog.update({
    where: { id: maintenanceId },
    data: {
      maintenanceStatus,
      resolvedAt: maintenanceStatus === "RESOLVED" ? new Date() : null,
    },
  });

  if (maintenanceStatus === "RESOLVED") {
    await prisma.equipment.update({
      where: { id: updated.equipmentId },
      data: { status: "AVAILABLE" },
    });
  }

  revalidatePath("/labs/maintenance");
  revalidatePath("/labs/equipment");
}
