/**
 * Limits how much booking history/future the calendar loads. Keeps queries
 * bounded as the `LabBooking` / `EquipmentBooking` tables grow.
 * Adjust the year offsets if you need a wider visible range.
 */
export function bookingCalendarTimeRangeWhere(): {
  startTime: { lt: Date };
  endTime: { gt: Date };
} {
  const windowStart = new Date();
  windowStart.setFullYear(windowStart.getFullYear() - 1);
  const windowEnd = new Date();
  windowEnd.setFullYear(windowEnd.getFullYear() + 2);
  return {
    startTime: { lt: windowEnd },
    endTime: { gt: windowStart },
  };
}
