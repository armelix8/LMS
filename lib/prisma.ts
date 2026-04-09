import { PrismaClient } from "@prisma/client";

/**
 * Reuse one client per Node.js isolate (critical in `next dev` + Turbopack).
 * Without this, hot reload can create many PrismaClient instances and exhaust
 * PostgreSQL `max_connections` (especially on shared / small remote DBs).
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function prismaClientOptions(): ConstructorParameters<typeof PrismaClient>[0] {
  const base = process.env.DATABASE_URL;
  const log: ("error" | "warn")[] = ["error"];
  if (process.env.NODE_ENV === "development") log.push("warn");

  /** Small shared Postgres plans: cap pool unless URL or PRISMA_CONNECTION_LIMIT overrides. */
  const limit =
    process.env.PRISMA_CONNECTION_LIMIT?.trim() ||
    (process.env.NODE_ENV === "development" &&
    base &&
    !base.includes("connection_limit=")
      ? "2"
      : "");

  if (limit && base && !base.includes("connection_limit=")) {
    const join = base.includes("?") ? "&" : "?";
    return {
      log,
      datasources: {
        db: {
          url: `${base}${join}connection_limit=${encodeURIComponent(limit)}`,
        },
      },
    };
  }

  return { log };
}

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient(prismaClientOptions());

globalForPrisma.prisma = prisma;
