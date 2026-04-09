/** True when the booking start is strictly before the current instant (server clock). */
export function bookingStartIsInThePast(start: Date): boolean {
  return start.getTime() < Date.now();
}
