-- Improve calendar listing, overlap checks, and bounded time-range scans.
CREATE INDEX "LabBooking_startTime_idx" ON "LabBooking" ("startTime");
CREATE INDEX "LabBooking_labId_status_startTime_idx" ON "LabBooking" ("labId", "status", "startTime");
CREATE INDEX "EquipmentBooking_startTime_idx" ON "EquipmentBooking" ("startTime");
CREATE INDEX "EquipmentBooking_equipmentId_status_startTime_idx" ON "EquipmentBooking" ("equipmentId", "status", "startTime");
