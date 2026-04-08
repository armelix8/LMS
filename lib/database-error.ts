/** True when Prisma could not connect to the database (offline host, VPN, firewall, dropped connection). */
export function isDatabaseUnavailableError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { name?: string; message?: string; code?: string };
  if (e.name === "PrismaClientInitializationError") return true;
  // P1001 = can't reach server; P1017 = server closed connection
  if (
    e.name === "PrismaClientKnownRequestError" &&
    (e.code === "P1001" || e.code === "P1017")
  ) {
    return true;
  }
  if (
    typeof e.message === "string" &&
    (e.message.includes("Can't reach database server") ||
      e.message.includes("Server has closed the connection") ||
      e.message.includes("P1001") ||
      e.message.includes("P1017") ||
      e.message.includes("PrismaClientInitializationError"))
  ) {
    return true;
  }
  return false;
}
