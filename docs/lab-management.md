# Lab Management Module

This module introduces laboratory and facilities management with role-based access.

## Scope

- Lab space management (`Lab`)
- Equipment inventory (`Equipment`)
- Facility resources (`Facility`)
- Reservation workflow (`LabBooking` and `EquipmentBooking`)
- Maintenance tracking (`MaintenanceLog`)

## Roles and Permissions

- `ADMIN`: full control over labs, equipment, bookings, maintenance
- `INSTRUCTOR`: create/view bookings and approve/reject reservations
- `LAB_TECHNICIAN`: manage equipment and maintenance operations
- `STUDENT`: create bookings and report maintenance issues

## Database

Added entities and enums in `prisma/schema.prisma`:

- Enums: `LabType`, `LabStatus`, `EquipmentStatus`, `FacilityAvailabilityStatus`, `BookingStatus`, `MaintenanceStatus`
- Models: `Lab`, `Equipment`, `Facility`, `LabBooking`, `EquipmentBooking`, `MaintenanceLog`
- Role enum now includes `LAB_TECHNICIAN`

Migration:

- `prisma/migrations/20260409143000_lab_management/migration.sql`

## API Endpoints

- `GET /api/labs`
- `POST /api/labs`
- `GET /api/labs/:id`
- `PATCH /api/labs/:id`
- `GET /api/equipment`
- `POST /api/equipment`
- `PATCH /api/equipment/:id`
- `GET /api/facilities`
- `POST /api/facilities`
- `GET /api/bookings`
- `POST /api/bookings`
- `PATCH /api/bookings/:id/approve`
- `GET /api/maintenance`
- `POST /api/maintenance`
- `PATCH /api/maintenance`

## Frontend Pages

- `GET /labs` - Labs dashboard (admin actions configured separately)
- `GET /labs/equipment` - Equipment list + create equipment (admin/technician)
- `GET /labs/bookings` - Booking calendar + reservation actions
- `GET /labs/maintenance` - Maintenance panel + issue reporting/resolution

## Notes

- Booking conflict checks prevent overlapping pending/approved reservations.
- Reporting maintenance sets equipment status to `MAINTENANCE`.
- Resolving maintenance sets equipment status back to `AVAILABLE`.
